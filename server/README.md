# Server

Серверная часть приложения - Express.js API сервер для Telegram Bot Builder.

## Структура

### Основные файлы
- `index.ts` - главный файл сервера, настройка Express приложения
- `routes.ts` - основные API маршруты
- `vite.ts` - интеграция с Vite для разработки
- `check-env.ts` - проверка переменных окружения
- `ensureDefaultProject.ts` - обеспечение наличия проекта по умолчанию

### База данных
- `db.ts` - настройка подключения к базе данных
- `db-utils.ts` - утилиты для работы с базой данных
- `db-routes.ts` - маршруты для работы с базой данных
- `db-cache.ts` - кэширование данных базы
- `db-backup.ts` - резервное копирование базы данных
- `init-db.ts` - инициализация базы данных
- `test-db-connection.ts` - тест соединения с базой данных
- `seed-templates.ts` - заполнение базы шаблонами

### Управление ботами
- `createBotFile.ts` - создание файла бота
- `startBot.ts` - запуск бота
- `stopBot.ts` - остановка бота
- `restartBotIfRunning.ts` - перезапуск бота, если он запущен
- `cleanupBotStates.ts` - очистка состояний ботов
- `findActiveProcessForProject.ts` - поиск активного процесса для проекта
- `generatePythonCodeOld.ts` - генерация Python кода (старая версия)

### Утилиты
- `cache.ts` - система кэширования
- `storage.ts` - работа с файловым хранилищем
- `downloadFileFromUrl.ts` - загрузка файла по URL
- `checkUrlAccessibility.ts` - проверка доступности URL
- `getFileType.ts` - определение типа файла
- `normalizeNodeData.ts` - нормализация данных узла
- `normalizeProjectData.ts` - нормализация данных проекта

### Аутентификация и безопасность
- `auth-middleware.ts` - middleware для аутентификации

### Интеграции
- `telegram-client.ts` - клиент для работы с Telegram API
- `telegram-media.ts` - обработка медиафайлов Telegram
- `github-push.ts` - интеграция с GitHub для публикации ботов

### Маршруты
- `routes/` - дополнительные маршруты
  - `github.ts` - маршруты для работы с GitHub

## Технологии

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Drizzle ORM
- Multer (загрузка файлов)
- Passport.js (аутентификация)
- GramJS (Telegram API)

## API Endpoints

### Основные маршруты
- `GET /api/health` - проверка состояния сервера
- `POST /api/bots` - создание нового бота
- `GET /api/bots` - получение списка ботов
- `PUT /api/bots/:id` - обновление бота
- `DELETE /api/bots/:id` - удаление бота

### Аутентификация
- `POST /api/auth/login` - вход в систему
- `POST /api/auth/logout` - выход из системы
- `GET /api/auth/user` - получение данных пользователя

### Файлы
- `POST /api/upload` - загрузка файлов
- `GET /api/files/:id` - получение файла

### GitHub
- `POST /api/github/push` - публикация бота в GitHub
- `GET /api/github/repos` - получение списка репозиториев