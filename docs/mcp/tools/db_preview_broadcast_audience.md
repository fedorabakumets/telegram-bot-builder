<!-- @fileoverview Автоматическая карточка реального действия MCP. -->
# `db_preview_broadcast_audience`

Оценивает аудиторию рассылки без отправки сообщений.

Раздел: broadcasts. Транспорт: http, stdio.

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
    "filters": {
      "type": "object",
      "properties": {
        "tags": {
          "type": "array",
          "items": {
            "type": "string",
            "maxLength": 128
          },
          "maxItems": 50
        },
        "registeredFrom": {
          "type": "string"
        },
        "registeredTo": {
          "type": "string"
        },
        "activeFrom": {
          "type": "string"
        },
        "activeTo": {
          "type": "string"
        },
        "userIds": {
          "type": "array",
          "items": {
            "type": "string",
            "maxLength": 64
          },
          "maxItems": 10000
        },
        "groupIds": {
          "type": "array",
          "items": {
            "type": "string",
            "maxLength": 64
          },
          "maxItems": 200
        }
      },
      "additionalProperties": false,
      "default": {}
    },
    "tokenId": {
      "type": "integer",
      "exclusiveMinimum": 0
    },
    "tokenIds": {
      "type": "array",
      "items": {
        "type": "integer",
        "exclusiveMinimum": 0
      },
      "minItems": 1,
      "maxItems": 100
    }
  },
  "required": [
    "project_id"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

## Эффект

```json
{
  "section": "broadcasts",
  "effect": "read",
  "completionMode": "immediate",
  "destructive": false,
  "runtimeApply": "not_applicable"
}
```

## Пример вызова

```json
{
  "action_id": "db_preview_broadcast_audience",
  "args": {
    "project_id": 1,
    "filters": {}
  }
}
```

Структурный пример проверен Zod; ID и данные замените реальными.

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
