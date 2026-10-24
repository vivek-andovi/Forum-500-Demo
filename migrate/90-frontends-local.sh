#!/usr/bin/env bash
# Runs the member app (:3002) and the admin app (:3001) on your Mac against this environment's cloud API.
# Nothing is written to the apps' .env files.
#   ./migrate/90-frontends-local.sh dev            (starts both; Ctrl+C stops them)
#   ./migrate/90-frontends-local.sh dev --print    (only prints the commands)
. "$(dirname "$0")/lib.sh"
load_env "${1:-}"
require API_URL
web="NEXT_PUBLIC_API_URL=$API_URL/api npm --prefix $REPO_DIR/frontends/web run dev"
admin="NEXT_PUBLIC_API_URL=$API_URL/api npm --prefix $REPO_DIR/frontends/admin run dev"
[ -n "${ORIGIN_SECRET:-}" ] && warn "ORIGIN_SECRET is set: use the Cloudflare address as API_PUBLIC_URL, the raw API Gateway URL will refuse browsers"

if [ "${2:-}" = "--print" ]; then
  step "Frontends against the $ENV_NAME API"
  echo "    $web"
  echo "    $admin"
  echo "  or: ./migrate/90-frontends-local.sh $ENV_NAME"
  exit 0
fi
step "Starting web (http://localhost:3002) and admin (http://localhost:3001) against $API_URL/api"
trap 'kill 0' EXIT
sh -c "$web" &
sh -c "$admin" &
wait
