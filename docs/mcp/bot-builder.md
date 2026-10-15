<!-- @fileoverview Руководство по инструментам MCP-конструктора, авторизации и сопровождению ботов. -->

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

## Аналитика карточки «Всего пользователей»

`db_get_users_summary` и `db_get_users_chart` читают аналитику через API запущенного приложения. Оба инструмента доступны через stdio и remote HTTP `/mcp` с обычной Bearer-авторизацией и проверкой доступа к проекту.

| Параметр | Значение |
|---|---|
| `project_id` | Обязательный положительный целочисленный ID проекта |
| `token_id` | Необязательный ID записи токена; без него учитываются все боты проекта |
| `period` | `1h`, `3h`, `24h`, `7d`, `30d`, `12w`, `12m`; по умолчанию `30d` |
| `mode` | Только для графика: `period` или `cumulative` |
| `group_by` | Только для графика: `total` или `source` |

Пример сводки:

```json
{"project_id": 289, "period": "30d"}
```

Сводка содержит `total_users` (всего записей пользователей), `new_users` (прирост в полученных интервалах), `initial_users` (аудитория до этих интервалов), период, шаг и границы ряда. Например, 7 всего и 2 новых дают начальную аудиторию 5.

В готовом периоде к сводке добавляется текущий снимок, не зависящий от окна: `private_users` (писали лично), `group_users` (писали в группе или супергруппе), `channel_users` (писали в канале), `users_in_several_places` (сразу в двух или трёх видах), `blocked_bot_users` (заблокировали бота, `is_blocked`) и `deleted_users` (аккаунт удалён, `is_deleted`). Это люди по сохранённым сообщениям, а не число чатов карточки «Группы». Пояснение лежит в `places_description`. Точный диапазон `from`/`to` этот снимок не включает. График его тоже не возвращает.

Пример накопительного графика одного бота:

```json
{"project_id": 289, "token_id": 18, "period": "30d", "mode": "cumulative", "group_by": "total"}
```

График добавляет `points`: для `total` — `{date, count}`, для `source` — `{date, sources}`. Режим `period` показывает прирост в каждом интервале. Режим `cumulative` для общего ряда учитывает аудиторию до периода (`accumulation_scope: "all_time"`); для источников накапливает только прирост выбранного периода (`"selected_period"`), поскольку API не возвращает исторические остатки по источникам. Пропущенное значение источника сохраняет предыдущий накопленный итог.

**Смысл метрики:** считаются записи `bot_users`, поэтому один человек в нескольких ботах может учитываться несколько раз. Эти значения нельзя называть числом уникальных людей всего проекта. Описание подсчёта возвращается в `metric_description`.

**Периоды и время:** инструменты используют готовые окна существующих `/users/stats`, `/users/growth` и `/users/growth-by-source`; произвольные даты не поддерживаются. `from` и `to` — даты первой и последней возвращённой точки, а при пустом ряде равны `null`. Временные метки и группировка интервалов используют UTC (`timestamp_timezone` и `bucket_timezone`). Для `3h` шаг общего ряда и источников составляет 5 минут. Точные сведения о периоде возвращаются в `range_description`.

Ответы с ошибками имеют форму `{error: "…"}`; тела HTTP-ошибок и секреты не возвращаются.

`db_list_unavailable_users(project_id, token_id, kind?, limit?, offset?)` читает людей этого бота с удалённым аккаунтом или блокировкой. `token_id` обязателен. `kind`: `deleted`, `blocked` или `both` (по умолчанию). Страница до 50 человек, по умолчанию 20; следующая страница начинается с `next_offset`.

Пример:

```json
{"project_id": 12, "token_id": 10, "kind": "deleted", "limit": 20}
```

В каждом человеке: `user_id`, `username`, `first_name`, `last_name`, `is_deleted`, `is_blocked`, `telegram_link` вида `tg://user?id=` и `profile_link` вида `https://t.me/username`. Публичной ссылки нет, если username пустой или не подходит для Telegram. Инструмент не пишет людям и не вызывает Telegram. Это не список диалогов: человек попадает сюда по флагу в базе, даже если личного сообщения не сохранилось.

