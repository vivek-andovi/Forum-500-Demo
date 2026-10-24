# Plan 2 — Forum500 on AWS (Lambda + Aurora Serverless v2) with Cloudflare

> **Status:** plan only — nothing in this document has been built yet.
> **Prepared:** 2026-10-23 · **Applies to:** `Monorepo/` (NestJS API in `backends/`, Next.js apps in `frontends/web` and `frontends/admin`, Terraform in `infra/terraform`)
> **Providers:** AWS + Cloudflare only.
> **Region:** `eu-west-2` (London), as in the current Terraform and `env.ts`.
> **Prices:** approximate London list prices as last known — re-check the AWS Pricing Calculator for `eu-west-2` before committing.

---

## Table of contents

1. [Summary](#1-summary)
2. [Requirements and key decisions](#2-requirements-and-key-decisions)
3. [Target architecture](#3-target-architecture)
4. [Services used](#4-services-used)
5. [Network design (VPC without NAT)](#5-network-design-vpc-without-nat)
6. [Database: Aurora Serverless v2 (PostgreSQL)](#6-database-aurora-serverless-v2-postgresql)
7. [API: NestJS on Lambda](#7-api-nestjs-on-lambda)
8. [API Gateway + Cloudflare in front](#8-api-gateway--cloudflare-in-front)
9. [Side effects: the outbox (email, realtime, schedules)](#9-side-effects-the-outbox-email-realtime-schedules)
10. [Scheduled jobs (EventBridge Scheduler)](#10-scheduled-jobs-eventbridge-scheduler)
11. [Real-time chat (API Gateway WebSockets)](#11-real-time-chat-api-gateway-websockets)
12. [Files: S3 + CloudFront](#12-files-s3--cloudfront)
13. [Email: SES](#13-email-ses)
14. [Frontends on Cloudflare Workers](#14-frontends-on-cloudflare-workers)
15. [Security](#15-security)
16. [Configuration and secrets](#16-configuration-and-secrets)
17. [Infrastructure as code (Terraform)](#17-infrastructure-as-code-terraform)
18. [CI/CD](#18-cicd)
19. [Database migrations and admin access](#19-database-migrations-and-admin-access)
20. [Code changes required](#20-code-changes-required)
21. [Observability and alarms](#21-observability-and-alarms)
22. [Backups and disaster recovery](#22-backups-and-disaster-recovery)
23. [What scales automatically](#23-what-scales-automatically)
24. [Costs at 500 and 10,000 users](#24-costs-at-500-and-10000-users)
25. [Environments](#25-environments)
26. [Risks](#26-risks)
27. [Timeline](#27-timeline)
28. [Go-live checklist](#28-go-live-checklist)
29. [Runbooks](#29-runbooks)
30. [Open decisions](#30-open-decisions)

---

## 1. Summary

| | |
|---|---|
| **Edge (Cloudflare)** | DNS, CDN, WAF, DDoS, Turnstile, Access (admin), both Next.js apps on Workers, a small `api-edge` Worker in front of the API |
| **Compute (AWS)** | NestJS API as one Lambda function (container image, arm64) behind API Gateway HTTP API |
| **Database (AWS)** | **Aurora Serverless v2 PostgreSQL 16**: runs at **0.5 ACU** (≈1 GB RAM) when quiet, **pauses to 0** when idle, **scales up automatically** in 0.5 ACU steps under load (max 4 ACU at 500 users, 8–16 at 10k) |
| **Side effects** | Outbox in DynamoDB → Streams → worker Lambda: SES email, WebSocket pushes, one-time schedules |
| **Files** | S3 (private) + CloudFront (`media.forum500.club`) — reuses `infra/terraform/modules/storage` |
| **Networking** | VPC with **no NAT gateway** (free S3 + DynamoDB gateway endpoints) — saves ~$36+/month |
| **Code impact** | Same NestJS + Prisma + Postgres; ~15 targeted changes (§20). No rewrite. |
| **Effort** | ~2 weeks without realtime chat, ~3 weeks with it |
| **Run cost** | ≈ **$30–40/month** at 500 users · ≈ **$120–165/month** at 10,000 users (Aurora is most of it; a fixed small RDS instance gives ≈ $20–25 / $60–75 — §6.9) |

---

## 2. Requirements and key decisions

| Requirement (from you) | Decision |
|---|---|
| AWS + Cloudflare only | No other providers; Sentry/uptime SaaS replaced by CloudWatch + Cloudflare Health Checks |
| Serverless API | Lambda (pay per request, scales to zero) |
| "Very low power DB that scales when utilisation is high" | Aurora Serverless v2: min 0 / 0.5 ACU, auto-scales on CPU/memory/connections, auto-pause when idle |
| 500 users now, max 10k | Same architecture for both; only ACU max, Lambda concurrency and alarms change |
| Chat polling can change | Phase 1: load-on-open + refetch on focus/send; Phase 2: WebSockets (§11) |

| Key decision | Chosen | Rejected and why |
|---|---|---|
| Lambda networking | **In VPC, no NAT**; S3 + DynamoDB via free gateway endpoints; everything that needs internet runs in a worker Lambda outside the VPC | NAT Gateway (~$36/mo + data, more than the API itself at 500 users); public Aurora (DB open to the internet) |
| DB | **Aurora Serverless v2** | RDS t4g (cheaper but no automatic compute scaling — kept as fallback §6.9); Aurora DSQL (no foreign keys/triggers, poor Prisma fit); DynamoDB (rewrite) |
| Connection handling | Prisma driver adapter + `pg` pool of 1 per Lambda, short idle timeout, capped Lambda concurrency | RDS Proxy (billed on a minimum of 8 ACU ≈ $80+/mo, and keeps the DB from pausing) |
| API packaging | **Lambda container image** (arm64) from ECR | Zip (native `argon2` + Prisma engines + 250 MB unzipped limit = fragile) |
| API entry | **API Gateway HTTP API** with custom domain | Function URL (no custom domain; host-header tricks needed behind Cloudflare); REST API (3.5× price) |
| Media | **S3 + CloudFront** (existing module, 1 TB/month free egress) | R2 (would need internet egress from the VPC) |
| Frontends | **Cloudflare Workers** (OpenNext) | Amplify (existing module) — more expensive, and Cloudflare is already the edge |

---

## 3. Target architecture

```
                              Cloudflare (zone forum500.club)
 ┌────────────────────────────────────────────────────────────────────────────────────┐
 │ DNS · TLS · CDN · WAF · DDoS · Bot Fight · Turnstile · Access                       │
 │                                                                                    │
 │ forum500.club, www ──► Worker web-app   (Next.js, OpenNext) ─┐ service binding     │
 │ admin.forum500.club ─► Access ─► Worker admin-app (Next.js) ─┤                     │
 │ api.forum500.club ───► Worker api-edge ◄─────────────────────┘                     │
 │                         · adds X-Origin-Verify secret · Turnstile check · rate limit│
 │ rt.forum500.club ────► (proxied, WebSockets) ──────────────────────────┐           │
 │ media.forum500.club ─► DNS only (grey cloud) ──────────────────┐       │           │
 └─────────────────────────────────┼──────────────────────────────┼───────┼───────────┘
                                   │ HTTPS                        │       │ WSS
 AWS eu-west-2                     ▼                              ▼       ▼
 ┌────────────────────────────────────────────────────────────────────────────────────┐
 │ API Gateway HTTP API (api.forum500.club, default endpoint disabled)                │
 │        │                                         CloudFront ── OAC ──► S3 media     │
 │        ▼                                         API GW WebSocket API (rt.)         │
 │ ┌───────────────────────── VPC (2 private subnets, NO NAT) ───────────────────┐    │
 │ │ Lambda api (NestJS, container, arm64)        Lambda migrate (same image)     │    │
 │ │ Lambda jobs (same image, scheduled entry)                                    │    │
 │ │        │ 5432 (TLS)                                                          │    │
 │ │        ▼                                                                     │    │
 │ │ Aurora Serverless v2 PostgreSQL 16  (0 ↔ 0.5 … 4/16 ACU)                     │    │
 │ │                                                                              │    │
 │ │ Gateway endpoints (free): S3 ── media bucket · DynamoDB ── outbox, ws tables │    │
 │ └──────────────────────────────────────────────────────────────────────────────┘    │
 │        │ PutItem (outbox)                                                          │
 │        ▼                                                                           │
 │ DynamoDB outbox ──Streams──► Lambda worker (outside VPC, has internet)             │
 │                                 ├─► SES (email)                                    │
 │                                 ├─► WebSocket @connections (chat push)             │
 │                                 └─► EventBridge Scheduler (one-time publish jobs)  │
 │                              failures ─► SQS DLQ ─► CloudWatch alarm               │
 │ EventBridge Scheduler ─► Lambda jobs (daily cleanup, scheduled publish)            │
 │ CloudWatch Logs/Alarms ─► SNS email · AWS Budgets                                  │
 └────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Services used

| Provider | Service | Purpose | Existing Terraform |
|---|---|---|---|
| Cloudflare | DNS, CDN, WAF (free rules), DDoS, Bot Fight | Edge for all hostnames | new `infra/cloudflare` |
| Cloudflare | Workers Paid ($5) | `web-app`, `admin-app`, `api-edge` | new |
| Cloudflare | Turnstile, Access (≤ 50 users free), Health Checks / Notifications | Bot check, admin login wall, alerts | new |
| AWS | Lambda | `api`, `migrate`, `jobs` (in VPC); `worker`, `ws-connect`, `ws-disconnect` (outside VPC) | replaces `modules/api` (ECS) |
| AWS | API Gateway HTTP API | `api.forum500.club` | new |
| AWS | API Gateway WebSocket API | `rt.forum500.club` (Phase 2) | new |
| AWS | Aurora Serverless v2 (PostgreSQL 16) | Main database | replaces `modules/database` (RDS) |
| AWS | DynamoDB (on-demand) + Streams | Outbox, WebSocket connections | new |
| AWS | SQS | Dead-letter queue for the outbox | new |
| AWS | EventBridge Scheduler | Cron + one-time schedules + DB capacity schedules | new |
| AWS | S3 + CloudFront (OAC) | Media | **reuse** `modules/storage` |
| AWS | SES | Email | **reuse** `modules/email` (DNS records → Cloudflare) |
| AWS | ECR | Lambda image | **reuse** `modules/registry` |
| AWS | ACM | Certs: regional (API GW), us-east-1 (CloudFront) | — |
| AWS | SSM Parameter Store | Secrets source for deploys | — |
| AWS | CloudWatch, SNS, AWS Budgets | Logs, alarms, cost alerts | **reuse** `modules/monitoring` |
| AWS | IAM + GitHub OIDC | CI deploys without long-lived keys | **reuse** `modules/github_oidc` |
| AWS | CloudShell (VPC environment), RDS Query Editor | DB admin access without a bastion | — |
| Removed | NAT Gateway, ALB, ECS, AWS WAF, Amplify, Route 53 | — | `network`, `api`, `waf`, `frontend` modules |

---

## 5. Network design (VPC without NAT)

### 5.1 Layout

| Item | Value |
|---|---|
| VPC | `10.20.0.0/16`, DNS hostnames + resolution on |
| Subnets | 2 **private** subnets in `eu-west-2a` and `eu-west-2b` (Aurora needs ≥ 2 AZs); **no public subnets, no Internet Gateway, no NAT** |
| Gateway endpoints (free) | `com.amazonaws.eu-west-2.s3`, `com.amazonaws.eu-west-2.dynamodb` on the private route table |
| SG `lambda` | Inbound: none. Outbound: 5432 → SG `db`; 443 → S3 and DynamoDB managed prefix lists |
| SG `db` | Inbound: 5432 from SG `lambda` and SG `admin-shell`. Outbound: none |
| SG `admin-shell` | For CloudShell VPC environment (§19); outbound 5432 → SG `db` |

### 5.2 What needs the internet — and where it runs

| Call | Needs internet? | Runs in |
|---|---|---|
| Postgres | no (VPC) | api / jobs / migrate |
| S3 put/head/delete, presign | no (gateway endpoint; presign is local signing) | api |
| DynamoDB outbox write | no (gateway endpoint) | api |
| JWT, argon2 | no (local) | api |
| SES send | yes | **worker** (outside VPC) |
| WebSocket push (`@connections`) | yes | **worker** |
| Create one-time EventBridge schedules | yes | **worker** |
| Turnstile siteverify | yes | **Cloudflare `api-edge` Worker** |
| Future Stripe API calls | yes | add NAT later (§30, D-6) |

### 5.3 When to add NAT

Only when the API itself must call an external API **synchronously** (e.g. Stripe checkout). Then add either a NAT Gateway in one AZ (~$36/mo + $0.05/GB) or route that call through the worker. Documented as decision D-6.

---

## 6. Database: Aurora Serverless v2 (PostgreSQL)

### 6.1 Why it fits "low power, scale when busy"

| Property | Behaviour |
|---|---|
| Unit | **ACU** ≈ 2 GiB RAM + proportional CPU and network |
| Minimum | **0 ACU** (paused, pay storage only) or 0.5 ACU (smallest running size) |
| Scaling | Automatic, in 0.5 ACU steps, within seconds, based on CPU, memory and connections; no restart, no dropped connections |
| Auto-pause | With min = 0, the instance pauses after N seconds with **no connections** (configurable, min 300 s); the next connection resumes it in **~15 s** |
| Storage | Grows automatically (to 128 TiB); billed per GB-month |
| Engine | PostgreSQL 16.x (scale-to-zero needs 16.3+); same SQL as local Docker Postgres 16 → Prisma schema and migrations unchanged |

### 6.2 Configuration

| Setting | staging | production (500 users) | production (10k users) |
|---|---|---|---|
| Engine | aurora-postgresql 16.x (latest minor) | same | same |
| Instance class | `db.serverless` | same | same |
| Min ACU | **0** | **0** (pauses at night) — or business-hours floor (6.4) | **0.5** (always on) |
| Max ACU | 2 | **4** | **8** (raise to 16 if alarms fire) |
| Seconds until auto-pause | 300 | 900 | n/a |
| Instances | 1 writer | 1 writer | 1 writer + **1 reader in the other AZ** (optional HA, promotion tier 1, scales with writer) |
| Storage type | Aurora Standard | Aurora Standard | Standard (switch to I/O-Optimized if I/O > ~25% of the bill) |
| Encryption | KMS (AWS-managed key) | same | same |
| Backup retention (PITR) | 1 day | **14 days** | **35 days** |
| Deletion protection | off | **on** | **on** |
| Performance Insights | off | on (free 7-day tier) | on |
| Data API (`enable_http_endpoint`) | on | on (only for the console Query Editor) | on |
| Master password | RDS-managed in Secrets Manager | same | same |
| App user | `forum500_app` (owner of the `forum500` DB, not `rds_superuser`) | same | same |

### 6.3 Cluster parameter group

| Parameter | Value | Why |
|---|---|---|
| `rds.force_ssl` | 1 | TLS only |
| `idle_session_timeout` | 300000 (5 min) | Server closes forgotten idle sessions so the cluster can pause |
| `idle_in_transaction_session_timeout` | 60000 | No stuck transactions |
| `statement_timeout` (role-level for `forum500_app`) | 25s | Below API Gateway's 30 s limit |
| `shared_preload_libraries` | `pg_stat_statements` | Slow-query insight |
| `log_min_duration_statement` | 500 | Slow-query log to CloudWatch |
| `max_connections` | default | Aurora derives it from **max ACU**; at 4 ACU it is in the hundreds — far above our cap (6.5) |

### 6.4 Business-hours floor (optional, recommended at 500 users)

The first request after a pause waits ~15 s (DB resume) + ~2 s (Lambda cold start). To avoid that during the day without paying at night:

| Schedule (EventBridge Scheduler, universal target `rds:ModifyDBCluster`) | Effect |
|---|---|
| 06:30 Europe/London | `ServerlessV2ScalingConfiguration.MinCapacity = 0.5` → DB resumes and stays on |
| 23:30 Europe/London | `MinCapacity = 0` → DB pauses after 15 min idle |

No Lambda needed; free. The frontend shows a "Waking up…" state if an API call takes > 3 s (C-14).

### 6.5 Connections from Lambda

| Control | Value |
|---|---|
| Prisma | **Driver adapter `@prisma/adapter-pg`** with a `pg.Pool({ max: 1, idleTimeoutMillis: 60_000, connectionTimeoutMillis: 20_000, ssl: { ca: <RDS global bundle> } })` — closes idle connections after 60 s so Aurora can pause, and the 20 s timeout covers a resume |
| Rust-free client | Prisma 6.16+ supports the query-compiler (no Rust engine) with driver adapters — smaller image, faster cold start. **Spike first** on our Prisma 6.19.3; fallback = classic engine with `binaryTargets = ["native", "linux-arm64-openssl-3.0.x"]` and `connection_limit=1` in the URL |
| Lambda reserved concurrency (`api`) | 50 at 500 users, 100 at 10k → at most 50/100 DB connections |
| `jobs`, `migrate` | reserved concurrency 2 and 1 |
| RDS Proxy | not used (cost, prevents pause) — revisit only if connection errors appear above ~150 concurrent Lambdas |

### 6.6 Things that would stop the DB from pausing (avoid them)

| Trap | Fix |
|---|---|
| Uptime monitor calling `/api/health`, which runs `SELECT 1` (`core/health/health.repository.ts:9`) | Split: `/api/health` = liveness, **no DB**; `/api/health/ready` = DB check, used only by deploys (C-12) |
| Lambda keep-warm pings that hit the DB | Keep-warm (if used) calls `/api/health` (no DB) |
| A cron every 5 minutes for scheduled publish | One-time schedules at the exact `publishAt` (§10) |
| Long-lived idle Prisma connections in warm Lambdas | Pool `idleTimeoutMillis: 60_000` + `idle_session_timeout` |
| Performance Insights / monitoring | Do **not** keep connections open; fine |

### 6.7 Indexing and query hygiene

Run `pg_stat_statements` weekly for the first month; every filter/sort column used by admin lists and member directory gets an index via a normal Prisma migration. Lower CPU = lower ACU = lower bill.

### 6.8 How it scales from 500 to 10k

| Load | Expected ACU | Notes |
|---|---|---|
| Night, nobody online | 0 (paused) | 500-user setup |
| Quiet day | 0.5 | Minimum running size |
| Busy hour at 500 users | 0.5–1 | — |
| Busy hour at 10k users (30–60 rps) | 1–3 | Scales in seconds |
| Spike (newsletter sent, event launch) | up to max (4/8) | Raise max if `ACUUtilization` > 90% often |

### 6.9 Cheaper fallback: fixed RDS PostgreSQL (no automatic compute scaling)

If cost matters more than automatic scaling, the existing `modules/database` (RDS) can stay with smaller settings:

| | Aurora Serverless v2 (chosen) | RDS `db.t4g.micro` → `small` (fallback) |
|---|---|---|
| Compute scaling | automatic, seconds | manual class change (~5–10 min downtime single-AZ); burst CPU credits absorb short spikes |
| Pause when idle | yes (min 0) | no (stop/start manually, max 7 days stopped) |
| Storage scaling | automatic | automatic (storage autoscaling) |
| 500 users / month | ≈ $25–35 | ≈ $15–17 (micro, 20 GB gp3) |
| 10k users / month | ≈ $75–120 | ≈ $30–35 (small, 50 GB) |
| Everything else in this plan | unchanged | unchanged (same VPC, same Lambda) |

Switching between the two later is a snapshot restore + `DATABASE_URL` change.

---

## 7. API: NestJS on Lambda

| Item | Setting |
|---|---|
| Packaging | **Container image**, `linux/arm64`, base `public.ecr.aws/lambda/nodejs:22`, built from new `backends/Dockerfile.lambda`; contains `dist/`, `node_modules` (incl. arm64 `argon2`), Prisma client, `prisma/migrations`, RDS CA bundle |
| Handler | `dist/lambda.handler` → `@codegenie/serverless-express` wrapping the Nest app, created **once per container** and reused |
| Same image, other functions | `migrate` (CMD `dist/migrate.handler` → `prisma migrate deploy`), `jobs` (CMD `dist/jobs.handler`) |
| Memory | 1024 MB (more memory = more CPU; argon2 + Nest boot benefit) |
| Timeout | 29 s (API Gateway HTTP API max is 30 s) |
| Architecture | arm64 (~20% cheaper than x86) |
| Concurrency | reserved 50 (500 users) / 100 (10k) |
| VPC | private subnets, SG `lambda` |
| Env | §16 |
| Logs | CloudWatch log group, **14-day retention**, JSON logs |
| Versions & alias | Every deploy publishes a version; API Gateway invokes alias **`live`** → instant rollback |
| Cold start | ~1.5–3 s (Nest + Prisma). Mitigations: Rust-free Prisma client, esbuild/`nest build` with tree-shaking, lazy-load Swagger only when `ENABLE_SWAGGER`; optional **provisioned concurrency = 1** on `live` (≈ $9/mo) at 10k users |
| Payload limit | Lambda sync payload 6 MB → JSON bodies already capped at 1 MB (`main.ts`); multipart uploads capped at **4 MB** (base64 overhead) — larger files use presigned S3 upload (§12) |
| Static files | `backends/static/*` moved to S3 (`media.forum500.club/static/...`) instead of `app.useStaticAssets` |
| Local dev | Unchanged: `npm run dev:api` uses `main.ts` + Docker Postgres |

---

## 8. API Gateway + Cloudflare in front

### 8.1 API Gateway HTTP API

| Setting | Value |
|---|---|
| Custom domain | `api.forum500.club`, **regional**, ACM cert (`eu-west-2`) validated with a Cloudflare DNS record |
| Default `execute-api` endpoint | **disabled** (only the custom domain works) |
| Integration | Lambda proxy (payload v2.0) → alias `live`; route `$default` (Nest does routing under `/api`) |
| Stage throttling | rate 100 rps, burst 200 (500 users: 50/100) |
| Route throttling | `POST /api/auth/{proxy+}` and `POST /api/public/applications`: 5 rps, burst 10 |
| CORS | **off** in API Gateway — Nest keeps handling CORS (`main.ts`) |
| Access logs | JSON to CloudWatch (14 days): requestId, ip (`CF-Connecting-IP`), route, status, latency |

### 8.2 Cloudflare `api-edge` Worker (on `api.forum500.club/*`)

| Job | Detail |
|---|---|
| Origin lock | Adds `X-Origin-Verify: <secret>`; Nest middleware rejects requests without it (C-6). Blocks anyone calling API Gateway's regional hostname directly |
| Turnstile | On `POST /api/public/applications`, `POST /api/auth/forgot`, and login after failures: reads `cf-turnstile-response`, calls siteverify, rejects on failure → the Lambda never needs internet for this |
| Rate limiting | Workers Rate Limiting binding: 5/min per IP+route on auth routes; 300/min per IP elsewhere (replaces the per-container in-memory `ThrottlerModule`) |
| Pass-through | Streams everything else unchanged; `CF-Connecting-IP` forwarded |
| Cost | Counts against the 10M requests included in Workers Paid |

DNS: `api` = proxied CNAME to the API Gateway regional domain name (`d-xxxx.execute-api.eu-west-2.amazonaws.com`); SSL mode Full (strict).

---

## 9. Side effects: the outbox (email, realtime, schedules)

Because the API Lambda has no internet, anything external is written as a **job** to DynamoDB (free gateway endpoint) and executed by a worker Lambda outside the VPC.

| Piece | Design |
|---|---|
| Table `forum500-<env>-outbox` | PK `id` (uuid), attributes `type`, `payload`, `createdAt`, `ttl` (7 days); on-demand billing; **Streams: NEW_IMAGE** |
| Producer | `core/outbox/outbox.service.ts` (new): `enqueue(type, payload)` → `PutItem`, SDK retries; called **after** the Prisma transaction commits |
| Consumer | Lambda `worker` (outside VPC, Node 22 arm64, 512 MB, zip — no native deps), event source mapping: batch 10, `bisectBatchOnFunctionError`, `maximumRetryAttempts` 5, on-failure destination **SQS DLQ** (14-day retention) |
| Job types | `email.send` (SES `SendEmail`), `realtime.publish` (post to WebSocket connections of a room), `schedule.upsert` / `schedule.delete` (one-time EventBridge schedules) |
| Idempotency | Job `id` is used as SES `X-Entity-Ref-ID` / schedule name, so a retry does not double-send or double-create |
| Failure visibility | CloudWatch alarm on DLQ `ApproximateNumberOfMessagesVisible > 0`; runbook to redrive (§29) |
| Request semantics | Invite / reset emails: if `enqueue` fails, the API returns 503 "email could not be queued" so the admin can retry; notifications: logged and skipped |

---

## 10. Scheduled jobs (EventBridge Scheduler)

| Schedule | Target | Purpose |
|---|---|---|
| **One-time** `at(<publishAt>)`, created by the worker when an article/feed post/edition gets a future publish time; `ActionAfterCompletion: DELETE` | Lambda `jobs` `{ job: "publish", entity, id }` | Enforce scheduled publishing (open gap) **without** a 5-minute cron that would keep the DB awake |
| `cron(0 3 * * ? *)` Europe/London | `jobs` `{ job: "cleanup" }` | Delete expired auth tokens, clear stale `lockedUntil`, purge S3 objects of assets soft-deleted > 30 days |
| `cron(30 6 * * ? *)` / `cron(30 23 * * ? *)` | `rds:ModifyDBCluster` | Business-hours floor (§6.4), production only |
| `cron(0 7 ? * MON *)` (optional) | `jobs` `{ job: "digest" }` | Weekly member digest via outbox |

Rescheduling: changing `publishAt` → `schedule.upsert` (same schedule name = entity id); unpublishing → `schedule.delete`. The `publish` job is idempotent (checks status and time again).

---

## 11. Real-time chat (API Gateway WebSockets)

### Phase 1 (launch): no polling, no sockets

In `frontends/web/src/features/comms/queries.ts` remove `refetchInterval: POLL_MS` from `useConversations`, `useConversation`, `useGroupChat`; keep fetch on page open, `refetchOnWindowFocus`, invalidate after send (already done in `useSendMessage`/`useReply`). Optional: 60 s refetch **only while the thread is visible**. Cost ≈ zero.

### Phase 2: push

| Piece | Design |
|---|---|
| API | API Gateway **WebSocket API**, custom domain `rt.forum500.club` (Cloudflare proxied, WebSockets on) |
| Ticket | `POST /api/v1/realtime/ticket` (api Lambda, checks DB membership) → 60 s HMAC-signed ticket `{ memberId, rooms: ["member:<id>", "conversation:<id>", "group:<id>"] }` |
| `$connect` | Lambda `ws-connect` (outside VPC): verifies ticket signature (no DB), writes `{ connectionId, room }` items to DynamoDB `ws-connections` (PK `connectionId`, GSI `room`, TTL 2 h) |
| `$disconnect` | Lambda `ws-disconnect`: deletes items |
| Publish | After `addMessage` / group post commits → outbox `realtime.publish { room, event, data }` → worker queries GSI by room → `PostToConnection` per connection; `410 Gone` → delete stale item |
| Client | `features/comms/live.ts` `useLiveChannel(rooms)`: native WebSocket, on event → `setQueryData`/`invalidateQueries`; reconnect with backoff; refetch once on reconnect. API Gateway closes idle sockets after 10 min and all sockets after 2 h → client pings every 5 min and reconnects transparently |
| Latency | API commit → push ≈ 100–300 ms (DynamoDB Streams + worker) — fine for chat |

---

## 12. Files: S3 + CloudFront

| Item | Setting |
|---|---|
| Module | **Reuse** `infra/terraform/modules/storage` (S3 private bucket, versioning, encryption, CORS, lifecycle, CloudFront with OAC) |
| Domain | `media.forum500.club` → CloudFront; Cloudflare record **DNS-only** (grey cloud) so CloudFront serves directly; ACM cert in `us-east-1` validated via Cloudflare DNS |
| API config | `STORAGE_DRIVER=s3`, `S3_BUCKET=forum500-<env>-media`, `AWS_REGION=eu-west-2`, `ASSET_PUBLIC_BASE_URL=https://media.forum500.club`, no `S3_ENDPOINT` |
| Credentials | Lambda execution role (no keys) — `s3:PutObject/GetObject/DeleteObject/HeadObject` on `uploads/*`, `static/*` |
| Small upload | `POST /api/admin/uploads` multipart **≤ 4 MB** → byte sniff → `PutObject` via gateway endpoint |
| Large upload | Existing `presign` → browser `PUT` to S3 → `confirm` (`head`), unchanged; harden confirm with a 64-byte range `GetObject` + `sniffMime` (C-5) |
| S3 CORS | `PUT` from `https://admin.forum500.club` (+ `https://forum500.club` if members upload) |
| Caching | Objects already written with `Cache-Control: public, max-age=31536000, immutable` |
| Cost | CloudFront always-free tier: 1 TB/month out + 10M requests → $0 at our size |
| Important | Full URLs are stored in `Asset.url` → set `media.forum500.club` before the first real upload and never change it |

---

## 13. Email: SES

| Item | Setting |
|---|---|
| Module | **Reuse** `modules/email` (domain identity, DKIM, MAIL FROM, configuration set) — replace its `aws_route53_record` resources with `cloudflare_dns_record` |
| Sender | Worker Lambda (outbox `email.send`) using the existing SES send code moved to a shared file (C-7) |
| Production access | Request SES production access early (sandbox only sends to verified addresses; approval can take a day) |
| DNS | DKIM ×3 CNAME, MAIL FROM MX + SPF, DMARC `p=quarantine` — all in Cloudflare |
| Bounces/complaints | Configuration set → SNS topic → email to admins (phase 2: store in DB via outbox job) |
| Cost | $0.10 per 1,000 emails |

---

## 14. Frontends on Cloudflare Workers

| Step | Both `frontends/web` and `frontends/admin` |
|---|---|
| 1 | Add `@opennextjs/cloudflare` + `wrangler`; `open-next.config.ts` with an incremental cache in **Workers KV or R2** (needed for `page-metadata.ts` `revalidate: 300`) — Cloudflare-side only, no AWS egress |
| 2 | `wrangler.jsonc`: `nodejs_compat`, pinned `compatibility_date`, static assets dir |
| 3 | `NEXT_PUBLIC_API_URL=https://api.forum500.club/api` at build time per environment |
| 4 | Web app server-side fetches (`src/lib/page-metadata.ts`) go through a **service binding** to `api-edge` (same-zone Worker-to-Worker fetches need it) |
| 5 | `next/image`: `unoptimized: true` (CloudFront serves sized images) |
| 6 | Routes: apex + `www` → `web-app`; `admin.` → `admin-app` (behind Access) |
| 7 | Delete `amplify.yml` files and the Amplify module after go-live |

---

## 15. Security

| Layer | Control |
|---|---|
| Edge | Cloudflare WAF free managed rules, Bot Fight Mode, HSTS, TLS 1.2+, rate limits in `api-edge`, Turnstile on public forms |
| Admin | Cloudflare **Access** on `admin.forum500.club` (admin emails only, OTP/Google) + app login |
| Origin lock | API Gateway default endpoint disabled + `X-Origin-Verify` secret checked in Nest |
| Network | DB in private subnets, SG only from Lambda/admin-shell; **no internet route in the VPC** (no data exfiltration path from the API) |
| IAM | One role per Lambda, least privilege: `api` (S3 media prefixes, DynamoDB outbox PutItem), `worker` (SES send for the identity, `execute-api:ManageConnections`, `scheduler:CreateSchedule/DeleteSchedule` + `iam:PassRole` for the scheduler role, DynamoDB stream read), `jobs` (S3 delete), `migrate` (none beyond VPC) |
| Data | Aurora + S3 + DynamoDB encrypted at rest; TLS enforced (`rds.force_ssl`); S3 public access blocked (CloudFront OAC only) |
| Secrets | SSM SecureString → injected as Lambda env vars at deploy (encrypted with KMS); DB master password managed by RDS in Secrets Manager; nothing in Git |
| CI | GitHub OIDC role (no AWS keys in GitHub), scoped per environment |
| Account | Root MFA, no root keys, IAM Identity Center user for humans, **AWS Budgets** alerts at $50 / $100 / $200, CloudTrail (management events, free) |
| App (unchanged) | helmet, zod validation, argon2, lockout, `tokenVersion` revocation, upload sniffing, audit log |
| Known gaps (separate tasks) | Tokens in `localStorage`, no in-app admin MFA (Access mitigates), Prisma 7 / Next 16 upgrades — see `docs/SECURITY.md` |

---

## 16. Configuration and secrets

Source of truth: SSM Parameter Store `/forum500/<env>/<NAME>` (SecureString for secrets). Terraform/CI reads them and sets Lambda environment variables.

| Variable | Value (production) | Function |
|---|---|---|
| `NODE_ENV` | `production` | api, jobs, migrate |
| `DATABASE_URL` | `postgresql://forum500_app:<pw>@<cluster-endpoint>:5432/forum500?sslmode=require` | api, jobs, migrate |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | 48 random bytes / `60d` | api |
| `CORS_ORIGINS` | `https://forum500.club,https://www.forum500.club,https://admin.forum500.club` | api |
| `PUBLIC_API_URL` / `WEB_APP_URL` / `ADMIN_APP_URL` | `https://api.forum500.club` / `https://forum500.club` / `https://admin.forum500.club` | api |
| `TRUST_PROXY` | `true` | api |
| `STORAGE_DRIVER`, `S3_BUCKET`, `AWS_REGION`, `ASSET_PUBLIC_BASE_URL` | `s3`, `forum500-production-media`, `eu-west-2`, `https://media.forum500.club` | api, jobs |
| `MAIL_DRIVER` | `outbox` (new value) | api |
| `MAIL_FROM` | `Forum500 <no-reply@forum500.club>` | worker |
| `OUTBOX_TABLE` | `forum500-production-outbox` | api, jobs |
| `ORIGIN_VERIFY_SECRET` | random 32 bytes (same value in `api-edge`) | api |
| `REALTIME_TICKET_SECRET` | random 32 bytes | api, ws-connect |
| `WS_CONNECTIONS_TABLE`, `WS_MANAGEMENT_URL` | table name, `https://rt.forum500.club` | worker, ws-* |
| `SCHEDULER_GROUP`, `SCHEDULER_ROLE_ARN`, `JOBS_FUNCTION_ARN` | from Terraform | worker |
| `ENABLE_SWAGGER` | `false` | api |
| `SEED_ON_START` | **never set** | — |
| `NEXT_PUBLIC_API_URL` | `https://api.forum500.club/api` | web, admin (build) |
| `TURNSTILE_SECRET`, `ORIGIN_VERIFY_SECRET` | Worker secrets | api-edge |
| Removed | `PORT`, `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE`, `AWS_ACCESS_KEY_ID/SECRET` (role-based) | — |

---

## 17. Infrastructure as code (Terraform)

Keep `infra/terraform` (root, `environments/*.tfvars`, S3 state backends, offline `terraform test`), restructure modules:

| Module | Action | Contents |
|---|---|---|
| `network` | **Rewrite** | VPC, 2 private subnets, route table, S3 + DynamoDB gateway endpoints, SGs (`lambda`, `db`, `admin-shell`). Remove IGW, NAT, EIP, public subnets |
| `database` | **Rewrite** | `aws_rds_cluster` (aurora-postgresql 16, `serverlessv2_scaling_configuration { min_capacity, max_capacity, seconds_until_auto_pause }`, `manage_master_user_password`, `enable_http_endpoint`, backups, deletion protection), `aws_rds_cluster_instance` (`db.serverless`, 1–2), cluster parameter group, subnet group |
| `api` | **Rewrite** | Lambda `api` / `migrate` / `jobs` (image), alias `live`, HTTP API + stage + integration + `$default` route + route throttles, custom domain + mapping, ACM regional cert, log groups, IAM roles |
| `outbox` | **New** | DynamoDB outbox (stream), worker Lambda (zip), event source mapping, SQS DLQ, IAM |
| `realtime` | **New** (Phase 2) | WebSocket API + domain, `ws-connect`/`ws-disconnect` Lambdas, DynamoDB `ws-connections` + GSI |
| `scheduler` | **New** | Schedule group, cleanup cron, capacity schedules, scheduler execution role |
| `storage` | **Reuse** | S3 + CloudFront OAC; add `static/` prefix; cert validation record via Cloudflare |
| `email` | **Reuse, edit** | Route 53 records → Cloudflare records |
| `registry` | **Reuse** | ECR repo for the API image (lifecycle: keep 10) |
| `github_oidc` | **Reuse, edit** | Policy: ECR push, `lambda:UpdateFunctionCode/PublishVersion/UpdateAlias/InvokeFunction/GetFunction`, Worker deploys stay in Cloudflare |
| `monitoring` | **Reuse, extend** | Alarms in §21, SNS email, AWS Budgets |
| `waf` | **Remove** | Cloudflare WAF instead |
| `frontend` (Amplify) | **Remove** | Cloudflare Workers instead |
| `infra/cloudflare` | **New** (cloudflare provider) | Zone settings, DNS records (api, rt, media, apex, www, admin, SES, ACM validation), Workers routes, Access app + policy, Turnstile widget, notifications |

Update `infra/terraform/tests` (offline mocked provider) for the new modules; update `docs/TERRAFORM.md` and `docs/AWS_SETUP.md`.

---

## 18. CI/CD

| Workflow | Trigger | Steps |
|---|---|---|
| `backend-ci-deploy.yml` (edit) | push `main`/`develop`, PR on `backends/**` | **check** (unchanged: types, layers, migrate, seed, build, e2e on CI Postgres) → **deploy**: OIDC → build `Dockerfile.lambda` (arm64, buildx) → push ECR `:<sha>` → update `migrate` image → **invoke `migrate`** (fail pipeline on error) → update `api` + `jobs` image → publish version → smoke test that version (`/api/health/ready` via test alias) → move alias `live` → watch 5xx alarm 5 min → done (else alias back) |
| `worker-deploy.yml` (new) | `backends/src/workers/**` | build zips (esbuild) → `update-function-code` for `worker`, `ws-connect`, `ws-disconnect` |
| `frontend-web.yml`, `frontend-admin.yml` (edit) | app paths | `tsc` → `opennextjs-cloudflare build` → `deploy` (Cloudflare API token from GitHub environment) |
| `api-edge.yml` (new) | `workers/api-edge/**` | `wrangler deploy` |
| `infra-terraform.yml` (edit) | `infra/**` | `fmt`/`validate`/offline tests → `plan` on PR → `apply` on main (approval for production) |

Environments: GitHub `staging` (from `develop`) and `production` (from `main`, required reviewer).

---

## 19. Database migrations and admin access

| Task | How |
|---|---|
| Apply migrations | CI invokes Lambda `migrate` (in VPC) → `prisma migrate deploy`; output in the pipeline log |
| Migration style | **Expand → contract** (add first, remove later); never rename in one step; a manual cluster snapshot is taken by CI before any migration that drops or alters columns |
| First admin | Invoke `migrate` with `{ "command": "create-admin", "email": "…" }` → runs `scripts/create-admin.mjs`; password reset email via outbox |
| Never | Run the seed against production (`SEED_ON_START` unset; seed refuses real data without `SEED_FORCE=1`) |
| Ad-hoc SQL | **RDS Query Editor** (console, via Data API) — read-only role `forum500_readonly` for day-to-day |
| psql / pg_dump | **CloudShell VPC environment** in the private subnets with SG `admin-shell` → `psql`, `pg_dump`; no bastion host, no public DB |
| Local data import (go-live) | `pg_dump -Fc` locally → upload dump to a private S3 `ops/` prefix → CloudShell VPC: download (S3 gateway endpoint) → `pg_restore --no-owner --role=forum500_app` |

---

## 20. Code changes required

| # | Change | Files |
|---|---|---|
| C-1 | Extract app setup from `bootstrap()` into `createApp()`; `main.ts` (local/server) and new `lambda.ts` (serverless-express, cached) both use it | `backends/src/main.ts`, `backends/src/app.factory.ts` (new), `backends/src/lambda.ts` (new) |
| C-2 | Lambda container build | `backends/Dockerfile.lambda` (new), `.dockerignore` |
| C-3 | `migrate` + `create-admin` handler | `backends/src/migrate.ts` (new) |
| C-4 | Prisma driver adapter + pool settings (§6.5) | `backends/prisma/schema.prisma` (generator), `backends/src/core/prisma/prisma.service.ts`, `package.json` (`@prisma/adapter-pg`, `pg`) |
| C-5 | Upload limit 150 MB → 4 MB for multipart; admin uploader uses presign above 4 MB; confirm step sniffs real bytes | `modules/admin/uploads.controller.ts:48`, `core/storage/storage.service.ts`, admin upload component |
| C-6 | Origin-verify middleware; client IP from `CF-Connecting-IP` (audit log, lockout logs); `ThrottlerModule` kept only as a per-container backstop (or removed) | `backends/src/main.ts` / `app.factory.ts`, `core/common/`, `app.module.ts` |
| C-7 | `MAIL_DRIVER=outbox`; move SES sending into `core/mail/ses-sender.ts`, reused by the worker | `core/mail/mail.service.ts`, `core/config/env.ts` |
| C-8 | Outbox service + DynamoDB client | `core/outbox/` (new) |
| C-9 | Worker Lambda (email, realtime publish, schedules) | `backends/src/workers/worker.ts` (new) |
| C-10 | Jobs entry (publish, cleanup, digest) | `backends/src/jobs.ts` (new) + services in `core/jobs/` |
| C-11 | Enqueue `schedule.upsert/delete` when `publishAt` changes | media/site services that own scheduled content |
| C-12 | Health split: `/api/health` (no DB) and `/api/health/ready` (DB) | `core/health/*` |
| C-13 | Chat Phase 1: remove `refetchInterval`; Phase 2: ticket endpoint, `ws-*` Lambdas, `useLiveChannel` | `frontends/web/src/features/comms/queries.ts`, `features/comms/live.ts` (new), `modules/comms/*`, `backends/src/workers/ws-*.ts` |
| C-14 | Frontend "Waking up…" indicator when a request takes > 3 s | `frontends/web/src/lib/api.ts`, `frontends/admin/src/lib/api.ts` |
| C-15 | Move `backends/static` to S3 `static/`; update references | seed data / CMS content using `/static/...` |
| C-16 | OpenNext configs + service binding usage | `frontends/*/open-next.config.ts`, `wrangler.jsonc`, `frontends/web/src/lib/page-metadata.ts` |
| C-17 | `api-edge` Worker | `workers/api-edge/` (new) |
| C-18 | Env schema additions (§16) | `core/config/env.ts`, `.env.example` |

Unchanged: Prisma schema/models, migrations, repositories, audit/soft-delete extension, admin metadata, layer rules, e2e tests (still run against a normal Postgres in CI).

---

## 21. Observability and alarms

| Metric / source | Alarm (SNS email) |
|---|---|
| Lambda `api` Errors | > 5 in 5 min |
| Lambda `api` Throttles | > 0 in 5 min (concurrency cap hit) |
| Lambda `api` Duration p95 | > 3 s for 15 min |
| API Gateway 5xx | > 1% for 5 min |
| Aurora `ACUUtilization` | > 90% for 15 min → raise max ACU |
| Aurora `ServerlessDatabaseCapacity` | informational dashboard |
| Aurora `DatabaseConnections` | > 80% of Lambda cap |
| Aurora `FreeLocalStorage` / `VolumeBytesUsed` | growth trend |
| SQS outbox DLQ visible messages | > 0 |
| Worker Lambda Errors | > 0 in 15 min |
| EventBridge Scheduler failed invocations | > 0 |
| AWS Budgets | 50% / 80% / 100% of monthly budget |
| Cloudflare Health Checks | `https://api.forum500.club/api/health`, `https://forum500.club`, every 1–5 min (liveness only — does not wake the DB) |
| Logs | CloudWatch Logs Insights saved queries: errors by route, slow requests, login failures |
| Tracing (optional) | X-Ray active tracing on `api` (small cost) |

---

## 22. Backups and disaster recovery

| Layer | Mechanism | RPO | RTO |
|---|---|---|---|
| Aurora PITR | Continuous, restore to any second within retention (14 d → 35 d) into a **new cluster** | ~5 min | 20–40 min (restore + switch `DATABASE_URL` + redeploy) |
| Aurora snapshots | Automatic daily + manual before risky migrations; monthly snapshot kept 12 months (AWS Backup plan) | 24 h | 20–40 min |
| Cross-region copy (optional, 10k) | AWS Backup copy to `eu-west-1` weekly | 7 d | 1–2 h |
| S3 media | Versioning on (existing module) + lifecycle for non-current versions (90 days) | ~0 | minutes |
| DynamoDB | Outbox/connections are transient — no backup needed | — | — |
| Infra | Terraform state (S3 + locking) + Git | — | Rebuild ~1 h |
| Drill | Quarterly: restore PITR to a temp cluster, run e2e tests via CloudShell, delete | — | — |

Note: Aurora PostgreSQL has no "backtrack"; rollbacks of bad migrations are PITR restores — hence expand/contract and pre-migration snapshots.

---

## 23. What scales automatically

| Component | Scales by itself? | Limit to watch |
|---|---|---|
| Cloudflare edge, Workers | yes | 10M requests/month included |
| API Gateway | yes | stage throttles you set |
| Lambda `api` | yes, per request | reserved concurrency (raise with DB max ACU) |
| Aurora Serverless v2 | **yes, 0 → max ACU in seconds** | max ACU setting |
| Aurora storage | yes | — |
| DynamoDB on-demand | yes | — |
| Worker Lambda | yes | — |
| S3 / CloudFront | yes | — |
| SES | quota-based | request quota increases before big newsletters |

At 10k users the only changes are: min ACU 0.5, max ACU 8 (→16), reserved concurrency 100, optional reader instance, optional provisioned concurrency 1.

---

## 24. Costs at 500 and 10,000 users

Assumptions: 20% daily active; ~60 API requests per active member per day (~0.3M/month at 500, ~5M at 10k); chat Phase 2 enabled at 10k; 5 GB media at 500, 50 GB at 10k; ~2k emails/month at 500, ~50k at 10k; Aurora ACU price ≈ $0.14/ACU-hour in London (verify).

| Item | 500 users | 10,000 users |
|---|---|---|
| Cloudflare Workers Paid (web, admin, api-edge) | $5.00 | $5.00 |
| Cloudflare DNS/CDN/WAF/Access/Turnstile | $0 | $0 |
| API Gateway HTTP API ($1/M) | ~$0.30 | ~$5.00 |
| Lambda (free tier 1M req + 400k GB-s/month) | $0 | ~$5–6 |
| Provisioned concurrency ×1 (optional) | — | ~$9 |
| **Aurora Serverless v2 compute** | ~180 ACU-h (0.5 ACU × ~12 h/day, paused at night) ≈ **$25** | ~600–850 ACU-h (0.5 ACU at night, ~1–1.5 ACU by day) ≈ **$85–120** |
| Aurora storage + I/O | ~$1 | ~$10–15 |
| Aurora reader for HA (optional) | — | +$50–70 |
| DynamoDB (outbox, ws connections) | < $0.10 | ~$1 |
| WebSocket API (messages + connection-minutes) | — | ~$1–2 |
| SQS, EventBridge Scheduler | $0 | $0 |
| S3 storage + requests | ~$0.15 | ~$1.50 |
| CloudFront (1 TB + 10M req always free) | $0 | $0 |
| SES | ~$0.20 | ~$5.00 |
| CloudWatch logs + ~12 alarms | ~$1.50 | ~$3–4 |
| ECR, Secrets Manager (1 RDS-managed secret), KMS | ~$0.50 | ~$0.50 |
| NAT Gateway | **$0 (not used)** | **$0** |
| **Total / month** | **≈ $30–40** | **≈ $120–165** (≈ $180–230 with reader + provisioned concurrency) |
| Same with fixed RDS instead of Aurora (§6.9) | ≈ $20–25 | ≈ $60–75 |

What drives cost: Aurora compute hours. The business-hours floor (§6.4) and keeping requests efficient (indexes) keep it low; a fixed `db.t4g` RDS instance is the cheaper choice if automatic compute scaling is not essential.

---

## 25. Environments

| Environment | AWS | Cloudflare | Aurora | Cost |
|---|---|---|---|---|
| local | Docker Postgres (`backends/docker-compose.yml`) + `npm run dev:*` | `wrangler dev` for edge Workers (optional) | — | $0 |
| CI | GitHub Actions Postgres service | — | — | $0 |
| staging | Same account, `forum500-staging-*` resources (existing tfvars split) | `*.staging.forum500.club`, all behind Access | min 0 / max 2, pause after 5 min → mostly paused | ≈ $3–8 |
| production | `forum500-production-*` | apex, `www`, `admin`, `api`, `rt`, `media` | §6.2 | §24 |

Optional later: separate AWS accounts for staging/production under AWS Organizations (free).

---

## 26. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | ~15–17 s first request after DB pause | High (at 500 users, nights) | Low–Medium | Business-hours floor; "Waking up…" UI; min 0.5 at 10k |
| R2 | DB never pauses because something holds a connection | Medium | Cost | §6.6 checklist; alarm on `ServerlessDatabaseCapacity` > 0 at 03:00 |
| R3 | Lambda cold starts (Nest + Prisma) | Medium | Low | Rust-free Prisma, 1 GB memory, optional provisioned concurrency |
| R4 | Connection exhaustion | Low | High | pool max 1, reserved concurrency, `DatabaseConnections` alarm |
| R5 | Outbox job lost (DynamoDB write fails after commit) | Low | Low–Medium | SDK retries; critical emails return 503 for retry; DLQ for consumer failures |
| R6 | Future feature needs synchronous internet from the API | Medium (Stripe) | Medium | Add NAT (D-6) or route via worker |
| R7 | Bad migration | Low | High | Expand/contract, pre-migration snapshot, PITR runbook |
| R8 | Aurora cost higher than expected | Medium | Medium | Budgets alerts; switch to fixed RDS (§6.9) via snapshot restore |
| R9 | API Gateway 30 s limit | Low | Low | `statement_timeout` 25 s; long jobs go to `jobs` Lambda |

---

## 27. Timeline

| Week | Work | Exit criteria |
|---|---|---|
| 1 | AWS account hardening, Budgets, SES production request; Cloudflare zone; Terraform: network, database (Aurora), registry, storage, email, github_oidc; C-1…C-4, C-12, C-18 | Staging Aurora up; `api` Lambda answers `/api/health/ready` through API Gateway |
| 2 | Outbox + worker + jobs + scheduler (C-7…C-11); uploads (C-5); origin lock + `api-edge` (C-6, C-17); frontends on Workers (C-16); chat Phase 1 (C-13); CI/CD; alarms | Full staging works end to end; e2e + smoke tests green; emails delivered |
| 3 | Chat Phase 2 (WebSockets), C-14, C-15; load test (k6, 60 rps 10 min: p95 < 500 ms, ACU scales and returns); restore drill; data import; production apply; go-live | Checklist §28 complete |

Without realtime push (Phase 2), go-live is possible at the end of week 2.

---

## 28. Go-live checklist

- [ ] AWS: root MFA, Budgets alerts, CloudTrail on; SES out of sandbox; DKIM/SPF/DMARC pass
- [ ] Terraform applied for production; `terraform plan` clean
- [ ] Aurora: deletion protection on, PITR 14+ days, parameter group applied, `forum500_app` + `forum500_readonly` roles created
- [ ] Confirmed the cluster **pauses** at night (staging) and **resumes** < 20 s
- [ ] Lambda `api`: alias `live`, reserved concurrency set, logs 14 days, env complete, `SEED_ON_START` unset
- [ ] API Gateway default endpoint disabled; direct call without `X-Origin-Verify` returns 403
- [ ] `api-edge`: Turnstile + rate limits verified
- [ ] Cloudflare Access protects `admin.`; every admin tested
- [ ] `media.forum500.club` serves via CloudFront; presigned upload works from admin
- [ ] Outbox: email, schedule creation, DLQ alarm tested (force a failure once)
- [ ] Scheduled publish: an article with `publishAt` +5 min publishes on time
- [ ] Chat works (Phase 1 or 2); no polling requests in the network tab
- [ ] Alarms firing to the right email; Cloudflare Health Checks green
- [ ] Restore drill done once; runbooks reviewed
- [ ] Data imported; asset URLs point to `https://media.forum500.club`; first admin created
- [ ] Old ECS / Amplify / Render / WAF resources and workflows removed or disabled

---

## 29. Runbooks

| Task | Steps |
|---|---|
| **Deploy** | Merge to `main` → pipeline: build → migrate → publish version → smoke → alias `live` |
| **Roll back code** | `aws lambda update-alias --function-name forum500-production-api --name live --function-version <previous>` (seconds) |
| **Roll back data** | Restore PITR to `forum500-production-restore-<time>` → verify via CloudShell → update `DATABASE_URL` (SSM) → redeploy alias → rename/retire old cluster |
| **DB too slow / ACU maxed** | Check Performance Insights top SQL → add index; if sustained, raise max ACU in tfvars → apply (online) |
| **Users report 15 s first load** | Confirm pause/resume in metrics; enable or widen business-hours floor |
| **Emails not sent** | DLQ messages? → inspect payload/error in worker logs → fix → redrive DLQ to the worker; check SES reputation dashboard |
| **Scheduled post didn't publish** | EventBridge Scheduler → group `forum500-production` → schedule exists? failed invocations metric → re-run `jobs` with `{job:"publish",…}` |
| **Rotate a secret** | Update SSM → run deploy (env vars refresh) → for `ORIGIN_VERIFY_SECRET` update `api-edge` and API together (accept both for 10 min) |
| **Run SQL** | Query Editor (readonly role) or CloudShell VPC → `psql` |
| **Create admin** | Invoke `migrate` with `create-admin` command; add email to Access policy |
| **Cost spike** | Budgets alert → Cost Explorer by service → Aurora hours? (connection holding?) API requests? (abuse → Cloudflare rules) |

---

## 30. Open decisions

| ID | Decision | Options | Recommendation |
|---|---|---|---|
| D-1 | Database | Aurora Serverless v2 / fixed RDS `db.t4g` | Aurora SV2 (your scaling requirement); RDS if cost matters more |
| D-2 | Min ACU at 500 users | 0 (pause) / business-hours floor / 0.5 always | Business-hours floor |
| D-3 | Chat realtime | Phase 1 only / Phase 2 at launch | Phase 1 at launch, Phase 2 within a month |
| D-4 | HA reader at 10k | none / 1 reader | Add when uptime commitments require it |
| D-5 | Provisioned concurrency | none / 1 | None at 500; 1 at 10k if cold starts are noticed |
| D-6 | Internet egress from VPC (future Stripe etc.) | via worker / NAT Gateway | Via worker until a synchronous call is unavoidable |
| D-7 | AWS accounts | one account / Organizations with staging + production | One account now (matches current Terraform) |
| D-8 | Token storage | `localStorage` / HttpOnly cookie on `.forum500.club` | Cookie, as a separate security task |
