variable "name" { type = string }
variable "domain" { type = string }
variable "aws_region" { type = string }
variable "route53_zone_id" {
  type        = string
  description = "Hosted zone for the domain. Empty = output the DNS records instead of creating them."
}
