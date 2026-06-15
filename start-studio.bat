@echo off
title InkOS Studio Launcher
chcp 65001 >nul

rem ===================================================
rem   InkOS Studio Launcher (with Auto Clean & Proxy)
rem ===================================================

echo [1/3] Checking and cleaning up existing processes on ports 3000 and 4567...

rem Kill process on port 3000 (Proxy)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo [Clean] Killing existing process %%a on port 3000...
    taskkill /f /pid %%a >nul 2>&1
)

rem Kill process on port 4567 (Studio)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4567" ^| findstr "LISTENING"') do (
    echo [Clean] Killing existing process %%a on port 4567...
    taskkill /f /pid %%a >nul 2>&1
)

rem 2. Check and start the API Proxy
if exist rotating-proxy.js (
    echo [2/3] Starting API Proxy on port 3000 in background...
    start "InkOS API Proxy" /min node rotating-proxy.js
) else (
    echo [WARN] rotating-proxy.js not found. Starting Studio directly.
)

rem 3. Start Studio and auto-open browser
echo [3/3] Starting InkOS Studio Workbench...
echo Once started, the browser will open http://localhost:4567 automatically.
echo Note: Run 'pnpm build' first if you modified core code.
echo ===================================================

node packages/cli/dist/index.js studio

pause
