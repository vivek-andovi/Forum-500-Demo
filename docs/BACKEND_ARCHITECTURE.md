# Backend architecture

The NestJS API is organised **one module per hub of the member app**. Every module uses the same three layers.

```
Controller  →  Service  →  Repository  →  PostgreSQL (Prisma)
 HTTP only      business rules   database calls only
 (routes,       (permissions,    (queries, transactions,
  zod parse)     workflows,       includes/omits)
                 audit, emails)
```

**Rules** (both enforced by `npm run check:layers`, which runs in CI):
1. Only `*.repository.ts` files talk to the database. Any other file that mentions `PrismaService`, `$queryRaw` or `$transaction` fails the check.
2. A module never imports another module's repository. Code in `src/modules/<a>/` may not import `src/modules/<b>/*.repository` (where a ≠ b). Each module **exports only its services**. To read another hub's data, inject that hub's service and add a small read method to it if one is missing (a thin pass-through is fine; see `dashboard.service.ts`). Shared needs go in a `core/` service, such as `NotificationsService` or `AuthService`.

## Folder layout
```
backends/src/
├── main.ts, app.module.ts
├── core/                         shared infrastructure (no business features)
│   ├── auth/          login, invite/reset tokens, JWT guard          auth.repository.ts
│   ├── audit/         human-readable audit log                        audit.repository.ts
│   ├── notifications/ in-app notifications (NotificationsService)     notifications.repository.ts
│   ├── storage/       S3 / local file storage, upload sniffing
│   ├── mail/          SES / console email
│   ├── health/        HealthModule: /api/health                       health.repository.ts
│   ├── config/        env validation (fails fast in production)
│   ├── common/        util.ts (zod helpers, URL/password rules, slugify/uniqueSlug, humanize),
│   │                  all-exceptions.filter.ts, member-context.ts
│   └── prisma/        PrismaService (the only DB client)
└── modules/
    ├── membership/ Member Directory, My Profile, Apply, Benefits, Groups
    ├── events/     Events Calendar & RSVP, My Events, Venues, Gallery
    ├── media/      In:Forum, Forecast, Podcasts/Radio, Books & Reading, Library, Articles, Newsfeed
    ├── comms/      Introductions, WhatsApp groups & chat, Messages (DMs), Emails, Notifications, Actions, Ask Zola
    ├── site/       CMS: pages, navigation menus, cards, club benefits, settings, lookups
    ├── dashboard/  member dashboard (reads through the other modules' services)
    └── admin/      generic admin CRUD for every table, approvals, workflows, uploads
        ├── admin-crud.service.ts           orchestrates list/get/options/create/update/remove/setStatus
        ├── admin-metadata.service.ts       DMMF → field metadata (/admin/meta), includes, row presentation
        ├── admin-query.ts                  list filter/sort/paging (pure)
        ├── admin-coerce.ts                 form body → validated Prisma data; Prisma error mapping
        ├── admin-status-effects.service.ts notify the member after an admin status change
        ├── admin-workflows.*               decisions with side effects (applications, profile reviews, pitches)
        └── resources/                      the admin resource registry (see "Adding an admin resource")
```

**Notifications.** Create in-app notifications with `NotificationsService` (global module). The one exception is a notification that must commit together with a decision inside a repository's Prisma transaction (profile review, pitch accept/decline). That repository writes it with `tx.notification.create({ data: approvalNotification(...) })` so the transaction stays atomic. `core/notifications/notification-data.ts` defines the notification shape once for both paths.

## Module → page → endpoint map

