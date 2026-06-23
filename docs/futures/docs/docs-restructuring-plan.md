# Реструктуризация документации: идеальная структура docs/

## 1. Текущие проблемы

### 1.1 Структурные проблемы

| Проблема | Описание | Влияние |
|----------|----------|---------|
| Нет "Getting Started" | Новый пользователь не знает с чего начать | Высокий порог входа |
| NODE_TYPES.md — монолит | 500+ строк в одном файле, невозможно ссылаться на конкретную ноду | Плохая навигация, дублирование |
| lib/templates/*.md недоступны | 70+ файлов с детальной документацией по шаблонам не видны в WikiNest | Потеря ценного контента |
| Нет страницы переменных | Переменные — ключевая концепция, но нет отдельной страницы | Пользователи не понимают систему |
| Нет API-справочника | Нет описания REST API для внешних интеграций | Разработчики не могут интегрироваться |
| futures/ перегружен | 40+ планировочных документов в одной папке без категоризации | Сложно найти нужный план |
| bot-json-prompt.md в корне | AI-промт лежит в корне docs/, не в тематической папке | Нарушена иерархия |
| Нет разделения аудиторий | Пользователи и разработчики видят одни и те же документы | Путаница |
| features/ смешивает роадмапы и справочники | buttons-roadmap.md — это план, а не описание фичи | Размытые границы |

### 1.2 Проблемы навигации

- `home.md` — ручной список ссылок, легко устаревает
- Нет breadcrumbs-логики (WikiNest строит из tree.json)
- Нет единого стиля именования файлов (CAPS vs kebab-case)

---

## 2. Предлагаемая идеальная структура

### 2.1 Верхний уровень

```
docs/
├── home.md                          # Главная страница (автогенерируемая)
├── getting-started/                 # 🚀 Быстрый старт (order: 1)
├── guides/                          # 📖 Руководства (order: 2)
├── nodes/                           # 🧩 Справочник нод (order: 3)
├── variables/                       # 📊 Переменные и данные (order: 4)
├── api/                             # 🔌 API (order: 5)
├── deployment/                      # 🚀 Деплой (order: 6)
├── development/                     # 🛠️ Для разработчиков (order: 7)
├── ai/                              # 🤖 AI и автоматизация (order: 8)
├── futures/                         # 🔮 Планы развития (order: 9)
├── releases/                        # 📝 Релизы (order: 10)
├── smm/                             # 📢 SMM (order: 11)
└── assets/                          # Изображения (не отображается)
```

### 2.2 Детальная структура каждой папки

#### getting-started/

```json
// _meta.json
{
  "title": "🚀 Быстрый старт",
  "order": 1
}
```

| Файл | Описание |
|------|----------|
| `introduction.md` | Что такое Telegram Bot Builder, для кого, ключевые возможности |
| `first-bot-in-5-minutes.md` | Пошаговый туториал: создать бота за 5 минут |
| `core-concepts.md` | Триггеры, действия, переходы, переменные — базовые концепции |
| `editor-overview.md` | Обзор интерфейса: канвас, сайдбар, панель свойств |
| `faq.md` | Часто задаваемые вопросы |

#### guides/

```json
// _meta.json
{
  "title": "📖 Руководства",
  "order": 2
}
```

| Файл | Описание |
|------|----------|
| `building-menu-bot.md` | Туториал: бот с меню и кнопками |
| `collecting-user-data.md` | Туториал: сбор данных через input-ноды |
| `conditional-logic.md` | Туториал: ветвление и условия |
| `working-with-media.md` | Туториал: отправка фото, видео, документов |
| `broadcast-and-mailing.md` | Туториал: массовая рассылка |
| `group-bot.md` | Туториал: бот для групповых чатов |
| `userbot-scenarios.md` | Туториал: сценарии с Telegram Client API |
| `http-integrations.md` | Туториал: HTTP-запросы и внешние API |
| `database-and-tables.md` | Туториал: работа с таблицами бота |

#### nodes/

```json
// _meta.json
{
  "title": "🧩 Справочник нод",
  "order": 3
}
```

**Подпапки по категориям:**

```
nodes/
├── _meta.json
├── overview.md                      # Общий обзор системы нод
├── triggers/
│   ├── _meta.json                   # { "title": "📨 Триггеры", "order": 1 }
│   ├── command-trigger.md
│   ├── text-trigger.md
│   ├── incoming-message-trigger.md
│   ├── outgoing-message-trigger.md
│   ├── incoming-callback-trigger.md
│   ├── group-message-trigger.md
│   ├── schedule-trigger.md
│   ├── managed-bot-updated-trigger.md
│   ├── userbot-edit-trigger.md
│   └── userbot-inline-query.md
├── actions/
│   ├── _meta.json                   # { "title": "⚡ Действия", "order": 2 }
│   ├── message.md
│   ├── media-node.md
│   ├── edit-message.md
│   ├── delete-message.md
│   ├── forward-message.md
│   ├── sticker.md
│   ├── voice.md
│   ├── kick-user.md
│   ├── admin-rights.md
│   ├── create-forum-topic.md
│   ├── http-request.md
│   ├── set-variable.md
│   ├── broadcast-bot.md
│   ├── broadcast-client.md
│   ├── userbot-message.md
│   ├── userbot-click-button.md
│   ├── convert-file.md
│   ├── psql-query.md
│   └── bot-table.md
├── logic/
│   ├── _meta.json                   # { "title": "🔀 Логика", "order": 3 }
│   ├── condition.md
│   ├── conditional-branch.md
│   ├── delay.md
│   ├── loop.md
│   ├── map.md
│   ├── auto-transition.md
│   └── navigation.md
└── input/
    ├── _meta.json                   # { "title": "📝 Ввод данных", "order": 4 }
    ├── user-input.md
    ├── handle-user-input.md
    └── conditional-input-handler.md
```

#### variables/

```json
// _meta.json
{
  "title": "📊 Переменные и данные",
  "order": 4
}
```

| Файл | Описание |
|------|----------|
| `overview.md` | Что такое переменные, типы (user, bot, system), жизненный цикл |
| `user-variables.md` | Пользовательские переменные: создание, чтение, обновление |
| `system-variables.md` | Встроенные переменные: `{user_id}`, `{first_name}`, `{message_text}` и т.д. |
| `expressions.md` | Inline-выражения, шаблоны, форматирование |
| `bot-tables.md` | Таблицы бота: CRUD, фильтрация, типизированные колонки |

#### api/

```json
// _meta.json
{
  "title": "🔌 API",
  "order": 5
}
```

| Файл | Описание |
|------|----------|
| `overview.md` | Обзор API: аутентификация, базовый URL, формат ответов |
| `bot-management.md` | Эндпоинты управления ботами (CRUD) |
| `project-json-format.md` | Формат project.json — полная спецификация |
| `webhooks.md` | Webhook-интеграции и события |
| `rate-limits.md` | Лимиты и ограничения |

#### deployment/ (без изменений структуры)

```json
// _meta.json
{
  "title": "🚀 Деплой",
  "order": 6
}
```

| Файл | Описание |
|------|----------|
| `railway-quick-deploy.md` | Быстрый деплой на Railway (переименовать из CAPS) |
| `railway-troubleshooting.md` | Устранение проблем Railway |
| `vercel-deploy.md` | Деплой фронтенда на Vercel |
| `docker.md` | **НОВЫЙ:** Docker-деплой (Dockerfile уже есть в проекте) |
| `environment-variables.md` | **НОВЫЙ:** Полный список env-переменных с описанием |

#### development/

```json
// _meta.json
{
  "title": "🛠️ Для разработчиков",
  "order": 7
}
```

| Файл | Описание |
|------|----------|
| `installation.md` | Установка и настройка dev-окружения |
| `installation-en.md` | Installation guide (English) |
| `contributing.md` | Как внести вклад |
| `how-to-update.md` | Обновление проекта |
| `troubleshooting.md` | Устранение неполадок |
| `adding-new-node.md` | Чеклист добавления новой ноды (бывший adding-new-trigger.md) |
| `wiki-docs-guide.md` | Работа с WikiNest документацией |
| `jsdoc-standards.md` | Стандарты JSDoc (перенести из корня docs/) |
| `architecture.md` | **НОВЫЙ:** Обзор архитектуры (client, server, lib, shared) |
| `testing.md` | **НОВЫЙ:** Как писать и запускать тесты |
| `templates-reference.md` | **НОВЫЙ:** Индекс lib/templates/ с ссылками |

#### ai/

```json
// _meta.json
{
  "title": "🤖 AI и автоматизация",
  "order": 8
}
```

| Файл | Описание |
|------|----------|
| `bot-json-prompt.md` | Промт для AI-генерации ботов (перенести из корня) |
| `ai-editing-guide.md` | **НОВЫЙ:** Как использовать AI для редактирования ботов |
| `prompt-engineering.md` | **НОВЫЙ:** Советы по промтам для генерации сценариев |

#### futures/

```json
// _meta.json
{
  "title": "🔮 Планы развития",
  "order": 9
}
```

**Подпапки по категориям:**

```
futures/
├── _meta.json
├── roadmap.md                       # Общий роадмап с приоритетами
├── nodes/
│   ├── _meta.json                   # { "title": "🧩 Новые ноды", "order": 1 }
│   ├── code-node.md
│   ├── loop-node.md
│   ├── merge-node.md
│   ├── schedule-trigger.md
│   ├── delete-message-node.md
│   ├── convert-file-node.md
│   ├── psql-query-node.md
│   ├── bot-table-node.md
│   └── set-variable-modes.md
├── infrastructure/
│   ├── _meta.json                   # { "title": "🏗️ Инфраструктура", "order": 2 }
│   ├── api-security-audit.md
│   ├── api-security-ideal-architecture.md
│   ├── auth-and-isolation.md
│   ├── bot-worker-pool.md
│   ├── redis-roadmap.md
│   ├── redis-events-improvements.md
│   ├── webhook-mode.md
│   ├── bot-execution-modes.md
│   └── file-storage.md
├── ui/
│   ├── _meta.json                   # { "title": "🎨 Интерфейс", "order": 3 }
│   ├── new-navigation.md
│   ├── charts-roadmap.md
│   ├── setup-wizard-app-settings.md
│   ├── user-profile.md
│   ├── token-card-improvements.md
│   └── project-collaborators.md
├── features/
│   ├── _meta.json                   # { "title": "✨ Фичи", "order": 4 }
│   ├── broadcast-panel.md
│   ├── analytics-dashboard.md
│   ├── deep-link-analytics.md
│   ├── attribution-model.md
│   ├── inline-expressions.md
│   ├── fsm-state-middleware.md
│   ├── file-variable-type.md
│   ├── typed-columns-and-table-math.md
│   ├── start-param-rules.md
│   └── activity-tracking-for-mass-kick.md
└── docs/
    ├── _meta.json                   # { "title": "📚 Документация", "order": 5 }
    ├── docs-restructuring-plan.md   # Этот документ
    └── docusaurus-docs-site.md
```

#### releases/ (без изменений)

```json
// _meta.json
{
  "title": "📝 Релизы",
  "order": 10
}
```

#### smm/ (без изменений)

```json
// _meta.json
{
  "title": "📢 SMM",
  "order": 11
}
```

---

## 3. Что делать с lib/templates/*.md

### Текущая ситуация

В `lib/templates/` находится 70+ папок, многие содержат `.md` файлы с детальной developer-facing документацией по каждому шаблону (параметры, Jinja2-переменные, примеры рендера).

### Рекомендуемый подход: **Гибридная стратегия**

| Стратегия | Для кого | Реализация |
|-----------|----------|------------|
| **Индексная страница** | Разработчики | `development/templates-reference.md` — таблица всех шаблонов со ссылками на GitHub |
| **Выжимка в nodes/** | Пользователи | Каждая страница в `nodes/` содержит user-facing описание (из NODE_TYPES.md) |
| **Ссылки на исходники** | Все | В каждой странице `nodes/*.md` — ссылка "Для разработчиков: [исходный шаблон](link)" |

### Почему НЕ копировать

1. **Дублирование** — lib/templates/*.md обновляются при изменении кода, docs/ устареет
2. **Аудитория** — шаблонная документация содержит Jinja2-синтаксис, не нужный пользователям
3. **Объём** — 70+ файлов раздуют docs/ без пользы для WikiNest-читателей

### Формат индексной страницы `development/templates-reference.md`

```markdown
# 📋 Справочник шаблонов (lib/templates/)

| Шаблон | Категория | Описание | Документация |
|--------|-----------|----------|--------------|
| message | Действие | Отправка текстового сообщения | [README](../../lib/templates/message/README.md) |
| condition | Логика | Условное ветвление | [README](../../lib/templates/condition/README.md) |
| ... | ... | ... | ... |
```

### Автогенерация (опционально, Phase 2)

Скрипт `tools/generate-templates-index.ts`:
- Сканирует `lib/templates/*/`
- Читает первую строку каждого `.md` файла
- Генерирует `development/templates-reference.md`
- Запускается в CI при изменении `lib/templates/**/*.md`

---

## 4. Миграционный план

### Фаза 1: Подготовка (не ломает текущую структуру)

| # | Действие | Детали |
|---|----------|--------|
| 1.1 | Создать `getting-started/` | Папка + `_meta.json` + `introduction.md` (заглушка) |
| 1.2 | Создать `guides/` | Папка + `_meta.json` (пустая, наполнять позже) |
| 1.3 | Создать `nodes/` с подпапками | `triggers/`, `actions/`, `logic/`, `input/` + все `_meta.json` |
| 1.4 | Создать `variables/` | Папка + `_meta.json` + `overview.md` (заглушка) |
| 1.5 | Создать `api/` | Папка + `_meta.json` + `overview.md` (заглушка) |
| 1.6 | Создать `ai/` | Папка + `_meta.json` |

### Фаза 2: Разбиение NODE_TYPES.md

| # | Действие | Детали |
|---|----------|--------|
| 2.1 | Написать скрипт разбиения | `tools/split-node-types.ts` — парсит NODE_TYPES.md по `###` заголовкам |
| 2.2 | Генерировать per-node файлы | Каждый `###` блок → отдельный `.md` в соответствующей подпапке `nodes/` |
| 2.3 | Добавить шапку к каждому файлу | Категория, ссылка на шаблон, ссылка "назад к обзору" |
| 2.4 | Создать `nodes/overview.md` | Таблица всех нод со ссылками на отдельные страницы |
| 2.5 | Оставить NODE_TYPES.md как redirect | Добавить заметку "Перенесено в nodes/" с ссылками |

