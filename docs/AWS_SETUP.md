# Forum500 on AWS

Everything runs on AWS. The API code already supports S3, SES, RDS and Secrets Manager; you switch them on with environment variables. Config files live in `infra/aws/`.

## Architecture

```
                         Route 53 (forum500.club)
                                  │
     ┌────────────────────────────┼────────────────────────────┐
     ▼                            ▼                            ▼
 forum500.club              admin.forum500.club        api.forum500.club
 Amplify Hosting            Amplify Hosting            ALB (HTTPS, ACM cert) + AWS WAF
 (frontends/web)            (frontends/admin)                  │
                                                               ▼
                                                     ECS Fargate service (private subnets)
                                                     forum500-api container (backends/Dockerfile)
                                                       │        │          │           │
                                                       ▼        ▼          ▼           ▼
                                               RDS Postgres   S3 bucket   SES      Secrets Manager
                                               (private,      (private)   (email)  (DATABASE_URL,
                                                Multi-AZ)        │                  JWT_SECRET)
                                                                 ▼
                                                     CloudFront (assets.forum500.club)
                                                     serves images/audio/PDFs to browsers
                                         Logs/metrics → CloudWatch   Images ← ECR
```

| Need | AWS service | How the app uses it |
|---|---|---|
| Database | **RDS for PostgreSQL 16** | `DATABASE_URL` (stored in Secrets Manager). Prisma runs migrations on every container start (`prisma migrate deploy`). |
| File storage | **S3** + **CloudFront** | `STORAGE_DRIVER=s3`, `S3_BUCKET`, `ASSET_PUBLIC_BASE_URL`. Uploads go to `uploads/YYYY/MM/<uuid>.<ext>`. The bucket stays private; CloudFront serves the files. |
| Email | **SES** | `MAIL_DRIVER=ses`, `MAIL_FROM`. Sends invite, password-reset and application-decision emails. |
| API compute | **ECS Fargate** behind an **ALB** | `infra/aws/ecs-task-definition.json`. Health check is `GET /api/health`. |
| Container images | **ECR** | The GitHub Actions workflow pushes images. |
| Secrets | **Secrets Manager** | `DATABASE_URL` and `JWT_SECRET` are injected into the container by ECS. |
| Frontends | **Amplify Hosting** (Next.js SSR) | `frontends/web/amplify.yml` and `frontends/admin/amplify.yml` (monorepo app roots). |
| TLS | **ACM** | One certificate for `*.forum500.club` on the ALB and CloudFront. |
| Protection | **AWS WAF** | Managed rule groups plus rate-based rules on `/api/auth/*` and `/api/public/*`. |
| Logs & alarms | **CloudWatch** | Log group `/ecs/forum500-api`; alarms on 5xx, CPU, and RDS storage and connections. |
| CI/CD auth | **IAM OIDC provider for GitHub** | No long-lived AWS keys in GitHub (`secrets.AWS_DEPLOY_ROLE_ARN`). |

## Step-by-step setup

The steps below use region `eu-west-2` (London) and replace `<ACCOUNT_ID>` throughout. Run each step once per environment (staging, production).

### 1. Network
1. Create a VPC with 2 public and 2 private subnets across 2 AZs. One NAT gateway is enough for staging; use one per AZ in production. The console's "VPC and more" wizard does this.
2. Create these security groups:

| Security group | Allows in | From |
|---|---|---|
| `alb-sg` | 443 | the internet |
| `api-sg` | 4000 | `alb-sg` only |
| `rds-sg` | 5432 | `api-sg` only |

### 2. Database (RDS)
```bash
aws rds create-db-instance --db-instance-identifier forum500-prod \
  --engine postgres --engine-version 16 --db-instance-class db.t4g.small \
  --allocated-storage 20 --max-allocated-storage 100 --storage-encrypted \
  --master-username forum500 --manage-master-user-password \
  --db-subnet-group-name forum500-private --vpc-security-group-ids <rds-sg> \
  --backup-retention-period 14 --multi-az --no-publicly-accessible \
  --deletion-protection --enable-performance-insights
```
- The connection string is `postgresql://forum500:<password>@<endpoint>:5432/forum500?schema=public&sslmode=require`.
- Put it in Secrets Manager (step 5). **Never** expose RDS publicly.

