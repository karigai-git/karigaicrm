@echo off
echo Starting Konipai CRM...

REM Check if dist directory exists
if not exist "dist" (
  echo Error: dist directory not found. Make sure to build the app first with 'npm run build'
  exit /b 1
)

REM Check if dist-server directory exists
if not exist "dist-server" (
  echo Error: dist-server directory not found. Make sure to build the server first with 'npm run build:server'
  exit /b 1
)

REM Start the frontend server
echo Starting frontend server...
start "Frontend Server" cmd /c npx serve -s dist -p 8080

REM Start the backend server
echo Starting backend server...
start "Backend Server" cmd /c node dist-server/server.js

echo Konipai CRM is now running!
echo - Frontend: http://localhost:8080
echo - Backend: http://localhost:3000
echo.
echo To stop the servers, close the opened command prompt windows or press Ctrl+C in this window and then Y to terminate the batch job
pause 