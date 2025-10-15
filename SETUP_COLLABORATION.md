# 🚀 Настройка совместной работы над проектом Production Gantt

## 📋 Требования для нового компьютера

### Обязательные программы:
1. **Git** - для клонирования репозитория
2. **Docker Desktop** - для запуска контейнеров
3. **Node.js 18+** - для локальной разработки (опционально)
4. **VS Code** - рекомендуемый редактор

## 🔧 Пошаговая настройка

### Шаг 1: Клонирование проекта
```bash
# Клонируем репозиторий
git clone <URL_РЕПОЗИТОРИЯ> production-gantt
cd production-gantt
```

### Шаг 2: Настройка переменных окружения
Создайте файл `.env` в корне проекта:
```bash
# Скопируйте содержимое из .env.example
cp .env.example .env
```

### Шаг 3: Запуск через Docker (РЕКОМЕНДУЕМЫЙ способ)
```bash
# Запуск всех сервисов
docker-compose up --build

# Или в фоновом режиме
docker-compose up -d --build
```

### Шаг 4: Проверка работы
- **Frontend**: http://localhost (порт 80)
- **API**: http://localhost:4001
- **База данных**: localhost:5432

## 🛠️ Альтернативный запуск (локальная разработка)

### Для разработки без Docker:
```bash
# 1. Запуск базы данных
docker-compose up -d postgres

# 2. Настройка API
cd api
npm install
npx prisma db push
npm run dev

# 3. Настройка Frontend (в новом терминале)
cd web
npm install
npm run dev
```

## 🔄 Синхронизация изменений

### Получение обновлений:
```bash
git pull origin main
docker-compose down
docker-compose up --build
```

### Отправка изменений:
```bash
git add .
git commit -m "Описание изменений"
git push origin main
```

## 🐛 Решение проблем

### Проблема: Порты заняты
```bash
# Остановка всех контейнеров
docker-compose down

# Очистка портов
docker system prune -f
```

### Проблема: База данных не запускается
```bash
# Удаление старых данных
docker-compose down -v
docker-compose up --build
```

### Проблема: Ошибки сборки
```bash
# Полная пересборка
docker-compose down
docker-compose build --no-cache
docker-compose up
```

## 📁 Структура проекта для разработчиков

```
production-gantt/
├── api/                 # Backend (Node.js + Express + Prisma)
├── web/                 # Frontend (React + TypeScript)
├── docker-compose.yml   # Конфигурация Docker
├── .env                 # Переменные окружения (создать из .env.example)
└── README.md           # Основная документация
```

## 🎯 Первые шаги после настройки

1. **Откройте проект**: http://localhost
2. **Создайте администратора**: Используйте скрипт `create-admin.js`
3. **Изучите интерфейс**: Проекты, пользователи, руководители
4. **Начните разработку**: Все готово для работы!

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `docker-compose logs`
2. Убедитесь, что все порты свободны
3. Проверьте настройки Docker Desktop
4. Обратитесь к команде разработки
