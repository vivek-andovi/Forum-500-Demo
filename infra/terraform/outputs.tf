output "api_url" { value = local.api_url }
output "alb_dns_name" {
  description = "Point api.<domain> here (CNAME/alias) if you don't use Route 53."
  value       = module.api.alb_dns_name
}
output "assets_base_url" { value = module.storage.public_base_url }
output "assets_bucket" { value = module.storage.bucket_name }
output "cloudfront_domain" { value = module.storage.distribution_domain }
output "rds_endpoint" { value = module.database.endpoint }
output "ecr_repository_url" { value = module.registry.repository_url }
output "ecs_cluster" { value = module.api.cluster_name }
output "ecs_service" { value = module.api.service_name }
output "task_definition_family" { value = module.api.task_definition_family }
output "api_secret_arn" { value = module.api.secret_arn }
output "github_deploy_role_arn" {
  description = "Add as AWS_DEPLOY_ROLE_ARN on the matching GitHub environment."
  value       = module.github_oidc.role_arn
}
output "ses_dns_records" {
  description = "Add these at your DNS provider if Route 53 is not managing the domain."
  value       = module.email.dns_records
}
output "web_default_url" { value = var.enable_amplify ? module.web[0].default_domain : null }
output "admin_default_url" { value = var.enable_amplify ? module.admin[0].default_domain : null }
output "alerts_topic_arn" { value = module.monitoring.alerts_topic_arn }
