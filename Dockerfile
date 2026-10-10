# syntax=docker/dockerfile:1
# @fileoverview Сборка конструктора; документация открывается с внешнего сайта.
# Dockerfile для конструктора Telegram-ботов
# Многоэтапная сборка: build-stage собирает клиент, runtime-stage содержит только необходимое
# Кэш npm/pip хранится в BuildKit cache mounts. Railway требует id с префиксом
# s/<ID сервиса>-, обычный buildx (GitHub Actions) принимает такой id как есть.

# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Устанавливаем все зависимости (включая dev) для сборки клиента строго по lock-файлу.
# .npmrc обязателен: lock собран с legacy-peer-deps=true, без него npm ci падает
COPY package*.json .npmrc ./
RUN --mount=type=cache,id=s/a8481b49-5ca6-45bc-a1a5-3e1e8b80a79b-/root/.npm,target=/root/.npm \
    npm ci --ignore-scripts --prefer-offline --no-audit --no-fund

# Копируем исходный код и собираем клиент без генерации сайта документации
COPY . .
RUN npm run build:client

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:22-alpine

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

# Снимки BotFather и прочие картинки UI: сервер отдаёт каталог как /assets
COPY assets ./assets

EXPOSE 5000

# Стартуем приложение: SQL- и служебные миграции сервер применяет сам при старте
CMD ["npm", "start"]
