<!--
@fileoverview Контракт аналитики v2, автоматически экспортированный из регистрации.
-->

# db_get_analytics_v2

Согласованный снимок подтверждённой аналитики v2: новые/активные/вернувшиеся, сообщения отдельно от callback и служебных, топы и источники. restored_users — первые сохранённые действия в окне при неизвестной фактической первой дате; это отдельная серия, не новые и не знаменатель CPA. audience.first_history_status описывает полноту окна. unknown_first_users и total_users — всё время. period либо from+to, до 500 точек. Возвращает as_of, revision, coverage и previous. Обычная переписка группы не является использованием бота; неполная история не означает ноль.

## Параметры

Схема публикуется самим MCP и совпадает с авторизованным HTTP API:

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

## Пример

```json
{
  "tool": "db_get_analytics_v2",
  "arguments": {
    "project_id": 12,
    "token_id": 3,
    "period": "7d",
    "comparison": "previous",
    "timezone": "Europe/Moscow"
  }
}
```

## Ответ и ошибки

Ответ API сохраняется без пересчёта. Денежные значения — строки; null цены не равен нулю. В отчётах учитывайте as_of/asOf, coverage, complete и reason. Старые сборки ботов дают неполную историю. Код HTTP 400 означает некорректные параметры, 403 — чужой проект/бот, 404 — отсутствующий объект, 409 — конфликт маршрута start, 503 — временную недоступность. Ошибка помечена isError.

Инструмент только читает данные.

Связанный процесс: [аналитика и реклама](../workflows/analytics-acquisition.md).
