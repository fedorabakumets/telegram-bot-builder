# userbot_inline_query — Inline-запрос через юзербот

Выполняет inline-запрос (@bot query) и отправляет результат в чат.

```json
{
  "id": "ub-iq-1",
  "type": "userbot_inline_query",
  "position": { "x": 400, "y": 200 },
  "data": {
    "botUsername": "@scdoo_bot",
    "query": "buy_btc 1",
    "targetChat": "",
    "sendToSameChat": true,
    "resultIndex": "0",
    "saveResultTitleTo": "result_title",
    "saveResultDescTo": "result_desc",
    "saveResponseIdTo": "sent_msg_id",
    "autoTransitionTo": ""
  }
}
```

| Поле | Тип | Описание |
|------|-----|----------|
| `botUsername` | string | Username бота (@bot или {переменная}) |
| `query` | string | Текст inline-запроса |
| `targetChat` | string | Целевой чат (если sendToSameChat=false) |
| `sendToSameChat` | boolean | Отправить в чат с ботом (по умолчанию true) |
| `resultIndex` | string | Индекс результата (0 = первый) |
| `saveResultTitleTo` | string | Переменная для title |
| `saveResultDescTo` | string | Переменная для description |
| `saveResponseIdTo` | string | Переменная для ID сообщения |
| `autoTransitionTo` | string | ID узла для автоперехода |

---
