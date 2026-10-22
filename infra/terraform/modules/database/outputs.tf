output "endpoint" { value = aws_db_instance.this.address }
output "port" { value = aws_db_instance.this.port }
output "identifier" { value = aws_db_instance.this.identifier }

output "database_url" {
  description = "Prisma connection string (TLS required)."
  value       = "postgresql://${aws_db_instance.this.username}:${random_password.master.result}@${aws_db_instance.this.address}:${aws_db_instance.this.port}/${aws_db_instance.this.db_name}?schema=public&sslmode=require"
  sensitive   = true
}
