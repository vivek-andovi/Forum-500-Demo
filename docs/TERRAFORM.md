# Forum500 Infrastructure as Code (Terraform)

**Location:** `infra/terraform/`
**What it does:** creates the complete AWS environment for Forum500 from code, for **staging** and **production**.

**Status:**
- **Done:** the code is written, `terraform validate` passes, and offline plan tests pass for both environments against a mocked AWS provider. The plan tests caught and fixed 3 problems that would have broken the first real `apply`.
- **Not done yet:** nothing has been applied to a real AWS account. That needs AWS credentials and a decision on the domain and DNS.

---

## 1. What gets created

```mermaid
flowchart TB
  subgraph Edge
    R53[Route 53<br/>DNS + cert validation]
    WAF[AWS WAF<br/>managed rules + rate limits]
    CF[CloudFront<br/>assets.forum500.club]
    AMP[Amplify Hosting<br/>forum500.club · admin.forum500.club]
  end
  subgraph VPC["VPC (2 AZs)"]
    subgraph Public subnets
      ALB[Application Load Balancer<br/>HTTPS · api.forum500.club]
      NAT[NAT gateway(s)]
    end
    subgraph Private subnets
      ECS[ECS Fargate service<br/>NestJS API · arm64 · autoscaling]
      RDS[(RDS PostgreSQL 16<br/>encrypted · TLS-only · backups)]
    end
  end
  S3[(S3 assets bucket<br/>private · versioned)]
  SM[Secrets Manager<br/>DATABASE_URL · JWT_SECRET]
  ECR[ECR<br/>API images]
  SES[SES<br/>domain + DKIM]
  CW[CloudWatch logs + alarms → SNS email]
  GH[GitHub Actions] -- OIDC role --> ECR
  GH -- deploy --> ECS
  R53 --> ALB
  R53 --> CF
  WAF --> ALB
  ALB --> ECS
  ECS --> RDS
  ECS --> S3
  ECS --> SES
  ECS --> SM
  CF --> S3
  ECS --> CW
```

| Module | AWS resources | Notes |
|---|---|---|
| `network` | VPC, 2 public + 2 private subnets, internet gateway, NAT gateway(s), route tables, 3 security groups | Traffic only flows internet → ALB → API → RDS. Staging uses 1 NAT gateway; production uses one per AZ |
| `database` | RDS PostgreSQL 16, subnet group, parameter group | Encrypted gp3 storage, `rds.force_ssl=1`, automated backups, Performance Insights, logs to CloudWatch. Production adds Multi-AZ, deletion protection and a final snapshot. The password is generated, not typed by anyone |
| `storage` | S3 bucket, CloudFront distribution + Origin Access Control, bucket policy, CORS, lifecycle | Bucket is fully private: only CloudFront can read, and HTTPS is enforced. CORS allows presigned uploads from the admin domain. Old versions expire after 90 days |
| `email` | SES domain identity, DKIM, custom MAIL FROM, configuration set (TLS required) | DNS records are created automatically with Route 53, or listed in an output for any other DNS provider |
| `registry` | ECR repository | Immutable tags, scan on push, keeps the last 30 images |
| `api` | ECS cluster, task definition, service, ALB + target group + listeners, IAM execution & task roles, Secrets Manager secret, log group, CPU autoscaling | Health check at `/api/health`. Deployment circuit breaker with rollback. HTTP → HTTPS redirect when a certificate is present. Least-privilege task role: S3 `uploads/*` and SES from a single sender address |
| `github_oidc` | GitHub OIDC provider (once per account), deploy role | Trust is limited to the repo, the deploy branch and the GitHub environment. The role can only push the image and update the service |
| `frontend` (×2) | Amplify app + branch (+ custom domain) | Next.js SSR (`WEB_COMPUTE`) with monorepo app roots `frontends/web` and `frontends/admin` |
| `waf` | WAFv2 web ACL + association with the ALB | AWS Common, Known Bad Inputs, IP Reputation and SQLi rule sets. 100 requests per 5 min per IP on `/api/auth/*` and `/api/public/*`; 2000 per 5 min globally |
| `monitoring` | SNS topic + email subscriptions, 8 CloudWatch alarms | Alarms: API 5xx, latency, unhealthy targets, CPU, memory; RDS CPU, free storage, connections |
| root `main.tf` | ACM certificates (API in-region, assets in us-east-1), DNS validation, Route 53 alias records | Only created when `route53_zone_id` is set; otherwise you pass certificate ARNs or run on HTTP for a first test |
| `bootstrap/` | S3 state bucket + DynamoDB lock table | Run once per AWS account |

