# 🚀 Production Gantt - Система управления проектами

Система управления проектами с Gantt-диаграммами, построенная на современном стеке технологий.

## 🛠️ Технологии

- **Frontend**: React + TypeScript + Material-UI + Vite
- **Backend**: Node.js + TypeScript + Express + Prisma
- **База данных**: PostgreSQL
- **Контейнеризация**: Docker + Docker Compose

## 🚀 Быстрый старт

### 📋 Варианты запуска

**🚀 Локальная разработка (рекомендуется):**
- См. [QUICK_START.md](QUICK_START.md) - быстрая настройка за 5 минут
- См. [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md) - подробная инструкция

**🐳 Docker (альтернатива):**
- Требования: Docker Desktop, Git
- Подходит для продакшена или если не хотите устанавливать Node.js

### Требования для локальной разработки
- Git
- Node.js 18+ (скачать с [nodejs.org](https://nodejs.org/))
- Аккаунт на [neon.tech](https://neon.tech) для базы данных

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

### Локальная разработка
1. Следуйте инструкции [QUICK_START.md](QUICK_START.md)
2. Настройте Neon.tech базу данных
3. Запустите `quick-setup.bat` или `start-backend-frontend.bat`
4. Откройте http://localhost:5173

### Docker
1. Запустите `docker-compose up --build`
2. Создайте администратора: `node api/create-admin.js`
3. Откройте http://localhost

## 📚 Документация

- **[QUICK_START.md](QUICK_START.md)** - Быстрая настройка за 5 минут
- **[SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)** - Подробная инструкция для синхронизации
- **[PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)** - Контекст и архитектура проекта

## 📞 Поддержка

При возникновении проблем:
1. **Локальная разработка**: Проверьте логи в окнах серверов
2. **Docker**: Проверьте логи: `docker-compose logs`
3. **База данных**: Убедитесь, что Neon.tech проект активен
4. **Порты**: Убедитесь, что порты 4000 и 5173 свободны

## 📝 Лицензия

MIT License
