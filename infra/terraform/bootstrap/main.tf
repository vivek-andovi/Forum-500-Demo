# One-time bootstrap: creates the S3 bucket + DynamoDB table that hold Terraform state
# for every environment. Run once per AWS account with local state:
#   cd infra/terraform/bootstrap && terraform init && terraform apply -var="state_bucket_name=forum500-terraform-state-<account-id>"
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.70" }
  }
}

variable "aws_region" {
  type    = string
  default = "eu-west-2"
}

variable "state_bucket_name" {
  type        = string
  description = "Globally unique name for the Terraform state bucket."
}

variable "lock_table_name" {
  type    = string
  default = "forum500-terraform-locks"
}

provider "aws" {
  region = var.aws_region
  default_tags { tags = { Project = "forum500", ManagedBy = "terraform", Stack = "bootstrap" } }
}

resource "aws_s3_bucket" "state" {
  bucket = var.state_bucket_name
  lifecycle { prevent_destroy = true }
}

resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

resource "aws_s3_bucket_public_access_block" "state" {
  bucket                  = aws_s3_bucket.state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "locks" {
  name         = var.lock_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"
  attribute {
    name = "LockID"
    type = "S"
  }
  point_in_time_recovery { enabled = true }
}

output "state_bucket" { value = aws_s3_bucket.state.id }
output "lock_table" { value = aws_dynamodb_table.locks.name }
