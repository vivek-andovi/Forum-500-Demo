# Forum500 Monorepo

One git repository holds three independently deployable apps. The layout follows the andovi `monorepo`: backend and frontends live in separate folders, each with its own `package.json`, build and deploy pipeline.

```
forum500-monorepo/
├── backends/                 NestJS 11 API + Prisma + PostgreSQL   → Docker (Railway/Render/Fly/AWS)
│   ├── prisma/schema.prisma  single source of truth for all data (≈50 tables)
│   ├── prisma/seed/          seeds every record from the Lovable prototype
│   ├── src/core/             auth, audit, storage (S3), mail (SES), config, health
│   ├── src/modules/          membership · events · media · comms · site · dashboard · admin
│   │                         (each: controller → service → repository; DB access only in *.repository.ts)
│   ├── Dockerfile, docker-compose.yml (local Postgres)
├── frontends/
│   ├── admin/                Next.js admin portal (port 3001)        → Vercel project, root = frontends/admin
│   └── web/                  Next.js member app + public site (3000) → Vercel project, root = frontends/web
├── docs/
│   ├── API_CONTRACT.md       every endpoint and response shape
│   ├── DEPLOYMENT.md         how each app is deployed
│   └── prototype/            original Lovable code (reference only)
└── .github/workflows/        one workflow per app, triggered only by changes under its own folder
```

## How the pieces connect

```
 Admin portal (Next.js) ──/api/admin/*──┐
                                        ├──► NestJS API ──► PostgreSQL
 Member app (Next.js) ────/api/v1/*─────┤        │
 Public site ─────────────/api/public/*─┘        └──► /uploads, /static (S3/R2 in production)
```

- **Admins** create, edit, publish and unpublish everything, and approve member submissions.
- **Members** only see `status = published` content. Their own submissions go into the admin **Approvals** queue. These include event proposals, pitches, benefit offers, group proposals, comments, posts, profile updates and applications.

## Local setup

**Prerequisites:** Node 20 and Docker Desktop.

```bash
# 1. Database (Postgres 16 on localhost:5433)
cd backends && docker compose up -d          # add --profile aws for LocalStack (S3 + SES emulator)

# 2. API
cp .env.example .env
npm install
npx prisma migrate dev     # create tables
npm run db:seed            # load all prototype content
npm run start:dev          # http://localhost:4000/api   (Swagger: http://localhost:4000/docs)

# 3. Admin portal
cd ../frontends/admin && cp .env.example .env.local && npm install && npm run dev   # http://localhost:3001

# 4. Member app
cd ../web && cp .env.example .env.local && npm install && npm run dev              # http://localhost:3000
```

**Logins (seeded):**

| App | Email | Password |
|---|---|---|
| Admin portal | `admin@forum500.club` | `Admin@12345` |
| Member app | `anish@forum500.club` | `Member@12345` (every seeded member uses `<slug>@forum500.club` with the same password) |

## Deployment (AWS)

See [docs/AWS_SETUP.md](docs/AWS_SETUP.md) and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

| App | AWS | Trigger |
|---|---|---|
| `backends` | ECS Fargate + ALB, RDS Postgres, S3 + CloudFront, SES, Secrets Manager | push touching `backends/**` |
| `frontends/admin` | Amplify Hosting (admin.forum500.club) | push touching `frontends/admin/**` |
| `frontends/web` | Amplify Hosting (forum500.club) | push touching `frontends/web/**` |

## More docs
- [docs/BACKEND_ARCHITECTURE.md](docs/BACKEND_ARCHITECTURE.md) — modules, controller → service → repository layering, where every piece of content lives
- [docs/SECURITY.md](docs/SECURITY.md) — every security control and the known remaining items
- [docs/AUTH0.md](docs/AUTH0.md) — how to switch login to Auth0 (and Auth0 vs Cognito)
- [docs/API_CONTRACT.md](docs/API_CONTRACT.md) — endpoints and response shapes
