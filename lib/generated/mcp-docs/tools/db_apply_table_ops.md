<!-- @fileoverview Автоматическая карточка реального действия MCP. -->
# `db_apply_table_ops`

До 50 операций одной транзакцией: столбцы, строки, переиндексация. Если есть удаление, нужен confirm: true. При ошибке всё откатывается, в ответе failed_op_index.

Раздел: tables. Транспорт: http, stdio.

## Параметры

```json
{
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
      "type": "array",
      "items": {
        "anyOf": [
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
                "type": "integer"
              }
            },
            "required": [
              "op",
              "name"
            ],
            "additionalProperties": false
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
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "type": "string",
                "const": "delete_column"
              },
              "column_id": {
                "$ref": "#/properties/ops/items/anyOf/1/properties/column_id"
              }
            },
            "required": [
              "op",
              "column_id"
            ],
            "additionalProperties": false
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
                      "additionalProperties": {}
                    },
                    "row_index": {
                      "type": "integer"
                    }
                  },
                  "required": [
                    "data"
                  ],
                  "additionalProperties": false
                }
              }
            },
            "required": [
              "op",
              "rows"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "type": "string",
                "const": "update_row"
              },
              "row_id": {
                "$ref": "#/properties/ops/items/anyOf/1/properties/column_id"
              },
              "data": {
                "$ref": "#/properties/ops/items/anyOf/3/properties/rows/items/properties/data"
              }
            },
            "required": [
              "op",
              "row_id",
              "data"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "type": "string",
                "const": "patch_row"
              },
              "row_id": {
                "$ref": "#/properties/ops/items/anyOf/1/properties/column_id"
              },
              "data": {
                "$ref": "#/properties/ops/items/anyOf/3/properties/rows/items/properties/data"
              }
            },
            "required": [
              "op",
              "row_id",
              "data"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "op": {
                "type": "string",
                "const": "delete_row"
              },
              "row_id": {
                "$ref": "#/properties/ops/items/anyOf/1/properties/column_id"
              }
            },
            "required": [
              "op",
              "row_id"
            ],
            "additionalProperties": false
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
            ],
            "additionalProperties": false
          }
        ]
      },
      "minItems": 1,
      "maxItems": 50
    },
    "request_id": {
      "type": "string",
      "format": "uuid",
      "description": "Один UUID на попытку. С ним результат — квитанция ID, данные перечитайте отдельно. Повторите тот же UUID при потере ответа; unknown нельзя выполнять заново автоматически."
    }
  },
  "required": [
    "project_id",
    "table_id",
    "ops"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
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
