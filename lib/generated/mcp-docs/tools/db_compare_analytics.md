<!-- @fileoverview Автоматическая карточка реального действия MCP. -->
# `db_compare_analytics`

Сравнивает временные метрики в одном снимке БД. previous — предыдущее окно той же длительности; explicit — compare_from/compare_to. Один источник обоих окон. absolute_change и percent_change; при нулевой базе и ненулевом результате процент null. Premium и языки не являются историческими метриками.

Раздел: analytics. Транспорт: http, stdio.

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
    "token_id": {
      "type": "integer",
      "exclusiveMinimum": 0,
      "maximum": 9007199254740991
    },
    "metric": {
      "type": "string",
      "enum": [
        "registrations",
        "messages",
        "active_users"
      ]
    },
    "period": {
      "type": "string",
      "enum": [
        "1h",
        "3h",
        "24h",
        "7d",
        "30d",
        "12w",
        "12m"
      ]
    },
    "from": {
      "description": "Включённая ISO-дата с часовым поясом; требует to, исключает period.",
      "type": "string",
      "maxLength": 40
    },
    "to": {
      "description": "Исключённая ISO-дата с часовым поясом.",
      "type": "string",
      "maxLength": 40
    },
    "step": {
      "description": "Независимый фиксированный шаг; 30d — 30 суток, до 500 точек.",
      "type": "string",
      "enum": [
        "1m",
        "5m",
        "1h",
        "1d",
        "7d",
        "30d"
      ]
    },
    "comparison": {
      "default": "previous",
      "type": "string",
      "enum": [
        "previous",
        "explicit"
      ]
    },
    "compare_from": {
      "type": "string",
      "maxLength": 40
    },
    "compare_to": {
      "type": "string",
      "maxLength": 40
    }
  },
  "required": [
    "project_id",
    "metric"
  ]
}
```

## Эффект

```json
{
  "section": "analytics",
  "effect": "read",
  "completionMode": "immediate",
  "destructive": false,
  "runtimeApply": "not_applicable"
}
```

## Пример вызова

```json
{
  "action_id": "db_compare_analytics",
  "args": {
    "project_id": 1,
    "metric": "registrations",
    "comparison": "previous"
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
