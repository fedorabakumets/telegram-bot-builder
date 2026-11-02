<!--
@fileoverview Контракт аналитики v2, автоматически экспортированный из регистрации.
-->

# db_create_analytics_placement

Создать: размещения. data совпадает с POST API. Все связанные ID проверяются в проекте. Ссылки bc_ постоянны; конфликт маршрута /start возвращает 409. Расход amount строкой, allocation=equal явно распределяет по day..untilDay. exchangeRateRubPerUsd — сохранённый ручной курс RUB за 1 USD.

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
    "data": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "minLength": 1,
          "maxLength": 200
        },
        "tokenId": {
          "type": "integer",
          "exclusiveMinimum": 0
        },
        "sourceId": {
          "$ref": "#/properties/data/properties/tokenId"
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
        "timezone": {
          "type": "string",
          "default": "Europe/Moscow"
        }
      },
      "required": [
        "name",
        "tokenId",
        "sourceId"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "project_id",
    "data"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

## Пример

```json
{
  "tool": "db_create_analytics_placement",
  "arguments": {
    "project_id": 12,
    "data": {
      "name": "Публикация 1 ноября",
      "tokenId": 3,
      "sourceId": 4,
      "startsOn": "2026-11-01",
      "timezone": "Europe/Moscow"
    }
  }
}
```

## Ответ и ошибки

Ответ API сохраняется без пересчёта. Денежные значения — строки; null цены не равен нулю. В отчётах учитывайте as_of/asOf, coverage, complete и reason. Старые сборки ботов дают неполную историю. Код HTTP 400 означает некорректные параметры, 403 — чужой проект/бот, 404 — отсутствующий объект, 409 — конфликт маршрута start, 503 — временную недоступность. Ошибка помечена isError.

Инструмент изменяет указанные рекламные данные проекта; архивирование сохраняет историю.

Связанный процесс: [аналитика и реклама](../workflows/analytics-acquisition.md).
