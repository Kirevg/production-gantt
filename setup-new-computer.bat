@echo off
echo 🚀 Настройка Production Gantt на новом компьютере
echo.

echo 📋 Проверка требований...
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Git не найден! Установите Git: https://git-scm.com/
    pause
    exit /b 1
)

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Docker не найден! Установите Docker Desktop: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

echo ✅ Все требования выполнены!
echo.

echo 🔧 Настройка переменных окружения...
if not exist .env (
    if exist env.example (
        copy env.example .env
        echo ✅ Создан файл .env из env.example
    ) else (
        echo ⚠️  Файл env.example не найден, создайте .env вручную
    )
) else (
    echo ✅ Файл .env уже существует
)

echo.
echo 🐳 Запуск Docker контейнеров...
echo Это может занять несколько минут при первом запуске...
echo.

docker-compose down
docker-compose up --build -d

echo.
echo ⏳ Ожидание запуска сервисов...
timeout /t 10 /nobreak >nul

echo.
echo 🔍 Проверка статуса сервисов...
docker-compose ps

echo.
echo 🎉 Настройка завершена!
echo.
echo 📱 Доступ к приложению:
echo    Frontend: http://localhost
echo    API: http://localhost:4001
echo.
echo 📝 Следующие шаги:
echo    1. Откройте http://localhost в браузере
echo    2. Создайте администратора: node api\create-admin.js
echo    3. Начните разработку!
echo.
pause
