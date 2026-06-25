# Roadmap: Live-редактирование сценария через БД (MCP / ассистент → холст)

Документ описывает план, при котором правки сценария, сделанные **MCP-сервером
(ассистентом)**, сохраняются в **базу данных** и **мгновенно** появляются на
открытом холсте у пользователя — по образцу того, как ассистент редактирует
документ в Figma / воркфлоу в n8n.

> Это **не** про совместное редактирование двумя людьми — оно описано в
> [`realtime-collaboration.md`](../../features/realtime-collaboration.md). Здесь речь про
> программные правки от MCP, доставляемые на холст в реальном времени.
> Транспорт (WebSocket `/api/canvas`) и presence-инфраструктура общие.

> **Статус: Фаза 1 реализована** (коммит `feat(mcp): live-редактирование сценария через MCP`).
> MCP-тул `update_project_db` пишет проект в БД через `PUT /api/projects/:id`, сервер
> вещает правку на открытый холст, версии MCP-правок помечаются автором «ИИ-агент»,
> список истории версий обновляется live. Детали — в таблицах Фазы 1 ниже.

## Проблема (исходное состояние, до Фазы 1)

Изначально MCP-инструменты работали **с файлами на диске**, в обход живого приложения
(`load_project`/`save_project` остаются для файлового сценария):

- `load_project` / `save_project` (`lib/bot-tools/project-io.ts`, зарегистрированы
  в `tools/mcp-server/index.ts`) читают и пишут `bots/<проект>/project.json`.
- Веб-приложение хранит проекты в **БД** (`bot_projects.data`, jsonb), а не в этих файлах.
- Диск и БД — два независимых источника. Синхронизация ручная
  (`GET /api/projects/import-from-files`), файловый мониторинг по умолчанию выключен.
- Канвас-WS (`/api/canvas`) сейчас работает как **relay**: сервер не хранит документ
  и не инициирует правки — он только пересылает сообщения между клиентами.

Итог: когда MCP меняет `project.json`, открытый в браузере холст **ничего не узнаёт** —
нужно вручную импортировать с диска и перезагрузить редактор.

## Цель (целевой поток)

```
MCP (ассистент)
   │  правка сценария (нода/свойство/связь)
   ▼
HTTP API запущенного приложения  (PUT /api/projects/:id  или  granular endpoint)
   │  валидация + запись в БД (bot_projects.data) + снимок версии (kind='auto'/'manual')
   ▼
Сервер вещает изменение в комнату canvas_<projectId> по WS /api/canvas
   │  actor = { kind: 'agent', displayName: 'Ассистент' }
   ▼
Открытый холст применяет правку оптимистично, без пометки «несохранённые изменения»
   │  показывает бейдж «Изменено ассистентом» (CanvasActor уже поддерживает kind='agent')
```

Ключевая смена парадигмы: **источник истины — БД**, сервер становится не только relay,
но и инициатором broadcast при программных правках. Диск (`bots/*.json`) превращается
в опциональный экспорт, а не в рабочую копию.

## Архитектурные решения (которые нужно принять до реализации)

1. **Как MCP пишет в БД — через HTTP API сервера или напрямую в БД?**
   - **Рекомендуется через HTTP API** запущенного приложения: бесплатно получаем
     валидацию схемы, версионирование (снимок при сохранении) и broadcast на холст.
   - Прямая запись в БД быстрее, но в обход сервера → нет broadcast и версий.
     Оставить как fallback, когда сервер не запущен (тогда realtime недоступен).

2. **Аутентификация MCP к API.** Нужен сервисный токен или доверенный локальный канал.
   Локально уже есть `SKIP_AUTH=true`; для продакшена — отдельный MCP-токен/заголовок.

