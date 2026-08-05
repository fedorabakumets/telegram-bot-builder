# Серверная часть приложения

Серверная часть приложения - Express.js API сервер для Telegram Bot Builder.

## 📁 Структура проекта

### 🏠 Основные файлы
- `index.ts` - главный файл сервера, настройка Express приложения
- `routes.ts` - основные API маршруты
- `vite.ts` - интеграция с Vite для разработки
- `ensureDefaultProject.ts` - обеспечение наличия проекта по умолчанию

### 🗄️ База данных
- `db.ts` - настройка подключения к базе данных
- `db-utils.ts` - утилиты для работы с базой данных
- `db-routes.ts` - маршруты для работы с базой данных
- `db-cache.ts` - кэширование данных базы
- `db-backup.ts` - резервное копирование базы данных
- `init-db.ts` - инициализация базы данных
- `test-db-connection.ts` - тест соединения с базой данных
- `seed-templates.ts` - заполнение базы шаблонами
- `DatabaseStorage.ts` - базовый класс для работы с хранилищем
- `EnhancedDatabaseStorage.ts` - расширенная реализация хранилища с кэшированием и мониторингом
- `OptimizedDatabaseStorage.ts` - оптимизированная реализация хранилища

### 🤖 Управление ботами
- `createBotFile.ts` - создание файла бота
- `createBotAssets.ts` - создание сопутствующих файлов бота
- `startBot.ts` - запуск бота
- `stopBot.ts` - остановка бота
- `restartBotIfRunning.ts` - перезапуск бота, если он запущен
- `cleanupBotStates.ts` - очистка состояний ботов
- `findActiveProcessForProject.ts` - поиск активного процесса для проекта

### 🔧 Утилиты
- `cache.ts` - система кэширования
- `storage.ts` - работа с файловым хранилищем
- `downloadFileFromUrl.ts` - загрузка файла по URL
- `checkUrlAccessibility.ts` - проверка доступности URL
- `getFileType.ts` - определение типа файла
- `normalizeNodeData.ts` - нормализация данных узла
- `normalizeProjectData.ts` - нормализация данных проекта
- `initStorage.ts` - инициализация хранилища

### 🔐 Аутентификация и безопасность
- `auth-middleware.ts` - middleware для аутентификации

### 📡 Интеграции
- `telegram-client.ts` - клиент для работы с Telegram API
- `telegram-media.ts` - обработка медиафайлов Telegram
- `github-push.ts` - интеграция с GitHub для публикации ботов

### 🛣️ Маршруты
- `routes/` - дополнительные маршруты
  - `routes/github.ts` - маршруты для работы с GitHub

## 🛠️ Технологии

- **Node.js** - платформа выполнения JavaScript
- **Express.js** - веб-фреймворк для Node.js
- **TypeScript** - надмножество JavaScript с типизацией
- **PostgreSQL** - реляционная база данных
- **Drizzle ORM** - ORM для работы с базой данных
- **Multer** - обработка загрузки файлов
- **Passport.js** - аутентификация
- **GramJS** - клиентская библиотека для Telegram API

## 🌐 API Endpoints

### 📋 Основные маршруты
- `GET /api/health` - проверка состояния сервера
- `POST /api/bots` - создание нового бота
- `GET /api/bots` - получение списка ботов
- `PUT /api/bots/:id` - обновление бота
- `DELETE /api/bots/:id` - удаление бота

### 🔐 Аутентификация
- `GET /api/auth/me` - текущий пользователь сессии (или null)
- `POST /api/auth/logout` - выход (destroy session); алиас `POST /api/auth/telegram/logout`
- `POST /api/auth/telegram` - вход / смена аккаунта (Telegram Login Widget)
- `POST /api/auth/telegram/miniapp` - вход через Mini App initData
- `POST /api/auth/dev-login` - вход по ID (development / SKIP_AUTH)
- `GET /api/auth/login` - HTML-страница входа
- Подробности: `docs/api/auth.md`, `docs/features/studio-auth.md`

### 📁 Файлы
- `POST /api/upload` - загрузка файлов
- `GET /api/files/:id` - получение файла

### 📦 GitHub
- `POST /api/github/push` - публикация бота в GitHub
- `GET /api/github/repos` - получение списка репозиториев

## 🚀 Запуск сервера

Для запуска сервера в режиме разработки:
```bash
npm run dev
```

Для запуска сервера в продакшене:
```bash
npm start
```

## 📝 Описание ключевых компонентов

### Хранилище данных
Система использует иерархическую структуру хранилища:
- `DatabaseStorage` - базовый класс для работы с базой данных
- `EnhancedDatabaseStorage` - расширенная реализация с кэшированием и мониторингом
- `OptimizedDatabaseStorage` - оптимизированная реализация для высокой производительности

### Кэширование
Система кэширования включает:
- `dbCache` - кэш для базы данных
- `cachedOps` - кэшированные операции с базой данных
- `serverCache` - общий кэш для API запросов

### Управление процессами
Система управления ботами включает:
- Отслеживание активных процессов ботов
- Запуск и остановка ботов
- Перезапуск ботов при необходимости
- Очистка состояний ботов при запуске сервера