---

## Аналитика карточки «Активность сообщений»

`db_get_messages_summary` и `db_get_messages_chart` используют API запущенного приложения: `/api/projects/:id/users/stats` и `/api/projects/:id/messages/activity`. Инструменты доступны через stdio и remote HTTP `/mcp`; авторизация и проверка доступа к проекту выполняются действующими маршрутами.

| Параметр | Значение |
|---|---|
| `project_id` | Обязательный положительный целочисленный ID проекта |
| `token_id` | Необязательный положительный ID записи токена; без него учитываются все боты проекта |
| `period` | `1h`, `3h`, `24h`, `7d`, `30d`, `12w`, `12m`; по умолчанию `30d` |
| `mode` | Только для графика: `period` (по умолчанию) или `cumulative` |
| `split` | Только для графика: `total` (по умолчанию) или `direction` |

Пример вызова `db_get_messages_summary`:

```json
{"project_id": 289, "period": "30d"}
```

Сводка возвращает `total_messages` — число **сейчас сохранённых** сообщений, `period_messages` — активность за выбранные интервалы, `incoming_messages` и `outgoing_messages` — направления за тот же период, `total_users` и `average_per_user`. Среднее равно `total_messages / total_users` и при отсутствии пользователей равно нулю. `average_scope: "retained_messages"` и `average_denominator: "current_bot_users"` уточняют его смысл: это среднее сохранённых сообщений на текущую запись пользователя бота, а не среднее за выбранный период. Один человек у нескольких ботов может дать несколько записей пользователей.

Пример вызова `db_get_messages_chart`:

```json
{"project_id": 289, "token_id": 18, "period": "30d", "mode": "cumulative", "split": "direction"}
```

График добавляет `points`: для `total` — `{date, count}`, для `direction` — `{date, incoming, outgoing}`. Общая серия равна сумме направлений. Входящие — сообщения типа `user`, исходящие — остальные типы. В режиме `period` значения относятся к отдельным интервалам; в режиме `cumulative` оба направления накапливаются **от нуля внутри выбранного периода** (`accumulation_scope: "selected_period"`). Нулевой интервал сохраняет предыдущий итог. Это накопление активности периода, а не счётчик сообщений за всё время.

**Хранение данных:** `total_messages` зависит от очистки истории и не является пожизненным счётчиком. Для окон `1h`, `3h`, `24h` активность также читается из сохранённых `bot_messages` (`activity_source: "bot_messages"`). Длинные окна используют дневные агрегаты `message_activity_daily`, которые сохраняются после очистки сообщений; поэтому `period_messages` может быть больше `total_messages`. Отсутствовавшие до начала ведения агрегатов данные не восстанавливаются автоматически. Ограничения возвращаются в `retention_description` и `metric_description`.

**Готовые периоды и время:** `from` и `to` ответа старого режима — начало первого и последнего слотов, при пустом ряде равны `null`. Метки времени и группировка используют UTC (`timestamp_timezone`, `bucket_timezone`); `3h` имеет шаг 5 минут. Длинные окна составляют 7, 30, 84 и 365 дней (`window_days`); `12m` не означает двенадцать календарных месяцев. `granularity`, `step` и `range_description` описывают интервалы ответа. Допускается не более 500 точек. Точные диапазоны описаны отдельно ниже.

Ошибки возвращаются как `{error: "…"}` с признаком MCP `isError`; тела ответов HTTP и подробности сетевых ошибок не раскрываются.

---

## Аналитика карточки «Группы»

`db_get_groups_summary` и `db_get_groups_chart` читают существующие адреса панели `/api/projects/:id/groups/analytics/stats` и `/growth`. Оба инструмента доступны через stdio и remote HTTP `/mcp` с обычной Bearer-авторизацией и проверкой доступа к проекту. `token_id` обязателен: группы разных ботов не смешиваются.

