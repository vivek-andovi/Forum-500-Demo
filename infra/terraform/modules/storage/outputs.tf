output "bucket_name" { value = aws_s3_bucket.assets.id }
output "bucket_arn" { value = aws_s3_bucket.assets.arn }
output "distribution_id" { value = aws_cloudfront_distribution.assets.id }
output "distribution_domain" { value = aws_cloudfront_distribution.assets.domain_name }
output "public_base_url" {
  value = var.domain_name != "" ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.assets.domain_name}"
}
