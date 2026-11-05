# Projector AI - PowerShell Dev Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  PROJECTOR // AUTONOMOUS REPO COMPANION RUNTIME" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Start Backend in new window
Write-Host "[1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$Root'; & 'backend\venv\Scripts\python.exe' backend\run.py"

# 2. Start Frontend in new window
Write-Host "[2/2] Starting Vite React PWA on http://localhost:5173 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$Root\frontend'; & 'C:\nvm4w\nodejs\npm.cmd' run dev"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Both services launched in dedicated terminal windows!" -ForegroundColor Green
Write-Host "  - Frontend App: http://localhost:5173" -ForegroundColor Yellow
Write-Host "  - API Swagger:  http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

