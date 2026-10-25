# 10. messageSendRecipients: отправка сообщения другим пользователям

Поле `messageSendRecipients` в message-ноде позволяет отправить сообщение дополнительным получателям (помимо текущего пользователя):

```json
{
  "type": "message",
  "data": {
    "messageText": "Уведомление для вас!",
    "messageSendRecipients": [
      { "id": "r1", "type": "chat_id", "chatId": "{target_user_id}" }
    ]
  }
}
```

Типы: `"user"`, `"chat_id"`, `"admin_ids"`. Поле `chatId` поддерживает переменные.
