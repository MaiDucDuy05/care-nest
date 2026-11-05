#!/bin/bash
set -euo pipefail

dnf update -y
dnf install -y awscli2 docker git
systemctl enable --now docker
usermod -aG docker ec2-user

mkdir -p /opt/carenest/{app,env,data,edge}
chown -R ec2-user:ec2-user /opt/carenest

