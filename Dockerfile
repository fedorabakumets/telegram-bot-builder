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

# Устанавливаем зависимости с оптимизацией
RUN npm ci --only=production --no-audit --no-fund --silent \
    && npm cache clean --force

# Копируем исходный код
COPY . .

# Собираем проект если нужно
RUN npm run build 2>/dev/null || echo "No build script, skipping..."

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