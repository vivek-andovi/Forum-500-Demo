# Forum500 API Contract (v0.1)

**Base URL (local):** `http://localhost:4000/api`. Swagger is served at `http://localhost:4000/docs`.

**Ports:**
| App | Port |
|---|---|
| API | 4000 |
| Member web (`frontends/web`) | 3000 |
| Admin (`frontends/admin`) | 3001 |

**Data model:** `backends/prisma/schema.prisma` is the source of truth.
- Every response object is the Prisma model as JSON: camelCase fields, ISO date strings.
- Some endpoints also return listed relations. These are noted under each endpoint.

**Static assets:**
- Prototype images are served at `http://localhost:4000/static/assets/<file>.jpg`.
- Uploaded files are served at `http://localhost:4000/uploads/<file>`.
- DB `*Url` fields store **absolute URLs**, so you can use them directly in `<img src>`.

**Errors:** `{ statusCode, message, error }`. `message` can be a string or a string[].

## Auth

### Endpoints
- **`POST /auth/login`** (limit: 10/min)
  - Body: `{ email, password }`
  - Returns: `{ accessToken, user: { id, email, role: "admin"|"member" }, member: Member|null }`
  - The account locks for 15 minutes after 5 failed attempts.
- **`POST /auth/forgot-password`** (limit: 5/min)
  - Body: `{ email }`
  - Always returns 200 and emails a reset link if the account exists.
- **`POST /auth/magic-link`** (limit: 5/min)
  - Body: `{ email }`
  - Always returns 200 and emails a one-click sign-in link if the account exists (members imported from forum.club often have no usable password).
- **`POST /auth/magic-link/consume`** (limit: 10/min)
  - Body: `{ token }` from the emailed link.
  - Returns the same shape as login.
- **`POST /auth/set-password`** (limit: 10/min)
  - Body: `{ token, password }`
  - Accepts an invite or reset token from the emailed link (`/auth/set-password?token=…`).
  - Returns the same shape as login.
  - Password rule: 10+ characters, with a letter and a number.
- **`GET /auth/me`** (Bearer token)
  - Returns: `{ user, member }`
- **`POST /auth/change-password`** (Bearer token)
  - Body: `{ currentPassword, newPassword }`
  - Returns: `{ accessToken }`. Other sessions are signed out.
- **`POST /auth/logout-all`** (Bearer token): invalidates every token the user holds.

### Tokens
- Send as `Authorization: Bearer <accessToken>`. Lifetime is `JWT_EXPIRES_IN` (default 60 days, matching the old forum.club site).
- Tokens stop working immediately when an admin suspends the user, changes their role or password, or uses "sign out everywhere".

### Which token each route needs
- `/admin/*` requires `role=admin`.
- `/v1/*` requires any logged-in user.
- `/public/*` is open.

**Health check:** `GET /health` is public and checks the database.

### Seeded logins
| Role | Email | Password |
|---|---|---|
| Admin | `admin@forum500.club` | `Admin@12345` |
| Member | `anish@forum500.club` | `Member@12345` (linked to member "Anish Malhotra") |

---

## Admin API (generic, metadata-driven)

### `GET /admin/meta`

Returns the description of every resource. The admin UI renders lists and forms from this.

```ts
type Meta = { resources: ResourceMeta[] }
type ResourceMeta = {
  name: string            // URL key, kebab-case plural, e.g. "members", "benefit-offers"
  label: string           // "Members"
  singular: string        // "Member"
  group: string           // sidebar group: "Membership" | "Events" | "Media" | "Communications" | "Configuration" | "System"
  model: string           // Prisma model name
  labelField: string      // field to display as the record title, e.g. "fullName"
  listColumns: string[]   // default table columns
  searchFields: string[]  // fields covered by ?search=
  defaultSort: { field: string; order: "asc" | "desc" }
  hasStatus: boolean      // has a `status` field (publish workflow)
  statusEnum?: string[]   // values of the status field
  readOnly?: boolean      // e.g. audit logs: no create/edit
  fields: FieldMeta[]
}
type FieldMeta = {
  name: string
  label: string
  type: "string" | "text" | "int" | "float" | "boolean" | "datetime" | "enum" | "string[]" | "json" | "relation" | "url" | "image"
  required: boolean       // required on create
  readOnly: boolean       // id, createdAt, updatedAt, computed
  hidden: boolean         // hide from the form (e.g. passwordHash)
  enumValues?: string[]
  relation?: { resource: string; labelField: string }  // for FK scalar fields such as "chapterId"
}
```

