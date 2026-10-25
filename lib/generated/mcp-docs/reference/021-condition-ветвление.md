# condition — ветвление

```json
{
  "type": "condition",
  "data": {
    "variable": "имя_переменной",
    "branches": [
      {
        "id": "branch-1",
        "label": "Равно 1",
        "operator": "equals",
        "value": "1",
        "target": "node_id_if_true"
      },
      {
        "id": "branch-else",
        "label": "Иначе",
        "operator": "else",
        "value": "",
        "target": "node_id_else"
      }
    ]
  }
}
```

Строковые операторы: `equals`, `not_equals`, `contains`, `not_contains`, `starts_with`, `ends_with`, `matches_regex`, `filled`, `empty`, `else`

Числовые операторы: `greater_than`, `less_than`, `between`, `is_even`, `is_odd`, `divisible_by` (работают, только если значение можно привести к числу; `is_even`/`is_odd` не требуют `value`, `divisible_by` использует `value` как делитель)

Системные операторы (не требуют `variable`): `is_private`, `is_group`, `is_channel`, `is_admin`, `is_premium`, `is_bot`, `is_subscribed`, `is_not_subscribed`

> ⚠️ **КРИТИЧНО:** Операторы `not_empty`, `is_empty`, `is_not_empty` — **НЕ СУЩЕСТВУЮТ** в шаблоне condition. Используй `filled` вместо `not_empty`/`is_not_empty`, `empty` вместо `is_empty`.

> ⚠️ **Формат data:** Обязательные поля: `variable` (строка — имя переменной) и `branches` (массив веток). **НИКОГДА** не использовать `conditions` + `defaultTarget` — такого формата не существует.

Значения в `value` и `value2` поддерживают переменные: `{user.balance}`, `{item.price}`, `{now_ts}` и т.д.
Переменные раскрываются в рантайме через `replace_variables_in_text`.
