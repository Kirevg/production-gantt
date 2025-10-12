# Production Gantt System

Система управления проектами с графиком Ганта, построенная на современном стеке технологий.

## 🚀 Технологии

### Backend
- **Node.js** + **TypeScript**
- **Express.js** - веб-фреймворк
- **Prisma** - ORM для работы с базой данных
- **PostgreSQL** - основная база данных
- **JWT** - аутентификация
- **Zod** - валидация данных

### Frontend
- **React** + **TypeScript**
- **Vite** - сборщик
- **Material-UI (MUI)** - компоненты интерфейса
- **React Router** - маршрутизация
- **TanStack Query** - управление состоянием

### DevOps
- **Docker** + **Docker Compose** - контейнеризация
- **Nginx** - веб-сервер для фронтенда
- **Автозапуск** - система запускается при включении Windows

## 📋 Функциональность

✅ **Аутентификация и авторизация**
- Вход в систему с JWT токенами
- Роли пользователей (admin, manager, user)
- Защищенные маршруты

✅ **Управление проектами**
- CRUD операции для проектов
- Статусы проектов (Запланирован, В работе, Завершен)
- Фильтрация и поиск

✅ **Управление задачами**
- Иерархические задачи (подзадачи)
- Назначение исполнителей
- Отслеживание прогресса
- Связи между задачами

✅ **Интерфейс**
- Современный Material Design
- Адаптивная верстка
- Интуитивная навигация

## 🛠 Установка и запуск

### Автоматический запуск

1. **Запуск системы:**
   ```bash
   start-system.bat
   ```

2. **Остановка системы:**
   ```bash
   stop-system.bat
   ```

3. **Настройка автозапуска:**
   ```bash
   setup-autostart.bat
   ```

### Ручной запуск

1. **Запуск через Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **Остановка:**
   ```bash
   docker-compose down
   ```

## 🌐 Доступ к системе

- **Веб-интерфейс:** http://localhost
- **API Backend:** http://localhost:4001
- **База данных:** localhost:5432

## 👤 Учетные данные

**Администратор:**
- Email: `admin@test.com`
- Пароль: `password`
- Роль: `admin`

## 📁 Структура проекта

```
production-gantt/
├── api/                    # Backend API
│   ├── src/
│   │   ├── routes/        # API маршруты
│   │   └── lib/           # Утилиты
│   ├── prisma/            # Схема базы данных
│   └── Dockerfile
├── web/                   # Frontend
│   ├── src/
│   ├── nginx.conf         # Конфигурация Nginx
│   └── Dockerfile
├── docker-compose.yml     # Оркестрация сервисов
├── start-system.bat       # Запуск системы
├── stop-system.bat        # Остановка системы
└── setup-autostart.bat    # Настройка автозапуска
```

## 🔧 API Endpoints

### Аутентификация
- `POST /auth/login` - вход в систему

### Проекты
- `GET /projects` - список проектов
- `GET /projects/:id` - проект по ID
- `POST /projects` - создать проект
- `PUT /projects/:id` - обновить проект
- `DELETE /projects/:id` - удалить проект

### Задачи
- `GET /projects/:projectId/tasks` - задачи проекта
- `POST /projects/:projectId/tasks` - создать задачу
- `PUT /projects/:projectId/tasks/:taskId` - обновить задачу
- `DELETE /projects/:projectId/tasks/:taskId` - удалить задачу

## 🗄 База данных

Система использует PostgreSQL с Prisma ORM. Основные сущности:

- **User** - пользователи системы
- **Project** - проекты
- **Task** - задачи
- **TaskLink** - связи между задачами
- **AuditLog** - журнал изменений
- **RefreshToken** - токены обновления

## 🚀 Развертывание

Система готова к развертыванию в production среде:

1. **Локальная разработка** - Docker Compose
2. **Production** - Docker Swarm или Kubernetes
3. **Облако** - AWS, Azure, Google Cloud

## 📝 Лицензия

MIT License

## 🤝 Поддержка

Для вопросов и поддержки обращайтесь к разработчику системы.

---

**Система готова к использованию!** 🎉