**Field types and the input to render:**
| Type | Input |
|---|---|
| `text` | textarea |
| `image` | image URL input + upload button + preview |
| `url` | URL input |
| `string[]` | tag input; the array is sent as JSON |
| `json` | JSON textarea |
| `relation` | async select backed by `/admin/options/:resource` |
| `datetime` | `datetime-local` input; send an ISO string |

### Generic CRUD

- **`GET /admin/r/:resource`**
  - Query parameters:
    - `page` (default 1), `pageSize` (default 20, max 100)
    - `search`
    - `sort` (field name) and `order` (`asc`|`desc`)
    - `status`
    - `filter.<field>=<value>`: equality filter, e.g. `filter.publication=inforum` or `filter.memberId=<uuid>`
  - Returns: `{ data: T[], total: number, page: number, pageSize: number }`
  - Each row includes `_label` (string) and, for every relation field, `_relations: { [fkField]: label }`.
- **`GET /admin/r/:resource/:id`**: returns `T`. Includes `_relations` labels for FK fields.
- **`POST /admin/r/:resource`**
  - Body: a partial `T`. Unknown, read-only and id fields are ignored. Empty strings become `null` for optional fields.
  - Returns: the created record.
- **`PATCH /admin/r/:resource/:id`**: same body rules as POST. Returns the updated record.
- **`DELETE /admin/r/:resource/:id`**: returns `{ ok: true }`.
- **`POST /admin/r/:resource/:id/status`**
  - Body: `{ status }`
  - Returns: the updated record. Works on any resource with `hasStatus`, except that a resource's
    `workflowStatuses` (in `/admin/meta`) can't be set or left this way: applications
    (`approved`, `rejected`, `waitlisted`), profile revisions and pitches (`approved`, `rejected`)
    are decided with the workflow endpoints below, because those decisions have side effects. → 400.
    PATCH never changes `status` on those resources.
- **`GET /admin/options/:resource?search=&ids=a,b`**
  - Returns: `{ id, label }[]` (max 50). Used by relation pickers.

### Workflows

- **`GET /admin/dashboard`**
  - Returns: `{ counts: { members, publishedMembers, upcomingEvents, applicationsNew, rsvps, benefitOffers, articles, groups }, approvals: ApprovalSummary[], upcomingEvents: Event[], recentApplications: Application[] }`
- **`GET /admin/approvals`**
  - Returns: `ApprovalSummary[]`
  - `ApprovalSummary = { key, label, resource, count, filter: Record<string,string> }`
  - Each entry links to `/admin/r/:resource` with that filter, e.g. `status=in_review`.
- **Applications:**
  - `POST /admin/applications/:id/approve`
    - Body: `{ note? }`
    - Creates a User (status `invited`, no password) and an unpublished Member, then emails a
      set-password invite link.
    - Returns: `{ application, member, invite }`. Outside production `invite.devLink` holds the link.
  - `POST /admin/applications/:id/reject`
    - Body: `{ note?, status?: "rejected"|"waitlisted" }`
- **Profile revisions:**
  - `POST /admin/profile-revisions/:id/approve` applies `changes` to the member and publishes it.
  - `POST /admin/profile-revisions/:id/reject`
    - Body: `{ note? }`
- **Pitches:**
  - `POST /admin/pitches/:id/accept` creates a draft Article (publication from section).
  - `POST /admin/pitches/:id/decline`
- **Users:**
  - `POST /admin/users/:id/send-invite` emails a set-password link. Outside production it returns `{ sent, devLink }`.
  - `POST /admin/users/:id/revoke-sessions` signs the user out of every device.
- **Uploads:**
  - `POST /admin/uploads` (multipart field `file`) returns `{ url, id }`.
    - The type is checked from the file's content; SVG and HTML are rejected.
    - Size limits: images 15 MB, PDF 50 MB, audio 150 MB.
  - Direct-to-S3 (large files), in three steps:
    1. `POST /admin/uploads/presign` with `{ filename, mime, size }` returns `{ key, uploadUrl, url }`.
    2. The browser sends a `PUT` to `uploadUrl`.
    3. `POST /admin/uploads/confirm` with `{ key, filename, mime, size }` returns `{ id, url }`.

### Resource names