| Module | Member page | Files | Endpoints |
|---|---|---|---|
| membership | `/membership` | `members.*` | `GET /v1/members`, `/v1/members/new`, `/v1/members/:slug` |
| | `/membership/profile`, `/comms/account` | `profile.*` | `GET /v1/me`, `PATCH /v1/me/profile`, `POST /v1/me/profile/submit` |
| | `/apply` (public) | `applications.*` | `POST /public/applications` |
| | `/membership/benefits` | `benefits.*` | `GET /v1/benefits`, `POST/DELETE /v1/benefits/:id/optin`, `POST /v1/benefits/submissions` |
| | `/membership/groups` | `groups.*` | `GET /v1/groups`, `POST /v1/groups/:id/join`, `DELETE /v1/groups/:id/membership`, `POST /v1/groups/proposals` |
| events | `/events`, `/events/:slug`, `/events/my-events` | `events.*` | `GET /v1/events`, `/v1/events/mine`, `/v1/events/:slug`, `POST/DELETE /v1/events/:id/rsvp`, `POST /v1/events/proposals` |
| | `/events/venues` | `venues.*` | `GET /v1/venues` |
| | `/events/gallery` | `gallery.*` | `GET /v1/gallery/albums`, `/v1/gallery/mine`, `POST/DELETE /v1/gallery/photos/:id/tag` |
| media | `/media/inforum`, `/inforum` | `inforum.*` | `GET /v1/inforum/editions[/:slug]`, `/v1/inforum/sections`, `/v1/inforum/tabs`, `/v1/inforum/recommendations`, `/v1/inforum/comments`; `POST` recommendations, comments, `comments/:id/recommend`, `/v1/pitches`; public: `GET /public/inforum/current`, `/public/inforum/tabs` |
| | `/media/forecast`, `/podcasts`, `/forum-radio`, `/reading`, `/books`, `/library`, `/articles` | `publications.*` | `GET /v1/forecast`, `/v1/podcasts`, `/v1/books`, `/v1/reading`, `/v1/library`, `/v1/articles[/:slug]` |
| | `/media/newsfeed` | `feed.*` | `GET/POST /v1/feed`, `POST /v1/feed/:id/like` |
| comms | `/comms/introductions` | `introductions.*` | `GET/POST /v1/introductions`, `POST /v1/introductions/:id/respond` |
| | `/comms/whatsapp` | `whatsapp.*` | `GET /v1/whatsapp`, `POST /v1/whatsapp/:id/join`, `GET/POST /v1/whatsapp/:id/messages` |
| | `/comms/messages` | `messages.*` | `GET/POST /v1/messages`, `GET/POST /v1/messages/:conversationId` |
| | `/comms/emails`, `/comms/notifications` | `inbox.*` | `GET /v1/emails`, `GET /v1/notifications`, `POST /v1/notifications/:id/read` |
| | `/comms/actions` | `actions.*` | `GET /v1/actions`, `POST /v1/actions/:id/complete` |
| | `/ask-zola` | `concierge.*` | `GET/POST /v1/concierge`, `GET /v1/concierge/prompts` |
| site | layout, `/`, `/about`, page headers, club rules | `site.*` | `GET /public/site`, `/public/pages/:slug`, `GET /v1/site`, `/v1/pages/:slug`, `/v1/lookups` |
| dashboard | `/dashboard` | `dashboard.*` | `GET /v1/dashboard` |
| admin | admin portal | `admin-crud.*` (+ `admin-metadata`, `admin-query`, `admin-coerce`, `admin-status-effects`, `resources/`), `admin-workflows.*`, `admin-dashboard.repository`, `uploads.controller`, `assets.repository` | `/admin/meta`, `/admin/r/:resource[...]`, `/admin/options/:resource`, `/admin/dashboard`, `/admin/approvals`, application/profile/pitch decisions, user invite/revoke, uploads |

## Audit columns and soft delete

Every table has `id`, `createdAt`, `updatedAt`, `deletedAt`, `createdBy`, `updatedBy`, `deletedBy`
(the `*By` columns are free text: the app writes the acting User's id, scripts and imports may
write any label such as `"import"`; null = system, seed or a public form). Nothing here
is done by hand in repositories:

- `core/common/request-context.ts` keeps the signed-in user for the request (set by the auth guard,
  and by login / set-password on their public routes).
- `core/prisma/audit-trail.extension.ts` (applied in `PrismaService`) stamps `createdBy`/`updatedBy`
  on every write, nested writes included, and adds `deletedAt: null` to every read: top-level
  `where`, to-many `include`/`select`, `_count`, and `some`/`every`/`none` filters. `upsert` revives
  a soft-deleted row holding the same unique key. Hard `delete`/`deleteMany` throw.