### Фаза 3: Перемещение существующих файлов

| Откуда | Куда | Примечание |
|--------|------|------------|
| `docs/bot-json-prompt.md` | `docs/ai/bot-json-prompt.md` | Перенос |
| `docs/JSDOC_STANDARDS.md` | `docs/development/jsdoc-standards.md` | Перенос + переименование |
| `docs/CLIENT-README.md` | `docs/development/client-readme.md` | Перенос + переименование |
| `features/POSSIBLE_TRIGGERS_AND_ACTIONS.md` | `nodes/overview.md` (слить) | Контент интегрировать |
| `features/TELEGRAM_CLIENT_API_TRIGGERS_AND_ACTIONS.md` | `nodes/triggers/` (разбить) | Userbot-триггеры |
| `features/buttons-roadmap.md` | `futures/features/buttons-roadmap.md` | Это план, не фича |
| `features/flow-input-architecture-plan.md` | `futures/features/flow-input-architecture.md` | Это план |
| `features/incoming-callback-trigger.md` | `nodes/triggers/incoming-callback-trigger.md` | Справочник |
| `features/telegram-buttons-new-features.md` | `futures/features/telegram-buttons.md` | Это план |
| `development/adding-new-trigger.md` | `development/adding-new-node.md` | Переименование |
| `deployment/RAILWAY_QUICK_DEPLOY.md` | `deployment/railway-quick-deploy.md` | kebab-case |
| `deployment/RAILWAY_TROUBLESHOOTING.md` | `deployment/railway-troubleshooting.md` | kebab-case |
| `deployment/VERCEL_DEPLOY.md` | `deployment/vercel-deploy.md` | kebab-case |

