# Hướng dẫn Terraform cho CareNest multi-EC2 lab

Terraform là công cụ **Infrastructure as Code (IaC)**: thay vì tạo VPC, security group và 20 EC2 bằng AWS Console, ta khai báo chúng bằng file `.tf`, xem thay đổi bằng `terraform plan`, rồi tạo/xóa đồng bộ qua `terraform apply` và `terraform destroy`.

Tài liệu này dùng Terraform dựng **hạ tầng AWS** cho [multi-EC2 lab](./aws-multi-ec2-learning-lab.md). Root module hoàn chỉnh nằm tại [`infrastructure/terraform/aws-lab`](../infrastructure/terraform/aws-lab). Terraform không thay thế pipeline deploy app: Docker/Next.js vẫn triển khai qua SSM hoặc CI/CD sau khi EC2 sẵn sàng.

## 1. Quy tắc an toàn

- Lab đầy đủ có 20–21 EC2 và tiêu credit nhanh. Bật MFA, Free Tier alerts và AWS Budget trước `apply`.
- Không ghi password, JWT secret, payment key hoặc `.env` vào `.tf`, `.tfvars`, `user_data`, Git hoặc Terraform state.
- Không dùng `remote-exec` để deploy app thường xuyên. Terraform quản lý hạ tầng; SSM/Ansible/CI quản lý release.
- Không tạo NAT Gateway, ALB, RDS, MSK, ElastiCache hoặc Elastic IP trong lab.
- Luôn review `terraform plan` trước apply, và `terraform plan -destroy` trước dọn lab.

## 2. Chuẩn bị local

Cài Terraform CLI và AWS CLI, xác thực bằng IAM Identity Center/SSO thay vì access key dài hạn:

```bash
terraform version
aws --version
aws configure sso
aws sts get-caller-identity
```

Chỉ dùng region `ap-southeast-1` (Singapore). Role khởi đầu cần quyền quản lý VPC, EC2, Security Group, IAM instance profile và S3 state bucket. Có thể dùng AdministratorAccess cho lab cá nhân, sau đó thu hẹp policy.

## 3. Terraform state

Terraform state là mapping giữa code và resource AWS đã tạo. Không có state, Terraform không biết EC2/VPC nào cần thay đổi hay xóa.

