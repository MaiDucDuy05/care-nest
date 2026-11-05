data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  availability_zone = coalesce(var.availability_zone, data.aws_availability_zones.available.names[0])

  security_group_names = toset([
    "edge",
    "iot",
    "web",
    "gateway",
    "backend",
    "postgres",
    "redis",
    "kafka",
    "meili",
    "ops",
  ])

  # Every application VM needs egress in this learning topology because no NAT
  # gateway is provisioned. Inbound rules below remain least-privilege.
  inbound_rules = {
    edge_http = {
      group = "edge", from_port = 80, to_port = 80, cidr_ipv4 = "0.0.0.0/0", source_group = null
    }
    edge_https = {
      group = "edge", from_port = 443, to_port = 443, cidr_ipv4 = "0.0.0.0/0", source_group = null
    }
    iot_tcp = {
      group = "iot", from_port = 18800, to_port = 18800, cidr_ipv4 = "0.0.0.0/0", source_group = null
    }
    ops_ssh = {
      group = "ops", from_port = 22, to_port = 22, cidr_ipv4 = var.admin_cidr, source_group = null
    }
    edge_to_web = {
      group = "web", from_port = 3000, to_port = 3030, cidr_ipv4 = null, source_group = "edge"
    }
    edge_to_gateway = {
      group = "gateway", from_port = 8080, to_port = 8080, cidr_ipv4 = null, source_group = "edge"
    }
    gateway_to_backend = {
      group = "backend", from_port = 3001, to_port = 3010, cidr_ipv4 = null, source_group = "gateway"
    }
    edge_to_alert = {
      group = "backend", from_port = 3007, to_port = 3007, cidr_ipv4 = null, source_group = "edge"
    }
    edge_to_chat = {
      group = "backend", from_port = 3010, to_port = 3010, cidr_ipv4 = null, source_group = "edge"
    }
    iot_to_device = {
      group = "backend", from_port = 3003, to_port = 3003, cidr_ipv4 = null, source_group = "iot"
    }
    backend_to_postgres = {
      group = "postgres", from_port = 5432, to_port = 5432, cidr_ipv4 = null, source_group = "backend"
    }
    backend_to_redis = {
      group = "redis", from_port = 6379, to_port = 6379, cidr_ipv4 = null, source_group = "backend"
    }
    backend_to_kafka = {
      group = "kafka", from_port = 9092, to_port = 9092, cidr_ipv4 = null, source_group = "backend"
    }
    iot_to_kafka = {
      group = "kafka", from_port = 9092, to_port = 9092, cidr_ipv4 = null, source_group = "iot"
    }
    backend_to_meili = {
      group = "meili", from_port = 7700, to_port = 7700, cidr_ipv4 = null, source_group = "backend"
    }
  }
}

