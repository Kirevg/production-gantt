@echo off
REM Создание снапшота текущего состояния
REM Использование: git-snapshot.bat "описание изменения"

if "%~1"=="" (
    set desc=Snapshot before changes
) else (
    set desc=%~1
)

echo Creating snapshot...
git add .
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%b-%%a)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a:%%b)
git commit -m "[SNAPSHOT] %mydate% %mytime% - %desc%"
echo Snapshot created: %desc%

