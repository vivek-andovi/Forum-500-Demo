# Forum500 — Member app and public site (`frontends/web`)

A Next.js 15 (App Router) port of the Lovable/TanStack prototype in `docs/prototype`. It keeps the prototype's
look (Tailwind v4, Fraunces + Karla, shadcn/ui) and gets all of its data from the Forum500 NestJS API
(`docs/API_CONTRACT.md`).

## Stack

- Next.js 15.5, React 19, TypeScript, App Router with `src/`
- Tailwind CSS v4 (`@tailwindcss/postcss`, `tw-animate-css`); the theme is in `src/app/globals.css`
- shadcn/ui components (Radix) in `src/components/ui`
- TanStack React Query v5 for all API access (`src/lib/queries.ts`), sonner for toasts, date-fns

## Setup

```bash
cd frontends/web
cp .env.example .env.local        # then edit if the API isn't on localhost:4000
npm install                       # if the global npm cache is broken: --cache ~/.npm-cache-forum500
npm run dev                       # http://localhost:3000
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
    (public)/          /, /about, /apply, /auth, /inforum  (SiteHeader + SiteFooter)
    (member)/          auth-guarded member area (MemberSidebar + InforumBanner)
      dashboard, ask-zola, membership/**, events/**, media/**, comms/**
  components/          SiteHeader, SiteFooter, MemberSidebar, InforumBanner, EventsCalendar, PageHeader,
                       QueryState (loading/error/empty), Avatar, ui/* (shadcn)
  hooks/useAuth.tsx    token state, current member, sign out
  lib/
    api.ts             fetch wrapper (Bearer token, error normalisation, 401 → sign out)
    queries.ts         one React Query hook per endpoint; mutations invalidate related queries
    types.ts           types that mirror backends/prisma/schema.prisma
    format.ts          date, time, money and read-time helpers (dateLabel/timeLabel are preferred when present)
    event-calendar.ts  .ics download built from startsAt/endsAt
public/assets/         marketing images used directly by the public pages and banners
```

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
