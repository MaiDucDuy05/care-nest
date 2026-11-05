variable "aws_region" {
  description = "AWS Region for this disposable learning lab."
  type        = string
  default     = "ap-southeast-1"
}

variable "availability_zone" {
  description = "Optional explicit AZ. Leave null to select the first available AZ in the region."
  type        = string
  default     = null
}

variable "admin_cidr" {
  description = "Your public IPv4 CIDR for emergency SSH access, for example 203.0.113.10/32."
  type        = string

  validation {
    condition     = can(cidrhost(var.admin_cidr, 0))
    error_message = "admin_cidr must be a valid IPv4 or IPv6 CIDR."
  }
}

variable "delete_after" {
  description = "Reminder tag in YYYY-MM-DD format. It does not automatically delete resources."
  type        = string

  validation {
    condition     = can(regex("^\\d{4}-\\d{2}-\\d{2}$", var.delete_after))
    error_message = "delete_after must have the format YYYY-MM-DD."
  }
}

variable "key_name" {
  description = "Optional EC2 key-pair name. Leave null when using only SSM Session Manager."
  type        = string
  default     = null
}

variable "github_repository" {
  description = "GitHub owner/repository trusted to deploy this lab through OIDC."
  type        = string
  default     = "MaiDucDuy05/care-nest"
}

variable "github_deploy_environment" {
  description = "Protected GitHub Environment required by the OIDC trust policy."
  type        = string
  default     = "aws-lab"
}

variable "github_oidc_provider_arn" {
  description = "Existing GitHub Actions OIDC provider ARN. Set this instead of creating a duplicate provider in an account that already has one."
  type        = string
  default     = null
  nullable    = true
}

variable "artifact_retention_days" {
  description = "How many days GitHub source release artifacts are retained in S3."
  type        = number
  default     = 14

  validation {
    condition     = var.artifact_retention_days >= 1
    error_message = "artifact_retention_days must be at least one day."
  }
}

variable "instances" {
  description = "One EC2 entry per CareNest workload."
  type = map(object({
    private_ip      = string
    instance_type   = string
    security_groups = set(string)
    root_gb         = number
    public_ip       = bool
  }))

  validation {
    condition = alltrue([
      for instance in values(var.instances) :
      instance.root_gb >= 16 && can(cidrhost("${instance.private_ip}/32", 0))
    ])
    error_message = "Every instance needs a valid IPv4 private_ip and at least a 16 GiB root volume."
  }
}

