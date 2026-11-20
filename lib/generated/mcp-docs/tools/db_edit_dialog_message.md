<!-- @fileoverview Автоматическая карточка реального действия MCP. -->
# `db_edit_dialog_message`

Изменяет отправленное сообщение Telegram и сохранённую историю. Если buttons не переданы, клавиатура сохраняется; buttons: [] явно удаляет кнопки.

Раздел: dialogs. Транспорт: http, stdio.

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
    "token_id": {
      "type": "integer",
      "exclusiveMinimum": 0,
      "maximum": 9007199254740991
    },
    "message_id": {
      "type": "integer",
      "exclusiveMinimum": 0,
      "maximum": 9007199254740991
    },
    "messageText": {
      "default": "",
      "type": "string",
      "maxLength": 4096
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
      "type": "integer",
      "minimum": 0,
      "maximum": 8
    }
  },
  "required": [
    "project_id",
    "token_id",
    "message_id"
  ]
}
```

## Эффект

```json
{
  "section": "dialogs",
  "effect": "external",
  "completionMode": "immediate",
  "destructive": true,
  "runtimeApply": "not_applicable"
}
```

## Пример вызова

```json
{
  "action_id": "db_edit_dialog_message",
  "args": {
    "project_id": 1,
    "token_id": 1,
    "message_id": 1,
    "messageText": ""
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
