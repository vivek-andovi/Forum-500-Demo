# ── General
variable "environment" {
  type        = string
  description = "staging | production"
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be staging or production."
  }
}

variable "aws_region" {
  type    = string
  default = "eu-west-2"
}

variable "domain" {
  type        = string
  description = "Root domain, e.g. forum500.club"
}

variable "route53_zone_id" {
  type        = string
  default     = ""
  description = "Route 53 hosted zone for `domain`. When set, certificates, DNS records and SES verification are automatic."
}

variable "subdomains" {
  type = object({
    api    = string # e.g. api / api.staging
    assets = string # e.g. assets / assets.staging
    web    = string # "" = apex
    admin  = string # e.g. admin / admin.staging
  })
}

# ── Network
variable "vpc_cidr" {
  type    = string
  default = "10.40.0.0/16"
}
variable "single_nat_gateway" {
  type        = bool
  description = "true = one NAT gateway (cheaper, staging); false = one per AZ (production)."
}

# ── Database
variable "db_instance_class" { type = string }
variable "db_allocated_storage_gb" {
  type    = number
  default = 20
}
variable "db_max_allocated_storage_gb" {
  type    = number
  default = 100
}
variable "db_multi_az" { type = bool }
variable "db_backup_retention_days" { type = number }

# ── API
variable "api_image_tag" {
  type        = string
  default     = "bootstrap"
  description = "Image tag used on the first apply. Subsequent deploys come from CI."
}
variable "api_cpu" { type = number }
variable "api_memory" { type = number }
variable "api_desired_count" { type = number }
variable "api_min_count" { type = number }
variable "api_max_count" { type = number }
variable "api_rate_limit_per_minute" {
  type    = number
  default = 300
}
variable "api_certificate_arn" {
  type        = string
  default     = ""
  description = "Existing ACM cert for the API domain (only needed when route53_zone_id is empty)."
}
variable "assets_certificate_arn_us_east_1" {
  type        = string
  default     = ""
  description = "Existing us-east-1 ACM cert for the assets domain (only needed when route53_zone_id is empty)."
}

# ── Email
variable "mail_from_address" {
  type        = string
  description = "Sender address, e.g. no-reply@forum500.club"
}

# ── CI/CD
variable "github_repository" {
  type        = string
  description = "owner/repo for GitHub OIDC trust, e.g. plotify/forum500"
}
variable "create_github_oidc_provider" {
  type        = bool
  description = "Create the account-wide GitHub OIDC provider (true in the first environment only)."
}
variable "deploy_branches" { type = list(string) }

# ── Frontends (Amplify)
variable "enable_amplify" {
  type    = bool
  default = true
}
variable "github_access_token" {
  type        = string
  default     = ""
  sensitive   = true
  description = "GitHub token Amplify uses to read the repo. Pass via TF_VAR_github_access_token, never commit it."
}
variable "frontend_branch" { type = string }

# ── Protection & monitoring
variable "enable_waf" {
  type    = bool
  default = true
}
variable "alert_emails" {
  type    = list(string)
  default = []
}
variable "log_retention_days" {
  type    = number
  default = 90
}
