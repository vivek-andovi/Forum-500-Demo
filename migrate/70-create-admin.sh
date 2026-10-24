#!/usr/bin/env bash
# Creates (or resets) an admin login in this environment's cloud database.
#   ./migrate/70-create-admin.sh dev you@example.com          (asks for the password)
. "$(dirname "$0")/lib.sh"
load_env "${1:-}"
email="${2:-}"
[ -n "$email" ] || die "Usage: $0 <env> <email>"
require DB_ENDPOINT

if [ -z "${ADMIN_PASSWORD:-}" ]; then
  read -r -s -p "  Password for $email (10+ characters, a letter and a number): " ADMIN_PASSWORD; echo
fi
step "Admin $email"
(cd "$BACKEND_DIR" && DATABASE_URL="$(remote_db_url)" node scripts/create-admin.mjs "$email" "$ADMIN_PASSWORD")
ok "done: sign in to the admin app with $email"
