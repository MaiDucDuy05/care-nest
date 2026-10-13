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
