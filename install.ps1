# PowerShell script to install dependencies
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SIS Education Platform - Installation" -ForegroundColor Cyan
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

# Install root dependencies
Write-Host "Installing root dependencies..." -ForegroundColor Yellow
npm install

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Set-Location (Join-Path $scriptPath "backend")
npm install
Set-Location $scriptPath

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location (Join-Path $scriptPath "frontend")
npm install
Set-Location $scriptPath

# Create .env file if it doesn't exist
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

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Installation completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Make sure MongoDB is running" -ForegroundColor White
Write-Host "2. Run seed script: cd backend && npm run seed" -ForegroundColor White
Write-Host "3. Start the application: .\start.ps1" -ForegroundColor White
Write-Host ""

