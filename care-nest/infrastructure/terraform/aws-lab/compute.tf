data "aws_ssm_parameter" "al2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

resource "aws_instance" "service" {
  for_each = var.instances

  ami                         = data.aws_ssm_parameter.al2023.value
  instance_type               = each.value.instance_type
  subnet_id                   = aws_subnet.lab_public.id
  private_ip                  = each.value.private_ip
  associate_public_ip_address = each.value.public_ip
  vpc_security_group_ids = [
    for group_name in each.value.security_groups :
    aws_security_group.this[group_name].id
  ]

  iam_instance_profile        = aws_iam_instance_profile.ssm.name
  key_name                    = var.key_name
  user_data                   = file("${path.module}/bootstrap.sh")
  user_data_replace_on_change = true

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

