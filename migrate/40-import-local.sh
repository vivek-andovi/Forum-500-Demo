#!/usr/bin/env bash
# Builds this environment's data on your Mac: a fresh local database forum500_<env>_build gets the schema, the
# app's own content (SEED_PROFILE=site), and the WordPress import. Files are uploaded straight to this
# environment's R2 bucket, so every file URL saved in the database already points at it.
# Nothing in the cloud database is touched here; 50-dump + 60-restore ship the result.
#   ./migrate/40-import-local.sh dev            (asks before replacing an existing build database)
#   ./migrate/40-import-local.sh dev --refresh  (passes --refresh to the importer; see docs/wordpress-migration)
. "$(dirname "$0")/lib.sh"
load_env "${1:-}"
shift || true
require LOCAL_PG_URL WP_DB_URL THINGS_DIR R2_BUCKET R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_PUBLIC_URL CF_ACCOUNT_ID
[ -n "${API_URL:-}" ] || die "API_URL unknown: run 30-deploy-api.sh first (the seed's built-in images are served by the API)"

db="$(local_build_db)"
report_dir="$THINGS_DIR/import-reports/$ENV_NAME"
mkdir -p "$report_dir"

# Everything the API config and the importer read. Set explicitly so nothing falls back to backends/.env
# (which points at local storage and would bake http://localhost URLs into the data).
export DATABASE_URL="$(local_db_url "$db")"
export JWT_SECRET="import-only-not-used-for-signing-0000000000"
export NODE_ENV=development
export PUBLIC_API_URL="$API_URL"
export STORAGE_DRIVER=s3 S3_BUCKET="$R2_BUCKET" S3_ENDPOINT="$(r2_endpoint)" S3_REGION=auto S3_FORCE_PATH_STYLE=true
export S3_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" S3_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" ASSET_PUBLIC_BASE_URL="$R2_PUBLIC_URL"
export MAIL_DRIVER=log
export WP_DB_URL WP_UPLOADS_DIR="$THINGS_DIR/Uploads/uploads.zip" WP_CONTENT_DIR="$THINGS_DIR/Content" WP_REPORT_DIR="$report_dir"
xml="$(ls "$THINGS_DIR"/Wordpress/*.xml 2>/dev/null | tail -1 || true)"
[ -n "$xml" ] && export WP_XML="$xml"

step "Local build database $db"
exists="$(psql "$(local_db_url postgres)" -tAc "select 1 from pg_database where datname = '$db'")"
if [ "$exists" = 1 ]; then
  if [ "${1:-}" = "--refresh" ] || [ "${KEEP_BUILD_DB:-0}" = 1 ]; then
    ok "keeping it (re-run: the importer updates what it imported and keeps edits)"
  else
    confirm "Replace the existing local database $db with a fresh one?"
    psql "$(local_db_url postgres)" -qc "drop database \"$db\" with (force)"
    psql "$(local_db_url postgres)" -qc "create database \"$db\""
    ok "recreated"
  fi
else
  psql "$(local_db_url postgres)" -qc "create database \"$db\""
  ok "created"
fi
fresh="$(psql "$DATABASE_URL" -tAc "select count(*) from information_schema.tables where table_name = '_prisma_migrations'")"

step "Schema"
(cd "$BACKEND_DIR" && npx prisma migrate deploy) | sed 's/^/    /'
ok "migrations applied"

if [ "$fresh" = 0 ]; then
  step "App content (SEED_PROFILE=site: settings, CMS pages, navigation; no demo members)"
  (cd "$BACKEND_DIR" && SEED_PROFILE=site SEED_FORCE=1 npm run -s db:seed) | tail -3 | sed 's/^/    /'
  ok "seeded"
fi

step "WordPress import: dry run (writes nothing)"
(cd "$BACKEND_DIR" && npm run -s wp:import -- --dry-run) | tail -4 | sed 's/^/    /'
dry="$(ls -t "$report_dir"/dry-run-*.md | head -1)"
grep -q "File URLs will point at http://localhost" "$dry" && die "the import would save localhost URLs; check the R2 settings"
ok "report: $dry"

step "WordPress import (uploads ~1.9 GB to $R2_BUCKET the first time; re-runs skip files already uploaded)"
(cd "$BACKEND_DIR" && npm run -s wp:import -- "$@") | sed 's/^/    /'
real="$(ls -t "$report_dir"/import-*.md | head -1)"
ok "report: $real"

step "No local addresses left in the data"
bad="$(psql "$DATABASE_URL" -tAc "
  select (select count(*) from \"Member\" where \"avatarUrl\" ~ 'localhost|127\.0\.0\.1')
       + (select count(*) from \"EmailCampaign\" where html ~ 'http://localhost')
       + (select count(*) from \"Article\" where \"imageUrl\" ~ 'localhost' or \"authorPhotoUrl\" ~ 'localhost')
       + (select count(*) from \"GalleryPhoto\" where url ~ 'localhost')")"
[ "$bad" = 0 ] || die "$bad rows still point at localhost"
ok "all file URLs point at $R2_PUBLIC_URL"
echo
echo "  Next: ./migrate/50-dump.sh $ENV_NAME"