- To delete, call `softDelete(db, 'Model', uniqueWhere)` or `softDeleteMany(db, 'Model', where)`
  from `core/prisma/soft-delete.ts` (`db` = `this.prisma` or a `$transaction` client). It applies each
  relation's `onDelete` like Postgres would (Cascade → soft-delete children, SetNull → clear the FK,
  Restrict → P2003) and frees single-column unique values (`slug~deleted~<time>`), so names, slugs
  and emails can be reused.
- For a toggle on a table with a compound unique key (likes, opt-ins), re-create with `upsert`,
  not `create`: the soft-deleted row still holds the key.
- To read deleted rows on purpose, put `deletedAt` in the top-level `where` (e.g. `...WITH_DELETED`).
- Raw SQL (`$queryRaw`) bypasses all of this; add `"deletedAt" IS NULL` yourself.

## Adding a feature (checklist)
1. **Schema:** add the model to `prisma/schema.prisma`, then run `npx prisma migrate dev --name <change>`.
2. **Repository** (`<feature>.repository.ts`): all queries for the feature. Use `PUBLISHED` for member-facing reads, and omit private fields (`MEMBER_PRIVATE`).
3. **Service** (`<feature>.service.ts`): validation schemas (zod), permission checks (`requireMember`), workflows, audit and notifications (`NotificationsService`). For another hub's data, inject that hub's **service**, never its repository.
4. **Controller** (`<feature>.controller.ts`): routes only. Parse the body with `parseBody(schema, body)` and use `ParseUUIDPipe` for ids.
5. **Module:** register the controller, service and repository. Put only services in `exports`.
6. **Admin:** add an entry to `modules/admin/resources/` (see below).
7. **Verify:** `npm run check:types && npm run check:layers && npm run build`.

## Adding an admin resource
`modules/admin/resources/` is the registry behind `/admin/meta` and `/admin/r/:resource`:
- `types.ts`: the `ResourceConfig` shape.
- One file per admin sidebar group: `membership.ts`, `events.ts`, `media.ts`, `communications.ts`, `website.ts`, `configuration.ts`, `system.ts`.
- `field-hints.ts`: `TEXT_FIELDS` (rendered as textareas) and `LINK_FIELDS` (URLs that are not images).
- `index.ts`: concatenates the groups into `RESOURCES`.

To add one, append an entry to the right group file. Entries appear in the sidebar in array order, and groups appear in the order `index.ts` lists them, so don't reorder existing entries. Field types, enums and relations come from the Prisma schema. The entry only adds presentation hints (`labelField`, `listColumns`, `searchFields`, `defaultSort`, `labels`, `hidden`, `readOnlyFields`, `defaultQuery`, `readOnly`, `noCreate`).

If an admin decision on the resource has side effects, such as creating a record, applying changes or emailing someone, list those statuses in **`workflowStatuses`** and implement the decision in `admin-workflows`. With that set, the generic `POST …/status` refuses to move a record into or out of those statuses, PATCH never changes `status`, and `/admin/meta` exposes the list so the UI shows decision buttons. For a plain "tell the member" effect, add a `case` to `admin-status-effects.service.ts` instead.

## Where the content lives (nothing hard-coded in the frontends)
| Content | Table | Admin section |
|---|---|---|
| Home, About, In:Forum, Apply page copy + images | `Page` (slugs `home`, `about`, `inforum`, `apply`) | Website → Pages & Page Headers |
| Title, eyebrow and intro of every member page | `Page` (slug = route, e.g. `membership/benefits`) | Website → Pages & Page Headers |
| "Engage with Forum" cards | `ContentCard` (placement `home_engage`) | Website → Page Cards |
| Member sidebar, public header and footer links | `NavItem` (menus `member_sidebar`, `site_header`, `site_footer`) | Website → Navigation Menus |
| About-page member benefits | `ClubBenefit` | Website → Club Benefits |
| Ask Zola quick prompts | `QuickPrompt` | Website → Ask Zola Prompts |
| Footer blurbs, tagline | `Setting` `site` | Configuration → Settings |
| In:Forum editorial tab labels | `Setting` `inforum_tabs` | Configuration → Settings |
| Event invite audiences, support options, recommendation categories | `Setting` `lookup_lists` (optional override) | Configuration → Settings |

Status-label and icon maps in the frontends are presentation, not content.
