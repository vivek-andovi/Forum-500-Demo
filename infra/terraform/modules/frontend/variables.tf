variable "name" { type = string }
variable "repository_url" {
  type        = string
  description = "https://github.com/<owner>/<repo>"
}
variable "github_access_token" {
  type      = string
  sensitive = true
}
variable "app_root" {
  type        = string
  description = "frontends/web or frontends/admin"
}
variable "api_url" { type = string }
variable "branch" { type = string }
variable "stage" {
  type        = string
  description = "PRODUCTION | BETA | DEVELOPMENT"
}
variable "domain_name" {
  type        = string
  description = "Apex domain managed in Route 53 (e.g. forum500.club). Empty = use the amplifyapp.com URL."
}
variable "subdomain_prefix" {
  type        = string
  description = "\"\" for the apex (web), \"admin\" for the admin portal, \"staging\" etc."
}
variable "extra_environment" {
  type    = map(string)
  default = {}
}
