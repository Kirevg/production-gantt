@echo off
REM ========================================
REM   ПЕРЕЗАПУСК СЕРВЕРОВ PRODUCTION GANTT
REM ========================================

REM Устанавливаем кодировку UTF-8
chcp 65001 >nul

echo.
echo Закрываем старые процессы...

REM Закрываем все процессы Node.js
taskkill /f /im node.exe 2>nul

REM Закрываем все cmd окна через PowerShell
powershell -Command "Get-Process cmd | Where-Object { $_.MainWindowTitle -match 'PRODUCTION' } | Stop-Process -Force" 2>nul

REM Ждем 2 секунды
timeout /t 2 /nobreak >nul

echo.
echo Запускаем API сервер...
start "PRODUCTION-GANTT-API" cmd /k "cd /d C:\Projects\production-gantt\api && npm run dev"

echo Запускаем Frontend сервер...
start "PRODUCTION-GANTT-FRONTEND" cmd /k "cd /d C:\Projects\production-gantt\web && npm run dev"

echo.
echo ========================================
echo    СЕРВЕРЫ ЗАПУЩЕНЫ!
echo ========================================
echo API: http://localhost:4000
echo Frontend: http://localhost:5173
echo.

pause
