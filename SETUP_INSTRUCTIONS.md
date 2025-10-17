# 📋 Инструкция для синхронизации проекта на другой машине

## 🎯 Production Gantt - Быстрая настройка

### 📥 1. Скачивание проекта

```bash
# Клонирование репозитория
git clone https://github.com/your-username/production-gantt.git
cd production-gantt
```

### 🔧 2. Установка зависимостей

**Убедитесь, что установлены:**
- ✅ Git
- ✅ Node.js 18+ (скачать с https://nodejs.org/)

**Установка зависимостей:**

```bash
# API сервер
cd api
npm install
cd ..

# Frontend
cd web  
npm install
cd ..
```

### 🌐 3. Настройка базы данных (Neon.tech)

**🗄️ Настройка Neon.tech:**

1. Зайти на [neon.tech](https://neon.tech)
2. Создать новый проект или использовать существующий
3. Скопировать connection string
4. Создать файл `api\.env`:

```env
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
JWT_SECRET="your-super-secret-jwt-key-here"
PORT=4000
CORS_ORIGINS="http://localhost,http://localhost:5173"
```

### 🚀 4. Запуск системы

```bash
# Запуск через батник (Windows)
.\start-backend-frontend.bat

# Или вручную:
# Терминал 1 - API
cd api
npm run dev

# Терминал 2 - Frontend  
cd web
npm run dev
```

### 🔄 5. Синхронизация изменений

**📥 Получение изменений с GitHub:**
```bash
git pull origin main
npm install  # если изменились зависимости
```

**📤 Отправка изменений на GitHub:**
```bash
git add .
git commit -m "Описание изменений"
git push origin main
```

### 🛠️ 6. Автоматизация (опционально)

**Создать батник для быстрой настройки `quick-setup.bat`:**

```batch
@echo off
chcp 65001 >nul
echo 🚀 Быстрая настройка Production Gantt...

echo 📥 Установка зависимостей API...
cd api
npm install
if errorlevel 1 (
    echo ❌ Ошибка установки зависимостей API
    pause
    exit /b 1
)
cd ..

echo 📥 Установка зависимостей Frontend...
cd web
npm install
if errorlevel 1 (
    echo ❌ Ошибка установки зависимостей Frontend
    pause
    exit /b 1
)
cd ..

echo ✅ Зависимости установлены!
echo 🔧 Не забудьте настроить api\.env с Neon.tech
echo 🚀 Запуск системы...
.\start-backend-frontend.bat
```

### 📋 7. Чек-лист для новой машины

- [ ] Git установлен
- [ ] Node.js установлен (версия 18+)
- [ ] Склонирован репозиторий с GitHub
- [ ] Установлены зависимости (`npm install` в api/ и web/)
- [ ] Настроен `.env` с Neon.tech connection string
- [ ] Запущена система (`start-backend-frontend.bat`)

### 🎯 Ключевые моменты

**✅ НЕ НУЖНО:**
- Устанавливать PostgreSQL локально
- Настраивать Docker
- Создавать локальную базу данных

**✅ НУЖНО:**
- Настроить Neon.tech в `api\.env`
- Установить зависимости через `npm install`
- Запустить API и Frontend серверы

### 🚀 Результат

Полная синхронизация с GitHub и работа с облачной базой данных!

### 🔗 Доступ к приложению

После запуска:
- **Frontend**: http://localhost:5173
- **API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health

### 🆘 Решение проблем

**Если серверы не запускаются:**
1. Проверьте, что Node.js установлен: `node --version`
2. Проверьте, что зависимости установлены: `npm list`
3. Проверьте настройки в `api\.env`
4. Проверьте логи в окнах серверов

**Если база данных не подключается:**
1. Проверьте connection string в `api\.env`
2. Убедитесь, что Neon.tech проект активен
3. Проверьте настройки SSL в connection string

### 📞 Поддержка

При возникновении проблем:
1. Проверьте логи серверов
2. Убедитесь, что все зависимости установлены
3. Проверьте настройки `.env` файла
4. Обратитесь к документации проекта
