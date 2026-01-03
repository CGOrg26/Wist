# Railway Deployment Guide for Wist

## Prerequisites
1. Railway account (railway.app)
2. GitHub repo pushed with latest code

## Deployment Steps

### Step 1: Create Server Service
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your `Wist` repository
4. When prompted, select `server` folder as root
5. Railway auto-detects Node.js and installs dependencies

**Environment Variables to Add:**
- `NODE_ENV`: `production`

### Step 2: Create Client Service
1. In the same project, click "New Service"
2. Select "GitHub" → same repo
3. Select `client` folder as root
4. Update build command to: `npm install && npm run build`
5. Update start command to: `npm run preview` or use Static Site

**Environment Variables to Add:**
- `VITE_API_URL`: Get the server URL from Railway → Settings → Domains

### Step 3: Link Services (Optional)
1. In Railway dashboard, you can view both services
2. Copy the server's public URL
3. Paste it into client's `VITE_API_URL` environment variable

## Alternative: Use Railway CLI

```powershell
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create new project
railway init

# Deploy
railway up

# View logs
railway logs

# Add environment variables
railway variables
```

## Service URLs
- Server: `https://wist-server-prod.railway.app`
- Client: `https://wist-client-prod.railway.app`

## Notes
- Railway supports monorepos with multiple services
- Automatic deployments on git push
- SQLite database stored on Railway's persistent storage
- Socket.IO works perfectly with Railway
