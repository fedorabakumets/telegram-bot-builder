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

### 1. psql не найден в PATH (Windows)

**Симптомы:**
```
psql : Имя "psql" не распознано как имя командлета
```

**Решение:**
Добавьте путь к PostgreSQL в PATH:
```powershell
# Проверьте где установлен PostgreSQL
Get-ChildItem "C:\Program Files\PostgreSQL" | Select-Object Name

# Добавьте в PATH (замените 17 на вашу версию)
$env:PATH += ";C:\Program Files\PostgreSQL\17\bin"
```

Для постоянного добавления: Система → Переменные среды → Path → Добавить `C:\Program Files\PostgreSQL\17\bin`

---

### 2. Redis/Memurai не запускается (Windows)

**Симптомы:**
```
Could not connect to Redis at 127.0.0.1:6379: Connection refused
```

**Решение:**
```powershell
# Если используете Memurai (рекомендуется для Windows)
net start Memurai

# Если используете старый Redis
net start Redis

# Проверка
redis-cli ping
# Должен ответить: PONG
```

---

### 3. Порт 5432 занят (PostgreSQL)

**Симптомы:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Решение:**
```powershell
# Проверьте запущен ли PostgreSQL
Get-Service postgresql*

# Запустите если остановлен
net start postgresql-x64-17
```

---

### 4. Порт 5000 занят

**Симптомы:**
```
Error: listen EADDRINUSE :::5000
```

**Решение:**
```powershell
# Найти процесс на порту 5000
netstat -ano | findstr :5000

# Завершить процесс (замените PID)
taskkill /PID <PID> /F
```

Или измените порт в `.env`: `PORT=3000`

---

### 5. Ошибка подключения к PostgreSQL
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
```

---

## 6. Python не найден при запуске бота

**Симптомы:**
```
Error: spawn python ENOENT
```

**Решение:**
```powershell
# Проверьте что Python в PATH
python --version

# Если не найден — укажите путь в .env
PYTHON_PATH=C:\Users\1\AppData\Local\Programs\Python\Python313\python.exe
```

---

## 7. Ошибка "MODULE_NOT_FOUND" при запуске бота

**Симптомы:**
```
ModuleNotFoundError: No module named 'aiogram'
```

**Решение:**
```bash
pip install -r requirements.txt
```

Зависимости устанавливаются один раз на сервере — все боты используют общее окружение.

---

## 8. npm install завершается с ошибкой

**Решение:**
```bash
# Очистить кэш npm
npm cache clean --force

# Удалить node_modules и переустановить
rm -rf node_modules package-lock.json
npm install
```