variable "name" { type = string }
variable "bucket_name" { type = string }
variable "force_destroy" { type = bool }
variable "upload_allowed_origins" { type = list(string) }
variable "domain_name" {
  type        = string
  description = "Custom domain for assets (e.g. assets.forum500.club). Empty = use the cloudfront.net domain."
}
variable "certificate_arn_us_east_1" {
  type        = string
  description = "ACM certificate in us-east-1 covering domain_name (required when domain_name is set)."
}
