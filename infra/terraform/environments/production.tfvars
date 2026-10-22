environment = "production"
aws_region  = "eu-west-2"
domain      = "forum500.club"
# route53_zone_id = "Z0123456789ABCDEFGHIJ"

subdomains = {
  api    = "api"
  assets = "assets"
  web    = ""
  admin  = "admin"
}

vpc_cidr           = "10.50.0.0/16"
single_nat_gateway = false

db_instance_class        = "db.t4g.small"
db_multi_az              = true
db_backup_retention_days = 14

api_cpu           = 512
api_memory        = 1024
api_desired_count = 2
api_min_count     = 2
api_max_count     = 6

mail_from_address = "no-reply@forum500.club"

github_repository           = "plotify/forum500"
create_github_oidc_provider = false # already created by staging in the same account
deploy_branches             = ["main"]
frontend_branch             = "main"

enable_amplify = true
enable_waf     = true
alert_emails   = ["vivek.n@plotify.co"]