| Group | Resources |
|---|---|
| Membership | `members`, `applications`, `profile-revisions`, `member-interviews`, `member-answers`, `benefit-offers`, `benefit-opt-ins`, `groups`, `group-memberships` |
| Events | `events`, `event-hosts`, `event-rsvps`, `venues`, `gallery-albums`, `gallery-photos`, `photo-tags` |
| Media | `articles`, `inforum-editions`, `edition-articles`, `inforum-sections`, `forecast-issues`, `pitches`, `recommendations`, `comments`, `podcast-episodes`, `books`, `book-recommendations`, `library-items`, `feed-posts` |
| Communications | `introductions`, `whatsapp-groups`, `whatsapp-memberships`, `whatsapp-messages`, `email-campaigns`, `notifications`, `action-items`, `concierge-requests` |
| Website | `pages`, `nav-items`, `content-cards`, `club-benefits`, `quick-prompts` |
| Configuration | `chapters`, `sectors`, `membership-tiers`, `profile-questions`, `benefit-categories`, `settings` |
| System | `users`, `assets`, `audit-logs` |

---

## Member API (`/v1`, Bearer required)

**Visibility rule:** members only ever receive `status = published` content. Their own submissions (proposals, pitches and so on) are returned only by the `mine` endpoints.

**Privacy rule:** other members are returned without `email`, `phone`, `userId` and `profileDraft`
(`MEMBER_PRIVATE` in `core/common/member-context.ts`). Only `GET /v1/members/:slug` keeps `email`.

### Me and profile
- **`GET /v1/me`**
  - Returns: `{ user, member }`
  - `member` includes `chapter`, `sector`, `tier`, `answers` (each with `question`), `groupMemberships` (with `group`), `benefitOffers`, `articles`, `podcastAppearances`.
  - It also returns `pendingRevision: ProfileRevision|null`.
- **`PATCH /v1/me/profile`** ("Save draft")
  - Member not yet in the directory (`isPublished = false`): saves directly; nobody else can see it.
  - Published member: stores the body in `member.profileDraft`; the live profile is unchanged until
    the member submits and an admin approves. `GET /v1/me` returns the draft so the form can show it.
  - Body fields: `fullName, headline, company, bio, avatarUrl, linkedinUrl, interests: string[], travelCities: string[], joinedYear, chapterId, sectorId`, and `answers: { questionId: string, answer: string }[]`.
- **`POST /v1/me/profile/submit`**
  - Body: same as PATCH.
  - Creates a pending ProfileRevision, sets `profileStatus = pending_review` and clears `profileDraft`.
  - On approval the changes go live; a member's first approval also publishes them (`isPublished = true`).
- **`GET /v1/lookups`**
  - Returns: `{ sectors: Sector[], chapters: Chapter[] /*isChapter=true*/, allChapters: Chapter[], profileQuestions: ProfileQuestion[], eventKinds: string[], venueCategories: string[], inviteAudiences: string[], supportOptions: string[], pitchFormats: string[], recommendationCategories: {id,label}[] }`

### Dashboard
- **`GET /v1/dashboard`**
  - Returns:
    ```
    { member, upcomingEvents: Event[], attending: Event[], hosting: Event[],
      newMembers: Member[] /* with interviews */, featuredOffers: BenefitOffer[], myOffers: BenefitOffer[],
      myGroups: Group[], memberArticles: Article[], podcasts: PodcastEpisode[],
      inforumArticles: Article[], whatsappGroups: WhatsappGroup[], introductions: Introduction[],
      actions: ActionItem[], emails: EmailCampaign[] }
    ```

### Directory
- **`GET /v1/members?search=&sectorId=&chapterId=`**
  - Returns: `Member[]` (published only), each with `chapter` and `sector`.
- **`GET /v1/members/new`**: returns `Member[]` where `featuredNewMember`, with `interviews` and `chapter`.
- **`GET /v1/members/:slug`**: returns `Member` with `chapter`, `sector`, `tier` and `answers.question`.

### Benefits
- **`GET /v1/benefits`**
  - Returns: `{ memberOffers: Offer[], partnerOffers: Offer[], optedInIds: string[], mySubmissions: BenefitOffer[] }`
  - `Offer = BenefitOffer & { category: BenefitCategory|null }`
- **`POST /v1/benefits/:id/optin`** and **`DELETE /v1/benefits/:id/optin`**: return `{ ok: true }`.
- **`POST /v1/benefits/submissions`**
  - Body: `{ title, category, offer, about?, detail?, howToRedeem? }`
  - Creates an `in_review` member offer.

### Groups
- **`GET /v1/groups`**
  - Returns: `{ groups: (Group & { memberCount: number, myStatus: string|null })[], myProposals: Group[] }`