| Параметр | Значение |
|---|---|
| `project_id` | Обязательный положительный целочисленный ID проекта |
| `token_id` | Обязательный ID записи бота |
| `period` | Только для графика: `1h`, `3h`, `24h`, `7d`, `30d`, `12w`, `12m`; по умолчанию `30d` |
| `mode` | Только для графика: `period` или `cumulative` |

Пример сводки:

```json
{"project_id": 289, "token_id": 18}
```

Сводка содержит `total_groups` (группы и супергруппы справочника), `available_groups` (бот в чате) и `kicked_groups` (бота исключили). Каналы и личные чаты не входят. Один чат учитывается один раз. Группа без проверки доступа входит только в общее число. Смысл подсчёта возвращается в `metric_description`.

Пример накопительного графика:

```json
{"project_id": 289, "token_id": 18, "period": "30d", "mode": "cumulative"}
```

График добавляет `points` вида `{date, count}`. В режиме `period` точка — сколько групп панель впервые сохранила в этом слоте. В режиме `cumulative` линия заканчивается на текущем `total_groups` (`accumulation_scope: "all_time"`): группы, сохранённые до окна, стоят в начале ряда. Это дата первого сохранения в панели, а не более раннее вступление, если слежение тогда ещё не работало.

**Периоды и время:** готовые окна те же, что у карточки пользователей. `30d` читает панель с шагом в день, `7d` — семь дней, `12w` — недели, `12m` — месяцы. Произвольные даты не поддерживаются. `from` и `to` — начало первого и последнего слота, при пустом ряде равны `null`. Метки и группировка используют UTC (`timestamp_timezone`, `bucket_timezone`). `granularity`, `step` и `range_description` описывают окно.

Ошибки возвращаются как `{error: "…"}` с признаком MCP `isError`; тела ответов HTTP и секреты бота не раскрываются.

---

## Аналитика карточки «Активные пользователи»

`db_get_active_users_summary` и `db_get_active_users_chart` читают существующий
`GET /api/projects/:id/users/activity` с авторизацией через `apiFetch`.
Оба инструмента доступны через stdio и remote HTTP; доступ проверяется API проекта.

Общие параметры: `project_id`, необязательный `token_id`, `period`:
`1h`, `3h`, `24h`, `7d`, `30d`, `12w`, `12m` (по умолчанию `30d`).
У графика есть `split: "total" | "cohort"`, по умолчанию `total`.

Сводка возвращает `active_users`, `newcomers`, `returning` — уникальные итоги окна
из API. Один `user_id` учитывается один раз за окно, включая режим всех ботов.
Это отличается от общего числа записей пользователей в `db_get_users_summary`.

```json
{"project_id": 289, "period": "30d", "split": "cohort"}
```

График возвращает до 500 точек: `{date, count}` для `total` или
`{date, total, newcomers, returning}` для `cohort`.
Один человек может присутствовать в нескольких слотах: **сумма точек не равна
уникальному итогу окна**. Накопительный режим не предоставляется.
Новички слота впервые появились в том же слоте; позже они могут быть вернувшимися.
Новички окна впервые появились внутри всего окна. При выборе нескольких ботов
сервер проверяет первое появление по записям этих ботов; это не глобальная дата
первого появления человека на платформе.
Без профиля пользователя API использует дату сообщения или создания дневной отметки.

Короткие окна читают сохранённые входящие сообщения `bot_messages` и зависят
от очистки истории. Длинные — отметки `user_activity_daily`, сохраняющиеся после
очистки сообщений. Данные до начала ведения отметок могут отсутствовать.
Метки и группировка используют UTC; `12w` соответствует 84 дням, `12m` — 365 дням
как в текущем интерфейсе. `from/to` — начала первого и последнего слотов, а не
точные границы фильтра. Пустой ряд имеет `from/to: null`.
Ошибки отмечаются `isError`; внутренние тела ошибок API не раскрываются.

---

## Источники трафика

