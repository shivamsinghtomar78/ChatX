@echo off
echo Starting ChatX Application...
echo.

echo Starting Backend Server...
start "Backend" cmd /k "cd /d %~dp0 && python api_server.py"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
start "Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause > nul