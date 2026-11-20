<!-- @fileoverview Автоматическая карточка реального действия MCP. -->
# `db_save_analytics_link_budget`

Сохранить бюджет простой start-метки одной транзакцией. requestId — постоянный UUID одной оплаты: при повторной доставке используйте тот же UUID и тело, сервер вернёт исходный расход; иное тело с тем же UUID даст 409. Квитанции хранятся до удаления проекта. Для новой оплаты создайте новый UUID. Не отправляет сообщения.

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
      "maximum": 9007199254740991
    },
    "data": {
      "type": "object",
      "properties": {
        "tokenId": {
          "type": "integer",
          "exclusiveMinimum": 0,
          "maximum": 9007199254740991
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
        "requestId": {
          "type": "string",
          "format": "uuid",
          "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
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

Безопасный универсальный пример не сгенерирован. Используйте точную схему и данные пользователя; секреты в документацию не подставляются.

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
