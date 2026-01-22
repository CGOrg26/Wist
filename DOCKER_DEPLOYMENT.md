# Docker Deployment Guide for Wist

## Files Created
- `docker-compose.yml` - Orchestrates both frontend and backend services
- `server/Dockerfile` - Builds the Node.js backend
- `client/Dockerfile` - Builds and serves the React frontend
- `server/.dockerignore` - Optimizes server Docker build
- `client/.dockerignore` - Optimizes client Docker build

## Prerequisites
1. Docker installed on your server
2. Docker Compose installed on your server

## Deployment Steps

### Local Testing
```powershell
# From project root directory
docker-compose up --build

# Access services:
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

### Production Deployment

#### Option 1: Using Docker Compose (Recommended for Simple Setup)
```bash
# SSH into your server
ssh user@your-server.com

# Clone your repository
git clone https://github.com/yourusername/Wist.git
cd Wist

# Build and run
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Option 2: Manual Docker Commands
```bash
# Build backend image
docker build -t wist-server:latest ./server

# Build frontend image
docker build -t wist-client:latest ./client

# Run backend
docker run -d --name wist-server -p 5000:5000 \
  -e NODE_ENV=production \
  -e CLIENT_URL=http://your-domain.com \
  wist-server:latest

# Run frontend
docker run -d --name wist-client -p 3000:3000 \
  -e VITE_API_URL=http://your-backend-url:5000 \
  wist-client:latest
```

## Environment Variables

### Server (.env or docker-compose.yml)
```
NODE_ENV=production
CLIENT_URL=http://your-frontend-domain.com
PORT=5000
```

### Client (.env or docker-compose.yml)
```
VITE_API_URL=http://your-backend-domain.com:5000
```

## Reverse Proxy Setup (Nginx)
```nginx
# Backend proxy
upstream backend {
    server 127.0.0.1:5000;
}

# Frontend proxy
upstream frontend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name www.your-domain.com;

    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Useful Commands

```bash
# View running containers
docker ps

# View container logs
docker logs wist-server
docker logs wist-client

# Execute command in container
docker exec -it wist-server node --version

# Restart services
docker-compose restart

# Rebuild specific service
docker-compose up -d --build server
```

## SSL/HTTPS Setup (with Let's Encrypt)
```bash
sudo apt-get install certbot python3-certbot-nginx

# For each domain
sudo certbot certonly --standalone -d api.your-domain.com
sudo certbot certonly --standalone -d www.your-domain.com

# Update nginx config with ssl certificates
```

## Health Checks
Add to `docker-compose.yml` for automatic container restart:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

## Monitoring
```bash
# CPU and memory usage
docker stats

# Container inspection
docker inspect wist-server
```
