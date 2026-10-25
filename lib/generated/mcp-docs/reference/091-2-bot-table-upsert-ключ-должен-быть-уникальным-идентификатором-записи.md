# 2. bot_table upsert: ключ должен быть уникальным идентификатором записи

**НЕПРАВИЛЬНО** — `key: "pilot_id"` при составном ключе (pilot_id + ore_id):
```json
{
  "operation": "upsert",
  "key": "pilot_id",
  "row": { "pilot_id": "{user_id}", "ore_id": "iron", "quantity": "1" }
}
```
Результат: если у пилота уже есть ЛЮБАЯ руда, upsert найдёт первую запись по `pilot_id` и перезапишет её (потеря данных).

**ПРАВИЛЬНО** — использовать read + condition + insert/update:
```
read (where: pilot_id + ore_id) → condition (is_empty?) 
  → insert (новая запись)
  → update (increment quantity)
```
