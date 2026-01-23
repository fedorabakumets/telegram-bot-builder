# FORCE REBUILD v3.0 - Используем Node.js 20 с Python
FROM node:20-alpine

# Принудительная очистка кэша - добавляем уникальный слой
RUN echo "Build timestamp: $(date)" > /tmp/build_info

# Обновляем пакеты и устанавливаем Python + дополнительные инструменты
RUN apk update && apk add --no-cache \
    python3 \
    py3-pip \
    python3-dev \
    build-base \
    gcc \
    musl-dev

# Создаем символические ссылки
RUN ln -sf python3 /usr/bin/python && \
    ln -sf pip3 /usr/bin/pip

# Проверяем установку Python (v3.0) с детальной диагностикой
RUN python --version && pip --version && \
    echo "Python installation verified successfully" && \
    which python && which pip && \
    ls -la /usr/bin/python* && \
    python -c "print('Python is working!')"

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем Python библиотеки для ботов через системные пакеты
RUN apk add --no-cache py3-requests && \
    pip install --break-system-packages --no-cache-dir pytelegrambotapi python-dotenv

# Проверяем установку библиотек
RUN python -c "import telebot; print('pytelegrambotapi OK')" && \
    python -c "import requests; print('requests OK')" && \
    python -c "import dotenv; print('python-dotenv OK')"

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем ВСЕ зависимости (включая dev для сборки)
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Копируем собранные файлы в правильное место
RUN mkdir -p server/public && cp -r dist/* server/public/

# Создаем директорию для Python ботов
RUN mkdir -p /app/bots

# Удаляем dev зависимости после сборки
RUN npm prune --omit=dev

# Открываем порт
EXPOSE 5000

# Запускаем приложение
CMD ["npm", "run", "start"]