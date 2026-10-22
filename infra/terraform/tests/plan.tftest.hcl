# Offline plan tests: run with `terraform test` (no AWS credentials needed).
# The AWS provider is mocked, so these check that every expression, count and for_each
# evaluates for both environments, and assert key security/sizing properties.
mock_provider "aws" {
  # Mocked policy documents must still be valid JSON for IAM resources to plan.
  mock_data "aws_iam_policy_document" {
    defaults = { json = "{\"Version\":\"2012-10-17\",\"Statement\":[]}" }
  }
  override_data {
    target = module.network.data.aws_availability_zones.available
    values = { names = ["eu-west-2a", "eu-west-2b", "eu-west-2c"] }
  }
}
mock_provider "aws" {
  alias = "us_east_1"
}
mock_provider "random" {}

override_data {
  target = data.aws_caller_identity.current
  values = { account_id = "123456789012" }
}

override_data {
  target = module.api.data.aws_region.current
  values = { name = "eu-west-2" }
}

override_data {
  target = module.github_oidc.data.aws_iam_openid_connect_provider.github
  values = { arn = "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com" }
}

run "staging_plan" {
  command = plan
  variables {
    environment                 = "staging"
    domain                      = "forum500.club"
    subdomains                  = { api = "api.staging", assets = "assets.staging", web = "staging", admin = "admin.staging" }
    single_nat_gateway          = true
    db_instance_class           = "db.t4g.micro"
    db_multi_az                 = false
    db_backup_retention_days    = 7
    api_cpu                     = 256
    api_memory                  = 512
    api_desired_count           = 1
    api_min_count               = 1
    api_max_count               = 2
    mail_from_address           = "no-reply@forum500.club"
    github_repository           = "plotify/forum500"
    create_github_oidc_provider = true
    deploy_branches             = ["develop"]
    frontend_branch             = "develop"
    enable_waf                  = false
    github_access_token         = "test-token"
  }

  assert {
    condition     = length(module.network.private_subnet_ids) == 2
    error_message = "Expected 2 private subnets"
  }
  assert {
    condition     = output.api_url == "https://api.staging.forum500.club"
    error_message = "Unexpected API URL"
  }
  assert {
    condition     = length(module.waf) == 0
    error_message = "WAF should be disabled in staging"
  }
}

run "production_plan_with_route53" {
  command = plan
  variables {
    environment                 = "production"
    domain                      = "forum500.club"
    route53_zone_id             = "Z0123456789ABCDEFGHIJ"
    subdomains                  = { api = "api", assets = "assets", web = "", admin = "admin" }
    single_nat_gateway          = false
    db_instance_class           = "db.t4g.small"
    db_multi_az                 = true
    db_backup_retention_days    = 14
    api_cpu                     = 512
    api_memory                  = 1024
    api_desired_count           = 2
    api_min_count               = 2
    api_max_count               = 6
    mail_from_address           = "no-reply@forum500.club"
    github_repository           = "plotify/forum500"
    create_github_oidc_provider = false
    deploy_branches             = ["main"]
    frontend_branch             = "main"
    enable_waf                  = true
    alert_emails                = ["ops@forum500.club"]
    github_access_token         = "test-token"
  }

  assert {
    condition     = output.api_url == "https://api.forum500.club"
    error_message = "Unexpected API URL"
  }
  assert {
    condition     = length(module.waf) == 1
    error_message = "WAF must be enabled in production"
  }
  assert {
    condition     = length(aws_acm_certificate.api) == 1 && length(aws_acm_certificate.assets) == 1
    error_message = "Certificates should be created when a Route 53 zone is given"
  }
}
