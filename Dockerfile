FROM node:20-alpine

# Добавляем информацию о сборке
RUN echo "Build timestamp: $(date)" > /tmp/build_info

# Устанавливаем системные зависимости
RUN apk update && apk add --no-cache \
    python3 \
    py3-pip \
    python3-dev \
    build-base \
    gcc \
    musl-dev

# Создаем символические ссылки для Python
RUN ln -sf python3 /usr/bin/python && \
    ln -sf pip3 /usr/bin/pip

# Проверяем установку Python
RUN python --version && pip --version && \
    echo "Python installation verified successfully"

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем Node.js зависимости
RUN npm ci --legacy-peer-deps

# Копируем весь код проекта
COPY . .

# Собираем проект (если есть build скрипт)
RUN npm run build || echo "No build script found, skipping..."

# Удаляем dev зависимости для уменьшения размера образа
RUN npm prune --omit=dev

# Устанавливаем переменные окружения
ENV NODE_ENV=production
ENV PORT=8080

# Открываем порт
EXPOSE 8080

# Запускаем приложение
CMD ["npm", "start"]