### Фаза 4: Категоризация futures/

| # | Действие |
|---|----------|
| 4.1 | Создать подпапки `futures/nodes/`, `futures/infrastructure/`, `futures/ui/`, `futures/features/`, `futures/docs/` |
| 4.2 | Распределить 40+ файлов по подпапкам (см. структуру в разделе 2) |
| 4.3 | Создать `futures/roadmap.md` — сводная таблица с приоритетами и статусами |
| 4.4 | Удалить `features/` папку (всё перенесено в `nodes/` или `futures/`) |

### Фаза 5: Обновление навигации

| # | Действие |
|---|----------|
| 5.1 | Обновить `home.md` — новые ссылки на новую структуру |
| 5.2 | Проверить `build-tree.yml` — убедиться что tree.json генерируется корректно |
| 5.3 | Проверить WikiNest — все страницы отображаются, навигация работает |
| 5.4 | Обновить ссылки в `AGENTS.md` — пути к NODE_TYPES.md и bot-json-prompt.md |

---

## 5. Страницы для создания с нуля

### 5.1 getting-started/introduction.md

**Содержание:**
- Что такое Telegram Bot Builder (1 абзац)
- Для кого: маркетологи, предприниматели, разработчики
- Ключевые возможности (список из 5-7 пунктов)
- Скриншот интерфейса
- Ссылка на "Первый бот за 5 минут"

