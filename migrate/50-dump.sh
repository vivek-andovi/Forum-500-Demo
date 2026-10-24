#!/usr/bin/env bash
# Dumps the local build database (forum500_<env>_build) to migrate/out/<env>-<timestamp>.dump.
# The dump holds real member data: it stays in out/ (git-ignored). Delete old dumps when done.
#   ./migrate/50-dump.sh dev
. "$(dirname "$0")/lib.sh"
load_env "${1:-}"
require LOCAL_PG_URL

db="$(local_build_db)"
file="$OUT_DIR/$ENV_NAME-$(date +%Y%m%d-%H%M%S).dump"

step "Dump $db"
members="$(psql "$(local_db_url "$db")" -tAc 'select count(*) from "Member"' 2>/dev/null || echo 0)"
[ "$members" -gt 0 ] || die "$db has no members; run 40-import-local.sh first"
pg_dump --format=custom --no-owner --no-acl --file "$file" "$(local_db_url "$db")"
chmod 600 "$file"
save_state LAST_DUMP "$file"
ok "$file ($(du -h "$file" | cut -f1), $members members)"
echo
echo "  Next: ./migrate/60-restore.sh $ENV_NAME"
