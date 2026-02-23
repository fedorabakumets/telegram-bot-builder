# Dockerfile для конструктора Telegram-ботов
# Собирает образ с Node.js приложением и всеми зависимостями

FROM node:20-alpine

# Устанавливаем Python для некоторых npm-пакетов
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

# Копируем зависимости и устанавливаем их
COPY package*.json ./
RUN npm install --ignore-scripts

# Устанавливаем Python-зависимости если есть
COPY requirements.txt* ./
RUN if [ -f requirements.txt ]; then pip3 install --break-system-packages -r requirements.txt; fi

# Копируем весь исходный код
COPY . .

RUN npm run build

# Удаляем dev-зависимости после сборки для уменьшения размера образа
RUN npm install --omit=dev --ignore-scripts

EXPOSE 5000

# Запускаем миграции и стартуем приложение
CMD ["sh", "-c", "npm run migrate && npm start"]