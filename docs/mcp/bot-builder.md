# MCP-сервер конструктора (botcraft-builder)

> Подробное руководство по MCP-серверу BotCraft Studio для сборки `project.json` и генерации Python-кода через внешние ИИ-клиенты (Cursor, Claude Desktop, Kiro).

Краткий обзор: [[mcp/overview]].

---

## Что это и зачем

**MCP botcraft-builder** — stdio-сервер [Model Context Protocol](https://modelcontextprotocol.io), который даёт ИИ-агенту **инструменты конструктора** вместо угадывания формата JSON.

**Проблема без MCP:** внешняя модель галлюцинирует структуру нод — классика: `condition` с несуществующими `conditions` + `defaultTarget` вместо `branches`.

**С MCP:** на каждом шаге правду диктует код проекта — zod-схемы (`shared/schema`), валидатор и генератор из `lib/bot-generator.ts`.

### Правило для агента: команды только латиницей

При создании `command_trigger`:

- текст команды — **только английская латиница** `a-z`, цифры и `_` (Telegram Bot API / меню): `/buy`, `/refund`, `/help`;
- **нельзя** кириллицу в команде (`/купить`, `/возврат` — не сработают в меню и `setMyCommands`);
- `description` и тексты `message` — по-русски;
- стандартные `/start`, `/help`, `/paysupport`, `/terms` — тоже латиница (см. `list_commands`);
- аргументы одной строки (`/donate 777`) — поле `saveCommandArgsTo` (имя переменной для текста после команды).

Подробности: [[bot-json-prompt]] (раздел `command_trigger` и «Правила генерации»).

MCP **не заменяет** визуальный редактор. Он дополняет его:

| Задача | Удобнее через |
|--------|----------------|
| Черновик бота по описанию в чате | MCP |
| Тонкая настройка, медиа, сложный граф | Сайт (`npm run dev`) |
| Live-правка сценария в БД, статус/логи | MCP (`db_*`, `update_project_db`) |
| Срок хранения сообщений токена | MCP (`db_set_messages_retention`) или UI |
| Запуск/стоп/рестарт бота | MCP или UI вкладки «Бот» |

Связанные документы:

- [[mcp/overview]] — краткий обзор
- [[mcp/example-simple-bot]] — пример `/start` + `/help`
- [[futures/features/ai-agent-tab-vision]] — дорожная карта (MCP = «внешнее лицо» слоя инструментов)
- [[bot-json-prompt]] — полный формат `project.json` для ИИ
- [[features/NODE_TYPES]] — настройки нод в UI

---

## Архитектура

```
Внешний ИИ (Cursor / Claude Desktop)
        │  stdio
        ▼
tools/mcp-server/index.ts     ← тонкая обёртка MCP
        │
        ▼
lib/bot-tools/                ← ядро: validate, create, mutate, generate
        │
        ├── shared/schema       (zod)
        └── lib/bot-generator   (bot.py + assertValidPython)
```

**Важно:**

- Файловые тулы **stateless** — агент держит `project_json` в контексте (или пишет через `save_project`).
- Live-тулы (`update_project_db`, `db_*`) ходят в HTTP API запущенного приложения с `Authorization: Bearer` из request-scoped ALS (remote `/mcp`) или `MCP_AGENT_TOKEN` (stdio).
- Ответ каждого тула — JSON в текстовом блоке MCP.

---

## Remote HTTP (без клона репо)

Основной способ для пользователей продакшена: эндпоинт **`POST /mcp`** (Streamable HTTP) + Bearer PAT из вкладки «Агент».

Полное описание, threat model и конфиги Cursor / Claude / Codex: [[mcp/remote-http]].

Краткий сниппет:

```json
{
  "mcpServers": {
    "botcraft-builder": {
      "url": "https://<домен>/mcp",
      "headers": {
        "Authorization": "Bearer mcp_…"
      }
    }
  }
}
```

На HTTP **отключены** `load_project` / `save_project` (диск сервера). Live-правки — через `db_*`.

Флаг: `MCP_HTTP_ENABLED` (по умолчанию включено).

---

## Установка и подключение (stdio, локально)

### Требования

- Node.js ≥ 16
- Репозиторий `telegram-bot-builder`, зависимости: `npm install`
- Зависимость MCP: `@modelcontextprotocol/sdk` (уже в `package.json`)

### npm-скрипт

```bash
npm run mcp:bot-builder
```

Внутри:

```
tsx --tsconfig tools/mcp-server/tsconfig.json tools/mcp-server/index.ts
```

Скрипт запускает stdio-сервер и **ждёт ввода** — вручную его обычно не запускают; это делает IDE.

### Cursor (проектный конфиг)

Файл `.cursor/mcp.json` в корне репозитория:

```json
{
  "mcpServers": {
    "botcraft-builder": {
      "command": "C:\\Program Files\\nodejs\\npm.cmd",
      "args": ["run", "mcp:bot-builder"],
      "cwd": "C:\\Users\\1\\Desktop\\telegram-bot-builder"
    }
  }
}
```

**Настрой под свою машину:**

- `cwd` — абсолютный путь к клону репозитория
- `command` — на macOS/Linux часто просто `npm` или полный путь к `npm`

**В Cursor:** Settings → MCP → Refresh. Сервер `botcraft-builder` должен быть **Connected**.

### Claude Desktop / другие клиенты

Тот же паттерн: `command` = npm, `args` = `["run", "mcp:bot-builder"]`, `cwd` = корень репо.

---

## Допустимые типы нод

MCP для **создания** нод использует **белый список** — те же 32 типа, что в палитре сайдбара (`componentCategories`).

Источник: `lib/bot-tools/mcp-allowed-types.ts`

### Разрешены (32)

`command_trigger`, `text_trigger`, `incoming_message_trigger`, `outgoing_message_trigger`, `message`, `media`, `input`, `edit_message`, `delete_message`, `forward_message`, `callback_trigger`, `incoming_callback_trigger`, `keyboard`, `answer_callback_query`, `group_message_trigger`, `create_forum_topic`, `kick_user`, `schedule_trigger`, `http_request`, `psql_query`, `bot_table`, `convert_file`, `condition`, `set_variable`, `loop`, `delay`, `parallel_split`, `userbot_message`, `userbot_click_button`, `userbot_inline_query`, `userbot_edit_trigger`, `comment`

### Запрещены для create_node / list_node_types

Legacy и типы вне палитры: `start`, `command`, `photo`, `video`, `audio`, `document`, `animation`, `sticker`, `voice`, `location`, `contact`, user-management кроме `kick_user`, `broadcast`, `client_auth`, `get_managed_bot_token`, `managed_bot_updated_trigger` и др.

**Замены:**

| Вместо | Используй |
|--------|-----------|
| `start`, `command` | `command_trigger` + `message` |
| `photo`, `video`, `sticker`… | `media` |

**Нюанс:** `validate_bot_project` всё ещё принимает legacy-типы в **старых** проектах. Whitelist ограничивает только **создание** через MCP.

---

## Минимальный JSON (minimize)

MCP **не раздувает** `data` дефолтами клавиатуры. Для `message` достаточно:

```json
{
  "id": "msg-welcome",
  "type": "message",
  "position": { "x": 400, "y": 300 },
  "data": {
    "messageText": "Привет!"
  }
}
```

Поля `keyboardType: "none"`, `buttons: []`, `markdown: false` и т.п. **не добавляются**, если они равны дефолту схемы. Логика: `lib/bot-tools/minimize-node-data.ts`.

---

## Рекомендуемый workflow для агента

```
1. list_node_types  или  get_node_schema("message")
2. scaffold_minimal_project({ sheet_name: "Мой бот" })
3. create_node("message", { messageText: "..." })
4. add_node(project_json, node)
5. connect_nodes(project_json, from_id, to_id, { port_type: "auto-transition" })
6. validate_bot_project(project_json)  →  valid: true
7. Сохранить JSON в bots/<имя>/project.json
8. generate_bot_code(project_json, { bot_name: "my-bot" })  — опционально
```

### Правила condition-ноды

- Только `branches` (массив), **не** `conditions` / `defaultTarget`
- Обязательна ветка с `operator: "else"`
- Операторы — из `list_operators`
- Пример: `get_node_example("condition")`

### После каждой мутации

Тулы `add_node`, `update_node`, `connect_nodes`, `scaffold_minimal_project` возвращают поле `validation` — проверяй его сразу.

---
## Справочник инструментов

> Ниже — основные группы. Актуальный полный список всегда в `tools/mcp-server/index.ts` (и в Cursor MCP inspector).

### Слой 1 — Introspection (только чтение)

#### `list_node_types`

Без параметров.

Возвращает: `types[]`, `count`, `forbidden[]`, `replacements{}`, `note`.

#### `get_node_schema`

| Параметр | Тип | Описание |
|----------|-----|----------|
| `type` | string | Тип ноды |

Структура ноды, правила проекта, `typeSpecificNotes`, `example`. Ошибка, если тип не в whitelist.

#### `get_node_example`

| Параметр | Тип |
|----------|-----|
| `type` | string |

Минимальный эталон ноды `{ id, type, position, data }`.

#### `list_operators`

Список операторов `condition` + запрещённые (`not_empty`, `conditions`, …).

#### `list_commands`

Стандартные команды Telegram (`/start`, `/help`, …) из `lib/commands.ts`.  
Свои команды агент должен создавать **только латиницей** (`/buy`, `/refund`), без кириллицы в тексте команды.

#### `get_prompt_guide`

Весь файл `docs/bot-json-prompt.md` (~1900 строк). Тяжёлый контекст — вызывать осознанно. Там же правило: команды только с латинским текстом.

---

### Слой 2 — Валидация

#### `validate_bot_project`

| Параметр | Тип |
|----------|-----|
| `project_json` | object или JSON-строка |

Проверки:

- zod: `botDataWithSheetsSchema`
- домен: битые `target`, дубли `id`, `condition` без `else`, запрещённый формат `conditions`

Ответ: `{ valid: boolean, issues: [{ severity, path, message, code }] }`

#### `validate_node`

| Параметр | Тип |
|----------|-----|
| `node` | object |
| `type` | string, опционально |

---

### Слой 3 — Генерация

#### `generate_bot_code`

| Параметр | Тип | Описание |
|----------|-----|----------|
| `project_json` | object/string | Проект |
| `bot_name` | string? | Имя для генерации |
| `skip_validation` | boolean? | Пропустить validate |

Успех: `{ success: true, python, lines }`. Перед генерацией по умолчанию вызывается `validate_bot_project`. Python проходит `assertValidPython`.

---

### Слой 4 — Конструирование (файлы / project.json)

#### `create_node`

| Параметр | Тип |
|----------|-----|
| `type` | string |
| `partial_data` | object? |
| `id` | string? |
| `position` | `{ x, y }`? |

Возвращает `{ node, validation }`. Отклоняет типы вне whitelist.

#### `scaffold_minimal_project`

| Параметр | Тип |
|----------|-----|
| `sheet_name` | string? |
| `nodes` | array? |

По умолчанию: `command_trigger` `/start` → `message` с приветствием.

#### `add_node` / `update_node` / `remove_node`

| Параметр | Описание |
|----------|----------|
| `project_json` | Текущий проект |
| `node` / `node_id` / `patch` | Что менять |
| `sheet_id` | Опционально; иначе activeSheetId или первый лист |

`update_node`: shallow merge для `data`.

#### `connect_nodes`

| Параметр | Описание |
|----------|----------|
| `from_id`, `to_id` | ID нод |
| `port_type` | См. таблицу ниже |
| `branch` | id кнопки/ветки для `button-goto` |

| `port_type` | Эффект |
|-------------|--------|
| `auto-transition` | `autoTransitionTo` + `enableAutoTransition: true` |
| `trigger-next` | только `autoTransitionTo` |
| `button-goto` | `target` на кнопке/ветке с `branch` |
| `input-target` | `inputTargetNodeId` |

#### `load_project` / `save_project`

Чтение/запись `bots/<имя>/project.json` на диске.

---

### Слой 5 — Живая БД (сценарий)

Требуют `MCP_AGENT_TOKEN` и доступ к проекту. Пишут в БД приложения и обновляют открытый холст (live).

Ключевые тулы: `get_project_db`, `update_project_db`, `db_project_summary`, `db_list_projects`, `db_create_project`, `db_list_nodes`, `db_find_nodes`, `db_get_node`, `db_add_node`, `db_update_node`, `db_remove_node`, `db_connect_nodes`, `db_disconnect_nodes`, `db_move_node`, `db_duplicate_node`, `db_auto_layout`, `db_list_sheets`, `db_add_sheet`, `db_rename_sheet`, `db_remove_sheet`, `db_duplicate_sheet`, `db_set_active_sheet`, `db_reorder_sheets`, `db_move_sheet_to_project`, `db_list_versions`, `db_restore_version`, `db_delete_version`, `db_prune_versions`, `db_apply_ops`, …

Подробнее: [[futures/mcp/mcp-live-editing]].

---

### Слой 6 — Runtime ботов и настройки токена

#### `db_list_bot_tokens`

| Параметр | Тип | Описание |
|----------|-----|----------|
| `project_id` | number | ID проекта из URL |

Список токенов **без секрета** `token`: `id`, `name`, `botUsername`, флаги, **`messagesRetentionDays`**.

#### `db_add_bot_token`

Подключить бота к проекту — токен от `@BotFather` (модалка «Подключить бота»).

| Параметр | Тип | Описание |
|----------|-----|----------|
| `project_id` | number | ID проекта |
| `token` | string | Токен вида `123456789:AAH…` |
| `name` | string? | Имя записи (по умолчанию «Основной токен») |
| `is_default` | boolean? | Сделать токеном по умолчанию |

- сервер вызывает Telegram `getMe` и шлёт WS `token-created`
- дубликат того же `token` в проекте → `ok` + `created: false` (существующий id)
- ответ **без** секрета `token` (только `id` / `name` / `botUsername` / флаги)
- далее: `db_start_bot(project_id, token_id)`

Эквивалент UI и `POST /api/projects/{id}/tokens`.

Код: `lib/bot-tools/bot-token-create-db.ts` → `addBotTokenInDb`.

#### `db_update_bot_token`

Сменить Telegram-токен у существующей записи (UI TokenDisplayEdit).

| Параметр | Тип | Описание |
|----------|-----|----------|
| `project_id` | number | ID проекта |
| `token_id` | number | ID записи из `db_list_bot_tokens` |
| `token` | string | Новый токен вида `123456789:AAH…` |
| `name` | string? | Опционально новое имя записи |

- при новом `token` сервер ставит `isActive: 1` и шлёт WS `token-updated`
- **не** вызывает Telegram `getMe` — `botUsername` может не обновиться
- ответ **без** секрета `token` (только `id` / `name` / `botUsername` / флаги)
- маскированный/`••••` token API игнорирует; MCP валидирует формат до запроса

Эквивалент UI и `PUT /api/projects/{id}/tokens/{tokenId}`.

Код: `lib/bot-tools/bot-token-update-db.ts` → `updateBotTokenInDb`.

#### `db_bot_status` / `db_bot_logs` / `db_bot_launch_history`

Статус, live-логи и история запусков по `token_id` из `db_list_bot_tokens`.
UI вкладки «Боты» грузит статусы проекта одним запросом `GET /api/projects/{id}/bot/statuses` ([[api/project-bot]]).
`db_bot_status` по-прежнему смотрит один токен.
`db_bot_launch_history` после сверки не отдаёт «зомби» running, если бот offline ([[features/launch-history-status-reconciliation]]).
`db_bot_logs` / live-логи: последний launch из history + live `launch_id IS NULL` для running; изоляция `token_id` в воркере — [[features/bot-worker-pool-isolation]].

#### `db_start_bot` / `db_stop_bot` / `db_restart_bot` / `db_restart_all_bots`

Управление процессом. `db_stop_bot` и `db_restart_all_bots` требуют `confirm: true`.
`db_restart_all_bots` перезапускает только **уже запущенные** боты (офлайн не поднимает).

#### `db_start_offline_bots`

Запустить всех **офлайн** ботов проекта (уже running и недействительные токены не трогает).

| Параметр | Тип | Описание |
|----------|-----|----------|
| `project_id` | number | ID проекта |
| `confirm` | boolean | Обязательно `true` |

Эквивалент UI «Запустить офлайн» и `POST /api/projects/{id}/bot/start-offline-all` ([[api/projects]], [[features/start-offline-bots]]).
Карточки обновляются live через WS `bot-started` + `start-offline-progress` ([[api/realtime-events]]).

Код: `lib/bot-tools/bot-runtime-db.ts` → `startOfflineBotsInDb`.

#### `db_delete_bot_token`

Удалить токен бота из проекта (**необратимо**). Доступен владельцу и коллабораторам.

| Параметр | Тип | Описание |
|----------|-----|----------|
| `project_id` | number | ID проекта |
| `token_id` | number | ID токена из `db_list_bot_tokens` |
| `confirm` | boolean | Обязательно `true` |

Эквивалент UI «Удалить» и `DELETE /api/projects/{projectId}/tokens/{tokenId}` ([[features/token-project-access-delete]]).
WS: `token-deleted`.

Код: `lib/bot-tools/bot-runtime-db.ts` → `deleteBotTokenInDb`.

#### `db_set_messages_retention`

Установить срок хранения сообщений диалога (`bot_messages`) для одного токена.

| Параметр | Тип | Описание |
|----------|-----|----------|
| `project_id` | number | ID проекта |
| `token_id` | number | ID токена из `db_list_bot_tokens` |
| `messages_retention_days` | number | `0`, `7`, `30`, `60`, `90`, `180` или `365` |

- `0` — без автоочистки (безлимит)
- иначе сервер раз в час удаляет сообщения этого токена старше N дней
- таблица `message_activity_daily` (график «Активность») **не** трогается
- перезапуск бота **не** нужен

Эквивалент UI «Хранить сообщения» и API `PUT /api/projects/{projectId}/tokens/{tokenId}/messages-retention` ([[api/tokens]]).

После успеха UI получает WS `token-updated` и обновляет карточки **без F5** (см. [[api/realtime-events]], [[features/token-settings-realtime]]). Toast на массовый апдейт не спамится.

**Пример (массово на 50 ботов):** сначала `db_list_bot_tokens`, затем цикл `db_set_messages_retention` по каждому `token_id`.

Код: `lib/bot-tools/bot-token-settings-db.ts`.

---

## Пример: простой бот

Готовый разбор: [[mcp/example-simple-bot]].

Файл: `bots/mcp-simple-bot/project.json`

**Логика:**

- `/start` → приветствие
- `/help` → справка

**4 ноды:** два `command_trigger`, два `message`. Связи через `autoTransitionTo`.

Собран через MCP-тулы: `scaffold_minimal_project` → `create_node` → `add_node` → `connect_nodes` → `validate_bot_project`.

**Импорт в конструктор:** `npm run dev` → создать/открыть проект → вставить JSON (вкладка JSON) или положить файл и импортировать.

---

## Чего в MCP пока нет

| Возможность | Статус | Где смотреть |
|-------------|--------|----------------|
| Live-правки сценария в БД | ✅ | слой 5, [[futures/mcp/mcp-live-editing]] |
| Старт/стоп/рестарт, логи, статус | ✅ | слой 6 |
| Срок хранения сообщений | ✅ | `db_set_messages_retention` |
| Live UI после настроек токена | ✅ | WS `token-updated`, [[features/token-settings-realtime]] |
| Запуск всех офлайн | ✅ | `db_start_offline_bots`, [[features/start-offline-bots]] |
| Добавление токена бота | ✅ | `db_add_bot_token` (без секрета в ответе), POST `/api/projects/{id}/tokens` |
| Смена токена записи | ✅ | `db_update_bot_token` (без секрета в ответе), PUT `/api/projects/{id}/tokens/{tokenId}` |
| Удаление токена бота | ✅ | `db_delete_bot_token` (`confirm: true`), [[features/token-project-access-delete]] |
| `db_auto_layout` | ✅ | слой 5 |
| Вкладка ИИ-агента в UI | частично | [[futures/features/ai-agent-tab-vision]] |

---

## Структура кода (для разработчиков)

| Путь | Назначение |
|------|------------|
| `tools/mcp-server/index.ts` | Регистрация MCP-тулов |
| `lib/bot-tools/` | Реализация инструментов |
| `lib/bot-tools/bot-runtime-db.ts` | Статус/логи/старт/стоп |
| `lib/bot-tools/bot-token-create-db.ts` | Добавление токена (`db_add_bot_token`) |
| `lib/bot-tools/bot-token-update-db.ts` | Смена токена (`db_update_bot_token`) |
| `lib/bot-tools/bot-token-settings-db.ts` | Настройки токена (retention) |
| `lib/bot-tools/mcp-allowed-types.ts` | Whitelist типов |
| `lib/bot-tools/minimize-node-data.ts` | Компактный JSON |
| `lib/bot-tools/project-mutate.ts` | scaffold, add, connect, … |
| `.cursor/mcp.json` | Конфиг Cursor |

### Добавление новой ноды в палитру

При появлении типа в сайдбаре обновить:

1. `lib/bot-tools/mcp-allowed-types.ts`
2. `lib/bot-tools/node-presets.ts` (дефолты `data`)
3. [[development/adding-new-trigger]] — полный чеклист
4. `docs/bot-json-prompt.md`, [[features/NODE_TYPES]]

---

## Типичные ошибки

| Симптом | Решение |
|---------|---------|
| MCP не подключается | Проверь `cwd` в mcp.json, `npm install`, Refresh в Cursor |
| `401` / `403` на `db_*` | Задай `MCP_AGENT_TOKEN` (вкладка «Агент»), перезапусти MCP |
| `mcp_forbidden_node_type` | `list_node_types` — не используй legacy (`start`, `photo`, …) |
| `condition_wrong_format` | `branches`, не `conditions` |
| `broken_target` | `connect_nodes` или проверь id целевой ноды |
| `messages_retention_days` rejected | Только `0/7/30/60/90/180/365` |
| `get_prompt_guide` съедает контекст | Вызывай реже; для одной ноды хватит `get_node_schema` |

---

## Промпт для агента (шаблон)

```
Собери Telegram-бота через MCP botcraft-builder:
1. scaffold_minimal_project
2. Добавь нужные ноды через create_node + add_node
3. Свяжи connect_nodes
4. validate_bot_project — исправь issues
5. При необходимости update_project_db / db_apply_ops
```

Для срока хранения на проде:

```
1. db_list_bot_tokens(project_id)
2. Для каждого token_id: db_set_messages_retention(project_id, token_id, 60)
```

---

## Версия

MCP-сервер: `botcraft-builder` (поле `SERVER_INFO` в `tools/mcp-server/index.ts`).


## Настройка Telethon Userbot через MCP

Настройка аккаунта отличается от нод `userbot_message`, `userbot_click_button`, `userbot_inline_query` и `userbot_edit_trigger`: ноды описывают сценарий, а инструменты ниже подключают аккаунт к конкретному токену бота. Инструменты доступны и через stdio, и через HTTP `/mcp`; авторизация — Bearer PAT, как у остальных `db_*`.

Во всех четырёх инструментах обязательны `project_id` и `token_id` (ID записи из `db_list_bot_tokens`, а не секрет Telegram-токена).

| Инструмент | Остальные параметры |
|---|---|
| `db_set_userbot_settings` | Обязательный `enabled`: 0 или 1; необязательные `api_id`, `api_hash`, `session_string` |
| `db_userbot_send_code` | Обязательные `api_id`, `phone`; необязательный `api_hash` |
| `db_userbot_sign_in` | Обязательные `phone`, `code` |
| `db_userbot_sign_in_2fa` | Обязательный `password` |

Порядок подключения:

1. Сохранить API ID и API Hash через `db_set_userbot_settings`. До завершения входа можно оставить `enabled: 0`. Если уже есть готовая session string, сохранить её с `enabled: 1` и перейти к запуску бота.
2. Вызвать `db_userbot_send_code` с API ID и телефоном с кодом страны. Без `api_hash` сервер использует сохранённый Hash.
3. Передать полученный код и тот же телефон в `db_userbot_sign_in` для того же проекта и токена.
4. Если ответ содержит `needs_2fa: true`, вызвать `db_userbot_sign_in_2fa` с паролем. Успешный вход сохраняет сессию в БД и включает режим.
5. Запустить бота через `db_start_bot` или перезапустить работающего через `db_restart_bot`. Автоматического перезапуска нет; настройки применяются при следующем запуске.

Пропущенные поля настроек не меняются. `api_id: null` или пустая строка очищают API ID. Для `api_hash` и `session_string` null, пустые строки и маски сохраняют прежний секрет. Отключение через `enabled: 0` сохраняет реквизиты.

Ответы MCP содержат `ok`, безопасный `message`, при необходимости `error`, `needs_2fa` или `userbotEnabled`. API Hash, пароль, код, session string и `phone_code_hash` не возвращаются. Сырые сообщения API также не возвращаются. Ошибки Telegram сохраняют коды `invalid_code`, `code_expired`, `invalid_password`, `flood_wait`, `timeout`, `process_exit`; неизвестные ошибки становятся `auth_error`. HTTP-ошибки имеют вид `http_403`, некорректный ответ — `invalid_response`, сбой запроса или разбора JSON — `request_failed`.

При `code_expired` запросить новый код; при `flood_wait` повторить позже. Шаги выполняются последовательно: после перезапуска сервера незавершённую авторизацию нужно начать с отправки кода. Пароль 2FA передаётся без удаления пробелов.

REST API: [[api/project-tokens]]. Отдельный OpenAPI→MCP также содержит эти REST-операции; именованные инструменты выше принадлежат `botcraft-builder`.

После сохранения настроек и после успешного входа по коду или 2FA сервер рассылает `token-updated` всем подключённым вкладкам с доступом к проекту. Вкладки обновляют данные токена; форма Userbot синхронизирует переключатель, реквизиты и статус авторизации. Вводимый код не сбрасывается при обновлении неизменённой сессии. При появлении сохранённой сессии форма завершает авторизацию и очищает локальные телефон, код, пароль и ошибку. Секреты в WebSocket-событие не включаются.

Промежуточные шаги входа синхронизируются событием `userbot-auth-progress`: `{ step: "code", phone }` после успешной отправки кода, `{ step: "2fa", phone }` при запросе пароля и `{ step: "done" }` после сохранения сессии. Открытые формы фильтруют события по проекту и токену и позволяют продолжить начатый через MCP вход. Телефон доступен только вкладкам с доступом к проекту; код, пароль, API Hash, session string и phone_code_hash в событие не включаются. Повторная доставка одного события не очищает вводимый код. Событие завершения обновляет форму и при переавторизации, когда маска уже сохранённой сессии не меняется. Шаги передаются в реальном времени открытым формам; история шагов не сохраняется и не восстанавливается при перезагрузке страницы или разрыве соединения. После перезапуска сервера незавершённый вход начинается заново с отправки кода.

Очередь несохранённых настроек в UI сверяет `USERBOT_ENABLED` с актуальными данными токена после изменений через MCP или другую вкладку. Если желаемое значение уже сохранено, оно удаляется из очереди и счётчик уменьшается. Отличающийся от сервера черновик и остальные настройки сохраняются.
