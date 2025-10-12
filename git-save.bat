@echo off
REM Быстрый коммит изменений в Git
echo Добавление файлов в Git...
git add .
echo.
echo Введите описание изменений:
set /p message="Описание: "
git commit -m "%message%"
echo.
echo Готово!
pause

