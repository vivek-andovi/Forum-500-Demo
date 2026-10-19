# Deployment

Forum500 deploys to **AWS**. The full step-by-step guide is in [AWS_SETUP.md](AWS_SETUP.md).

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
