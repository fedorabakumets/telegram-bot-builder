# 7. bot_table read с random_row: случайная строка из результата

`resultFormat: "random_row"` — выбирает случайную строку из отфильтрованных результатов и сохраняет как объект (аналогично `first_row`).

**Пример: выбрать случайную руду из трюма игрока:**
```json
{
  "type": "bot_table",
  "data": {
    "tableName": "pilot_cargo",
    "operation": "read",
    "where": [
      { "column": "pilot_id", "operator": "equals", "value": "{user_id}" }
    ],
    "saveResultTo": "stolen",
    "resultFormat": "random_row",
    "autoTransitionTo": "next_node"
  }
}
```
После выполнения доступны: `{stolen.ore_id}`, `{stolen.ore_name}`, `{stolen.ore_emoji}`, `{stolen.quantity}`.

Если результат пуст (0 строк) — переменные не устанавливаются. Используйте condition с `is_empty` для проверки.
