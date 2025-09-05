# 🛠 Установка и настройка

Подробное руководство по установке Telegram Bot Builder на различных платформах.

## 📋 Системные требования

- **Node.js** 18.0.0+ (LTS рекомендуется)
- **PostgreSQL** 13+ 
- **Python** 3.11+ (для генерируемых ботов)
- **Git** (для клонирования репозитория)

---

## 🖥 Установка на Windows

### 1️⃣ Установка зависимостей

**Node.js:**
1. Перейдите на https://nodejs.org/
2. Скачайте **LTS версию** (рекомендуется)
3. Установите с настройками по умолчанию
4. **Важно:** Перезапустите командную строку после установки

**PostgreSQL:**
1. Перейдите на https://www.postgresql.org/download/windows/
2. Скачайте PostgreSQL installer
3. При установке:
   - **Запомните пароль** для пользователя `postgres`
   - Оставьте порт **5432**
   - Установите pgAdmin 4 (рекомендуется)

**Python (опционально):**
1. Перейдите на https://python.org/downloads/
2. Скачайте Python 3.11+
3. При установке отметьте "Add Python to PATH"

### 2️⃣ Настройка базы данных

**Через pgAdmin 4:**
1. Откройте **pgAdmin 4**
2. Подключитесь к серверу (введите пароль postgres)
3. Создайте базу данных:
   - Правый клик на "Databases" → Create → Database
   - Имя: `telegram_bot_builder`
4. Создайте пользователя (опционально):
   - Правый клик на "Login/Group Roles" → Create → Login/Group Role
   - General: Имя `bot_user`
   - Definition: Пароль `your_secure_password`
   - Privileges: ✅ Can login?, ✅ Superuser?

**Через командную строку:**
```powershell
# В PowerShell (замените "ваш_пароль"):
$env:PGPASSWORD="ваш_пароль"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE telegram_bot_builder;"
```

### 3️⃣ Настройка проекта

```cmd
# 1. Клонируйте репозиторий
git clone https://github.com/yourusername/telegram-bot-builder.git
cd telegram-bot-builder

# 2. Скопируйте файл конфигурации
copy .env.example .env

# 3. Отредактируйте настройки
notepad .env
```

**Настройки в .env файле:**
```env
# Основные настройки
NODE_ENV=development
PORT=5000

# База данных (замените на свои данные)
DATABASE_URL=postgresql://postgres:ваш_пароль@localhost:5432/telegram_bot_builder

# Опционально
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=ваш_пароль
PGDATABASE=telegram_bot_builder
```

```cmd
# 4. Установите зависимости
npm install

# 5. Создайте таблицы в базе данных
npm run db:push
```

### 4️⃣ Запуск проекта

**Способ 1 - PowerShell (РЕКОМЕНДУЕТСЯ):**
```powershell
$env:NODE_ENV="development"; tsx server/index.ts
```

**Способ 2 - CMD:**
```cmd
npm run dev
```

**Способ 3 - Создайте bat файл:**
Создайте файл `start.bat`:
```batch
@echo off
set NODE_ENV=development
npx tsx server/index.ts
pause
```

### 5️⃣ Откройте браузер

Перейдите по адресу: **http://localhost:5000**

---

## 🐧 Установка на Linux/macOS

### Ubuntu/Debian

```bash
# Обновите систему
sudo apt update && sudo apt upgrade -y

# Установите Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установите PostgreSQL
sudo apt install postgresql postgresql-contrib

# Настройте PostgreSQL
sudo -u postgres createdb telegram_bot_builder
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'your_password';"

# Клонируйте и настройте проект
git clone https://github.com/yourusername/telegram-bot-builder.git
cd telegram-bot-builder
cp .env.example .env
# Отредактируйте .env файл
nano .env

# Установите зависимости и запустите
npm install
npm run db:push
npm run dev
```

### macOS

```bash
# Установите Homebrew (если еще не установлен)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Установите зависимости
brew install node postgresql

# Запустите PostgreSQL
brew services start postgresql

# Создайте базу данных
createdb telegram_bot_builder

# Клонируйте и настройте проект
git clone https://github.com/yourusername/telegram-bot-builder.git
cd telegram-bot-builder
cp .env.example .env
# Отредактируйте .env файл

# Установите зависимости и запустите
npm install
npm run db:push
npm run dev
```

---

