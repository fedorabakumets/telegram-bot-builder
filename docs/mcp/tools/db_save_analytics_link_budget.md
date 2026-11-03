<!-- @fileoverview Автоматическая карточка реального действия MCP. -->
# `db_save_analytics_link_budget`

Сохранить бюджет простой start-метки одной транзакцией. requestId — постоянный UUID одной оплаты: при повторной доставке используйте тот же UUID и тело, сервер вернёт исходный расход; иное тело с тем же UUID даст 409. Квитанции хранятся до удаления проекта. Для новой оплаты создайте новый UUID. Не отправляет сообщения.

Раздел: analytics. Транспорт: http, stdio.

## Параметры

```json
{
  "type": "object",
  "properties": {
    "project_id": {
      "type": "integer",
      "exclusiveMinimum": 0,
      "maximum": 9007199254740991
    },
    "data": {
      "type": "object",
      "properties": {
        "tokenId": {
          "type": "integer",
          "exclusiveMinimum": 0
        },
        "marker": {
          "type": "string",
          "pattern": "^[A-Za-z0-9_-]{1,64}$"
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
        "timezone": {
          "type": "string"
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
        "requestId": {
          "type": "string",
          "format": "uuid"
        }
      },
      "required": [
        "tokenId",
        "marker",
        "amount",
        "currency",
        "day",
        "timezone",
        "requestId"
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

Безопасный универсальный пример не сгенерирован. Используйте точную схему и данные пользователя; секреты в документацию не подставляются.

## Ответ и ошибки

Прежний text content сохранён. Метаданные `_meta.botcraft` различают prepared/read/saved/pending/partial/unknown/error/unverified. Только `persistence.confirmed=true` подтверждает сохранение. Неизвестный исход требует чтения состояния до повтора; live-доставка и применение ботом проверяются отдельно.

### Схема результата

```json
{
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
              "exclusiveMinimum": 0
            },
            "revision": {
              "type": "integer",
              "minimum": 0
            }
          },
          "required": [
            "confirmed"
          ],
          "additionalProperties": false
        },
        "sideEffects": {
          "type": "object",
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
    "execution"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

## Ограничения и безопасность

Изучите describe_actions, проверьте реальные ID и права проекта. Для разрушительных и внешних действий требуется явное намерение пользователя. Для повторов сохраняйте requestId, если он объявлен. Отсутствие ошибки транспорта не доказывает сохранение.
