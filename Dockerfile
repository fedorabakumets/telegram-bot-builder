FROM node:20-alpine

# Устанавливаем системные зависимости для сборки (кэшируем слой)
RUN apk update && apk add --no-cache \
    python3 \
    py3-pip \
    python3-dev \
    build-base \
    gcc \
    musl-dev && \
    ln -sf python3 /usr/bin/python && \
    ln -sf pip3 /usr/bin/pip

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем только package files для кэширования зависимостей
COPY package*.json ./

# Устанавливаем зависимости с кэшированием
RUN npm ci --only=production --silent

# Копируем исходный код
COPY . .

# Собираем проект быстро
RUN npm run build:fast || npm run build || echo "No build script found"

# Открываем порт
EXPOSE 8080

# Запускаем приложение
CMD ["npm", "start"]