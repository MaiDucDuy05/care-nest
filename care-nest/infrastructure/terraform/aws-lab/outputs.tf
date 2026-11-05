output "availability_zone" {
  value       = local.availability_zone
  description = "The single availability zone used by this disposable lab."
}

output "instance_inventory" {
  description = "Use private_ip values for service-to-service environment variables and public_ip values only for DNS/IoT."
  value = {
    for name, instance in aws_instance.service : name => {
      id         = instance.id
      name       = instance.tags.Name
      private_ip = instance.private_ip
      public_ip  = instance.public_ip
      ssm_target = instance.id
    }
  }
}

output "edge_public_ip" {
  value       = try(aws_instance.service["edge"].public_ip, null)
  description = "Create buyer/seller/admin/api/chat/alert DNS records against this address."
}

output "iot_gateway_public_ip" {
  value       = try(aws_instance.service["iot_gateway"].public_ip, null)
  description = "Use this address with TCP port 18800 for the device simulator."
}

output "artifact_bucket_name" {
  value       = aws_s3_bucket.artifacts.bucket
  description = "Set this as the AWS_ARTIFACT_BUCKET GitHub Environment variable."
}

output "github_deploy_role_arn" {
  value       = aws_iam_role.github_deploy.arn
  description = "Set this as the AWS_DEPLOY_ROLE_ARN GitHub Environment variable."
}

