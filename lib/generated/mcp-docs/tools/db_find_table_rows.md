<!-- @fileoverview Автоматическая карточка реального действия MCP. -->
# `db_find_table_rows`

Поиск строк: до 5 условий, без произвольного SQL. Операторы equals, not_equals, contains, starts_with, ends_with, filled, empty, greater_than, less_than.

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
    "filters": {
      "maxItems": 5,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "column_id": {
            "type": "number",
            "description": "Числовой id столбца из db_list_table_columns"
          },
          "operator": {
            "type": "string",
            "enum": [
              "equals",
              "not_equals",
              "contains",
              "starts_with",
              "ends_with",
              "filled",
              "empty",
              "greater_than",
              "less_than"
            ]
          },
          "value": {
            "type": "string",
            "maxLength": 500
          }
        },
        "required": [
          "column_id",
          "operator"
        ]
      }
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 500
    },
    "offset": {
      "type": "integer",
      "minimum": 0,
      "maximum": 9007199254740991
    },
    "sort": {
      "type": "string"
    },
    "columns": {
      "type": "array",
      "items": {
        "type": "number"
      }
    }
  },
  "required": [
    "project_id",
    "table_id",
    "filters"
  ]
}
```

## Эффект

```json
{
  "section": "tables",
  "effect": "read",
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
