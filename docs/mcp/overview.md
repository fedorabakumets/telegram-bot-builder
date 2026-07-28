# MCP-конструктор ботов — обзор

> Краткое введение. Полное руководство: [[mcp/bot-builder]]. Пример: [[mcp/example-simple-bot]].

---

## Что это

**MCP botcraft-builder** — сервер для Cursor и других ИИ-клиентов, который позволяет **собирать и сопровождать ботов словами в чате** без ручного рисования нод.

ИИ вызывает инструменты конструктора:

- узнать схему ноды и собрать `project.json`
- проверить валидность и сгенерировать `bot.py`
- править сценарий в **живой БД** (live на холсте)
- смотреть статус/логи и управлять запуском ботов
- менять настройки токена (например срок хранения сообщений)

Формат JSON контролируется кодом проекта — модель не выдумывает несуществующие поля.

---

## Когда использовать

| ✅ Удобно | ❌ Лучше в UI |
|----------|---------------|
| Простой бот: команды, сообщения, условия | Сложный граф, много медиа |
| Быстрый черновик по описанию | Точная настройка каждой ноды |
| Live-правки сценария в БД | Визуальная раскладка на холсте |
| Статус/логи/старт/стоп, срок хранения | Массовый UX с 50+ карточками сразу |

---

## Быстрый старт

1. В репозитории: `npm install`
2. Подключить MCP — см. [[mcp/bot-builder#Установка и подключение]] (нужен `MCP_AGENT_TOKEN` для live/API-тулов)
3. В чате Cursor: *«Собери бота с /start и /help через botcraft-builder MCP»*
4. Сохранить `project.json` или писать сразу в БД через `db_*` / `update_project_db`

---

## Инструменты (кратко)

**Знание:** `list_node_types`, `get_node_schema`, `get_node_example`, `list_operators`, `list_commands`, `get_prompt_guide`

**Проверка / код:** `validate_bot_project`, `validate_node`, `generate_bot_code`

**Сборка (файлы):** `create_node`, `scaffold_minimal_project`, `add_node`, `update_node`, `remove_node`, `connect_nodes`, `load_project`, `save_project`

**Живая БД (сценарий):** `get_project_db`, `update_project_db`, `db_*` ноды/листы/версии/проекты, `db_apply_ops`, `db_auto_layout`, …

**Runtime ботов:** `db_list_bot_tokens`, `db_bot_status`, `db_bot_logs`, `db_bot_launch_history`, `db_start_bot`, `db_stop_bot`, `db_restart_bot`, `db_restart_all_bots`, `db_start_offline_bots`, `db_delete_bot_token`

**Настройки токена:** `db_set_messages_retention` — срок хранения сообщений (`0` / `7` / `30` / `60` / `90` / `180` / `365`). UI обновляется live через WS `token-updated` ([[features/token-settings-realtime]], [[api/realtime-events]]).

Полный список: [[mcp/bot-builder#Справочник инструментов]].

---

## Ограничения

- **32 типа нод** для создания — как в палитре сайдбара (без legacy `start`, `command`, `photo`…)
- Live/API-тулы требуют **Bearer PAT** (`MCP_AGENT_TOKEN`) и доступ к проекту
- Массовый старт офлайн: UI «Запустить офлайн» или MCP `db_start_offline_bots` (`confirm: true`)

---

## Дальше

- [[mcp/bot-builder]] — полная документация (установка, все тулы, workflow)
- [[mcp/example-simple-bot]] — разбор примера `/start` + `/help`
- [[futures/mcp/mcp-live-editing]] — live-редактирование и runtime
- [[bot-json-prompt]] — формат JSON
