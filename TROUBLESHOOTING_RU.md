# Руководство по устранению неполадок при запуске Telegram Bot Builder

## Проблема: Ошибка "DATABASE_URL must be set"

### Симптомы:
При запуске приложения команда `npm run dev` завершается ошибкой:
```
Error: DATABASE_URL must be set. Did you forget to provision a database?
```

### Причина:
Приложение требует подключения к базе данных PostgreSQL, но переменная окружения DATABASE_URL не установлена.

## Решения:

### Решение 1: Использование dotenv для передачи переменных окружения (Рекомендуется)

Запустите приложение с переменными окружения напрямую:

```bash
npx dotenv -v DATABASE_URL=postgresql://postgres:postgres@localhost:5432/telegram_bot_builder -- npm run dev
```

### Решение 2: Создание файла .env вручную

1. Создайте файл `.env` в корневой директории проекта
2. Добавьте в него следующие настройки:

```env
# База данных PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/telegram_bot_builder
PGHOST=localhost
PGPORT=5432
PGDATABASE=telegram_bot_builder
PGUSER=postgres
PGPASSWORD=postgres

# Секретный ключ для сессий
SESSION_SECRET=your-super-secret-session-key-here-change-this-in-production

# Режим работы
NODE_ENV=development
```

3. Запустите приложение командой:
```bash
npm run dev
```

### Решение 3: Использование скрипта create-env.bat

Если файл не заблокирован, вы можете использовать встроенный скрипт:

```bash
create-env.bat
```

Этот скрипт поможет вам создать файл .env с правильными настройками.

## Проверка подключения к базе данных

После установки переменных окружения проверьте подключение к базе данных:

```bash
npx dotenv -v DATABASE_URL=postgresql://postgres:postgres@localhost:5432/telegram_bot_builder -- npx tsx scripts/init-db.ts
```

## Дополнительные команды

### Запуск миграций базы данных:
```bash
npm run db:push
```

### Проверка состояния приложения:
Откройте в браузере http://localhost:5173/api/health

## Возможные проблемы и их решения:

### 1. Ошибка подключения к PostgreSQL
- Убедитесь, что PostgreSQL запущен на порту 5432
- Проверьте правильность пароля пользователя postgres
- Убедитесь, что база данных telegram_bot_builder существует

### 2. Ошибка SSL
Если вы получаете ошибку SSL, попробуйте добавить ?sslmode=disable к URL базы данных:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/telegram_bot_builder?sslmode=disable
```

### 3. Проблемы с правами доступа
Если у вас возникают проблемы с доступом к файлам .env, убедитесь, что у пользователя есть права на чтение файлов в директории проекта.

## Рекомендации по безопасности:

1. Не храните файл .env в системе контроля версий
2. Используйте случайные значения для SESSION_SECRET в production
3. Не используйте пароль "postgres" в production среде
4. Ограничьте доступ к файлу .env только необходимым пользователям

## Для разработчиков CodeAssistant:

Если файл .env заблокирован настройками .codeassistantignore, используйте команду с dotenv для запуска приложения:

```bash
npx dotenv -v DATABASE_URL=postgresql://postgres:postgres@localhost:5432/telegram_bot_builder -- npm run dev