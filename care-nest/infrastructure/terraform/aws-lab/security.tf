resource "aws_security_group" "this" {
  for_each = local.security_group_names

  name_prefix = "carenest-lab-${each.key}-"
  description = "CareNest AWS learning lab: ${each.key}"
  vpc_id      = aws_vpc.lab.id

  tags = {
    Name = "carenest-lab-${each.key}"
  }
}

resource "aws_vpc_security_group_egress_rule" "allow_all" {
  for_each = aws_security_group.this

  security_group_id = each.value.id
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
  description       = "Lab workloads require outbound package, container, AWS API, and dependency access."
}

resource "aws_vpc_security_group_ingress_rule" "this" {
  for_each = local.inbound_rules

  security_group_id            = aws_security_group.this[each.value.group].id
  ip_protocol                  = "tcp"
  from_port                    = each.value.from_port
  to_port                      = each.value.to_port
  cidr_ipv4                    = each.value.cidr_ipv4
  referenced_security_group_id = each.value.source_group == null ? null : aws_security_group.this[each.value.source_group].id
  description                  = "CareNest lab ${each.key}"
}

