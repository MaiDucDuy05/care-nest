# `infrastructure/` — DevOps

Local-dev and deployment manifests.

```
infrastructure/
├── docker/    # compose / Dockerfiles for local dev
└── k8s/       # Helm charts and raw manifests for staging + production
```

| Path                 | Purpose                                       |
| -------------------- | --------------------------------------------- |
| `docker/Dockerfile.service` | Multi-stage Dockerfile for any `backend/<service>/` — used by `docker build --build-arg SERVICE=auth-service …` |
| `docker/iot-gateway.Dockerfile` | Specialized Dockerfile for the IoT TCP gateway (smaller surface, only the iot-codec + shared deps) |
| `k8s/<service>/`     | One folder per service: deployment, service, configmap, hpa, etc. |
| `k8s/dev/`           | Local-dev manifests (namespace, configmap, secret) for k3d/kind/minikube |

## AWS learning lab

For the intentionally distributed AWS lab where each CareNest service runs on its own EC2, see [AWS multi-EC2 learning lab](../docs/aws-multi-ec2-learning-lab.md). It includes the instance inventory, VPC/security-group matrix, deployment order, runtime configuration, and teardown checklist. The runnable infrastructure-as-code module is in [`terraform/aws-lab/`](./terraform/aws-lab/); its guide is [Terraform AWS multi-EC2 lab](../docs/terraform-aws-multi-ec2-lab.md).

The GitHub Actions OIDC + S3 artifact + SSM deployment flow is documented in [GitHub Actions AWS CI/CD](../docs/github-actions-aws-cicd.md).
