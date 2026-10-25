# delete_message — Удалить сообщение

Удаляет одно или несколько сообщений в чате. Поддерживает удаление текущего сообщения, последнего сообщения бота, последних N сообщений, по конкретному ID или массиву ID.

```json
{
  "id": "del-1",
  "type": "delete_message",
  "position": { "x": 400, "y": 200 },
  "data": {
    "messageIdSource": "current_message",
    "messageIdManual": "",
    "lastNCount": "",
    "chatIdSource": "current_chat",
    "chatIdManual": "",
    "ignoreErrors": true,
    "bulkDelete": false,
    "bulkMessageIdsVariable": "",
    "enableAutoTransition": true,
    "autoTransitionTo": "next-node-id"
  }
}
```

**Поля data:**

| Поле | Тип | Описание |
|------|-----|----------|
| `messageIdSource` | `"current_message"` / `"last_bot_message"` / `"reply_message"` / `"range_from_reply"` / `"last_n"` / `"custom"` | Какое сообщение удалить |
| `messageIdManual` | string | ID или `{переменная}` — для режима `custom` |
| `lastNCount` | string | Количество — для режима `last_n` (число или `{переменная}`) |
| `chatIdSource` | `"current_chat"` / `"custom"` | В каком чате удалять |
| `chatIdManual` | string | ID чата или `{переменная}` — для режима `custom` |
| `ignoreErrors` | boolean | Не прерывать сценарий если сообщение не найдено |
| `bulkDelete` | boolean | Массовое удаление из переменной-массива |
| `bulkMessageIdsVariable` | string | Имя переменной с JSON-массивом message_id |
| `autoTransitionTo` | string | ID следующего узла |

**Примеры использования:**

Удалить последние 50 сообщений:
```json
{ "messageIdSource": "last_n", "lastNCount": "50" }
```

Удалить по ID из переменной:
```json
{ "messageIdSource": "custom", "messageIdManual": "{saved_msg_id}" }
```

Массовое удаление:
```json
{ "bulkDelete": true, "bulkMessageIdsVariable": "old_message_ids" }
```

**Ограничения Telegram:** бот удаляет чужие сообщения только в группах (нужны права админа). Сообщения старше 48 часов удалить нельзя. В личных чатах — только свои.

---
