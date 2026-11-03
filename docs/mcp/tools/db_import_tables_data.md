<!-- @fileoverview Автоматическая карточка реального действия MCP. -->
# `db_import_tables_data`

Перенести встроенный JSON таблиц версии 1 без файловых путей. Без confirm — только локальный preview (не проверка прав/конфликтов сервера). confirm=true сохраняет весь пакет через существующий API одной транзакцией. replace удаляет прежние строки; create тоже требует явного confirm. До 200 строк на таблицу.

Раздел: tables. Транспорт: http, stdio.

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
    "bundle": {
      "type": "object",
      "properties": {
        "version": {
          "type": "number",
          "const": 1,
          "default": 1
        },
        "tables": {
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
                "type": "array",
                "items": {
                  "type": "string",
                  "minLength": 1,
                  "maxLength": 255
                },
                "minItems": 1
              },
              "columnSettings": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "displayName": {
                      "type": "string",
                      "maxLength": 255,
                      "default": ""
                    },
                    "dataType": {
                      "type": "string",
                      "enum": [
                        "text",
                        "number",
                        "date",
                        "boolean",
                        "link"
                      ],
                      "default": "text"
                    },
                    "required": {
                      "type": "boolean",
                      "default": false
                    },
                    "min": {
                      "type": "number"
                    },
                    "max": {
                      "type": "number"
                    },
                    "maxLength": {
                      "type": "integer",
                      "minimum": 1,
                      "maximum": 10000,
                      "default": 10000
                    }
                  },
                  "additionalProperties": false
                }
              },
              "rows": {
                "type": "array",
                "items": {
                  "type": "array",
                  "items": {
                    "type": "string",
                    "maxLength": 10000
                  }
                },
                "maxItems": 200
              }
            },
            "required": [
              "name",
              "columns",
              "rows"
            ],
            "additionalProperties": false
          },
          "minItems": 1,
          "maxItems": 50
        }
      },
      "required": [
        "tables"
      ],
      "additionalProperties": false
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
      "type": "string",
      "format": "uuid",
      "description": "UUID попытки: результатом станет постоянная квитанция ID; unknown не повторять."
    }
  },
  "required": [
    "project_id",
    "bundle",
    "mode"
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
