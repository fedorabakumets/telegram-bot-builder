<!-- @fileoverview Автоматическая карточка реального действия MCP. -->
# `db_send_group_message`

Отправляет реальное сообщение в группу Telegram. requestId обязателен, используйте тот же ID при сверке результата.

Раздел: dialogs. Транспорт: http, stdio.

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
    "token_id": {
      "$ref": "#/properties/project_id"
    },
    "requestId": {
      "type": "string",
      "format": "uuid"
    },
    "group_id": {
      "type": "string",
      "pattern": "^-?[1-9]\\d{0,19}$"
    },
    "messageText": {
      "type": "string",
      "maxLength": 4096,
      "default": ""
    },
    "nodeId": {
      "type": "string"
    },
    "userData": {
      "type": "object",
      "additionalProperties": {}
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
    }
  },
  "required": [
    "project_id",
    "token_id",
    "requestId",
    "group_id"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

## Эффект

```json
{
  "section": "dialogs",
  "effect": "external",
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
