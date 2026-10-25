# Condition-нода

Condition проверяет одну переменную и выбирает ветку из `branches`. Используй только допустимые операторы: `filled`, `empty`, `equals`, `not_equals`, `contains`, `greater_than`, `less_than`, `between`, `else` и перечисленные в `list_operators`.

```json
{"type":"condition","data":{"variable":"answer","branches":[{"operator":"greater_than","value":"0","target":"positive"},{"operator":"else","value":"","target":"fallback"}]}}
```

Не используй `conditions`, `defaultTarget`, `not_empty` или `is_empty`. Перед созданием вызови `get_node_schema` и `list_operators`.
