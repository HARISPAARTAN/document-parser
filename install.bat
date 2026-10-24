@echo off
echo ========================================
echo Document Parser Website Installation
echo ========================================
echo.

echo Installing backend dependencies...
npm install
if %errorlevel% neq 0 (
    echo Error installing backend dependencies
    pause
    exit /b 1
)

echo.
echo Installing frontend dependencies...
cd client
npm install
if %errorlevel% neq 0 (
    echo Error installing frontend dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo To start the application:
echo 1. Run: npm run dev
echo 2. Open: http://localhost:3000
echo.
echo Or start servers separately:
echo - Backend: npm run server
echo - Frontend: cd client && npm start
echo.
pause 