3. **Гранулярность правок.**
   - **Фаза 1 (быстро):** MCP шлёт целиком обновлённый `BotDataWithSheets`, сервер
     вещает снапшот — переиспользуем существующий путь canvas-sync.
   - **Фаза 2:** node-level дельты `(nodeId, property, value)` — стыкуется с
     операционной моделью из `realtime-collaboration.md` (#4–#6).

4. **Конфликт с одновременным ручным редактированием.** Пока действует LWW по времени
   (как в текущем canvas-sync). Корректное слияние появится вместе с дельта-моделью.

5. **Источник истины диск vs БД.** Для live-режима выбираем БД. Экспорт в `bots/*.json`
   делаем явной операцией (для генерации кода / git), а не рабочим состоянием.

## План реализации

### Фаза 0 — Подготовка (выбор контракта)
| # | Задача | Сложность | Статус |
|---|--------|-----------|--------|
| 0.1 | Зафиксировать решение «MCP → HTTP API сервера» и формат правки | Низкая | ✅ Готово (вариант 1A: адресация по числовому `projectId`, снапшот целиком) |
| 0.2 | Аутентификация MCP к API — **персональные токены агента (per-user PAT)** + deny-by-default + удаление гостевых проектов | Средняя | ✅ **Готово** (`8dd17ba23` 0.2a auth-инфра + deny-by-default + удаление гостей; `63ceb047e` 0.2b вкладка «Агент»; `cf6a71275`+`567d1f9a3` 0.2c проектные тулы; `36385ec52`+`709ff5fdb` 0.2d live-sync списка проектов вкл. коллабораторов). Модель GitHub/Stripe + RFC 6750. **Остаётся**: enforcement scopes (read/write) — отложено, селектор скрыт. См. раздел «Проектный блок». |

### Фаза 1 — Полный снапшот через API + broadcast (MVP realtime)
| # | Задача | Сложность | Статус |
|---|--------|-----------|--------|
| 1.1 | MCP-инструмент `update_project_db` — пишет сценарий в БД через `PUT /api/projects/:id` | Средняя | ✅ Готово (`lib/bot-tools/project-db.ts`, тул в `tools/mcp-server/index.ts`) |
| 1.2 | Серверный broadcast в комнату `canvas_<id>` после программного обновления (actor kind='agent') | Средняя | ✅ Готово (`server/canvas/broadcastAgentCanvasUpdate.ts`, вызов в `updateProjectHandler` при `agentEdit:true`) |
| 1.3 | Новый тип сообщения `canvas-external-update` в `shared/canvas-sync/` | Низкая | ➖ Не понадобилось (переиспользован `canvas-sync` + ветка по `actor.kind==='agent'`) |
| 1.4 | Клиент применяет внешнюю правку без пометки «несохранённые изменения» | Средняя | ✅ Готово (`handleRemoteCanvasSync` в `editor.tsx`) |
| 1.5 | Бейдж «Изменено ассистентом» (переиспользовать `RemoteSyncBadge` + `CanvasActor.kind='agent'`) | Низкая | ✅ Готово (бейдж «ИИ-агент редактирует холст») |
| 1.6 | Снимок версии при MCP-правке (auto; опционально manual с «Изменено через MCP: …») | Низкая | ✅ Готово (снимок через существующий путь; колонка `author_kind='agent'`, автор «ИИ-агент»; список версий обновляется live) |

### Фаза 2 — Гранулярные правки нод (node-level)
| # | Задача | Сложность | Статус |
|---|--------|-----------|--------|
| 2.1 | MCP-операции уровня ноды: add/update/remove node, connect/disconnect | Средняя | ✅ Готово + расширено. Ноды: `db_add_node`/`db_update_node`/`db_remove_node`/`db_connect_nodes`/`db_move_node` (перенос между листами, `lib/bot-tools/node-ops-db.ts`, `project-mutate.ts`). Чтение: `get_project_db`/`db_project_summary`/`db_list_nodes`/`db_get_node` (`project-db-read.ts`, `node-query-db.ts`). Листы: `db_add_sheet`/`db_rename_sheet`/`db_remove_sheet`/`db_set_active_sheet`/`db_list_sheets` (`sheet-ops.ts`, `sheet-ops-db.ts`). Фикс: `canvasSheetSchema.createdAt/updatedAt` → `z.coerce.date()` (jsonb round-trip). Не сделано: `db_duplicate_sheet` (нужна регенерация id нод + ремаппинг ссылок). |
| 2.2 | Дельта-протокол `(nodeId, property, value)` (общий с realtime-collaboration #4) | Высокая | ⬜ |
| 2.3 | Точечное применение дельты на холсте (анимация/подсветка изменённой ноды) | Средняя | ⬜ |
| 2.4 | Арбитраж порядка событий на сервере (общий с realtime-collaboration #6) | Высокая | ⬜ |

### Фаза 3 — UX и наблюдаемость
| # | Задача | Сложность | Статус |
|---|--------|-----------|--------|
| 3.1 | Подсветка/центрирование ноды, которую только что изменил ассистент | Низкая–средняя | ⬜ |
| 3.2 | Лента действий ассистента (что и когда поменял) | Средняя | ⬜ |
| 3.3 | Откат конкретной правки ассистента (поверх версионирования/чекпоинтов) | Средняя | ⬜ |

## Фаза 2 — детально: что изменится и зачем

### Предел Фазы 1 (почему нужна Фаза 2)

В Фазе 1 любая правка агента = **отправка всего сценария целиком**. Чтобы добавить одну
ноду, агент читает из БД весь проект, дописывает, шлёт весь `BotDataWithSheets` обратно,
сервер вещает на холст полный снапшот. Следствия:

- на больших ботах (сотни нод) каждая мелкая правка гоняет весь документ;
- одновременная ручная правка человеком **затирается** снапшотом агента (LWW по времени);
- холст не знает, *что именно* изменилось — применяет весь снапшот, без точечной подсветки;
- эффект «ноды появляются по одной» достижим только хаком (несколько последовательных
  полных `update_project_db`), а не штатно.

### Что вводит Фаза 2

| # | Что | Как меняется поведение |
|---|-----|------------------------|
| 2.1 | **Node-level операции против живой БД**: тулы `db_add_node` / `db_update_node` / `db_remove_node` / `db_connect_nodes` | Агент шлёт одну операцию («добавь ноду X»), а не весь сценарий. Сервер применяет её к проекту в БД и вещает. |
| 2.2 | **Дельта-протокол `(nodeId, property, value)`** | Синхронизация переходит со «снапшота целиком» на точечные дельты — по сети идёт только изменение, как в Figma. |
| 2.3 | **Точечное применение на холсте** | Холст применяет конкретную дельту и подсвечивает/анимирует именно изменённую ноду, без перерисовки всего канваса. |
| 2.4 | **Серверный арбитраж порядка событий** | Сервер — судья: правки разных нод не конфликтуют; конфликт одного поля решается «кто последним дошёл до сервера», а не по часам клиента. |

### Плюсы

- **Производительность:** трафик/нагрузка перестают зависеть от размера сценария — летят
  только изменения. Критично для больших ботов.
- **Совместная работа без потерь:** человек и агент правят одновременно — правки разных
  нод не затирают друг друга (в Фазе 1 затирают).
- **Аккуратный визуал:** видно *что именно* поменялось — подсветка/анимация конкретной
  ноды; штатный «билд по одной ноде» вместо хака с серией полных снапшотов.
- **Точная история/откат:** можно логировать и откатывать отдельные операции агента,
  а не только целые снапшоты.
- **Фундамент под коллаборацию людей:** 2.2 и 2.4 — общий протокол с
  [`realtime-collaboration.md`](../../features/realtime-collaboration.md) (#4–#6). Сделав их
  для агента, получаем основу и для одновременного редактирования двумя людьми.

### Рекомендуемый порядок внутри Фазы 2

1. **Срез 2.1 + 2.3** (средняя сложность, поверх готовой Фазы 1): node-level тулы +
   подсветка изменённой ноды. Даёт «билд по одной» и экономию на больших ботах штатно,
   с малым риском — снапшот под капотом можно сохранить на первом шаге.
2. **2.2 + 2.4** (высокая сложность, отдельный крупный заход): смена ядра синхронизации
   (снапшот → дельты) и серверный арбитраж. Затрагивает клиент, сервер и модель
   коллаборации — делать по дизайн-доку вместе с `realtime-collaboration.md`.

> Граница: **Фаза 1 = «прилетает на холст живьём» (готово). Фаза 2 = «прилетает точечно,
> аккуратно и без затирания».** Real-time доставка уже работает в Фазе 1 — Фаза 2 не про
> «сделать real-time», а про гранулярность, конфликт-безопасность и точечный UX.

## Что уже есть и переиспользуется

- **MCP-запись в БД (Фаза 1)** — `lib/bot-tools/project-db.ts` (`updateProjectInDb`),
  тул `update_project_db` в `tools/mcp-server/index.ts`.
- **Node-level операции над БД (Фаза 2.1)** — `lib/bot-tools/node-ops-db.ts`
  (`addNodeInDb`/`updateNodeInDb`/`removeNodeInDb`/`connectNodesInDb`) поверх `project-mutate.ts`
  и `updateProjectInDb`; тулы `db_add_node`/`db_update_node`/`db_remove_node`/`db_connect_nodes`.
- **Read-тулы состояния из БД (Фаза 2.1)** — `lib/bot-tools/project-db-read.ts`
  (`fetchProjectFromDb`) и `lib/bot-tools/node-query-db.ts`
  (`listNodesInDb`/`getNodeFromDb`/`summarizeProjectFromDb`); тулы `get_project_db` (тяжёлый),
  `db_project_summary`/`db_list_nodes`/`db_get_node` (лёгкие). Цикл «прочитать → изменить →
  записать» закрыт внутри bot-builder MCP без внешнего postgres.
- **Серверный broadcast агентской правки** — `server/canvas/broadcastAgentCanvasUpdate.ts`,
  вызывается из `updateProjectHandler` при `agentEdit:true`.
- **Канвас-WS и комнаты** `canvas_<projectId>` — `server/canvas/initializeCanvasWebSocket.ts`,
  `server/canvas/broadcastCanvasSync.ts`.
- **Единый upgrade-роутер WS** — `server/websocket/registerWebSocketUpgrade.ts`.
- **Клиентская синхронизация** — `client/hooks/use-canvas-sync.ts`,
  интеграция в `client/pages/editor.tsx` (`handleRemoteCanvasSync`, `handleBotDataUpdate`).
- **`CanvasActor` с `kind: 'agent'`** — `shared/canvas-sync/canvas-actor.ts`, бейдж «ИИ-агент».
- **Версионирование/чекпоинты** — [`project-versioning.md`](../../features/project-versioning.md);
  агентские снимки помечаются `author_kind='agent'` (колонка добавлена миграцией `0007`).
- **MCP файловые инструменты** — `lib/bot-tools/project-io.ts`, `tools/mcp-server/index.ts`
  (остаются для файлового сценария параллельно записи в БД).

> ⚠️ **Корректность времени:** пул PostgreSQL переведён в `timezone=UTC`
> (`server/database/db.ts`). Без этого `now()` в колонках `timestamp without time zone`
> писался в локальном поясе сервера и читался приложением как UTC (сдвиг на величину пояса).
> Исторические записи, созданные до фикса, остаются сдвинутыми — нормализация требует
> либо разового `UPDATE - interval`, либо перевода колонок на `timestamptz`.

## Рекомендуемая последовательность

1. ~~**Фаза 0 + Фаза 1**~~ ✅ **Сделано** — работает realtime «ассистент правит → холст обновляется»
   на готовом снапшот-канале и presence.
2. **Фаза 2** (дельты) внедряем вместе с операционной моделью из
   [`realtime-collaboration.md`](../../features/realtime-collaboration.md) — у них общий протокол и арбитраж сервера.
3. **Фаза 3** навешивается поверх как UX-полировка.

## Дальнейшие улучшения тулов билдера (бэклог)

Приоритезировано по практической отдаче (выявлено в ходе реализации 2.1).

### Быстрые победы
- **`db_apply_ops` — батч-операции одним вызовом.** ✅ Готово (`lib/bot-tools/batch-ops.ts`: `applyOpsToProject` + `applyOpsInDb`). Массив операций (add/update/remove/connect/disconnect/move/duplicate node + add/rename/remove/set_active/duplicate sheet) применяется в одной транзакции read→chaining→PUT: один live-broadcast, одна версия, без гонок. Атомарно — прерывание на первой ошибке с `failedIndex`/`failedOp`, без записи. `add_sheet` принимает опц. `id` для адресации новых листов внутри пакета. Проверено на проекте 266: батч duplicate_node+add_sheet+duplicate_sheet атомарно.
- **Раскрытие enum-значений в `get_node_schema`.** ✅ Готово (`lib/bot-tools/enum-introspection.ts`: `extractEnumFields` — рекурсивный обход zod-схемы; `get_node_schema` возвращает поле `enumFields` — карту «путь → допустимые значения» для всех 47 enum-полей data, включая `buttons[].action`, `assignments[].mode`, `branches[].operator`). Убирает цикл «попробовал → отказ → исправил».
- **`db_list_versions` + `db_restore_version`.** ✅ Готово (`lib/bot-tools/version-ops-db.ts`). `db_list_versions` — read-only список истории (id, label, автор, kind, дата). `db_restore_version` — откат через путь А: читает snapshot версии → `updateProjectInDb` (live-broadcast на холст + новый чекпоинт отката; `skipValidation: true`, т.к. исторические снимки могут быть «грязными»). Встроенный undo для правок агента.

### Пробелы возможностей
- **`db_delete_version` + `db_prune_versions`.** ✅ Готово (storage `deleteProjectVersion`/`deleteProjectVersionsBulk`; эндпоинты `DELETE /api/projects/:id/versions/:versionId` и `POST .../versions/prune`; lib `version-ops-db.ts`). Точечное и массовое удаление версий из истории (необратимо). `db_prune_versions` фильтрует по `keep`/`kind`/`author_kind` — напр. убрать все агентские чекпоинты, не трогая человеческие.
- **`db_disconnect_nodes` + `db_list_connections`.** ✅ Готово. `db_list_connections` — read-only граф рёбер from→to (тип auto/button/branch/parallel/input/keyboard + флаг broken, `node-query-db.ts`). `db_disconnect_nodes` — снятие перехода (зеркало connect, `project-mutate.ts`/`node-ops-db.ts`): без branch снимает все рёбра from→to, с branch — только указанную кнопку/ветку.
- **`db_find_nodes(query)`.** ✅ Готово (`node-query-db.ts`: `buildSearchText` + `findNodesInDb`; тул `db_find_nodes` в `tools/mcp-server/index.ts`). Регистронезависимый поиск по подстроке в id/type/messageText/command/description/inputPrompt/variable/label/text/name; опц. фильтры `type` и `sheet_id`. Read-only, возвращает `total` + лёгкие сводки нод.
- **`db_duplicate_node`.** ✅ Готово (`project-mutate.ts`: `duplicateNodeInProject` + `generateDuplicateNodeId`; `node-ops-db.ts`: `duplicateNodeInDb`; тул `db_duplicate_node`). Дубликат одной ноды на том же листе: новый id (`_copy_<ts>_<rand>`), смещение позиции +40/+40, исходящие связи сохраняются (зеркало клиентского одиночного duplicate). Дёшево — без ремаппинга ссылок/branch.
- **`db_duplicate_sheet`.** ✅ Готово. `lib/bot-tools/sheet-node-references.ts` (`updateNodeReferencesInData` — полный ремап графа: 10 простых полей + `.target` в buttons/conditionalMessages/commands/options/branches/parallelBranches + inputConfig.next_node_id). `duplicateSheetInProject` в `sheet-ops.ts`: новые id нод (`_dup_`) + nodeIdMap, новые branch.id (nanoid) + branchIdMap + ремап condSourceId, ремап ссылок, лист «(копия)» без createdAt/updatedAt, активным. `duplicateSheetInDb` (live) + тул `db_duplicate_sheet`. Проверено на проекте 266: 7 связей копии переремаплены на `_dup_`-ноды, broken=0.
- **`db_reorder_sheets`.** ✅ Готово (`sheet-ops.ts`: `reorderSheetsInProject` — валидация строгой перестановки, `activeSheetId` не трогается; `sheet-ops-db.ts`: `reorderSheetsInDb`; тул `db_reorder_sheets`). Смена порядка вкладок листов: `sheet_ids` — полный список id в нужном порядке. Проверено на проекте 266 (перестановка + отклонение неполного списка).
- **`db_move_sheet_to_project`.** ✅ Готово. Перенос/копирование листа МЕЖДУ проектами — «профессиональный» аналог наивной UI-функции «Переместить в другой проект» (та копировала лист `JSON`-клоном БЕЗ контроля коллизий id, двумя неатомарными PUT). Реализация: `clear-external-references.ts` (lib-порт `clearExternalNodeReferences` — обрыв висячих ссылок по набору `validIds`), `sheet-move-ops.ts` (`moveSheetBetweenProjects`: **id нод/веток и связи СОХРАНЯЮТСЯ как есть**, перегенерация `_move_` только при коллизии с целевым проектом — `collectNodeIds`/`collectBranchIds` собирают занятые id, ремап только затронутых ссылок через `updateNodeReferencesInData`; ремап condSourceId; обрыв кросс-листовых ссылок; в режиме `move` лист удаляется из источника + чистка ссылок на унесённые ноды в оставшихся листах), `sheet-move-ops-db.ts` (`moveSheetToProjectInDb`: fetch обоих проектов → **сначала PUT target, при успехе PUT source** — лист не теряется при сбое; `copy` источник не пишет). Тул `db_move_sheet_to_project` (`source_project_id`, `target_project_id`, `sheet_id`, `mode` с дефолтом `copy`, `commit_message`); запрет совпадения source=target и переноса последнего листа.

### Аналитика графа (read-only, бэклог)
Чистые read-тулы поверх графа нод (без серверных правок, без секретов). Обсуждены, приоритизированы по реальной отдаче:
- **`db_find_inbound`** — обратный поиск «кто ссылается НА ноду». Приоритет №1: закрывает реальную дыру — сейчас удаление/перенос ноды делается вслепую, ломая входящие ссылки. Требует полной функции обхода ссылок `collectAllNodeReferences` (текущий `collectNodeTransitions` неполный — нет `commands[].target`, `options[].target`, `conditionalMessages[]`, `next_node_id`, `responseOptions[].target` и др.; эталон полей — `sheet-node-references.ts`).
- **`db_find_orphan_nodes`** — недостижимые ноды (нет пути от триггера / нет входящих рёбер). Дёшево, переиспользует тот же обход + `TRIGGER_TYPES` из `needs-message-defaults.ts` (приватный — вынести в `trigger-types.ts`). Частично перекрыт флагом `broken` в `db_list_connections`.
- **`db_list_commands`** — команды из `command_trigger` (command + description + showInMenu) → список для BotFather. Дёшево, но узко (достижимо и через `db_find_nodes` по типу).
- **`db_list_variables`** — карта переменных бота. ⏸️ Отложено: ~30+ разнородных полей-переменных по типам нод (`variable-fields.ts`), высокий риск шума/неполноты при низкой реальной частоте использования (точечный поиск переменной закрывает `db_find_nodes`).

> План при реализации: общий файл `node-references.ts` (`collectAllNodeReferences`), `node-analysis-db.ts` (db-обёртки по образцу `node-query-db.ts`), регистрация рядом с `db_find_nodes`. Первые три — за один заход (шарят обход графа), переменные — позже под конкретный сценарий.

### Рантайм бота (новый блок — В РАБОТЕ)
**Цель:** замкнуть для агента петлю «собрал → запустил → почитал логи → починил → перезапустил» прямо из MCP, без переключения в UI. Сейчас MCP умеет только редактировать сценарий; управление живым процессом бота не покрыто.

**Серверные эндпоинты уже есть** (`setupBotManagementRoutes.ts`, все под `requireProjectAccess` где есть `:id`/`:projectId`):
- `POST /api/projects/:id/bot/start` — запуск бота проекта (сервер берёт сохранённый `botToken` сам — агенту секрет НЕ нужен).
- `POST /api/projects/:id/bot/stop` — остановка.
- `POST /api/projects/:id/bot/restart` — перезапуск.
- `POST /api/projects/:id/bot/restart-all` — перезапуск всех токенов проекта.
- `GET /api/tokens/:tokenId/bot-status` и `GET /api/bot/tokens/:tokenId/status` — статус.
- `GET /api/projects/:projectId/tokens/:tokenId/logs` — live-логи (stdout/stderr).
- `GET /api/tokens/:tokenId/launch-history`, `GET /api/launch/:launchId/logs`, `GET /api/bot-logs/:logId` — история запусков и логи по id.
- `GET /api/workers/stats` — статистика воркеров.
- `DELETE /api/projects/:projectId/tokens/:tokenId/logs` — очистка логов.

**Предлагаемые MCP-тулы (фазировка: сначала read-only для отладки, потом управление):**
- Read-only: `db_bot_status` (статус по проекту), `db_bot_logs` (последние live-логи — самое ценное для отладки), `db_bot_launch_history`.
- Управление: `db_start_bot` / `db_stop_bot` / `db_restart_bot` (средний риск — трогают живой процесс).

**Открытый вопрос (решить в сборе контекста):** start/stop адресуются по `projectId`, а логи/статус — по `tokenId`. Агент не знает `tokenId` (и не должен видеть `botToken`). Варианты: (а) start-ответ возвращает `tokenId` запущенной инстанции; (б) добавить лёгкий `db_list_bot_tokens(projectId)` — отдаёт `tokenId` + маскированное имя/username, БЕЗ самого токена (через DTO, как с проектами). Безопасность: `botToken` агенту не раскрывается ни в одном туле — сервер оперирует сохранённым токеном сам.

**Контекст собран (2026-06-25).** Ключевые находки: start `tokenId` в ответе НЕ возвращает (вариант «а» не работает без доработки); оба существующих листинга токенов протекают секретом `token` → нужен безопасный DTO + `db_list_bot_tokens` (вариант «б»); запуск асинхронный (worker pool) → тулу start стоит поллить статус после успеха. Формат логов: массив `BotLog[]` (`content`/`type`/`timestamp`), история — `BotLaunchHistory[]`.

**✅ Предусловие безопасности выполнено (IDOR-фикс).** До runtime-тулов закрыт IDOR на token-маршрутах: добавлена проверка `hasProjectAccess` по projectId токена/запуска в `botStatusByTokenHandler`/`getBotTokenStatusHandler`/`botLaunchHistoryHandler`/`botLaunchLogsHandler` (+ ужесточён `botLogByIdHandler`), убрана утечка поля `token` из статус-DTO. Подробности — в `../infrastructure/api-security-ideal-architecture.md` (раздел «Проверка ownership»). Проверено curl + Playwright. Остаток: `GET /api/workers/stats` без проверки владения — отдельная задача.

**Следующий шаг:** ✅ Шаг 1 (дискавери) + Шаг 2 (read-only) **готовы**. Безопасный эндпоинт `GET /api/projects/:id/tokens/list` + DTO `bot-token-list-dto.ts` (whitelist без `token`); lib `bot-runtime-db.ts` (4 функции) + тулы `db_list_bot_tokens`/`db_bot_status`/`db_bot_logs`/`db_bot_launch_history`. Проверено вживую на проекте 266 (token 170): листинг без секрета, статус с userStats без `token`, 5 логов, 10 записей истории. **Осталось — Шаг 3 (control):** `db_start_bot`/`db_stop_bot`/`db_restart_bot` (+ полл `db_bot_status` после старта, т.к. запуск асинхронный). Новый lib-файл `bot-runtime-db.ts` дополнить control-функциями. ⚠️ Известная особенность: серверный статус иногда показывает `stopped` для реально работающего воркера (детектор процесса) — отдельный вопрос, не тулов.

### UX / наблюдаемость
- **Подсветка изменённой ноды (Фаза 2.3).** Поле `changedNodeId` в `canvas-sync` + подсветка/центрирование на холсте.
- **Аудит схемы на `z.date()` ↔ jsonb.** Найти другие даты в jsonb-данных, которые ломаются после round-trip (как было с `updatedAt`).

### Проектный блок (уровень проекта) — персональные токены агента (мультитенант)

**Решение зафиксировано:** профессиональный путь — **персональные токены на каждого пользователя** (Personal Access Token), которые юзер сам генерирует во вкладке «Агент» в UI. Токен резолвится в личность СВОЕГО владельца, поэтому MCP мультитенантный: любой пользователь подключает свой токен и работает только со своими проектами. Это ровно модель Figma (PAT) и n8n (API-ключ), без привязки к одному `ownerId` через env.

> **Целевая модель безопасности:** [`api-security-ideal-architecture.md`](../../infrastructure/api-security-ideal-architecture.md). Токен агента — это новый источник личности в слое 4 (Authentication) того дока (`identifyAgent`), а удаление гостевого пропуска в `requireProjectAccess` закрывает дыру из его таблицы «сейчас vs идеал». Фаза 0.2 = первый практический шаг к этому эталону.

> Отвергнут промежуточный вариант с единым `MCP_SERVICE_TOKEN` + `MCP_SERVICE_OWNER_ID` (один токен = один захардкоженный владелец). Он годится лишь для прототипа одного разработчика; для продукта нужен per-user.

**Почему так.** У Figma и n8n внешний доступ к API всегда несёт личность через токен. У них нет «анонимного гостя»: `list` возвращает проекты владельца токена, `create` создаёт под ним, адресация по `file_key`/id из URL (наш паттерн «операция по id»). Каждый пользователь имеет свой ключ — это и безопасность, и изоляция данных.

**Наша текущая проблема.** MCP ходит анонимно (нет сессии/токена), `ownerId === null`. Операции по id работают лишь потому, что `requireProjectAccess` пропускает гостя. Но `GET /api/projects/list` без личности отдаёт только гостевые проекты, а `POST /api/projects` жёстко возвращает `401`.

**Архитектура (per-user PAT, профессиональный состав):**

> **Стандарты, на которые равняемся:** GitHub/Stripe (API-ключи хранятся sha-256-хешем, не plaintext — для 256-битного случайного токена соль/bcrypt не нужны), RFC 6750 (`Authorization: Bearer`), deny-by-default из `api-security-ideal-architecture.md`.

1. **Таблица токенов** — новая `agent_tokens`: `id`, `ownerId` (FK `telegram_users.id`), `label`, `tokenHash` (sha-256 hex, **уникальный индекс**, сам токен НЕ хранится), `prefix` (первые ~10 символов для отображения), `scopes` (text, по умолчанию `read,write` — **колонку заводим сразу**, чтобы не делать вторую миграцию; разграничение прав включаем позже), `createdAt`, `lastUsedAt`, `expiresAt?`, `revokedAt?`. Сам секрет (`mcp_<base64url(randomBytes32)>`) показывается пользователю ОДИН раз при генерации.
2. **Формат токена и транспорт** — токен вида `mcp_<base64url>`; транспорт — **`Authorization: Bearer <token>`** (RFC 6750, стандарт; не кастомный заголовок). Резолвер также принимает голый токен в этом заголовке.
3. **Серверный resolver-middleware (`identifyAgent`)** — если `req.user` ещё пуст, читает `Authorization: Bearer`, хеширует токен (sha-256), ищет по `tokenHash`; при совпадении (не отозван/не истёк) ставит `req.user` = `TelegramUserDB` владельца и обновляет `lastUsedAt`. Дальше `getOwnerIdFromRequest` отдаёт реального владельца — все хендлеры работают без правок. Встроить в `routes.ts` сразу после `authMiddleware`, до гостевого блока; не перетирать сессию.
4. **Deny-by-default (профессиональный ключевой пункт).** Вместо точечной заплатки одного middleware — глобальный `requireAuth` на весь `/api/` с явным allowlist публичных роутов (`/api/health`, `/api/auth/*`, `/api/webhook/*`, `/api/setup*`, `/api/config`, `import-from-files` и т.п. — собрать реальный список из `routes.ts`). Любой эндпоинт защищён по умолчанию; публичное помечается явно. Это закрывает не одну известную дыру (гостевой доступ по id), а весь класс «забыли повесить auth». Разнести текущий `authMiddleware` на `identifyUser` (обогащает `req.user`) + `requireAuth` (блокирует) — как в эталоне.
5. **MCP-сторона** — общий хелпер `lib/bot-tools/api-fetch.ts` (читает `API_BASE_URL` + `MCP_AGENT_TOKEN` из `process.env`, добавляет `Authorization: Bearer`, если токен задан). Рефактор 3 файлов с fetch (`project-db.ts`, `project-db-read.ts`, `version-ops-db.ts`, 6 вызовов). Токен каждый пользователь кладёт в env своего MCP-процесса; mcp.json в репо не трогаем.
6. **Вкладка «Агент» в UI (0.2b)** — управление своими токенами: список (label, prefix, scopes, создан, last used), «Сгенерировать» (полный токен один раз + копирование + готовый сниппет настройки MCP), «Отозвать».

**Отложено осознанно (не переинженерим первую версию):**
- **Скоупы read/write в рантайме** — колонка `scopes` заводится сразу, но проверку прав (read-токен не может писать) откладываем отдельным заходом (см. «0.2d / Скоупы» ниже). Селектор прав в UI временно скрыт — все токены `read,write`.
- **Чек-сумма в префиксе токена** (как `ghp_` + CRC у GitHub для секрет-сканеров) — nice-to-have, позже.

**Эндпоинты тулов проектного блока (после токен-инфры):**
- `db_list_projects` → `GET /api/projects/list` — проекты владельца токена (`total` + метаданные id/name/nodeCount/sheetsCount/sortOrder, через DTO — без `botToken`). ✅ **Готово** (`lib/bot-tools/project-ops-db.ts` `listProjectsInDb` + тул `db_list_projects` без inputSchema; серверный DTO `5de9ec3d5`). Проверено вживую: 7 проектов с id, без секретов. Единственный db-тул без project_id — закрывает дискавери.
- `db_create_project` → `POST /api/projects`, тело `{ name, data }` (`data` = `scaffoldMinimalProject().project` по умолчанию) → `{ ok, projectId, name }`. ✅ **Готово** (`567d1f9a3`). Создаёт проект с дефолтным сценарием; возвращает только лёгкие поля (без `botToken`). Проверено вживую (проект 267).
- `db_duplicate_project` → `POST /api/projects/:id/duplicate` (новый серверный эндпоинт + хендлер `duplicateProjectHandler.ts`). ✅ **Готово**. Полная копия проекта: `structuredClone(source.data)` со всеми листами и связями, id нод/веток **сохраняются как есть** (отдельное пространство id нового проекта — ремап не нужен, связи идентичны источнику). **Bot token НЕ копируется** (две bot-инстанции не делят токен — копия без токена), ответ — безопасный DTO `toProjectListItem` (без `botToken`/`sessionId`/`data`). `ensureContentTable` + `broadcastProjectsChanged('created')`. lib `duplicateProjectInDb` + тул `db_duplicate_project` (`source_project_id`, опц. `name`; по умолчанию «{имя} (копия)»). **UI**: кнопка `Copy` «Дублировать проект» в карточке проекта (`project-card.tsx`) + хук `use-duplicate-project-mutation.ts`. Проверено вживую: дефолтное/заданное имя, копия id-точная, несуществующий источник → 403.
- `db_rename_project` → `PUT /api/projects/:id` с телом `{ name }` (без `data` — версии не плодятся). ✅ **Готово** (`567d1f9a3`). Возвращает `{ ok, projectId, name }`.
- `db_reorder_projects` → `PUT /api/projects/reorder`, тело `{ projectIds: number[] }`. ✅ **Готово** (`567d1f9a3`).
- `db_export_project` → `POST /api/projects/:id/export`. ✅ **Готово** (`567d1f9a3`). **Сохраняет `bot.py` на диск** (`bots/exported/project_<id>/bot.py` или `save_path`) и возвращает `{ ok, path, bytes, lines, preview }` — НЕ весь код (крупный bot.py раздул бы контекст); полный код по флагу `inline:true`. Заодно **починен серверный `exportProjectHandler`** (неверный путь импорта `bot-generator.ts`). Проверено: 78 КБ / 1576 строк сохранены, превью вернулось.
- `db_delete_project` → `DELETE /api/projects/:id`. **ДЕСТРУКТИВНО, необратимо** — обязательный флаг `confirm: true` (confirm-gate в lib, без `confirm` запрос не уходит). ✅ **Готово** (`567d1f9a3`). Проверено: отказ без confirm, удаление с confirm.

**Фазировка:**
- **0.2a — серверная токен-инфра + deny-by-default + удаление гостей:** ✅ **Готово** (коммит `8dd17ba23`). Таблица `agent_tokens` (+миграция `0008`, sha-256 хеш, uniqueIndex, `scopes`-задел) + крипто-хелпер (`server/utils/agent-token-crypto.ts`) + storage (`createAgentToken`/`getAgentTokensByOwner`/`revokeAgentToken`/`resolveAgentToken`) + resolver `identifyAgent` (`server/middleware/agentTokenMiddleware.ts`, `Authorization: Bearer`) + **глобальный `requireApiAuth`** (deny-by-default с allowlist) + ужесточён `requireProjectAccess` (аноним → 403) + удалены гостевые ветки (`listProjectsHandler`/`getAllProjectsHandler`/guest-middleware/`ensureDefaultProject`). MCP: `lib/bot-tools/api-fetch.ts` (Bearer + `MCP_AGENT_TOKEN`) + рефактор 3 файлов + `dotenv` в точке входа MCP. Проверено вживую: без токена 401, валидный 200, неверный 401, агентские версии теперь под реальным владельцем (`authorId` + `authorKind='agent'`).
- **0.2b — вкладка «Агент» (UI):** ✅ **Готово**. Серверные хендлеры `GET/POST/DELETE /api/agent-tokens` (`server/routes/agentTokens/`, DTO без `tokenHash`/`ownerId`, `setupAgentTokenRoutes`) + `createAgentToken` расширен под `expiresAt`. Клиент: вкладка «Агент» (`client/components/editor/agent/` — панель, таблица, диалоги создания/показа-один-раз/отзыва, сниппет mcp.json) + регистрация в `HeaderTab`/`NAV_ITEMS`/`editor.tsx`. Проверено вживую: список/создание (срок 30/90 дней)/отзыв, отозванный токен → 401, секрет не утекает, вкладка рендерится. Полная спецификация — [`../ui/agent-tab.md`](../ui/agent-tab.md). Enforcement scopes отложен в 0.2c.
- **0.2c — проектный блок тулов:** ✅ **Готово** (`cf6a71275` + `567d1f9a3`). `lib/bot-tools/project-ops-db.ts` (6 функций) + регистрация 6 тулов (`db_list_projects`/`db_create_project`/`db_rename_project`/`db_reorder_projects`/`db_export_project`/`db_delete_project`) + экспорт в барель. create/rename отдают только `{ok,projectId,name}` (без `botToken`); delete с confirm-gate; export сохраняет на диск + сводка. Проверено вживую на проектах 266/267/268.
- **0.2d — live-синхронизация списка проектов:** ✅ **Готово** (`36385ec52` + `709ff5fdb`). Событие `projects-changed` на owner-канал `user_<id>` (переиспользован `shared-terminal-ws`, `projectId=0`); эмит из create/rename/reorder/delete; клиент `ProjectsChangedListener` глобально в `App` инвалидирует `['/api/projects/list']`. Список в шапке/home/сайдбаре обновляется без F5 — в т.ч. от действий MCP-агента. **Коллабораторы покрыты**: `broadcastProjectsChangedToUsers` + `getProjectMemberIds` (владелец + `project_collaborators`) для rename/delete; в delete получатели собираются до каскадного удаления. create/reorder — owner/actor-only. Проверено в браузере (create/rename/delete отражаются live).
- **Скоупы (scopes) — отложено.** Колонка `scopes` хранится (`read,write` по умолчанию), но **enforcement не реализован** (read-токен пока фактически может писать). Селектор прав в UI **временно скрыт** (`fae3cd4e0`) — все токены `read,write`. Включение: пробросить `scopes` в `req` из `identifyAgent` + middleware `requireScope` (write для POST/PUT/PATCH/DELETE) на пишущих роутах, затем вернуть селектор. Тяжёлый кросс-срезный пункт.

#### Удаление гостевых проектов + deny-by-default (security-фикс, часть 0.2a)

**Решение:** концепции «гостевых проектов» больше нет. У каждого проекта есть владелец; неавторизованный запрос (без сессии и без валидного токена агента) отклоняется (401), а не превращается в гостя. Профессиональный способ — **deny-by-default**: глобальный `requireAuth` на `/api/` + allowlist, а не точечная правка одного middleware.

**Почему:** текущий безусловный пропуск гостя в `requireProjectAccess` (`if (ownerId === null) next()`) открывает доступ к ЛЮБОМУ проекту по числовому `id` для анонима (id последовательны, легко перебираются). Это та самая строка из таблицы «сейчас vs идеал» эталонного дока.

**Влияние на данные:** в БД сейчас **0 гостевых проектов** (8 из 8 имеют владельца) — миграция не нужна, ничего не осиротеет.

**Что меняется:**
- `server/telegram/auth-middleware.ts`: разнести на `identifyUser` (обогащает `req.user` из сессии) + `requireAuth` (блокирует с 401). 
- `routes.ts`: порядок `session → identifyUser → identifyAgent → requireAuth('/api' c allowlist) → no-cache`; удалить guest-session middleware.
- `requireProjectAccess` (`server/middleware/requireProjectAccess.ts`): убрать пропуск при `ownerId === null` (после `requireAuth` личность гарантирована; оставить как defense-in-depth — нет личности → 403).
- `listProjectsHandler` **и** `getAllProjectsHandler`: убрать гостевые ветки — только проекты владельца.
- Storage: удалить `getGuestBotProjects`/`getGuestBotProjectsBySession`; поправить зависимость `server/utils/ensureDefaultProject.ts` (зовёт `getGuestBotProjectsBySession`); `getSessionIdFromRequest` становится ненужным.
- `createProjectHandler` уже отдаёт 401 без владельца — оставить.

**⚠️ Порядок (критично):** resolver-токены + deny-by-default + MCP-хелпер с токеном идут ОДНИМ изменением — иначе анонимный MCP (вся текущая оснастка: `update_project_db`, все `db_*`) сломается на 401/403. Для непрерывности тестов токен владельца проекта 266 (`6591857297`) кладётся в env MCP-процесса (`MCP_AGENT_TOKEN`) до/вместе с выкаткой.

**Dev-режим:** `SKIP_AUTH`/`dev-login` создают реального пользователя в сессии — личность есть, авторизованные сценарии в деве не страдают.

**Файлы (весь блок 0.2):** `shared/schema/tables/agent-tokens.ts` (+ реэкспорт в `shared/schema.ts` и `shared/schema/tables/index.ts`), `migrations/0008_create_agent_tokens.sql`, `server/utils/agent-token-crypto.ts` (sha-256 + генерация секрета), storage-методы (create/list/revoke/resolveByToken + удаление guest-методов), `server/middleware/agentTokenMiddleware.ts` (`identifyAgent`), `server/telegram/auth-middleware.ts` (разнести identifyUser/requireAuth), `server/middleware/requireProjectAccess.ts` (ужесточение), `server/routes/routes.ts` (порядок middleware + allowlist + удаление guest-middleware), серверные хендлеры вкладки «Агент» (CRUD токенов, DTO без хеша), `listProjectsHandler`/`getAllProjectsHandler` (убрать guest-ветки), `server/utils/ensureDefaultProject.ts` (правка), клиентская вкладка «Агент», `lib/bot-tools/api-fetch.ts` + рефактор 3 файлов (Bearer), `lib/bot-tools/project-ops-db.ts`, регистрация тулов в `tools/mcp-server/index.ts`, экспорт в `lib/bot-tools/index.ts`, `.env.example` (`MCP_AGENT_TOKEN`). mcp.json в репо не трогаем.

### Архитектурные ставки
- **Дельты + арбитраж (Фазы 2.2 / 2.4).** Точечные `(nodeId, поле, значение)` вместо снапшота + сервер-арбитр — убирает гонки человек+агент и снижает трафик.
- **Персональные токены агента (Фаза 0.2).** ✅ Готово (per-user PAT: sha-256 хеш, `Authorization: Bearer`, deny-by-default с allowlist, удаление гостей, вкладка «Агент», проектный блок тулов, live-sync списка вкл. коллабораторов). Остаётся enforcement scopes (read/write) — отложено. См. раздел «Проектный блок».

## Открытые вопросы

- Где запускается MCP относительно сервера (один хост? сеть?) — влияет на способ
  аутентификации и доступность realtime. Локально MCP читает `API_BASE_URL` (дефолт
  `http://localhost:5000`); для прода и проектного блока — Фаза 0.2 (персональные токены агента, per-user PAT — решено).
- Нужна ли двусторонняя синхронизация диск ↔ БД, или диск только для экспорта.
- Поведение при одновременной ручной и MCP-правке до появления дельта-модели.
