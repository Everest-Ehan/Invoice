# Docker Deployment Guide

This guide will help you deploy your Invoice App using Docker.

## 🐳 Prerequisites

- Docker installed on your system
- Docker Compose installed
- Environment variables configured

## 📁 Project Structure

```
Invoice/
├── Dockerfile              # Production Dockerfile
├── Dockerfile.dev          # Development Dockerfile
├── docker-compose.yml      # Docker Compose configuration
├── .dockerignore           # Files to exclude from Docker build
├── api/                    # Backend API
├── client/                 # Frontend React app
└── .env                    # Environment variables
```

## 🚀 Quick Start

### 1. Production Deployment

```bash
# Build and run the production container
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

### 2. Development Deployment

```bash
# Uncomment the development service in docker-compose.yml first
# Then run:
docker-compose -f docker-compose.yml up invoice-app-dev
```

## 🔧 Environment Setup

Create a `.env` file in the root directory:

```env
# QuickBooks API
QUICKBOOKS_CLIENT_ID=your_quickbooks_client_id
QUICKBOOKS_CLIENT_SECRET=your_quickbooks_client_secret
QUICKBOOKS_REDIRECT_URI=http://localhost:5000/api/auth/quickbooks/callback

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Redis (if using)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Environment
NODE_ENV=production
PORT=5000
```

## 🏗️ Build Options

### Option 1: Single Container (Recommended)

```bash
# Build the image
docker build -t invoice-app .

# Run the container
docker run -p 5000:5000 --env-file .env invoice-app
```

### Option 2: Multi-Container with Docker Compose

```bash
# Build and run all services
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🔍 Development Workflow

### Hot Reload Development

1. Uncomment the development service in `docker-compose.yml`
2. Run: `docker-compose up invoice-app-dev`
3. Access:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

### Production Build

1. Build the production image: `docker build -t invoice-app .`
2. Run: `docker run -p 5000:5000 --env-file .env invoice-app`
3. Access: http://localhost:5000

## 🌐 Deployment Platforms

### Docker Hub

```bash
# Tag your image
docker tag invoice-app your-username/invoice-app:latest

# Push to Docker Hub
docker push your-username/invoice-app:latest

# Pull and run on any server
docker pull your-username/invoice-app:latest
docker run -p 5000:5000 --env-file .env your-username/invoice-app:latest
```

### AWS ECS

1. Create an ECS cluster
2. Create a task definition using the Docker image
3. Deploy as a service

### Google Cloud Run

```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/PROJECT-ID/invoice-app

# Deploy to Cloud Run
gcloud run deploy invoice-app --image gcr.io/PROJECT-ID/invoice-app --platform managed
```

### Azure Container Instances

```bash
# Deploy to Azure Container Instances
az container create \
  --resource-group myResourceGroup \
  --name invoice-app \
  --image your-username/invoice-app:latest \
  --ports 5000 \
  --environment-variables NODE_ENV=production
```

## 🔒 Security Considerations

### Production Security

1. **Use non-root user**: Already configured in Dockerfile
2. **Environment variables**: Never commit `.env` files
3. **HTTPS**: Use reverse proxy (nginx) for SSL termination
4. **Network security**: Use Docker networks for service isolation

### Example nginx.conf for HTTPS

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📊 Monitoring & Health Checks

The Docker setup includes health checks:

```bash
# Check container health
docker ps

# View health check logs
docker inspect --format='{{json .State.Health}}' container_name
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   # Change port in docker-compose.yml
   ports:
     - "5001:5000"  # Use different host port
   ```

2. **Environment variables not loading**:
   ```bash
   # Check .env file exists and has correct format
   # Ensure no spaces around = in .env file
   ```

3. **Build fails**:
   ```bash
   # Clear Docker cache
   docker system prune -a
   docker-compose build --no-cache
   ```

4. **Client not loading**:
   ```bash
   # Check if client/dist exists
   # Rebuild client: cd client && npm run build
   ```

### Debug Commands

```bash
# Enter running container
docker exec -it container_name sh

# View container logs
docker logs container_name

# Check container resources
docker stats

# Inspect container
docker inspect container_name
```

## 📈 Performance Optimization

### Multi-stage Build Benefits

- Smaller final image size
- Faster builds with layer caching
- Production-optimized dependencies

### Resource Limits

```yaml
# In docker-compose.yml
services:
  invoice-app:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Docker Hub

on:
  push:
    branches: [ main ]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Build and push Docker image
      run: |
        docker build -t your-username/invoice-app:${{ github.sha }} .
        docker push your-username/invoice-app:${{ github.sha }}
```

## 📝 Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | Yes | `production` |
| `PORT` | Server port | No | `5000` |
| `QUICKBOOKS_CLIENT_ID` | QuickBooks OAuth client ID | Yes | - |
| `QUICKBOOKS_CLIENT_SECRET` | QuickBooks OAuth secret | Yes | - |
| `OPENAI_API_KEY` | OpenAI API key | Yes | - |
| `UPSTASH_REDIS_REST_URL` | Redis URL (optional) | No | - |

## 🎯 Next Steps

1. Set up your environment variables
2. Choose your deployment platform
3. Configure SSL/HTTPS for production
4. Set up monitoring and logging
5. Implement CI/CD pipeline

Your Invoice App is now ready for Docker deployment! 🚀 