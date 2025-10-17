@echo off
chcp 65001 >nul

echo.
echo 🚀 Быстрая настройка Production Gantt...
echo.

REM Проверяем наличие Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js не установлен!
    echo 📥 Скачайте Node.js с https://nodejs.org/
    echo 💡 Рекомендуется LTS версия (18.x или 20.x)
    pause
    exit /b 1
)

echo ✅ Node.js найден
node --version

echo.
echo 📥 Установка зависимостей API...
cd api
if not exist node_modules (
    echo 🔄 Устанавливаем зависимости...
    npm install
    if errorlevel 1 (
        echo ❌ Ошибка установки зависимостей API
        pause
        exit /b 1
    )
) else (
    echo ✅ Зависимости API уже установлены
)
cd ..

echo.
echo 📥 Установка зависимостей Frontend...
cd web
if not exist node_modules (
    echo 🔄 Устанавливаем зависимости...
    npm install
    if errorlevel 1 (
        echo ❌ Ошибка установки зависимостей Frontend
        pause
        exit /b 1
    )
) else (
    echo ✅ Зависимости Frontend уже установлены
)
cd ..

echo.
echo ✅ Зависимости установлены!
echo.
echo 🔧 ВАЖНО: Настройте api\.env с Neon.tech connection string
echo 💡 Пример:
echo    DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
echo    JWT_SECRET="your-super-secret-jwt-key-here"
echo.
echo 🚀 Запуск системы...
.\start-backend-frontend.bat

echo.
echo 🎯 Система запущена!
echo 🌐 Frontend: http://localhost:5173
echo 🔗 API: http://localhost:4000
echo.
pause
