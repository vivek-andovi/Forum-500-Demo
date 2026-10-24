#!/usr/bin/env bash
# Builds the API's Lambda image (arm64), pushes it to ECR, creates or updates the two Lambda functions
# (forum500-<env>-api and forum500-<env>-migrate), creates the API Gateway HTTP API in front of the API function,
# and runs the database migrations. Safe to re-run; run it again for every API deploy.
#   ./migrate/30-deploy-api.sh dev
. "$(dirname "$0")/lib.sh"
load_env "${1:-}"
require AWS_REGION ECR_REPO_URI LAMBDA_ROLE_ARN DB_ENDPOINT JWT_SECRET WEB_ORIGINS R2_BUCKET R2_ACCESS_KEY_ID \
  R2_SECRET_ACCESS_KEY R2_PUBLIC_URL CF_ACCOUNT_ID MAIL_DRIVER

api_fn="$(name api)"; migrate_fn="$(name migrate)"
tag="$(git -C "$REPO_DIR" rev-parse --short HEAD)$(git -C "$REPO_DIR" diff --quiet || echo -dirty)-$(date +%Y%m%d%H%M%S)"
image="$ECR_REPO_URI:$tag"

step "Build the Lambda image ($tag)"
aws ecr get-login-password | docker login --username AWS --password-stdin "${ECR_REPO_URI%%/*}" >/dev/null
docker buildx build --platform linux/arm64 --target lambda --provenance=false -t "$image" --push "$BACKEND_DIR"
ok "pushed $image"

# Environment for both functions. Written as JSON by node so every value is escaped properly.
web_url="$(printf '%s' "$WEB_ORIGINS" | cut -d, -f1)"
admin_url="$(printf '%s' "$WEB_ORIGINS" | cut -d, -f2)"
env_json() {
  node -e '
    const [kind] = process.argv.slice(1);
    const e = process.env;
    const v = { NODE_ENV: "production", DATABASE_URL: kind === "api" ? e.DB_URL_API : e.DB_URL_MIGRATE };
    if (kind === "api") Object.assign(v, {
      JWT_SECRET: e.JWT_SECRET, TRUST_PROXY: "true", CORS_ORIGINS: e.WEB_ORIGINS,
      WEB_APP_URL: e.WEB_URL, ADMIN_APP_URL: e.ADMIN_URL || e.WEB_URL, PUBLIC_API_URL: e.API_URL || "https://example.invalid",
      STORAGE_DRIVER: "s3", S3_BUCKET: e.R2_BUCKET, S3_ENDPOINT: e.R2_ENDPOINT, S3_REGION: "auto", S3_FORCE_PATH_STYLE: "true",
      S3_ACCESS_KEY_ID: e.R2_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY: e.R2_SECRET_ACCESS_KEY, ASSET_PUBLIC_BASE_URL: e.R2_PUBLIC_URL,
      MAIL_DRIVER: e.MAIL_DRIVER, UPLOAD_MAX_MB: "4",
      ...(e.MAIL_FROM && { MAIL_FROM: e.MAIL_FROM }), ...(e.ORIGIN_SECRET && { ORIGIN_SECRET: e.ORIGIN_SECRET }),
    });
    console.log(JSON.stringify({ Variables: v }));' "$1"
}
export DB_URL_API="$(remote_db_url '&connection_limit=1&pool_timeout=20')" DB_URL_MIGRATE="$(remote_db_url)"
export WEB_URL="$web_url" ADMIN_URL="$admin_url" R2_ENDPOINT="$(r2_endpoint)" API_URL="${API_URL:-}"

wait_fn() { aws lambda wait function-updated-v2 --function-name "$1" 2>/dev/null || aws lambda wait function-updated --function-name "$1"; }

