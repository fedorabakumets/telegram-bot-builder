<!-- @fileoverview Автоматическая карточка реального действия MCP. -->
# `db_set_bot_settings`

Сохраняет разрешённую настройку и подтверждает повторным чтением. Не перезапускает бота; сохранение и применение работающим процессом различаются.

Раздел: bots. Транспорт: http, stdio.

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
    "change": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "setting": {
              "type": "string",
              "const": "auto-restart"
            },
            "autoRestart": {
              "type": "number",
              "enum": [
                0,
                1
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
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "setting": {
              "type": "string",
              "const": "protect-content"
            },
            "protectContent": {
              "$ref": "#/properties/change/anyOf/0/properties/autoRestart"
            }
          },
          "required": [
            "setting",
            "protectContent"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "setting": {
              "type": "string",
              "const": "save-incoming-media"
            },
            "saveIncomingMedia": {
              "$ref": "#/properties/change/anyOf/0/properties/autoRestart"
            }
          },
          "required": [
            "setting",
            "saveIncomingMedia"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "setting": {
              "type": "string",
              "const": "catch-all-handlers"
            },
            "catchAllHandlers": {
              "$ref": "#/properties/change/anyOf/0/properties/autoRestart"
            }
          },
          "required": [
            "setting",
            "catchAllHandlers"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "setting": {
              "type": "string",
              "const": "track-user-blocks"
            },
            "trackUserBlocks": {
              "$ref": "#/properties/change/anyOf/0/properties/autoRestart"
            }
          },
          "required": [
            "setting",
            "trackUserBlocks"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "setting": {
              "type": "string",
              "const": "track-group-membership"
            },
            "trackGroupMembership": {
              "$ref": "#/properties/change/anyOf/0/properties/autoRestart"
            }
          },
          "required": [
            "setting",
            "trackGroupMembership"
          ],
          "additionalProperties": false
        },
        {
          "type": "object",
          "properties": {
            "setting": {
              "type": "string",
              "const": "content-cache"
            },
            "contentCache": {
              "$ref": "#/properties/change/anyOf/0/properties/autoRestart"
            }
          },
          "required": [
            "setting",
            "contentCache"
          ],
          "additionalProperties": false
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
          ],
          "additionalProperties": false
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
          ],
          "additionalProperties": false
        }
      ]
    }
  },
  "required": [
    "project_id",
    "token_id",
    "change"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
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