`db_get_traffic_sources_summary(project_id, token_id?, period?, top_limit?)`
возвращает доли источников. `period: "all"` — вся текущая аудитория, стандартные
окна `1h`, `3h`, `24h`, `7d`, `30d`, `12w`, `12m` — регистрации за период.
По умолчанию `30d`. `top_limit` от 1 до 20, по умолчанию 10.
Ответ содержит `sources: [{source, count, percentage}]`, `total_users`,
`source_count`, `other_count`, `other_percentage`. Доли рассчитаны от полной
выборки, а не только от возвращённого топа. Остальные источники учтены отдельно.

`db_get_traffic_sources_chart` принимает те же параметры, но не поддерживает
`all` и накопление. Возвращает до 500 `points: [{date, total, sources, other_count}]`,
где `sources` — массив `{source, count}` для того же топа источников.
Пустые интервалы сохранены. `from/to` — начала первого и последнего слотов UTC,
а не точные границы фильтра. `12w` — 84 дня, `12m` — 365 дней.

Считаются записи `bot_users`: человек у разных ботов может учитываться несколько
раз. Источник — текущий `deep_link_param` либо `direct`, он может меняться;
это не история всех переходов по ссылкам. Режим `all` — снимок сохранившейся
аудитории, а не пожизненный счётчик регистраций. Авторизация через API проекта;
оба инструмента доступны через stdio и remote HTTP.

---

## Топ кнопок и Premium

`db_get_popular_buttons(project_id, token_id?, period?)` возвращает до десяти
`items: [{label, count}]`, `returned_clicks` и длительность окна `window_seconds`.
Периоды: `1h`, `3h`, `24h`, `7d`, `30d`, `12w`, `12m`; по умолчанию `30d`.
Здесь `12w` — 84 дня, `12m` — 365 дней.

Нажатие — сохранённое входящее сообщение с `message_data.button_clicked=true`.
Повторные нажатия считаются отдельно. Метка — непустой `button_text`, иначе
`callback_data`; одинаковые метки объединяются, включая несколько ботов.
`returned_clicks` — сумма **только возвращённого топа**, не всех кнопок.
Удаление сообщений уменьшает статистику. Точные границы окна API не возвращает.

`db_get_users_premium(project_id, token_id?)` возвращает текущий снимок:
`total_users`, `premium_users`, `regular_users`, `items` с долями для кольца.
Период не поддерживается. Считаются записи `bot_users`: один человек у разных
ботов может учитываться повторно. Знаменатель долей — `total_users`, проценты
округляются независимо до целого как в UI, для пустой аудитории равны нулю.
Статус Premium берётся из последнего сохранённого профиля, а не запрашивается
в Telegram при вызове инструмента.

Оба инструмента доступны через stdio и remote HTTP, используют авторизованный
API приложения и отмечают безопасные ошибки признаком `isError`.

---

## Языки аудитории

`db_get_users_languages(project_id, token_id?)` возвращает снимок сохранённых
профилей без фильтра периода: до 20 крупнейших `languages: [{code, count, percentage}]`,
`returned_users`, `returned_language_count`, `limit: 20`, `possibly_truncated`.
Числовые строки PostgreSQL преобразуются в числа. Один человек у разных ботов
может учитываться повторно; записи с `language_code IS NULL` исключены.

Доли относятся ко **всем записям с известным языком**, а не только к возвращённым
строкам. Они сохраняются из API и не пересчитываются относительно топа.
`returned_users` — сумма только возвращённых строк. При 20 языках возможна
обрезка списка, но точный факт обрезки API не сообщает. Число записей без языка
и полный размер аудитории с известным языком этим инструментом не вычисляются.
Доли округлены до десятых и могут не давать ровно 100%.

Инструмент использует авторизованный `/users/traffic`, доступен через stdio
и remote HTTP, ошибки отмечаются `isError` без раскрытия внутренних ответов.

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

