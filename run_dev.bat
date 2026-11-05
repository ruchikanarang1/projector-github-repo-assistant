@echo off
title Projector AI - Dev Launcher
echo ========================================================
echo   PROJECTOR // AUTONOMOUS REPO COMPANION RUNTIME
echo ========================================================
echo.

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "Projector Backend" cmd /k "backend\venv\Scripts\python.exe backend\run.py"

echo [2/2] Starting Vite React PWA on http://localhost:5173 ...
cd frontend
start "Projector Frontend" cmd /k "npm run dev"

echo.
echo ========================================================
echo  All services started!
echo  - Frontend Web App:  http://localhost:5173
echo  - Backend API Docs:  http://127.0.0.1:8000/docs
echo ========================================================
echo.
pause

