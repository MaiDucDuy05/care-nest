# GitHub Actions CI/CD to AWS lab

This project uses GitHub Actions for quality checks and AWS deployment. The workflow is [ci-cd.yml](../../.github/workflows/ci-cd.yml).

## Security model

GitHub Actions does not receive a long-lived AWS access key. It requests a short-lived OIDC token and assumes the Terraform-created AWS role. The role trust is restricted to:

- repository `MaiDucDuy05/care-nest`;
- GitHub Environment `aws-lab`;
- audience `sts.amazonaws.com`.

Create the GitHub Environment before enabling deployment:

1. Repository **Settings > Environments > New environment**: create `aws-lab`.
2. Require reviewers and restrict deployment branches to `main`.
3. Add environment variables, not secrets:
   - `AWS_REGION=ap-southeast-1`
   - `AWS_ACCOUNT_ID=<your 12-digit account ID>`
   - `AWS_DEPLOY_ROLE_ARN=<terraform output github_deploy_role_arn>`
   - `AWS_ARTIFACT_BUCKET=<terraform output artifact_bucket_name>`

OIDC requires the job permission `id-token: write`; it does not itself grant AWS permissions. The AWS role trust and policy determine what the workflow can do. [GitHub OIDC on AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws), [AWS IAM OIDC role guidance](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html).

## Bootstrap sequence

1. Apply `infrastructure/terraform/aws-lab` locally once. It creates the GitHub OIDC provider, deploy role, private artifact bucket and EC2 instance role.
2. Save `github_deploy_role_arn` and `artifact_bucket_name` Terraform outputs as the GitHub Environment variables above.
3. On every EC2, complete the one-time runtime setup in the multi-EC2 runbook:
   - create the service's `/opt/carenest/compose.yml`;
   - put its runtime `.env` in `/opt/carenest/env` with mode `600`;
   - for frontend machines, create its systemd unit;
   - install Docker Compose and AWS CLI v2.
4. Merge a change to `main`, approve the protected `aws-lab` environment, then watch the rollout.

Secrets remain on EC2 or in AWS Secrets Manager/Parameter Store. Source artifacts contain no `.env`, `node_modules`, `.next` or Git history.

## Workflow behavior

- Pull request: install, format check, lint, type-check, tests, build and Terraform formatting. It never reaches AWS.
- Push to `main`: the same checks run first. On success, the deploy job waits for the protected `aws-lab` environment approval.
- Deploy: archives the `care-nest` source at the exact Git SHA; uploads it to private S3; uses SSM Run Command to deploy each backend, then each frontend.
- The workflow does not migrate the database and does not restart Postgres, Kafka, Redis or MeiliSearch. Run migrations deliberately in a controlled maintenance step.

## Rollback

The artifact key is commit SHA based. To roll back, run the workflow from the known-good commit through GitHub's workflow UI, or manually use the corresponding `releases/<SHA>/carenest.tgz` artifact. Do not roll back database schema blindly.

## Required first-run checks

- `terraform output github_deploy_role_arn` and `terraform output artifact_bucket_name` have values.
- All EC2 instances show as managed nodes in Systems Manager.
- `aws s3 cp` works from an instance using its EC2 role.
- Service tag names match the Terraform inventory (`api_gateway`, `web_buyer`, etc.).
- First deployment is tested with only a non-critical frontend/service before the full rollout.

