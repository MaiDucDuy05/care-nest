# CareNest AWS multi-EC2 Terraform lab

This root module provisions the disposable infrastructure described in [the deployment runbook](../../../docs/aws-multi-ec2-learning-lab.md): one EC2 per frontend, backend, or data workload.

It intentionally creates a large, single-AZ lab that consumes AWS credit quickly. It is not a production baseline and must not contain health data or customer data.

## Before apply

1. Turn on MFA, Free Tier alerts, and a Budget.
2. Create an S3 bucket manually (or with a separate bootstrap stack): versioning enabled, public access blocked.
3. Copy the examples without committing the resulting local files:

   ```bash
   cp backend.hcl.example backend.hcl
   cp terraform.tfvars.example terraform.tfvars
   ```

4. Edit `backend.hcl` with the state bucket name. Edit `terraform.tfvars` with your public IP as `admin_cidr` and a near `delete_after` date.
5. Authenticate with AWS SSO and confirm the account:

   ```bash
   aws configure sso
   aws sts get-caller-identity
   ```

## Provision

```bash
terraform init -backend-config=backend.hcl
terraform fmt -recursive
terraform validate
terraform plan -out=tfplan
terraform show tfplan
terraform apply tfplan
```

`terraform plan` must show the intended VPC, security groups, IAM role/profile, and 20 EC2 instances only. Do not apply if it includes NAT Gateway, load balancers, RDS, MSK, or any unexpected object.

After apply, save the inventory without committing it:

```bash
terraform output -json > inventory.generated.json
```

Follow the deployment runbook for application setup. Terraform only bootstraps Docker/git and directories; it never receives application secrets.

## Destroy

When the learning session ends:

```bash
terraform plan -destroy -out=tfplan-destroy
terraform show tfplan-destroy
terraform apply tfplan-destroy
```

Then check AWS Billing, EBS snapshots, and the state bucket. Do not remove the state bucket before `destroy`.

