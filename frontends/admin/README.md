# Forum500 Admin

Metadata-driven admin portal for Forum500 (Next.js 15 App Router, React 19, Tailwind v4, TanStack Query/Table).
A single generic engine renders every resource from `GET /admin/meta`. See `docs/API_CONTRACT.md` for the API.

## Setup

```bash
cd frontends/admin
npm install --cache /Users/plotify/.npm-cache-forum500 --no-audit --no-fund   # npm's global cache is broken on this machine
cp .env.example .env.local    # then edit if needed
npm run dev                   # http://localhost:3001
```

The API (`backends/`) must be running at `NEXT_PUBLIC_API_URL`, and CORS must allow the admin origin.
Seeded admin login: `admin@forum500.club` / `Admin@12345`.

## Environment

| Variable | Example | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api` | Base URL of the NestJS API, including `/api`. It is inlined at build time. |

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Starts the dev server on port 3001 |
| `npm run build` | Builds for production |
| `npm run start` | Serves the production build on port 3001 |
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
    layout/                  admin shell, sidebar, icon map
    common/                  page header, empty/error states, dialogs, status badge
    resource/                generic engine: table, editor, field inputs, workflow extras, related tabs
  lib/                       api client, auth, meta hooks, types, formatting helpers
```

How the engine works:
- **Lists** (`/r/:resource`) keep page, sort, search, status and `filter.<field>` in the URL, so filtered links work (for example `/r/event-rsvps?filter.eventId=…`).
- **Forms** take their inputs from each field's `type`.
- **New-record prefill:** `?prefill.<field>=value` fills in fields on the new page. `?returnTo=/path` controls where you go after saving.
- **Resource-specific additions** live in `components/resource/extras.tsx` (workflow actions) and `components/resource/related.tsx` (related-record tabs).

## Deploy to Vercel

1. Import the monorepo in Vercel and set **Root Directory** to `frontends/admin`.
2. Framework preset: Next.js. Keep the default build command (`next build`) and output settings.
3. Set the `NEXT_PUBLIC_API_URL` env var to the public API URL (for example `https://api.forum500.club/api`).
4. Add the admin's Vercel domain to the API's CORS allow-list.
