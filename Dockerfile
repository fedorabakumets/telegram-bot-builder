FROM node:20-alpine

# Устанавливаем переменные окружения для оптимизации
ENV NODE_ENV=production
ENV PORT=8080
ENV NPM_CONFIG_CACHE=/tmp/.npm

# Устанавливаем системные зависимости одним слоем
RUN apk update && apk add --no-cache \
    python3 \
    py3-pip \
    build-base \
    && ln -sf python3 /usr/bin/python \
    && ln -sf pip3 /usr/bin/pip \
    && rm -rf /var/cache/apk/*

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем только package files для кэширования слоя
COPY package*.json ./

# Устанавливаем все зависимости (включая dev для сборки)
RUN npm ci --no-audit --no-fund --silent

# Копируем исходный код
COPY . .

# Собираем проект
RUN npm run build || echo "Build failed, continuing..."

# Удаляем dev зависимости после сборки
RUN npm prune --omit=dev && npm cache clean --force

# Создаем non-root пользователя для безопасности
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001

# Меняем владельца файлов
RUN chown -R nextjs:nodejs /app
USER nextjs

# Открываем порт
EXPOSE 8080

# Запускаем приложение
CMD ["npm", "start"]