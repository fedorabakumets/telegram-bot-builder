<!-- @fileoverview Автоматическая карточка реального действия MCP. -->
# `db_create_template`

Сохраняет личный шаблон. ownerId и featured назначает сервер; публикация isPublic имеет внешний эффект.

Раздел: templates. Транспорт: http, stdio.

## Параметры

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1
    },
    "description": {
      "type": [
        "string",
        "null"
      ]
    },
    "data": {},
    "category": {
      "default": "custom",
      "type": "string",
      "enum": [
        "custom",
        "business",
        "entertainment",
        "education",
        "utility",
        "games",
        "official",
        "community"
      ]
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "isPublic": {
      "default": 0,
      "type": "number",
      "minimum": 0,
      "maximum": 1
    },
    "difficulty": {
      "default": "easy",
      "type": "string",
      "enum": [
        "easy",
        "medium",
        "hard"
      ]
    },
    "authorId": {
      "type": [
        "string",
        "null"
      ]
    },
    "authorName": {
      "type": [
        "string",
        "null"
      ]
    },
    "version": {
      "default": "1.0.0",
      "type": "string"
    },
    "previewImage": {
      "type": [
        "string",
        "null"
      ]
    },
    "language": {
      "default": "ru",
      "type": "string",
      "enum": [
        "ru",
        "en",
        "es",
        "fr",
        "de",
        "it",
        "pt",
        "zh",
        "ja",
        "ko"
      ]
    },
    "requiresToken": {
      "default": 0,
      "type": "number",
      "minimum": 0,
      "maximum": 1
    },
    "complexity": {
      "default": 1,
      "type": "number",
      "minimum": 1,
      "maximum": 10
    },
    "estimatedTime": {
      "default": 5,
      "type": "number",
      "minimum": 1,
      "maximum": 120
    }
  },
  "required": [
    "name",
    "data"
  ]
}
```

## Эффект

```json
{
  "section": "templates",
  "effect": "write",
  "completionMode": "immediate",
  "destructive": false,
  "runtimeApply": "not_applicable"
}
```

## Пример вызова

```json
{
  "action_id": "db_create_template",
  "args": {
    "name": "1",
    "category": "custom",
    "isPublic": 0,
    "difficulty": "easy",
    "version": "1.0.0",
    "language": "ru",
    "requiresToken": 0,
    "complexity": 1,
    "estimatedTime": 5
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