`command_trigger`, `text_trigger`, `incoming_message_trigger`, `outgoing_message_trigger`, `message`, `media`, `sticker`, `input`, `edit_message`, `delete_message`, `forward_message`, `callback_trigger`, `incoming_callback_trigger`, `keyboard`, `answer_callback_query`, `group_message_trigger`, `create_forum_topic`, `kick_user`, `schedule_trigger`, `http_request`, `psql_query`, `bot_table`, `convert_file`, `condition`, `set_variable`, `loop`, `delay`, `parallel_split`, `userbot_message`, `userbot_click_button`, `userbot_inline_query`, `userbot_edit_trigger`, `comment`

Стикер создавать можно. Тип `animation` создавать нельзя: GIF — это `media` (файл `.gif` или видео из `sendAsGifUrls`).

### Запрещены для create_node / list_node_types

Legacy и типы вне палитры: `start`, `command`, `photo`, `video`, `audio`, `document`, `animation`, `voice`, `location`, `contact`, user-management кроме `kick_user`, `broadcast`, `client_auth`, `get_managed_bot_token`, `managed_bot_updated_trigger` и др.

**Замены:**

| Вместо | Используй |
|--------|-----------|
| `start`, `command` | `command_trigger` + `message` |
| `photo`, `video`, `animation`… | `media` |

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
| `sheet_id` | Опционально. Для `add_node` — activeSheetId/первый лист; для `update_node`/`remove_node` — автопоиск ноды по всем листам |

`update_node`: shallow merge для `data`. Если нода не найдена — `{ error: "Нода не найдена: …" }` (не silent ok / не пустая версия).

Легаси `buttons[].style: "default"` принимается и нормализуется в «без стиля» — обычный update без `skip_validation`.

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

Ключевые тулы: `get_project_db`, `update_project_db`, `db_project_summary`, `db_list_projects`, `db_create_project`, `db_list_nodes`, `db_find_nodes`, `db_get_node`, `db_find_inbound`, `db_report_button_navigation`, `db_rewrite_button_navigation`, `db_add_node`, `db_update_node`, `db_remove_node`, `db_connect_nodes`, `db_disconnect_nodes`, `db_move_node`, `db_duplicate_node`, `db_auto_layout`, `db_list_sheets`, `db_add_sheet`, `db_rename_sheet`, `db_remove_sheet`, `db_duplicate_sheet`, `db_set_active_sheet`, `db_reorder_sheets`, `db_move_sheet_to_project`, `db_list_versions`, `db_restore_version`, `db_delete_version`, `db_prune_versions`, `db_apply_ops`, …

Подробнее: [[futures/mcp/mcp-live-editing]].

#### Анализ и переключение кнопочной навигации

`db_find_inbound(project_id, node_id)` возвращает все места, которые ссылаются на ноду: кнопки, автопереходы, ветки, переходы ввода и служебные связи. Цель может отсутствовать — это позволяет находить битые входящие ссылки.

`db_report_button_navigation(project_id, sheet_id?)` объясняет эффект каждой кнопки: отправка нового сообщения, редактирование текущего, смена одной клавиатуры, внешнее действие или отсутствующая цель. Reply-клавиатуры помечаются отдельно и не считаются способом редактировать текст текущего сообщения.

`db_rewrite_button_navigation` массово меняет кнопочные переходы:

| Параметр | Описание |
|----------|----------|
| `mode: "edit_current"` | Экраны, открываемые inline-кнопками, переводятся на `edit_message` |
| `mode: "send_new"` | Отменяются только изменения, ранее созданные этим инструментом |
| `confirm` | Без `true` выполняется только чтение и возвращается план; PUT не вызывается |
| `sheet_id` | Необязательное ограничение по листу целевых экранов |
| `commit_message` | Заметка к одной создаваемой версии проекта |

Первый экран после команды остаётся `message`. Если в него также ведёт кнопка «Меню», инструмент создаёт рядом отдельную `edit_message`-копию и перенаправляет на неё только inline-кнопки. С причиной пропускаются reply-клавиатуры, медиа, сбор ввода, условный контент, специальные получатели и легаси-сообщения со встроенными кнопками без отдельной keyboard-ноды. Применение сохраняется одним запросом и одной версией.

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

