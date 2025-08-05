# Telegram Bot Builder - Установка на Windows

## Быстрая установка

### 1. Установите необходимые программы

**Node.js** (версия 18+):
- Скачайте: https://nodejs.org/
- Установите LTS версию
- Перезапустите командную строку после установки

**PostgreSQL** (версия 13+):
- Скачайте: https://www.postgresql.org/download/windows/
- При установке запомните пароль для пользователя `postgres`
- Оставьте порт 5432

### 2. Настройте базу данных

Откройте **pgAdmin 4** (установился с PostgreSQL):

1. Подключитесь к серверу (введите пароль postgres)
2. Создайте базу данных:
   - Правый клик на "Databases" → Create → Database
   - Имя: `telegram_bot_builder`
3. Создайте пользователя:
   - Правый клик на "Login/Group Roles" → Create → Login/Group Role
   - General: Имя `bot_user`
   - Definition: Пароль `your_password`
   - Privileges: ✅ Can login?
   - Privileges: ✅ Superuser? (или дайте права на созданную БД)

### 3. Настройте проект

```cmd
# Перейдите в папку проекта
cd путь\к\вашему\проекту

# Скопируйте файл конфигурации
copy .env.example .env

# Отредактируйте .env файл (замените your_password на ваш пароль)
notepad .env

# Установите зависимости
npm install

# Создайте таблицы в базе данных
npm run db:push

# Запустите проект
npm run dev
```

### 4. Откройте браузер

Перейдите по адресу: http://localhost:5000

## Решение проблем

### "node не является внутренней командой"
- Перезапустите командную строку
- Убедитесь что Node.js установлен правильно: `node --version`

### Ошибка подключения к базе данных
- Проверьте что PostgreSQL запущен (services.msc → postgresql)
- Проверьте настройки в файле `.env`
- Убедитесь что пользователь `bot_user` создан и имеет права

### Порт уже занят
```cmd
# Найдите процесс на порту 5000
netstat -ano | findstr 5000
# Завершите процесс (замените PID на найденный номер)
taskkill /PID номер_процесса /F
```

### Права доступа
Запустите командную строку от имени администратора

## Структура проекта

```
telegram-bot-builder/
├── client/          # Frontend (React)
├── server/          # Backend (Express + TypeScript)
├── shared/          # Общие типы и схемы
├── uploads/         # Загруженные файлы
├── package.json     # Настройки Node.js
├── .env            # Переменные окружения (создайте сами)
└── README.md       # Документация
```

## Основные команды

```cmd
npm run dev          # Запуск в режиме разработки
npm run build        # Сборка для продакшна
npm run start        # Запуск продакшн версии
npm run db:push      # Обновление схемы БД
npm run check        # Проверка TypeScript
```