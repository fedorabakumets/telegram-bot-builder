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

# Копируем конфиги и исходный код
COPY vite.config.ts tsconfig.json ./
COPY client/ ./client/
COPY server/ ./server/
COPY shared/ ./shared/
COPY attached_assets/ ./attached_assets/
COPY drizzle.config.ts ./
COPY drizzle/ ./drizzle/
COPY package.json ./

RUN npm run build

# Удаляем dev-зависимости после сборки для уменьшения размера образа
RUN npm install --omit=dev --ignore-scripts

EXPOSE 5000

# Запускаем миграции и стартуем приложение
CMD ["sh", "-c", "npm run migrate && npm start"]