Для постраничной истории, логов конкретного запуска, поиска и экспорта добавлены `db_list_bot_launches`, `db_get_launch_logs`, `db_search_bot_logs`, `db_export_bot_logs`. Полный контракт и ограничения: [[mcp/bot-logs]].

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

## Пользовательские таблицы

Инструменты `db_list_tables`, `db_find_table_rows`, `db_apply_table_ops` и остальные работают только с таблицами, которые создаёт человек. Системные списки пользователей, сообщений и рассылок сюда не входят.

Чтение и небольшие JSON-изменения доступны и локальному помощнику, и удалённому. Файлы CSV и общий JSON версии 1 читает и пишет только локальный помощник: путь назначает сервер, чужие каталоги и ссылки запрещены. Удаление и замена просят `confirm: true` и без него не обращаются к серверу.

Подробный список: [[mcp/project-tables]]. Описание HTTP: [[api/project-tables]].

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

## График по пользовательской таблице

`db_get_table_chart` и `db_suggest_table_chart` читают пользовательские таблицы проекта, а не статистику людей и сообщений. Оба инструмента доступны через stdio и remote HTTP. Доступ проверяется маршрутами приложения. Изображение не создаётся: возвращаются группы и пояснение.

| Параметр | Значение |
|---|---|
| `project_id` | Обязательный положительный ID проекта |
| `table_id` | Обязательный ID таблицы этого проекта |
| `x_column_id` | Только для графика: столбец групп |
| `y_column_id` | Только для графика: столбец значений |
| `aggregation` | `count`, `sum`, `avg`, `min`, `max`; по умолчанию `count` |
| `limit` | От 1 до 50, по умолчанию 50 |

Пример графика:

```json
{"project_id": 42, "table_id": 1, "x_column_id": 3, "y_column_id": 4, "aggregation": "count"}
```

Ответ содержит `points: [{label, value}]`, названия таблицы и столбцов, `row_count`, `group_count`, `truncated` и `warnings`. Пустая категория подписывается «—». Сумма, среднее, минимум и максимум учитывают только ячейки, которые начинаются с конечного числа; если чисел нет, итог группы равен нулю. Для нечислового столбца сервер считает количество строк. Среднее делится на число распознанных значений, а не на все строки группы.

`db_suggest_table_chart` принимает `project_id` и `table_id`. Он предлагает столбец групп, столбец значения, способ подсчёта и вид рисунка: `bar`, `line` или `pie`. Вид рисунка — только подсказка, он не меняет числа. Если значения категории почти уникальны или очень длинные, `reason` объясняет, почему такой график трудно читать.

Чужая таблица и чужой столбец не раскрываются. Ошибки имеют вид `{error: "…"}` и признак `isError`; тела HTTP-ответов не возвращаются.

---

## Структура кода (для разработчиков)

| Путь | Назначение |
|------|------------|
| `tools/mcp-server/index.ts` | Регистрация MCP-тулов |
| `lib/bot-tools/` | Реализация инструментов |
| `lib/bot-tools/table-chart-db.ts` | График пользовательской таблицы |
| `lib/bot-tools/mcp-register-table-tools.ts` | Пользовательские таблицы |
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
<!-- Описание списка диалогов и сохранённых проверок доступа. -->

## Чтение диалогов выбранного бота

### Проверка доступа `db_check_chat_access`

Инструмент выполняет реальную проверку Telegram для лички, группы или канала.
Обязательны `project_id`, `token_id`, `chat_id` и `chat_type` (`group`,
`supergroup`, `channel` или `private`). Явно выбранный токен должен принадлежать
проекту и не заменяется дефолтным.

