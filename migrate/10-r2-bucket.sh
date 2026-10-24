#!/usr/bin/env bash
# Cloudflare R2: creates the bucket, makes it publicly readable (custom domain or r2.dev), sets CORS, and checks
# the R2 keys can write to it. Safe to re-run.
#   ./migrate/10-r2-bucket.sh dev
. "$(dirname "$0")/lib.sh"
load_env "${1:-}"
require CF_ACCOUNT_ID CF_API_TOKEN R2_BUCKET R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY WEB_ORIGINS
acct="/accounts/$CF_ACCOUNT_ID/r2/buckets"

step "Bucket $R2_BUCKET"
if cf_api GET "$acct/$R2_BUCKET" >/dev/null 2>&1; then
  ok "exists"
else
  cf_api POST "$acct" "{\"name\":\"$R2_BUCKET\",\"locationHint\":\"weur\"}" >/dev/null
  ok "created (location: Western Europe)"
fi

step "Public address"
if [ -n "${R2_CUSTOM_DOMAIN:-}" ]; then
  require CF_ZONE_ID
  if cf_api GET "$acct/$R2_BUCKET/domains/custom/$R2_CUSTOM_DOMAIN" >/dev/null 2>&1; then
    ok "custom domain $R2_CUSTOM_DOMAIN already connected"
  else
    cf_api POST "$acct/$R2_BUCKET/domains/custom" \
      "{\"domain\":\"$R2_CUSTOM_DOMAIN\",\"zoneId\":\"$CF_ZONE_ID\",\"enabled\":true,\"minTLS\":\"1.2\"}" >/dev/null
    ok "custom domain $R2_CUSTOM_DOMAIN connected (certificate can take a few minutes)"
  fi
  public_url="https://$R2_CUSTOM_DOMAIN"
else
  domain="$(cf_api PUT "$acct/$R2_BUCKET/domains/managed" '{"enabled":true}' | json_get result.domain)"
  [ -n "$domain" ] || die "Cloudflare did not return the r2.dev domain"
  public_url="https://$domain"
  warn "using $public_url (r2.dev is rate-limited; set R2_CUSTOM_DOMAIN for anything beyond dev)"
fi
save_state R2_PUBLIC_URL "$public_url"
ok "files will be served from $R2_PUBLIC_URL"

step "CORS (browser reads + direct uploads from: $WEB_ORIGINS)"
origins_json="$(node -e 'console.log(JSON.stringify(process.argv[1].split(",").map(s=>s.trim()).filter(Boolean)))' "$WEB_ORIGINS")"
cors_file="$(mktemp)"
cat > "$cors_file" <<JSON
{"CORSRules":[{"AllowedOrigins":$origins_json,"AllowedMethods":["GET","HEAD","PUT"],"AllowedHeaders":["*"],"ExposeHeaders":["ETag"],"MaxAgeSeconds":3600}]}
JSON
r2_s3 s3api put-bucket-cors --bucket "$R2_BUCKET" --cors-configuration "file://$cors_file"
rm -f "$cors_file"
ok "CORS set"

step "R2 keys can write"
probe="migrate-check/$(date +%s).txt"
printf 'forum500 %s check\n' "$ENV_NAME" > "$OUT_DIR/probe.txt"
r2_s3 s3api put-object --bucket "$R2_BUCKET" --key "$probe" --body "$OUT_DIR/probe.txt" --content-type text/plain >/dev/null
sleep 2
code="$(curl -s -o /dev/null -w '%{http_code}' "$R2_PUBLIC_URL/$probe")"
r2_s3 s3api delete-object --bucket "$R2_BUCKET" --key "$probe" >/dev/null
rm -f "$OUT_DIR/probe.txt"
[ "$code" = 200 ] && ok "write + public read OK" || warn "write OK, public read returned $code (a new custom domain can take a few minutes)"
