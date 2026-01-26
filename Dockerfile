FROM node:20-alpine

# Добавляем информацию о времени сборки
RUN echo "Build timestamp: $(date)" > /tmp/build_info

# Устанавливаем системные зависимости для сборки
RUN apk update && apk add --no-cache \
    python3 \
    py3-pip \
    python3-dev \
    build-base \
    gcc \
    musl-dev

# Создаем символические ссылки для python и pip
RUN ln -sf python3 /usr/bin/python && \
    ln -sf pip3 /usr/bin/pip

# Проверяем установку Python
RUN python --version && pip --version && \
    echo "Python installation verified successfully"

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package files и .npmrc
COPY package*.json .npmrc ./

# Устанавливаем зависимости (включая dev для сборки)
RUN npm ci --legacy-peer-deps

# Копируем исходный код
COPY . .

# Собираем проект
RUN npm run build || echo "No build script found, skipping..."

# Удаляем dev зависимости после сборки
RUN npm prune --omit=dev

# Открываем порт
EXPOSE 8080

# Запускаем приложение
CMD ["npm", "start"]