# KubeBot

An interactive chatbot that teaches Kubernetes concepts, built as a demonstration of containerization and Kubernetes orchestration patterns.

## Overview

KubeBot is a lightweight Node.js web application with a chat interface where users can ask questions about Kubernetes topics like Pods, Services, Deployments, ConfigMaps, Secrets, and more. The app itself is designed to be deployed on Kubernetes, making it a hands-on learning tool.

## Tech Stack

- **Runtime:** Node.js 18 (no external dependencies)
- **Container:** Docker (Alpine-based)
- **Orchestration:** Kubernetes

## Project Structure

```
Kube-Test/
├── dockerfile                 # Docker image definition
├── src/
│   └── app.js                 # Main application
└── k8-applications/           # Kubernetes manifests
    ├── configmap.yml           # Environment configuration
    ├── secret.yml              # Sensitive data
    ├── deployment.yml          # Deployment (3 replicas, rolling updates)
    ├── service-clusterip.yml   # Internal service
    └── service-nodeport.yml    # External service (NodePort 30080)
```

## Getting Started

### Run Locally

```bash
node src/app.js
# Open http://localhost:3000
```

### Run with Docker

```bash
docker build -t kubebot:v1 .
docker run -p 3000:3000 kubebot:v1
```

### Deploy to Kubernetes

```bash
kubectl apply -f k8-applications/
```

Or apply individually in order:

```bash
kubectl apply -f k8-applications/configmap.yml
kubectl apply -f k8-applications/secret.yml
kubectl apply -f k8-applications/deployment.yml
kubectl apply -f k8-applications/service-clusterip.yml
kubectl apply -f k8-applications/service-nodeport.yml
```

### Access the Application

```bash
# Via port-forward
kubectl port-forward svc/kubebot-internal 3000:80

# Via NodePort (minikube/kind)
# http://<node-ip>:30080
```

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Chat UI |
| `/api/chat` | POST | Send a message to the bot |
| `/health` | GET | Liveness probe |
| `/ready` | GET | Readiness probe |
| `/info` | GET | Debug info (hostname, environment) |

## Kubernetes Topics

The bot can answer questions about: `pod`, `service`, `deployment`, `replicaset`, `node`, `configmap`, `secret`, `probe`, `rollback`, `namespace`, `helm`, `kubectl`, and `docker`. Type `help` in the chat to see all topics.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `BOT_NAME` | KubeBot | Name displayed in the chat |
| `WELCOME_MSG` | (built-in) | Custom welcome message |
| `APP_ENV` | local | Environment name |
| `API_KEY` | — | API key (loaded from K8s Secret) |

## Kubernetes Features Demonstrated

- **Deployments** with rolling update strategy (3 replicas)
- **Services** — ClusterIP (internal) and NodePort (external)
- **ConfigMaps** for non-sensitive configuration
- **Secrets** for sensitive data
- **Liveness & Readiness Probes** for health checking
