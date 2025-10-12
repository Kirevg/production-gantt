@echo off
REM Git Control Panel - Главное меню управления Git
title Git Control Panel

:menu
cls
echo ==========================================
echo        Git Control Panel
echo ==========================================
echo.
echo 1. Git Manager (интерактивный режим)
echo 2. Быстрый снапшот
echo 3. История (последние 20)
echo 4. Откат на 1 шаг назад
echo 5. Статус и изменения
echo.
echo 6. Автокоммит (запустить в фоне)
echo.
echo AI Команды (для ассистента):
echo   a. AI: Сохранить состояние
echo   b. AI: Показать историю
echo   c. AI: Откатиться назад
echo.
echo 0. Выход
echo.
choice /c 1234560abc /n /m "Выберите действие: "

if errorlevel 11 goto ai-back
if errorlevel 10 goto ai-history
if errorlevel 9 goto ai-save
if errorlevel 8 goto autocommit
if errorlevel 6 goto status
if errorlevel 5 goto rollback
if errorlevel 4 goto history
if errorlevel 3 goto snapshot
if errorlevel 2 goto manager
if errorlevel 1 goto exit

:manager
cls
echo Запуск Git Manager...
powershell -ExecutionPolicy Bypass -File git-manager.ps1
goto menu

:snapshot
cls
set /p desc="Описание снапшота: "
git add .
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%b-%%a)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a:%%b)
git commit -m "[SNAPSHOT] %mydate% %mytime% - %desc%"
echo.
echo Снапшот создан!
pause
goto menu

:history
cls
echo === История изменений ===
git log --oneline --decorate --graph -20
echo.
pause
goto menu

:rollback
cls
echo ВНИМАНИЕ! Откат на 1 шаг назад!
echo.
git log --oneline -3
echo.
set /p confirm="Продолжить? (yes/no): "
if /i "%confirm%"=="yes" (
    git add .
    git commit -m "[AUTO] Before rollback" 2>nul
    git reset --hard HEAD~1
    echo Откат выполнен!
) else (
    echo Отменено
)
pause
goto menu

:status
cls
echo === Статус ===
git status
echo.
echo === Изменения ===
git diff --stat
echo.
pause
goto menu

:autocommit
cls
echo Запуск автокоммита в фоновом режиме...
start "Git Auto-Commit" cmd /k auto-commit.bat
echo Автокоммит запущен!
timeout /t 2
goto menu

:ai-save
cls
ai-git-commands.bat save
pause
goto menu

:ai-history
cls
ai-git-commands.bat history
pause
goto menu

:ai-back
cls
ai-git-commands.bat back
pause
goto menu

:exit
echo До свидания!
timeout /t 1
exit