При успехе инструмент сохраняет `available`, обновляет название и аватар чата и
возвращает их вместе с `access_checked_at`. Явный ответ Telegram об исключении
сохраняется как `kicked`, остальные сбои — как `error`; прежние название и аватар
при ошибке остаются без изменений. Токен и сырой ответ Telegram не возвращаются.
Для лички используется `sendChatAction` без отправки сообщения: пользователь может
на несколько секунд увидеть индикатор «печатает». Блокировка возвращается как
`access_status: "kicked"` вместе с `blocked: true`; поле `bot_users.is_blocked`
синхронизируется. Для групп и каналов поле `blocked` равно null.

```json
{"project_id": 12, "token_id": 9, "chat_id": "-1004465403276", "chat_type": "supergroup"}
```

### Массовая проверка `db_start_chat_access_check`

Запускает сверку людей одного бота: у кого есть личное сообщение или нет
сообщений вовсе. Кто писал только в группе или канале, не входит. Обязательны
`project_id` и `token_id`. Сами группы и каналы проверяет `db_check_chat_access`.

Инструмент сразу возвращает карточку задачи и не ждёт окончания очереди. Пока
проверка идёт, повторный запуск отвечает ошибкой «Проверка уже выполняется».
Отмена через MCP недоступна. На несколько секунд у человека может появиться
статус «печатает…»; сообщений бот не отправляет. Токен и сырые ответы Telegram
не возвращаются.

Если таких людей нет, задача сразу приходит со `status: "completed"`
и нулевыми счётчиками.

```json
{"project_id": 12, "token_id": 9}
```

Ответ: `ok`, `project_id`, `token_id` и `job` с полями `job_id`, `status`
(`pending`, `running`, `cancelling`, `cancelled`, `completed`, `failed`),
`total_count`, `processed_count`, `available_count`, `kicked_count`,
`deleted_count`, `error_count`, `started_at`, `finished_at`.

### Статус проверки `db_get_chat_access_check`

Читает активную или последнюю задачу того же бота. Те же `project_id` и
`token_id`. Telegram не вызывается.

После старта опрашивайте этот инструмент, пока `job.status` равен `pending`,
`running` или `cancelling`. Если проверок ещё не было, `job` равен `null`.

```json
{"project_id": 12, "token_id": 9}
```

### Чтение истории `db_get_dialog_messages`

После `db_list_dialogs` передайте `project_id`, `token_id`, `chat_id` и `chat_type`
в `db_get_dialog_messages`. Инструмент доступен через stdio и HTTP MCP и использует
авторизованный `GET /api/projects/:projectId/dialogs/:chatId/messages`.

Пример: `{"project_id":9,"token_id":5,"chat_id":"1612141295","chat_type":"private","limit":50}`.
`limit` — 1–100, по умолчанию 10. Первая страница содержит последние сообщения;
внутри каждой страницы они идут от старых к новым. `next_cursor` следующего запроса
ведёт к более старым сообщениям, а не к новым. Меняя проект, бота, чат, тип или
`include_group_context`, сбросьте курсор. Размер страницы можно менять.

`include_group_context` по умолчанию false. Для private значение true добавляет
входящие сообщения именно этого человека в группах того же бота, сохраняя
`chat_id`, `chat_type`, `source_chat_title`; групповые ответы бота исключены.
Для групп и каналов параметр true недопустим. Их история выбирается по ID чата.

Ответ содержит `ok`, область запроса, `messages`, `has_more`, `next_cursor`.
Сообщение содержит `id`, `user_id`, исходные `chat_id`/`chat_type`, `source_chat_title`,
`message_type`, `direction`, полный `message_text`, `telegram_message_id`, `created_at`
в UTC (либо null), `media` и `telegram_media`. Вложения — сохранённые идентификаторы
и метаданные без внутренних путей, токенов и сетевых URL. Произвольные `message_data`
не возвращаются. Текст сообщений возвращается как сохранён; инструмент его не исполняет.
Пустая история допустима. Полнота зависит от срока хранения; удалённые записи не
восстанавливаются. Инструмент не обращается к Telegram и ничего не отправляет.

### Список `db_list_dialogs`

