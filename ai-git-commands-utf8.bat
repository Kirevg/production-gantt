@echo off
chcp 65001 >nul
REM Быстрые Git команды для AI-ассистента с поддержкой UTF-8
REM Использование: ai-git-commands-utf8.bat [команда]

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
for /f "tokens=1-3 delims=/" %%a in ('date /t') do (set mydate=%%c-%%b-%%a)
for /f "tokens=1-3 delims=:" %%a in ('time /t') do (set mytime=%%a:%%b:%%c)
set mytime=%mytime: =%
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
echo [AI] Статус репозитория:
git status --short
goto end

:diff
REM Показать изменения
echo [AI] Изменения:
git diff --stat
goto end

:help
echo [AI] Доступные команды:
echo   save "описание" - сохранить снапшот
echo   history        - показать историю
echo   back           - откатиться на 1 шаг
echo   status         - показать статус
echo   diff           - показать изменения
goto end

:end
