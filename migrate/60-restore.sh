#!/usr/bin/env bash
# Restores a dump (default: the last one from 50-dump.sh) into this environment's cloud database (RDS).
# Replaces what is there. A backup of the current cloud data is taken first when it has members.
#   ./migrate/60-restore.sh dev [path/to/file.dump]
# Dev only: the database must be reachable from your Mac. For a private database (staging/prod) restore from
# AWS CloudShell in "VPC environment" mode or a one-off restore Lambda; see migrate/README.md.
. "$(dirname "$0")/lib.sh"
load_env "${1:-}"
dump="${2:-${LAST_DUMP:-}}"
[ -n "$dump" ] && [ -f "$dump" ] || die "No dump: run 50-dump.sh first or pass a file"
require DB_ENDPOINT
target="$(remote_db_url)"

step "Target $DB_ENDPOINT/$DB_NAME"
members="$(psql "$target" -tAc 'select count(*) from "Member"' 2>/dev/null || echo 0)"
if [ "${members:-0}" -gt 0 ]; then
  warn "the cloud database already has $members members"
  backup="$OUT_DIR/$ENV_NAME-cloud-before-restore-$(date +%Y%m%d-%H%M%S).dump"
  pg_dump --format=custom --no-owner --no-acl --file "$backup" "$target"
  chmod 600 "$backup"
  ok "backup of the current cloud data: $backup"
  confirm "Replace the cloud database contents with $(basename "$dump")?"
fi

step "Restore $(basename "$dump")"
# --clean --if-exists drops each object before recreating it, so this works on an empty or a filled database.
pg_restore --clean --if-exists --no-owner --no-acl --single-transaction --exit-on-error -d "$target" "$dump"
ok "restored"

step "Check"
psql "$target" -tAc 'select count(*) || '"' members, '"' || (select count(*) from "EmailCampaign") || '"' newsletters'"' from "Member"' | sed 's/^/    /'
echo
echo "  Next: ./migrate/70-create-admin.sh $ENV_NAME you@example.com"
