<!--
@fileoverview Контракт аналитики v2, автоматически экспортированный из регистрации.
-->

# db_get_analytics_history

История изменений источника, размещения, ссылки или расхода: автор, время, beforeData/afterData. Доступ проверяется HTTP API внутри проекта.

## Параметры

Схема публикуется самим MCP и совпадает с авторизованным HTTP API:

```json
{
  "type": "object",
  "properties": {
    "project_id": {
      "type": "integer",
      "exclusiveMinimum": 0,
      "maximum": 9007199254740991,
      "description": "ID проекта с доступом текущего агента."
    },
    "resource": {
      "type": "string",
      "enum": [
        "sources",
        "placements",
        "links",
        "expenses"
      ]
    },
    "resource_id": {
      "type": "integer",
      "exclusiveMinimum": 0
    }
  },
  "required": [
    "project_id",
    "resource",
    "resource_id"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

## Пример

```json
{
  "tool": "db_get_analytics_history",
  "arguments": {
    "project_id": 12,
    "resource": "expenses",
    "resource_id": 8
  }
}
```

## Ответ и ошибки

Ответ API сохраняется без пересчёта. Денежные значения — строки; null цены не равен нулю. В отчётах учитывайте as_of/asOf, coverage, complete и reason. Старые сборки ботов дают неполную историю. Код HTTP 400 означает некорректные параметры, 403 — чужой проект/бот, 404 — отсутствующий объект, 409 — конфликт маршрута start, 503 — временную недоступность. Ошибка помечена isError.

Инструмент только читает данные.

Связанный процесс: [аналитика и реклама](../workflows/analytics-acquisition.md).
