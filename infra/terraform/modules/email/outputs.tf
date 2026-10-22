output "identity_arn" { value = aws_ses_domain_identity.this.arn }
output "configuration_set" { value = aws_ses_configuration_set.this.name }
output "dns_records" {
  description = "Records to add at your DNS provider when Route 53 is not used."
  value       = local.dns_records
}
