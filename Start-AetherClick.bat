@echo off
title AetherClick Launcher
cd /d "%~dp0"
if exist "AetherClick" cd AetherClick

echo ========================================================
echo   AetherClick - Liquid Glass Precision Auto Clicker
echo   Native Desktop Electron Application
echo ========================================================
echo.

if exist "release\win-unpacked\AetherClick.exe" (
    echo Launching installed AetherClick.exe...
    start "" "release\win-unpacked\AetherClick.exe"
    exit /b 0
)

if exist "node_modules\electron" (
    echo Launching AetherClick Desktop App...
    start "" npx electron .
    exit /b 0
)

echo Initializing desktop environment...
call npm install
start "" npx electron .
