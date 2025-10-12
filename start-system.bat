@echo off
chcp 65001 >nul
echo Запуск системы Production Gantt...

REM Переходим в директорию проекта
cd /d "C:\Projects\production-gantt"

REM Проверяем, что Docker запущен
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ОШИБКА: Docker не запущен. Пожалуйста, запустите Docker Desktop.
    pause
    exit /b 1
)

REM Останавливаем старые контейнеры
echo Остановка старых контейнеров...
docker-compose down

REM Собираем и запускаем новые контейнеры
echo Сборка и запуск контейнеров...
docker-compose up --build -d

REM Ждем запуска сервисов
echo Ожидание запуска сервисов...
timeout /t 10 /nobreak >nul

REM Проверяем статус
echo Проверка статуса сервисов...
docker-compose ps

echo.
echo Система успешно запущена!
echo.
echo Сервисы:
echo - Веб-интерфейс: http://localhost
echo - API Backend: http://localhost:4001
echo - База данных: localhost:5432
echo.
echo Для остановки системы выполните: docker-compose down
echo.
start http://localhost
pause