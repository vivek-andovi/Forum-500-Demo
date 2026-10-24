# Shared helpers for the migrate/*.sh scripts. Sourced, not run.
# Works with macOS's bash 3.2 and needs no jq (JSON is read with node).

set -euo pipefail

MIGRATE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$MIGRATE_DIR/.." && pwd)"
BACKEND_DIR="$REPO_DIR/backends"
OUT_DIR="$MIGRATE_DIR/out"
mkdir -p "$OUT_DIR"

c_blue=$'\033[34m'; c_green=$'\033[32m'; c_yellow=$'\033[33m'; c_red=$'\033[31m'; c_off=$'\033[0m'
step() { printf '\n%s==> %s%s\n' "$c_blue" "$*" "$c_off"; }
ok()   { printf '%s  ✓ %s%s\n' "$c_green" "$*" "$c_off"; }
warn() { printf '%s  ! %s%s\n' "$c_yellow" "$*" "$c_off" >&2; }
die()  { printf '%s  ✗ %s%s\n' "$c_red" "$*" "$c_off" >&2; exit 1; }

# load_env <env-name>: reads migrate/env/<env>.env, then the outputs earlier scripts saved in out/<env>.state.
load_env() {
  ENV_NAME="${1:-}"
  [ -n "$ENV_NAME" ] || die "Usage: $0 <env>   (e.g. dev)"
  local file="$MIGRATE_DIR/env/$ENV_NAME.env"
  [ -f "$file" ] || die "Missing $file. Copy env/$ENV_NAME.env.example (or dev.env.example) to it and fill it in."
  set -a
  # shellcheck disable=SC1090
  . "$file"
  STATE_FILE="$OUT_DIR/$ENV_NAME.state"
  # shellcheck disable=SC1090
  [ -f "$STATE_FILE" ] && . "$STATE_FILE"
  set +a
  [ "${ENV_NAME_CHECK:-$ENV_NAME}" = "$ENV_NAME" ] || die "env file says ENV_NAME_CHECK=$ENV_NAME_CHECK but you asked for $ENV_NAME"
  export AWS_PAGER=""
  [ -n "${AWS_PROFILE:-}" ] && export AWS_PROFILE
  export AWS_REGION="${AWS_REGION:-eu-west-2}" AWS_DEFAULT_REGION="${AWS_REGION:-eu-west-2}"
}

# save_state KEY VALUE: remembers an output (endpoint, URL, ARN…) for later scripts in out/<env>.state.
save_state() {
  local key="$1" value="$2" tmp
  tmp="$(mktemp)"
  [ -f "$STATE_FILE" ] && grep -v "^$key=" "$STATE_FILE" > "$tmp" || true
  printf "%s='%s'\n" "$key" "$value" >> "$tmp"
  mv "$tmp" "$STATE_FILE"
  eval "$key='$value'"
  export "$key"
}

# require VAR...: stop if any variable is empty.
require() {
  local missing=""
  for v in "$@"; do [ -n "${!v:-}" ] || missing="$missing $v"; done
  [ -z "$missing" ] || die "Set these in env/$ENV_NAME.env:$missing"
}

# confirm "question": asks y/N unless ASSUME_YES=1.
confirm() {
  [ "${ASSUME_YES:-0}" = 1 ] && return 0
  local answer
  read -r -p "  $1 [y/N] " answer
  case "$answer" in y|Y|yes|YES) return 0 ;; *) die "Stopped." ;; esac
}

# json_get <path> : reads JSON on stdin and prints a field, e.g. json_get result.domain   (empty if missing)
json_get() {
  node -e '
    let d = ""; process.stdin.on("data", (c) => (d += c)).on("end", () => {
      let v; try { v = JSON.parse(d); } catch { process.exit(0); }
      for (const k of process.argv[1].split(".").filter(Boolean)) v = v == null ? undefined : v[k];
      if (v !== undefined && v !== null) console.log(typeof v === "object" ? JSON.stringify(v) : v);
    });' "$1"
}

# cf_api METHOD PATH [JSON]: Cloudflare API call; prints the response body, fails on "success": false.
cf_api() {
  local method="$1" path="$2" body="${3:-}" out
  out="$(curl -sS -X "$method" "https://api.cloudflare.com/client/v4$path" \
    -H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json" ${body:+--data "$body"})"
  if [ "$(printf '%s' "$out" | json_get success)" != "true" ]; then
    printf '%s\n' "$out" >&2
    return 1
  fi
  printf '%s' "$out"
}

# r2_s3 <aws s3api args…>: the AWS CLI pointed at this env's R2 bucket with the R2 keys (not your AWS login).
r2_s3() {
  # Unset (not empty) AWS_PROFILE: the CLI treats AWS_PROFILE="" as a profile named "" and fails.
  env -u AWS_PROFILE -u AWS_SESSION_TOKEN \
    AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
    aws --region auto --endpoint-url "https://$CF_ACCOUNT_ID.r2.cloudflarestorage.com" "$@"
}

r2_endpoint() { printf 'https://%s.r2.cloudflarestorage.com' "$CF_ACCOUNT_ID"; }

# Cloud database URL (RDS), with SSL. $1 = extra query params, e.g. "&connection_limit=1".
remote_db_url() {
  require DB_USER DB_PASSWORD DB_NAME DB_ENDPOINT
  printf 'postgresql://%s:%s@%s:5432/%s?sslmode=require%s' "$DB_USER" "$(urlencode "$DB_PASSWORD")" "$DB_ENDPOINT" "$DB_NAME" "${1:-}"
}

# Local build database (Docker forum500-postgres) where the import runs before it is shipped to the cloud.
local_build_db() { printf 'forum500_%s_build' "$ENV_NAME"; }
local_db_url() { printf '%s/%s?schema=public' "${LOCAL_PG_URL%/}" "${1:-$(local_build_db)}"; }

urlencode() { node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$1"; }

aws_account_id() { aws sts get-caller-identity --query Account --output text; }

# Every name in the cloud starts with forum500-<env>.
name() { printf 'forum500-%s%s' "$ENV_NAME" "${1:+-$1}"; }
