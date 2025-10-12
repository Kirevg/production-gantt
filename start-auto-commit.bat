@echo off
chcp 65001 >nul
echo ====================================
echo Автоматическое протоколирование Git
echo ====================================
echo.
echo Выберите режим:
echo 1. Простой (коммит каждые 5 минут)
echo 2. Детальный с логированием (PowerShell)
echo 3. Быстрый режим (каждую минуту)
echo.
choice /c 123 /n /m "Ваш выбор (1-3): "

if errorlevel 3 goto fast
if errorlevel 2 goto detailed
if errorlevel 1 goto simple

:simple
echo.
echo Запуск простого режима...
start "Git Auto-Commit" cmd /k auto-commit.bat
goto end

:detailed
echo.
echo Запуск детального режима...
start "Git Auto-Commit (Detailed)" powershell -ExecutionPolicy Bypass -File auto-commit-detailed.ps1
goto end

:fast
echo.
echo Запуск быстрого режима (60 секунд)...
start "Git Auto-Commit (Fast)" powershell -ExecutionPolicy Bypass -File auto-commit-detailed.ps1 -IntervalSeconds 60
goto end

:end
echo.
echo Автокоммит запущен в отдельном окне!
echo Для остановки закройте окно или нажмите Ctrl+C
pause

