data "aws_caller_identity" "current" {}

locals {
  github_oidc_provider_arn = coalesce(
    var.github_oidc_provider_arn,
    try(aws_iam_openid_connect_provider.github[0].arn, null),
  )
}

resource "aws_iam_openid_connect_provider" "github" {
  count = var.github_oidc_provider_arn == null ? 1 : 0

  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]

  tags = {
    Name = "github-actions-oidc"
  }
}

data "aws_iam_policy_document" "github_deploy_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [local.github_oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    # GitHub Environment protection rules control who can reach this subject.
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repository}:environment:${var.github_deploy_environment}"]
    }
  }
}

resource "aws_iam_role" "github_deploy" {
  name_prefix        = "carenest-lab-github-deploy-"
  assume_role_policy = data.aws_iam_policy_document.github_deploy_assume_role.json

  tags = {
    Name = "carenest-lab-github-deploy"
  }
}

data "aws_iam_policy_document" "github_deploy" {
  statement {
    sid = "UploadVersionedReleaseArtifacts"

    actions = [
      "s3:AbortMultipartUpload",
      "s3:PutObject",
    ]

    resources = ["${aws_s3_bucket.artifacts.arn}/releases/*"]
  }

  statement {
    sid       = "ListReleaseArtifacts"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.artifacts.arn]

    condition {
      test     = "StringLike"
      variable = "s3:prefix"
      values   = ["releases/*"]
    }
  }

  # SSM Run Command authorizes against both an AWS managed document and target
  # instances. The GitHub Environment trust condition is the main guardrail;
  # run this lab in a dedicated AWS account where possible.
  statement {
    sid = "DeployOnlyThroughSsm"

    actions = [
      "ec2:DescribeInstances",
      "ssm:GetCommandInvocation",
      "ssm:ListCommandInvocations",
      "ssm:SendCommand",
    ]

    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "github_deploy" {
  name_prefix = "carenest-lab-github-deploy-"
  role        = aws_iam_role.github_deploy.id
  policy      = data.aws_iam_policy_document.github_deploy.json
}

