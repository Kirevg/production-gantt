@echo off
chcp 65001 >nul
echo Остановка системы Production Gantt...

REM Переходим в директорию проекта
cd /d "C:\Projects\production-gantt"

REM Останавливаем контейнеры
echo Остановка контейнеров...
docker-compose down

echo Система успешно остановлена!
pause