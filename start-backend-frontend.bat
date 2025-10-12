@echo off
chcp 65001 >nul

REM Закрываем старые окна серверов (кроме Git Auto-Commit)
for /f "tokens=2" %%a in ('tasklist /v /fi "windowtitle eq Backend Server*" /fo list ^| find "PID:"') do taskkill /f /pid %%a 2>nul
for /f "tokens=2" %%a in ('tasklist /v /fi "windowtitle eq Frontend Server*" /fo list ^| find "PID:"') do taskkill /f /pid %%a 2>nul

REM Убиваем процессы node.exe
taskkill /f /im node.exe 2>nul

REM Пауза перед запуском
timeout /t 2 /nobreak >nul

start "Backend Server" cmd /k "cd /d C:\Projects\production-gantt\api && npm run dev"

REM cd /d "C:\Projects\production-gantt\api"

REM start "Backend Server" cmd /k "npm run dev"

start "Frontend Server" cmd /k "cd /d C:\Projects\production-gantt\web && npm run dev"

REM cd /d "C:\Projects\production-gantt\web"

REM start "Frontend Server" cmd /k "npm run dev"

echo Запущены оба сервера!

REM pause