---

## 2. Folder layout

```
infra/terraform/
├── bootstrap/main.tf              # one-time: Terraform state bucket + lock table
├── versions.tf  providers.tf      # Terraform/AWS versions, S3 backend, us-east-1 alias for CloudFront certs
├── variables.tf main.tf outputs.tf
├── environments/
│   ├── staging.tfvars    production.tfvars       # sizing and settings per environment
│   └── backend-staging.hcl backend-production.hcl  # where each environment's state lives
├── modules/
│   ├── network/ database/ storage/ email/ registry/
│   ├── api/ github_oidc/ frontend/ waf/ monitoring/
└── tests/plan.tftest.hcl          # offline plan tests (mocked AWS)
```

---

## 3. Environments

| Setting | Staging | Production |
|---|---|---|
| Domains | `staging.` / `admin.staging.` / `api.staging.` / `assets.staging.forum500.club` | `forum500.club` / `admin.` / `api.` / `assets.forum500.club` |
| NAT gateways | 1 | 1 per AZ (2) |
| RDS | `db.t4g.micro`, single-AZ, 7-day backups, no deletion protection | `db.t4g.small`, **Multi-AZ**, 14-day backups, **deletion protection** + final snapshot |
| API tasks | 0.25 vCPU / 0.5 GB, 1–2 tasks | 0.5 vCPU / 1 GB, 2–6 tasks |
| WAF | off | **on** |
| S3 / ECR on destroy | emptied automatically | protected |
| Secrets recovery window | immediate | 30 days |
| Deploy branch | `develop` | `main` |

**Approximate monthly cost** (eu-west-2, low traffic; check with the AWS Pricing Calculator):

| Item | Staging | Production |
|---|---|---|
| NAT gateway(s) | ~$35 | ~$70 |
| Application Load Balancer | ~$20 | ~$20 |
| ECS Fargate (arm64) | ~$8 | ~$30 |
| RDS PostgreSQL | ~$15 | ~$60 |
| WAF | — | ~$12 |
| S3 + CloudFront | ~$2 | ~$5–10 |
| Amplify (2 apps) | ~$5 | ~$10 |
| Secrets Manager, CloudWatch, ECR, Route 53 | ~$5 | ~$10 |
| **Total** | **≈ $90** | **≈ $215–230** |

---

## 4. First-time setup (step by step)

**Prerequisites:**
| What | Details |
|---|---|
| Terraform | ≥ 1.6 (CI uses 1.9.8) |
| AWS CLI v2 | Credentials for an admin or deployer IAM identity |
| Domain | `forum500.club`, ideally as a **Route 53 hosted zone**. With Route 53, certificates, DNS records and SES verification are fully automatic |
| GitHub | The repository pushed (e.g. `plotify/forum500`), and a GitHub personal access token for Amplify to read it |

### Step 1: Bootstrap remote state (once per AWS account)
```bash
cd infra/terraform/bootstrap
terraform init
terraform apply -var="state_bucket_name=forum500-terraform-state-<ACCOUNT_ID>"
```
Then put that bucket name into `environments/backend-staging.hcl` and `environments/backend-production.hcl`.

### Step 2: Review the environment settings
In `environments/staging.tfvars`, set:
- `github_repository`
- `route53_zone_id` (recommended)
- `alert_emails`
- the sizes, if different from the defaults

### Step 3: Initialise and plan
```bash
cd infra/terraform
terraform init -backend-config=environments/backend-staging.hcl
export TF_VAR_github_access_token=<github token for Amplify>   # never commit it
terraform plan -var-file=environments/staging.tfvars -out=staging.tfplan
```

