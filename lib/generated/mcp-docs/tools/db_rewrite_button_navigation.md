<!-- @fileoverview Автоматическая карточка реального действия MCP. -->
# `db_rewrite_button_navigation`

Массово переключить кнопочную навигацию между новыми сообщениями и edit_message. Без confirm возвращает только план; запись выполняется одной версией.

Раздел: scenario. Транспорт: http, stdio.

## Параметры

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "project_id": {
      "type": "number",
      "description": "Числовой ID проекта из URL редактора"
    },
    "mode": {
      "type": "string",
      "enum": [
        "edit_current",
        "send_new"
      ],
      "description": "edit_current — менять текущее сообщение; send_new — отменить правки этого инструмента"
    },
    "confirm": {
      "default": false,
      "description": "true — применить показанный план",
      "type": "boolean"
    },
    "sheet_id": {
      "description": "Менять целевые экраны только этого листа",
      "type": "string"
    },
    "commit_message": {
      "description": "Заметка к версии проекта",
      "type": "string"
    }
  },
  "required": [
    "project_id",
    "mode"
  ]
}
```

## Эффект

```json
{
  "section": "scenario",
  "effect": "write",
  "completionMode": "immediate",
  "destructive": false,
  "runtimeApply": "separate"
}
```

## Пример вызова

```json
{
  "action_id": "db_rewrite_button_navigation",
  "args": {
    "project_id": 1,
    "mode": "edit_current",
    "confirm": false
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
