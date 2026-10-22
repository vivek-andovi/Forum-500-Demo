locals {
  name          = "forum500-${var.environment}"
  is_production = var.environment == "production"
  use_route53   = var.route53_zone_id != ""

  api_domain    = "${var.subdomains.api}.${var.domain}"
  assets_domain = "${var.subdomains.assets}.${var.domain}"
  web_domain    = var.subdomains.web == "" ? var.domain : "${var.subdomains.web}.${var.domain}"
  admin_domain  = "${var.subdomains.admin}.${var.domain}"
  web_url       = "https://${local.web_domain}"
  admin_url     = "https://${local.admin_domain}"
  api_url       = "https://${local.api_domain}"
  api_port      = 4000
}

data "aws_caller_identity" "current" {}

# ─────────────────────────── Network ───────────────────────────
module "network" {
  source             = "./modules/network"
  name               = local.name
  vpc_cidr           = var.vpc_cidr
  single_nat_gateway = var.single_nat_gateway
  api_port           = local.api_port
}

# ─────────────────────────── Certificates (optional, via Route 53) ───────────────────────────
resource "aws_acm_certificate" "api" {
  count             = local.use_route53 ? 1 : 0
  domain_name       = local.api_domain
  validation_method = "DNS"
  lifecycle { create_before_destroy = true }
}

resource "aws_acm_certificate" "assets" {
  count             = local.use_route53 ? 1 : 0
  provider          = aws.us_east_1
  domain_name       = local.assets_domain
  validation_method = "DNS"
  lifecycle { create_before_destroy = true }
}

locals {
  # Static keys (one domain per certificate) so the plan never depends on apply-time values.
  cert_validation_records = local.use_route53 ? {
    api    = tolist(aws_acm_certificate.api[0].domain_validation_options)[0]
    assets = tolist(aws_acm_certificate.assets[0].domain_validation_options)[0]
  } : {}
}