### 3. Assets bucket + CloudFront
```bash
aws s3api create-bucket --bucket forum500-assets-prod --region eu-west-2 \
  --create-bucket-configuration LocationConstraint=eu-west-2
aws s3api put-public-access-block --bucket forum500-assets-prod \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-bucket-encryption --bucket forum500-assets-prod \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
aws s3api put-bucket-versioning --bucket forum500-assets-prod --versioning-configuration Status=Enabled
aws s3api put-bucket-cors --bucket forum500-assets-prod --cors-configuration file://infra/aws/s3-cors.json
```
1. Create a CloudFront distribution:
   - Origin: the bucket, using **Origin Access Control**.
   - Alternate domain: `assets.forum500.club` with the ACM certificate.
   - Cache policy: "CachingOptimized".
2. Apply `infra/aws/s3-bucket-policy-cloudfront.json`, filling in the distribution ID, so only CloudFront can read the bucket.
3. Set `ASSET_PUBLIC_BASE_URL=https://assets.forum500.club`.

### 4. Email (SES)
1. Verify the domain `forum500.club` in SES and add the DKIM CNAMEs to Route 53. Also set up SPF and DMARC records.
2. Request **production access**; new SES accounts are in a sandbox that can only email verified addresses.
3. Optionally, create a configuration set that sends bounce and complaint events to SNS.

### 5. Secrets Manager
```bash
aws secretsmanager create-secret --name forum500/prod/api --secret-string \
  "{\"DATABASE_URL\":\"postgresql://...\",\"JWT_SECRET\":\"$(openssl rand -base64 48)\"}"
```

### 6. IAM roles
Create three roles:

| Role | Trusted by | Policies |
|---|---|---|
| `forum500-ecs-execution-role` | `ecs-tasks.amazonaws.com` | AWS-managed `AmazonECSTaskExecutionRolePolicy` + `infra/aws/iam-ecs-execution-role-policy.json` (read the secret) |
| `forum500-api-task-role` | `ecs-tasks.amazonaws.com` | `infra/aws/iam-api-task-role-policy.json` (S3 `uploads/*` only, SES send from `no-reply@` only) |
| `forum500-github-deploy` | the GitHub OIDC provider (`token.actions.githubusercontent.com`), limited to your repo/branches | `infra/aws/github-oidc-deploy-role-policy.json` |

The app uses the task role's credentials automatically, so there are **no AWS keys in env vars**.

### 7. ECR + ECS
```bash
aws ecr create-repository --repository-name forum500-api --image-scanning-configuration scanOnPush=true
aws ecs create-cluster --cluster-name forum500 --capacity-providers FARGATE FARGATE_SPOT
aws logs create-log-group --log-group-name /ecs/forum500-api --retention-in-days 90
```
1. Fill in `<ACCOUNT_ID>` and `<REGION>` in `infra/aws/ecs-task-definition.json`, then register it with `aws ecs register-task-definition --cli-input-json file://infra/aws/ecs-task-definition.json`.
2. Create the ALB:
   - Target group: HTTP 4000, health check `/api/health`.
   - HTTPS listener on 443 with the ACM certificate.
   - HTTP listener on 80 that redirects to 443.
3. Create the ECS service `forum500-api-prod`:
   - Fargate, private subnets, `api-sg`.
   - Desired count 2.
   - Attached to the target group.
   - Deployment circuit breaker with rollback enabled.
