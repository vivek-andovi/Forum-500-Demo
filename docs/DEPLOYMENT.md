# Deployment

> **Current plan (24 Oct 2026): AWS + Cloudflare only.** API on AWS Lambda (container image, API Gateway HTTP API),
> files on Cloudflare R2, Postgres on RDS / Aurora. Dev is built by the scripts in [`migrate/`](../migrate/README.md),
> which also hold the architecture diagram and the data migration for every environment. Staging/production follow
> [Plan 2](deploy-plans/PLAN_2_AWS_LAMBDA_AURORA.md). The ECS/Amplify material below (`infra/terraform`,
> `infra/aws/*.json`) predates that decision and is kept only until Plan 2's Terraform replaces it. The GitHub
> workflows run only when started by hand.

Forum500 is set up to deploy to **AWS**. The full step-by-step guide is in [AWS_SETUP.md](AWS_SETUP.md).

| App | AWS service | Trigger | Config |
|---|---|---|---|
| `backends` (API) | ECR + **ECS Fargate** behind an ALB; **RDS** Postgres; **S3** + CloudFront; **SES**; Secrets Manager | push touching `backends/**` → `.github/workflows/backend-ci-deploy.yml` (GitHub OIDC → ECR → ECS) | `backends/Dockerfile`, `infra/aws/*.json` |
| `frontends/admin` | **Amplify Hosting** at admin.forum500.club | Amplify Git integration (monorepo app root) | `frontends/admin/amplify.yml` |
| `frontends/web` | **Amplify Hosting** at forum500.club | Amplify Git integration (monorepo app root) | `frontends/web/amplify.yml` |

**How deploys work:**
- **Independent apps:** each app has its own `package.json` and lockfile and builds from its own folder.
- **Path-filtered workflows:** an admin change never redeploys the API.
- **Migrations on start:** the API container runs `prisma migrate deploy` before it starts. Migrations are additive and idempotent.
- **Branches:** `develop` deploys to staging and `main` to production. Use GitHub environment protection on `production`.

**First deploy only:** run the seed once as a one-off ECS task (AWS_SETUP.md, step 7), then change the admin password straight away. **The seed wipes all tables.**
