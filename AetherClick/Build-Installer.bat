@echo off
title AetherClick - Installer Builder
cd /d "%~dp0"

echo ========================================================
echo   AetherClick - Build Desktop Installer (.exe)
echo ========================================================
echo.

REM 1. Ensure backend engine is compiled
echo [1/3] Compiling standalone clicker engine with PyInstaller...
python -m PyInstaller --clean --noconfirm --onedir --windowed --name "aether-engine" --add-data "index.html;." --add-data "app.css;." --add-data "app.js;." --add-data "logo.png;." --add-data "app_icon.ico;." --add-data "notify.ps1;." --add-data "window_mgr.ps1;." backend.py
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to compile backend engine.
    pause
    exit /b %ERRORLEVEL%
)
copy /y "index.html" "dist\aether-engine\" >nul
copy /y "app.css" "dist\aether-engine\" >nul
copy /y "app.js" "dist\aether-engine\" >nul
copy /y "logo.png" "dist\aether-engine\" >nul
copy /y "app_icon.ico" "dist\aether-engine\" >nul
copy /y "notify.ps1" "dist\aether-engine\" >nul
copy /y "window_mgr.ps1" "dist\aether-engine\" >nul

REM 2. Ensure node_modules exists
if not exist "node_modules" (
    echo [2/3] Installing Electron dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b %ERRORLEVEL%
    )
) else (
    echo [2/3] Electron dependencies ready.
)

REM 3. Build Windows NSIS Installer with electron-builder
echo [3/3] Packaging AetherClick Installer with Electron Builder...
call npm run dist

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   BUILD SUCCESSFUL!
    echo   Installer created in:
    echo   release\AetherClick Setup 1.0.0.exe
    echo ========================================================
    echo The installer allows you to choose any installation folder
    echo on your computer, creates a Desktop shortcut, and runs
    echo completely standalone without any browser!
    echo.
) else (
    echo [ERROR] Electron build failed.
)

pause
