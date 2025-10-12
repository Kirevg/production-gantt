@echo off
REM Автоматический коммит изменений каждые N секунд
echo Запуск автоматического протоколирования изменений...
echo Коммиты будут создаваться автоматически при наличии изменений
echo Нажмите Ctrl+C для остановки
echo.

:loop
git add . 2>nul
git diff-index --quiet HEAD -- 2>nul
if errorlevel 1 (
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%b-%%a)
    for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a:%%b)
    git commit -m "Auto-commit: %mydate% %mytime%" >nul 2>&1
    echo [%date% %time%] Изменения сохранены
) else (
    echo [%date% %time%] Нет изменений
)
timeout /t 300 /nobreak >nul
goto loop

