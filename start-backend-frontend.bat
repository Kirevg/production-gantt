@echo off
chcp 65001 >nul

REM Закрываем старые окна серверов (кроме Git Auto-Commit)
REM Используем точное совпадение заголовка без звёздочки
taskkill /F /FI "WINDOWTITLE eq Backend Server" 2>nul
taskkill /F /FI "WINDOWTITLE eq Frontend Server" 2>nul

REM Убиваем все процессы node.exe на всякий случай
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