FROM node:20-alpine

# Устанавливаем переменные окружения
ENV NODE_ENV=production
ENV PORT=8080

# Устанавливаем системные зависимости
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && ln -sf python3 /usr/bin/python

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install --legacy-peer-deps

# Копируем исходный код
COPY . .

# Собираем проект
RUN npm run build || echo "Build failed, continuing..."

# Открываем порт
EXPOSE 8080

# Запускаем приложение
CMD ["npm", "start"]