#!/usr/bin/env pwsh
# Quick Setup Script for Admin Users

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Admin Users Setup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $ProjectRoot "backend"
$ScriptPath = Join-Path $ProjectRoot "scripts" "setup-admin-users.js"

# Navigate to backend
Set-Location $BackendDir

Write-Host "Creating admin users..." -ForegroundColor Yellow
Write-Host ""

# Run the setup script
node $ScriptPath

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now login with:" -ForegroundColor Cyan
    Write-Host "  - admin@Project.com / @::*&gjbBby" -ForegroundColor White
    Write-Host "  - ken@Project.com / YuGb78!'g44" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Setup failed!" -ForegroundColor Red
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  1. PostgreSQL is running" -ForegroundColor White
    Write-Host "  2. Database credentials are correct" -ForegroundColor White
    Write-Host "  3. Database 'Project' exists" -ForegroundColor White
    Write-Host ""
    Write-Host "Manual setup:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor White
    Write-Host "  node ../scripts/setup-admin-users.js" -ForegroundColor White
    Write-Host ""
}

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
