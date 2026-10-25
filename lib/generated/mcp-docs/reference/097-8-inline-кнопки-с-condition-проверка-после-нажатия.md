# 8. Inline кнопки с condition: проверка после нажатия

Inline кнопка с `action: "goto"` ведёт на target-ноду. Первой нодой в цепочке может быть `condition` — это позволяет проверять условия после нажатия кнопки.

**Пример: кнопка "Откупиться" → проверка баланса:**
```json
{
  "id": "btn-pay",
  "text": "💰 Откупиться ({ransom} кр.)",
  "action": "goto",
  "target": "cond-check-balance"
}
```
```json
{
  "id": "cond-check-balance",
  "type": "condition",
  "data": {
    "variable": "pilot.credits",
    "branches": [
      { "operator": "less_than", "value": "{ransom}", "target": "msg-no-money" },
      { "operator": "else", "value": "", "target": "do-pay" }
    ]
  }
}
```
Это заменяет "скрытие кнопки по условию" — кнопка всегда видна, но при нажатии проверяется условие.
