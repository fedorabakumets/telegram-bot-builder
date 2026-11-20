<!-- @fileoverview Автоматическая карточка реального действия MCP. -->
# `db_start_broadcast`

СОЗДАЁТ И СРАЗУ ЗАПУСКАЕТ реальную рассылку. tokenIds создаёт кампанию по выбранным ботам. Это не черновик. requestId обязателен: повтор той же заявки не запускает новую очередь; новый ID означает новую рассылку.

Раздел: broadcasts. Транспорт: http, stdio.

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
    "requestId": {
      "type": "string",
      "format": "uuid",
      "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
    },
    "name": {
      "default": "",
      "type": "string",
      "maxLength": 200
    },
    "messageText": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4096
    },
    "mediaUrls": {
      "default": [],
      "maxItems": 10,
      "type": "array",
      "items": {
        "type": "string",
        "maxLength": 16384
      }
    },
    "buttons": {
      "maxItems": 100,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "text": {
            "type": "string"
          },
          "action": {
            "default": "goto",
            "type": "string",
            "enum": [
              "goto",
              "command",
              "url",
              "contact",
              "location",
              "selection",
              "complete",
              "default",
              "copy_text",
              "web_app",
              "request_managed_bot",
              "pay"
            ]
          },
          "copyText": {
            "type": "string"
          },
          "webAppUrl": {
            "type": "string"
          },
          "target": {
            "type": "string"
          },
          "url": {
            "type": "string"
          },
          "requestContact": {
            "type": "boolean"
          },
          "requestLocation": {
            "type": "boolean"
          },
          "buttonType": {
            "default": "normal",
            "type": "string",
            "enum": [
              "normal",
              "option",
              "complete"
            ]
          },
          "skipDataCollection": {
            "default": false,
            "type": "boolean"
          },
          "hideAfterClick": {
            "default": false,
            "type": "boolean"
          },
          "customCallbackData": {
            "type": "string"
          },
          "style": {
            "type": "string",
            "enum": [
              "primary",
              "success",
              "danger"
            ]
          },
          "suggestedBotName": {
            "type": "string"
          },
          "suggestedBotUsername": {
            "type": "string"
          },
          "selectionGroup": {
            "type": "string"
          }
        },
        "required": [
          "id",
          "text"
        ]
      }
    },
    "buttonsPerRow": {
      "default": 0,
      "type": "integer",
      "minimum": 0,
      "maximum": 8
    },
    "filters": {
      "default": {},
      "type": "object",
      "properties": {
        "tags": {
          "maxItems": 50,
          "type": "array",
          "items": {
            "type": "string",
            "maxLength": 128
          }
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
          "maxItems": 10000,
          "type": "array",
          "items": {
            "type": "string",
            "maxLength": 64
          }
        },
        "groupIds": {
          "maxItems": 200,
          "type": "array",
          "items": {
            "type": "string",
            "maxLength": 64
          }
        }
      }
    },
    "tokenId": {
      "type": "integer",
      "exclusiveMinimum": 0,
      "maximum": 9007199254740991
    },
    "tokenIds": {
      "minItems": 1,
      "maxItems": 100,
      "type": "array",
      "items": {
        "type": "integer",
        "exclusiveMinimum": 0,
        "maximum": 9007199254740991
      }
    },
    "groupsByTokenId": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "maxItems": 200,
        "type": "array",
        "items": {
          "type": "string",
          "maxLength": 64
        }
      }
    }
  },
  "required": [
    "project_id",
    "requestId",
    "messageText"
  ]
}
```

## Эффект

```json
{
  "section": "broadcasts",
  "effect": "external",
  "completionMode": "job",
  "pollAction": "db_get_broadcast",
  "destructive": false,
  "runtimeApply": "not_applicable"
}
```

## Пример вызова

```json
{
  "action_id": "db_start_broadcast",
  "args": {
    "project_id": 1,
    "requestId": "11111111-1111-4111-8111-111111111111",
    "name": "",
    "messageText": "1",
    "mediaUrls": [],
    "buttons": [],
    "buttonsPerRow": 0,
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