### 5.2 getting-started/first-bot-in-5-minutes.md

**Содержание:**
- Предусловия: аккаунт, токен от BotFather
- Шаг 1: Создать проект
- Шаг 2: Добавить command_trigger `/start`
- Шаг 3: Добавить message-ноду с приветствием
- Шаг 4: Соединить ноды
- Шаг 5: Запустить бота
- Шаг 6: Проверить в Telegram
- Скриншоты каждого шага

### 5.3 getting-started/core-concepts.md

**Содержание:**
- Триггеры — что запускает сценарий
- Действия — что бот делает
- Переходы — как ноды связаны
- Переменные — как хранить данные
- Диаграмма потока данных
- Таблица: "Хочу сделать X → используй ноду Y"

### 5.4 getting-started/editor-overview.md

**Содержание:**
- Канвас: drag & drop, зум, соединения
- Сайдбар: список нод, поиск, категории
- Панель свойств: настройки выбранной ноды
- Тулбар: запуск, остановка, код, настройки
- Горячие клавиши

### 5.5 variables/overview.md

**Содержание:**
- Концепция переменных в конструкторе
- Типы: пользовательские (per-user), глобальные (per-bot), системные
- Жизненный цикл: создание → чтение → обновление → удаление
- Где используются: в тексте сообщений, в условиях, в HTTP-запросах
- Синтаксис подстановки: `{variable_name}`

