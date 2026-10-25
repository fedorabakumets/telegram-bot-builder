# 6. bot_table read с all_rows: переменная — массив

После `read` с `resultFormat: "all_rows"` переменная содержит JSON-массив. Для доступа к элементам используйте `loop` или `array_item` в set_variable. Нельзя обращаться как `{list.field}` — это работает только с `first_row`.
