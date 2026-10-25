# bot_table — работа с внутренними таблицами

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
