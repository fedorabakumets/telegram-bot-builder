<!-- @fileoverview Автоматическая карточка реального действия MCP. -->
# `db_import_tables_data`

Перенести встроенный JSON таблиц версии 1 без файловых путей. Без confirm — только локальный preview (не проверка прав/конфликтов сервера). confirm=true сохраняет весь пакет через существующий API одной транзакцией. replace удаляет прежние строки; create тоже требует явного confirm. До 200 строк на таблицу.

Раздел: tables. Транспорт: http, stdio.

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
    "bundle": {
      "type": "object",
      "properties": {
        "version": {
          "default": 1,
          "type": "number",
          "const": 1
        },
        "tables": {
          "minItems": 1,
          "maxItems": 50,
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": {
                "type": "string",
                "minLength": 1,
                "maxLength": 255
              },
              "columns": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "string",
                  "minLength": 1,
                  "maxLength": 255
                }
              },
              "columnSettings": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "displayName": {
                      "default": "",
                      "type": "string",
                      "maxLength": 255
                    },
                    "dataType": {
                      "default": "text",
                      "type": "string",
                      "enum": [
                        "text",
                        "number",
                        "date",
                        "boolean",
                        "link"
                      ]
                    },
                    "required": {
                      "default": false,
                      "type": "boolean"
                    },
                    "min": {
                      "type": "number"
                    },
                    "max": {
                      "type": "number"
                    },
                    "maxLength": {
                      "default": 10000,
                      "type": "integer",
                      "minimum": 1,
                      "maximum": 10000
                    }
                  },
                  "additionalProperties": false
                }
              },
              "rows": {
                "maxItems": 200,
                "type": "array",
                "items": {
                  "type": "array",
                  "items": {
                    "type": "string",
                    "maxLength": 10000
                  }
                }
              }
            },
            "required": [
              "name",
              "columns",
              "rows"
            ]
          }
        }
      },
      "required": [
        "tables"
      ]
    },
    "mode": {
      "type": "string",
      "enum": [
        "create",
        "replace"
      ]
    },
    "confirm": {
      "type": "boolean"
    },
    "request_id": {
      "description": "UUID попытки: результатом станет постоянная квитанция ID; unknown не повторять.",
      "type": "string",
      "format": "uuid",
      "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
    }
  },
  "required": [
    "project_id",
    "bundle",
    "mode"
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
  "action_id": "db_import_tables_data",
  "args": {
    "project_id": 1,
    "bundle": {
      "version": 1,
      "tables": [
        {
          "name": "1",
          "columns": [
            "1"
          ],
          "rows": []
        }
      ]
    },
    "mode": "create"
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
