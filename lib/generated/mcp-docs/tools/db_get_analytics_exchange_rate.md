<!--
@fileoverview Контракт аналитики v2, автоматически экспортированный из регистрации.
-->

# db_get_analytics_exchange_rate

Получить бесплатный официальный курс USD/RUB Банка России на учётный день. rubPerUsd — рублей за один доллар, effectiveDay — фактическая дата действия. Доступ к проекту обязателен. Не сохраняет и не пересчитывает расходы. Для оплаты передайте рублёвый курс и effectiveDay через exchangeRateRubPerUsd и exchangeRateDate.

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
    "day": {
      "type": "string",
      "format": "date",
      "description": "Учётный день YYYY-MM-DD, не позже сегодня."
    }
  },
  "required": [
    "project_id",
    "day"
  ],
  "additionalProperties": false,
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

## Пример

```json
{
  "tool": "db_get_analytics_exchange_rate",
  "arguments": {
    "project_id": 12
  }
}
```

## Ответ и ошибки

Ответ API сохраняется без пересчёта. Денежные значения — строки; null цены не равен нулю. В отчётах учитывайте as_of/asOf, coverage, complete и reason. Старые сборки ботов дают неполную историю. Код HTTP 400 означает некорректные параметры, 403 — чужой проект/бот, 404 — отсутствующий объект, 409 — конфликт маршрута start, 503 — временную недоступность. Ошибка помечена isError.

Инструмент только читает данные.

Связанный процесс: [аналитика и реклама](../workflows/analytics-acquisition.md).