### 5.6 variables/user-variables.md

**Содержание:**
- Создание через set-variable ноду
- Чтение в шаблонах сообщений
- Обновление (режимы: set, increment, append, toggle)
- Типы данных: string, number, boolean, array, json
- Примеры: счётчик, корзина, состояние анкеты

### 5.7 variables/system-variables.md

**Содержание:**
- Полный список системных переменных с описанием:
  - `{user_id}`, `{first_name}`, `{last_name}`, `{username}`
  - `{message_text}`, `{message_id}`, `{chat_id}`
  - `{callback_data}`, `{deep_link_param}`
  - `{date}`, `{time}`, `{timestamp}`
- Где доступна каждая переменная (контекст триггера)
- Примеры использования

### 5.8 variables/expressions.md

**Содержание:**
- Синтаксис inline-выражений
- Математические операции
- Строковые операции
- Условные выражения
- Доступ к вложенным полям JSON
- Примеры: форматирование цены, склонение слов

### 5.9 api/overview.md

**Содержание:**
- Базовый URL API
- Аутентификация (токен, сессия)
- Формат запросов и ответов (JSON)
- Коды ошибок
- Пример curl-запроса

### 5.10 api/project-json-format.md

**Содержание:**
- Полная JSON-схема project.json
- Описание каждого поля верхнего уровня
- Формат описания нод
- Формат описания связей (edges)
- Пример минимального проекта
- Валидация

