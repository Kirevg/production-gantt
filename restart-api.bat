@echo off
chcp 65001 >nul
echo Остановка серверов...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo Запуск серверов...
start "API Server" cmd /k "cd /d C:\Projects\production-gantt\api & npm run dev"
start "Frontend Server" cmd /k "cd /d C:\Projects\production-gantt\web & npm run dev"

echo Готово!
pause
