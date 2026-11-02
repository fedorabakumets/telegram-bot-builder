<!--
@fileoverview Контракт аналитики v2, автоматически экспортированный из регистрации.
-->

# db_update_analytics_placement

Исправить или архивировать: размещения. data совпадает с PATCH API; archived=true архивирует, false восстанавливает. Публичная метка и первоначальные связи не меняются; изменения сохраняются в аудите.

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
    "resource_id": {
      "type": "integer",
      "exclusiveMinimum": 0
    },
    "data": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "minLength": 1,
          "maxLength": 200
        },
        "startsOn": {
          "anyOf": [
            {
              "type": "string",
              "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
            },
            {
              "type": "null"
            }
          ]
        },
        "endsOn": {
          "anyOf": [
            {
              "$ref": "#/properties/data/properties/startsOn/anyOf/0"
            },
            {
              "type": "null"
            }
          ]
        },
        "archived": {
          "type": "boolean"
        }
      },
      "additionalProperties": false
    }
  },
  "required": [
    "project_id",
    "resource_id",
    "data"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

## Пример

```json
{
  "tool": "db_update_analytics_placement",
  "arguments": {
    "project_id": 12,
    "resource_id": 8,
    "data": {
      "archived": true
    }
  }
}
```

## Ответ и ошибки

Ответ API сохраняется без пересчёта. Денежные значения — строки; null цены не равен нулю. В отчётах учитывайте as_of/asOf, coverage, complete и reason. Старые сборки ботов дают неполную историю. Код HTTP 400 означает некорректные параметры, 403 — чужой проект/бот, 404 — отсутствующий объект, 409 — конфликт маршрута start, 503 — временную недоступность. Ошибка помечена isError.

Инструмент изменяет указанные рекламные данные проекта; архивирование сохраняет историю.

Связанный процесс: [аналитика и реклама](../workflows/analytics-acquisition.md).
