bucket         = "forum500-terraform-state-<account-id>"
key            = "forum500/staging/terraform.tfstate"
region         = "eu-west-2"
dynamodb_table = "forum500-terraform-locks"
encrypt        = true
