variable "name" { type = string }
variable "vpc_id" { type = string }
variable "public_subnet_ids" { type = list(string) }
variable "private_subnet_ids" { type = list(string) }
variable "alb_security_group_id" { type = string }
variable "api_security_group_id" { type = string }

variable "image_repository_url" { type = string }
variable "image_tag" {
  type        = string
  description = "Initial image tag. Later deploys are done by CI (Terraform ignores task-definition changes)."
}
variable "container_port" { type = number }
variable "cpu" { type = number }
variable "memory" { type = number }
variable "desired_count" { type = number }
variable "min_count" { type = number }
variable "max_count" { type = number }

variable "database_url" {
  type      = string
  sensitive = true
}
variable "assets_bucket_name" { type = string }
variable "assets_bucket_arn" { type = string }
variable "asset_public_base_url" { type = string }
variable "mail_from_address" { type = string }

variable "public_api_url" { type = string }
variable "web_app_url" { type = string }
variable "admin_app_url" { type = string }
variable "rate_limit_per_minute" { type = number }

variable "certificate_arn" {
  type        = string
  description = "ACM certificate (same region) for the API domain."
}
variable "enable_https" {
  type        = bool
  description = "Create the HTTPS listener (must be known at plan time; certificate_arn may not be)."
}
variable "log_retention_days" { type = number }
variable "secret_recovery_days" { type = number }
variable "deletion_protection" { type = bool }
