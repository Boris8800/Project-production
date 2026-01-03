$ErrorActionPreference = 'Stop'

Write-Host "Starting ops-dashboard (dev) at http://127.0.0.1:8090" -ForegroundColor Green
docker compose up -d --build ops-dashboard
