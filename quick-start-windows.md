# Быстрый запуск для Windows 🚀

## После установки PostgreSQL и Node.js:

### 1. Настройте проект (один раз):
```cmd
# Скопируйте настройки
copy .env.example .env

# Отредактируйте пароль PostgreSQL
notepad .env

# Установите зависимости  
npm install

# Создайте базу данных через pgAdmin или:
# В PowerShell (замените "ваш_пароль"):
$env:PGPASSWORD="ваш_пароль"; & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE telegram_bot_builder;"

# Создайте таблицы
npm run db:push
```

### 2. Запуск проекта (каждый раз):

**Способ 1 - PowerShell (РЕКОМЕНДУЕТСЯ):**
```powershell
$env:NODE_ENV="development"; tsx server/index.ts
```

**Способ 2 - CMD:**
```cmd
start-dev.bat
```

### 3. Откройте браузер:
http://localhost:5000

---

## Решение проблем:

**"NODE_ENV не является командой"** → Используйте PowerShell
**"tsx не найден"** → Выполните `npm install` 
**Ошибка БД** → Проверьте пароль в `.env` файле
**Порт занят** → Измените PORT в `.env` или завершите процесс:
```cmd
netstat -ano | findstr 5000
taskkill /PID номер_процесса /F
```