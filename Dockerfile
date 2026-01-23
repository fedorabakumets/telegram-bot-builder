# Используем Node.js 20
FROM node:20-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем ВСЕ зависимости (включая dev для сборки)
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Копируем собранные файлы в правильное место
RUN mkdir -p server/public && cp -r dist/* server/public/

# Удаляем dev зависимости после сборки
RUN npm prune --omit=dev

# Открываем порт
EXPOSE 5000

# Запускаем приложение
CMD ["npm", "run", "start"]