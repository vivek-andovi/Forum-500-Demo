# Forum500 — Member app and public site (`frontends/web`)

A Next.js 15 (App Router) port of the Lovable/TanStack prototype in `docs/prototype`. It keeps the prototype's
look (Tailwind v4, Fraunces + Karla, shadcn/ui) and gets all of its data from the Forum500 NestJS API
(`docs/API_CONTRACT.md`).

## Stack

- Next.js 15.5, React 19, TypeScript, App Router with `src/`
- Tailwind CSS v4 (`@tailwindcss/postcss`, `tw-animate-css`); the theme is in `src/app/globals.css`
- shadcn/ui components (Radix) in `src/components/ui`
- TanStack React Query v5 for all API access (`src/features/*/queries.ts`), sonner for toasts, date-fns

## Setup

```bash
cd frontends/web
cp .env.example .env              # then edit if the API isn't on localhost:4000
npm install                       # if the global npm cache is broken: --cache ~/.npm-cache-forum500
npm run dev                       # http://localhost:3002
```

The API (`backends/`) must be running at `NEXT_PUBLIC_API_URL`. Seeded logins:

| Role   | Email                 | Password       |
|--------|-----------------------|----------------|
| Member | anish@forum500.club   | Member@12345   |
| Admin  | admin@forum500.club   | Admin@12345    |

An admin can sign in to the member area too. Admins have no member profile, so member-only actions are hidden.

## Environment

| Variable              | Example                       | Notes                                  |
|-----------------------|-------------------------------|----------------------------------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api`   | Base URL of the API, without a trailing slash |

The variable is inlined at build time, so set it in Vercel before you build.

## Scripts

| Script              | What it does                     |
|---------------------|----------------------------------|
| `npm run dev`       | Dev server on port 3000          |
| `npm run build`     | Production build                 |
| `npm run start`     | Serves the production build on port 3000 |
| `npm run typecheck` | Runs `tsc --noEmit`              |

## Structure

```
src/
  app/
    (public)/            /, /about, /apply, /auth, /inforum  (SiteHeader + SiteFooter)
    (member)/            auth-guarded member area (MemberSidebar + InforumBanner)
      layout.tsx         the only place that redirects on sign-out / 401 (to /auth?next=…)
      dashboard, ask-zola, membership/**, events/**, media/**, comms/**
      <page>/_components/  pieces of one big page (Next ignores folders starting with "_")
  features/              one folder per API domain, each with types.ts + queries.ts
    auth/                login, /v1/me, password policy (password.ts)
    membership/          members, profile, benefits, groups, applications
    events/              events, RSVPs, venues, gallery
    media/               In:Forum, Forecast, articles, podcasts, books, library, newsfeed, comments
    comms/               introductions, WhatsApp, email, notifications, actions, concierge, messages
    site/                CMS pages and copy, navigation, settings, lookups, dashboard bundle
  components/            shared UI: SiteHeader, SiteFooter, MemberSidebar, PageHeader, QueryState, Avatar,
                         MemberOnly, CollapsiblePanel, form.tsx (FormField + input classes), AuthCard,
                         media/ (Byline, ArticleImage, sectionName), ui/* (shadcn)
  hooks/useAuth.tsx      token state, current member, sign out
  lib/
    api.ts               fetch wrapper (Bearer token, error normalisation, 401 → sign out)
    query-keys.ts        every React Query key (`qk`), with the prefix overlaps documented
    query-utils.ts       useInvalidate, POLL_MS
    types/common.ts      shared base types (ISODate, Timestamps, ContentStatus, Visibility, …)
    format.ts            date, time, money and read-time helpers (dateLabel/timeLabel are preferred when present)
    event-calendar.ts    .ics download built from startsAt/endsAt
    photo.ts             copy / download gallery photos
```

### Where things live / how to add a page or feature

- **Types and hooks** for an endpoint go in `src/features/<domain>/types.ts` and `queries.ts`; import them
  from there (`@/features/events/queries`). Types mirror `backends/prisma/schema.prisma`.
- **New endpoint:** add the type, add a key to `qk` in `src/lib/query-keys.ts` (check the overlap notes at the
  top), then a `useX` hook in the domain's `queries.ts`. Mutations call `useInvalidate()` with every key they
  affect; errors are toasted globally (`components/providers.tsx`), so pages only add a success toast.
- **New page:** create `src/app/(member)/<area>/<name>/page.tsx` (client component). Start it with
  `<PageHeader pageKey="<area>/<name>" …>` so CMS copy can override the header, and wrap data in
  `<QueryState>` for loading / error / empty states. Add it to the sidebar from the admin console (navigation
  comes from the CMS).
- **Member-only actions:** admins can browse the member area but have no member profile. Wrap anything that
  needs a member in `<MemberOnly member={member} message="Admin account — no member profile…">`.
- **Big pages:** when a page grows past a few hundred lines, move sections into `<page>/_components/`. Keep
  state and data fetching in `page.tsx` and pass it down; move a component to `src/components/` only once a
  second page needs it.
- **Forms:** use `FormField` / `inputClass` from `components/form.tsx` (the In:Forum dialogs use
  `editorialFieldClass`, which is deliberately different).

### Auth

`POST /auth/login` returns an `accessToken`. The app stores it in `localStorage` under the key `forum500.token`.
The `(member)` layout is a client-side guard: with no token it redirects to `/auth`. It also checks the token
with `GET /v1/me`, and any 401 clears the token and redirects to `/auth`.

## Deploying to Vercel

1. Import the repository into Vercel.
2. Set **Root Directory** to `frontends/web`. Vercel detects the Next.js framework.
3. Add the environment variable `NEXT_PUBLIC_API_URL`, for example `https://api.forum500.club/api`.
4. Leave the build command (`next build`) and the output settings at their defaults.
5. On the API, allow the Vercel domain in CORS.
