# Deploy Without Docker (Manual Node.js Setup)

If your server doesn't have Docker, you can deploy Node.js directly.

## Server Prerequisites

SSH into your server and install:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18 or higher)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager to keep app running)
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt-get install -y nginx

# Verify installations
node --version
npm --version
pm2 --version
```

## Manual Deployment Steps

### Step 1: Clone Repository on Server

```bash
cd /home/username
git clone https://github.com/fariioodaazz/Wist.git
cd Wist
```

### Step 2: Install Dependencies

```bash
# Backend
cd server
npm install
cd ..

# Frontend
cd client
npm install
npm run build
cd ..
```

### Step 3: Start Backend with PM2

```bash
cd /home/username/Wist/server

# Start with PM2
pm2 start index.js --name "wist-server"

# Save PM2 config (auto-start on reboot)
pm2 save
pm2 startup

# Check status
pm2 status
```

### Step 4: Serve Frontend

```bash
cd /home/username/Wist/client

# Option A: Using 'serve' package
npm install -g serve
pm2 start "serve -s dist -l 3000" --name "wist-client"

# Option B: Using Nginx (recommended)
# (See Nginx setup below)
```

### Step 5: Setup Nginx as Reverse Proxy

Create `/etc/nginx/sites-available/wist`:

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable Nginx config:

```bash
sudo ln -s /etc/nginx/sites-available/wist /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Auto-Deployment Script

Create `/home/username/Wist/deploy.sh`:

```bash
#!/bin/bash

cd /home/username/Wist

# Pull latest code
git pull origin deploy

# Install dependencies
cd server && npm install && cd ..
cd client && npm install && npm run build && cd ..

# Restart services
pm2 restart wist-server
pm2 restart wist-client

echo "✅ Deployment completed at $(date)"
```

Make it executable:

```bash
chmod +x /home/username/Wist/deploy.sh
```

## GitHub Actions for Auto-Deployment (Without Docker)

Update `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Server

on:
  push:
    branches:
      - deploy

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Deploy via SSH
        env:
          SERVER_HOST: ${{ secrets.SERVER_HOST }}
          SERVER_USER: ${{ secrets.SERVER_USER }}
          SERVER_SSH_KEY: ${{ secrets.SERVER_SSH_KEY }}
        run: |
          mkdir -p ~/.ssh
          echo "$SERVER_SSH_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H $SERVER_HOST >> ~/.ssh/known_hosts
          
          ssh -i ~/.ssh/deploy_key $SERVER_USER@$SERVER_HOST '/home/username/Wist/deploy.sh'
```

## Add GitHub Secrets

1. Go to: https://github.com/fariioodaazz/Wist/settings/secrets/actions
2. Add these secrets:
   - `SERVER_HOST`: Your server IP (e.g., 123.45.67.89)
   - `SERVER_USER`: Your username (e.g., ubuntu)
   - `SERVER_SSH_KEY`: Your SSH private key

## Monitor Services

```bash
# View PM2 status
pm2 status

# View logs
pm2 logs wist-server
pm2 logs wist-client

# Restart services
pm2 restart all

# Stop services
pm2 stop all

# Remove services
pm2 delete all
```

## SSL/HTTPS Setup (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Troubleshooting

### Port Already in Use
```bash
sudo lsof -i :3000
sudo lsof -i :5000
sudo kill -9 <PID>
```

### Check Nginx Status
```bash
sudo systemctl status nginx
sudo nginx -t
```

### View Application Logs
```bash
pm2 logs
tail -f /var/log/nginx/error.log
```

---

**This setup works perfectly without Docker and auto-deploys on every push!** 🚀
