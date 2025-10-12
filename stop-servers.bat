@echo off
chcp 65001 >nul

echo Закрытие серверов...

REM Убиваем процессы node.exe
taskkill /f /im node.exe 2>nul

REM Закрываем окна CMD по заголовку через PowerShell
powershell -Command "Get-Process | Where-Object {$_.MainWindowTitle -match 'Backend Server|Frontend Server|Stop Server'} | ForEach-Object {Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue}"

echo Серверы закрыты!
timeout /t 2 /nobreak >nul
