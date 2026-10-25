# kick_user — Исключить пользователя

Исключает пользователя из группы (может вернуться по ссылке). Использует `unbanChatMember(only_if_banned=False)`.

```json
{
  "id": "kick-1",
  "type": "kick_user",
  "position": { "x": 400, "y": 300 },
  "data": {
    "userIdSource": "current_user",
    "userIdManual": "",
    "chatIdSource": "current_chat",
    "chatIdManual": "",
    "ignoreErrors": true,
    "enableAutoTransition": true,
    "autoTransitionTo": "msg-done"
  }
}
```

| Поле | Тип | Описание |
|------|-----|----------|
| `userIdSource` | "current_user" \| "reply_user" \| "custom" | Откуда брать ID пользователя |
| `userIdManual` | string | ID или {переменная} (для режима custom) |
| `chatIdSource` | "current_chat" \| "custom" | Откуда брать ID чата |
| `chatIdManual` | string | ID чата или {переменная} (для режима custom) |
| `ignoreErrors` | boolean | Не прерывать сценарий при ошибке |
| `autoTransitionTo` | string | ID узла для автоперехода |

---
