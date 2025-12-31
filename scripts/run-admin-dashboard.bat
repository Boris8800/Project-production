@echo off
REM Admin Dashboard Launcher for Ken
REM This script starts the admin web interface on port 3000

echo ========================================
echo   Admin Trip Management Dashboard
echo   For: Ken (Administrator)
echo ========================================
echo.

cd /d "%~dp0..\frontend"

if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo Starting Admin Dashboard...
echo Admin Interface: http://localhost:3000/(admin)/trips
echo Login Page: http://localhost:3000/tenants/admin
echo.
echo Press Ctrl+C to stop the server
echo.

set PORT=3000
set NEXT_PUBLIC_API_URL=http://localhost:3001

call npm run dev -- --port 3000

if errorlevel 1 (
    echo Dev server failed, trying production build...
    call npm run build
    call npm run start -- --port 3000
)

pause
