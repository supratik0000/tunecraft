@echo off
title Tunecraft - Fetch demo audio
cd /d "%~dp0server"

echo ===============================================
echo     Tunecraft - download royalty-free MP3s
echo ===============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Dependencies not installed. Running install first...
  call "%~dp0install.bat"
  if errorlevel 1 exit /b 1
)

call npm run fetch-audio

echo.
echo Done. The MP3s are now in public\audio\.
pause
