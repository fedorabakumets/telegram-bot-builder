<!-- @fileoverview Автоматическая карточка реального действия MCP. -->
# `db_set_bot_settings`

Сохраняет разрешённую настройку и подтверждает повторным чтением. Не перезапускает бота; сохранение и применение работающим процессом различаются.

Раздел: bots. Транспорт: http, stdio.

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
    "change": {
      "oneOf": [
        {
          "type": "object",
          "properties": {
            "setting": {
              "type": "string",
              "const": "auto-restart"
            },
            "autoRestart": {
              "anyOf": [
                {
                  "type": "number",
                  "const": 0
                },
                {
                  "type": "number",
                  "const": 1
                }
              ]
            },
            "maxRestartAttempts": {
              "type": "integer",
              "minimum": 1,
              "maximum": 10
            }
          },
          "required": [
            "setting",
            "autoRestart",
            "maxRestartAttempts"
          ]
        },
        {
          "type": "object",
          "properties": {
            "setting": {
              "type": "string",
              "const": "protect-content"
            },
            "protectContent": {
              "anyOf": [
                {
                  "type": "number",
                  "const": 0
                },
                {
                  "type": "number",
                  "const": 1
                }
              ]
            }
          },
          "required": [
            "setting",
            "protectContent"
          ]
        },
        {
          "type": "object",
          "properties": {
            "setting": {
              "type": "string",
              "const": "save-incoming-media"
            },
            "saveIncomingMedia": {
              "anyOf": [
                {
                  "type": "number",
                  "const": 0
                },
                {
                  "type": "number",
                  "const": 1
                }
              ]
            }
          },
          "required": [
            "setting",
            "saveIncomingMedia"
          ]
        },
        {
          "type": "object",
          "properties": {
            "setting": {
              "type": "string",
              "const": "catch-all-handlers"
            },
            "catchAllHandlers": {
              "anyOf": [
                {
                  "type": "number",
                  "const": 0
                },
                {
                  "type": "number",
                  "const": 1
                }
              ]
            }
          },
          "required": [
            "setting",
            "catchAllHandlers"
          ]
        },
        {
          "type": "object",
          "properties": {
            "setting": {
              "type": "string",
              "const": "track-user-blocks"
            },
            "trackUserBlocks": {
              "anyOf": [
                {
                  "type": "number",
                  "const": 0
                },
                {
                  "type": "number",
                  "const": 1
                }
              ]
            }
          },
          "required": [
            "setting",
            "trackUserBlocks"
          ]
        },
        {
          "type": "object",
          "properties": {
            "setting": {
              "type": "string",
              "const": "track-group-membership"
            },
            "trackGroupMembership": {
              "anyOf": [
                {
                  "type": "number",
                  "const": 0
                },
                {
                  "type": "number",
                  "const": 1
                }
              ]
            }
          },
          "required": [
            "setting",
            "trackGroupMembership"
          ]
        },
        {
          "type": "object",
          "properties": {
            "setting": {
              "type": "string",
              "const": "content-cache"
            },
            "contentCache": {
              "anyOf": [
                {
                  "type": "number",
                  "const": 0
                },
                {
                  "type": "number",
                  "const": 1
                }
              ]
            }
          },
          "required": [
            "setting",
            "contentCache"
          ]
        },
        {
          "type": "object",
          "properties": {
            "setting": {
              "type": "string",
              "const": "log-level"
            },
            "logLevel": {
              "type": "string",
              "enum": [
                "DEBUG",
                "INFO",
                "WARNING",
                "ERROR"
              ]
            }
          },
          "required": [
            "setting",
            "logLevel"
          ]
        },
        {
          "type": "object",
          "properties": {
            "setting": {
              "type": "string",
              "const": "launch-settings"
            },
            "launchMode": {
              "type": "string",
              "enum": [
                "polling",
                "webhook"
              ]
            },
            "webhookBaseUrl": {
              "anyOf": [
                {
                  "type": "string",
                  "format": "uri"
                },
                {
                  "type": "null"
                }
              ]
            },
            "webhookSecretToken": {
              "anyOf": [
                {
                  "type": "string",
                  "maxLength": 256,
                  "pattern": "^[A-Za-z0-9_-]*$"
                },
                {
                  "type": "null"
                }
              ]
            }
          },
          "required": [
            "setting",
            "launchMode"
          ]
        }
      ]
    }
  },
  "required": [
    "project_id",
    "token_id",
    "change"
  ]
}
```

## Эффект

```json
{
  "section": "bots",
  "effect": "write",
  "completionMode": "immediate",
  "destructive": false,
  "runtimeApply": "separate"
}
```

## Пример вызова

```json
{
  "action_id": "db_set_bot_settings",
  "args": {
    "project_id": 1,
    "token_id": 1,
    "change": {
      "setting": "auto-restart",
      "autoRestart": 0,
      "maxRestartAttempts": 1
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
