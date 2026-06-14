@echo off
title Tunecraft - Reset database
cd /d "%~dp0server\data"

echo ===============================================
echo   Tunecraft - reset the local database
echo ===============================================
echo.
echo This will DELETE every account, playlist, and like
echo stored in server\data\app.db. The built-in catalog
echo will be re-seeded next time you run start.bat.
echo.

set /p CONFIRM=Type YES to confirm:
if /i not "%CONFIRM%"=="YES" (
  echo Cancelled. Nothing was deleted.
  pause
  exit /b 0
)

if exist app.db     del /f /q app.db
if exist app.db-shm del /f /q app.db-shm
if exist app.db-wal del /f /q app.db-wal

echo.
echo Database reset. Run start.bat to recreate it.
pause