`db_list_dialogs` доступен через stdio и HTTP MCP и читает авторизованный
`GET /api/projects/:projectId/dialogs`. Обязательны `project_id` и `token_id`.
Чужой токен не заменяется дефолтным. Токены Telegram не возвращаются.

Пример: `{"project_id":12,"token_id":9,"kind":"groups","limit":20}`.
`kind`: `all` (по умолчанию), `users`, `groups`, `channels`.
`search` ищет по сохранённому имени, названию, username и ID, без учёта регистра.
`limit`: 1–100, по умолчанию 10 последних диалогов; `cursor` берётся из `next_cursor` ответа.
При смене фильтров курсор необходимо сбросить. Выдача сортируется по последней
активности; изменение истории между страницами не обеспечивает снимок данных.

Ответ: `ok`, `project_id`, `token_id`, `dialogs`, `has_more`, `next_cursor`.
Диалог: `chat_id` (строка), `chat_type`, `title`, `display_name`, `username`,
`last_activity_at`, `last_message` (preview до 200 символов, direction, created_at),
`retained_message_count`, `access_status`, `access_checked_at`. Даты — UTC.
Неизвестное название и последнее сообщение — null; вместо названия показывается ID.
Счётчик зависит от срока хранения сообщений, список ограничен известными панели чатами.
Личные карточки включают только пользователей с сохранёнными личными сообщениями
выбранного бота. Участники, писавшие только в группах, не возвращаются как личные
диалоги. Превью и порядок личных карточек определяются только личной историей.

`access_status`: `unknown` (нет проверки), `available` (доступ подтверждён),
`kicked` (Telegram сообщил об исключении), `error` (прочая ошибка проверки).
Личные чаты без проверки имеют `unknown`; после проверки возвращают сохранённый
статус так же, как группы и каналы. Чтение списка не вызывает Telegram. Статус и
время сохраняются для точной пары проект/бот и чата. В интерфейсе метка находится
внутри карточки, а ручная кнопка «Проверить доступ» — в шапке диалога.
При ошибке прежнее название и история сохраняются. Проверенные группы не
проверяются автоматически повторно. После ручной проверки список и шапка обновляются вместе.

### Поиск текста `db_search_dialog_messages`

Инструмент ищет буквальную подстроку без учёта регистра в сохранённых сообщениях
выбранного бота, не вызывая Telegram. Обязательны `project_id`, `token_id` и
`query` (после удаления пробелов по краям от 1 до 200 символов).
`%`, `_` и обратная косая черта совпадают буквально, регулярные выражения не используются.

Без дополнительных фильтров поиск охватывает лички, группы и каналы. `chat_type`
(`private`, `group`, `supergroup`, `channel`) можно использовать отдельно. При
указании `chat_id` обязательно указать `chat_type`; личный поиск не включает
групповые сообщения пользователя. Параметра `include_group_context` нет.

По умолчанию `limit=10`, явно допустимы 1–100 результатов. Порядок всегда от новых
к старым. `has_more` и `next_cursor` позволяют запросить следующую страницу с теми
же проектом, ботом, запросом и фильтрами; менять размер страницы допустимо.
Ответ содержит `ok`, `project_id`, `token_id`, нормализованный `query`, nullable
`chat_id`/`chat_type`, `messages`, `has_more`, `next_cursor`. Формат сообщений
совпадает с `db_get_dialog_messages`: полный текст, исходный чат и безопасные
метаданные медиа. Поиск ограничен сроком хранения истории, не ищет внутри
вложений и не создаёт снимок данных при поступлении новых сообщений.

```json
{"project_id": 9, "token_id": 5, "query": "оплата", "limit": 10}
```

HTTP API: `GET /api/projects/:projectId/dialogs/messages/search` с параметрами
`tokenId`, `query`, необязательными `chatId`, `chatType`, `limit`, `cursor`.
Авторизация проекта и принадлежность токена обязательны, запасной бот не выбирается.
HTTP и stdio MCP используют общую регистрацию; ошибка помечается `isError` без
раскрытия Telegram-токенов и внутренних сетевых ответов.
