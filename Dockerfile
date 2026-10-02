# syntax=docker/dockerfile:1
# Dockerfile для конструктора Telegram-ботов
# Многоэтапная сборка: build-stage собирает клиент, runtime-stage содержит только необходимое
# Кэш npm/pip хранится в BuildKit cache mounts. Railway требует id с префиксом
# s/<ID сервиса>-, обычный buildx (GitHub Actions) принимает такой id как есть.

# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Устанавливаем все зависимости (включая dev) для сборки клиента строго по lock-файлу.
# .npmrc обязателен: lock собран с legacy-peer-deps=true, без него npm ci падает
COPY package*.json .npmrc ./
RUN --mount=type=cache,id=s/a8481b49-5ca6-45bc-a1a5-3e1e8b80a79b-/root/.npm,target=/root/.npm \
    npm ci --ignore-scripts --prefer-offline --no-audit --no-fund

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
# postgresql18-client — pg_dump/pg_restore/psql для бэкапов базы (снимают и старые серверы)
RUN apk add --no-cache python3 py3-pip procps postgresql18-client

WORKDIR /app

# Python-зависимости пользовательских ботов ставим до копирования кода,
# чтобы слой не пересобирался при каждом изменении исходников
COPY requirements.txt ./
RUN --mount=type=cache,id=s/a8481b49-5ca6-45bc-a1a5-3e1e8b80a79b-/root/.cache/pip,target=/root/.cache/pip \
    pip3 install --break-system-packages -r requirements.txt

# Устанавливаем только production-зависимости строго по lock-файлу
COPY package*.json .npmrc ./
RUN --mount=type=cache,id=s/a8481b49-5ca6-45bc-a1a5-3e1e8b80a79b-/root/.npm,target=/root/.npm \
    npm ci --omit=dev --ignore-scripts --prefer-offline --no-audit --no-fund

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
COPY version.json ./version.json

# Документация для /admin/schema и /admin/api-docs (генерируется на build-stage)
COPY --from=builder /app/docs/database ./docs/database
COPY --from=builder /app/docs/api ./docs/api

EXPOSE 5000

# Запускаем миграции и стартуем приложение
CMD ["npm", "start"]
