# 🚀 Production Gantt - Система управления проектами

Система управления проектами с Gantt-диаграммами, построенная на современном стеке технологий.

## 🛠️ Технологии

- **Frontend**: React + TypeScript + Material-UI + Vite
- **Backend**: Node.js + TypeScript + Express + Prisma
- **База данных**: PostgreSQL
- **Контейнеризация**: Docker + Docker Compose

## 🚀 Быстрый старт

### Требования
- Docker Desktop
- Git
- Node.js 18+ (для локальной разработки)

### Запуск через Docker (рекомендуется)
```bash
# Клонирование репозитория
git clone <URL_РЕПОЗИТОРИЯ>
cd production-gantt

# Запуск всех сервисов
docker-compose up --build

# Или в фоновом режиме
docker-compose up -d --build
```

### Доступ к приложению
- **Frontend**: http://localhost
- **API**: http://localhost:4001
- **База данных**: localhost:5432

## 🔧 Локальная разработка

### Запуск базы данных
```bash
docker-compose up -d postgres
```

### Запуск API
```bash
cd api
npm install
npx prisma db push
npm run dev
```

### Запуск Frontend
```bash
cd web
npm install
npm run dev
```

## 📁 Структура проекта

```
production-gantt/
├── api/                 # Backend (Node.js + Express + Prisma)
│   ├── src/
│   │   ├── routes/      # API маршруты
│   │   ├── middleware/  # Аутентификация
│   │   └── lib/        # Prisma клиент
│   └── prisma/         # Схема БД и миграции
├── web/                 # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── App.tsx     # Основной компонент
│   │   ├── main.tsx    # Точка входа
│   │   └── components/ # Компоненты
├── docker-compose.yml   # Конфигурация Docker
└── README.md           # Документация
```

## 🎯 Основные функции

- ✅ Управление проектами
- ✅ Управление пользователями
- ✅ Управление руководителями проектов
- ✅ Управление исполнителями
- ✅ Карточка проекта с задачами
- ✅ Аутентификация и авторизация
- 🚧 Gantt-диаграммы (в разработке)

## 🔑 Первые шаги

1. Запустите приложение
2. Создайте администратора: `node api/create-admin.js`
3. Войдите в систему
4. Начните работу с проектами

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `docker-compose logs`
2. Убедитесь, что все порты свободны
3. Проверьте настройки Docker Desktop

## 📝 Лицензия

MIT License
