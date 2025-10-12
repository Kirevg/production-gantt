FROM node:18-alpine

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем ВСЕ зависимости (включая dev) для сборки
RUN npm ci

# Копируем исходный код
COPY . .

# Генерируем Prisma клиент
RUN npx prisma generate

# Собираем приложение
RUN npm run build

# Удаляем dev-зависимости после сборки
RUN npm prune --production

# Открываем порт
EXPOSE 4000

# Команда запуска
CMD ["npm", "start"]
