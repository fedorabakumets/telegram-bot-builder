# userbot_message — Сообщение через юзербот (Telethon)

Отправляет сообщение от аккаунта пользователя через Telethon MTProto.

```json
{
  "id": "ub-msg-1",
  "type": "userbot_message",
  "position": { "x": 400, "y": 200 },
  "data": {
    "messageText": "Привет, {user_name}!",
    "formatMode": "html",
    "userbotEntity": "@target_channel",
    "userbotRecipients": ["@channel1", "{chat_id}", "-1001234567890"],
    "attachedMedia": [],
    "disableLinkPreview": false,
    "saveMessageIdTo": "",
    "autoTransitionTo": ""
  }
}
```

| Поле | Тип | Описание |
|------|-----|----------|
| `messageText` | string | Текст сообщения (поддерживает {переменные} и HTML) |
| `formatMode` | "html" \| "markdown" \| "none" | Режим форматирования |
| `userbotEntity` | string | Основной получатель (обратная совместимость) |
| `userbotRecipients` | string[] | Список получателей (@username, ID, {переменная}) |
| `attachedMedia` | string[] | Медиафайлы (/uploads/... или URL) |
| `disableLinkPreview` | boolean | Отключить превью ссылок |
| `saveMessageIdTo` | string | Переменная для сохранения ID сообщения |
| `saveResponseIdTo` | string | Переменная для сохранения ID ответного сообщения от получателя |
| `saveResponseTextTo` | string | Переменная для сохранения текста ответного сообщения |
| `saveButtonsTo` | string | Переменная для сохранения кнопок ответа как JSON-массив `[{text, type, data?, url?}]` |
| `autoTransitionTo` | string | ID узла для автоперехода |

**Примечания:**
- Кнопки не поддерживаются (ограничение Telegram для user-аккаунтов)
- File_id от Bot API не работает в Telethon — используйте /uploads/ или URL
- Между получателями автоматическая пауза 2 секунды (защита от FloodWait)
- Текст и entity поддерживают горячую перезагрузку через таблицу _content

---
