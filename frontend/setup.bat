@echo off
REM ChatX Frontend Setup Script for Windows
REM This script installs dependencies and sets up the improved frontend

echo.
echo =============================
echo ChatX Frontend Setup
echo =============================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo [OK] Node.js is installed
node --version
echo [OK] npm version:
npm --version
echo.

REM Install dependencies
echo [INFO] Installing dependencies...
call npm install

if %ERRORLEVEL% EQU 0 (
    echo [OK] Dependencies installed successfully
) else (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo =============================
echo Setup complete!
echo =============================
echo.
echo Documentation:
echo   - README_IMPROVEMENTS.md - Overview of improvements
echo   - PERFORMANCE_GUIDE.md - Performance optimization guide
echo   - QUICK_START.md - Quick start guide
echo.
echo Next steps:
echo   1. npm start          - Start development server
echo   2. npm run build      - Build for production
echo   3. npm run analyze    - Analyze bundle size
echo.
echo Happy coding!
echo.
pause
