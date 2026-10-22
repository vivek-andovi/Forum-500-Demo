terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws    = { source = "hashicorp/aws", version = "~> 5.70" }
    random = { source = "hashicorp/random", version = "~> 3.6" }
  }

  # Partial backend config: bucket/key/table come from environments/backend-<env>.hcl
  #   terraform init -backend-config=environments/backend-staging.hcl
  backend "s3" {}
}
