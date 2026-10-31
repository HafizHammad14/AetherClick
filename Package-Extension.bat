@echo off
echo ========================================================
echo    Packaging AetherClick Chrome Extension (Manifest V3)
echo    Designed & Developed by Hammad Designz
echo ========================================================
echo.

set SCRIPT_DIR=%~dp0
set EXT_DIR=%SCRIPT_DIR%AetherClick-Chrome-Extension
set ZIP_FILE=%SCRIPT_DIR%AetherClick-Chrome-Extension.zip

if exist "%ZIP_FILE%" del /F /Q "%ZIP_FILE%"

echo Creating %ZIP_FILE%...
powershell -NoProfile -Command "Compress-Archive -Path '%EXT_DIR%\*' -DestinationPath '%ZIP_FILE%' -Force"

if exist "%ZIP_FILE%" (
    echo.
    echo [SUCCESS] Chrome Extension package created successfully!
    echo Location: %ZIP_FILE%
) else (
    echo.
    echo [ERROR] Failed to create extension package.
)
pause
