# Telegram Bot Builder

Telegram Bot Builder - это визуальная платформа для создания и управления настраиваемыми Telegram ботами с мощными возможностями генерации кода и интуитивно понятным дизайном.

## Основные возможности

- 🎨 **Визуальный редактор**: Drag-and-drop интерфейс для создания ботов
- 🔧 **Генерация кода**: Автоматическое создание Python кода для aiogram
- 📱 **Предпросмотр**: Тестирование ботов прямо в браузере
- 🗄️ **Управление данными**: Интеграция с PostgreSQL базой данных
- 🎭 **Темы**: Поддержка светлой и темной тем
- 📊 **Шаблоны**: Готовые шаблоны для быстрого старта
- 🔐 **Безопасность**: Защищенное хранение токенов ботов

## Технологии

### Frontend
- React 18 с TypeScript
- Vite для быстрой разработки
- Tailwind CSS для стилизации
- Shadcn/ui компоненты
- React Query для управления состоянием

### Backend
- Node.js с Express.js
- TypeScript
- PostgreSQL с Drizzle ORM
- WebSocket для реального времени

### Генерация ботов
- Python с aiogram 3.x
- Поддержка медиафайлов
- Inline и reply клавиатуры
- Сбор пользовательских данных

## Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/yourusername/telegram-bot-builder.git
cd telegram-bot-builder
```

2. Установите зависимости:
```bash
npm install
```

3. Настройте базу данных:
```bash
# Установите PostgreSQL URL в переменную окружения
export DATABASE_URL="postgresql://username:password@localhost:5432/bot_builder"

# Примените миграции
npm run db:push
```

4. Запустите сервер разработки:
```bash
npm run dev
```

## Использование

1. Откройте браузер и перейдите на `http://localhost:3000`
2. Создайте новый проект или используйте шаблон
3. Добавьте компоненты на холст с помощью drag-and-drop
4. Настройте свойства узлов в правой панели
5. Протестируйте бота в режиме предпросмотра
6. Экспортируйте Python код и запустите бота

## Структура проекта

```
telegram-bot-builder/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI компоненты
│   │   ├── pages/          # Страницы приложения
│   │   └── lib/            # Утилиты
├── server/                 # Express backend
│   ├── routes.ts           # API маршруты
│   └── storage.ts          # Интерфейс БД
├── shared/                 # Общие типы и схемы
│   └── schema.ts           # Схемы базы данных
└── README.md
```

## API Endpoints

- `GET /api/projects` - Получить список проектов
- `POST /api/projects` - Создать новый проект
- `GET /api/projects/:id` - Получить проект по ID
- `PUT /api/projects/:id` - Обновить проект
- `DELETE /api/projects/:id` - Удалить проект
- `POST /api/projects/:id/bot/start` - Запустить бота
- `POST /api/projects/:id/bot/stop` - Остановить бота
- `GET /api/templates` - Получить шаблоны

## Создание ботов

Генерируемые боты поддерживают:
- Команды и обработчики сообщений
- Inline и reply клавиатуры
- Медиафайлы (фото, видео, аудио, документы)
- Геолокацию с картами
- Сбор пользовательских данных
- Базу данных PostgreSQL

## Развертывание

1. Соберите проект:
```bash
npm run build
```

2. Настройте переменные окружения:
```bash
NODE_ENV=production
DATABASE_URL=your_postgres_url
```

3. Запустите сервер:
```bash
npm start
```

## Лицензия

MIT License

## Поддержка

Если у вас есть вопросы или предложения, создайте issue в репозитории.