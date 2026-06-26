@echo off
:: Force CMD to use UTF-8 encoding to prevent garbled characters
chcp 65001 > nul

title InkOS Studio
echo ===================================================
echo             Starting InkOS Studio...
echo ===================================================
echo.

:: Change directory to the workspace root where the batch file is located
cd /d "%~dp0"

:: Start the studio development workspace service (which will automatically clear ports via Node.js first)
pnpm --filter @actalk/inkos-studio dev

if errorlevel 1 (
    echo.
    echo [ERROR] Failed to start InkOS Studio. Please verify if pnpm is installed.
    pause
)
