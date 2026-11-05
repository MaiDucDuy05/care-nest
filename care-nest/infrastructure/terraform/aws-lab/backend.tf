terraform {
  # Create the S3 bucket outside this root module, then initialize with:
  # terraform init -backend-config=backend.hcl
  backend "s3" {}
}

