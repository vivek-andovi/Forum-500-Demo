variable "name" { type = string }
variable "github_repository" {
  type        = string
  description = "owner/repo, e.g. plotify/forum500"
}
variable "allowed_branches" { type = list(string) }
variable "allowed_environments" { type = list(string) }
variable "create_oidc_provider" {
  type        = bool
  description = "The GitHub OIDC provider exists once per AWS account; create it in the first environment only."
}
variable "ecr_repository_arn" { type = string }
variable "pass_role_arns" { type = list(string) }