- **`POST /v1/groups/:id/join`**: creates a membership with status `requested`.
- **`DELETE /v1/groups/:id/membership`**: withdraws a request or leaves the group.
- **`POST /v1/groups/proposals`**
  - Body: `{ name, purpose, cadence?, members? }`
  - Creates an `in_review` group.

### Events
- **`GET /v1/events`**
  - Returns: `Event[]` (published, ordered by `startsAt`), each with `venue` and `hosts.member`.
- **`GET /v1/events/:slug`**
  - Returns: `Event & { venue, hosts, myRsvp: EventRsvp|null, rsvpCount: number, address: string|null }`
  - `address` is set only when the member's RSVP is confirmed and the event starts within `addressRevealHours`.
- **`POST /v1/events/:id/rsvp`**
  - Body: `{ plusOnes?, dietaryNote? }`
  - Returns: `EventRsvp`.
- **`DELETE /v1/events/:id/rsvp`**: cancels the RSVP.
- **`GET /v1/events/mine`**
  - Returns: `{ hosting: Event[], attending: Event[], proposals: Event[] }`
- **`POST /v1/events/proposals`**
  - Body: `{ title, kind, city, date (YYYY-MM-DD), venueText?, description?, inviteAudiences: string[], supportRequested: string[] }`
  - Creates an `in_review` event with the member as host.
- **`GET /v1/venues`**: returns `Venue[]`.
- **`GET /v1/gallery/albums`**
  - Returns: `GalleryAlbum[]` with `photos`, plus `taggedPhotoIds: string[]` in the envelope: `{ albums, taggedPhotoIds }`.
- **`POST /v1/gallery/photos/:id/tag`** and **`DELETE /v1/gallery/photos/:id/tag`**
- **`GET /v1/gallery/mine`**: returns `(GalleryPhoto & { album })[]`.

### Media
- **`GET /v1/inforum/editions`**: returns `InforumEdition[]` (published, newest first).
- **`GET /v1/inforum/editions/:slug`** (use `current` for the newest)
  - Returns: `InforumEdition & { articles: (Article & { section })[] }`, in sort order.
- **`GET /v1/inforum/sections`**: returns `InforumSection[]`.
- **`GET /v1/inforum/recommendations`**: returns `Recommendation[]`.
- **`POST /v1/inforum/recommendations`**
  - Body: `{ category, title, place?, note? }`
  - Creates an `in_review` recommendation.
- **`GET /v1/inforum/comments`**
  - Returns: `Comment[]` (top level) with `replies`, plus `recommendedIds: string[]`, as `{ comments, recommendedIds }`.
- **`POST /v1/inforum/comments`**
  - Body: `{ body, parentId? }`
  - The comment is created as `in_review` and published by an admin.
- **`POST /v1/inforum/comments/:id/recommend`**: toggles the recommend. Returns `{ recommended, recommends }`.
- **`POST /v1/pitches`**
  - Body: `{ headline, synopsis, section, format, dateline?, notes? }`
- **`GET /v1/forecast`**: returns `ForecastIssue[]` with `articles`, newest first.
- **`GET /v1/podcasts`**: returns `PodcastEpisode[]`, ordered by number descending.
- **`GET /v1/books`**
  - Returns: `{ memberBooks: Book[], recommended: BookRecommendation[] /* with book */ }`
- **`GET /v1/reading`**: returns `BookRecommendation[]` where `isCuratedPick`.
- **`GET /v1/library`**: returns `LibraryItem[]`.
- **`GET /v1/articles?publication=member`**: returns `Article[]`.
- **`GET /v1/articles/:slug`**: returns `Article`.
- **`GET /v1/feed`**
  - Returns: `{ posts: FeedPost[] /* pinned first, newest */, likedIds: string[] }`
- **`POST /v1/feed`**
  - Body: `{ body, imageUrl? }`
  - Creates an `in_review` post.
- **`POST /v1/feed/:id/like`**: toggles the like. Returns `{ liked, likes }`.

### Comms
- **`GET /v1/introductions`**
  - Returns: `Introduction[]` where the member is the requester or the target, with `requester`, `target` and `introducer`.
- **`POST /v1/introductions`**
  - Body: `{ targetMemberId, reason }`
  - Creates an intro with status `requested`.
- **`POST /v1/introductions/:id/respond`**
  - Body: `{ accept: boolean }`
