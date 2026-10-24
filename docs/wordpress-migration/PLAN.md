# forum.club WordPress → Forum500 Monorepo: migration plan

**Goal:** move all of forum.club's member data and content into this monorepo, shown in the monorepo's own design and edited through its own admin. When this is done, WordPress can be switched off.

**Status (2026-10-23):** built and rehearsed. Schema migration `20261023000000_wordpress_import`, legacy WordPress
password login, magic links, 60-day sessions, the importer (`backends/scripts/import-wordpress/`) and the web/admin
changes are in place. A full import into the local rehearsal database `forum500_wp` passes, and re-running it changes
nothing. Calendar/events, the admin list and the email sender are parked (§9).

### Runbook

```bash
# 1. empty database + app config only (no demo members/content)
DATABASE_URL=… npx prisma migrate deploy
DATABASE_URL=… SEED_PROFILE=site npm run db:seed
# 2. import (dry run first; the report lists everything to check)
export WP_DB_URL=mysql://root:localonly@127.0.0.1:3307/wp \
       WP_UPLOADS_DIR="…/Things/Uploads/uploads.zip" WP_CONTENT_DIR="…/Things/Content" \
       WP_XML="…/Things/Wordpress/forumclub.WordPress.2026-10-21.xml" WP_REPORT_DIR="…/Things/import-reports"
DATABASE_URL=… npm run wp:import -- --dry-run
DATABASE_URL=… npm run wp:import            # safe to re-run
# 3. an admin login
DATABASE_URL=… node scripts/create-admin.mjs you@example.com 'A-strong-password-1'
```

### Decisions made while building (differ from the first draft below)
- **Duplicate listings** (3) are not imported; the report lists them (§3.1 said "archived draft").
- **Every login without a listing** (including staff and WordPress administrators) gets a hidden draft profile, so all 355 private messages come across and those people can still use the member app.
- **Listings staff created for a member who has their own login** are linked to that login by exact name (8).
- **Newsletters** are visible to all members, like the old Newsletter Archive. `--newsletter-recipients` imports who received and opened each one instead (each newsletter is then shown only to its recipients).
- **WhatsApp open access** is a setting (`features.whatsappOpenAccess`, admin → Settings). It defaults to off, and the importer turns it on.
- **Magazine article text** is parsed from the RTFs heuristically (title, standfirst, byline, signature, pull quotes). Spot-check in admin → Articles.

---

## 1. Inputs (all on hand)

| Input | Location | Used for |
|---|---|---|
| Full database dump (MySQL 8.4, 199 tables, prefix `cnj_`) | `Things/DB_DUMP/dbdt74m6dj7w5x.sql`, already loaded in Docker `wp-dump-mysql` at `127.0.0.1:3307` (`root` / `localonly`, db `wp`) | **The only source of data for the importer** |
| WordPress export (WXR) | `Things/Wordpress/forumclub.WordPress.2026-10-21.xml` | A cross-check only. It is a subset of the dump, so the importer compares its post/comment counts against what it imported |
| Uploads (5.5 GB, all 2,552 media-library files present) | `Things/Uploads/uploads.zip/` (a folder, despite the name) | Photos, PDFs, MP3s, MP4s, flipbook images |
| Login-duration plugin | `Things/forumclub-login-duration.php` | Rule: stay logged in for 60 days, "Remember me" always on |
| Magazine article text (from earlier) | `Things/Content/` | In:Forum / Forecast article bodies (the flipbooks only have PDFs) |

---

## 2. Can every piece of live data be moved? Verdict per item

✅ = moved completely · 🟡 = moved, with a noted limitation · ⛔ = not possible from these files