### 5.11 development/architecture.md

**Содержание:**
- Диаграмма компонентов: client ↔ server ↔ lib ↔ shared
- client: React + Zustand + ReactFlow, структура папок
- server: Express + Drizzle + PostgreSQL, маршруты
- lib: Jinja2-шаблоны → Python-код, пайплайн генерации
- shared: схемы, типы, валидация
- Поток данных: UI → JSON → lib → .py → Docker → Telegram

### 5.12 development/testing.md

**Содержание:**
- Фазовые тесты: что это, как запускать
- Структура `lib/tests/test-phase*-{name}.ts`
- Как написать тест для новой ноды
- Запуск: `npm run test:phase1`, `npm run test:phase2`
- Моки и фикстуры

### 5.13 deployment/environment-variables.md

**Содержание:**
- Таблица всех env-переменных из `.env.example`
- Обязательные vs опциональные
- Описание каждой переменной
- Примеры значений
- Переменные для разных окружений (dev, prod)

### 5.14 deployment/docker.md

**Содержание:**
- Сборка образа
- docker-compose конфигурация
- Переменные окружения для Docker
- Volumes и persistence
- Health checks

---

## 6. Разбиение NODE_TYPES.md

### Текущее состояние

`NODE_TYPES.md` — монолитный файл 500+ строк, содержащий описание всех нод в формате:

```markdown
### 🔔 Триггер команды (`command_trigger`)
Описание...
| Настройка | Описание |
|-----------|----------|
| ... | ... |
```

### Стратегия разбиения

#### Шаг 1: Определить маппинг категорий

```typescript
// tools/split-node-types.ts
const CATEGORY_MAP: Record<string, string> = {
  'command_trigger': 'triggers',
  'text_trigger': 'triggers',
  'incoming_message_trigger': 'triggers',
  'outgoing_message_trigger': 'triggers',
  'incoming_callback_trigger': 'triggers',
  'group_message_trigger': 'triggers',
  'schedule_trigger': 'triggers',
  'managed_bot_updated_trigger': 'triggers',
  'userbot_edit_trigger': 'triggers',
  'userbot_inline_query': 'triggers',
  
  'message': 'actions',
  'media_node': 'actions',
  'edit_message': 'actions',
  'delete_message': 'actions',
  'forward_message': 'actions',
  'sticker': 'actions',
  'voice': 'actions',
  'kick_user': 'actions',
  'admin_rights': 'actions',
  'create_forum_topic': 'actions',
  'http_request': 'actions',
  'set_variable': 'actions',
  'broadcast_bot': 'actions',
  'broadcast_client': 'actions',
  'userbot_message': 'actions',
  'userbot_click_button': 'actions',
  'convert_file': 'actions',
  'psql_query': 'actions',
  'bot_table': 'actions',
  
  'condition': 'logic',
  'conditional_branch': 'logic',
  'delay': 'logic',
  'loop': 'logic',
  'map': 'logic',
  'auto_transition': 'logic',
  'navigation': 'logic',
  
  'user_input': 'input',
  'handle_user_input': 'input',
  'conditional_input_handler': 'input',
};
```

#### Шаг 2: Формат отдельной страницы ноды

```markdown
# 🔔 Триггер команды

> Категория: Триггеры | Тип: `command_trigger`

## Описание

Срабатывает когда пользователь вводит команду (`/start`, `/help`, любая своя).

## Настройки

| Параметр | Тип | Описание | Обязательный |
|----------|-----|----------|--------------|
| command | string | Текст команды | Да |
| description | string | Описание для меню | Нет |
| show_in_menu | boolean | Добавить в меню бота | Нет |
| auto_transition | string | ID ноды для перехода | Нет |

## Примеры использования

### Простая команда /start
- Добавить command_trigger с командой `/start`
- Соединить с message-нодой приветствия

### Команда с deep link параметром
- Команда `/start` + переменная `{deep_link_param}`
- Использовать condition для ветвления по параметру

## Связанные ноды
- [Триггер текста](./text-trigger.md) — для произвольного текста
- [Навигация](../logic/navigation.md) — для перехода между сценариями

## Для разработчиков
- Шаблон: [`lib/templates/command-trigger/`](../../lib/templates/command-trigger/)
- Схема: [`shared/schema/tables/node-schema.ts`](../../shared/schema/tables/node-schema.ts)
```

