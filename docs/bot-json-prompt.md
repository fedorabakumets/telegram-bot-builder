# Промт для ИИ: редактирование JSON сценария бота

Ты редактируешь JSON-структуру Telegram-бота. Ниже — полное описание формата.

---

## Верхний уровень (BotDataWithSheets)

```json
{
  "version": 2,
  "activeSheetId": "sheet-id",
  "sheets": [ ...листы... ]
}
```

| Поле | Тип | Описание |
|------|-----|----------|
| `version` | number | Версия формата, всегда `2` |
| `activeSheetId` | string | ID активного листа |
| `sheets` | Sheet[] | Массив листов холста |

---

## Лист (Sheet)

```json
{
  "id": "FnLYhGUixLRUzeobS3May",
  "name": "Старт / Меню",
  "nodes": [ ...узлы... ],
  "viewState": { "pan": { "x": 0, "y": 0 }, "zoom": 100 }
}
```

---

## Узел (Node)

```json
{
  "id": "уникальный-id",
  "type": "тип_узла",
  "position": { "x": 100, "y": 200 },
  "data": { ...данные зависят от типа... }
}
```

Рекомендации по `position`:
- Шаг по X: 300 (между связанными узлами по горизонтали)
- Шаг по Y: 200 (между параллельными ветками)
- ID генерировать через nanoid (21 символ) или осмысленные slug'и

---

## Типы триггеров

| Тип | Когда срабатывает |
|-----|-------------------|
| `command_trigger` | Команда `/start`, `/help` и т.д. |
| `text_trigger` | Текстовое сообщение (точное / содержит) |
| `incoming_message_trigger` | Любое входящее сообщение |
| `incoming_callback_trigger` | Callback от inline-кнопки |
| `callback_trigger` | Конкретный `callback_data` |
| `group_message_trigger` | Сообщение в группе |
| `managed_bot_updated_trigger` | Обновление управляемого бота |
| `schedule_trigger` | Запуск по расписанию (интервал / cron) |

### Поля command_trigger

```json
{
  "type": "command_trigger",
  "data": {
    "command": "/start",
    "description": "Запустить бота",
    "showInMenu": true,
    "autoTransitionTo": "nodeId"
  }
}
```

### Поля text_trigger

```json
{
  "type": "text_trigger",
  "data": {
    "textMatchType": "exact",
    "textSynonyms": ["привет", "хай"],
    "autoTransitionTo": "nodeId"
  }
}
```

`textMatchType`: `"exact"` — точное совпадение, `"contains"` — содержит подстроку.

### Поля callback_trigger

```json
{
  "type": "callback_trigger",
  "data": {
    "callbackData": "approve_",
    "matchType": "startswith",
    "autoTransitionTo": "next_node_id",
    "callbackParseTemplate": "approve_{applicant_id}",
    "callbackSaveVariables": [
      { "templateVar": "applicant_id", "saveAs": "_cb_dynamic_id" }
    ]
  }
}
```

| Поле | Описание |
|------|----------|
| `callbackData` | Паттерн callback_data для перехвата |
| `matchType` | `"exact"` — точное совпадение, `"startswith"` — начинается с |
| `callbackParseTemplate` | Шаблон для извлечения переменных из callback_data |
| `callbackSaveVariables` | Массив `[{templateVar, saveAs}]` — какие переменные извлечь и куда сохранить |
| `autoTransitionTo` | ID следующего узла |
| `adminOnly` | Только для администраторов |

#### Паттерн: кросс-пользовательский сценарий

Когда один пользователь (админ) действует в контексте другого (заявитель), используй `callback_trigger` с `startsWith` + `callbackSaveVariables`:

1. Кнопка: `customCallbackData: "approve_{user_id}"` — вшивает ID заявителя в callback_data
2. `callback_trigger` с `matchType: "startswith"` — ловит callback, извлекает ID в переменную
3. Далее `bot_table` READ по извлечённому ID — загружает данные заявителя
4. Далее `edit_message` / `message` — использует загруженные данные

**Не нужно менять движок** — используй существующие ноды. `callback_trigger` — универсальный перехватчик динамических callback'ов.

### Поля incoming_callback_trigger

```json
{
  "type": "incoming_callback_trigger",
  "data": {
    "callbackData": "work_",
    "matchType": "startsWith",
    "callbackDataStripPrefix": "work_",
    "callbackDataSaveAs": "callback_data",
    "autoTransitionTo": "nodeId",
    "enableAutoTransition": true
  }
}
```

| Поле | Описание |
|------|----------|
| `callbackData` | Паттерн для фильтрации callback_data |
| `matchType` | **ВАЖНО: camelCase!** `"startsWith"` / `"equals"` / `"contains"` |
| `callbackDataStripPrefix` | Префикс для удаления из callback_data перед сохранением (опционально) |
| `callbackDataSaveAs` | Имя переменной куда сохранять callback_data (по умолчанию `"callback_data"`) |

⚠️ **Критично**: `matchType` должен быть в camelCase: `"startsWith"`, НЕ `"startswith"`. При неправильном регистре фильтрация не применяется и middleware перехватывает ВСЕ callback_query.

### Поля schedule_trigger

```json
{
  "type": "schedule_trigger",
  "data": {
    "rules": [
      { "mode": "interval", "intervalMinutes": 5 }
    ],
    "timezone": "Europe/Moscow",
    "autoTransitionTo": "nodeId",
    "runOnStart": false,
    "enabled": true,
    "maxConcurrent": 1
  }
}
```

Режимы расписания (`rules[].mode`):
- `"interval"` — каждые N минут (`intervalMinutes`)
- `"daily"` — ежедневно в указанное время (`hour`, `minute`)
- `"weekly"` — по дням недели (`weekdays: [0-6]`, `hour`, `minute`)
- `"cron"` — cron-выражение (`cronExpression`)

---

## Типы контент-узлов

### message — отправить сообщение

```json
{
  "type": "message",
  "data": {
    "messageText": "Текст сообщения, поддерживает {переменные}",
    "markdown": false,
    "keyboardType": "none",
    "buttons": [],
    "conditionalMessages": [],
    "enableConditionalMessages": false,
    "adminOnly": false,
    "requiresAuth": false,
    "isPrivateOnly": false,
    "enableStatistics": true
  }
}
```

> ⛔ **Запрещено** использовать `collectUserInput`, `inputVariable`, `enableTextInput`, `enablePhotoInput` и другие поля сбора ввода в message-ноде. Для сбора ввода используйте **только** отдельную ноду `input`.

#### Форматирование текста (formatMode)

| Значение | Описание |
|----------|----------|
| `"none"` | Без форматирования (по умолчанию) |
| `"html"` | HTML-разметка (`<b>`, `<i>`, `<code>`, `<a href="">`) |
| `"markdown"` | Markdown (`*bold*`, `_italic_`, `` `code` ``) |

**Важно при `formatMode: "html"`:**
- Символы `<`, `>`, `&` в тексте нужно экранировать: `&lt;`, `&gt;`, `&amp;`
- Нельзя использовать `<` для сравнения (например "реп < 50") — Telegram парсит как тег
- Допустимые теги: `<b>`, `<i>`, `<u>`, `<s>`, `<code>`, `<pre>`, `<a href="...">`, `<tg-spoiler>`
- Символ `•` (bullet) безопасен, но не используйте его рядом с `<` или `>`
- **HTML mention пользователя**: `<a href='tg://user?id={user_id}'>{user.nickname}</a>` — если в тексте используется HTML mention, обязательно ставить `"formatMode": "html"`

### http_request — HTTP запрос

```json
{
  "type": "http_request",
  "data": {
    "httpRequestUrl": "https://api.example.com/data?id={user_id}",
    "httpRequestMethod": "GET",
    "httpRequestHeaders": "{\"Authorization\": \"Bearer {token}\"}",
    "httpRequestBody": "{\"key\": \"{value}\"}",
    "httpRequestTimeout": 30,
    "httpRequestResponseVariable": "response_var",
    "autoTransitionTo": "next_node_id"
  }
}
```

