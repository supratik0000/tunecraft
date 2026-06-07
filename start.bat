@echo off
title Tunecraft Music Player
cd /d "%~dp0server"

echo ===============================================
echo            Tunecraft Music Player
echo ===============================================
echo.

REM --- Check Node.js is installed ---
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed.
  echo Download it from https://nodejs.org then run this again.
  echo.
  pause
  exit /b 1
)

REM --- Install dependencies on first run ---
if not exist "node_modules\" (
  echo Installing dependencies, please wait... ^(first run only^)
  call npm install
  if errorlevel 1 (
    echo [ERROR] Dependency install failed. See messages above.
    pause
    exit /b 1
  )
)

REM --- Create .env from the template if it does not exist ---
if not exist ".env" copy ".env.example" ".env" >nul

REM --- Open the app in your browser once the server has booted ---
start "" /b cmd /c "timeout /t 4 >nul && explorer http://localhost:4000"

echo.
echo Starting server at http://localhost:4000
echo (Keep this window open. Press Ctrl+C or close it to stop.)
echo.

call npm start

echo.
echo Server stopped.
pause
