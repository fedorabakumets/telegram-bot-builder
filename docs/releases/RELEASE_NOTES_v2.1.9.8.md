# 📋 Release Notes v2.1.9.8

**Дата выпуска:** 25 мая 2026 г.

---

## 🔥 Главное в этом релизе

### Юзербот (Telethon) — 4 новых ноды

Полноценная поддержка работы через аккаунт пользователя (MTProto). Параллельно с основным ботом.

### Нода удаления сообщений (`delete_message`)

Полноценная action-нода с 6 режимами удаления, массовым удалением и автобатчингом.

### Нода задержки (`delay`)

Блокирующая и фоновая пауза между действиями.

---

## 🧩 Новые узлы (ноды)

| Узел | Описание |
|------|----------|
| **userbot_message** | Отправка сообщения от аккаунта пользователя через Telethon |
| **userbot_click_button** | Нажатие inline-кнопки через Telethon |
| **userbot_inline_query** | Inline-запрос к боту через Telethon |
| **userbot_edit_trigger** | Триггер на редактирование сообщения (Telethon) |
| **delete_message** | Удаление сообщений — 6 режимов, массовое удаление, автобатчинг |
| **delay** | Задержка — блокирующая или фоновая пауза |

---

## 🟣 Юзербот (Telethon)

Новая категория нод для работы через аккаунт пользователя:

- **userbot_message** — отправка текста/медиа от аккаунта, несколько получателей, защита от FloodWait
- **userbot_click_button** — нажатие кнопок в сообщениях, поиск по тексту/callback_data/индексу, сохранение alert и обновлённого текста
- **userbot_inline_query** — inline-запрос к боту (@bot query), выбор результата по индексу, отправка в чат
- **userbot_edit_trigger** — триггер на редактирование сообщения, сохранение нового текста и chat_id

Авторизация Telethon через UI (BotUserbotSettings), сессия хранится в .env.

---

## 🗑️ Удаление сообщений (`delete_message`)

**6 режимов:**
- `current_message` — текущее сообщение пользователя
- `last_bot_message` — последнее сообщение бота
- `reply_message` — сообщение из ответа (reply)
- `range_from_reply` — от reply до текущего (пург)
- `last_n` — последние N сообщений
- `custom` — указать ID вручную или через {переменную}

**Возможности:** массовое удаление, кастомный чат, авто-префикс -100, игнорирование ошибок, подсказки в UI.

**Где работает:** группы (до 48ч), личные чаты (до 48ч), каналы (без ограничений).

---

## ⏱️ Задержка (`delay`)

- Блокирующий режим — ждёт, потом продолжает
- Фоновый режим — текущая цепочка завершается, переход через N времени
- Единицы: секунды, минуты, часы, дни
- Поддержка переменных в значении

---

## �️ Файловый менеджер

- Панель файлов проекта (`files-panel.tsx`)
- Таблица файлов с тулбаром
- API для получения файлов проекта (`getProjectFilesHandler`)
- Документ-план: `docs/futures/file-storage.md`

---

## �️ Улучшения UI

- **Поиск в терминале** — `TerminalSearchBar` с хуком `useTerminalSearch`
- **Детали логов** — `TerminalLogDetail` для просмотра полного лога
- **Авторегистрация терминала** — `TerminalAutoRegister` для автоподключения
- **Мобильный FAB** — плавающая кнопка на канвасе для мобильных
- **Диалог удаления проекта** — подтверждение с предупреждением
- **Очистка логов** — API `clearLogsHandler`
- **Inline-бейджи статистики** — в заголовке базы данных пользователей
- **Tab Header** — переиспользуемый компонент заголовка вкладки
- **Property Checkbox** — общий компонент чекбокса для панели свойств

---

## 📸 Метаданные медиа (input)

- Компонент `media-metadata-info.tsx` — информация о метаданных
- Суффиксы метаданных `media-metadata-suffixes.ts` — конфигурация доступных полей
- Документация шаблона `media-input-handlers.md`

---

## 📦 Новый системный шаблон

**«Чистка чата — Модерация»** — готовый сценарий:
- `-смс` — удалить reply + команду админа
- `-смс N` — удалить последние N сообщений
- `!пург` — удалить всё от reply до текущего

---

## � Документация

- `docs/features/NODE_TYPES.md` — обновлён (delete_message, delay, userbot ноды)
- `docs/bot-json-prompt.md` — JSON-примеры для всех новых нод
- `docs/futures/` — планы: file-storage, inline-expressions, set-variable-modes, fsm-state-middleware, typed-columns-and-table-math
- `docs/development/INSTALLATION.md` и `INSTALLATION.en.md` — обновлены
- `AGENTS.md` — обновлены правила создания новых нод

---

## 🧪 Тесты

- `test-phase56-delay.ts` — фазовый тест delay
- `test-phase57-userbot-message.ts` — фазовый тест userbot_message
- `test-phase58-userbot-click-button.ts` — фазовый тест userbot_click_button
- `test-phase59-userbot-inline-query.ts` — фазовый тест userbot_inline_query
- `test-phase60-userbot-edit-trigger.ts` — фазовый тест userbot_edit_trigger
- `test-phase61-delete-message.ts` — фазовый тест delete_message (30 тестов)
- `test-phase45-bot-table.ts` — обновлён
- Unit-тесты для всех новых шаблонов

---

## 🐛 Исправления

- Индентация в Jinja2 шаблоне delete_message (SyntaxError)
- Правило `enableAutoTransition: true` задокументировано (без него связи не рисуются)
- Ограничение в UI: бот может удалять сообщения в личных чатах (Bot API 5.1+)
