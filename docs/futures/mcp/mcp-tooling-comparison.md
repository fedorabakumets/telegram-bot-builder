# Сравнение MCP-инструментов: n8n vs botcraft

Документ сравнивает набор MCP-инструментов нашего конструктора с встроенным
MCP-сервером n8n (на уровне инстанса) и фиксирует, что стоит заимствовать, а что — нет.

> Связанные планы: [`mcp-live-editing.md`](./mcp-live-editing.md) (live-правки через БД),
> [`mcp-observability.md`](./mcp-observability.md) (логи/аналитика/таблицы).
>
> *Данные по инструментам n8n приведены по официальной справке и переформулированы
> для соблюдения лицензионных ограничений. Имена инструментов — фактические идентификаторы.*

## Ключевая разница в модели

- **n8n MCP работает с живым инстансом** — правит реально запущенные воркфлоу, умеет
  их исполнять и тестировать.
- **Наш MCP работает со структурой проекта** — `project.json` на диске (а в перспективе —
  запись в БД, см. `mcp-live-editing.md`).

Отсюда вытекают почти все различия ниже.

## Инструменты n8n по категориям (референс)

- **Управление воркфлоу:** `search_workflows`, `get_workflow_details`,
  `create_workflow_from_code`, `update_workflow` (батч атомарных операций:
  addNode / removeNode / renameNode / addConnection / setNodeParameter …),
  `archive_workflow`, `publish_workflow`, `unpublish_workflow`.
- **Построение/конфигурация нод:** `search_nodes`, `get_node_types` (точные
  TS-определения параметров), `get_sdk_reference`, `get_workflow_best_practices`,
  `explore_node_resources` (реальные значения: каналы Slack, листы Sheets),
  `validate_workflow`, `validate_node_config`.
- **Исполнение:** `execute_workflow`, `test_workflow`, `prepare_test_pin_data`,
  `get_execution`, `search_executions`.
- **Прочее:** `list_credentials`, `search_projects`, `search_folders`, `list_tags`,
  data tables (`create_data_table`, `add_data_table_rows`, `add_data_table_column` …).

> Помимо встроенного сервера есть популярный community-сервер `n8n-mcp`
> (czlonkowski) — он специализируется на документации нод для ИИ.

## Таблица сопоставления

| Задача | n8n | botcraft (наш) |
|--------|-----|----------------|
| Дискавери типов | `search_nodes`, `get_node_types` | `list_node_types`, `get_node_schema`, `get_node_example` |
| Создание/правка | `create_workflow_from_code`, `update_workflow` (батч-операции) | `create_node`, `add_node`, `update_node`, `remove_node` |
| Связи | `addConnection` (внутри `update_workflow`) | `connect_nodes` |
| Валидация | `validate_workflow`, `validate_node_config` | `validate_bot_project`, `validate_node` |
| Исполнение/тест | `execute_workflow`, `test_workflow` | — (есть только `generate_bot_code` — генерит код) |
| Best practices | `get_workflow_best_practices` | `get_prompt_guide` |
| Чтение/запись проекта | живой инстанс | `load_project`, `save_project` (диск) |

## Чего нет у нас (по убыванию ценности)

1. **Исполнение и тестирование через MCP** (`execute_workflow`, `test_workflow`
   с pin data). Самый большой разрыв: агент у n8n может прогнать воркфлоу и увидеть
   результат. У нас тест бота — вне MCP. Стыкуется с идеей наблюдаемости
   (`mcp-observability.md`) и «execution data» из общего roadmap фич.
2. **Батч-операции в одном инструменте** (`update_workflow` = массив атомарных
   addNode/removeNode/setNodeParameter/addConnection). У нас на это 5 отдельных
   инструментов — их модель компактнее и атомарнее (всё применяется одной транзакцией).
3. **Инструмент-гайд по технике** (`get_workflow_best_practices`) — отдаёт готовый
   гайд под конкретную задачу (чатбот, расписание и т.п.), а не общий промт.
4. **Дискавери реальных значений** (`explore_node_resources`) — подтягивает живые
   данные внешних сервисов. Для нас менее применимо (мы про Telegram), но идея полезна
   для подстановки реальных таблиц/переменных проекта.

## Что заимствовать, а что — нет

**Заимствовать:**
- **Батч-операции** — ввести один инструмент вида `apply_project_ops` с массивом
  атомарных операций (`addNode`, `updateNode`, `removeNode`, `connectNodes`,
  `setNodeParam`), применяемых одной транзакцией. Компактнее и безопаснее, чем
  серия отдельных вызовов; естественно ложится на live-правки через БД.
- **Инструмент-гайд по технике** — расширить `get_prompt_guide` до гайдов под
  конкретные сценарии (анкета, воронка, рассылка), а не один общий промт.
- **Исполнение/тест** — в перспективе `test_scenario` / `run_node` с тестовыми
  данными (см. execution-data в roadmap наблюдаемости).

**НЕ заимствовать / подтверждение нашей линии:**
- n8n **не** делает узкие инструменты под каждый тип ноды — `addNode` обобщённый
  внутри `update_workflow`. Это прямо подтверждает: **не плодить спец-инструменты**
  вроде `add_trigger`, `add_message` и т.п. Достаточно обобщённого add с типом.

## Выводы

- Наша дискавери/валидация — на паритете с n8n.
- Главные пробелы — **исполнение/тестирование** и **батч-операции**.
- Ближайший дешёвый шаг — **батч-инструмент** (`apply_project_ops`) и **гайды по технике**;
  он же хорошо стыкуется с переходом на запись в БД (`mcp-live-editing.md`).
- Исполнение/тест — более крупная задача, идёт в связке с наблюдаемостью.
