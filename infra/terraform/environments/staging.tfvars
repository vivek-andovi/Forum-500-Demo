environment = "staging"
aws_region  = "eu-west-2"
domain      = "forum500.club"
# route53_zone_id = "Z0123456789ABCDEFGHIJ"   # set to automate certificates + DNS + SES verification

subdomains = {
  api    = "api.staging"
  assets = "assets.staging"
  web    = "staging"
  admin  = "admin.staging"
}

vpc_cidr           = "10.40.0.0/16"
single_nat_gateway = true

db_instance_class        = "db.t4g.micro"
db_multi_az              = false
db_backup_retention_days = 7

api_cpu           = 256
api_memory        = 512
api_desired_count = 1
api_min_count     = 1
api_max_count     = 2

mail_from_address = "no-reply@forum500.club"

github_repository           = "plotify/forum500" # owner/repo
create_github_oidc_provider = true               # first environment in the account creates it
deploy_branches             = ["develop"]
frontend_branch             = "develop"

enable_amplify = true
enable_waf     = false
alert_emails   = ["vivek.n@plotify.co"]