Переменные в URL, заголовках и теле задаются через `{имя_переменной}`.

#### Получение файла (base64)

```json
{
  "type": "http_request",
  "data": {
    "httpRequestUrl": "https://api.example.com/export/project.json",
    "httpRequestMethod": "GET",
    "httpRequestResponseFormat": "file",
    "httpRequestResponseVariable": "export_file",
    "autoTransitionTo": "send-file-node"
  }
}
```

При `httpRequestResponseFormat: "file"` ответ сохраняется как объект:
```json
{
  "type": "file",
  "data": "base64...",
  "mimeType": "application/json",
  "fileName": "project.json"
}
```

Этот объект можно передать в медиа-ноду через `{export_file}` для отправки файла пользователю.

### condition — ветвление

```json
{
  "type": "condition",
  "data": {
    "variable": "имя_переменной",
    "branches": [
      {
        "id": "branch-1",
        "label": "Равно 1",
        "operator": "equals",
        "value": "1",
        "target": "node_id_if_true"
      },
      {
        "id": "branch-else",
        "label": "Иначе",
        "operator": "else",
        "value": "",
        "target": "node_id_else"
      }
    ]
  }
}
```

Операторы: `equals`, `not_equals`, `contains`, `not_contains`, `greater_than`, `less_than`, `is_empty`, `is_not_empty`, `else`

Значения в `value` и `value2` поддерживают переменные: `{user.balance}`, `{item.price}`, `{now_ts}` и т.д.
Переменные раскрываются в рантайме через `replace_variables_in_text`.

### set_variable — установка переменных

Узел для задания, изменения и вычисления переменных без HTTP-запроса.

```json
{
  "type": "set_variable",
  "data": {
    "assignments": [
      { "id": "assign_1", "variable": "score", "value": "0", "mode": "text" }
    ],
    "autoTransitionTo": "next_node_id",
    "enableAutoTransition": true
  }
}
```

#### Режимы присваивания (`mode`)

