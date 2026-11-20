<!-- @fileoverview Автоматическая карточка реального действия MCP. -->
# `db_move_sheet_to_project`

Перенести (move) или скопировать (copy) лист из одного проекта в другой в БД живого приложения с обновлением обоих холстов (live). Оригинальные id нод/веток и связи СОХРАНЯЮТСЯ как есть; id перегенерируется только при коллизии с целевым проектом. Кросс-листовые ссылки на ноды других листов источника обрываются. По умолчанию mode=copy (безопасно). В режиме move лист удаляется из источника (нельзя унести последний лист), а в оставшихся листах источника обрываются ссылки на унесённые ноды. Порядок записи безопасный: сначала целевой проект, затем источник. Адресация по числовым projectId из URL редактора

Раздел: sheets. Транспорт: http, stdio.

## Параметры

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "source_project_id": {
      "type": "number",
      "description": "ID исходного проекта (откуда переносится лист)"
    },
    "target_project_id": {
      "type": "number",
      "description": "ID целевого проекта (куда переносится лист)"
    },
    "sheet_id": {
      "type": "string",
      "description": "ID переносимого листа в исходном проекте"
    },
    "mode": {
      "description": "move — перенос с удалением из источника; copy — копирование (по умолчанию copy)",
      "type": "string",
      "enum": [
        "move",
        "copy"
      ]
    },
    "commit_message": {
      "description": "Заметка к версии (ручной чекпоинт)",
      "type": "string"
    }
  },
  "required": [
    "source_project_id",
    "target_project_id",
    "sheet_id"
  ]
}
```

## Эффект

```json
{
  "section": "sheets",
  "effect": "write",
  "completionMode": "immediate",
  "destructive": false,
  "runtimeApply": "separate"
}
```

## Пример вызова

```json
{
  "action_id": "db_move_sheet_to_project",
  "args": {
    "source_project_id": 1,
    "target_project_id": 1,
    "sheet_id": "1"
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
