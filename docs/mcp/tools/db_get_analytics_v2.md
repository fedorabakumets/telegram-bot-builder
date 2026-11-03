<!-- @fileoverview Автоматическая карточка реального действия MCP. -->
# `db_get_analytics_v2`

Согласованный снимок подтверждённой аналитики v2: новые/активные/вернувшиеся, сообщения отдельно от callback и служебных, топы и источники. restored_users — первые сохранённые действия в окне при неизвестной фактической первой дате; это отдельная серия, не новые и не знаменатель CPA. audience.first_history_status описывает полноту окна. unknown_first_users и total_users — всё время. period либо from+to, до 500 точек. Возвращает as_of, revision, coverage и previous. Обычная переписка группы не является использованием бота; неполная история не означает ноль.

Раздел: analytics. Транспорт: http, stdio.

## Параметры

```json
{
  "type": "object",
  "properties": {
    "project_id": {
      "type": "integer",
      "exclusiveMinimum": 0,
      "maximum": 9007199254740991,
      "description": "ID проекта с доступом текущего агента."
    },
    "token_id": {
      "type": "integer",
      "exclusiveMinimum": 0,
      "description": "Без параметра — весь проект, люди дедуплицируются между ботами."
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
        "12m",
        "all"
      ],
      "description": "Либо period, либо from+to. По умолчанию 30d."
    },
    "from": {
      "type": "string",
      "format": "date-time"
    },
    "to": {
      "type": "string",
      "format": "date-time"
    },
    "step": {
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
    "timezone": {
      "type": "string",
      "description": "IANA, например Europe/Moscow."
    },
    "comparison": {
      "type": "string",
      "const": "previous"
    }
  },
  "required": [
    "project_id"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
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
  "action_id": "db_get_analytics_v2",
  "args": {
    "project_id": 1
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
