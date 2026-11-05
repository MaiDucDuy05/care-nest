resource "aws_vpc" "lab" {
  cidr_block           = "10.42.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "carenest-aws-lab"
  }
}

resource "aws_internet_gateway" "lab" {
  vpc_id = aws_vpc.lab.id

  tags = {
    Name = "carenest-aws-lab-igw"
  }
}

resource "aws_subnet" "lab_public" {
  vpc_id                  = aws_vpc.lab.id
  cidr_block              = "10.42.0.0/24"
  availability_zone       = local.availability_zone
  map_public_ip_on_launch = true

  tags = {
    Name = "carenest-aws-lab-public"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.lab.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.lab.id
  }

  tags = {
    Name = "carenest-aws-lab-public"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.lab_public.id
  route_table_id = aws_route_table.public.id
}

