#!/usr/bin/env bash
# Checks the environment end to end: API health, row counts against the WordPress source, no localhost URLs,
# files reachable on R2, and a real API read. Read-only.
#   ./migrate/80-verify.sh dev
. "$(dirname "$0")/lib.sh"
load_env "${1:-}"
require DB_ENDPOINT API_URL R2_PUBLIC_URL
db="$(remote_db_url)"
hdr=(); [ -n "${ORIGIN_SECRET:-}" ] && hdr=(-H "x-origin-secret: $ORIGIN_SECRET")
fail=0
check() { if [ "$2" = "$3" ]; then ok "$1: $2"; else warn "$1: $2 (expected $3)"; fail=1; fi; }

step "API"
for p in /api/health/live /api/health /api/public/site; do
  code="$(curl -s -o /dev/null -w '%{http_code}' ${hdr[@]+"${hdr[@]}"} "${API_GATEWAY_URL:-$API_URL}$p")"
  check "GET $p" "$code" 200
done

step "Data in the cloud database (rehearsal numbers from the 24 Oct import)"
q() { psql "$db" -tAc "$1"; }
ok "users: $(q 'select count(*) from "User"') (WordPress had 506)"
ok "member profiles: $(q 'select count(*) from "Member"') ($(q 'select count(*) from "Member" where "isPublished"') published)"
check "newsletters" "$(q 'select count(*) from "EmailCampaign"')" 75
check "private messages" "$(q 'select count(*) from "Message"')" 355
ok "articles: $(q 'select count(*) from "Article"')"
check "WhatsApp groups" "$(q 'select count(*) from "WhatsappGroup"')" 16
check "gallery photos" "$(q 'select count(*) from "GalleryPhoto"')" 43
check "newsletters with MailPoet placeholders" "$(q "select count(*) from \"EmailCampaign\" where html ~ '\\[mailpoet_(click|open)_data\\]'")" 0
check "rows with localhost file URLs" "$(q "select (select count(*) from \"Member\" where \"avatarUrl\" ~ 'localhost') + (select count(*) from \"EmailCampaign\" where html ~ 'http://localhost') + (select count(*) from \"GalleryPhoto\" where url ~ 'localhost')")" 0
admins="$(q "select count(*) from \"User\" where role = 'admin'")"
[ "$admins" -gt 0 ] && ok "admin logins: $admins" || { warn "no admin login yet: run 70-create-admin.sh"; fail=1; }

step "Files on R2"
for url in $(q "select url from \"GalleryPhoto\" order by random() limit 2") $(q "select \"avatarUrl\" from \"Member\" where \"avatarUrl\" is not null order by random() limit 2"); do
  code="$(curl -s -o /dev/null -w '%{http_code}' "$url")"
  case "$url" in "$R2_PUBLIC_URL"/*) ;; *) warn "not on this bucket: $url"; fail=1 ;; esac
  check "$(basename "$url")" "$code" 200
done

echo
[ "$fail" = 0 ] && ok "$ENV_NAME looks good: API $API_URL/api, files $R2_PUBLIC_URL" || die "some checks need a look (above)"