- Học một mình có thể bắt đầu local state.
- Trước apply quan trọng hoặc khi có nhiều người dùng, dùng S3 backend.
- State có thể chứa giá trị nhạy cảm: không commit `terraform.tfstate`, plan files hoặc `.tfvars` chứa secret.
- State bucket bật versioning, block public access và S3 lockfile. HashiCorp khuyến nghị versioning để khôi phục state nếu xóa/sửa nhầm. [S3 backend](https://developer.hashicorp.com/terraform/language/backend/s3)

Tạo state bucket một lần bằng Console hoặc Terraform bootstrap project tách biệt. Không để root module tự tạo bucket backend của chính nó.

```hcl
terraform {
  backend "s3" {
    bucket       = "TEN-DUY-NHAT-carenest-tf-state"
    key          = "aws-lab/terraform.tfstate"
    region       = "ap-southeast-1"
    encrypt      = true
    use_lockfile = true
  }
}
```

Không hard-code AWS credential trong backend; dùng SSO profile/environment credential. Không chạy `-lock=false`; lock tránh hai lượt apply ghi state cùng lúc. [State locking](https://developer.hashicorp.com/terraform/language/state/locking)

## 4. Cấu trúc code đề xuất

```text
infrastructure/terraform/aws-lab/
├── versions.tf
├── providers.tf
├── variables.tf
├── terraform.tfvars.example
├── network.tf
├── security.tf
├── iam.tf
├── compute.tf
├── outputs.tf
├── bootstrap.sh
└── .gitignore
```

`.gitignore`:

```gitignore
.terraform/
*.tfstate
*.tfstate.*
*.tfvars
!terraform.tfvars.example
*.tfplan
crash.log
```

## 5. Provider, inputs và inventory

`versions.tf`:

```hcl
terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0, < 7.0"
    }
  }
}
```

`providers.tf`:

```hcl
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
```

`variables.tf`:

```hcl
variable "aws_region"   { type = string, default = "ap-southeast-1" }
variable "admin_cidr"   { type = string }
variable "delete_after" { type = string }
variable "key_name"     { type = string, default = null }

variable "instances" {
  type = map(object({
    private_ip      = string
    instance_type   = string
    security_groups = set(string)
    root_gb         = number
    public_ip       = bool
  }))
}
```

Copy `terraform.tfvars.example` thành `terraform.tfvars` cục bộ. Bảng multi-EC2 đầy đủ ở tài liệu lab; input cần map một key cho mỗi workload. Ví dụ:

```hcl
aws_region   = "ap-southeast-1"
admin_cidr   = "203.0.113.10/32"
delete_after = "2026-12-01"

instances = {
  edge        = { private_ip = "10.42.0.10", instance_type = "t3.micro", security_groups = ["edge", "ops"],     root_gb = 20, public_ip = true }
  web_buyer   = { private_ip = "10.42.0.11", instance_type = "t3.micro", security_groups = ["web", "ops"],      root_gb = 20, public_ip = true }
  api_gateway = { private_ip = "10.42.0.20", instance_type = "t3.micro", security_groups = ["gateway", "ops"],  root_gb = 20, public_ip = true }
  auth        = { private_ip = "10.42.0.21", instance_type = "t3.micro", security_groups = ["backend", "ops"],  root_gb = 20, public_ip = true }
  iot_gateway = { private_ip = "10.42.0.31", instance_type = "t3.micro", security_groups = ["iot", "ops"],      root_gb = 20, public_ip = true }
  postgres    = { private_ip = "10.42.0.40", instance_type = "t3.small", security_groups = ["postgres", "ops"], root_gb = 30, public_ip = true }
  redis       = { private_ip = "10.42.0.41", instance_type = "t3.micro", security_groups = ["redis", "ops"],    root_gb = 20, public_ip = true }
  kafka       = { private_ip = "10.42.0.42", instance_type = "t3.small", security_groups = ["kafka", "ops"],    root_gb = 30, public_ip = true }
}
```

Bổ sung 3 frontend, 12 backend service và MeiliSearch theo private-IP inventory trong tài liệu lab. Không có NAT Gateway nên tất cả instance có public IPv4 để pull Docker/kết nối SSM; Security Group vẫn chặn inbound ngoài HTTPS ở edge và TCP 18800 ở IoT. Service-to-service luôn dùng private IP `10.42.0.x`.

## 6. Network, security group và compute pattern

`network.tf` tối thiểu:

```hcl
resource "aws_vpc" "lab" {
  cidr_block           = "10.42.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = { Name = "carenest-lab" }
}

resource "aws_internet_gateway" "lab" {
  vpc_id = aws_vpc.lab.id
}

resource "aws_subnet" "lab_public" {
  vpc_id                  = aws_vpc.lab.id
  cidr_block              = "10.42.0.0/24"
  availability_zone        = "ap-southeast-1a"
  map_public_ip_on_launch = true
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.lab.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.lab.id
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.lab_public.id
  route_table_id = aws_route_table.public.id
}
```

Trong `security.tf`, tạo SG theo bảng sau. Dùng security group ID làm source cho traffic nội bộ, không hard-code CIDR nội bộ:

| SG | Inbound |
|---|---|
| edge | 80/443 từ Internet |
| iot | 18800 từ Internet hoặc IP SIM/device |
| web | 3000/3020/3030 chỉ từ SG edge |
| gateway | 8080 chỉ từ SG edge |
| backend | 3001–3010 từ SG gateway; edge thêm 3007, 3010 |
| postgres / redis / kafka / meili | 5432 / 6379 / 9092 / 7700 chỉ từ SG backend; Kafka thêm SG iot |
| ops | 22 chỉ từ `var.admin_cidr`, hoặc không mở SSH nếu chỉ dùng SSM |

Lấy Amazon Linux 2023 qua public SSM parameter thay vì hard-code AMI ID:

```hcl
data "aws_ssm_parameter" "al2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}
```

`compute.tf` dùng `for_each` để có một EC2 cho mỗi key trong inventory:

```hcl
resource "aws_instance" "service" {
  for_each = var.instances

  ami                         = data.aws_ssm_parameter.al2023.value
  instance_type               = each.value.instance_type
  subnet_id                   = aws_subnet.lab_public.id
  private_ip                  = each.value.private_ip
  associate_public_ip_address = each.value.public_ip
  vpc_security_group_ids      = [for name in each.value.security_groups : aws_security_group.this[name].id]
  iam_instance_profile        = aws_iam_instance_profile.ssm.name
  key_name                    = var.key_name
  user_data                   = file(join("/", [path.module, "bootstrap.sh"]))

  root_block_device {
    volume_type           = "gp3"
    volume_size           = each.value.root_gb
    encrypted             = true
    delete_on_termination = true
  }

  metadata_options {
    http_tokens = "required"
  }

  tags = {
    Name    = "cn-${replace(each.key, "_", "-")}-01"
    Service = each.key
  }
}
```

`iam.tf` tạo EC2 role/instance profile và gắn managed policy `AmazonSSMManagedInstanceCore`. `bootstrap.sh` chỉ cài Docker/git, enable Docker và tạo `/opt/carenest`; không có secret trong user data vì dữ liệu đó đọc được qua AWS API và có thể lưu trong state.

## 7. Apply, deploy app và destroy

Từ thư mục Terraform:

```bash
terraform init
terraform fmt -recursive
terraform validate
terraform plan -out=tfplan
terraform show tfplan
terraform apply tfplan
```

`plan` không tạo resource; chỉ apply khi số EC2/VPC/SG đúng dự kiến. [Terraform workflow](https://developer.hashicorp.com/terraform/cli/run)

Sau apply:

```bash
terraform output
terraform output -json > inventory.generated.json
aws ssm describe-instance-information --region ap-southeast-1
```

Tiếp theo deploy theo tài liệu multi-EC2:

1. PostgreSQL → Redis → Kafka → MeiliSearch.
2. Initialize Kafka topics và chạy Prisma migration **một lần**.
3. Backend → API gateway → frontends → Caddy.
4. Đặt secret qua SSM Parameter Store/Secrets Manager hoặc `/opt/carenest/env` với `chmod 600`, không qua Terraform.
5. Dùng private IP Terraform output để đặt `DATABASE_URL`, `REDIS_URL`, `KAFKA_BROKERS` và internal service URLs.

Nếu thay đổi gấp bằng Console, chạy `terraform plan` để thấy drift; review `terraform plan -refresh-only` trước khi đồng bộ state.

Dọn lab luôn review destroy plan:

```bash
terraform plan -destroy -out=tfplan-destroy
terraform show tfplan-destroy
terraform apply tfplan-destroy
```

Không xóa S3 state bucket trước destroy; nếu state mất, Terraform mất mapping tới resource thật. Sau destroy, kiểm tra Billing, snapshots, public IPv4, CloudWatch log groups và state bucket. [Destroy command](https://developer.hashicorp.com/terraform/cli/commands/destroy)

## 8. Checklist trước apply

- [ ] `aws sts get-caller-identity` là đúng account.
- [ ] `admin_cidr` là IP hiện tại, không phải `0.0.0.0/0`.
- [ ] Không có secret trong Terraform, Git, state hay plan.
- [ ] Budget/Free Tier alerts đã bật, `DeleteAfter` gần.
- [ ] Plan không tạo NAT Gateway, ALB, RDS, MSK hay resource ngoài dự kiến.
- [ ] Database/cache/broker chỉ mở cho security group cần thiết.
- [ ] Có lịch chạy destroy ngay sau buổi lab.
