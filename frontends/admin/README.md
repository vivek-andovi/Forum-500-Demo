# Forum500 Admin

Metadata-driven admin portal for Forum500 (Next.js 15 App Router, React 19, Tailwind v4, TanStack Query/Table).
A single generic engine renders every resource from `GET /admin/meta`. See [`../../docs/API_CONTRACT.md`](../../docs/API_CONTRACT.md) for the API.

## Setup

```bash
cd frontends/admin
npm install
cp .env.example .env    # then edit if needed
npm run dev                   # http://localhost:3001
```

The API (`backends/`) must be running at `NEXT_PUBLIC_API_URL`, and CORS must allow the admin origin.
Seeded admin login: `admin@forum500.club` / `Admin@12345`. This is a public development password: change it (or delete the account) on any shared or production database.

## Environment

| Variable | Example | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api` | Base URL of the NestJS API, including `/api`. It is inlined at build time. |

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Starts the dev server on port 3001 |
| `npm run build` | Builds for production |
| `npm run start` | Serves the production build on port 3001 (or `$PORT` when set) |
| `npm run typecheck` | Runs `tsc --noEmit` |

## Structure

```
src/
  app/
    login/                   sign-in page (admins only)
    (admin)/layout.tsx       client auth guard + sidebar shell
    (admin)/page.tsx         dashboard
    (admin)/approvals/       approval queues
    (admin)/r/[resource]/    generic list, plus new/ and [id]/ editor pages
  components/
    ui/                      shadcn components copied from the prototype
    layout/                  admin shell, sidebar, group icons
    common/                  page header, empty/error states, dialogs, status badge
    resource/                generic engine
      resource-table.tsx     list = toolbar + filter chips + table + pagination (parts in table/)
      resource-editor.tsx    create/edit page (parts in editor/: header, record details, form model)
      extras/                per-resource workflow panels (approve, reject, invite…)
      related.tsx            related-record tabs under a record
      hooks.ts               mutations (status, delete, workflow actions) + cache invalidation
      field-*.ts(x), inputs/ form inputs by field type
  lib/
    resource-registry.ts     per-resource icon, related tabs, workflow panel; custom sidebar pages
    queries.ts               query keys + read hooks (useRecord, useList, useApprovals…)
    meta.ts                  /admin/meta hooks, resourceHref/recordHref link helpers
    api.ts, auth.tsx, types.ts, format.ts, utils.ts
```

How the engine works:
- **Lists** (`/r/:resource`) keep page, sort, search, status and `filter.<field>` in the URL, so filtered links work (for example `/r/event-rsvps?filter.eventId=…`).
- **Forms** take their inputs from each field's `type`.
- **New-record prefill:** `?prefill.<field>=value` fills in fields on the new page. `?returnTo=/path` controls where you go after saving.
- **Resource-specific additions** are all registered in `src/lib/resource-registry.ts`.
- **Links to a record** use `recordHref(resource, id)` from `lib/meta.ts` (it encodes the id); list links use `resourceHref`.

## How to…

**Add a resource.** Define it in `backends/src/modules/admin/resources/` (by group) so it appears in `GET /admin/meta`; the sidebar, list and editor follow automatically.
Optionally add an entry in `RESOURCES` (`src/lib/resource-registry.ts`) with an `icon`, and `related` tabs
(`{ resource: "event-rsvps", fk: "eventId", label: "RSVPs" }` lists child rows whose `fk` equals this record's id).

**Add a custom workflow panel.** Create `src/components/resource/extras/<resource>.tsx` exporting a component that takes
`ExtrasProps` (`resource`, `record`, `onChanged`). Wrap it in `WorkflowCard`, run actions with `useWorkflowMutation`
(from `components/resource/hooks.ts`, toasts for you) and call `onChanged()` in `onSuccess` so the editor reloads the record.
Register it as `Extras` on the resource in the registry. Set `hideForm: true` if the panel replaces the generic form (as for audit logs).

**Add a custom page.** Create `src/app/(admin)/<path>/page.tsx` (a client component; the `(admin)` layout handles auth and the shell),
put its data fetching in a hook in `src/lib/queries.ts`, and add `{ href, label, icon }` to `NAV_PAGES` in the registry to show it in the sidebar.

## Deploy to Vercel

1. Import the monorepo in Vercel and set **Root Directory** to `frontends/admin`.
2. Framework preset: Next.js. Keep the default build command (`next build`) and output settings.
3. Set the `NEXT_PUBLIC_API_URL` env var to the public API URL (for example `https://api.forum500.club/api`).
4. Add the admin's Vercel domain to the API's CORS allow-list.
