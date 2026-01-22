@echo off
REM GitHub Actions Self-Hosted Runner Setup for Local PC

echo.
echo ========================================
echo GitHub Actions Setup for Wist Project
echo ========================================
echo.

REM Check if runner folder exists
if not exist "C:\github-runner" (
    echo Creating runner directory...
    mkdir C:\github-runner
    cd C:\github-runner
) else (
    cd C:\github-runner
)

REM Download runner
echo.
echo Downloading GitHub Actions Runner...
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/actions/runner/releases/download/v2.317.0/actions-runner-win-x64-2.317.0.zip' -OutFile 'runner.zip'"

REM Extract
echo Extracting runner...
powershell -Command "Expand-Archive -Path runner.zip -DestinationPath . -Force"

echo.
echo ========================================
echo NEXT STEPS:
echo ========================================
echo.
echo 1. Go to: https://github.com/yourusername/Wist/settings/actions/runners
echo 2. Click "New self-hosted runner"
echo 3. Copy the configuration token
echo.
echo 4. Run this command (replace TOKEN with your token):
echo    cd C:\github-runner
echo    .\config.cmd --url https://github.com/yourusername/Wist --token TOKEN
echo.
echo 5. Start the runner:
echo    .\run.cmd
echo.
echo 6. Push code to GitHub - it will auto-deploy!
echo.
pause
