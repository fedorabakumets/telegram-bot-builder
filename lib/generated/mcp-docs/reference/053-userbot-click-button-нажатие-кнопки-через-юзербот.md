# userbot_click_button — Нажатие кнопки через юзербот

Нажимает inline-кнопку в сообщении через Telethon userbot.

```json
{
  "id": "ub-click-1",
  "type": "userbot_click_button",
  "position": { "x": 400, "y": 200 },
  "data": {
    "userbotEntity": "@target_bot",
    "messageId": "{response_msg_id}",
    "messageIdSource": "last",
    "clickMode": "text",
    "clickValue": "Играть",
    "saveAlertTo": "alert_text",
    "saveResultTo": "new_message_text",
    "saveButtonsTo": "buttons_json",
    "saveHasMediaTo": "has_media",
    "saveMediaTo": "media_obj",
    "autoTransitionTo": ""
  }
}
```

| Поле | Тип | Описание |
|------|-----|----------|
| `userbotEntity` | string | Чат с кнопками (@username, ID, {переменная}) |
| `messageId` | string | ID сообщения ({переменная} или число) |
| `messageIdSource` | "manual" \| "last" | Источник: конкретный ID или последнее сообщение |
| `clickMode` | "text" \| "data" \| "index" | Способ поиска кнопки |
| `clickValue` | string | Текст / callback_data / "row, col" |
| `saveAlertTo` | string | Переменная для alert |
| `saveResultTo` | string | Переменная для текста после нажатия |
| `saveButtonsTo` | string | Переменная для JSON кнопок |
| `saveHasMediaTo` | string | Переменная для флага медиа |
| `saveMediaTo` | string | Переменная для медиа-объекта |
| `autoTransitionTo` | string | ID узла для автоперехода |

---
