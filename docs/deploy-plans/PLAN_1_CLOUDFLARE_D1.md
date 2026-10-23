# Plan 1 — Forum500 fully on Cloudflare (Workers + D1)

> **Status:** plan only — nothing in this document has been built yet.
> **Prepared:** 2026-10-23 · **Applies to:** `Monorepo/` (NestJS API in `backends/`, Next.js apps in `frontends/web` and `frontends/admin`)
> **Prices:** Cloudflare list prices as last known; re-check <https://developers.cloudflare.com/workers/platform/pricing/> and <https://developers.cloudflare.com/d1/platform/pricing/> before committing.

---

## Table of contents

1. [Summary](#1-summary)
2. [Goals, non-goals, constraints](#2-goals-non-goals-constraints)
3. [Target architecture](#3-target-architecture)
4. [Cloudflare products used and why](#4-cloudflare-products-used-and-why)
5. [Technology choices for the rewrite](#5-technology-choices-for-the-rewrite)
6. [Repository layout after the migration](#6-repository-layout-after-the-migration)
7. [Database: Postgres → D1 (SQLite)](#7-database-postgres--d1-sqlite)
8. [Transactions: redesign of every `$transaction`](#8-transactions-redesign-of-every-transaction)
9. [Audit columns and soft delete without Prisma](#9-audit-columns-and-soft-delete-without-prisma)
10. [API Worker design](#10-api-worker-design)
11. [Module-by-module port](#11-module-by-module-port)
12. [Authentication and passwords](#12-authentication-and-passwords)
13. [File storage (R2)](#13-file-storage-r2)
14. [Email (Queues + provider)](#14-email-queues--provider)
15. [Real-time chat (Durable Objects)](#15-real-time-chat-durable-objects)
16. [Scheduled jobs (Cron Triggers)](#16-scheduled-jobs-cron-triggers)
17. [Frontends on Workers (OpenNext)](#17-frontends-on-workers-opennext)
18. [Security](#18-security)
19. [Environments, bindings, secrets](#19-environments-bindings-secrets)
20. [CI/CD](#20-cicd)
21. [Testing strategy](#21-testing-strategy)
22. [Data migration and cutover](#22-data-migration-and-cutover)
23. [Observability](#23-observability)
24. [Backups and disaster recovery](#24-backups-and-disaster-recovery)
25. [Platform limits and how we stay inside them](#25-platform-limits-and-how-we-stay-inside-them)
26. [Costs at 500 and 10,000 users](#26-costs-at-500-and-10000-users)
27. [Risks](#27-risks)
28. [Timeline and milestones](#28-timeline-and-milestones)
29. [Go-live checklist](#29-go-live-checklist)
30. [Runbooks](#30-runbooks)
31. [Open decisions](#31-open-decisions)

---

## 1. Summary

| | |
|---|---|
| **What** | Run the whole product on Cloudflare: both Next.js apps and the API on Workers, data in D1, files in R2, chat over Durable Objects, email through Queues, jobs on Cron Triggers. |
| **Biggest change** | The NestJS + Prisma + Postgres API is **rewritten** as a Hono + Drizzle Worker on SQLite (D1). Frontends barely change because the API keeps the same URLs and JSON shapes. |
| **Effort** | ~5–7 developer-weeks (one developer), plus a 1-week parallel run before cutover. |
| **Run cost** | ~**$5/month** at 500 users, ~**$8–15/month** at 10,000 users. |
| **Main trade-offs** | No interactive transactions, SQLite instead of Postgres, 10 GB per database, Cloudflare-specific code (hard to move away later). |

---

## 2. Goals, non-goals, constraints

**Goals**
- One vendor, one bill, no servers, no cold starts.
- Keep every existing API path (`/api/...`) and response shape so `frontends/web` and `frontends/admin` need no data-layer changes.
- Keep current behaviour: audit columns, soft delete, approvals workflow, CMS-driven content, lockout, token revocation (`tokenVersion`).
- Fix while porting: chat polling → push; RSVP capacity race; scheduled publish not enforced.

**Non-goals**
- New features (Stripe, DMs redesign, WhatsApp sync) — they follow the same patterns later.
- Multi-region writes (D1 has one primary; read replicas optional, see §25).

**Constraints found in the current code**

| Constraint | Where | Consequence |
|---|---|---|
| 58 models, 27 enums, max 31 columns per table | `backends/prisma/schema.prisma` | Fits D1 (100 columns/table). Multi-row inserts must be chunked (100 bound params per statement). |
| 7 `String[]` columns | `Member.interests`, `Member.travelCities`, an Application `travelCities`, `inviteAudiences`, `supportRequested`, `letterBody`, `body` | Become JSON text columns; `has` filter → `json_each`. |
| 6 `Json` columns | `profileDraft`, `changes` ×2, `audience`, `blocks`, `Setting.value` | JSON text columns. |
| 327 `@db.Uuid` / `@db.Timestamptz` | schema | `TEXT` uuids, `INTEGER` epoch-ms timestamps. |
| 13 `$transaction` uses | §8 | Rewritten as `batch()` or Durable Object. |
| `mode: 'insensitive'` ×3 | `admin-query.ts:43`, `admin-crud.service.ts:79`, `events.repository.ts:88` | `COLLATE NOCASE` / `lower()`. |
| Admin metadata from `Prisma.dmmf` | `admin-metadata.service.ts`, `core/prisma/model-meta.ts` | Rebuilt from Drizzle table definitions (§11). |
| `argon2` (native) | `core/auth/auth.service.ts` | `hash-wasm` argon2id; existing hashes still verify (§12). |
| In-memory throttler | `app.module.ts:28`, `@Throttle` in `auth.controller.ts` | Workers Rate Limiting binding + Cloudflare rules. |
| multer upload up to 150 MB | `admin/uploads.controller.ts:48` | Small files via Worker; large files via existing presign → confirm flow. |
| Full asset URLs stored in rows | `Asset.url`, image fields | Set `media.forum500.club` once and never change it; rewrite URLs during data import. |

---

## 3. Target architecture

```
                                   Cloudflare account (one zone: forum500.club)
 ┌──────────────────────────────────────────────────────────────────────────────────────────┐
 │  DNS · CDN · WAF · DDoS · Bot Fight · Turnstile · Access (Zero Trust)                      │
 │                                                                                           │
 │  forum500.club / www ─► Worker  web-app     (Next.js 15 via OpenNext)                      │
 │                            └─ service binding ─► api (for server-side metadata fetches)   │
 │  admin.forum500.club ─► Access policy ─► Worker  admin-app (Next.js 15 via OpenNext)      │
 │  media.forum500.club ─► R2 bucket  forum500-media (public, cached, immutable keys)        │
 │  api.forum500.club   ─► Worker  api  (Hono)                                               │
 │                           ├─ D1        DB            main database                        │
 │                           ├─ R2        MEDIA         uploads (binding + S3 API presign)    │
 │                           ├─ DO        CHAT_ROOM     one object per conversation / group   │
 │                           ├─ DO        EVENT_RSVP    one object per event (capacity lock)  │
 │                           ├─ Queue     EMAIL_QUEUE   producer                              │
 │                           ├─ KV        CACHE         public CMS/site responses (optional)  │
 │                           ├─ RateLimit RL_AUTH, RL_DEFAULT                                 │
 │                           └─ Cron      */5 * * * *  scheduled publish, cleanup            │
 │                                                                                           │
 │  Worker  email-consumer ◄─ Queue EMAIL_QUEUE ─► SES HTTPS API (or Resend) ; DLQ           │
 │  R2 bucket forum500-backups ◄─ nightly D1 export (GitHub Actions)                         │
 │  OpenNext incremental cache ─► R2 bucket forum500-next-cache                              │
 └──────────────────────────────────────────────────────────────────────────────────────────┘
```

**Request paths**

| Flow | Path |
|---|---|
| Member page view | Browser → `web-app` Worker (HTML/JS from static assets, free) → browser calls `api.forum500.club` with Bearer token |
| Public page metadata (server side) | `web-app` → **service binding** → `api` (no public hop, no extra request charge) |
| Admin | Browser → Cloudflare Access login → `admin-app` → `api` |
| Upload (small ≤ 25 MB) | Browser → `api` (byte sniff) → R2 binding `put` → D1 `Asset` row |
| Upload (large) | Browser → `api /admin/uploads/presign` → PUT straight to R2 → `api /admin/uploads/confirm` (range-read first bytes to sniff) |
| Chat | Browser WebSocket → `api /api/v1/realtime?ticket=…` → Durable Object `CHAT_ROOM:<id>`; messages still written via REST → D1 → DO broadcast |
| Email | `api` → `EMAIL_QUEUE.send()` → `email-consumer` → SES/Resend; retries + DLQ |

---

## 4. Cloudflare products used and why

| Product | Used for | Plan needed | Replaces in today's code |
|---|---|---|---|
| Workers (Paid, $5/mo) | API, both Next apps, email consumer | Paid (free plan's 10 ms CPU/request is too low for SSR + argon2) | NestJS/Express, Amplify/Vercel |
| Workers Static Assets | JS/CSS/images of both Next apps | included, free requests | Amplify CDN |
| D1 | Main database | included in Workers Paid | Postgres + Prisma |
| R2 | Media, backups, Next incremental cache | 10 GB free | S3 / local `uploads/` |
| Durable Objects (SQLite-backed) | Chat rooms, RSVP capacity | included in Workers Paid | 15 s polling, racy RSVP |
| Queues | Outgoing email, notification fan-out | included in Workers Paid | synchronous `MailService.send` |
| Cron Triggers | Scheduled publish, token cleanup, digests | free | (missing today) |
| KV (optional) | Cache of `/public/site`, `/public/pages/:slug` | included | — |
| Rate Limiting binding | Login/forgot/apply limits, per-IP default | free | `@nestjs/throttler` |
| Turnstile | Bot check on apply / forgot-password / login after failures | free | — |
| Access (Zero Trust) | Second login wall in front of `admin.` | free ≤ 50 users | — |
| WAF / DDoS / Bot Fight | Edge protection | free plan rules (Pro $20/mo adds managed ruleset — optional) | AWS WAF in Terraform |
| Workers Logs + Tail | Logs | included (paid plan quota) | CloudWatch |

---

## 5. Technology choices for the rewrite

| Concern | Choice | Reason |
|---|---|---|
| HTTP framework | **Hono** | Built for Workers, tiny, middleware model close to Nest guards/interceptors. |
| Validation | **zod** (already used everywhere in `backends/`) | Existing schemas copy over unchanged. |
| OpenAPI / Swagger | **@hono/zod-openapi** + `@hono/swagger-ui` | Keeps `/docs` and `docs/API_CONTRACT.md` in sync. |
| ORM | **Drizzle ORM** + **drizzle-kit** | First-class D1 driver, `db.batch()`, small bundle. Prisma on D1 works but runs "transactions" as separate queries silently and ships a larger bundle. |
| Migrations | `drizzle-kit generate` → SQL files → `wrangler d1 migrations apply` | Plain SQL, reviewed in PRs. |
| JWT | **jose** (HS256) | WebCrypto based; same secret + payload means existing sessions survive cutover. |
| Passwords | **hash-wasm** (argon2id) | Verifies today's `argon2` hashes (PHC string format). |
| AWS SES calls | **aws4fetch** | SigV4 signing with `fetch`, no AWS SDK. |
| R2 presigned PUT | **aws4fetch** against R2's S3 endpoint | R2 bindings cannot presign. |
| Request context | `AsyncLocalStorage` (`nodejs_compat` flag) | Same idea as `core/common/request-context.ts`. |
| Error tracking | `@sentry/cloudflare` (free tier) | — |
| Local dev | `wrangler dev` (Miniflare, local D1/R2/DO/Queues) | Whole stack offline. |
| Tests | Vitest + `@cloudflare/vitest-pool-workers`; existing `test/api.e2e.test.mjs` over HTTP | §21 |

---

## 6. Repository layout after the migration

Build the new API **next to** the old one so both can run during the parallel phase.

```
Monorepo/
├── backends/                     # existing NestJS API — kept until cutover, then archived
├── workers/
│   ├── api/                      # NEW: Hono API Worker
│   │   ├── src/
│   │   │   ├── index.ts          # Hono app + scheduled() + Durable Object exports
│   │   │   ├── core/             # auth, audit, config, db, mail, notifications, storage, realtime, rate-limit
│   │   │   ├── modules/          # admin, comms, dashboard, events, media, membership, site (same split as today)
│   │   │   │   └── <hub>/<area>.{routes,service,repository}.ts
│   │   │   ├── db/
│   │   │   │   ├── schema/       # Drizzle tables, one file per hub (mirrors admin/resources)
│   │   │   │   ├── live.ts       # soft-delete + audit helpers (§9)
│   │   │   │   └── meta.ts       # generated model metadata for /admin/meta (§11)
│   │   │   └── durable/          # ChatRoom.ts, EventRsvp.ts
│   │   ├── migrations/           # drizzle-kit SQL, applied by wrangler
│   │   ├── scripts/              # check-layers.mjs (ported), gen-meta.mjs, import-from-postgres.mjs
│   │   ├── test/
│   │   ├── drizzle.config.ts
│   │   ├── wrangler.jsonc
│   │   └── package.json
│   └── email-consumer/           # NEW: Queue consumer Worker
├── frontends/web                 # + open-next.config.ts, wrangler.jsonc
├── frontends/admin               # + open-next.config.ts, wrangler.jsonc
├── infra/cloudflare/             # NEW: Terraform (cloudflare provider) for zone, DNS, Access, WAF, buckets
└── .github/workflows/            # api-worker.yml, frontend-web.yml, frontend-admin.yml, d1-backup.yml
```

Layer rule carried over from `npm run check:layers`: **only `*.repository.ts` may import `db/`**, no cross-module repository imports.

---

## 7. Database: Postgres → D1 (SQLite)

### 7.1 Type mapping

| Prisma / Postgres | D1 / Drizzle | Notes |
|---|---|---|
| `String @id @default(uuid()) @db.Uuid` | `text('id').primaryKey().$defaultFn(() => crypto.randomUUID())` | Existing ids are kept as-is during import. |
| `String @db.Uuid` (FKs) | `text()` | — |
| `DateTime @db.Timestamptz` | `integer({ mode: 'timestamp_ms' })` | Always UTC epoch ms. Sorting and range filters stay indexed. |
| `Boolean` | `integer({ mode: 'boolean' })` | — |
| `Int` / `Float` | `integer` / `real` | — |
| `enum X {…}` (27) | `text({ enum: [...] })` + `CHECK(col IN (...))` in migration | Enum values exported as const arrays — reused by zod and `/admin/meta`. |
| `String[]` (7) | `text({ mode: 'json' }).$type<string[]>()` default `'[]'` | Search with `json_each`. |
| `Json` (6) | `text({ mode: 'json' })` | — |
| `@unique` | `uniqueIndex` | Soft-delete aware, see 7.3. |
| `@@index` | `index` | Re-create all 16 `@@index/@@unique` + every FK column. |
| `onDelete` rules | Declared in Drizzle `references()` **and** applied by the soft-delete helper (§9) | D1 enforces foreign keys. |

### 7.2 Query features that change

| Today (Prisma/Postgres) | D1 replacement |
|---|---|
| `{ contains: s, mode: 'insensitive' }` | `like(lower(col), '%' + s.toLowerCase() + '%')`. ASCII `LIKE` is already case-insensitive in SQLite; use `lower()` for clarity. |
| `{ equals: name, mode: 'insensitive' }` (chapter/sector lookups) | Column declared `COLLATE NOCASE`, then plain `eq()`. |
| `interests: { has: s }` (`members.repository.ts:20`) | `sql\`exists (select 1 from json_each(${member.interests}) where value = ${s})\`` |
| Admin global search over many fields | Phase 1: `LIKE` per field (fine at 10k rows). Phase 2 (optional): FTS5 virtual table for members/articles. |
| `$queryRaw\`SELECT 1\`` (health) | `db.run(sql\`select 1\`)` |
| `createMany` | Chunk rows so `rows × columns ≤ 100` params per statement, run chunks in one `batch()`. |
| `in: [...ids]` | Helper `inChunks(ids, 90)`; or `json_each(?)` with one JSON array parameter (preferred: one param, any length). |
| `_count`, `groupBy`, `aggregate` | Drizzle `count()`, `groupBy()` — same SQL. |
| `include` (nested relations) | Drizzle relational queries (`db.query.x.findMany({ with: {...} })`) — one SQL statement with JSON subqueries. |

### 7.3 Unique keys with soft delete

Today `soft-delete.ts` appends `~deleted~<time>` to unique text columns and `upsert` revives deleted rows. In SQLite we can do better:

- Use **partial unique indexes**: `CREATE UNIQUE INDEX member_slug_live ON Member(slug) WHERE deletedAt IS NULL;`
- Then deleted rows never block a new value — no suffix needed, no revive needed (simpler `toggleLike` / `toggleRecommend`).
- Keep the suffix behaviour only if the admin UI depends on it (check `admin-workflows.service.ts` before deciding — open decision O-3).

### 7.4 Migrations workflow

```
edit workers/api/src/db/schema/*.ts
npx drizzle-kit generate            # writes migrations/NNNN_name.sql
npx wrangler d1 migrations apply forum500-staging --remote
npx wrangler d1 migrations apply forum500-prod --remote     # in CI, before deploy
```
Rules: additive first (expand → deploy code → contract later); never edit an applied migration; D1 Time Travel bookmark taken before every production migration (§30).

---

## 8. Transactions: redesign of every `$transaction`

D1 has **no interactive transactions** (`BEGIN … COMMIT` across awaits). It does have **`db.batch([...])`**, which runs a list of statements **atomically** (all or nothing). Two techniques cover every case:

- **T1 — plain batch:** all writes are known up front → one `batch()`.
- **T2 — guarded batch:** the decision depends on current data → put the condition **inside SQL** (`WHERE … AND NOT EXISTS (...)`, `UPDATE … RETURNING`, `INSERT … ON CONFLICT`) so the database decides atomically.
- **T3 — Durable Object:** strict ordering across requests (capacity limits) → serialize through one DO instance.

| # | Location | What it does | New design |
|---|---|---|---|
| 1 | `core/auth/auth.repository.ts:53` `consumeTokenAndSetPassword` | Mark token used + set password, bump `tokenVersion` | **T2**: batch `[UPDATE AuthToken SET usedAt=:now WHERE id=:t AND usedAt IS NULL, UPDATE User SET passwordHash=…, tokenVersion=tokenVersion+1 … WHERE id=:u AND EXISTS(SELECT 1 FROM AuthToken WHERE id=:t AND usedAt=:now)]`. Check `changes` of statement 2 = 1, else "token already used". Prevents double-use races too. |
| 2 | `comms/messages.repository.ts:50` `addMessage` | Insert message, bump `lastMessageAt`, mark sender read | **T1**: id + timestamp generated in code → 3 statements in one batch. Then notify `CHAT_ROOM` DO. |
| 3 | `membership/applications.repository.ts:41` approve application | Create User + Member, mark Application approved | **T2**: ids generated in code; batch `[INSERT User, INSERT Member, UPDATE Application SET status='approved' WHERE id=:a AND status='pending']`; put the status guard **first** and make the inserts conditional (`INSERT … SELECT … WHERE EXISTS (SELECT 1 FROM Application WHERE id=:a AND status='approved' AND decidedAt=:now)`) so a double-click cannot create two members. |
| 4 | `membership/profile.repository.ts:37` `updateProfile` | Update member, upsert N answers | **T1**: `UPDATE Member` + N × `INSERT … ON CONFLICT(memberId,questionId) DO UPDATE` in one batch. |
| 5 | `profile.repository.ts:51` `submitRevision` (array form) | Reject pending, create revision, set status | **T1** (already non-interactive). |
| 6 | `profile.repository.ts:68` `approveRevision` | Count approved → maybe publish; update member; upsert answers; approve revision; notification | **T2**: `isPublished = CASE WHEN NOT EXISTS (SELECT 1 FROM ProfileRevision WHERE memberId=:m AND status='approved') THEN 1 ELSE isPublished END` (run before the revision's own status update in the same batch); rest is T1. Guard revision update with `AND status='pending'`. |
| 7 | `profile.repository.ts:91` `rejectRevision` | Reject, set profileStatus from `isPublished`, notify | **T2**: `profileStatus = CASE WHEN isPublished THEN 'published' ELSE 'draft' END` in SQL; batch of 3. |
| 8 | `media/inforum.repository.ts:93` `toggleRecommend` | Toggle row + counter | **T2**: read the live row first. If it exists → batch `[UPDATE CommentRecommend SET deletedAt=:now WHERE id=:r AND deletedAt IS NULL, UPDATE Comment SET recommends=(SELECT count(*) FROM CommentRecommend WHERE commentId=:c AND deletedAt IS NULL) WHERE id=:c]`. If not → batch `[INSERT … ON CONFLICT DO NOTHING` (partial unique index, §7.3)`, same recount]`. **Recount instead of increment**, so the counter is always correct even when two toggles race; a racing duplicate insert becomes a no-op. |
| 9 | `inforum.repository.ts:114` `acceptPitch` | Create article, link pitch, notify | **T1** with guard `UPDATE Pitch … WHERE id=:p AND status='pending'` first; article insert conditional on it (as #3). |
| 10 | `inforum.repository.ts:126` `declinePitch` | Reject pitch, notify | **T1**; notification `INSERT … SELECT … FROM Pitch WHERE id=:p AND memberId IS NOT NULL`. |
| 11 | `media/feed.repository.ts:29` `toggleLike` | Toggle like + counter | Same as #8 (recount). |
| 12–13 | `core/prisma/soft-delete.ts:45` cascade delete | Recursive cascade / set-null / restrict | Walk the delete tree with reads first (§9) and build the list of `UPDATE … SET deletedAt, deletedBy` / `SET fk = NULL` statements, then run them as **one batch**. Restrict rules are re-checked inside the batch with a guard table: `CREATE TABLE _guard (ok INTEGER CHECK (ok = 1))` and first statement `INSERT INTO _guard SELECT NOT EXISTS (SELECT 1 FROM <child> WHERE <fk> IN (…) AND deletedAt IS NULL)` — a live child makes the CHECK fail, which aborts and rolls back the whole batch (→ 409). The batch ends with `DELETE FROM _guard`. |
| new | Event RSVP (open gap: capacity ignores plusOnes and races) | — | **T3**: `EVENT_RSVP` DO per event holds `seatsTaken` (loaded from D1 on first use); `rsvp()` checks `seatsTaken + 1 + plusOnes ≤ capacity`, writes D1 row, updates counter — serialized by the DO. |

**Batch limits to remember:** statements run in order, whole batch rolls back on any error, keep each batch < ~50 statements and well under the 30 s query limit.

---

## 9. Audit columns and soft delete without Prisma

Today `core/prisma/audit-trail.extension.ts` silently adds `deletedAt: null` to reads and stamps `createdBy/updatedBy`. Drizzle has no global query extension, so we make it **explicit and lint-enforced**:

| Piece | Design |
|---|---|
| `db/live.ts` → `live(table)` | Returns `isNull(table.deletedAt)`; every repository `where` uses `and(live(t), …)`. |
| Relational queries | `with: { posts: { where: live } }` helper `liveWith()`. |
| `stamp.create(row)` / `stamp.update(row)` | Adds `createdAt/updatedAt/createdBy/updatedBy` from the request context (`AsyncLocalStorage`). |
| `softDelete(db, table, ids)` | Port of `soft-delete.ts` driven by a **generated relation map** (`db/meta.ts`: child tables, FK columns, onDelete) instead of DMMF. |
| Hard delete ban | `scripts/check-layers.mjs` fails CI on `db.delete(` outside `softDelete`. |
| Missing-filter guard | `check-layers` also flags `.from(<table>)` / `db.query.<t>` calls in repositories without `live(` in the same expression (heuristic, plus code review). |
| Reading deleted rows on purpose | Repositories call `withDeleted(...)` — greppable, reviewed. |

---

## 10. API Worker design

### 10.1 Middleware order (mirrors `main.ts`)

| # | Middleware | Replaces |
|---|---|---|
| 1 | Request id + `AsyncLocalStorage` context | `requestContext.middleware` |
| 2 | `secureHeaders()` (Hono) | `helmet` |
| 3 | `cors({ origin: env.CORS_ORIGINS.split(','), allowMethods, allowHeaders, maxAge: 600 })` | `app.enableCors` |
| 4 | Body size guard: JSON ≤ 1 MB, multipart ≤ 25 MB | `useBodyParser(... '1mb')`, multer limit |
| 5 | Rate limit (`RL_DEFAULT` keyed by `CF-Connecting-IP`; `RL_AUTH` on auth routes) | `ThrottlerGuard`, `@Throttle` |
| 6 | Auth: verify JWT, load user, compare `ver` with `tokenVersion` (cache 60 s in memory per isolate) | `auth.guard.ts` |
| 7 | Role guard (`admin`) on `/api/admin/*` | decorators |
| 8 | Routes under `/api` | `setGlobalPrefix('api')` |
| 9 | `onError` → same JSON error shape | `all-exceptions.filter.ts` |

Client IP: **`CF-Connecting-IP`** (always set by Cloudflare) — replaces `trust proxy`.

### 10.2 Config

`core/config/env.ts` keeps the same zod schema, but reads from the Worker `env` object (bindings + vars + secrets) once per isolate. Remove `PORT`, `STORAGE_DRIVER`, `S3_*` (R2 binding), `TRUST_PROXY`. Add `TURNSTILE_SECRET`, `R2_ACCESS_KEY_ID/SECRET` (presign only), `SES_*` or `RESEND_API_KEY`.

### 10.3 Response compatibility

- Same paths, verbs, status codes, JSON field names. Dates serialized as ISO strings exactly as Prisma did (`toISOString()`).
- JSON columns returned as parsed objects; `String[]` columns as arrays (Drizzle `mode: 'json'` does this).
- Contract check: run `backends/test/api.e2e.test.mjs` against **both** APIs (§21).

---

## 11. Module-by-module port

| Area | Files today | Port notes | Est. days |
|---|---|---|---|
| `core/config` | `env.ts` | Read from Worker env | 0.25 |
| `core/common` | request-context, member-context, util, exceptions filter | ALS + Hono context; error mapper | 0.5 |
| `core/prisma` → `db/` | audit-trail extension, soft-delete, model-meta | §9; generator for relation map | 2 |
| `core/auth` | controller, guard, service, repository | jose, hash-wasm, lockout, invite/reset/change-password, Turnstile | 2 |
| `core/audit` | audit service/repo | Same table; writes join the caller's batch where today they are separate | 0.5 |
| `core/mail` | mail.service | Enqueue to Queue; templates unchanged | 0.5 |
| `core/notifications` | service/repo/data | Same; broadcast-read gap stays (needs `NotificationRead`) | 0.5 |
| `core/storage` | storage.service, file-sniff | R2 binding put/head/delete/range-get; presign via aws4fetch; `file-sniff.ts` copies over (works on `Uint8Array`) | 1 |
| `core/health` | health | `select 1` + R2 head | 0.1 |
| `modules/admin` | crud, metadata (DMMF), query, coerce, workflows, status effects, labels, dashboard, uploads, resources/* | **Largest piece.** `admin-metadata.service.ts` reads `db/meta.ts` generated from Drizzle schema (`getTableColumns`, enum arrays, relation map) in the same JSON shape `/admin/meta` returns today, so `frontends/admin` `lib/resource-registry.ts` is untouched. Generic CRUD builds Drizzle queries from that metadata. | 6 |
| `modules/membership` | applications, benefits, groups, members, profile | Transactions #3–#7; `json_each` for interests | 3 |
| `modules/comms` | actions, concierge, inbox, introductions, messages, whatsapp | Transaction #2; realtime publish; remove polling | 3 |
| `modules/events` | events, gallery, venues | RSVP DO; insensitive chapter lookup | 2 |
| `modules/media` | feed, inforum, publications | Transactions #8–#11 | 2 |
| `modules/site` | site (CMS) | KV cache for public endpoints (purge on admin write) | 1 |
| `modules/dashboard` | dashboard | Aggregates | 0.5 |
| Swagger | `/docs` | zod-openapi | 1 |
| **Total API port** | | | **~26 days** |

---

## 12. Authentication and passwords

| Topic | Plan |
|---|---|
| JWT | HS256 with the **same** `JWT_SECRET`, same payload `{ id, email, role, memberId, ver }`, same `JWT_EXPIRES_IN` → users stay logged in across cutover. |
| Existing password hashes | Node `argon2` default = argon2id, m=65536 KiB, t=3, p=4. `hash-wasm` `argon2Verify` reads params from the PHC string, so old hashes verify. Memory 64 MiB fits inside the 128 MB Worker isolate, but is tight. |
| New hashes | argon2id **m=19456 KiB, t=2, p=1** (OWASP minimum) to keep CPU/memory low on Workers. On successful login with an old-params hash → rehash and store (transparent upgrade). |
| CPU | Paid plan default 30 s CPU per request; argon2 verify ≈ 100–400 ms. Set `limits.cpu_ms = 5000` for headroom. |
| Lockout | Same `MAX_FAILED_LOGINS = 5`, `LOCK_MINUTES = 15` columns on `User`. |
| Rate limiting | `RL_AUTH`: 5 requests / 60 s per IP+email on login, forgot, reset, apply (matches today's `STRICT`). |
| Turnstile | On `/public/applications`, `/auth/forgot`, and on login after 2 failed attempts. |
| Token storage (open gap) | Optional improvement: move token from `localStorage` to an `HttpOnly; Secure; SameSite=Lax; Domain=.forum500.club` cookie — works because all apps share the `forum500.club` site. Separate decision (O-5). |
| Admin | Cloudflare Access (email OTP or Google) in front of `admin.forum500.club` + app login = two factors without building MFA. |

---

## 13. File storage (R2)

| Item | Plan |
|---|---|
| Buckets | `forum500-media` (prod), `forum500-media-staging`, `forum500-backups`, `forum500-next-cache` |
| Public access | Custom domain **`media.forum500.club`** on `forum500-media` (cache everything, `Cache-Control: public, max-age=31536000, immutable` already set on put). **Never change this domain later** — full URLs are stored in `Asset.url` and content fields. |
| Keys | Unchanged: `uploads/YYYY/MM/<uuid>.<ext>` (`storage.service.ts:newKey`) |
| Small upload | `POST /api/admin/uploads` multipart ≤ 25 MB → `sniffMime` → `env.MEDIA.put(key, bytes, { httpMetadata })` |
| Large upload | Existing two-step flow kept: `presign` (aws4fetch, 5 min, `Content-Type` signed) → browser PUT → `confirm`: `env.MEDIA.head(key)` + `env.MEDIA.get(key, { range: { offset: 0, length: 64 } })` → `sniffMime` on real bytes (stronger than today's header-only check). |
| R2 CORS | Allow `PUT` from `https://admin.forum500.club` (and member app if members upload), headers `Content-Type`. |
| Static files | `backends/static/assets/*` → upload once to `media.forum500.club/static/...`; rewrite references. |
| Image resizing | Optional later: Cloudflare Images transformations on `media.` (paid per unique transformation). Next `<Image>` set to `unoptimized` or a Cloudflare loader. |
| Deletion | `env.MEDIA.delete(key)` when an `Asset` is soft-deleted? **No** — keep files while the row is restorable; a monthly Cron purges objects whose asset was deleted > 30 days ago. |

---

## 14. Email (Queues + provider)

| Item | Plan |
|---|---|
| Producer | `MailService.send()` → `env.EMAIL_QUEUE.send({ to, subject, html, text, template, meta })` (returns immediately). |
| Consumer | `workers/email-consumer`: batch size 10, `max_retries: 5`, dead-letter queue `email-dlq`. |
| Provider | **Amazon SES via HTTPS API** (aws4fetch, `SendEmail` v2) — $0.10 / 1,000. Alternative **Resend** (free 3,000/mo, 100/day; then $20/mo). Cloudflare's own Email Service can replace both if GA and priced well at build time (open decision O-2). |
| Domain auth | SPF, DKIM (SES or Resend records), DMARC `p=quarantine` in Cloudflare DNS. |
| Tracking | Keep `EmailDelivery` rows; consumer updates status (`sent`/`failed`). |
| Inbound (optional) | Cloudflare Email Routing → `concierge@forum500.club` forwarded to staff. |

---

## 15. Real-time chat (Durable Objects)

Replaces `refetchInterval: POLL_MS` in `frontends/web/src/features/comms/queries.ts` (`useConversations`, `useConversation`, `useGroupChat`), used only by `comms/messages` and `comms/whatsapp` pages.

| Piece | Design |
|---|---|
| Durable Object `ChatRoom` | One instance per `conversation:<id>` and `group:<id>`; **WebSocket Hibernation API** so idle sockets cost nothing. |
| Connect | Browser calls `POST /api/v1/realtime/ticket` (JWT auth) → gets 60 s signed ticket listing allowed rooms → opens `wss://api.forum500.club/api/v1/realtime?ticket=…` → API Worker validates and forwards the upgrade to the DO. |
| Membership check | API checks participant / group membership before issuing the ticket. |
| Publish | After the D1 batch commits in `addMessage` / group post → `env.CHAT_ROOM.get(id).fetch('/publish', message)` → DO broadcasts. |
| Inbox list | A per-member DO `inbox:<memberId>` gets a lightweight "conversation X updated" event → client invalidates `qk.conversations`. |
| Frontend | New `useLiveChannel(room)` hook: on event → `queryClient.setQueryData` / `invalidateQueries`; on reconnect → refetch once. Remove `refetchInterval`. Keep `refetchOnWindowFocus`. |
| Fallback | If WebSocket fails 3× → fall back to 30 s polling (degraded mode). |
| Cost | Hibernated sockets are not billed for duration; incoming WS messages billed at 20:1. Negligible at our size. |

---

## 16. Scheduled jobs (Cron Triggers)

| Schedule | Job |
|---|---|
| `*/5 * * * *` | Publish rows with `status='scheduled' AND publishAt <= now` (articles, feed posts, editions) — closes the "scheduled publish not enforced" gap. |
| `0 * * * *` | Expire unused auth tokens; clear `lockedUntil` in the past. |
| `0 3 * * *` | Purge R2 objects of assets soft-deleted > 30 days; prune old `AuditLog`? (keep — decision O-6). |
| `0 7 * * 1` (optional) | Weekly member digest → `EMAIL_QUEUE`. |

Cron handler lives in the API Worker (`export default { fetch, scheduled, queue? }`), is idempotent, and logs a heartbeat to Healthchecks.io (free) so a missed run alerts.

---

## 17. Frontends on Workers (OpenNext)

| Step | `frontends/web` and `frontends/admin` |
|---|---|
| 1 | Add `@opennextjs/cloudflare` + `wrangler` dev deps; `open-next.config.ts` with **R2 incremental cache** (`forum500-next-cache`) — needed because `page-metadata.ts` uses `fetch(..., { next: { revalidate: 300 } })`. |
| 2 | `wrangler.jsonc`: `main: .open-next/worker.js`, `assets.directory: .open-next/assets`, `compatibility_flags: ["nodejs_compat"]`, `compatibility_date` pinned. |
| 3 | `NEXT_PUBLIC_API_URL=https://api.forum500.club/api` at **build** time (per environment). |
| 4 | Web app: service binding `API` → change `page-metadata.ts` to use the binding on the server (falls back to public URL in dev). |
| 5 | `next/image`: `images.unoptimized = true` (images already sized at upload) or a Cloudflare Images loader later. |
| 6 | Check bundle: must be < 10 MB compressed (paid). Both apps are client-heavy; expected well under. |
| 7 | Routes: `forum500.club/*` + `www.forum500.club/*` → `web-app`; `admin.forum500.club/*` → `admin-app`. |
| 8 | Remove `amplify.yml` from both apps after cutover. |

Next 15.5 is supported by current OpenNext; upgrading to Next 16 (open gap) should be done **before** this step or after go-live, not during.

---

## 18. Security

| Control | Setting |
|---|---|
| TLS | Cloudflare edge certs, "Always use HTTPS", HSTS (6 months, include subdomains) |
| WAF | Free managed rules on; custom rules: block non-`GET` to `media.`; challenge `/api/auth/*` from high-risk countries if abuse appears |
| Rate limiting | Workers Rate Limiting binding (in code) + one zone rate-limit rule on `/api/auth/*` |
| Bots | Bot Fight Mode on; Turnstile on public forms |
| Admin | Cloudflare **Access** policy: allow only listed admin emails; session 24 h |
| Secrets | `wrangler secret put` per environment; never in `wrangler.jsonc`; GitHub only holds `CLOUDFLARE_API_TOKEN` scoped to Workers/D1/R2 edit for this account |
| Least privilege | Separate R2 S3 API token limited to `forum500-media` (presign) and another to `forum500-backups` (backup job) |
| Headers | `secureHeaders()` + CSP on both Next apps (script-src self, Turnstile, Sentry) |
| Data | D1 and R2 encrypted at rest by Cloudflare; PII stays in one region (choose **location hint `weur`** for D1 to keep data in Western Europe — open decision O-1) |
| Audit | Existing audit log tables kept; Cloudflare account audit log for infra changes |

---

## 19. Environments, bindings, secrets

| Environment | Hostnames | D1 | R2 | Notes |
|---|---|---|---|---|
| local | `localhost:8787` (api), `:3001`, `:3002` | local (Miniflare) | local | `wrangler dev`, seeded |
| staging | `api.staging.forum500.club`, `staging.forum500.club`, `admin.staging.forum500.club` | `forum500-staging` | `forum500-media-staging` | Deployed from `develop`; Access-protected entirely |
| production | `api.`, apex/`www`, `admin.` | `forum500-prod` | `forum500-media` | Deployed from `main` |

**`workers/api/wrangler.jsonc` (outline)**

| Binding | Type | Name |
|---|---|---|
| `DB` | D1 | `forum500-<env>` |
| `MEDIA` | R2 | `forum500-media[-staging]` |
| `CHAT_ROOM` | Durable Object | class `ChatRoom` |
| `EVENT_RSVP` | Durable Object | class `EventRsvp` |
| `EMAIL_QUEUE` | Queue producer | `email-<env>` |
| `CACHE` | KV | `forum500-cache-<env>` |
| `RL_AUTH`, `RL_DEFAULT` | Rate limiting | 5/60s, 300/60s |
| triggers.crons | Cron | as §16 |

**Vars / secrets (mapping from today's `.env.example`)**

| Today | Plan 1 | Kind |
|---|---|---|
| `NODE_ENV` | `ENVIRONMENT` | var |
| `DATABASE_URL` | — (binding `DB`) | — |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | same | secret / var |
| `CORS_ORIGINS`, `PUBLIC_API_URL`, `WEB_APP_URL`, `ADMIN_APP_URL` | same | var |
| `ENABLE_SWAGGER` | same | var |
| `TRUST_PROXY`, `PORT` | removed | — |
| `RATE_LIMIT_PER_MINUTE` | binding config | — |
| `STORAGE_DRIVER`, `S3_BUCKET`, `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE`, `AWS_REGION` | removed (binding) + `R2_ACCOUNT_ID`, `R2_BUCKET` | var |
| — | `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` (presign only) | secret |
| `ASSET_PUBLIC_BASE_URL` | `https://media.forum500.club` | var |
| `MAIL_DRIVER`, `MAIL_FROM` | same (`log`/`ses`/`resend`) | var |
| — | `SES_ACCESS_KEY_ID`, `SES_SECRET_ACCESS_KEY`, `SES_REGION` or `RESEND_API_KEY` | secret (email-consumer only) |
| — | `TURNSTILE_SECRET`, `SENTRY_DSN` | secret |

---

## 20. CI/CD

| Workflow | Trigger | Steps |
|---|---|---|
| `api-worker.yml` | push/PR on `workers/api/**` | `npm ci` → `tsc --noEmit` → `check:layers` → unit tests (vitest-pool-workers) → `wrangler dev` + local D1 migrations + seed → **`test/api.e2e.test.mjs`** → on `develop`/`main`: Time Travel bookmark (prod) → `wrangler d1 migrations apply --remote` → `wrangler versions upload` → `wrangler versions deploy` (gradual: 10% → 100% after 10 min with no error-rate alert) |
| `email-consumer.yml` | `workers/email-consumer/**` | typecheck → deploy |
| `frontend-web.yml`, `frontend-admin.yml` | app paths | `npm ci` → `tsc` → `opennextjs-cloudflare build` → `opennextjs-cloudflare deploy` (env from GitHub environment) |
| `d1-backup.yml` | nightly cron | `wrangler d1 export forum500-prod --output=…sql` → gzip → upload to `forum500-backups/d1/YYYY/MM/DD.sql.gz` |
| `infra-cloudflare.yml` | `infra/cloudflare/**` | `terraform plan` on PR, `apply` on main (DNS, Access, WAF, buckets, queues) |

Auth: one `CLOUDFLARE_API_TOKEN` per GitHub environment (staging/production) + `CLOUDFLARE_ACCOUNT_ID`. Existing `backend-ci-deploy.yml` (ECS) and `infra-terraform.yml` (AWS) are disabled at cutover.

**Rollback:** `wrangler rollback` (previous version, seconds). DB rollback = D1 Time Travel restore to the pre-migration bookmark (§30).

---

## 21. Testing strategy

| Layer | Tool | What |
|---|---|---|
| Unit | Vitest | services, file-sniff, zod schemas, soft-delete planner, batch builders |
| Worker integration | `@cloudflare/vitest-pool-workers` | routes with real local D1/R2/DO/Queues |
| **Contract parity** | `backends/test/api.e2e.test.mjs` (196 lines, HTTP only) | Run **unchanged** against the NestJS API and the new Worker on identical seed data → both must pass. Extend it per module during the port. |
| Data migration | `scripts/verify-import.mjs` | Row counts per table, sample-record JSON diff, FK integrity (`PRAGMA foreign_key_check`) |
| Frontend smoke | Playwright (new, small) | login, directory search, event RSVP, chat send/receive in two browsers, admin edit + upload |
| Load | k6 (one-off) | 60 rps for 10 min on staging: p95 < 300 ms, no D1 "overloaded" errors |
| Concurrency | scripted | 20 parallel RSVPs on a 10-seat event → exactly 10 accepted; double-click approve → one member |

---

## 22. Data migration and cutover

### 22.1 Import script (`workers/api/scripts/import-from-postgres.mjs`)

1. Read from Postgres (`pg`), table by table in **FK dependency order** (generated from the relation map; cycles handled by inserting with nullable FK then updating).
2. Transform: uuids unchanged; `timestamptz` → epoch ms; arrays/JSON → JSON text; booleans → 0/1; asset URLs rewritten to `https://media.forum500.club/...`.
3. Write SQL files of `INSERT` statements (≤ 100 params each) → `wrangler d1 execute forum500-<env> --remote --file=…` (or D1 import API for larger files).
4. Copy media: current storage (local `backends/uploads/` or old bucket) → R2 with `rclone copy` (R2 S3 endpoint), same keys.
5. Verify (§21).

### 22.2 Cutover runbook (production)

| Step | Action | Owner |
|---|---|---|
| T-7 d | Staging fully on Plan 1; parity suite green; load test passed | dev |
| T-3 d | Dry-run import of a production snapshot into staging; time it | dev |
| T-1 d | Announce 30-min maintenance window; lower DNS TTL (Cloudflare proxied → instant anyway) | admin |
| T-0 | Old API: maintenance mode (read-only or 503) | dev |
| T+5 m | Final `pg_dump` → import → verify → media delta sync | dev |
| T+20 m | Point `api.forum500.club` route to the Worker; frontends already deployed against the same hostname | dev |
| T+25 m | Smoke tests (Playwright) on production | dev |
| T+30 m | Open traffic; watch error rate, D1 metrics, email DLQ for 2 h | dev |
| Rollback (≤ 24 h) | Route `api.` back to old API + restore old DB from its pre-cutover snapshot; any writes made on D1 in between are exported and replayed manually | dev |

---

## 23. Observability

| Need | Tool |
|---|---|
| Logs | Workers Logs (enable `observability` in wrangler), structured JSON with request id, user id, route, duration |
| Live debugging | `wrangler tail` |
| Errors | Sentry (`@sentry/cloudflare`), free 5k events/mo |
| Metrics | Workers & D1 analytics dashboards (requests, CPU, rows read/written, query duration) |
| Uptime | Better Stack / UptimeRobot free: `/api/health`, home page, admin login page |
| Jobs | Healthchecks.io heartbeats from Cron + backup workflow |
| Alerts | Cloudflare Notifications: Worker error-rate spike, D1 storage > 80%, usage-based billing threshold |

---

## 24. Backups and disaster recovery

| Layer | Mechanism | RPO | RTO |
|---|---|---|---|
| D1 Time Travel | Point-in-time restore any minute in the last 30 days (paid) | ~1 min | ~5 min |
| Nightly export | GitHub Actions `wrangler d1 export` → R2 `forum500-backups` (30-day lifecycle + monthly kept 12 months) | 24 h | ~30 min |
| Off-Cloudflare copy | Weekly copy of latest export to a non-Cloudflare store (e.g. Backblaze B2 free 10 GB, or a GitHub private release) | 7 d | hours |
| R2 media | No object versioning → nightly `rclone sync` to `forum500-backups/media/` (or B2); never delete originals in app code (§13) | 24 h | hours |
| Config | Everything in Git (`wrangler.jsonc`, Terraform) | — | — |

Restore drill every quarter: restore last night's export into `forum500-drill`, run parity tests, record timings.

---

## 25. Platform limits and how we stay inside them

| Limit (paid plan) | Value | Our usage / mitigation |
|---|---|---|
| D1 database size | 10 GB | < 1 GB at 500 users, ~2–5 GB at 10k (media lives in R2). Alert at 8 GB; split `AuditLog`/`EmailDelivery` into a second D1 database if ever needed. |
| D1 write model | Single writer per database | Our writes ≈ a few per second at peak — far below capacity (~hundreds/s for short queries). |
| Bound parameters per statement | 100 | Chunk helpers; `json_each(?)` for ID lists. |
| Columns per table | 100 | Max today 31. |
| Row / string size | 2 MB | Article bodies are text paragraphs — fine; never store files in D1. |
| Queries per Worker invocation | 1,000 | Admin CRUD lists use 1–3 queries; cascades batch. |
| Statement duration | 30 s | Indexes on every filter/sort column. |
| Worker memory | 128 MB | argon2 params (§12); stream large uploads to R2. |
| Worker CPU | 30 s default (configurable to 5 min) | Typical request < 20 ms. |
| Request body | 100 MB (Free/Pro zone) | Large uploads go direct to R2 via presign. |
| Worker script size | 10 MB compressed | API ~1–2 MB; Next apps checked in CI. |
| Read latency far from primary | — | Optional **D1 read replication** (Sessions API) for EU/US/Asia members later. |

---

## 26. Costs at 500 and 10,000 users

Assumptions: 20% daily active; ~60 API requests per active member per day; chat over WebSockets (no polling); 5 GB media at 500 users, 50 GB at 10k; ~2k emails/month at 500, ~50k at 10k; each API request reads ~50 rows and writes ~0.5 rows on average.

| Item | Included in $5 plan | 500 users usage | 500 users cost | 10k users usage | 10k users cost |
|---|---|---|---|---|---|
| Workers Paid base | — | — | **$5.00** | — | **$5.00** |
| Worker requests (API + 2 apps SSR) | 10M / mo | ~0.4M | $0 | ~6M | $0 |
| Worker CPU | 30M CPU-ms | ~6M ms | $0 | ~90M ms | ~$1.20 |
| D1 rows read | 25B / mo | ~15M | $0 | ~300M | $0 |
| D1 rows written | 50M / mo | ~0.2M | $0 | ~3M | $0 |
| D1 storage | 5 GB | < 1 GB | $0 | 2–5 GB | $0 |
| Durable Objects (chat, RSVP) | 1M req, 400k GB-s | tiny | $0 | ~1–3M req | ~$0–1 |
| Queues | 1M ops | ~6k | $0 | ~150k | $0 |
| KV | 10M reads | small | $0 | small | $0 |
| Workers Logs | 20M events | small | $0 | ~10M | $0 |
| R2 storage + ops (media, cache, backups) | 10 GB, 1M A, 10M B | ~8 GB | $0 | ~70 GB | ~$1.00 |
| Email | — | 2k (SES) | ~$0.20 | 50k (SES) | ~$5.00 |
| Turnstile, Access (≤ 50), WAF free, DNS | free | — | $0 | — | $0 |
| Sentry, uptime, Healthchecks | free tiers | — | $0 | — | $0 |
| **Total / month** | | | **≈ $5** | | **≈ $8–15** |

Optional add-ons: Cloudflare Pro zone $20/mo (managed WAF rules, image optimisation); Resend Pro $20/mo instead of SES.

**One-off costs:** ~5–7 developer-weeks of engineering (§28) — this is the real price of Plan 1.

---

## 27. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Rewrite introduces behaviour differences | High | High | Contract parity suite on both APIs; port module by module; parallel run |
| R2 | Missing `live()` filter shows deleted rows | Medium | Medium | Lint rule + tests per repository |
| R3 | Lost atomicity in a redesigned transaction | Medium | High | Every case in §8 has a concurrency test |
| R4 | argon2 memory pressure on Workers | Low | Medium | Lower params for new hashes; rehash on login |
| R5 | D1 10 GB ceiling | Low (years away) | High | Monitor; move logs/audit to a second D1; Plan 2/Neon as escape hatch |
| R6 | Vendor lock-in (bindings, DOs) | Certain | Medium | Keep business logic in services that take a repository interface; SQL stays standard SQLite |
| R7 | OpenNext/Next version drift | Medium | Low | Pin versions; upgrade Next separately |
| R8 | Fewer DB tools (no psql/BI) | Certain | Low | `wrangler d1 execute`, D1 console, nightly export into local SQLite for analysis |
| R9 | Single-region primary latency for far members | Low | Low | Read replication later |

---

## 28. Timeline and milestones

One developer, full time. Parallel tracks possible with two.

| Week | Milestone | Exit criteria |
|---|---|---|
| 1 | Foundations: Cloudflare account, zone, Workers Paid, Terraform skeleton, `workers/api` scaffold, Drizzle schema for all 58 tables, migrations, seed, `db/live.ts`, meta generator | `wrangler dev` serves `/api/health`; schema review done |
| 2 | Core: config, context, errors, auth (JWT, hash-wasm, lockout, invite/reset), audit, storage (R2 + presign), mail queue + consumer, rate limits | Auth part of parity suite passes |
| 3 | Admin module (metadata, generic CRUD, workflows, uploads, dashboard) | Admin app works unchanged against new API |
| 4 | Membership + events (incl. RSVP DO) + site (KV) | Parity suite for these modules green |
| 5 | Comms (+ chat DO, frontend `useLiveChannel`), media (feed, inforum, publications), dashboard; Cron jobs | Full parity suite green; two-browser chat test |
| 6 | Frontends on OpenNext, staging deploy, import script, load + concurrency tests, backups, monitoring | Staging signed off |
| 7 | Production dry-run import, cutover, 1-week hypercare | Go-live checklist complete |

---

## 29. Go-live checklist

- [ ] Workers Paid active; billing alerts set
- [ ] DNS: apex, `www`, `admin`, `api`, `media` proxied; HSTS on
- [ ] D1 `forum500-prod` created with location hint; migrations applied; Time Travel verified
- [ ] R2 buckets created; `media.` custom domain; CORS set; lifecycle rules on backups
- [ ] All secrets set per environment (`wrangler secret list` reviewed)
- [ ] Access policy on `admin.` tested with every admin email
- [ ] Turnstile keys live on apply / forgot / login
- [ ] SES production access granted (or Resend domain verified); SPF/DKIM/DMARC pass
- [ ] Parity suite, Playwright smoke, load test, concurrency tests green on staging
- [ ] Import dry-run timed; verification script passes
- [ ] Sentry receiving events; uptime monitors and Healthchecks heartbeats green
- [ ] Nightly D1 export ran at least twice; restore drill done once
- [ ] Rollback steps rehearsed
- [ ] Old ECS/Amplify/Render workflows disabled after hypercare

---

## 30. Runbooks

| Task | Steps |
|---|---|
| Deploy API | Merge to `main` → CI: tests → bookmark (`wrangler d1 time-travel info forum500-prod`) → migrations → versions deploy (gradual) |
| Roll back API code | `wrangler rollback --name forum500-api` (or Dashboard → Deployments) |
| Roll back a bad migration | `wrangler d1 time-travel restore forum500-prod --bookmark=<pre-deploy>` → `wrangler rollback` → fix forward |
| Restore from nightly export | create `forum500-restore` → `wrangler d1 execute --file=dump.sql` → verify → switch binding → deploy |
| Rotate JWT secret | set new secret → deploy → all users log in again (acceptable) — or support two secrets for 24 h |
| Investigate slow page | D1 dashboard → query insights → add index → migration |
| Email not arriving | Check `email-dlq` → consumer logs → provider dashboard → re-drive DLQ |
| Abuse / spam applications | Raise Turnstile mode; WAF custom rule; lower `RL_AUTH` |

---

## 31. Open decisions

| ID | Decision | Options | Recommendation |
|---|---|---|---|
| O-1 | D1 location | `weur` (UK/EU members), `enam`, … | Where most members are — likely `weur` (current AWS region is `eu-west-2`) |
| O-2 | Email provider | SES / Resend / Cloudflare Email Service | SES (cheapest, driver exists) |
| O-3 | Unique keys on soft delete | partial unique indexes vs `~deleted~` suffix | Partial indexes |
| O-4 | ORM | Drizzle vs Prisma D1 adapter | Drizzle |
| O-5 | Auth token storage | keep `localStorage` vs HttpOnly cookie | Cookie (same change is easy during rewrite) |
| O-6 | Audit log retention | forever vs N years | Forever until D1 > 5 GB, then archive yearly to R2 |
| O-7 | Cloudflare Pro ($20) | free vs Pro | Start free; Pro only if WAF managed rules / image optimisation needed |
| O-8 | Second developer | 1 vs 2 | 2 developers ≈ 4 weeks |
