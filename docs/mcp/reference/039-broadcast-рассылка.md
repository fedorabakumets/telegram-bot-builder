# broadcast — рассылка

```json
{
  "type": "broadcast",
  "data": {
    "messageText": "Текст рассылки",
    "autoTransitionTo": "next_node_id"
  }
}
```

При `BOT_RUNTIME_ENABLED` и заданном `BOT_DATABASE_URL` сессия Client API берётся из `USERBOT_*` этого токена, без чтения `user_telegram_settings`. Переменные `tg_api_id`, `tg_api_hash`, `tg_session` и `tg_is_active` тоже читаются из этих переменных. Без флага остаётся запрос к `user_telegram_settings`.

---
