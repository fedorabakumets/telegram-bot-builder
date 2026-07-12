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
| Запуск бота, токен, деплой | Конструктор / сервер |
| Заливка в БД | Скрипты (`push-bot-project-json.ts`), не MCP |

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

- Сервер **stateless** — не хранит проект между вызовами. Агент держит `project_json` в контексте и сам сохраняет файлы.
- В БД и на диск MCP **сам ничего не пишет** (по умолчанию).
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

## Справочник инструментов (15 тулов)

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

### Слой 4 — Конструирование

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

| Возможность | Статус | Где в roadmap |
|-------------|--------|----------------|
| `lint_bot_project` | ❌ | [[futures/features/ai-agent-tab-vision]] слой 2 |
| `auto_layout` | ❌ | слой 4; логика в `client/utils/hierarchical-layout.ts` |
| `generate_project_files` | ❌ | Dockerfile, requirements, README |
| `list_bots` / `save_bot` / push в БД | ❌ | слой 5 |
| `start_bot` / `deploy_bot` | ❌ | слой 6 |
| Вкладка ИИ-агента в UI | ❌ | тот же слой инструментов, другое «лицо» |

---

## Структура кода (для разработчиков)

| Путь | Назначение |
|------|------------|
| `tools/mcp-server/index.ts` | Регистрация MCP-тулов |
| `lib/bot-tools/` | Реализация инструментов |
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
| `mcp_forbidden_node_type` | `list_node_types` — не используй legacy (`start`, `photo`, …) |
| `condition_wrong_format` | `branches`, не `conditions` |
| `broken_target` | `connect_nodes` или проверь id целевой ноды |
| `get_prompt_guide` съедает контекст | Вызывай реже; для одной ноды хватит `get_node_schema` |

---

## Промпт для агента (шаблон)

```
Собери Telegram-бота через MCP botcraft-builder:
1. scaffold_minimal_project
2. Добавь нужные ноды через create_node + add_node
3. Свяжи connect_nodes
4. validate_bot_project до valid: true
5. Сохрани в bots/<имя>/project.json
Не используй start/command/photo — только типы из list_node_types.
Для condition — branches + else, операторы из list_operators.
```

---

## Версия

MCP-сервер: `botcraft-builder` v2.2.0.5 (поле `SERVER_INFO` в `tools/mcp-server/index.ts`).
