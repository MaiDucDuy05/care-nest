resource "aws_s3_bucket" "artifacts" {
  bucket_prefix = "carenest-lab-artifacts-"
  # This is intentionally disposable lab state. It lets terraform destroy
  # remove versioned source artifacts after the learning session.
  force_destroy = true

  tags = {
    Name = "carenest-lab-artifacts"
  }
}

resource "aws_s3_bucket_public_access_block" "artifacts" {
  bucket                  = aws_s3_bucket.artifacts.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  rule {
    id     = "expire-lab-releases"
    status = "Enabled"

    filter {
      prefix = "releases/"
    }

    expiration {
      days = var.artifact_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 1
    }
  }
}

data "aws_iam_policy_document" "instance_artifact_read" {
  statement {
    actions = ["s3:GetObject"]
    resources = [
      "${aws_s3_bucket.artifacts.arn}/releases/*",
    ]
  }

  statement {
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.artifacts.arn]

    condition {
      test     = "StringLike"
      variable = "s3:prefix"
      values   = ["releases/*"]
    }
  }
}

resource "aws_iam_role_policy" "instance_artifact_read" {
  name_prefix = "carenest-lab-artifact-read-"
  role        = aws_iam_role.ssm.id
  policy      = data.aws_iam_policy_document.instance_artifact_read.json
}

