output "role_arn" {
  description = "Set as the AWS_DEPLOY_ROLE_ARN secret on the GitHub environment."
  value       = aws_iam_role.deploy.arn
}
