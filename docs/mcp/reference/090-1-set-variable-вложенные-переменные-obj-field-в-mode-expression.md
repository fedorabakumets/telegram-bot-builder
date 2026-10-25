# 1. set_variable: вложенные переменные (obj.field) в mode expression

При использовании `{obj.field}` в выражениях, переменные хранятся как плоские ключи (`sell_item.quantity`), а не как вложенные объекты. `_eval_expr` теперь корректно ищет сначала полный путь как плоский ключ.

**Работает корректно:**
```json
{
  "type": "set_variable",
  "data": {
    "assignments": [
      { "id": "a1", "variable": "sell_price", "value": "{sell_ore.base_price_earth}", "mode": "text" },
      { "id": "a2", "variable": "sell_income", "value": "{sell_item.quantity} * {sell_price}", "mode": "expression" }
    ]
  }
}
```
Каждый следующий assignment видит результат предыдущего (assignments выполняются последовательно).
