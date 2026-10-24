#!/usr/bin/env bash
# Checks everything the migration needs before anything is created or changed. Read-only.
#   ./migrate/00-check.sh dev
. "$(dirname "$0")/lib.sh"
load_env "${1:-}"

step "Tools"
for t in aws docker node psql pg_dump pg_restore curl openssl; do
  command -v "$t" >/dev/null || die "$t is not installed"
done
pg_major="$(pg_dump --version | sed -E 's/[^0-9]*([0-9]+).*/\1/')"
[ "$pg_major" -ge 16 ] || die "pg_dump $pg_major is too old (need 16+): brew install postgresql@17"
docker info >/dev/null 2>&1 || die "Docker is not running"
docker buildx version >/dev/null 2>&1 || die "docker buildx is missing"
ok "aws, docker (buildx), node, pg_dump $pg_major, curl"

step "Settings in env/$ENV_NAME.env"
require AWS_REGION CF_ACCOUNT_ID CF_API_TOKEN R2_BUCKET R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY \
  DB_NAME DB_USER DB_PASSWORD DB_INSTANCE_CLASS JWT_SECRET WEB_ORIGINS MAIL_DRIVER THINGS_DIR WP_DB_URL LOCAL_PG_URL
[ "${#JWT_SECRET}" -ge 32 ] || die "JWT_SECRET must be 32+ characters"
[ "${#DB_PASSWORD}" -ge 16 ] || die "DB_PASSWORD should be 16+ characters"
case "$DB_PASSWORD" in *[!A-Za-z0-9]*) die "DB_PASSWORD: use letters and digits only (RDS refuses / @ \" and spaces)" ;; esac
[ -z "${ORIGIN_SECRET:-}" ] || [ "${#ORIGIN_SECRET}" -ge 16 ] || die "ORIGIN_SECRET must be 16+ characters"
case "$LOCAL_PG_URL" in *CHANGE_ME*) die "LOCAL_PG_URL still has CHANGE_ME" ;; esac
ok "all set"

step "AWS login"
who="$(aws sts get-caller-identity --query Arn --output text 2>&1)" || die "AWS CLI not logged in (profile ${AWS_PROFILE:-default}): $who"
ok "$who (region $AWS_REGION)"

step "Cloudflare API token"
if cf_api GET "/accounts/$CF_ACCOUNT_ID/tokens/verify" >/dev/null 2>&1 || cf_api GET "/user/tokens/verify" >/dev/null 2>&1; then
  ok "token is valid"
else
  die "CF_API_TOKEN is not valid"
fi
cf_api GET "/accounts/$CF_ACCOUNT_ID/r2/buckets" >/dev/null 2>&1 || die "token can't list R2 buckets (needs Account · Workers R2 Storage · Edit; R2 must be enabled once in the dashboard)"
ok "token can manage R2"

step "Local data sources"
docker ps --format '{{.Names}}' | grep -qx wp-dump-mysql || die "wp-dump-mysql is not running: docker start wp-dump-mysql"
docker ps --format '{{.Names}}' | grep -qx forum500-postgres || die "forum500-postgres is not running: docker start forum500-postgres"
docker exec wp-dump-mysql mysql -uroot -plocalonly -N -e "SELECT COUNT(*) FROM wp.cnj_users" >/dev/null 2>&1 || die "WordPress database 'wp' not readable in wp-dump-mysql"
psql "$(local_db_url postgres)" -tAc 'select 1' >/dev/null || die "can't connect to local Postgres with LOCAL_PG_URL"
for d in "$THINGS_DIR/Uploads/uploads.zip" "$THINGS_DIR/Content" "$THINGS_DIR/Wordpress"; do
  [ -d "$d" ] || die "missing folder $d"
done
ok "WordPress MySQL, local Postgres, Things/Uploads, Things/Content, Things/Wordpress"

step "Saved outputs (out/$ENV_NAME.state)"
if [ -f "$STATE_FILE" ]; then sed 's/^/    /' "$STATE_FILE"; else echo "    none yet (first run)"; fi
ok "ready"
