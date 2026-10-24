#!/usr/bin/env bash
# AWS base for the dev layout: RDS PostgreSQL (public, SSL enforced), its security group, the ECR repository
# for the API image, and the Lambda IAM role. Safe to re-run: existing pieces are kept.
#   ./migrate/20-aws-base.sh dev
# Staging/prod use a private database in a VPC (docs/deploy-plans/PLAN_2_AWS_LAMBDA_AURORA.md), not this script.
. "$(dirname "$0")/lib.sh"
load_env "${1:-}"
require AWS_REGION DB_NAME DB_USER DB_PASSWORD DB_INSTANCE_CLASS DB_ALLOWED_CIDR
case "$ENV_NAME" in prod|production) die "This script makes the database publicly reachable; it is for dev only." ;; esac

account="$(aws_account_id)"
save_state AWS_ACCOUNT_ID "$account"

step "Security group for the database"
vpc="$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)"
[ "$vpc" != "None" ] || die "No default VPC in $AWS_REGION. Create one: aws ec2 create-default-vpc"
sg="$(aws ec2 describe-security-groups --filters Name=vpc-id,Values="$vpc" Name=group-name,Values="$(name db)" \
  --query 'SecurityGroups[0].GroupId' --output text)"
if [ "$sg" = "None" ]; then
  sg="$(aws ec2 create-security-group --vpc-id "$vpc" --group-name "$(name db)" \
    --description "Forum500 $ENV_NAME Postgres (SSL enforced)" --query GroupId --output text)"
  aws ec2 authorize-security-group-ingress --group-id "$sg" --protocol tcp --port 5432 --cidr "$DB_ALLOWED_CIDR" >/dev/null
  ok "created $sg (port 5432 from $DB_ALLOWED_CIDR)"
else
  ok "exists: $sg"
fi
save_state DB_SECURITY_GROUP "$sg"

step "RDS PostgreSQL $(name)"
status="$(aws rds describe-db-instances --db-instance-identifier "$(name)" --query 'DBInstances[0].DBInstanceStatus' --output text 2>/dev/null || echo missing)"
if [ "$status" = missing ]; then
  version="${DB_ENGINE_VERSION:-$(aws rds describe-db-engine-versions --engine postgres --default-only --query 'DBEngineVersions[0].EngineVersion' --output text)}"
  db_major="${version%%.*}"; pg_major="$(pg_dump --version | sed -E 's/[^0-9]*([0-9]+).*/\1/')"
  [ "$db_major" -ge "$pg_major" ] || die "RDS default is PostgreSQL $db_major but your pg_dump is $pg_major; set DB_ENGINE_VERSION to $pg_major.x"
  echo "  creating PostgreSQL $version, $DB_INSTANCE_CLASS, 20 GB, single-AZ, public with SSL (takes ~5–10 minutes)…"
  aws rds create-db-instance \
    --db-instance-identifier "$(name)" --engine postgres --engine-version "$version" \
    --db-instance-class "$DB_INSTANCE_CLASS" --allocated-storage 20 --storage-type gp2 --storage-encrypted \
    --db-name "$DB_NAME" --master-username "$DB_USER" --master-user-password "$DB_PASSWORD" \
    --vpc-security-group-ids "$sg" --publicly-accessible --no-multi-az \
    --backup-retention-period 1 --no-deletion-protection --copy-tags-to-snapshot \
    --tags Key=project,Value=forum500 Key=env,Value="$ENV_NAME" >/dev/null
  aws rds wait db-instance-available --db-instance-identifier "$(name)"
  ok "created"
elif [ "$status" = stopped ]; then
  aws rds start-db-instance --db-instance-identifier "$(name)" >/dev/null
  aws rds wait db-instance-available --db-instance-identifier "$(name)"
  ok "started (it was stopped)"
else
  aws rds wait db-instance-available --db-instance-identifier "$(name)"
  ok "exists ($status)"
fi
endpoint="$(aws rds describe-db-instances --db-instance-identifier "$(name)" --query 'DBInstances[0].Endpoint.Address' --output text)"
save_state DB_ENDPOINT "$endpoint"
# PostgreSQL 15+ on RDS enforces SSL by default (rds.force_ssl=1); the connection test below uses sslmode=require.
psql "$(remote_db_url)" -tAc 'select version()' | sed 's/^/    /' || die "can't connect to $endpoint (check the security group and your network)"
ok "reachable over SSL at $endpoint"

step "ECR repository for the API image"
repo="$(name api)"
if ! aws ecr describe-repositories --repository-names "$repo" >/dev/null 2>&1; then
  aws ecr create-repository --repository-name "$repo" --image-tag-mutability MUTABLE >/dev/null
  ok "created $repo"
else
  ok "exists: $repo"
fi
# Keep the last 3 images (stays inside ECR's 500 MB free storage).
aws ecr put-lifecycle-policy --repository-name "$repo" --lifecycle-policy-text \
  '{"rules":[{"rulePriority":1,"description":"keep last 3","selection":{"tagStatus":"any","countType":"imageCountMoreThan","countNumber":3},"action":{"type":"expire"}}]}' >/dev/null
save_state ECR_REPO_URI "$account.dkr.ecr.$AWS_REGION.amazonaws.com/$repo"
ok "$ECR_REPO_URI"

step "IAM role for the Lambda functions"
role="$(name lambda)"
if ! aws iam get-role --role-name "$role" >/dev/null 2>&1; then
  aws iam create-role --role-name "$role" --assume-role-policy-document \
    '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}' >/dev/null
  aws iam attach-role-policy --role-name "$role" --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
  ok "created $role (CloudWatch logs)"
  sleep 10 # IAM roles take a few seconds before Lambda accepts them
else
  ok "exists: $role"
fi
# Sending email through SES (only used when MAIL_DRIVER=ses).
aws iam put-role-policy --role-name "$role" --policy-name ses-send --policy-document \
  '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["ses:SendEmail","ses:SendRawEmail"],"Resource":"*"}]}'
save_state LAMBDA_ROLE_ARN "arn:aws:iam::$account:role/$role"
ok "$LAMBDA_ROLE_ARN"
