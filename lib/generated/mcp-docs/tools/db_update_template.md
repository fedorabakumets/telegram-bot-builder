<!-- @fileoverview Автоматическая карточка реального действия MCP. -->
# `db_update_template`

Сохраняет изменения собственного шаблона. Чужие шаблоны сервер запрещает изменять.

Раздел: templates. Транспорт: http, stdio.

## Параметры

```json
{
  "type": "object",
  "properties": {
    "template_id": {
      "type": "integer",
      "exclusiveMinimum": 0,
      "maximum": 9007199254740991
    },
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
      ],
      "default": "custom"
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "isPublic": {
      "type": "number",
      "minimum": 0,
      "maximum": 1,
      "default": 0
    },
    "difficulty": {
      "type": "string",
      "enum": [
        "easy",
        "medium",
        "hard"
      ],
      "default": "easy"
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
      "type": "string",
      "default": "1.0.0"
    },
    "previewImage": {
      "type": [
        "string",
        "null"
      ]
    },
    "language": {
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
      ],
      "default": "ru"
    },
    "requiresToken": {
      "type": "number",
      "minimum": 0,
      "maximum": 1,
      "default": 0
    },
    "complexity": {
      "type": "number",
      "minimum": 1,
      "maximum": 10,
      "default": 1
    },
    "estimatedTime": {
      "type": "number",
      "minimum": 1,
      "maximum": 120,
      "default": 5
    }
  },
  "required": [
    "template_id"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
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
  "action_id": "db_update_template",
  "args": {
    "template_id": 1
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