### Step 4: Create the registry, then push the first API image
The ECS service needs an image to start, so create the registry first:
```bash
terraform apply -var-file=environments/staging.tfvars -target=module.registry
aws ecr get-login-password | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.eu-west-2.amazonaws.com
docker buildx build --platform linux/arm64 -t <ecr_repository_url>:bootstrap --push backends
```

### Step 5: Apply everything
```bash
terraform apply -var-file=environments/staging.tfvars
```
Takes about 15–25 minutes, mostly RDS, CloudFront and certificate validation. On start, the container runs `prisma migrate deploy`, which creates all 58 tables.

### Step 6: Create the first admin login
The production database is empty, and **the demo seed is not used in production**. Run the bundled script as a one-off task:
```bash
aws ecs run-task --cluster forum500-staging --launch-type FARGATE \
  --task-definition forum500-staging-api \
  --network-configuration "awsvpcConfiguration={subnets=[<private-subnet-id>],securityGroups=[<api-sg-id>]}" \
  --overrides '{"containerOverrides":[{"name":"api","command":["node","scripts/create-admin.mjs","you@forum500.club","<strong-password>"]}]}'
```
Locally the same script is `npm run admin:create -- you@forum500.club '<password>'`.

### Step 7: Wire up GitHub and the remaining manual steps
1. **GitHub:** create the **environments** `staging` and `production`. On each, add the secret `AWS_DEPLOY_ROLE_ARN` = the `github_deploy_role_arn` output. Every push to `develop` (staging) or `main` (production) then builds and deploys the API.
2. **SES:** request **production access** in the SES console; new accounts are sandboxed and can only email verified addresses. Without Route 53, add the `ses_dns_records` output at your DNS provider.
3. **DNS without Route 53:** add these records at your provider:
   - `api.` → `alb_dns_name` output
   - `assets.` → `cloudfront_domain` output
   - Amplify custom domains, configured in the Amplify console
4. **Alerts:** confirm the SNS subscription email for alerts.

Repeat steps 2–7 with `production` files once staging is verified.

---

## 5. How Terraform and CI/CD share responsibility

| Concern | Owned by |
|---|---|
| Network, database, bucket, CDN, email, roles, secrets, alarms, WAF, ALB, ECS service *settings*, env vars | **Terraform** |
| Which **image** is running (new task-definition revision per deploy) | **GitHub Actions** (`.github/workflows/backend-ci-deploy.yml`) |
| Frontend builds | **Amplify** (on push, using `frontends/*/amplify.yml`) |
| Database schema | **Prisma migrations**, run by the container on start |

Two details:
- **No conflicts:** the ECS service has `lifecycle { ignore_changes = [task_definition, desired_count] }`. A later `terraform apply` won't roll back an image CI deployed, and won't fight autoscaling.
- **CI reads from ECS:** it fetches the current Terraform-managed task definition, swaps in only the new image, and deploys. Env vars and secrets always come from Terraform.

---

## 6. Variables (most important)

| Variable | Purpose |
|---|---|
| `environment` | `staging` or `production` (validated) |
| `domain`, `subdomains` | Domain names for the API, assets, member app and admin |
| `route53_zone_id` | Turns on automatic certificates, DNS records and SES verification |
| `api_certificate_arn`, `assets_certificate_arn_us_east_1` | Existing certificates, when not using Route 53. Without one, the API runs on HTTP for a first test only |
| `single_nat_gateway` | Cost vs. resilience |
| `db_instance_class`, `db_multi_az`, `db_backup_retention_days` | Database sizing and durability |
| `api_cpu`, `api_memory`, `api_min_count`, `api_max_count`, `api_rate_limit_per_minute` | API sizing, autoscaling bounds and in-app rate limit |
| `mail_from_address` | SES sender; also the only address the API is allowed to send from |
| `github_repository`, `deploy_branches`, `create_github_oidc_provider` | CI trust. The OIDC provider is created by the first environment only |
| `enable_amplify`, `github_access_token`, `frontend_branch` | Frontend hosting. The token is supplied via `TF_VAR_github_access_token` |
| `enable_waf`, `alert_emails`, `log_retention_days` | Protection and monitoring |

