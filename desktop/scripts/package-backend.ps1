$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot\..\..

Write-Host "Packaging Backend with PyInstaller..." -ForegroundColor Cyan

# Ensure PyInstaller is installed in the virtual environment
$pythonExe = "backend\.venv\Scripts\python.exe"
if (-not (Test-Path $pythonExe)) {
    Write-Host "Virtual environment not found. Please run TR-SAT-Build.bat first." -ForegroundColor Red
    exit 1
}

& $pythonExe -m pip install pyinstaller

# Run PyInstaller
# Hidden imports specified by the user
$hiddenImports = "--hidden-import uvicorn --hidden-import fastapi --hidden-import websockets --hidden-import sqlalchemy --hidden-import pydantic --hidden-import pydantic_settings --hidden-import httpx --hidden-import skyfield --hidden-import sgp4 --hidden-import numpy"

$cmd = "$pythonExe -m PyInstaller --noconfirm --clean --name trsat-backend --specpath desktop\scripts --onefile $hiddenImports backend\run_desktop_backend.py"
Invoke-Expression $cmd

# Move output to desktop/backend-exe
if (-not (Test-Path "desktop\backend-exe")) {
    New-Item -ItemType Directory -Path "desktop\backend-exe" | Out-Null
}
Copy-Item "dist\trsat-backend.exe" -Destination "desktop\backend-exe\trsat-backend.exe" -Force

Write-Host "Backend packaging complete." -ForegroundColor Green
