@echo off
chcp 65001 >nul

REM Проверяем, не запущен ли уже автокоммит
tasklist /fi "imagename eq cmd.exe" /fi "windowtitle eq Git Auto-Commit*" >nul 2>&1
if %errorlevel% == 0 (
    echo Автокоммит уже запущен!
    exit /b 0
)

echo Запуск автокоммита в фоне...

REM Запускаем автокоммит в фоне без окна (простейший режим каждые 5 минут)
start /b cmd /c "cd /d C:\Projects\production-gantt && auto-commit.bat"

echo Автокоммит запущен в фоне!
