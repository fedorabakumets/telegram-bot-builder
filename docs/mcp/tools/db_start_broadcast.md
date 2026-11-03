<!-- @fileoverview Автоматическая карточка реального действия MCP. -->
# `db_start_broadcast`

СОЗДАЁТ И СРАЗУ ЗАПУСКАЕТ реальную рассылку. tokenIds создаёт кампанию по выбранным ботам. Это не черновик. requestId обязателен: повтор той же заявки не запускает новую очередь; новый ID означает новую рассылку.

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
    "requestId": {
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "type": "string",
      "maxLength": 200,
      "default": ""
    },
    "messageText": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4096
    },
    "mediaUrls": {
      "type": "array",
      "items": {
        "type": "string",
        "maxLength": 16384
      },
      "maxItems": 10,
      "default": []
    },
    "buttons": {
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
            ],
            "default": "goto"
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
            "type": "string",
            "enum": [
              "normal",
              "option",
              "complete"
            ],
            "default": "normal"
          },
          "skipDataCollection": {
            "type": "boolean",
            "default": false
          },
          "hideAfterClick": {
            "type": "boolean",
            "default": false
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
        ],
        "additionalProperties": false
      },
      "maxItems": 100,
      "default": []
    },
    "buttonsPerRow": {
      "type": "integer",
      "minimum": 0,
      "maximum": 8,
      "default": 0
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
    },
    "groupsByTokenId": {
      "type": "object",
      "additionalProperties": {
        "type": "array",
        "items": {
          "type": "string",
          "maxLength": 64
        },
        "maxItems": 200
      }
    }
  },
  "required": [
    "project_id",
    "requestId",
    "messageText"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
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