**Key outputs:**
- `api_url`, `alb_dns_name`
- `assets_base_url`, `cloudfront_domain`
- `rds_endpoint`
- `ecr_repository_url`, `ecs_cluster`, `ecs_service`
- `github_deploy_role_arn`
- `ses_dns_records`
- `web_default_url`, `admin_default_url`
- `alerts_topic_arn`

---

## 7. Secrets and security notes
- **Generated secrets:** the database password and JWT secret are generated by Terraform, stored in **Secrets Manager**, and injected into containers by ECS. They are never in env files or the repo.
- **State is sensitive:** Terraform state contains those generated values. The state bucket is **private, encrypted and versioned**; restrict access to it to the infrastructure team.
- **No long-lived AWS keys:** CI uses GitHub OIDC, and the app uses its IAM task role.
- **Private by default:** RDS and ECS tasks sit in private subnets with no public IPs, and RDS only accepts connections from the API security group, over TLS.
- **Edge security:** the ALB uses the TLS 1.3 policy and drops invalid headers; CloudFront has managed security headers; S3 denies non-HTTPS access.
- **Rotating the JWT secret:** `terraform apply -replace=module.api.random_password.jwt`, then redeploy. All members must sign in again.

---

## 8. Day-2 operations
| Task | How |
|---|---|
| Scale the API | Change `api_min_count`/`api_max_count` (autoscaling handles the rest) or `api_cpu`/`api_memory` → `terraform apply` |
| Resize the database | Change `db_instance_class` → apply (a brief failover with Multi-AZ) |
| Restore the database | RDS point-in-time restore to a new instance, then update the `DATABASE_URL` secret |
| See logs | CloudWatch log group `/ecs/forum500-<env>-api` |
| Check for drift | `terraform plan -var-file=environments/<env>.tfvars` should show no changes |
| Tear down staging | `terraform destroy -var-file=environments/staging.tfvars` (production is protected by deletion protection) |

---

## 9. How it was verified
| Check | Result |
|---|---|
| `terraform fmt -check`, `terraform validate` (root + bootstrap, AWS provider v5.100) | pass |
| `terraform test`: full **plan** of staging and production (with Route 53) against a mocked AWS provider, with assertions on URLs, subnets, WAF and certificates | **2 / 2 pass** |
| Bugs found by the plan tests and fixed | (1) SES DNS records keyed on DKIM tokens that are only known after apply; (2) certificate-validation records with apply-time keys; (3) the HTTPS listener `count` depending on a certificate ARN. Each would have failed the first real apply |
| `create-admin` script run inside the production Docker image against Postgres | pass |
| Real `terraform apply` on AWS | **not done yet** (no AWS credentials in this environment) |

The same checks run in CI on every infrastructure change (`.github/workflows/infra-terraform.yml`), without AWS credentials.

---

## 10. Not included yet / next improvements
| Item | Why it matters | Effort |
|---|---|---|
| ElastiCache Redis | Shared rate-limit counters once the API runs more than one task (production starts at 2) | 0.5 day |
| RDS Proxy | Connection pooling as the API scales out | 0.5 day |
| Automatic DB password rotation | Today rotation is manual (`-replace` the password + update the secret) | 0.5 day |
| Cross-region backups / DR | Copy RDS snapshots and S3 objects to a second region | 0.5 day |
| VPC endpoints (S3, ECR, Secrets Manager, Logs) | Lower NAT cost and keep traffic on AWS's network | 0.5 day |
| Sentry / X-Ray | Error tracking and tracing | 0.5 day |
| Auth0 tenant via the Terraform Auth0 provider | If/when Auth0 replaces the built-in login (see `docs/AUTH0.md`) | with Auth0 |
| Budgets + cost alerts | Notify when spend exceeds a threshold | 0.5 hour |

The hand-written JSON in `infra/aws/` is kept only as a reference for manual setup. Terraform is the source of truth.