| Data on forum.club | Volume | Verdict | Notes |
|---|---|---|---|
| Member logins | 506 | ✅ | Same email and **same password**: both WordPress hash formats can be checked, then upgraded to argon2. 60-day sessions |
| Member directory profiles | 348 (314 live, 22 draft, 12 private) | ✅ | Name, bio, position, company, city, categories (all of them), interests, photo, verified flag, join date |
| Profile bios | 347 non-empty | 🟡 | WordPress bios are HTML (78 contain inline images, 100 contain links). The new app shows plain text, so they become clean paragraphs with links kept as text. Inline images are dropped (they're mostly duplicate headshots) |
| New-member Q&A interviews | 66 | ✅ | 62 parse cleanly. 4 contain only a bio and become the member's bio. 54 match a member by exact name; 12 match by fuzzy name (listed in the report for checking) |
| Private messages | 355 messages, 214 conversations | ✅ | Original dates, sender and recipient, read/unread state |
| WhatsApp city groups | 16 | ✅ | Real `chat.whatsapp.com` invite links |
| Forum Radio podcast | ~30 episodes, 4 series | ✅ | Parsed from the page: series, number, date, guest, member link, description, artwork, Spotify and Apple links |
| Five Minutes with Forum (2020) | 16 audio clips | ✅ | MP3s, titles, speakers, dates |
| Zoom Years (2020–21) | 6 videos | ✅ | MP4s + speaker text. **Needs a new video type in the Library (§4)** |
| YouTube channel, Links, Essential documents | 1 + ~5 + 3 PDFs | ✅ | Library items |
| IN:FORUM editions | 5 | ✅ | PDF + cover from the flipbooks, articles from `Things/Content`. The flipbook's page-turning effect is replaced by the new design's reader + "Read PDF" |
| Forum Forecast 2026 | 1 | ✅ | PDF + articles |
| Gallery | Cliveden Nov 2024 (+ any others on the page) | ✅ | Album + photos |
| Blog/news posts | 17 | ✅ | 13 short club-news posts become **Newsfeed** posts. 4 long pieces (Arts, City Guide, risk) become **member articles** |
| Salon / breakfast write-ups | 5 pages | ✅ | Articles under a new "report" type |
| Weekly Noticeboard newsletters | 75 sent | 🟡 | 21 have the exact sent HTML. **54 are rebuilt from MailPoet's editor content**: same text, images and links, but not pixel-identical to the email |
| Who received / opened each newsletter | ~330 recipients, ~190 opens each | ✅ | Matched by email. Non-members have no inbox in the app, so only their subscriber record is kept |
| Newsletter subscribers | 645 (139 non-members) | ✅ | New `Subscriber` list |
| Home "Forum Movie" video, YouTube link, page texts | — | ✅ | Loaded into the new design's CMS (Page / Setting) |
| Events | 20 posts | ⛔ for now | The stored dates/locations are junk (all copied from one template). Real dates are in Google Calendar, **parked** |
| Contact Form 7 answers (Interests form, Forecast survey, NY forms) | — | ⛔ | WordPress never saved them; they only went to email |
| Elementor page layouts, theme look | — | ⛔ by design | The monorepo design replaces them. Only text and media are moved |
| Visitor stats, logs, revisions, hotel-booking demo data, plugin tables | — | Not moved | No value. The SQL dump stays as an archive |
| Event-planning boards (WP Project Manager) | 11 projects, 71 tasks | CSV export | Saved to `Things/import-reports/`. Rebuilt in admin only if asked |
| Old URLs (`/member/<slug>/`, `/region/…`, `/member-category/…`, page slugs) | — | ✅ | 301 redirects to the new routes |

**Bottom line:** everything members can currently see or do on forum.club comes across, except event dates (parked, coming from Google Calendar) and form answers that WordPress never stored.

---

## 3. Data mapping (field level)

### 3.1 Members and logins
| WordPress | Monorepo |
|---|---|
| `cnj_users.user_email` (lower-cased) | `User.email` |
| `cnj_users.user_pass` (`$wp$…` or `$P$…`) | `User.passwordHash`, kept as-is and verified by the legacy checker (§4.2) |
| administrator role | `role=member` for everyone at import; admins are set later (§9) |
| everyone else | `role=member`, `status=active` |
| `_last_login` | `User.lastLoginAt` |
| `hp_listing.post_title` | `Member.fullName` |
| `hp_listing.post_name` | `Member.slug`. Empty or duplicate slugs get `-2` etc.; old slug → redirect map |
| `post_content` (HTML) | `Member.bio`: HTML → paragraphs (`\n\n`), links → text |
| `hp_member_position` = `CITY \| Title \| Company \| Description` (254 have 4 parts, 44 have 3, 39 have 2) | `positionLine` (raw, new field), `headline` = Title, `company` = Company, `companyDescription` = rest (new field). The city part is only a fallback for `chapter` |
| `hp_listing_member_region` term | `Member.chapter`. 51 cities → `Chapter`; `isChapter=true` for the 14 real chapters (those with a WhatsApp group) |
| `hp_listing_category` terms (1–n) | `MemberSector` (new many-to-many); `sectorId` = first one |
| `hp_listing_member_interest` terms | `Member.interests[]` |
| `_thumbnail_id` → attachment file | `Member.avatarUrl` (new storage URL) |
| `hp_verified` | `Member.verified` (new) |
| `post_status` publish / draft / private | `profileStatus` published / draft / draft, with `isPublished` = (publish) |
| `post_date` | `joinedYear`, `createdAt` |
| `post_author` → `User` | `Member.userId`. Exception: **24 listings created by staff accounts (users 1, 2, 505)** are imported **without a login** (`userId=null`) and listed in the report so they can be invited |
| 3 people with 2 listings (`Olga Arakcheyev BACKUP`, `Ryan Lee` ×2, `Juliet Gal/Stannard`) | Keep the published / newest one; the other is imported as an archived draft and flagged in the report |

### 3.2 Q&A interviews
"new member" posts → find the member by name (exact first, then fuzzy) → split the text on `Question:` / `Answer:` → `MemberInterviewQA` rows (sortOrder). Then `featuredNewMember=true` on the 10 most recent; the first Q/A becomes `spotlightQuestion/Answer`.

### 3.3 Messages
`hp_message` comments: `user_id` = sender, `comment_karma` = recipient. One `Conversation` per pair (`pairKey` = sorted memberIds), `Message` (body = text, `createdAt` = `comment_date_gmt`), `lastMessageAt` = newest message. `ConversationParticipant.lastReadAt`: if the recipient's latest received message is read (`comment_approved=1`), set it to that message's time, otherwise null.

### 3.4 Content
| WordPress | Monorepo |
|---|---|
| WhatsApp accounts (`nta_wa_account_info.number` = invite link) | `WhatsappGroup` (name, `inviteLink`, chapter) |
| Real3D flipbooks (`real3dflipbook_N` options: `pdfUrl`, thumbnail) | `InforumEdition.pdfUrl` / `coverUrl`; Forecast → `ForecastIssue.pdfUrl` |
| `Things/Content/*` articles | `Article` (publication `inforum` / `forecast`) + `EditionArticle` (order = page number) |
| Podcast page (Elementor widgets: series heading → "Episode N date" → image → guest line → text → Spotify/Apple) | `PodcastEpisode` (+ `series`) |
| Five Minutes page (16 fancy-box widgets with MP3s) | `LibraryItem kind=audio` |
| Zoom Years (6 video widgets) | `LibraryItem kind=video` |
| YouTube channel, Links page, Essential documents | `LibraryItem kind=link` / `document` |
| Gallery page (carousel widgets) | `GalleryAlbum` + `GalleryPhoto` |
| 13 short posts (social, Events 2025) | `FeedPost` (author "Forum Team", first image) |
| 4 long posts (Arts, City Guide, risk) | `Article publication=member` |
| 5 salon / breakfast pages | `Article publication=report` (new value) |
| MailPoet sent newsletters | `EmailCampaign` (subject, `html`, `sentAt`, status sent). `EmailDelivery` per member recipient (`openedAt` from the opens stats) |
| MailPoet subscribers | `Subscriber` (email, name, status, lists) |
| Forum Movie mp4, YouTube URL | `Setting` (`site.homeVideoUrl`, `site.youtubeUrl`) |

### 3.5 Media
- Copy only the files actually used (the media library + files linked in content). Not the 5.5 GB of resized copies.
- Destination: the storage driver (local `uploads/` in dev, S3/R2 in production), under the key `wp/<YYYY>/<MM>/<filename>` (keeps the original names; easy to trace).
- Each file → an `Asset` row (`driver`, `mime`, `size`, `createdBy='wp-import'`) so it shows in the admin media library.
- `LegacyMap` keeps old URL → new URL. Imported **file** URLs (`forum.club/wp-content/uploads/…`) are rewritten to the new storage. Links to old forum.club **pages** inside imported content (about 2,655 in newsletters: `/podcast/`, `/events2026/`, `/member/…`) are **not** rewritten; they work only once forum.club points at the new app, which redirects them through `LegacyMap` (`GET /public/redirect`). **PENDING:** DNS cut-over.
- Production bucket needs **CORS** for the web origin (the gallery's copy/download uses `fetch`).

---

## 4. Changes to the monorepo

### 4.1 Schema: one migration
- `LegacyMap { entity, wpId, newId, oldUrl? }`, unique (entity, wpId). Makes the import safe to re-run and drives the redirects.
- `MemberSector` many-to-many (Member ↔ Sector).
- `Member`: `positionLine`, `companyDescription`, `verified`.
- `Subscriber { email @unique, name, status, lists String[], source, memberId? }`.
- `EmailCampaign.html String?`.
- `InforumEdition.pdfUrl String?`.
- `PodcastEpisode.series Int?`.
- `LibraryKind` + `audio, video, document, link`; `LibraryItem` + `mediaUrl, speaker, recordedOn, durationLabel`.
- `Publication` + `report`.
- `EventKind` + `Breakfast, Lunch, Brunch, Drinks, Conference, Party, Other` (ready for the parked calendar import).
- `AuthTokenType` + `magic_link`.

### 4.2 Backend
1. **Legacy password login** (`core/auth/auth.service.ts` `login()`):
   - `$wp$2y$…`: `bcrypt.compare(base64(HMAC-SHA384(key "wp-sha384", password)), hash without the "$wp" prefix)`.
   - `$P$…`: phpass portable check (MD5, 2^n rounds).
   - On success, re-save as argon2. Same lockout and timing rules as now.
2. **Magic link:** `POST /auth/magic-link` (always 200) + `POST /auth/magic-link/consume`. Single-use, 15-minute token through `AuthToken` + the mail service.
3. **Session length:** `JWT_EXPIRES_IN=60d` (`.env`, `.env.example`, `render.yaml`, Terraform, ECS task def). Revocation already works through `tokenVersion`. Follow-up (not part of this migration): short JWT + httpOnly refresh cookie.
4. **Members API:** `sectorIds` (multi) + `interest` filters; case-insensitive interest search; include `sectors` and `interviews` on the profile.
5. **WhatsApp:** setting `whatsapp.openAccess` (default **true** after import). When on, every member sees every group's invite link, as on WordPress. Turning it off brings back the request → approve flow.
6. **Articles:** `GET /v1/articles/:slug` already exists; add `publication=report`.
7. **Emails:** return `html` when present.
8. **Admin resources:** register `subscribers`, `legacy-map` (read-only), and `messages` (read-only; WordPress let admins monitor messages, `hp_message_allow_monitoring=1`).
9. **Public redirects:** `GET /api/public/redirects` (or a JSON generated by the importer) for the web middleware.

### 4.3 Web app (monorepo design, no WordPress look)
1. **Profile page:** bio rendered with `paragraphs()` (newlines currently collapse); show interview Q&A, all sectors, verified badge.
2. **Directory:** multi-sector + interest filter; client-side paging (348 members).
3. **Articles:** new `/media/articles/[slug]` detail route (member articles + salon reports); the articles list links to it.
4. **Emails / newsletter archive:** render `html` inside a sandboxed `<iframe srcDoc sandbox>`, plain text as fallback.
5. **Library:** audio player, video player (`<video controls>`), document download, external link, grouped by kind.
6. **Forum Radio / Podcasts:** series grouping; Spotify / Apple buttons.
7. **In:Forum:** "Read PDF" button per edition.
8. **Middleware:** 301 from old forum.club paths → new routes.

### 4.4 Admin app
New resources appear automatically once registered (§4.2.8). Add icons in `resource-registry.ts`; add `pdfUrl` / `mediaUrl` to the upload-enabled URL fields in `field-hints.ts` so admins can upload PDFs, audio and video.

---

## 5. Importer

Location: `backends/scripts/import-wordpress/` (TypeScript, run by the same runner as the seed).

```
npm run wp:import -- --dry-run            # read everything, write nothing, produce report
npm run wp:import                         # full import
npm run wp:import -- --only=members,messages
```

Environment variables: `WP_DB_URL=mysql://root:localonly@127.0.0.1:3307/wp`, `WP_UPLOADS_DIR=…/Things/Uploads/uploads.zip`, `WP_XML=…/forumclub.WordPress.2026-10-21.xml`, `WP_REPORT_DIR=…/Things/import-reports`.

Rules:
- **Never** truncates tables and never calls the seed.
- Re-runnable: every row is upserted through `LegacyMap`.
- Writes through the app's Prisma client, so audit fields are stamped `wp-import`.
- Runs steps in dependency order; one transaction per step.

Steps:
1. lookups: chapters, sectors
2. media (copy + `Asset` + URL map)
3. users
4. members (+ sectors, interests, photos)
5. Q&A
6. conversations / messages
7. WhatsApp groups
8. In:Forum + Forecast (+ `Things/Content`)
9. podcasts
10. library (audio, video, docs, links)
11. gallery
12. feed posts + articles + reports
13. newsletters + deliveries + subscribers
14. settings / CMS texts
15. redirects
16. PM projects CSV
17. verification

**Report** (`Things/import-reports/<timestamp>.md` + `.json`):
- counts per entity, expected vs imported, plus the WXR cross-check
- unmatched Q&As, staff-created members without logins, duplicate listings, renamed slugs
- missing files, members without photos, rebuilt newsletters

---

## 6. Where to run it

1. **Rehearsal DB:** a new database `forum500_wp` in the existing `forum500-postgres` container. The current `forum500` dev DB (demo data) is left untouched.
2. `prisma migrate deploy` → `create-admin.mjs` (your login) → `wp:import --dry-run` → review the report → `wp:import`.
3. Point the API at `forum500_wp` and click through the member app and the admin.
4. Production: the same commands against the production DB at cut-over (§8).

---

## 7. Phases and effort

| Phase | Work | Est. |
|---|---|---|
| P1 | Schema migration, legacy password + magic link, 60-day sessions | 1 day |
| P2 | Importer core: lookups, media copy, users, members, Q&A, messages, WhatsApp + dry-run report | 2 days |
| P3 | Importer content: editions/Forecast, podcast + library parsing, gallery, posts/reports, newsletters (incl. rebuilding 54 from editor JSON), subscribers, settings, redirects | 2 days |
| P4 | Web + admin changes (§4.3, §4.4) | 2–3 days |
| P5 | Rehearsal on `forum500_wp`, fixes, sign-off by you | 1 day |
| P6 | Cut-over | ½ day |
| | **Total** | **~8–10 working days** |

---

## 8. Cut-over day
1. Tell members the date. Put WordPress in maintenance mode (no new messages or profile edits).
2. New SQL dump (phpMyAdmin) + uploads zip of only the new months.
3. Load the dump into `wp-dump-mysql` → run the importer against production (it only adds and updates).
4. Check the verification report → set admins (§9) → switch DNS for forum.club to the new web/API → redirects live.
5. Keep WordPress offline but intact for 30 days, then archive the dump + uploads.

---

## 9. Parked (do later)
- **Events / calendar:** export the Google Calendar as `.ics` → importer step `events` (`EventKind` values already added).
- **Admins:** in the admin app go to Users → set Role = `admin`; or run `node scripts/create-admin.mjs <email> <password>`; or SQL `UPDATE "User" SET role='admin' WHERE email='…';`.
- **Email sender / domain:** confirm the from-address and set SPF/DKIM before the new app sends newsletters.
- **Contact Form 7 answers:** only recoverable from the inbox that received them.
