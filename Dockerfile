FROM node:20-alpine

# Устанавливаем Python и pip
RUN apk add --no-cache python3 py3-pip python3-dev

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем Python requirements если есть
COPY requirements.txt* ./
COPY pyproject.toml* ./

# Устанавливаем Python зависимости с флагом --break-system-packages
RUN if [ -f requirements.txt ]; then pip3 install --break-system-packages --no-cache-dir -r requirements.txt; fi
RUN if [ -f pyproject.toml ]; then pip3 install --break-system-packages --no-cache-dir .; fi

# Копируем исходный код
COPY . .

# Собираем проект (если есть build скрипт)
RUN npm run build || echo "No build script found"

# Открываем порт
EXPOSE 8080

# Запускаем приложение
CMD ["npm", "start"]