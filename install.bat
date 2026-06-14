@echo off
title Tunecraft - Install
cd /d "%~dp0server"

echo ===============================================
echo            Tunecraft - first-time setup
echo ===============================================
echo.

REM --- Check Node.js is installed ---
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed.
  echo Download it from https://nodejs.org ^(v22.5 or later^) and run this again.
  echo.
  pause
  exit /b 1
)

REM --- Install npm dependencies ---
echo Installing npm dependencies, please wait...
call npm install
if errorlevel 1 (
  echo.
  echo [ERROR] Dependency install failed. See messages above.
  pause
  exit /b 1
)

REM --- Copy .env from the template if it does not exist ---
if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo.
  echo Created server\.env from the example template.
  echo Open it and paste a free API key if you want the AI assistant.
)

echo.
echo ===============================================
echo  Install complete.
echo  Next steps:
echo    1. fetch-audio.bat   (downloads the demo MP3s)
echo    2. start.bat         (runs the app)
echo ===============================================
echo.
pause
