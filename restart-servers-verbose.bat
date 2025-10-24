@echo off
echo ========================================
echo   ПЕРЕЗАПУСК СЕРВЕРОВ PRODUCTION GANTT
echo ========================================
echo.
echo Запускаем PowerShell скрипт...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0restart-servers.ps1"
echo.
echo Скрипт завершен. Нажмите любую клавишу для выхода...
pause >nul