# create_or_update <function> <kind> <timeout> <handler-or-empty>
create_or_update() {
  local fn="$1" kind="$2" timeout="$3" handler="$4" envfile
  envfile="$(mktemp)"; env_json "$kind" > "$envfile"
  if aws lambda get-function --function-name "$fn" >/dev/null 2>&1; then
    aws lambda update-function-code --function-name "$fn" --image-uri "$image" >/dev/null
    wait_fn "$fn"
    aws lambda update-function-configuration --function-name "$fn" --timeout "$timeout" \
      --memory-size "${LAMBDA_MEMORY_MB:-1024}" --environment "file://$envfile" \
      ${handler:+--image-config "{\"Command\":[\"$handler\"]}"} >/dev/null
    wait_fn "$fn"
    ok "updated $fn"
  else
    local tries=0
    until aws lambda create-function --function-name "$fn" --package-type Image --code "ImageUri=$image" \
        --architectures arm64 --role "$LAMBDA_ROLE_ARN" --timeout "$timeout" --memory-size "${LAMBDA_MEMORY_MB:-1024}" \
        --environment "file://$envfile" ${handler:+--image-config "{\"Command\":[\"$handler\"]}"} \
        --tags "project=forum500,env=$ENV_NAME" >/dev/null 2>"$OUT_DIR/create.err"; do
      tries=$((tries + 1))
      # A brand-new IAM role can take a little while before Lambda may use it.
      grep -q "cannot be assumed" "$OUT_DIR/create.err" && [ "$tries" -lt 6 ] || { cat "$OUT_DIR/create.err" >&2; die "could not create $fn"; }
      sleep 10
    done
    aws lambda wait function-active-v2 --function-name "$fn" 2>/dev/null || aws lambda wait function-active --function-name "$fn"
    ok "created $fn"
  fi
  rm -f "$envfile"
}

step "Lambda functions"
create_or_update "$api_fn" api 29 ""
create_or_update "$migrate_fn" migrate 300 "dist/migrate.handler"
if [ -n "${LAMBDA_RESERVED_CONCURRENCY:-}" ]; then
  aws lambda put-function-concurrency --function-name "$api_fn" --reserved-concurrent-executions "$LAMBDA_RESERVED_CONCURRENCY" >/dev/null \
    && ok "API capped at $LAMBDA_RESERVED_CONCURRENCY simultaneous instances" \
    || warn "AWS refused the concurrency cap (common on new accounts with a 10 total limit); continuing without it"
fi

step "API Gateway (HTTP API) → $api_fn"
api_id="$(aws apigatewayv2 get-apis --query "Items[?Name=='$api_fn'].ApiId | [0]" --output text)"
fn_arn="$(aws lambda get-function --function-name "$api_fn" --query Configuration.FunctionArn --output text)"
if [ "$api_id" = "None" ] || [ -z "$api_id" ]; then
  # Quick create: one $default route proxying every path to the function, auto-deployed stage.
  api_id="$(aws apigatewayv2 create-api --name "$api_fn" --protocol-type HTTP --target "$fn_arn" \
    --tags "project=forum500,env=$ENV_NAME" --query ApiId --output text)"
  aws lambda add-permission --function-name "$api_fn" --statement-id apigw-invoke --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:$AWS_REGION:$AWS_ACCOUNT_ID:$api_id/*" >/dev/null
  ok "created $api_id"
else
  ok "exists: $api_id"
fi
endpoint="$(aws apigatewayv2 get-api --api-id "$api_id" --query ApiEndpoint --output text)"
save_state API_GATEWAY_ID "$api_id"
save_state API_GATEWAY_URL "$endpoint"
# The public address of the API: your Cloudflare custom domain once set up (API_PUBLIC_URL in the env file),
# otherwise the API Gateway address.
api_url="${API_PUBLIC_URL:-$endpoint}"
if [ "${API_URL:-}" != "$api_url" ]; then
  save_state API_URL "$api_url"
  export API_URL="$api_url"
  envfile="$(mktemp)"; env_json api > "$envfile"
  aws lambda update-function-configuration --function-name "$api_fn" --environment "file://$envfile" >/dev/null
  rm -f "$envfile"; wait_fn "$api_fn"
  ok "API knows its public address: $api_url"
fi

step "Database migrations ($migrate_fn)"
aws lambda invoke --function-name "$migrate_fn" --cli-read-timeout 310 "$OUT_DIR/migrate-result.json" >/dev/null
node -e 'const r=require(process.argv[1]); console.log(String(r.output||r.errorMessage||"").split("\n").map(l=>"    "+l).join("\n")); process.exit(r.ok?0:1)' "$OUT_DIR/migrate-result.json" \
  || die "migrations failed (see above, or CloudWatch logs of $migrate_fn)"
ok "database schema up to date"

step "Smoke test"
code="$(curl -s -o "$OUT_DIR/health.json" -w '%{http_code}' ${ORIGIN_SECRET:+-H "x-origin-secret: $ORIGIN_SECRET"} "$endpoint/api/health")"
[ "$code" = 200 ] && ok "$endpoint/api/health → $(cat "$OUT_DIR/health.json")" || die "health check returned $code: $(cat "$OUT_DIR/health.json")"
echo
echo "  API: $API_URL/api"
