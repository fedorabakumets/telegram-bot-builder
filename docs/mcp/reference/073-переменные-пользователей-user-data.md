# Переменные пользователей (user_data)

Поле `bot_users.user_data` (JSONB) хранит все пользовательские переменные бота:

```json
{
  "user_age": "25",
  "user_bio": "текст",
  "utm_source": "direct",
  "score": "150"
}
```

Доступ в сценарии: `{user_age}`, `{user_bio}` и т.д.

Служебные ключи (не показываются в UI): `_*`, `waiting_*`, `input_*`.

---