## 🐳 Docker установка

```bash
# Клонируйте репозиторий
git clone https://github.com/yourusername/telegram-bot-builder.git
cd telegram-bot-builder

# Запустите с Docker Compose
docker-compose up -d

# Примените миграции
docker-compose exec app npm run db:push
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    depends_on:
      - postgres
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/telegram_bot_builder

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=telegram_bot_builder
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

---

## 🔧 Команды разработчика

```bash
# Разработка
npm run dev              # Запуск в режиме разработки
npm run build            # Сборка для продакшна
npm run start            # Запуск продакшн версии
npm run check            # Проверка TypeScript

# База данных
npm run db:push          # Применить изменения схемы
npm run db:pull          # Получить схему из БД
npm run db:generate      # Генерация миграций
npm run db:migrate       # Применить миграции

# Утилиты
npm run lint             # Проверка кода
npm run format           # Форматирование кода
npm test                 # Запуск тестов
```

---

## 🐛 Решение проблем

### Windows специфичные проблемы

**"node не является внутренней командой"**
```cmd
# Перезапустите командную строку
# Проверьте установку
node --version
npm --version
```

**"npm run db:push" не работает**
1. Убедитесь что PostgreSQL запущен (services.msc → postgresql)
2. Проверьте настройки в `.env`
3. Проверьте подключение: `psql -U postgres -d telegram_bot_builder`

**Порт 5000 уже занят**
```cmd
# Найдите процесс
netstat -ano | findstr 5000
# Завершите его (замените 1234 на реальный PID)
taskkill /PID 1234 /F
```

**Ошибки прав доступа**
- Запустите командную строку от имени администратора
- Или используйте PowerShell

### Общие проблемы

**Ошибка подключения к базе данных**
```bash
# Проверьте статус PostgreSQL
# Linux/macOS:
sudo systemctl status postgresql
# или
brew services list | grep postgres

# Windows:
services.msc → найдите postgresql

# Проверьте подключение
psql -U postgres -d telegram_bot_builder -h localhost
```

**Ошибки установки пакетов**
```bash
# Очистите кеш npm
npm cache clean --force

# Удалите node_modules и переустановите
rm -rf node_modules package-lock.json
npm install

# Если проблемы с правами (Linux/macOS)
sudo chown -R $(whoami) ~/.npm
```

**Ошибки TypeScript**
```bash
# Проверьте версию Node.js
node --version  # должно быть 18+

# Переустановите TypeScript
npm install -g typescript
npm run check
```

### Производительность

**Медленная работа**
- Добавьте больше RAM PostgreSQL в `postgresql.conf`
- Используйте SSD для базы данных
- Настройте индексы для больших данных

**Большие медиафайлы**
- Настройте внешнее хранилище (AWS S3, Cloudinary)
- Измените лимиты в `server/routes.ts`

---

## 🔒 Настройка безопасности

### Продакшн среда

```bash
# Создайте .env.production
NODE_ENV=production
DATABASE_URL=postgresql://secure_user:secure_pass@localhost:5432/bot_builder_prod
SESSION_SECRET=your_very_long_random_string
```

### PostgreSQL безопасность

```sql
-- Создайте специального пользователя
CREATE USER bot_builder_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE telegram_bot_builder TO bot_builder_user;
GRANT USAGE ON SCHEMA public TO bot_builder_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bot_builder_user;
```

### Файрвол

```bash
# Ограничьте доступ к PostgreSQL
sudo ufw allow from your_app_server_ip to any port 5432

# Или полностью закройте внешний доступ
sudo ufw deny 5432
```

---

## 📊 Мониторинг

### Логи приложения

```bash
# Просмотр логов в реальном времени
tail -f logs/app.log

# Логи PostgreSQL
# Linux: /var/log/postgresql/
# macOS: /usr/local/var/log/
# Windows: C:\Program Files\PostgreSQL\xx\data\log\
```

### Метрики базы данных

```sql
-- Размер базы данных
SELECT pg_size_pretty(pg_database_size('telegram_bot_builder'));

-- Активные подключения
SELECT count(*) FROM pg_stat_activity;

-- Самые медленные запросы
SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

---

💡 **Нужна помощь?** Опишите вашу проблему подробно в [GitHub Issues](https://github.com/yourusername/telegram-bot-builder/issues) - мы поможем решить любые сложности!