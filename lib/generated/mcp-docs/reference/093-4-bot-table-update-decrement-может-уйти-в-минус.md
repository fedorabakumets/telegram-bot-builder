# 4. bot_table update decrement: может уйти в минус

`decrement` не проверяет что значение >= 0. Если `cargo_used = 0` и вы делаете `decrement 1`, получите `-1`.

**Решение**: всегда ставить condition перед decrement:
```
condition (cargo_used > 0?) → update (decrement) 
```
