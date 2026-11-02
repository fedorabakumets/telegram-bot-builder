<!--
@fileoverview Контракт аналитики v2, автоматически экспортированный из регистрации.
-->

# db_create_analytics_expense

Создать: расходы. data совпадает с POST API. Все связанные ID проверяются в проекте. Ссылки bc_ постоянны; конфликт маршрута /start возвращает 409. Расход amount строкой, allocation=equal явно распределяет по day..untilDay. exchangeRateRubPerUsd — сохранённый ручной курс RUB за 1 USD.

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
        "placementId": {
          "type": "integer",
          "exclusiveMinimum": 0
        },
        "amount": {
          "type": "string",
          "pattern": "^(0|[1-9]\\d{0,17})(\\.\\d{1,2})?$"
        },
        "currency": {
          "type": "string",
          "enum": [
            "RUB",
            "USD"
          ]
        },
        "day": {
          "type": "string",
          "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
        },
        "untilDay": {
          "$ref": "#/properties/data/properties/day"
        },
        "allocation": {
          "type": "string",
          "enum": [
            "single",
            "equal"
          ],
          "default": "single"
        },
        "exchangeRateRubPerUsd": {
          "anyOf": [
            {
              "type": "string",
              "pattern": "^(0|[1-9]\\d{0,11})(\\.\\d{1,8})?$"
            },
            {
              "type": "null"
            }
          ]
        },
        "exchangeRateDate": {
          "anyOf": [
            {
              "$ref": "#/properties/data/properties/day"
            },
            {
              "type": "null"
            }
          ]
        },
        "note": {
          "type": "string",
          "maxLength": 2000,
          "default": ""
        }
      },
      "required": [
        "placementId",
        "amount",
        "currency",
        "day"
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
  "tool": "db_create_analytics_expense",
  "arguments": {
    "project_id": 12,
    "data": {
      "placementId": 6,
      "day": "2026-11-01",
      "amount": "3000.00",
      "currency": "RUB",
      "allocation": "single"
    }
  }
}
```

## Ответ и ошибки

Ответ API сохраняется без пересчёта. Денежные значения — строки; null цены не равен нулю. В отчётах учитывайте as_of/asOf, coverage, complete и reason. Старые сборки ботов дают неполную историю. Код HTTP 400 означает некорректные параметры, 403 — чужой проект/бот, 404 — отсутствующий объект, 409 — конфликт маршрута start, 503 — временную недоступность. Ошибка помечена isError.

Инструмент изменяет указанные рекламные данные проекта; архивирование сохраняет историю.

Связанный процесс: [аналитика и реклама](../workflows/analytics-acquisition.md).
