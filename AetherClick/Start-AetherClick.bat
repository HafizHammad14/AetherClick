@echo off
title AetherClick Desktop App
cd /d "%~dp0"

echo ========================================================
echo   AetherClick - Liquid Glass Precision Auto Clicker
echo   Native Desktop Electron Application
echo ========================================================
echo.

if exist "release\win-unpacked\AetherClick.exe" (
    echo Launching packaged native AetherClick.exe...
    start "" "release\win-unpacked\AetherClick.exe"
    exit /b 0
)

if exist "node_modules\electron" (
    echo Launching AetherClick via Electron...
    start "" npx electron .
    exit /b 0
)

echo Electron dependencies not found. Running npm install...
call npm install
start "" npx electron .
