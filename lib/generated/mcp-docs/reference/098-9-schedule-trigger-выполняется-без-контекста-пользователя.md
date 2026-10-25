# 9. schedule_trigger: выполняется без контекста пользователя

`schedule_trigger` запускается по расписанию **один раз для всего бота**, а не для каждого пользователя. У него нет `user_id`, `chat_id` или переменных конкретного игрока.

**Что можно:**
- Обновить данные в таблицах (пересчитать цены, сбросить флаги)
- Отправить сообщение в конкретный чат (если ID захардкожен или в переменной бота)
- Через `loop` по таблице пользователей — отправить каждому

**Что нельзя напрямую:**
- Отправить `message` "текущему пользователю" — его нет в контексте schedule
- Использовать `{user_id}`, `{first_name}` — они пустые

**Паттерн: рассылка всем пользователям по расписанию:**
```
schedule_trigger (daily 12:00)
  → bot_table read users (all_rows, saveResultTo: "all_users")
  → loop (sourceVariable: "all_users", itemVariable: "user_item")
    → message (messageSendRecipients: [{type: "chat_id", chatId: "{user_item.telegram_id}"}])
```

**Паттерн: ежедневный бонус (по кнопке, не по расписанию):**
Лучше реализовать через reply-кнопку или команду с проверкой timestamp:
```
trigger → read pilot → set now_ts (timestamp) → condition (last_daily is_empty OR now_ts > last_daily + 86400)
  → update (credits +500, last_daily = now_ts) → msg "Бонус получен!"
  → else → msg "Бонус ещё не готов, осталось: {remaining}"
```
