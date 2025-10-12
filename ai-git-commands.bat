@echo off
REM Быстрые Git команды для AI-ассистента
REM Использование: ai-git-commands.bat [команда]

if "%1"=="" goto help

if "%1"=="save" goto save
if "%1"=="history" goto history
if "%1"=="back" goto back
if "%1"=="status" goto status
if "%1"=="diff" goto diff
goto help

:save
REM Быстрое сохранение текущего состояния
echo [AI] Создание снапшота...
git add .
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%b-%%a)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a:%%b)
if "%~2"=="" (
    set desc=AI checkpoint
) else (
    set desc=%~2
)
git commit -m "[AI-SNAPSHOT] %mydate% %mytime% - %desc%"
echo [AI] Снапшот сохранен
goto end

:history
REM Показать последние 10 коммитов
echo [AI] История изменений:
git log --oneline --decorate -10
goto end

:back
REM Откатиться на 1 шаг назад
echo [AI] Откат на 1 шаг назад...
git add .
git commit -m "[AI-AUTO] Before rollback" 2>nul
git reset --hard HEAD~1
echo [AI] Откат выполнен
goto end

:status
REM Показать статус
echo [AI] Текущий статус:
git status --short
goto end

:diff
REM Показать изменения
echo [AI] Текущие изменения:
git diff --stat
goto end

:help
echo =====================================
echo AI Git Commands - Быстрые команды
echo =====================================
echo.
echo Использование: ai-git-commands.bat [команда]
echo.
echo Команды:
echo   save [описание]  - Сохранить текущее состояние
echo   history          - Показать историю (10 последних)
echo   back             - Откатиться на 1 шаг назад
echo   status           - Показать статус изменений
echo   diff             - Показать изменения
echo.
echo Примеры:
echo   ai-git-commands.bat save "Fixed drag and drop"
echo   ai-git-commands.bat back
echo   ai-git-commands.bat history
goto end

:end

