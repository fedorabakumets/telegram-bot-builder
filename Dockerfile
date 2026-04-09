# Dockerfile для конструктора Telegram-ботов
# Многоэтапная сборка: build-stage собирает клиент, runtime-stage содержит только необходимое

# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Устанавливаем все зависимости (включая dev) для сборки клиента
COPY package*.json ./
RUN npm install --ignore-scripts

# Копируем исходный код и собираем клиент
COPY . .
RUN npm run build:client

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine

# Python3 нужен для запуска пользовательских ботов (server/bots/startBot.ts)
# procps нужен для команды ps (поиск Python процессов при остановке)
RUN apk add --no-cache python3 py3-pip procps

WORKDIR /app

# Устанавливаем только production-зависимости
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts

# Копируем предсобранный клиент из build-stage
COPY --from=builder /app/dist ./dist

# Копируем серверный код и конфигурацию
COPY server ./server
COPY lib ./lib
COPY shared ./shared
COPY client/utils ./client/utils
COPY scripts ./scripts
COPY tsconfig*.json ./
COPY drizzle.config.ts* ./
COPY migrations ./migrations

# Устанавливаем Python-зависимости для пользовательских ботов
COPY requirements.txt* ./
RUN if [ -f requirements.txt ]; then pip3 install --break-system-packages -r requirements.txt; fi

EXPOSE 5000

# Запускаем миграции и стартуем приложение
CMD ["npm", "start"]
