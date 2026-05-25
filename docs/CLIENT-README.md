# 🚀 Конструктор Telegram-ботов — Быстрый старт

## 📋 Требования

- **Docker Desktop** (скачать: https://www.docker.com/products/docker-desktop/)
- **Браузер** (Chrome, Firefox, Edge и т.д.)

> ⚠️ **НЕ нужно устанавливать:** Node.js, Python, PostgreSQL, Git — всё уже внутри Docker-образа!

---

## 🔧 Установка (5 минут)

### Шаг 1: Установите Docker Desktop

1. Перейдите на https://www.docker.com/products/docker-desktop/
2. Скачайте версию для вашей ОС (Windows/Mac/Linux)
3. Установите как обычную программу
4. Перезагрузите компьютер (если потребуется)

### Шаг 2: Запустите конструктор

**Для Windows (PowerShell или Command Prompt):**
```bash
# Создайте папку для проекта
mkdir bot-builder && cd bot-builder

# Скопируйте файлы проекта в эту папку
# (docker-compose.yml и .env.example из архива)

# Переименуйте .env.example в .env
copy .env.example .env

# Запустите одной командой
docker compose up -d
```

**Для Mac/Linux (Terminal):**
```bash
mkdir bot-builder && cd bot-builder
# Скопируйте файлы проекта
cp .env.example .env
docker compose up -d
```

### Шаг 3: Откройте конструктор

Через 1-2 минуты (пока контейнеры запускаются) откройте в браузере:

**👉 http://localhost:5000**

---

## 🎯 Первый запуск

1. Откройте http://localhost:5000
2. Зарегистрируйтесь или войдите
3. Создайте первый проект бота
4. Настройте токен от @BotFather
5. Запустите бота!

---

## 🔐 Настройка переменных окружения

Откройте файл `.env` и настройте:

```bash
# Секретный ключ для сессий (обязательно измените!)
SESSION_SECRET=ваш-уникальный-секрет-здесь

# Telegram API (получить на https://my.telegram.org)
TELEGRAM_API_ID=ваш_api_id
TELEGRAM_API_HASH=ваш_api_hash

# Порт (по умолчанию 5000)
PORT=5000
```

---

## 🛠️ Управление

### Просмотр логов
```bash
docker compose logs -f
```

### Остановка
```bash
docker compose down
```

### Перезапуск
```bash
docker compose restart
```

### Обновление (если вышла новая версия)
```bash
docker compose pull
docker compose up -d
```

---

## 📁 Где хранятся данные

| Данные | Расположение |
|--------|--------------|
| **База данных** | Docker volume `bot-builder-postgres-data` |
| **Загруженные файлы** | Папка `./uploads` |
| **Сгенерированные боты** | Папка `./bots` |

> 💡 **Важно:** При удалении контейнера (`docker compose down`) база данных **сохраняется**.  
> Для полного удаления используйте: `docker compose down -v`

---

## ❓ Решение проблем

### Ошибка: "Cannot connect to the Docker daemon"
- Убедитесь, что Docker Desktop запущен
- Попробуйте перезапустить Docker Desktop

### Ошибка: "Port 5000 is already in use"
- Измените порт в `.env`: `PORT=5001`
- Перезапустите: `docker compose restart`

### Ошибка: "Database connection failed"
- Дождитесь полной загрузки БД (30-60 секунд)
- Проверьте логи: `docker compose logs db`

### Контейнер постоянно перезапускается
- Проверьте логи: `docker compose logs app`
- Убедитесь, что все переменные в `.env` заполнены

---

## 📞 Поддержка

Возникли проблемы? Создайте issue на GitHub или напишите в Telegram-чат.

---

## 🎉 Готово!

Теперь у вас есть собственный конструктор Telegram-ботов! 🤖
