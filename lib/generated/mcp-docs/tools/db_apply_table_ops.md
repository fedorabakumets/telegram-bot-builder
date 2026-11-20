<!-- @fileoverview Автоматическая карточка реального действия MCP. -->
# `db_apply_table_ops`

До 50 операций одной транзакцией: столбцы, строки, переиндексация. Если есть удаление, нужен confirm: true. При ошибке всё откатывается, в ответе failed_op_index.

Раздел: tables. Транспорт: http, stdio.

## Параметры

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "project_id": {
      "type": "number"
    },
    "table_id": {
      "type": "number"
    },
    "confirm": {
      "type": "boolean"
    },
    "ops": {
      "minItems": 1,
      "maxItems": 50,
      "type": "array",
      "items": {
        "oneOf": [
          {
            "type": "object",
            "properties": {
              "op": {
                "type": "string",
                "const": "add_column"
              },
              "name": {
                "type": "string"
              },
              "position": {
                "type": "integer",
                "minimum": -9007199254740991,
                "maximum": 9007199254740991
              }
            },
            "required": [
              "op",
              "name"
            ]
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "type": "string",
                "const": "rename_column"
              },
              "column_id": {
                "type": "integer",
                "exclusiveMinimum": 0,
                "maximum": 9007199254740991
              },
              "name": {
                "type": "string"
              }
            },
            "required": [
              "op",
              "column_id",
              "name"
            ]
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "type": "string",
                "const": "delete_column"
              },
              "column_id": {
                "type": "integer",
                "exclusiveMinimum": 0,
                "maximum": 9007199254740991
              }
            },
            "required": [
              "op",
              "column_id"
            ]
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "type": "string",
                "const": "add_rows"
              },
              "rows": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "object",
                      "propertyNames": {
                        "type": "string"
                      },
                      "additionalProperties": {}
                    },
                    "row_index": {
                      "type": "integer",
                      "minimum": -9007199254740991,
                      "maximum": 9007199254740991
                    }
                  },
                  "required": [
                    "data"
                  ]
                }
              }
            },
            "required": [
              "op",
              "rows"
            ]
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "type": "string",
                "const": "update_row"
              },
              "row_id": {
                "type": "integer",
                "exclusiveMinimum": 0,
                "maximum": 9007199254740991
              },
              "data": {
                "type": "object",
                "propertyNames": {
                  "type": "string"
                },
                "additionalProperties": {}
              }
            },
            "required": [
              "op",
              "row_id",
              "data"
            ]
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "type": "string",
                "const": "patch_row"
              },
              "row_id": {
                "type": "integer",
                "exclusiveMinimum": 0,
                "maximum": 9007199254740991
              },
              "data": {
                "type": "object",
                "propertyNames": {
                  "type": "string"
                },
                "additionalProperties": {}
              }
            },
            "required": [
              "op",
              "row_id",
              "data"
            ]
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "type": "string",
                "const": "delete_row"
              },
              "row_id": {
                "type": "integer",
                "exclusiveMinimum": 0,
                "maximum": 9007199254740991
              }
            },
            "required": [
              "op",
              "row_id"
            ]
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "type": "string",
                "const": "reindex"
              }
            },
            "required": [
              "op"
            ]
          }
        ]
      }
    },
    "request_id": {
      "description": "Один UUID на попытку. С ним результат — квитанция ID, данные перечитайте отдельно. Повторите тот же UUID при потере ответа; unknown нельзя выполнять заново автоматически.",
      "type": "string",
      "format": "uuid",
      "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
    }
  },
  "required": [
    "project_id",
    "table_id",
    "ops"
  ]
}
```

## Эффект

```json
{
  "section": "tables",
  "effect": "write",
  "completionMode": "immediate",
  "destructive": true,
  "runtimeApply": "not_applicable"
}
```

## Пример вызова

```json
{
  "action_id": "db_apply_table_ops",
  "args": {
    "project_id": 1,
    "table_id": 1,
    "ops": [
      {
        "op": "add_column",
        "name": "1"
      }
    ]
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