resource "aws_route53_record" "cert_validation" {
  for_each        = local.use_route53 ? toset(["api", "assets"]) : toset([])
  zone_id         = var.route53_zone_id
  name            = local.cert_validation_records[each.key].resource_record_name
  type            = local.cert_validation_records[each.key].resource_record_type
  records         = [local.cert_validation_records[each.key].resource_record_value]
  ttl             = 300
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "api" {
  count                   = local.use_route53 ? 1 : 0
  certificate_arn         = aws_acm_certificate.api[0].arn
  validation_record_fqdns = [aws_route53_record.cert_validation["api"].fqdn]
}

resource "aws_acm_certificate_validation" "assets" {
  count                   = local.use_route53 ? 1 : 0
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.assets[0].arn
  validation_record_fqdns = [aws_route53_record.cert_validation["assets"].fqdn]
}

locals {
  api_certificate_arn    = local.use_route53 ? aws_acm_certificate_validation.api[0].certificate_arn : var.api_certificate_arn
  assets_certificate_arn = local.use_route53 ? aws_acm_certificate_validation.assets[0].certificate_arn : var.assets_certificate_arn_us_east_1
  # Decided from inputs known at plan time (never from apply-time ARNs).
  api_https_enabled    = local.use_route53 || var.api_certificate_arn != ""
  assets_custom_domain = (local.use_route53 || var.assets_certificate_arn_us_east_1 != "") ? local.assets_domain : ""
}

# ─────────────────────────── Data & files ───────────────────────────
module "database" {
  source                   = "./modules/database"
  name                     = local.name
  private_subnet_ids       = module.network.private_subnet_ids
  db_security_group_id     = module.network.db_security_group_id
  instance_class           = var.db_instance_class
  allocated_storage_gb     = var.db_allocated_storage_gb
  max_allocated_storage_gb = var.db_max_allocated_storage_gb
  multi_az                 = var.db_multi_az
  backup_retention_days    = var.db_backup_retention_days
  deletion_protection      = local.is_production
}

module "storage" {
  source                    = "./modules/storage"
  name                      = local.name
  bucket_name               = "${local.name}-assets-${data.aws_caller_identity.current.account_id}"
  force_destroy             = !local.is_production
  upload_allowed_origins    = [local.admin_url]
  domain_name               = local.assets_custom_domain
  certificate_arn_us_east_1 = local.assets_certificate_arn
}

module "email" {
  source          = "./modules/email"
  name            = local.name
  domain          = var.domain
  aws_region      = var.aws_region
  route53_zone_id = var.route53_zone_id
}

module "registry" {
  source       = "./modules/registry"
  name         = local.name
  force_delete = !local.is_production
}

# ─────────────────────────── API ───────────────────────────
module "api" {
  source                = "./modules/api"
  name                  = local.name
  vpc_id                = module.network.vpc_id
  public_subnet_ids     = module.network.public_subnet_ids
  private_subnet_ids    = module.network.private_subnet_ids
  alb_security_group_id = module.network.alb_security_group_id
  api_security_group_id = module.network.api_security_group_id

  image_repository_url = module.registry.repository_url
  image_tag            = var.api_image_tag
  container_port       = local.api_port
  cpu                  = var.api_cpu
  memory               = var.api_memory
  desired_count        = var.api_desired_count
  min_count            = var.api_min_count
  max_count            = var.api_max_count

  database_url          = module.database.database_url
  assets_bucket_name    = module.storage.bucket_name
  assets_bucket_arn     = module.storage.bucket_arn
  asset_public_base_url = module.storage.public_base_url
  mail_from_address     = var.mail_from_address

  public_api_url        = local.api_url
  web_app_url           = local.web_url
  admin_app_url         = local.admin_url
  rate_limit_per_minute = var.api_rate_limit_per_minute

  certificate_arn      = local.api_certificate_arn
  enable_https         = local.api_https_enabled
  log_retention_days   = var.log_retention_days
  secret_recovery_days = local.is_production ? 30 : 0
  deletion_protection  = local.is_production
}

# DNS: api.<domain> → ALB, assets.<domain> → CloudFront (only with Route 53).
resource "aws_route53_record" "api" {
  count   = local.use_route53 ? 1 : 0
  zone_id = var.route53_zone_id
  name    = local.api_domain
  type    = "A"
  alias {
    name                   = module.api.alb_dns_name
    zone_id                = module.api.alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "assets" {
  count   = local.use_route53 ? 1 : 0
  zone_id = var.route53_zone_id
  name    = local.assets_domain
  type    = "A"
  alias {
    name                   = module.storage.distribution_domain
    zone_id                = "Z2FDTNDATAQYW2" # CloudFront's fixed hosted zone id
    evaluate_target_health = false
  }
}

# ─────────────────────────── CI/CD ───────────────────────────
module "github_oidc" {
  source               = "./modules/github_oidc"
  name                 = local.name
  github_repository    = var.github_repository
  allowed_branches     = var.deploy_branches
  allowed_environments = [var.environment]
  create_oidc_provider = var.create_github_oidc_provider
  ecr_repository_arn   = module.registry.repository_arn
  pass_role_arns       = [module.api.execution_role_arn, module.api.task_role_arn]
}

# ─────────────────────────── Frontends ───────────────────────────
module "web" {
  count               = var.enable_amplify ? 1 : 0
  source              = "./modules/frontend"
  name                = "${local.name}-web"
  repository_url      = "https://github.com/${var.github_repository}"
  github_access_token = var.github_access_token
  app_root            = "frontends/web"
  api_url             = "${local.api_url}/api"
  branch              = var.frontend_branch
  stage               = local.is_production ? "PRODUCTION" : "BETA"
  domain_name         = local.use_route53 ? var.domain : ""
  subdomain_prefix    = var.subdomains.web
}

module "admin" {
  count               = var.enable_amplify ? 1 : 0
  source              = "./modules/frontend"
  name                = "${local.name}-admin"
  repository_url      = "https://github.com/${var.github_repository}"
  github_access_token = var.github_access_token
  app_root            = "frontends/admin"
  api_url             = "${local.api_url}/api"
  branch              = var.frontend_branch
  stage               = local.is_production ? "PRODUCTION" : "BETA"
  domain_name         = local.use_route53 ? var.domain : ""
  subdomain_prefix    = var.subdomains.admin
}

# ─────────────────────────── Protection & monitoring ───────────────────────────
module "waf" {
  count                      = var.enable_waf ? 1 : 0
  source                     = "./modules/waf"
  name                       = local.name
  alb_arn                    = module.api.alb_arn
  auth_rate_limit_per_5min   = 100
  global_rate_limit_per_5min = 2000
}

module "monitoring" {
  source                   = "./modules/monitoring"
  name                     = local.name
  alert_emails             = var.alert_emails
  alb_arn_suffix           = module.api.alb_arn_suffix
  target_group_arn_suffix  = module.api.target_group_arn_suffix
  ecs_cluster_name         = module.api.cluster_name
  ecs_service_name         = module.api.service_name
  db_identifier            = module.database.identifier
  db_max_connections_alarm = 150
}
