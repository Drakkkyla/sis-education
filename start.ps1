# PowerShell script to start the application
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SIS Education Platform - Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get current directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if .env exists in backend
$envPath = Join-Path $scriptPath "backend\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    $envContent = @"
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sis-education
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
NODE_ENV=development
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
"@
    Set-Content -Path $envPath -Value $envContent -Encoding UTF8
    Write-Host ".env file created!" -ForegroundColor Green
}

# Check if node_modules exist
$backendNodeModules = Join-Path $scriptPath "backend\node_modules"
$frontendNodeModules = Join-Path $scriptPath "frontend\node_modules"

if (-not (Test-Path $backendNodeModules)) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location (Join-Path $scriptPath "backend")
    npm install
    Set-Location $scriptPath
}

if (-not (Test-Path $frontendNodeModules)) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location (Join-Path $scriptPath "frontend")
    npm install
    Set-Location $scriptPath
}

Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Green
Write-Host ""

# Start backend
Write-Host "Starting backend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\backend'; npm run dev"

# Wait a bit
Start-Sleep -Seconds 3

# Start frontend
Write-Host "Starting frontend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\frontend'; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Servers are starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

