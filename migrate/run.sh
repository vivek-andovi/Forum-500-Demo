#!/usr/bin/env bash
# Runs the whole dev setup in order. Each step is safe to re-run, so after a failure fix the cause and run again.
#   ./migrate/run.sh dev you@example.com
#   ASSUME_YES=1 ./migrate/run.sh dev you@example.com     (no questions; replaces the build DB and cloud data)
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
env="${1:-}"; admin="${2:-}"
[ -n "$env" ] && [ -n "$admin" ] || { echo "Usage: $0 <env> <admin-email>"; exit 1; }

"$here/00-check.sh" "$env"
"$here/10-r2-bucket.sh" "$env"
"$here/20-aws-base.sh" "$env"
"$here/30-deploy-api.sh" "$env"
"$here/40-import-local.sh" "$env"
"$here/50-dump.sh" "$env"
"$here/60-restore.sh" "$env"
"$here/70-create-admin.sh" "$env" "$admin"
"$here/80-verify.sh" "$env"
"$here/90-frontends-local.sh" "$env" --print