| mode | Описание | Пример `value` |
|------|----------|----------------|
| `text` | Простая подстановка строки/переменных | `"Привет, {first_name}"` |
| `expression` | Арифметическое выражение (поддерживает +, -, *, /, //, %, **) | `"{balance} - 50"` |
| `random` | Случайное целое число в диапазоне | `value: "500"`, `maxValue: "900"` |
| `random_item` | Случайный элемент из списка (через запятую) | `"🔧,💥,💡,⚡,🔨"` |
| `array_item` | Элемент массива/объекта по индексу или ключу | `value: "{items}"`, `maxValue: "0"` или `"data.user.name"` |
| `timestamp` | Unix timestamp (текущее время + смещение в секундах) | `"90"` (= сейчас + 90 сек) |
| `format_duration` | Форматирование секунд в MM:SS или HH:MM:SS | `"{cd.expires_at} - {now_ts}"` |
| `format_number` | Форматирование числа с разделителями (пробелами) | `"{pilot.credits}"` → "5 000 000" |
| `lookup` | Поиск значения в таблице-переменной | — |
| `str_replace` | Замена подстроки | `"старый_текст"` + `replaceWith: "новый"` |
| `json_push` | Добавить объект в массив-переменную | `"{\"name\": \"{item.name}\"}"` |
| `json_format` | Форматировать массив в строку | шаблон строки |
| `regex_extract` | Извлечение по регулярному выражению | `value: "{source}"`, `pattern: "(\\d+)\\s*руб"`, `regexGroup: "1"` |
| `extract_number` | Извлечение первого числа из строки | `"{bot_response}"` → "7216970" |
| `split_get` | Разделить строку и взять N-й элемент | `value: "{email}"`, `separator: "@"`, `maxValue: "1"` |
| `json_get` | Значение из JSON по пути (dot notation) | `value: "{api_response}"`, `jsonPath: "data.user.name"` |
| `substring` | Подстрока (start, end) | `value: "{id}"`, `startIndex: "0"`, `endIndex: "8"` |
| `conditional` | Тернарный оператор (если/иначе) | `conditionVariable: "{balance}"`, `conditionOperator: "greater_than"`, `conditionValue: "1000"`, `trueValue: "💰"`, `falseValue: "💸"` |
| `lowercase` | В нижний регистр | `"{user_input}"` |
| `uppercase` | В верхний регистр | `"{user_input}"` |
| `trim` | Убрать пробелы по краям | `"{user_input}"` |
| `length` | Длина строки или массива | `"{inventory}"` → "3" |
| `array_concat` | Объединить два массива в один. Поля: `value` (первый массив), `concatWith` (второй массив). Результат: склеенный массив. | `value: "{arr1}"`, `concatWith: "{arr2}"` |

#### Примеры

Случайная зарплата от 500 до 900:
```json
{ "id": "a0", "variable": "salary", "value": "500", "maxValue": "900", "mode": "random" }
```

Случайный эмодзи из списка:
```json
{ "id": "a0", "variable": "target_emoji", "value": "🔧,💥,💡,⚡,🔨,🌋", "mode": "random_item" }
```

Установить кулдаун на 90 секунд вперёд:
```json
{ "id": "a0", "variable": "cooldown_until", "value": "90", "mode": "timestamp" }
```

Текущий Unix timestamp (без смещения):
```json
{ "id": "a0", "variable": "now_ts", "value": "0", "mode": "timestamp" }
```

Форматирование оставшегося времени кулдауна в MM:SS:
```json
{ "id": "a0", "variable": "cd_text", "value": "{cd.expires_at} - {now_ts}", "mode": "format_duration" }
```
Результат: `"01:30"` (если осталось 90 секунд) или `"01:05:30"` (если больше часа).

Начислить 10 к репутации:
```json
{ "id": "a1", "variable": "reputation", "value": "{reputation} + 10", "mode": "expression" }
```

Извлечь число (курс) из текста ответа бота:
```json
{ "id": "a1", "variable": "rate", "value": "{bot_response}", "mode": "regex_extract", "pattern": "(\\d+)\\s*рублей", "regexGroup": "1" }
```

Извлечь ID заказа из строки:
```json
{ "id": "a1", "variable": "order_id", "value": "{text}", "mode": "regex_extract", "pattern": "#(\\d+)", "regexGroup": "1" }
```

> ⚠️ **ВАЖНО для regex_extract:** `value` — это ИСТОЧНИК текста (откуда извлекать), `pattern` — это REGEX паттерн. НЕ путать! Поле `regexSource` НЕ существует — используй только `value` + `pattern`.

Списать 50 🍪:
```json
{ "id": "a2", "variable": "balance", "value": "{balance} - 50", "mode": "expression" }
```

Установить текст:
```json
{ "id": "a3", "variable": "status", "value": "VIP", "mode": "text" }
```

Замена подстроки:
```json
{ "id": "a4", "variable": "bio", "value": "плохое_слово", "mode": "str_replace", "replaceWith": "***" }
```

Элемент массива по индексу:
```json
{ "id": "a0", "variable": "first_item", "value": "{items_list}", "maxValue": "0", "mode": "array_item" }
```

Вложенный доступ через dot-notation:
```json
{ "id": "a0", "variable": "user_name", "value": "{api_response}", "maxValue": "data.users.0.name", "mode": "array_item" }
```

Объединение двух массивов:
```json
{ "id": "a0", "variable": "all_items", "value": "{active_items}", "mode": "array_concat", "concatWith": "{archived_items}" }
```

#### Lookup (поиск в таблице)

```json
{
  "id": "a5",
  "variable": "user_rank",
  "value": "",
  "mode": "lookup",
  "lookupTable": "ranks",
  "lookupField": "title",
  "lookupWhere": [
    { "field": "user_id", "value": "{user_id}" }
  ]
}
```

### psql_query — SQL-запрос к PostgreSQL

```json
{
  "type": "psql_query",
  "data": {
    "query": "SELECT balance FROM users WHERE telegram_id = {user_id}",
    "saveResultTo": "db_result",
    "resultFormat": "first_row",
    "textTemplate": "",
    "enableAutoTransition": true,
    "autoTransitionTo": "next_node_id",
    "connectionSource": "builtin",
    "connectionEnvVar": "",
    "connectionString": ""
  }
}
```

| Поле | Описание |
|------|----------|
| `query` | SQL-запрос (поддерживает `{переменные}`) |
| `saveResultTo` | Имя переменной для результата |
| `resultFormat` | `"first_row"` — первая строка как объект, `"all_rows"` — массив, `"scalar"` — одно значение |
| `connectionSource` | `"builtin"` — встроенная БД, `"env"` — из переменной окружения, `"custom"` — строка подключения |

#### Примеры SQL

Создание таблицы:
```sql
CREATE TABLE IF NOT EXISTS profiles (
  telegram_id BIGINT PRIMARY KEY,
  balance INT DEFAULT 100,
  reputation INT DEFAULT 100,
  bio TEXT DEFAULT ''
)
```

Вставка/обновление:
```sql
INSERT INTO profiles (telegram_id, balance) VALUES ({user_id}, 100)
ON CONFLICT (telegram_id) DO NOTHING
```

Обновление поля:
```sql
UPDATE profiles SET reputation = reputation + 10 WHERE telegram_id = {target_user_id}
```

Выборка:
```sql
SELECT balance, reputation FROM profiles WHERE telegram_id = {user_id}
```

### bot_table — работа с внутренними таблицами

Узел для чтения, записи и обновления данных в таблицах проекта (Bot Tables). Без SQL — через визуальный интерфейс.

#### Операции

| operation | Описание |
|-----------|----------|
| `read` | Получить строку(и) по условию |
| `insert` | Вставить новую строку (таблица создаётся автоматически) |
| `update` | Обновить поля по условию (атомарный increment/decrement) |
| `upsert` | Вставить или обновить если существует |
| `delete` | Удалить строку по условию |
| `count` | Подсчитать количество строк (с опциональным WHERE) |
| `sum` | Сумма значений колонки |
| `max` | Максимальное значение колонки |
| `min` | Минимальное значение колонки |
| `avg` | Среднее значение колонки |
| `distinct` | Уникальные значения колонки (возвращает JSON-массив) |
| `delete_all` | Удалить ВСЕ строки из таблицы |

#### read

```json
{
  "type": "bot_table",
  "data": {
    "tableName": "profiles",
    "operation": "read",
    "where": [
      { "column": "telegram_id", "operator": "equals", "value": "{user_id}" }
    ],
    "saveResultTo": "profile",
    "resultFormat": "first_row",
    "orderBy": "balance",
    "orderDirection": "desc",
    "limit": 10,
    "offset": 0,
    "autoTransitionTo": "next_node",
    "enableAutoTransition": true
  }
}
```

`resultFormat`: `"first_row"` (объект), `"all_rows"` (массив), `"scalar"` (одно значение), `"count"` (количество), `"random_row"` (случайная строка — объект, как first_row но выбирается рандомно из результатов).

Операторы WHERE: `equals` (по умолчанию), `not_equals`, `greater_than`, `less_than`, `contains`, `is_empty`, `is_not_empty`.

После read доступно: `{profile.balance}`, `{profile.reputation}` и т.д.

`offset` применяется перед `limit` — для пагинации: `offset: 10, limit: 5` = строки 11–15.

#### count

```json
{
  "type": "bot_table",
  "data": {
    "tableName": "users",
    "operation": "count",
    "where": [
      { "column": "level", "operator": "greater_than", "value": "10" }
    ],
    "saveResultTo": "high_level_count",
    "autoTransitionTo": "next_node",
    "enableAutoTransition": true
  }
}
```

Результат: `{high_level_count}` = `"42"` (строка с числом). WHERE опционален — без него считает все строки.

#### sum / max / min / avg

```json
{
  "type": "bot_table",
  "data": {
    "tableName": "users",
    "operation": "sum",
    "aggregateColumn": "balance",
    "where": [],
    "saveResultTo": "total_balance",
    "autoTransitionTo": "next_node",
    "enableAutoTransition": true
  }
}
```

`aggregateColumn` — числовая колонка для вычисления. Результат: строка с числом.

#### distinct

```json
{
  "type": "bot_table",
  "data": {
    "tableName": "users",
    "operation": "distinct",
    "aggregateColumn": "profession",
    "saveResultTo": "professions",
    "autoTransitionTo": "next_node",
    "enableAutoTransition": true
  }
}
```

Результат: JSON-массив уникальных значений `["Сварщик", "Программист", "Врач"]`.

#### delete_all

```json
{
  "type": "bot_table",
  "data": {
    "tableName": "logs",
    "operation": "delete_all",
    "saveResultTo": "deleted_count",
    "autoTransitionTo": "next_node",
    "enableAutoTransition": true
  }
}
```

⚠️ Удаляет ВСЕ строки. Результат: количество удалённых строк.

#### update

```json
{
  "type": "bot_table",
  "data": {
    "tableName": "profiles",
    "operation": "update",
    "where": [
      { "column": "telegram_id", "operator": "equals", "value": "{reply_to_user_id}" }
    ],
    "updates": [
      { "column": "reputation", "op": "increment", "value": "10" },
      { "column": "balance", "op": "decrement", "value": "5" }
    ],
    "autoTransitionTo": "next_node",
    "enableAutoTransition": true
  }
}
```

Операции `op`: `set`, `increment`, `decrement`, `min`, `max`. Все атомарные (через SQL).

Обновляет ВСЕ строки подходящие под WHERE (не только первую).

`saveResultTo` (опционально): сохраняет количество обновлённых строк ("0" если ни одна не подошла под WHERE). Полезно для условных update'ов (optimistic locking):

```json
{
  "operation": "update",
  "where": [
    { "column": "telegram_id", "operator": "equals", "value": "{user_id}" },
    { "column": "in_flight", "operator": "is_empty", "value": "" }
  ],
  "updates": [
    { "column": "in_flight", "op": "set", "value": "1" }
  ],
  "saveResultTo": "was_updated"
}
```
Если `was_updated` = "0" — строка не обновилась (условие WHERE не выполнено). Используйте condition после для проверки.

#### insert

```json
{
  "type": "bot_table",
  "data": {
    "tableName": "profiles",
    "operation": "insert",
    "row": {
      "telegram_id": "{user_id}",
      "balance": "100",
      "reputation": "100"
    },
    "returnInsertedId": true,
    "saveResultTo": "profile",
    "autoTransitionTo": "next_node",
    "enableAutoTransition": true
  }
}
```

Если таблица не существует — создаётся автоматически с колонками из `row`.

`returnInsertedId: true` — сохраняет порядковый номер строки в `{profile_id}` (saveResultTo + "_id").

#### upsert

```json
{
  "type": "bot_table",
  "data": {
    "tableName": "profiles",
    "operation": "upsert",
    "key": "telegram_id",
    "row": {
      "telegram_id": "{user_id}",
      "balance": "100",
      "reputation": "100"
    },
    "onConflict": "ignore",
    "returnInsertedId": true,
    "saveResultTo": "profile",
    "autoTransitionTo": "next_node",
    "enableAutoTransition": true
  }
}
```

`onConflict`: `"ignore"` (не трогать), `"update"` (перезаписать), `"merge"` (только пустые поля).

`returnInsertedId` работает только при вставке новой строки (не при обновлении существующей).

#### delete

```json
{
  "type": "bot_table",
  "data": {
    "tableName": "relationships",
    "operation": "delete",
    "where": [
      { "column": "user_a", "operator": "equals", "value": "{user_id}" },
      { "column": "user_b", "operator": "equals", "value": "{target_user_id}" }
    ],
    "autoTransitionTo": "next_node",
    "enableAutoTransition": true
  }
}
```

Удаляет ВСЕ строки подходящие под WHERE. Поддерживает все операторы.

#### Дополнительные поля (read)

```json
{
  "orderBy": "reputation",
  "orderDirection": "desc",
  "limit": 10
}
```

#### Имя таблицы с переменными

`tableName` поддерживает `{переменные}`: `"orders_{chat_id}"`, `"data_{user_id}"`.

### loop — цикл по массиву

```json
{
  "type": "loop",
  "data": {
    "sourceVariable": "users_list",
    "itemVariable": "item",
    "indexVariable": "index",
    "parallel": false,
    "delaySeconds": 0,
    "maxIterations": 0,
    "autoTransitionTo": "body_first_node",
    "afterLoopTo": "after_loop_node",
    "enableAutoTransition": true
  }
}
```

| Поле | Описание |
|------|----------|
| `sourceVariable` | Переменная с массивом для итерации |
| `itemVariable` | Имя переменной текущего элемента (доступ: `{item.field}`) |
| `indexVariable` | Имя переменной индекса (0, 1, 2...) |
| `parallel` | `true` — параллельное выполнение через asyncio.gather |
| `delaySeconds` | Пауза между итерациями |
| `maxIterations` | Лимит итераций (0 = без лимита) |
| `autoTransitionTo` | Первый узел тела цикла |
| `afterLoopTo` | Узел после завершения цикла |

### delay — задержка

```json
{
  "type": "delay",
  "data": {
    "seconds": "90",
    "unit": "seconds",
    "mode": "blocking",
    "autoTransitionTo": "next_node_id",
    "enableAutoTransition": true
  }
}
```

| Поле | Описание |
|------|----------|
| `seconds` | Значение задержки (поддерживает {переменные}) |
| `unit` | Единица: `"seconds"`, `"minutes"`, `"hours"`, `"days"`, `"weeks"` |
| `mode` | `"blocking"` — пауза (ждёт), `"background"` — фоновый таймер (цепочка завершается) |

Режим `blocking`: `await asyncio.sleep(N)` → переход к следующему узлу.
Режим `background`: `asyncio.create_task()` → переход через N времени, текущая цепочка завершается сразу.

Пример: уведомление после кулдауна:
```json
{
  "type": "delay",
  "data": {
    "seconds": "90",
    "unit": "seconds",
    "mode": "background",
    "autoTransitionTo": "msg-cd-notify"
  }
}
```

### input — ожидать ввод пользователя

**Единственный способ сбора ввода.** Message-нода отправляет вопрос, input-нода ожидает и сохраняет ответ.

Типичная цепочка: `message` (вопрос) → `input` (сохранение ответа) → следующий узел.

Для кнопочного ввода: `message` (вопрос) → `keyboard` (кнопки) → `input` (сохранение нажатия).

```json
{
  "type": "input",
  "data": {
    "inputVariable": "user_answer",
    "inputPrompt": "Введите ваш ответ:",
    "inputType": "text",
    "inputTargetNodeId": "next_node_id"
  }
}
```

#### Поля input-ноды

| Поле | Тип | Описание |
|------|-----|----------|
| `inputVariable` | string | Имя переменной для сохранения ответа |
| `inputType` | string | Тип ввода: `text`, `photo`, `video`, `audio`, `document`, `location`, `contact`, `any`, `callback` |
| `inputTargetNodeId` | string | ID следующего узла после получения ответа |
| `inputPrompt` | string | Подсказка (не отправляется пользователю, для UI) |
| `appendVariable` | boolean | `true` — добавить к существующему значению, `false` — заменить |
| `saveToDatabase` | boolean | Сохранять в БД |
| `inputRequired` | boolean | Ввод обязателен |
| `maxLength` | number | Максимальная длина текста (0 = без ограничений) |
| `minLength` | number | Минимальная длина текста (0 = без ограничений) |
| `validationType` | string | Валидация: `none`, `email`, `phone`, `number` |
| `retryMessage` | string | Сообщение при ошибке валидации |

#### inputType: "callback"

Для сохранения нажатия inline-кнопки. Кнопки на keyboard-ноде ведут к input-ноде с `inputType: "callback"` — текст нажатой кнопки сохраняется в переменную.

```json
{
  "type": "input",
  "data": {
    "inputVariable": "user_choice",
    "inputType": "callback",
    "inputTargetNodeId": "next_node_id"
  }
}
```

#### Сохранение метаданных медиа

Для медиа-типов (`photo`, `video`, `audio`, `document`) можно включить сохранение метаданных в отдельные переменные:

```json
{
  "type": "input",
  "data": {
    "inputVariable": "user_video",
    "inputType": "video",
    "saveMediaMetadata": true,
    "mediaMetadataSuffixes": ["thumbnail", "duration", "file_size", "file_name"],
    "mediaMetadataCustomNames": { "duration": "video_len" },
    "autoTransitionTo": "next_node_id"
  }
}
```

- `saveMediaMetadata` — включить сохранение метаданных (по умолчанию `false`)
- `mediaMetadataSuffixes` — массив суффиксов для сохранения (пустой = все)
- `mediaMetadataCustomNames` — кастомные имена переменных (ключ — суффикс, значение — имя)

Доступные суффиксы: `file_id`, `file_unique_id`, `thumbnail`, `duration`, `file_size`, `file_name`, `width`, `height`, `mime_type`, `title`, `performer`, `small_file_id`, `small_width`, `small_height`, `sizes_count`, `all_sizes`

### broadcast — рассылка

```json
{
  "type": "broadcast",
  "data": {
    "messageText": "Текст рассылки",
    "autoTransitionTo": "next_node_id"
  }
}
```

---

## Медиа-узлы

| Тип | Описание |
|-----|----------|
| `photo` | Отправить фото (`imageUrl`) |
| `video` | Отправить видео (`videoUrl`) |
| `audio` | Отправить аудио (`audioUrl`) |
| `document` | Отправить документ (`documentUrl`, `documentName`) |
| `sticker` | Отправить стикер |
| `animation` | Отправить GIF |
| `location` | Отправить геолокацию |
| `contact` | Отправить контакт |

Все медиа-узлы поддерживают `mediaCaption` — подпись.

### Пример photo

```json
{
  "type": "photo",
  "data": {
    "imageUrl": "https://example.com/photo.jpg",
    "mediaCaption": "Подпись к фото",
    "autoTransitionTo": "next_node_id"
  }
}
```

---

## Действия с сообщениями

| Тип | Описание |
|-----|----------|
| `edit_message` | Редактировать сообщение |
| `delete_message` | Удалить сообщение |
| `pin_message` | Закрепить сообщение |
| `unpin_message` | Открепить сообщение |
| `forward_message` | Переслать сообщение |
| `answer_callback_query` | Ответить на callback (всплывающее уведомление) |

#### customCallbackData для edit_message

Кнопки, ведущие к `edit_message`, поддерживают `customCallbackData` с переменными. Это позволяет передать данные (например ID пользователя) через callback:

```json
{
  "id": "btn-approve",
  "text": "✅ Подтвердить",
  "action": "goto",
  "target": "edit-status-node",
  "customCallbackData": "approve_{user_id}"
}
```

При нажатии кнопки динамическая часть (после префикса) сохраняется в переменную `{_cb_dynamic_id}`. Это полезно для кросс-пользовательских сценариев (админ одобряет заявку другого пользователя).

---

### delete_message — Удалить сообщение

Удаляет одно или несколько сообщений в чате. Поддерживает удаление текущего сообщения, последнего сообщения бота, последних N сообщений, по конкретному ID или массиву ID.

```json
{
  "id": "del-1",
  "type": "delete_message",
  "position": { "x": 400, "y": 200 },
  "data": {
    "messageIdSource": "current_message",
    "messageIdManual": "",
    "lastNCount": "",
    "chatIdSource": "current_chat",
    "chatIdManual": "",
    "ignoreErrors": true,
    "bulkDelete": false,
    "bulkMessageIdsVariable": "",
    "enableAutoTransition": true,
    "autoTransitionTo": "next-node-id"
  }
}
```

**Поля data:**

| Поле | Тип | Описание |
|------|-----|----------|
| `messageIdSource` | `"current_message"` / `"last_bot_message"` / `"reply_message"` / `"range_from_reply"` / `"last_n"` / `"custom"` | Какое сообщение удалить |
| `messageIdManual` | string | ID или `{переменная}` — для режима `custom` |
| `lastNCount` | string | Количество — для режима `last_n` (число или `{переменная}`) |
| `chatIdSource` | `"current_chat"` / `"custom"` | В каком чате удалять |
| `chatIdManual` | string | ID чата или `{переменная}` — для режима `custom` |
| `ignoreErrors` | boolean | Не прерывать сценарий если сообщение не найдено |
| `bulkDelete` | boolean | Массовое удаление из переменной-массива |
| `bulkMessageIdsVariable` | string | Имя переменной с JSON-массивом message_id |
| `autoTransitionTo` | string | ID следующего узла |

**Примеры использования:**

Удалить последние 50 сообщений:
```json
{ "messageIdSource": "last_n", "lastNCount": "50" }
```

Удалить по ID из переменной:
```json
{ "messageIdSource": "custom", "messageIdManual": "{saved_msg_id}" }
```

Массовое удаление:
```json
{ "bulkDelete": true, "bulkMessageIdsVariable": "old_message_ids" }
```

**Ограничения Telegram:** бот удаляет чужие сообщения только в группах (нужны права админа). Сообщения старше 48 часов удалить нельзя. В личных чатах — только свои.

---

## Действия с пользователями (группы)

| Тип | Описание |
|-----|----------|
| `ban_user` | Забанить пользователя |
| `unban_user` | Разбанить |
| `mute_user` | Замутить |
| `unmute_user` | Размутить |
| `kick_user` | Исключить пользователя из группы |
| `promote_user` | Назначить администратором |
| `demote_user` | Снять права администратора |
| `admin_rights` | Установить конкретные права |

### kick_user — Исключить пользователя

Исключает пользователя из группы (может вернуться по ссылке). Использует `unbanChatMember(only_if_banned=False)`.

```json
{
  "id": "kick-1",
  "type": "kick_user",
  "position": { "x": 400, "y": 300 },
  "data": {
    "userIdSource": "current_user",
    "userIdManual": "",
    "chatIdSource": "current_chat",
    "chatIdManual": "",
    "ignoreErrors": true,
    "enableAutoTransition": true,
    "autoTransitionTo": "msg-done"
  }
}
```

| Поле | Тип | Описание |
|------|-----|----------|
| `userIdSource` | "current_user" \| "reply_user" \| "custom" | Откуда брать ID пользователя |
| `userIdManual` | string | ID или {переменная} (для режима custom) |
| `chatIdSource` | "current_chat" \| "custom" | Откуда брать ID чата |
| `chatIdManual` | string | ID чата или {переменная} (для режима custom) |
| `ignoreErrors` | boolean | Не прерывать сценарий при ошибке |
| `autoTransitionTo` | string | ID узла для автоперехода |

---

### userbot_message — Сообщение через юзербот (Telethon)

Отправляет сообщение от аккаунта пользователя через Telethon MTProto.

```json
{
  "id": "ub-msg-1",
  "type": "userbot_message",
  "position": { "x": 400, "y": 200 },
  "data": {
    "messageText": "Привет, {user_name}!",
    "formatMode": "html",
    "userbotEntity": "@target_channel",
    "userbotRecipients": ["@channel1", "{chat_id}", "-1001234567890"],
    "attachedMedia": [],
    "disableLinkPreview": false,
    "saveMessageIdTo": "",
    "autoTransitionTo": ""
  }
}
```

| Поле | Тип | Описание |
|------|-----|----------|
| `messageText` | string | Текст сообщения (поддерживает {переменные} и HTML) |
| `formatMode` | "html" \| "markdown" \| "none" | Режим форматирования |
| `userbotEntity` | string | Основной получатель (обратная совместимость) |
| `userbotRecipients` | string[] | Список получателей (@username, ID, {переменная}) |
| `attachedMedia` | string[] | Медиафайлы (/uploads/... или URL) |
| `disableLinkPreview` | boolean | Отключить превью ссылок |
| `saveMessageIdTo` | string | Переменная для сохранения ID сообщения |
| `autoTransitionTo` | string | ID узла для автоперехода |

**Примечания:**
- Кнопки не поддерживаются (ограничение Telegram для user-аккаунтов)
- File_id от Bot API не работает в Telethon — используйте /uploads/ или URL
- Между получателями автоматическая пауза 2 секунды (защита от FloodWait)
- Текст и entity поддерживают горячую перезагрузку через таблицу _content

---

### userbot_click_button — Нажатие кнопки через юзербот

Нажимает inline-кнопку в сообщении через Telethon userbot.

```json
{
  "id": "ub-click-1",
  "type": "userbot_click_button",
  "position": { "x": 400, "y": 200 },
  "data": {
    "userbotEntity": "@target_bot",
    "messageId": "{response_msg_id}",
    "messageIdSource": "last",
    "clickMode": "text",
    "clickValue": "Играть",
    "saveAlertTo": "alert_text",
    "saveResultTo": "new_message_text",
    "saveButtonsTo": "buttons_json",
    "saveHasMediaTo": "has_media",
    "saveMediaTo": "media_obj",
    "autoTransitionTo": ""
  }
}
```

| Поле | Тип | Описание |
|------|-----|----------|
| `userbotEntity` | string | Чат с кнопками (@username, ID, {переменная}) |
| `messageId` | string | ID сообщения ({переменная} или число) |
| `messageIdSource` | "manual" \| "last" | Источник: конкретный ID или последнее сообщение |
| `clickMode` | "text" \| "data" \| "index" | Способ поиска кнопки |
| `clickValue` | string | Текст / callback_data / "row, col" |
| `saveAlertTo` | string | Переменная для alert |
| `saveResultTo` | string | Переменная для текста после нажатия |
| `saveButtonsTo` | string | Переменная для JSON кнопок |
| `saveHasMediaTo` | string | Переменная для флага медиа |
| `saveMediaTo` | string | Переменная для медиа-объекта |
| `autoTransitionTo` | string | ID узла для автоперехода |

---

### userbot_inline_query — Inline-запрос через юзербот

Выполняет inline-запрос (@bot query) и отправляет результат в чат.

```json
{
  "id": "ub-iq-1",
  "type": "userbot_inline_query",
  "position": { "x": 400, "y": 200 },
  "data": {
    "botUsername": "@scdoo_bot",
    "query": "buy_btc 1",
    "targetChat": "",
    "sendToSameChat": true,
    "resultIndex": "0",
    "saveResultTitleTo": "result_title",
    "saveResultDescTo": "result_desc",
    "saveResponseIdTo": "sent_msg_id",
    "autoTransitionTo": ""
  }
}
```

| Поле | Тип | Описание |
|------|-----|----------|
| `botUsername` | string | Username бота (@bot или {переменная}) |
| `query` | string | Текст inline-запроса |
| `targetChat` | string | Целевой чат (если sendToSameChat=false) |
| `sendToSameChat` | boolean | Отправить в чат с ботом (по умолчанию true) |
| `resultIndex` | string | Индекс результата (0 = первый) |
| `saveResultTitleTo` | string | Переменная для title |
| `saveResultDescTo` | string | Переменная для description |
| `saveResponseIdTo` | string | Переменная для ID сообщения |
| `autoTransitionTo` | string | ID узла для автоперехода |

---

## Кнопки (Button)

Кнопки задаются в `data.buttons[]` узла. Тип клавиатуры задаётся в `data.keyboardType`:
- `"none"` — без клавиатуры
- `"reply"` — reply-клавиатура (под полем ввода)
- `"inline"` — inline-кнопки (под сообщением)

Дополнительное поле `"shuffleButtons": true` — перемешивает порядок inline-кнопок при каждом показе (для мини-игр, капч, квизов).

```json
{
  "id": "btn_1",
  "text": "Нажми меня",
  "action": "goto",
  "target": "node_id",
  "buttonType": "normal",
  "style": "primary",
  "hideAfterClick": false,
  "skipDataCollection": false
}
```

### Действия кнопок (action)

| action | Описание | Доп. поля |
|--------|----------|-----------|
| `goto` | Перейти на узел | `target: "nodeId"` |
| `url` | Открыть URL | `url: "https://..."` |
| `web_app` | Открыть Mini App | `webAppUrl: "https://..."` |
| `copy_text` | Скопировать текст | `copyText: "текст"` |
| `command` | Выполнить команду | — |
| `contact` | Запросить контакт | `requestContact: true` |
| `location` | Запросить геолокацию | `requestLocation: true` |
| `selection` | Выбор из списка | — |
| `complete` | Завершить сбор данных | — |
| `request_managed_bot` | Создать управляемого бота | `suggestedBotName`, `suggestedBotUsername` |

### Стили кнопок (style)

| Значение | Цвет |
|----------|------|
| `primary` | Синий |
| `success` | Зелёный |
| `danger` | Красный |

---

## Переменные

Переменные используются в `messageText`, `httpRequestUrl`, `httpRequestBody`, `query` и других полях через синтаксис `{имя_переменной}`.

Вложенные поля из HTTP-ответа: `{response.data.user.name}`

### Inline-выражения {=...}

В любом текстовом поле (messageText, mediaCaption, button text, httpRequestUrl и т.д.) поддерживается синтаксис `{=выражение}` для вычисления формул прямо в тексте:

| Синтаксис | Результат | Описание |
|-----------|-----------|----------|
| `{=credits - price}` | `3800` | Арифметика |
| `{=thousands(credits)}` | `5 000` | Форматирование числа |
| `{=round(score / games, 2)}` | `70.58` | Округление |
| `{=max(hp - damage, 0)}` | `0` | Функции min/max |

Доступные функции: `round`, `abs`, `int`, `float`, `min`, `max`, `str`, `thousands`.

Переменные внутри `{=...}` пишутся **без** фигурных скобок: `{=thousands(user_amount)}`, не `{=thousands({user_amount})}`.

Выражения вычисляются через `_eval_expr` — безопасный вычислитель на основе AST. При ошибке или невалидном выражении текст `{=...}` остаётся без изменений.

### Системные переменные

| Переменная | Описание |
|------------|----------|
| `{user_id}` | Telegram ID пользователя |
| `{username}` | username пользователя |
| `{first_name}` | Имя пользователя |
| `{last_name}` | Фамилия пользователя |
| `{chat_id}` | ID чата |
| `{callback_data}` | Данные нажатой кнопки |
| `{reply_to_user_id}` | ID пользователя из reply-сообщения |
| `{reply_to_username}` | Username из reply-сообщения |
| `{message_id}` | ID текущего сообщения |

### Переменная типа `file`

HTTP-узел с `httpRequestResponseFormat: "file"` сохраняет ответ как объект:

| Поле | Тип | Описание |
|------|-----|----------|
| `type` | `"file"` | Маркер типа переменной |
| `data` | `string` | Содержимое файла в base64 |
| `mimeType` | `string` | MIME-тип файла |
| `fileName` | `string` | Имя файла при отправке |

Используется в медиа-ноде через `{имя_переменной}` — файл отправляется через `BufferedInputFile` без сохранения на диск.

---

## Связи между узлами

Узлы связываются через:
- `data.autoTransitionTo: "nodeId"` — автоматический переход после выполнения
- `data.buttons[].target: "nodeId"` — переход по кнопке
- `data.branches[].target: "nodeId"` — переход по ветке условия
- `data.afterLoopTo: "nodeId"` — переход после завершения цикла

> ⚠️ **Важно:** для нетриггерных нод (message, set_variable, bot_table, delete_message, delay, psql_query, convert_file, http_request и др.) при использовании `autoTransitionTo` **обязательно** добавлять `"enableAutoTransition": true`. Без этого флага связь не отрисуется на канвасе. Триггеры (command_trigger, text_trigger, schedule_trigger и др.) не нуждаются в этом флаге — их связи обрабатываются отдельно.

---

## Пример: сценарий с базой данных и логикой

```json
{
  "version": 2,
  "activeSheetId": "sheet1",
  "sheets": [{
    "id": "sheet1",
    "name": "Профиль",
    "nodes": [
      {
        "id": "cmd-profile",
        "type": "command_trigger",
        "position": { "x": 0, "y": 0 },
        "data": {
          "command": "/profile",
          "description": "Мой профиль",
          "showInMenu": true,
          "autoTransitionTo": "db-get-profile"
        }
      },
      {
        "id": "db-get-profile",
        "type": "psql_query",
        "position": { "x": 300, "y": 0 },
        "data": {
          "query": "INSERT INTO profiles (telegram_id, balance, reputation) VALUES ({user_id}, 100, 100) ON CONFLICT (telegram_id) DO NOTHING; SELECT balance, reputation, bio FROM profiles WHERE telegram_id = {user_id}",
          "saveResultTo": "profile",
          "resultFormat": "first_row",
          "enableAutoTransition": true,
          "autoTransitionTo": "msg-profile",
          "connectionSource": "builtin"
        }
      },
      {
        "id": "msg-profile",
        "type": "message",
        "position": { "x": 600, "y": 0 },
        "data": {
          "messageText": "👤 Профиль {first_name}\n\n💰 Баланс: {profile.balance} 🍪\n⭐ Репутация: {profile.reputation}\n📝 О себе: {profile.bio}",
          "markdown": true,
          "keyboardType": "inline",
          "buttons": [
            { "id": "btn-edit", "text": "✏️ Редактировать", "action": "goto", "target": "edit-menu" }
          ]
        }
      }
    ]
  }]
}
```

## Пример: schedule + loop (ежедневный сброс)

```json
{
  "id": "sched-reset",
  "type": "schedule_trigger",
  "position": { "x": 0, "y": 0 },
  "data": {
    "rules": [{ "mode": "daily", "hour": 0, "minute": 0 }],
    "timezone": "Europe/Moscow",
    "autoTransitionTo": "db-reset-rep",
    "enabled": true
  }
},
{
  "id": "db-reset-rep",
  "type": "psql_query",
  "position": { "x": 300, "y": 0 },
  "data": {
    "query": "UPDATE profiles SET reputation = 50 WHERE reputation < 50",
    "saveResultTo": "",
    "resultFormat": "scalar",
    "connectionSource": "builtin"
  }
}
```

## Пример: text_trigger + set_variable (репутация)

```json
{
  "id": "trig-plus-rep",
  "type": "text_trigger",
  "position": { "x": 0, "y": 400 },
  "data": {
    "textMatchType": "exact",
    "textSynonyms": ["+реп", "плюс реп"],
    "autoTransitionTo": "db-add-rep"
  }
},
{
  "id": "db-add-rep",
  "type": "psql_query",
  "position": { "x": 300, "y": 400 },
  "data": {
    "query": "UPDATE profiles SET reputation = LEAST(reputation + 10, 100) WHERE telegram_id = {reply_to_user_id} RETURNING reputation",
    "saveResultTo": "new_rep",
    "resultFormat": "scalar",
    "enableAutoTransition": true,
    "autoTransitionTo": "msg-rep-done",
    "connectionSource": "builtin"
  }
},
{
  "id": "msg-rep-done",
  "type": "message",
  "position": { "x": 600, "y": 400 },
  "data": {
    "messageText": "✅ Репутация @{reply_to_username} теперь: {new_rep}",
    "keyboardType": "none"
  }
}
```

---

## Пример минимального сценария

```json
{
  "version": 2,
  "activeSheetId": "sheet1",
  "sheets": [{
    "id": "sheet1",
    "name": "Главный",
    "nodes": [
      {
        "id": "cmd-start",
        "type": "command_trigger",
        "position": { "x": 0, "y": 0 },
        "data": {
          "command": "/start",
          "description": "Запустить бота",
          "showInMenu": true,
          "autoTransitionTo": "msg-hello"
        }
      },
      {
        "id": "msg-hello",
        "type": "message",
        "position": { "x": 300, "y": 0 },
        "data": {
          "messageText": "Привет, {first_name}! Выбери действие:",
          "keyboardType": "inline",
          "buttons": [
            { "id": "btn1", "text": "О нас", "action": "goto", "target": "msg-about" },
            { "id": "btn2", "text": "Сайт", "action": "url", "url": "https://example.com" }
          ]
        }
      }
    ]
  }]
}
```

---

## Где смотреть в коде

| Что | Где |
|-----|-----|
| Схема узлов | `shared/schema/tables/node-schema.ts` |
| Схема кнопок | `shared/schema/tables/button-schema.ts` |
| Схема листов | `shared/schema/tables/bot-sheets.ts` |
| Генератор Python | `lib/bot-generator.ts` |
| Шаблоны генерации | `lib/templates/` |
| Примеры JSON | `bots/*/project.json` |
| Типы condition | `shared/types/condition-node.ts` |
| Шаблон set_variable | `lib/templates/set-variable/` |
| Шаблон psql_query | `lib/templates/psql-query/` |
| Шаблон schedule | `lib/templates/schedule-trigger/` |
| Шаблон loop | `lib/templates/loop/` |
| Шаблон bot_table | `lib/templates/bot-table/` |


---

## Архитектура данных

### Уровни хранения

| Уровень | Что хранит | Таблица БД | Фильтрация |
|---------|-----------|------------|------------|
| Платформа | Владельцы ботов, сессии | `telegram_users`, `session` | — |
| Проект | Сценарий, шаблоны, пользовательские таблицы | `bot_projects`, `bot_tables`, `bot_table_rows` | `project_id` |
| Токен (бот) | Пользователи, сообщения, логи, рассылки | `bot_users`, `bot_messages`, `bot_logs` | `project_id` + `token_id` |

### Системные таблицы (read-only, уровень токена)

Виртуальные таблицы, отображающие реальные данные бота в UI:

| Таблица | Источник | API |
|---------|----------|-----|
| Пользователи | `bot_users` | `GET /api/projects/:id/users` |
| Переменные | `bot_users.user_data` (JSONB → колонки) | `GET /api/projects/:id/users/variables` |
| Сообщения | `bot_messages` | `GET /api/projects/:id/messages/all` |
| Группы | `bot_groups` | `GET /api/projects/:id/groups` |
| Логи | `bot_logs` | `GET /api/projects/:id/logs/all` |
| Запуски | `bot_launch_history` | `GET /api/projects/:id/launches/all` |
| Рассылки | `broadcasts` | `GET /api/projects/:id/broadcasts` |
| Токены | `bot_tokens` | `GET /api/projects/:id/tokens` |
| Медиафайлы | `media_files` | `GET /api/media/project/:id` |

### Пользовательские таблицы (read-write, уровень проекта)

Таблицы создаваемые пользователем в конструкторе. Используются нодами `bot_table`.

Хранение: `bot_tables` → `bot_table_columns` → `bot_table_rows` (data: JSONB).

GIN-индекс на `bot_table_rows.data` для быстрого поиска по ключам.

### Переменные пользователей (user_data)

Поле `bot_users.user_data` (JSONB) хранит все пользовательские переменные бота:

```json
{
  "user_age": "25",
  "user_bio": "текст",
  "utm_source": "direct",
  "score": "150"
}
```

Доступ в сценарии: `{user_age}`, `{user_bio}` и т.д.

Служебные ключи (не показываются в UI): `_*`, `waiting_*`, `input_*`.

---

## Правила генерации сценариев

### Структура листов

- Один лист = одна логическая группа (профиль, репутация, магазин, админка)
- Имя листа: эмодзи + название (`"⭐ Репутация"`, `"🛒 Магазин"`)
- Не более 15-20 узлов на лист

### Позиционирование

- Триггеры: `x = 100`, разные `y` (шаг 200)
- Цепочка обработки: `x += 300` для каждого шага
- Параллельные ветки: `y += 200`

### ID узлов

- Осмысленные: `cmd-start`, `tbl-read-profile`, `msg-welcome`, `cond-check-rep`
- Префиксы: `cmd-` (команды), `trig-` (триггеры), `msg-` (сообщения), `tbl-` (bot_table), `cond-` (условия), `set-` (set_variable), `http-` (запросы), `loop-` (циклы)

### Выбор между psql_query и bot_table

| Критерий | psql_query | bot_table |
|----------|-----------|-----------|
| Сложные JOIN | ✅ | ❌ |
| Агрегации (COUNT, SUM) | ✅ | ❌ |
| Простой CRUD | Можно | ✅ Предпочтительно |
| Автосоздание таблицы | ❌ | ✅ |
| Атомарный increment | Через SQL | ✅ Встроено |
| Безопасность (injection) | Нужна осторожность | ✅ Безопасно |

**Рекомендация:** для простых операций (профиль, баланс, репутация) — `bot_table`. Для сложной аналитики и кросс-таблиц — `psql_query`.

### Антипаттерны

- ❌ Не хранить массивы как строку — использовать `json_push` в `set_variable`
- ❌ Не делать SELECT + UPDATE в двух узлах — использовать `bot_table` с `operation: "update"` и `op: "increment"`
- ❌ Не дублировать данные в `user_data` и в пользовательской таблице — выбрать одно место
- ❌ Не использовать `psql_query` для простого чтения одной строки — `bot_table` проще и безопаснее
- ❌ Не создавать таблицу на каждого пользователя (`orders_{user_id}`) — использовать одну таблицу с колонкой `user_id`

### Паттерны

- ✅ Регистрация: `command_trigger(/start)` → `bot_table(upsert, key=telegram_id)` → `message(приветствие)`
- ✅ Профиль: `command_trigger(/profile)` → `bot_table(read)` → `message({profile.field})`
- ✅ Репутация: `text_trigger(+реп)` → `bot_table(read me)` → `condition(rep >= 50)` → `bot_table(update target, increment)` → `message(результат)`
- ✅ Магазин: `message(меню)` → `inline кнопки` → `condition(balance >= price)` → `bot_table(update, decrement balance)` → `message(успех)`
- ✅ Расписание: `schedule_trigger(daily 00:00)` → `psql_query(UPDATE ... WHERE condition)` → `message(отчёт в админ-чат)`


---

## Таблица контента (_content)

### Концепция

Каждый проект автоматически имеет системную таблицу `_content` — единый реестр всего редактируемого контента бота. Тексты сообщений, подписи к медиа, тексты кнопок, URL ссылок — всё синхронизируется с JSON сценария.

Бот читает контент из таблицы через кэш — **горячая перезагрузка без рестарта** (через Redis pub/sub или polling каждые 60 сек).

### Структура таблицы

| Колонка | Описание | Редактируемая |
|---------|----------|:---:|
| key | Уникальный ключ | ❌ |
| type | Тип контента | ❌ |
| sheet | Имя листа | ❌ |
| value | Значение | ✅ |

### Формат ключей

| Источник | type | Формат key |
|----------|------|------------|
| `messageText` | message | `{node_id}` |
| `mediaCaption` | caption | `{node_id}.caption` |
| `buttons[].text` | button | `{node_id}.btn.{btn_id}` |
| `buttons[].url` | url | `{node_id}.btn.{btn_id}.url` |
| `buttons[].webAppUrl` | url | `{node_id}.btn.{btn_id}.webapp` |
| `imageUrl`/`videoUrl`/`audioUrl`/`documentUrl` | media_url | `{node_id}.media` |
| `httpRequestUrl` | api_url | `{node_id}.api` |
| `httpRequestBody` | http_body | `{node_id}.body` |
| `httpRequestHeaders` | http_headers | `{node_id}.headers` |
| `psql_query.query` | sql | `{node_id}.sql` |
| `command_trigger.description` | command | `{node_id}.desc` |
| `inputPrompt` | prompt | `{node_id}.prompt` |

### Keyboard-ноды

Если кнопки хранятся в отдельной keyboard-ноде (поле `keyboardNodeId` в message-ноде), ключи в таблице используют **ID message-ноды**, а не keyboard-ноды. Это обеспечивает совпадение с ключами в сгенерированном коде бота.

### Поведение keyboard-ноды при вызове

Когда пользователь нажимает inline-кнопку с `target` на keyboard-ноду, **кнопки текущего сообщения обновляются** через `editMessageReplyMarkup` — без отправки нового сообщения.

Это позволяет:
- Менять набор кнопок по нажатию (подменю, пагинация)
- Убирать кнопки (пустая keyboard-нода → `reply_markup=None`)
- Обновлять текст кнопок динамически

### Горячая перезагрузка

Поля поддерживающие мгновенное обновление без рестарта бота:
- ✅ `messageText` — текст сообщения
- ✅ `buttons[].text` — текст inline и reply кнопок
- ✅ `buttons[].url` — URL кнопок
- ✅ `mediaCaption` — подпись к медиа (через text=caption)
- ✅ `formatMode` — определяется динамически из HTML-тегов в тексте

Поля требующие перезапуска бота:
- Структура графа (связи, autoTransitionTo)
- Типы нод, callback_data кнопок
- Имена переменных
- Операции bot_table

### Где смотреть в коде

| Что | Где |
|-----|-----|
| Синхронизация JSON → таблица | `server/services/content-table/sync-content-to-table.ts` |
| Синхронизация таблица → JSON | `server/services/content-table/sync-table-to-scenario.ts` |
| Маппинг ключей | `server/services/content-table/content-key-parser.ts` |
| Шаблон Python (get_content) | `lib/templates/content/content.py.jinja2` |
| Документация фичи | `docs/futures/content-table.md` |

---

## ⚠️ Частые ошибки и подводные камни

### 1. set_variable: вложенные переменные (obj.field) в mode expression

При использовании `{obj.field}` в выражениях, переменные хранятся как плоские ключи (`sell_item.quantity`), а не как вложенные объекты. `_eval_expr` теперь корректно ищет сначала полный путь как плоский ключ.

**Работает корректно:**
```json
{
  "type": "set_variable",
  "data": {
    "assignments": [
      { "id": "a1", "variable": "sell_price", "value": "{sell_ore.base_price_earth}", "mode": "text" },
      { "id": "a2", "variable": "sell_income", "value": "{sell_item.quantity} * {sell_price}", "mode": "expression" }
    ]
  }
}
```
Каждый следующий assignment видит результат предыдущего (assignments выполняются последовательно).

### 2. bot_table upsert: ключ должен быть уникальным идентификатором записи

**НЕПРАВИЛЬНО** — `key: "pilot_id"` при составном ключе (pilot_id + ore_id):
```json
{
  "operation": "upsert",
  "key": "pilot_id",
  "row": { "pilot_id": "{user_id}", "ore_id": "iron", "quantity": "1" }
}
```
Результат: если у пилота уже есть ЛЮБАЯ руда, upsert найдёт первую запись по `pilot_id` и перезапишет её (потеря данных).

**ПРАВИЛЬНО** — использовать read + condition + insert/update:
```
read (where: pilot_id + ore_id) → condition (is_empty?) 
  → insert (новая запись)
  → update (increment quantity)
```

### 3. Переменные не сбрасываются между вызовами

Если пользователь нажал кнопку "Продать Железо" → `sell_item.quantity = 5`.
Потом нажал "Продать Уран" → read вернул 0 строк, но `sell_item.quantity` **всё ещё = 5** от предыдущего вызова!

**Решение**: всегда проверять через `is_empty` (если read вернул 0 строк, поля объекта будут пустыми) И через `equals "0"`:
```json
{
  "branches": [
    { "operator": "is_empty", "value": "", "target": "no-item" },
    { "operator": "equals", "value": "0", "target": "no-item" },
    { "operator": "else", "value": "", "target": "has-item" }
  ]
}
```

### 4. bot_table update decrement: может уйти в минус

`decrement` не проверяет что значение >= 0. Если `cargo_used = 0` и вы делаете `decrement 1`, получите `-1`.

**Решение**: всегда ставить condition перед decrement:
```
condition (cargo_used > 0?) → update (decrement) 
```

### 5. Inline кнопки: callback_data = target узла

При `keyboardType: "inline"` и `action: "goto"`, callback_data автоматически равен `target` кнопки. Убедитесь что целевой узел существует на том же листе или доступен глобально.

### 6. bot_table read с all_rows: переменная — массив

После `read` с `resultFormat: "all_rows"` переменная содержит JSON-массив. Для доступа к элементам используйте `loop` или `array_item` в set_variable. Нельзя обращаться как `{list.field}` — это работает только с `first_row`.

### 7. bot_table read с random_row: случайная строка из результата

`resultFormat: "random_row"` — выбирает случайную строку из отфильтрованных результатов и сохраняет как объект (аналогично `first_row`).

**Пример: выбрать случайную руду из трюма игрока:**
```json
{
  "type": "bot_table",
  "data": {
    "tableName": "pilot_cargo",
    "operation": "read",
    "where": [
      { "column": "pilot_id", "operator": "equals", "value": "{user_id}" }
    ],
    "saveResultTo": "stolen",
    "resultFormat": "random_row",
    "autoTransitionTo": "next_node"
  }
}
```
После выполнения доступны: `{stolen.ore_id}`, `{stolen.ore_name}`, `{stolen.ore_emoji}`, `{stolen.quantity}`.

Если результат пуст (0 строк) — переменные не устанавливаются. Используйте condition с `is_empty` для проверки.

### 8. Inline кнопки с condition: проверка после нажатия

Inline кнопка с `action: "goto"` ведёт на target-ноду. Первой нодой в цепочке может быть `condition` — это позволяет проверять условия после нажатия кнопки.

**Пример: кнопка "Откупиться" → проверка баланса:**
```json
{
  "id": "btn-pay",
  "text": "💰 Откупиться ({ransom} кр.)",
  "action": "goto",
  "target": "cond-check-balance"
}
```
```json
{
  "id": "cond-check-balance",
  "type": "condition",
  "data": {
    "variable": "pilot.credits",
    "branches": [
      { "operator": "less_than", "value": "{ransom}", "target": "msg-no-money" },
      { "operator": "else", "value": "", "target": "do-pay" }
    ]
  }
}
```
Это заменяет "скрытие кнопки по условию" — кнопка всегда видна, но при нажатии проверяется условие.

### 9. schedule_trigger: выполняется без контекста пользователя

`schedule_trigger` запускается по расписанию **один раз для всего бота**, а не для каждого пользователя. У него нет `user_id`, `chat_id` или переменных конкретного игрока.

**Что можно:**
- Обновить данные в таблицах (пересчитать цены, сбросить флаги)
- Отправить сообщение в конкретный чат (если ID захардкожен или в переменной бота)
- Через `loop` по таблице пользователей — отправить каждому

**Что нельзя напрямую:**
- Отправить `message` "текущему пользователю" — его нет в контексте schedule
- Использовать `{user_id}`, `{first_name}` — они пустые

**Паттерн: рассылка всем пользователям по расписанию:**
```
schedule_trigger (daily 12:00)
  → bot_table read users (all_rows, saveResultTo: "all_users")
  → loop (sourceVariable: "all_users", itemVariable: "user_item")
    → message (messageSendRecipients: [{type: "chat_id", chatId: "{user_item.telegram_id}"}])
```

**Паттерн: ежедневный бонус (по кнопке, не по расписанию):**
Лучше реализовать через reply-кнопку или команду с проверкой timestamp:
```
trigger → read pilot → set now_ts (timestamp) → condition (last_daily is_empty OR now_ts > last_daily + 86400)
  → update (credits +500, last_daily = now_ts) → msg "Бонус получен!"
  → else → msg "Бонус ещё не готов, осталось: {remaining}"
```

### 10. messageSendRecipients: отправка сообщения другим пользователям

Поле `messageSendRecipients` в message-ноде позволяет отправить сообщение дополнительным получателям (помимо текущего пользователя):

```json
{
  "type": "message",
  "data": {
    "messageText": "Уведомление для вас!",
    "messageSendRecipients": [
      { "id": "r1", "type": "chat_id", "chatId": "{target_user_id}" }
    ]
  }
}
```

Типы: `"user"`, `"chat_id"`, `"admin_ids"`. Поле `chatId` поддерживает переменные.