#### Шаг 3: Создать overview.md

```markdown
# 🧩 Обзор системы нод

## Категории

| Категория | Количество | Описание |
|-----------|-----------|----------|
| [📨 Триггеры](./triggers/) | 10 | Точки входа в сценарий |
| [⚡ Действия](./actions/) | 18 | Что бот делает |
| [🔀 Логика](./logic/) | 7 | Управление потоком |
| [📝 Ввод данных](./input/) | 3 | Сбор данных от пользователя |

## Быстрый поиск

| Хочу... | Используй ноду |
|---------|----------------|
| Реагировать на команду | [command-trigger](./triggers/command-trigger.md) |
| Отправить сообщение | [message](./actions/message.md) |
| Спросить у пользователя | [user-input](./input/user-input.md) |
| Сделать условие | [condition](./logic/condition.md) |
| Отправить HTTP-запрос | [http-request](./actions/http-request.md) |
| ... | ... |
```

#### Шаг 4: Оставить NODE_TYPES.md как redirect

```markdown
# ⚠️ Эта страница перенесена

Справочник нод теперь находится в разделе [🧩 Справочник нод](../nodes/overview.md).

Прямые ссылки:
- [Триггеры](../nodes/triggers/)
- [Действия](../nodes/actions/)
- [Логика](../nodes/logic/)
- [Ввод данных](../nodes/input/)
```

---

## 7. Соглашения об именовании

| Правило | Пример | Анти-пример |
|---------|--------|-------------|
| Файлы: kebab-case | `railway-quick-deploy.md` | `RAILWAY_QUICK_DEPLOY.md` |
| Папки: kebab-case | `getting-started/` | `GettingStarted/` |
| Без префиксов версий | `installation.md` | `INSTALLATION.v2.md` |
| Язык в суффиксе | `installation-en.md` | `INSTALLATION.en.md` |
| Без CAPS кроме аббревиатур | `api/overview.md` | `API_OVERVIEW.md` |

---

## 8. Приоритеты реализации

| Приоритет | Задача | Трудозатраты | Ценность |
|-----------|--------|--------------|----------|
| 🔴 P0 | Создать `getting-started/` с туториалом | 4-6 часов | Критическая |
| 🔴 P0 | Разбить NODE_TYPES.md на per-node страницы | 2-3 часа (скрипт) | Высокая |
| 🟡 P1 | Создать `variables/` раздел | 3-4 часа | Высокая |
| 🟡 P1 | Перенести файлы в новую структуру | 1-2 часа | Средняя |
| 🟡 P1 | Категоризировать futures/ | 1 час | Средняя |
| 🟢 P2 | Создать `api/` раздел | 4-6 часов | Средняя |
| 🟢 P2 | Написать guides/ туториалы | 8-12 часов | Средняя |
| 🟢 P2 | Создать `development/architecture.md` | 2-3 часа | Низкая |
| ⚪ P3 | Автогенерация templates-reference | 2-3 часа | Низкая |
| ⚪ P3 | Скрипт проверки битых ссылок | 1-2 часа | Низкая |

---

## 9. Чеклист готовности

- [ ] Все файлы переименованы в kebab-case
- [ ] NODE_TYPES.md разбит на отдельные страницы
- [ ] getting-started/ содержит минимум 3 страницы
- [ ] variables/ содержит overview + system-variables
- [ ] bot-json-prompt.md перенесён в ai/
- [ ] futures/ категоризирован по подпапкам
- [ ] home.md обновлён под новую структуру
- [ ] tree.json генерируется корректно
- [ ] WikiNest отображает все страницы
- [ ] AGENTS.md обновлён (пути к документации)
- [ ] Нет битых внутренних ссылок
