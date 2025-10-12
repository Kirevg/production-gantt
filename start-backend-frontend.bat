REM @echo off
chcp 65001 >nul

start "Stop Server" cmd /k "cd /d C:\Projects\production-gantt\api && taskkill /f /im node.exe"


start "Backend Server" cmd /k "cd /d C:\Projects\production-gantt\api && npm run dev"

REM cd /d "C:\Projects\production-gantt\api"

REM start "Backend Server" cmd /k "npm run dev"

start "Frontend Server" cmd /k "cd /d C:\Projects\production-gantt\web && npm run dev"

REM cd /d "C:\Projects\production-gantt\web"

REM start "Frontend Server" cmd /k "npm run dev"

echo Запущены оба сервера!

REM pause