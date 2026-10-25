# Поля incoming_message_trigger

```json
{
  "type": "incoming_message_trigger",
  "data": {
    "imtChatTypeFilter": "group",
    "imtGroupChatId": "2300967595",
    "imtGroupChatIdSource": "manual",
    "imtStopOnFlag": true,
    "autoTransitionTo": "guard_handler_node"
  }
}
```

| Поле | Описание |
|------|----------|
| `imtChatTypeFilter` | `"any"` / `"private"` / `"group"` — фильтр типа чата |
| `imtGroupChatId` | ID группы без префикса `-100` (при `imtChatTypeFilter: "group"`) |
| `imtGroupChatIdSource` | `"manual"` — из `imtGroupChatId`, `"variable"` — из `groupChatVariableName` |
| `groupChatVariableName` | Имя переменной с ID группы (при `imtGroupChatIdSource: "variable"`) |
| `imtStopOnFlag` | По умолчанию `true`. Учитывать флаг `_stop_processing` от узла `stop_processing` |
| `autoTransitionTo` | ID целевого узла |

Пример охраны группы: `incoming_message_trigger` (фильтр group + chat id) → `stop_processing` → дальнейшая логика.
