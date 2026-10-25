# Поля member_trigger

```json
{
  "type": "member_trigger",
  "data": {
    "memberEventType": "join",
    "groupChatId": "2300967595",
    "groupChatIdSource": "manual",
    "saveJoinedUserIdTo": "joined_user_id",
    "saveJoinedUsernameTo": "joined_username",
    "saveLeftUserIdTo": "left_user_id",
    "saveLeftUsernameTo": "left_username",
    "autoTransitionTo": "welcome_node"
  }
}
```

| Поле | Описание |
|------|----------|
| `memberEventType` | `"join"` / `"leave"` / `"both"` |
| `groupChatId` | Опциональный фильтр по ID группы (без `-100`) |
| `groupChatIdSource` | `"manual"` / `"variable"` |
| `groupChatVariableName` | Переменная с ID группы (при `groupChatIdSource: "variable"`) |
| `saveJoinedUserIdTo` | Переменная для ID вошедшего (по умолчанию `joined_user_id`) |
| `saveJoinedUsernameTo` | Переменная для username вошедшего |
| `saveLeftUserIdTo` | Переменная для ID вышедшего |
| `saveLeftUsernameTo` | Переменная для username вышедшего |
| `autoTransitionTo` | ID следующего узла |
