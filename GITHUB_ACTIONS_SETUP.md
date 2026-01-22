# GitHub Actions Self-Hosted Runner Setup

Deploy automatically to your local PC when you push to GitHub.

## Overview

- **Workflow**: Push to GitHub → GitHub Actions triggers → Self-hosted runner on your PC → Auto-deploy to Docker

## Setup Instructions

### Step 1: Create GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a name: "GitHub Actions Runner"
4. Select scopes:
   - ✅ `repo` (full control of private repositories)
   - ✅ `workflow` (update GitHub Action workflows)
5. Click "Generate token"
6. **Copy the token** (you'll need it soon)

### Step 2: Download & Configure Runner

```powershell
# Create runner directory
mkdir C:\github-runner
cd C:\github-runner

# Download runner
$url = "https://github.com/actions/runner/releases/download/v2.317.0/actions-runner-win-x64-2.317.0.zip"
Invoke-WebRequest -Uri $url -OutFile "runner.zip"

# Extract
Expand-Archive -Path runner.zip -DestinationPath .
```

### Step 3: Register Runner with GitHub

```powershell
cd C:\github-runner

# Replace YOUR_GITHUB_TOKEN with the token you created
# Replace yourusername with your actual GitHub username
.\config.cmd --url https://github.com/yourusername/Wist --token YOUR_GITHUB_TOKEN
```

When prompted:
- **Runner name**: `wist-local-runner` (or any name)
- **Runner group**: `Default`
- **Work folder**: `.` (default is fine)
- **Replace existing**: Type `Y` if asked

### Step 4: Install as Windows Service (Optional but Recommended)

This makes the runner auto-start with Windows:

```powershell
# Run as Administrator
cd C:\github-runner

# Install service
.\config.cmd --url https://github.com/yourusername/Wist --token YOUR_GITHUB_TOKEN --name "wist-github-runner" --runasservice

# Start service
Start-Service "GitHub Actions Runner" -ErrorAction SilentlyContinue

# Verify it's running
Get-Service "GitHub Actions Runner"
```

### Step 5: Start Running Deployments

Two ways to start:

**Option A: Run interactive (keep terminal open)**
```powershell
cd C:\github-runner
.\run.cmd
```

**Option B: Run as service (auto-starts with Windows)**
```powershell
Start-Service "GitHub Actions Runner"

# Check status
Get-Service "GitHub Actions Runner"

# View logs
Get-EventLog -LogName "GitHub Actions Runner" -Newest 10
```

### Step 6: Push Code to GitHub

```powershell
cd C:\Users\hp\Wist

git add .
git commit -m "Add GitHub Actions auto-deployment"
git push origin main
```

Now watch the magic happen! 🚀

## Verify Setup

### Check Runner is Connected

1. Go to: https://github.com/yourusername/Wist/settings/actions/runners
2. You should see your runner listed as **online** (green dot)

### Trigger Deployment

```powershell
# Make any change and push
echo "# Updated" >> README.md
git add .
git commit -m "Trigger deployment"
git push origin main

# Go to GitHub → Actions tab → Watch the workflow run
```

### View Workflow Logs

1. Go to: https://github.com/yourusername/Wist/actions
2. Click the latest workflow run
3. Click "deploy" job to see logs

## What Happens on Push

1. **Trigger**: Code pushed to `main` branch
2. **GitHub Actions starts**: Workflow `deploy.yml` runs
3. **Your PC is notified**: Self-hosted runner receives the job
4. **Steps executed**:
   - ✅ Stop current containers
   - ✅ Pull latest code
   - ✅ Build new Docker images
   - ✅ Start containers
   - ✅ Verify deployment
5. **Result**: App updated on your local server automatically!

## Monitoring

### View Active Jobs
```powershell
# GitHub Actions → Actions tab

# Or via CLI (if you install GitHub CLI)
gh workflow view deploy.yml
gh run list
```

### View Docker Logs
```powershell
cd C:\Users\hp\Wist

# Check if containers are running
docker ps

# View logs
docker-compose logs -f

# Restart containers manually
docker-compose restart
```

### Service Status
```powershell
# Check if runner service is running
Get-Service "GitHub Actions Runner"

# Restart service
Restart-Service "GitHub Actions Runner"

# Stop service
Stop-Service "GitHub Actions Runner"
```

## Troubleshooting

### Runner Shows as Offline

```powershell
# Restart the service
Restart-Service "GitHub Actions Runner"

# Or run interactive
cd C:\github-runner
.\run.cmd
```

### Deployment Fails

1. Check workflow logs on GitHub
2. SSH and run manually:
   ```powershell
   cd C:\Users\hp\Wist
   docker-compose up -d --build
   ```

### Docker Errors

```powershell
# Check Docker is running
docker ps

# Restart Docker Desktop
# (or run: Restart-Service docker)

# Check logs
docker-compose logs --tail=50
```

### Port Already in Use

Update `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Change from 3000 to 3001
  - "5001:5000"  # Change from 5000 to 5001
```

## Uninstall Runner (If Needed)

```powershell
# Stop service
Stop-Service "GitHub Actions Runner"

# Remove service
sc.exe delete "GitHub Actions Runner"

# Delete folder
Remove-Item -Recurse -Force C:\github-runner
```

## Next Steps

1. ✅ Create GitHub token
2. ✅ Download & configure runner
3. ✅ Install as Windows service
4. ✅ Push code to GitHub
5. ✅ Watch auto-deployment happen!

**Your deployment pipeline is ready!** 🎉
