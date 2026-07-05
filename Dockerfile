# Dockerfile для конструктора Telegram-ботов
# Многоэтапная сборка: build-stage собирает клиент, runtime-stage содержит только необходимое

# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Устанавливаем все зависимости (включая dev) для сборки клиента
COPY package*.json ./
RUN npm install --ignore-scripts

# Копируем исходный код, генерируем docs для /admin/schema и /admin/api-docs, собираем клиент
COPY . .
# DATABASE_URL нужен только для импорта registerRoutes при docs:api; к БД на build не подключаемся
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
RUN npm run docs
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

# Документация для /admin/schema и /admin/api-docs (генерируется на build-stage)
COPY --from=builder /app/docs/database ./docs/database
COPY --from=builder /app/docs/api ./docs/api

# Устанавливаем Python-зависимости для пользовательских ботов
COPY requirements.txt* ./
RUN if [ -f requirements.txt ]; then pip3 install --break-system-packages -r requirements.txt; fi

EXPOSE 5000

# Запускаем миграции и стартуем приложение
CMD ["npm", "start"]
