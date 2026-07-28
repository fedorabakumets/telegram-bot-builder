# MCP-сервер конструктора (botcraft-builder)

> Подробное руководство по MCP-серверу BotCraft Studio для сборки `project.json` и генерации Python-кода через внешние ИИ-клиенты (Cursor, Claude Desktop, Kiro).

Краткий обзор: [[mcp/overview]].

---

## Что это и зачем

**MCP botcraft-builder** — stdio-сервер [Model Context Protocol](https://modelcontextprotocol.io), который даёт ИИ-агенту **инструменты конструктора** вместо угадывания формата JSON.

**Проблема без MCP:** внешняя модель галлюцинирует структуру нод — классика: `condition` с несуществующими `conditions` + `defaultTarget` вместо `branches`.

**С MCP:** на каждом шаге правду диктует код проекта — zod-схемы (`shared/schema`), валидатор и генератор из `lib/bot-generator.ts`.

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
- Live-тулы (`update_project_db`, `db_*`) ходят в HTTP API запущенного приложения с `Authorization: Bearer` из `MCP_AGENT_TOKEN`.
- Ответ каждого тула — JSON в текстовом блоке MCP.

---

## Установка и подключение

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

#### `get_prompt_guide`

Весь файл `docs/bot-json-prompt.md` (~1900 строк). Тяжёлый контекст — вызывать осознанно.

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

#### `db_bot_status` / `db_bot_logs` / `db_bot_launch_history`

Статус, live-логи и история запусков по `token_id` из `db_list_bot_tokens`.
`db_bot_launch_history` после сверки не отдаёт «зомби» running, если бот offline ([[features/launch-history-status-reconciliation]]).
`db_bot_logs` / live-логи: последний launch из history + live `launch_id IS NULL` для running; изоляция `token_id` в воркере — [[features/bot-worker-pool-isolation]].

#### `db_start_bot` / `db_stop_bot` / `db_restart_bot` / `db_restart_all_bots`

Управление процессом. `db_stop_bot` и `db_restart_all_bots` требуют `confirm: true`.
`db_restart_all_bots` перезапускает только **уже запущенные** боты (офлайн не поднимает).

#### `db_start_offline_bots`

Запустить всех **офлайн** ботов проекта (уже running не трогает).

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
