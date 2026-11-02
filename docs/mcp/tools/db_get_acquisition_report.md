<!--
@fileoverview Контракт аналитики v2, автоматически экспортированный из регистрации.
-->

# db_get_acquisition_report

Рекламные расходы и результаты размещений из единого API. Без from/to — весь срок. decimal-строки RUB/USD не складываются без ручного RUB-за-USD курса. costPerUser=null и reason объясняют неполную историю, частичный день, неизвестные расходы/курс или отсутствие новых. starts — запуск бота, не клик. includeSources="true" добавляет обнаруженные источники без размещений: placementId=null, стабильный rowKey, расход null.

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
    "includeSources": {
      "type": "string",
      "enum": [
        "true",
        "false"
      ]
    },
    "tokenId": {
      "type": "integer",
      "exclusiveMinimum": 0
    },
    "from": {
      "type": "string",
      "format": "date-time"
    },
    "to": {
      "type": "string",
      "format": "date-time"
    },
    "timezone": {
      "type": "string",
      "default": "Europe/Moscow"
    },
    "currency": {
      "type": "string",
      "enum": [
        "RUB",
        "USD"
      ],
      "default": "RUB"
    },
    "placementId": {
      "type": "integer",
      "exclusiveMinimum": 0
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
  "tool": "db_get_acquisition_report",
  "arguments": {
    "project_id": 12,
    "from": "2026-11-01T00:00:00+03:00",
    "to": "2026-11-02T00:00:00+03:00",
    "currency": "RUB"
  }
}
```

## Ответ и ошибки

Ответ API сохраняется без пересчёта. Денежные значения — строки; null цены не равен нулю. В отчётах учитывайте as_of/asOf, coverage, complete и reason. Старые сборки ботов дают неполную историю. Код HTTP 400 означает некорректные параметры, 403 — чужой проект/бот, 404 — отсутствующий объект, 409 — конфликт маршрута start, 503 — временную недоступность. Ошибка помечена isError.

Инструмент только читает данные.

Связанный процесс: [аналитика и реклама](../workflows/analytics-acquisition.md).
