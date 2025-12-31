#!/usr/bin/env pwsh
# Admin Dashboard Launcher for Ken
# This script starts the admin web interface on port 3000

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Admin Trip Management Dashboard" -ForegroundColor Green
Write-Host "  For: Ken (Administrator)" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set the project directory
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$FrontendDir = Join-Path $ProjectRoot "frontend"

# Check if frontend directory exists
if (-not (Test-Path $FrontendDir)) {
    Write-Host "Error: Frontend directory not found at $FrontendDir" -ForegroundColor Red
    exit 1
}

# Navigate to frontend directory
Set-Location $FrontendDir

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Set environment variables
$env:PORT = "3000"
$env:NEXT_PUBLIC_API_URL = "http://localhost:3001"

Write-Host ""
Write-Host "Starting Admin Dashboard..." -ForegroundColor Green
Write-Host "Admin Interface: http://localhost:3000/(admin)/trips" -ForegroundColor Cyan
Write-Host "Login Page: http://localhost:3000/tenants/admin" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the development server on port 3000
npm run dev -- --port 3000

# If dev fails, try build and start
if ($LASTEXITCODE -ne 0) {
    Write-Host "Dev server failed, trying production build..." -ForegroundColor Yellow
    npm run build
    npm run start -- --port 3000
}
