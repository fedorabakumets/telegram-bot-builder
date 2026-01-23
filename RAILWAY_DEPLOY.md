# Деплой Telegram Bot Builder на Railway

## Подготовка к деплою

1. Зарегистрируйтесь на [railway.app](https://railway.app)
2. Подключите GitHub аккаунт к Railway
3. Создайте новый проект в Railway

## Шаги для деплоя

1. Создайте новый проект в Railway
2. Выберите "Deploy from GitHub repo"
3. Выберите репозиторий с Telegram Bot Builder
4. Railway автоматически определит Node.js приложение и использует файлы конфигурации:
   - `railway.json` - основная конфигурация
   - `Procfile` - команда запуска
   - `runtime.txt` - версия Node.js
   - `.railway/config.json` - дополнительная конфигурация Railway

## Настройка базы данных

1. В Railway добавьте PostgreSQL базу данных:
   - Перейдите в "New Service" → "Database" → "Add PostgreSQL"
   - Railway автоматически создаст базу данных и добавит переменные окружения

2. Настройте переменные окружения для приложения:
   - `DATABASE_URL` - будет автоматически установлен Railway при добавлении PostgreSQL
   - `SESSION_SECRET` - установите случайную строку для безопасности сессий
   - `NODE_ENV` - установите в "production"

## Запуск миграций базы данных

После первого деплоя необходимо запустить миграции базы данных:

1. Перейдите в "Deployments" → выберите последний деплой
2. Нажмите "Deploy" → "Deploy from Source" → "Deploy"
3. После успешного деплоя перейдите в "Deployments" → "Deploy" → "Deploy from Source" → "Deploy"
4. Запустите миграции через "Deployments" → "Deploy" → "Deploy from Source" → "Deploy"

Или используйте Railway CLI:

```bash
# Установите Railway CLI
npm install -g @railway/cli

# Авторизуйтесь
railway login

# Перейдите в директорию проекта
cd telegram-bot-builder

# Запустите миграции
railway run npm run db:push
```

## Мониторинг и логи

- Логи приложения доступны в интерфейсе Railway в разделе "Deployments"
- Метрики производительности доступны в разделе "Metrics"
- Ошибки и статус приложения отображаются в разделе "Health"

## Масштабирование

- Railway автоматически масштабирует приложение при увеличении нагрузки
- Для ручного масштабирования перейдите в "Settings" → "Performance"
- Можно настроить автоскейлинг в "Settings" → "Autoscaling"

## Дополнительные настройки

### SSL-сертификат
Railway автоматически предоставляет SSL-сертификат для вашего приложения.

### Домен
- По умолчанию Railway предоставляет поддомен вида `your-project.up.railway.app`
- Можно подключить свой домен в разделе "Settings" → "Domains"

### Резервное копирование
- Railway автоматически создает резервные копии базы данных
- Настройки резервного копирования доступны в настройках PostgreSQL сервиса

## Устранение неполадок

### Ошибка "No start command was found"
Убедитесь, что в проекте есть файл `Procfile` с содержимым:
```
web: npm run start
```

### Ошибка подключения к базе данных
Проверьте, что переменная окружения `DATABASE_URL` установлена правильно и сервис PostgreSQL запущен.

### Ошибка сборки
Проверьте логи сборки в разделе "Deployments" и убедитесь, что все зависимости установлены корректно.

## Полезные команды Railway CLI

```bash
# Установка Railway CLI
npm install -g @railway/cli

# Авторизация
railway login

# Деплой приложения
railway up

# Запуск команды в окружении Railway
railway run npm run db:push

# Просмотр логов
railway logs

# Открытие приложения в браузере
railway open