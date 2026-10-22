# AWS Amplify Hosting app for one Next.js frontend in the monorepo (SSR, WEB_COMPUTE).
# Amplify builds on every push to the connected branch using frontends/<app>/amplify.yml.
resource "aws_amplify_app" "this" {
  name                     = var.name
  repository               = var.repository_url
  access_token             = var.github_access_token
  platform                 = "WEB_COMPUTE"
  enable_branch_auto_build = true

  environment_variables = merge({
    AMPLIFY_MONOREPO_APP_ROOT = var.app_root
    NEXT_PUBLIC_API_URL       = var.api_url
  }, var.extra_environment)

  # The build spec lives in the repo (frontends/<app>/amplify.yml).
  lifecycle {
    ignore_changes = [build_spec]
  }
}

resource "aws_amplify_branch" "this" {
  app_id            = aws_amplify_app.this.id
  branch_name       = var.branch
  stage             = var.stage
  enable_auto_build = true
  framework         = "Next.js - SSR"
}

resource "aws_amplify_domain_association" "this" {
  count                 = var.domain_name != "" ? 1 : 0
  app_id                = aws_amplify_app.this.id
  domain_name           = var.domain_name
  wait_for_verification = false

  sub_domain {
    branch_name = aws_amplify_branch.this.branch_name
    prefix      = var.subdomain_prefix
  }
}
