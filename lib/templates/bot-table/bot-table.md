# Шаблон `bot-table` — работа с внутренними таблицами конструктора

## Описание

Генерирует Python-обработчики для узлов типа `bot_table`. Поддерживает операции: read, insert, update, upsert, delete с внутренними таблицами конструктора (Bot Tables).

## Параметры

| Параметр | Тип | Описание |
|----------|-----|----------|
| `nodeId` | string | ID узла |
| `tableName` | string | Имя таблицы (поддерживает {переменные}) |
| `operation` | string | Операция: read, insert, update, upsert, delete |
| `where` | array | Условия WHERE: [{column, value, operator}] |
| `updates` | array | Обновления: [{column, op, value}] |
| `row` | object | Данные строки (для insert, upsert) |
| `key` | string | Ключ для upsert |
| `onConflict` | string | Поведение при конфликте: ignore, update, merge |
| `saveResultTo` | string | Переменная для сохранения результата |
| `resultFormat` | string | Формат: first_row, all_rows, scalar, count |
| `returnColumns` | array | Колонки для возврата |
| `orderBy` | string | Сортировка |
| `orderDirection` | string | Направление: asc, desc |
| `limit` | number | Лимит строк |
| `autoTransitionTo` | string | ID следующего узла |

## Операции обновления (op)

| Операция | Описание | SQL |
|----------|----------|-----|
| `set` | Установить значение | `data \|\| jsonb_build_object(col, val)` |
| `increment` | Прибавить | `COALESCE(old, 0) + N` |
| `decrement` | Вычесть | `COALESCE(old, 0) - N` |
| `min` | Минимум | `LEAST(old, N)` |
| `max` | Максимум | `GREATEST(old, N)` |

## Пример входных данных

```json
{
  "nodeId": "tbl-get-profile",
  "tableName": "profiles",
  "operation": "read",
  "where": [{ "column": "telegram_id", "value": "{user_id}" }],
  "saveResultTo": "profile",
  "resultFormat": "first_row",
  "autoTransitionTo": "msg-show-profile"
}
```

## Использование API

```ts
import { generateBotTableHandlers, collectBotTableEntries } from '../bot-table';

// Высокоуровневый API
const code = generateBotTableHandlers(nodes);

// Низкоуровневый API
const entries = collectBotTableEntries(nodes);
```
