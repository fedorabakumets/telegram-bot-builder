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
    echo "Python installation verified successfully" && \
    which python && which pip && \
    ls -la /usr/bin/python* && \
    python -c "print('Python is working!')"

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем Python библиотеки для генерируемых ботов
RUN apk add --no-cache py3-requests && \
    pip install --break-system-packages --no-cache-dir pytelegrambotapi python-dotenv

# Проверяем Python библиотеки
RUN python -c "import telebot; print('pytelegrambotapi OK')" && \
    python -c "import requests; print('requests OK')" && \
    python -c "import dotenv; print('python-dotenv OK')"

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем Node.js зависимости с разрешением конфликтов
RUN npm ci --legacy-peer-deps

# Копируем весь код проекта
COPY . .

# Собираем фронтенд
RUN npm run build

# Копируем собранный фронтенд в server/public
RUN mkdir -p server/public && cp -r dist/* server/public/

# Создаем необходимые директории
RUN mkdir -p /app/bots

# Удаляем dev зависимости для уменьшения размера образа
RUN npm prune --omit=dev

# Устанавливаем переменные окружения
ENV NODE_ENV=production
ENV PORT=8080

# Открываем порт
EXPOSE 8080

# Запускаем приложение
CMD ["npm", "start"]