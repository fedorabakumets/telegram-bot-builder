<!-- @fileoverview Автоматическая карточка реального действия MCP. -->
# `db_create_analytics_expense`

Создать: расходы. data совпадает с POST API. Все связанные ID проверяются в проекте. Ссылки bc_ постоянны; конфликт маршрута /start возвращает 409. Расход amount строкой, allocation=equal явно распределяет по day..untilDay. exchangeRateRubPerUsd — сохранённый ручной курс RUB за 1 USD.

Раздел: analytics. Транспорт: http, stdio.

## Параметры

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
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
          "exclusiveMinimum": 0,
          "maximum": 9007199254740991
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
          "type": "string",
          "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
        },
        "allocation": {
          "default": "single",
          "type": "string",
          "enum": [
            "single",
            "equal"
          ]
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
              "type": "string",
              "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
            },
            {
              "type": "null"
            }
          ]
        },
        "note": {
          "default": "",
          "type": "string",
          "maxLength": 2000
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
  ]
}
```

## Эффект

```json
{
  "section": "analytics",
  "effect": "write",
  "completionMode": "immediate",
  "destructive": false,
  "runtimeApply": "not_applicable"
}
```

## Пример вызова

```json
{
  "action_id": "db_create_analytics_expense",
  "args": {
    "project_id": 1,
    "data": {
      "placementId": 1,
      "amount": "1",
      "currency": "RUB",
      "day": "2026-01-01",
      "allocation": "single",
      "note": ""
    }
  }
}
```

Структурный пример проверен Zod; ID и данные замените реальными.

## Ответ и ошибки

Прежний text content сохранён. Метаданные `_meta.botcraft` различают prepared/read/saved/pending/partial/unknown/error/unverified. Только `persistence.confirmed=true` подтверждает сохранение. Неизвестный исход требует чтения состояния до повтора; live-доставка и применение ботом проверяются отдельно.

### Схема результата

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "data": {
      "anyOf": [
        {},
        {
          "type": "null"
        }
      ]
    },
    "execution": {
      "type": "object",
      "properties": {
        "section": {
          "type": "string"
        },
        "effect": {
          "type": "string",
          "enum": [
            "read",
            "prepare",
            "write",
            "file",
            "external",
            "unknown"
          ]
        },
        "destructive": {
          "type": "boolean"
        },
        "runtimeApply": {
          "type": "string",
          "enum": [
            "not_applicable",
            "separate"
          ]
        },
        "completionMode": {
          "type": "string",
          "enum": [
            "immediate",
            "job"
          ]
        },
        "pollAction": {
          "type": "string"
        },
        "outcome": {
          "type": "string",
          "enum": [
            "prepared",
            "read",
            "saved",
            "pending",
            "partial",
            "unknown",
            "error",
            "unverified",
            "file_result"
          ]
        },
        "persistence": {
          "type": "object",
          "properties": {
            "confirmed": {
              "type": "boolean"
            },
            "projectId": {
              "type": "integer",
              "exclusiveMinimum": 0,
              "maximum": 9007199254740991
            },
            "revision": {
              "type": "integer",
              "minimum": 0,
              "maximum": 9007199254740991
            }
          },
          "required": [
            "confirmed"
          ],
          "additionalProperties": false
        },
        "sideEffects": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {}
        }
      },
      "required": [
        "section",
        "effect",
        "destructive",
        "runtimeApply",
        "completionMode",
        "outcome",
        "persistence"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "data",
    "execution"
  ],
  "additionalProperties": false
}
```

## Ограничения и безопасность

Изучите describe_actions, проверьте реальные ID и права проекта. Для разрушительных и внешних действий требуется явное намерение пользователя. Для повторов сохраняйте requestId, если он объявлен. Отсутствие ошибки транспорта не доказывает сохранение.
