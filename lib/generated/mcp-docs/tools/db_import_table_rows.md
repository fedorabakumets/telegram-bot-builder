<!-- @fileoverview Автоматическая карточка реального действия MCP. -->
# `db_import_table_rows`

Импорт до 200 строк. mode append или replace. replace требует confirm: true до обращения к API.

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
    "mode": {
      "type": "string",
      "enum": [
        "append",
        "replace"
      ]
    },
    "confirm": {
      "type": "boolean"
    },
    "rows": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": {
          "type": "string"
        },
        "description": "Ключ — числовой id столбца строкой, значение — текст, пустая строка допустима"
      },
      "maxItems": 200
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
    "mode",
    "rows"
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
  "action_id": "db_import_table_rows",
  "args": {
    "project_id": 1,
    "table_id": 1,
    "mode": "append",
    "rows": []
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
