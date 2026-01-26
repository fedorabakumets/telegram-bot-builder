FROM node:20-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install --production

# Копируем исходный код
COPY . .

# Собираем проект (если есть build скрипт)
RUN npm run build || echo "No build script found"

# Открываем порт
EXPOSE 8080

# Запускаем приложение
CMD ["npm", "start"]