4. Point Route 53 `api.forum500.club` at the ALB (alias record).
5. First deploy only: run the seed once as a one-off task to create the admin user, then **change the admin password immediately**:
   ```bash
   aws ecs run-task --cluster forum500 --launch-type FARGATE --task-definition forum500-api \
     --network-configuration "awsvpcConfiguration={subnets=[<private-subnet>],securityGroups=[<api-sg>]}" \
     --overrides '{"containerOverrides":[{"name":"api","command":["sh","-c","npx tsx prisma/seed/index.ts"]}]}'
   ```
   The seed **wipes all tables**. Never run it against a database with real data.

### 8. Frontends (Amplify Hosting)
1. In Amplify, create a new app from GitHub and pick the repo.
   - Monorepo app root: `frontends/web`. Amplify reads `frontends/web/amplify.yml`.
   - Env var: `NEXT_PUBLIC_API_URL=https://api.forum500.club/api`.
   - Custom domain: `forum500.club`.
2. Repeat for `frontends/admin` with the domain `admin.forum500.club`.
3. Optionally, restrict the admin app with Amplify access control (basic auth) or AWS WAF IP allow-listing, on top of the app's own login.

### 9. CI/CD
- **API:** `.github/workflows/backend-ci-deploy.yml` runs on every push to `backends/**`:
  1. Typecheck, migrate, seed and build against a throwaway Postgres.
  2. `npm audit`.
  3. Build an arm64 image and push it to ECR.
  4. Render the task definition and deploy to ECS, waiting until the service is stable.
- **Branches:** `main` deploys to `forum500-api-prod`; `develop` deploys to `forum500-api-staging`.
- **GitHub settings:** add `AWS_DEPLOY_ROLE_ARN` as a secret on the `production` and `staging` environments, and require approvals on `production`.
- **Frontends:** Amplify builds them on push, and the `frontend-*.yml` workflows typecheck and build every PR.

### 10. Hardening checklist
- [ ] AWS WAF on the ALB with:
  - `AWSManagedRulesCommonRuleSet`, `KnownBadInputs` and `AmazonIpReputationList`
  - a rate-based rule of 100 requests per 5 minutes per IP on `/api/auth/*`
- [ ] More than one ECS task: move rate-limit storage to Redis (ElastiCache), because the in-app limiter counts per task.
- [ ] CloudWatch alarms:
  - ALB 5xx above 1%
  - ECS CPU above 80%
  - RDS free storage below 20%, CPU above 80%, connections above 80% of max
- [ ] RDS: automated backups (14 days) plus a monthly manual snapshot. Test a restore.
- [ ] S3: versioning on, plus a lifecycle rule to expire old object versions after 90 days.
- [ ] GuardDuty and Security Hub enabled, and CloudTrail on in all regions.
- [ ] Budgets alert, e.g. at $150 per month.

## Approximate monthly cost (low traffic, production)

| Item | ~USD/month |
|---|---|
| ECS Fargate, 2 × 0.5 vCPU / 1 GB arm64 | 30 |
| ALB | 20 |
| NAT gateway (1) | 35 |
| RDS db.t4g.small Multi-AZ, 20 GB | 55 |
| S3 + CloudFront (tens of GB) | 5–10 |
| SES (a few thousand emails) | <1 |
| Amplify Hosting (2 apps) | 5–15 |
| Secrets Manager, CloudWatch, ECR, Route 53 | 10 |
| **Total** | **≈ $160–180** |

Staging can run single-AZ RDS `db.t4g.micro` and 1 task for about $60–80.

## Testing AWS integrations locally (LocalStack)
```bash
cd backends
docker compose --profile aws up -d      # S3 + SES emulator on :4566, bucket auto-created
STORAGE_DRIVER=s3 S3_BUCKET=forum500-assets S3_ENDPOINT=http://localhost:4566 S3_FORCE_PATH_STYLE=true \
MAIL_DRIVER=ses AWS_ENDPOINT_URL_SES=http://localhost:4566 AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test \
npm run start:dev
# sent emails: curl http://localhost:4566/_aws/ses
```
