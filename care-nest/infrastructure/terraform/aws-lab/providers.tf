provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "CareNest"
      Environment = "aws-lab"
      ManagedBy   = "Terraform"
      DeleteAfter = var.delete_after
    }
  }
}

