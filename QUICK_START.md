# 🚀 Быстрый старт Production Gantt

## 📋 Минимальная настройка (5 минут)

### 1. Скачать проект
```bash
git clone https://github.com/your-username/production-gantt.git
cd production-gantt
```

### 2. Автоматическая настройка
```bash
# Windows
quick-setup.bat

# Или вручную:
cd api && npm install && cd ..
cd web && npm install && cd ..
```

### 3. Настроить базу данных
1. Зайти на [neon.tech](https://neon.tech)
2. Создать проект
3. Скопировать connection string
4. Создать `api\.env`:
```env
DATABASE_URL="ваш_connection_string_от_neon"
JWT_SECRET="ваш-секретный-ключ"
PORT=4000
CORS_ORIGINS="http://localhost,http://localhost:5173"
```

### 4. Запустить
```bash
start-backend-frontend.bat
```

### 5. Открыть приложение
- **Frontend**: http://localhost:5173
- **API**: http://localhost:4000

## ✅ Готово!

🎯 **Результат**: Полнофункциональная система управления проектами с Gantt-диаграммами!

## 🆘 Если что-то не работает

1. **Node.js не найден** → Скачать с [nodejs.org](https://nodejs.org/)
2. **Ошибки npm** → Удалить `node_modules` и запустить `npm install` заново
3. **База не подключается** → Проверить connection string в `.env`
4. **Порты заняты** → Закрыть другие приложения или изменить порты

## 📚 Подробная инструкция

См. `SETUP_INSTRUCTIONS.md` для детального руководства.
