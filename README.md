# Telegram Bot Builder 🤖

Визуальная платформа для создания и управления Telegram ботами с drag-and-drop интерфейсом и автоматической генерацией Python кода.

## ⚡ Быстрый старт

1. **Клонируйте репозиторий:**
   ```bash
   git clone https://github.com/fedorabakumets/telegram-bot-builder.git
   cd telegram-bot-builder
   ```

2. **Установите зависимости:**
   ```bash
   npm install
   ```

3. **Настройте базу данных:**
   ```bash
   # Скопируйте настройки
   cp .env.example .env
   # Отредактируйте DATABASE_URL в .env
   
   # Примените миграции
   npm run db:push
   ```

4. **Запустите приложение:**
   ```bash
   npm run dev
   ```

5. **Откройте браузер:** http://localhost:5000

> 📖 **Подробная установка:** см. [SETUP.md](SETUP.md) для детальных инструкций по установке на Windows и других платформах.

## 🌟 Основные возможности

- 🎨 **Визуальный редактор** - создавайте ботов перетаскиванием элементов на холст
- 🔧 **Автогенерация кода** - получайте готовый Python код для aiogram 3.x
- 📱 **Предпросмотр в реальном времени** - тестируйте бота прямо в браузере
- 🗄️ **Интеграция с PostgreSQL** - автоматическое сохранение данных пользователей
- 📊 **Готовые шаблоны** - используйте примеры для быстрого старта
- 🎭 **Темная/светлая темы** - современный адаптивный интерфейс
- 🔐 **Безопасность** - защищенное хранение токенов ботов
- 📊 **Аналитика пользователей** - статистика использования и команд

## 🛠 Технологии

### Frontend
- **React 18** с TypeScript
- **Vite** для быстрой разработки
- **Tailwind CSS** для стилизации
- **Shadcn/ui** компоненты
- **TanStack Query** для управления состоянием
- **Wouter** для роутинга

### Backend
- **Node.js** с Express.js
- **TypeScript** (ES modules)
- **PostgreSQL** с Drizzle ORM
- **WebSocket** для реального времени
- **Express Session** с PostgreSQL storage

### Генерация ботов
- **Python** с aiogram 3.x
- **PostgreSQL** для данных пользователей
- **aiohttp** для HTTP запросов
- **asyncpg** для асинхронной работы с БД

## 🎯 Возможности создаваемых ботов

### Типы узлов
- **Start** - стартовый узел бота
- **Message** - отправка текстовых сообщений
- **Photo** - отправка изображений
- **Keyboard** - inline и reply клавиатуры
- **Condition** - условная логика
- **Command** - обработка команд
- **User Input** - сбор данных от пользователей
- **Media** - работа с файлами

### Функциональность
- ✅ Текстовое форматирование (Markdown/HTML)
- ✅ Inline и reply клавиатуры
- ✅ Медиафайлы (фото, видео, аудио, документы)
- ✅ Геолокация с интеграцией карт
- ✅ Сбор пользовательских данных с валидацией
- ✅ Условная логика и навигация
- ✅ База данных пользователей
- ✅ Статистика и аналитика

## 📁 Структура проекта

```
telegram-bot-builder/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI компоненты
│   │   │   ├── ui/         # Базовые компоненты
│   │   │   └── editor/     # Компоненты редактора
│   │   ├── pages/          # Страницы приложения
│   │   └── lib/            # Утилиты и хуки
├── server/                 # Express backend
│   ├── routes.ts           # API маршруты
│   ├── storage.ts          # Интерфейс БД
│   ├── db.ts              # Подключение к БД
│   └── telegram-client.ts  # Telegram API
├── shared/                 # Общие типы и схемы
│   └── schema.ts           # Схемы Drizzle ORM
├── scripts/               # Утилиты БД
├── bots/                  # Сгенерированные боты
└── uploads/               # Загруженные файлы
```

## 🔌 API Endpoints

### Проекты
- `GET /api/projects` - Список всех проектов
- `POST /api/projects` - Создание нового проекта
- `GET /api/projects/:id` - Получение проекта по ID
- `PUT /api/projects/:id` - Обновление проекта
- `DELETE /api/projects/:id` - Удаление проекта

### Управление ботами
- `POST /api/projects/:id/bot/start` - Запуск бота
- `POST /api/projects/:id/bot/stop` - Остановка бота
- `GET /api/projects/:id/bot/status` - Статус бота

### Шаблоны
- `GET /api/templates` - Получение шаблонов
- `POST /api/templates` - Создание шаблона
- `PUT /api/templates/:id` - Обновление шаблона

### Медиафайлы
- `POST /api/projects/:id/media/upload` - Загрузка файлов
- `GET /api/projects/:id/media` - Список медиафайлов

### База данных
- `GET /api/database/health` - Статус подключения к БД
- `GET /api/database/stats` - Статистика базы данных

## 🚀 Развертывание

### Для разработки
```bash
npm run dev          # Запуск в режиме разработки
npm run db:push      # Обновление схемы БД
npm run check        # Проверка TypeScript
```

### Для продакшена
```bash
# Сборка приложения
npm run build

# Настройка переменных окружения
export NODE_ENV=production
export DATABASE_URL=your_postgres_url
export PORT=5000

# Запуск
npm start
```

## 📋 Системные требования

- **Node.js** 18.0.0 или выше
- **PostgreSQL** 13 или выше
- **Python** 3.11+ (для генерируемых ботов)
- **npm** или **yarn**

## 🐛 Решение проблем

### База данных
- Убедитесь что PostgreSQL запущен
- Проверьте строку подключения в `.env`
- Выполните `npm run db:push` для создания таблиц

### Порт занят
```bash
# Найдите процесс на порту 5000
netstat -tulpn | grep 5000
# Завершите процесс
kill -9 PID
```

### Ошибки установки
- Запустите от имени администратора (Windows)
- Очистите кеш: `npm cache clean --force`
- Удалите `node_modules` и выполните `npm install`

## 📄 Лицензия

MIT License - см. [LICENSE](LICENSE) для подробностей.

## 🤝 Поддержка

- 📧 **Баги и предложения:** [GitHub Issues](https://github.com/fedorabakumets/telegram-bot-builder/issues)
- 💬 **Обсуждения:** [GitHub Discussions](https://github.com/fedorabakumets/telegram-bot-builder/discussions)
- 📖 **Документация:** [Wiki](https://github.com/fedorabakumets/telegram-bot-builder/wiki)

---

Сделано с ❤️ для сообщества разработчиков Telegram ботов