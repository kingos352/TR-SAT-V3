$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot\..\..

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " TR-SAT Mission Control V3 - Desktop Build " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Build Frontend
Write-Host "Building Frontend..." -ForegroundColor Cyan
cd frontend
npm run build
cd ..

# 2. Copy Frontend to desktop directory
Write-Host "Copying Frontend Dist to Desktop..." -ForegroundColor Cyan
if (-not (Test-Path "desktop\frontend-dist")) {
    New-Item -ItemType Directory -Path "desktop\frontend-dist" | Out-Null
}
Copy-Item -Path "frontend\dist\*" -Destination "desktop\frontend-dist" -Recurse -Force

# 3. Package Backend
& .\desktop\scripts\package-backend.ps1

# 4. Build Desktop App
Write-Host "Building Electron Shell..." -ForegroundColor Cyan
cd desktop
npm install
npm run dist
cd ..

Write-Host "Desktop packaging complete! Check dist-desktop folder." -ForegroundColor Green
