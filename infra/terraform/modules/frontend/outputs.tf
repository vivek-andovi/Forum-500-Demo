output "app_id" { value = aws_amplify_app.this.id }
output "default_domain" { value = "https://${aws_amplify_branch.this.branch_name}.${aws_amplify_app.this.default_domain}" }
