@echo off
REM Apply Booking Numbers Migration
REM This script adds booking_number column and generates numbers for existing bookings

echo ============================================
echo Booking Numbers Migration
echo ============================================
echo.

REM Check if PostgreSQL connection details are set
if "%DB_HOST%"=="" set DB_HOST=localhost
if "%DB_PORT%"=="" set DB_PORT=5432
if "%DB_NAME%"=="" set DB_NAME=your_database
if "%DB_USER%"=="" set DB_USER=postgres

echo Database: %DB_NAME%
echo Host: %DB_HOST%:%DB_PORT%
echo User: %DB_USER%
echo.

REM Run the migration
echo Running migration...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "%~dp0database\add-booking-numbers.sql"

if %errorlevel% equ 0 (
    echo.
    echo ✓ Migration completed successfully!
    echo.
    echo Next steps:
    echo 1. Rebuild backend: cd backend ^&^& npm run build
    echo 2. Restart backend server
    echo 3. Test by creating a new booking
) else (
    echo.
    echo ✗ Migration failed!
    echo Please check the error messages above.
)

echo.
pause
