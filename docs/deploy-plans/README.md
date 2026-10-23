# Forum500 deployment plans

Two alternative production plans, prepared 2026-10-23. Plans only — nothing here has been built.

| | [Plan 1 — Cloudflare only (Workers + D1)](PLAN_1_CLOUDFLARE_D1.md) | [Plan 2 — AWS (Lambda + Aurora Serverless v2) + Cloudflare](PLAN_2_AWS_LAMBDA_AURORA.md) |
|---|---|---|
| Edge / frontends | Cloudflare Workers | Cloudflare Workers |
| API | Rewritten as a Hono Worker | Existing NestJS on AWS Lambda (container image) behind API Gateway |
| Database | D1 (SQLite) | Aurora Serverless v2 PostgreSQL 16: pauses at 0, runs at 0.5 ACU, auto-scales up when busy |
| Files | R2 | S3 + CloudFront |
| Email / jobs | Queues + SES, Cron Triggers | DynamoDB outbox → worker Lambda → SES, EventBridge Scheduler |
| Chat push | Durable Objects | API Gateway WebSockets (phase 2) |
| Code impact | API rewrite, schema ported to SQLite, 13 transactions redesigned | ~18 targeted changes; Prisma schema untouched |
| Effort | ~5–7 developer-weeks | ~2–3 weeks |
| Cost, 500 users | ≈ $5 / month | ≈ $30–40 / month (≈ $20–25 with fixed RDS) |
| Cost, 10,000 users | ≈ $8–15 / month | ≈ $120–165 / month (≈ $60–75 with fixed RDS) |
| Lock-in | high (Cloudflare-specific) | low (standard Postgres + Docker image) |

Both plans remove the 15-second chat polling on `comms/messages` and `comms/whatsapp`.
