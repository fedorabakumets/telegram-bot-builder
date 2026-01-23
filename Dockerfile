# Используем Node.js 20
FROM node:20-alpine

# Устанавливаем Python и pip для запуска ботов
RUN apk add --no-cache python3 py3-pip

# Создаем символическую ссылку для python (если нужно)
RUN ln -sf python3 /usr/bin/python

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем Python библиотеки для ботов
RUN pip3 install --no-cache-dir pytelegrambotapi requests python-dotenv

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

# Создаем директорию для Python ботов
RUN mkdir -p /app/bots

# Удаляем dev зависимости после сборки
RUN npm prune --omit=dev

# Открываем порт
EXPOSE 5000

# Запускаем приложение
CMD ["npm", "run", "start"]