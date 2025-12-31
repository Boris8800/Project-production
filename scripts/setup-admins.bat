@echo off
REM Quick Setup Script for Admin Users

echo ========================================
echo   Admin Users Setup
echo ========================================
echo.

cd /d "%~dp0..\backend"

echo Creating admin users...
echo.

node ..\scripts\setup-admin-users.js

if %errorlevel% equ 0 (
    echo.
    echo Setup complete!
    echo.
    echo You can now login with:
    echo   - admin@Project.com / @::*^&gjbBby
    echo   - ken@Project.com / YuGb78!'g44
    echo.
) else (
    echo.
    echo Setup failed!
    echo Please check:
    echo   1. PostgreSQL is running
    echo   2. Database credentials are correct
    echo   3. Database 'Project' exists
    echo.
)

pause