- **`GET /v1/whatsapp`**
  - Returns: `{ groups: WhatsappGroup[], memberships: WhatsappMembership[], openAccess: boolean }`
  - The invite link is included only for approved memberships, or on every group when `openAccess` (the `features.whatsappOpenAccess` setting) is on.
- **`POST /v1/whatsapp/:id/join`**: creates a membership with status `requested`, or `approved` straight away when `openAccess` is on (unless a host rejected the member before).
- **`GET /v1/emails`**: returns `EmailCampaign[]` (sent, delivered to the member or to all) with an `unread` flag. List fields only: no `body` or `html`.
  - `unread` is true only when the member has a delivery row they haven't opened. Campaigns sent to everyone (no delivery rows, like the imported newsletter archive) count as read.
- **`GET /v1/emails/:id`**: one email with its `body` and `html`. Opening it marks the member's delivery as read.
- **`GET /v1/notifications`**: returns `Notification[]` (the member's own plus broadcasts).
- **`POST /v1/notifications/:id/read`**
- **`GET /v1/actions`**: returns `ActionItem[]` (pending; the member's own or global).
- **`POST /v1/actions/:id/complete`**
- **`POST /v1/concierge`**
  - Body: `{ promptType?, body }`
- **`GET /v1/concierge`**: returns the member's requests.

## Site content (CMS)
- **`GET /public/site`**
  - Returns: `{ chapters, benefits: ClubBenefit[], settings: { name, tagline, footerBlurb, membershipBlurb, copyright }, navigation: { header: NavItem[], footer: NavItem[] } }`
  - `NavItem = { id, label, href|null, icon|null (lucide name), highlight, sortOrder, children: NavItem[] }`
- **`GET /public/pages/:slug`** (`home`, `about`, `inforum`, `apply`)
  - Returns: `Page & { cards: ContentCard[] }`
  - Page fields: `{ title, eyebrow, subtitle, body, heroImageUrl, heroImageAlt, ctaLabel, ctaHref, blocks: [{ key, eyebrow?, title?, body?, imageUrl?, imageAlt?, ctaLabel?, ctaHref? }], metaDescription }`
- **`GET /v1/site`**
  - Returns: `{ navigation: { sidebar: NavItem[] }, settings, pageHeaders: { [route]: { title, eyebrow, subtitle } } }`
- **`GET /v1/pages/:slug`**: member CMS page. Club rules is `membership%2Fclub-rules` (URL-encode the slash).
- **`GET /v1/concierge/prompts`**: returns `QuickPrompt[] { key, label, template, icon }`.
- **`GET /v1/inforum/tabs`** and **`GET /public/inforum/tabs`**: return `[{ id, label, type: 'editorial'|'section', sectionKey? }]`.

## Direct messages
- **`GET /v1/messages`**
  - Returns: `[{ id, otherMember, lastMessage: { body, createdAt, mine }|null, lastMessageAt, unread }]`
- **`POST /v1/messages`**
  - Body: `{ recipientMemberId, body }`
  - Returns: `{ conversationId, message }`. Each pair of members has exactly one conversation.
- **`GET /v1/messages/:conversationId`**
  - Returns: `{ id, otherMember, messages: [{ id, body, createdAt, senderId, senderName, mine }] }`
  - Opening a thread marks it read. Only the two participants can open it.
- **`POST /v1/messages/:conversationId`**
  - Body: `{ body }`
- **Limits:** messages up to 4000 characters; 30 requests per minute.

## WhatsApp group chat
Both endpoints are for approved members of the group only (or any member when `features.whatsappOpenAccess` is on, unless a host rejected them); anyone else gets 403.
- **`GET /v1/whatsapp/:groupId/messages`**
  - Returns: `[{ id, authorName, authorSlug, authorPhotoUrl, body, createdAt, mine }]`, oldest first.
- **`POST /v1/whatsapp/:groupId/messages`**
  - Body: `{ body }` (max 2000 characters)
  - Admins can moderate messages under Communications → WhatsApp Group Chat.

## Public API (no auth)
- **`GET /public/inforum/current`**: returns the current edition with published articles where `visibility=public` or `editorsChoice`, up to 4.
- **`GET /public/redirect?path=/old/forum.club/path/`**: where an old forum.club (WordPress) URL lives now. Returns `{ to: "/membership/jane-doe" }` or `{ to: null }`. The web app's not-found page uses it.
- **`POST /public/applications`**
  - Body: the apply-form fields `{ fullName, email, phone?, linkedin?, role, company, sector, city, country, travelCities?: string[], recommenderName, recommenderRelation?, whyJoin, contribution, about? }`
