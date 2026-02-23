# Dockerfile для конструктора Telegram-ботов
# Собирает образ с Node.js приложением и всеми зависимостями

FROM node:20-alpine

# Устанавливаем Python для некоторых npm-пакетов
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

# Копируем зависимости и устанавливаем их
COPY package*.json ./
RUN npm ci --only=production

# Устанавливаем Python-зависимости если есть
COPY requirements.txt* ./
RUN if [ -f requirements.txt ]; then pip3 install --break-system-packages -r requirements.txt; fi

# Копируем исходный код и собираем проект
COPY . .
RUN npm run build

EXPOSE 5000

# Запускаем миграции и стартуем приложение
CMD ["sh", "-c", "npm run migrate && npm start"]