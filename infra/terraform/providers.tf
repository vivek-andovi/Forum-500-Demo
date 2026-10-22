provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "forum500"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# CloudFront certificates must live in us-east-1.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "forum500"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
