# Backend architecture

The NestJS API is organised **one module per hub of the member app**. Every module uses the same three layers.

```
Controller  →  Service  →  Repository  →  PostgreSQL (Prisma)
 HTTP only      business rules   database calls only
 (routes,       (permissions,    (queries, transactions,
  zod parse)     workflows,       includes/omits)
                 audit, emails)
```

**Rule:** only `*.repository.ts` files talk to the database. `npm run check:layers` enforces this, and CI fails if any other file imports `PrismaService`.

## Folder layout
```
backends/src/
├── main.ts, app.module.ts
├── core/                         shared infrastructure (no business features)
│   ├── auth/       login, invite/reset tokens, JWT guard        auth.repository.ts
│   ├── audit/      human-readable audit log                      audit.repository.ts
│   ├── storage/    S3 / local file storage, upload sniffing
│   ├── mail/       SES / console email
│   ├── health/     /api/health                                   health.repository.ts
│   ├── config/     env validation (fails fast in production)
│   ├── common/     zod helpers, URL/password rules, error filter, member-context
│   └── prisma/     PrismaService (the only DB client)
└── modules/
    ├── membership/ Member Directory, My Profile, Apply, Benefits, Groups
    ├── events/     Events Calendar & RSVP, My Events, Venues, Gallery
    ├── media/      In:Forum, Forecast, Podcasts/Radio, Books & Reading, Library, Articles, Newsfeed
    ├── comms/      Introductions, WhatsApp groups & chat, Messages (DMs), Emails, Notifications, Actions, Ask Zola
    ├── site/       CMS: pages, navigation menus, cards, club benefits, settings, lookups
    ├── dashboard/  member dashboard (reads through the other modules)
    └── admin/      generic admin CRUD for every table, approvals, workflows, uploads
```

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
| admin | admin portal | `admin-crud.*`, `admin-workflows.*`, `admin-dashboard.repository`, `uploads.controller`, `assets.repository` | `/admin/meta`, `/admin/r/:resource[...]`, `/admin/options/:resource`, `/admin/dashboard`, `/admin/approvals`, application/profile/pitch decisions, user invite/revoke, uploads |

## Adding a feature (checklist)
1. **Schema:** add the model to `prisma/schema.prisma`, then run `npx prisma migrate dev --name <change>`.
2. **Repository** (`<feature>.repository.ts`): all queries for the feature. Use `PUBLISHED` for member-facing reads, and omit private fields.
3. **Service** (`<feature>.service.ts`): validation schemas (zod), permission checks (`requireMember`), workflows, audit and notifications.
4. **Controller** (`<feature>.controller.ts`): routes only. Parse the body with `parseBody(schema, body)` and use `ParseUUIDPipe` for ids.
5. **Module:** register the controller, service and repository in the module.
6. **Admin:** add a line to `modules/admin/resources.ts`, and the table appears in the admin portal with list, create, edit, delete and status.
7. **Verify:** `npm run check:types && npm run check:layers`.

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
