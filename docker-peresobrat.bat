@echo off
echo Stopping Production Gantt System...

REM Переходим в директорию проекта
cd /d "C:\Projects\production-gantt"

REM Останавливаем контейнеры
echo Stopping containers...
docker-compose down

echo System stopped successfully!

docker-compose up --build -d web

echo Starting Production Gantt System...

REM Переходим в директорию проекта
cd /d "C:\Projects\production-gantt"

REM Проверяем, что Docker запущен
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Останавливаем старые контейнеры
echo Stopping old containers...
docker-compose down

REM Собираем и запускаем новые контейнеры
echo Building and starting containers...
docker-compose up --build -d

REM Ждем запуска сервисов
echo Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Проверяем статус
echo Checking service status...
docker-compose ps

echo.
echo System started successfully!
echo.
echo Services:
echo - Web Frontend: http://localhost
echo - API Backend: http://localhost:4001
echo - Database: localhost:5432
echo.
echo To stop the system, run: docker-compose down
echo.
pause
