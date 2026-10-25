# refund_stars — вернуть звёзды

Возврат покупки в этом боте через `refundStarPayment`.
Четыре выхода на холсте: успех + пустой код + не найден + уже возвращён.
Если выход ошибки подключён — только переход (текст рисует `message`).
Если нет — `answer(refundMsg*)`; при `ignoreErrors` после текста — на `autoTransitionTo`. Без `raise`.

```json
{
  "type": "refund_stars",
  "data": {
    "refundUserSource": "current_user",
    "refundUserId": "",
    "refundChargeId": "{payment_charge_id}",
    "ignoreErrors": false,
    "refundMsgEmpty": "Пожалуйста, укажите код покупки: /back КОД",
    "refundMsgNotFound": "Такой код покупки не найден. Проверьте данные и попробуйте снова.",
    "refundMsgAlreadyRefunded": "За эту покупку уже ранее был произведён возврат.",
    "autoTransitionTo": "msg_refunded",
    "enableAutoTransition": true,
    "refundEmptyTarget": "msg_empty",
    "refundNotFoundTarget": "msg_not_found",
    "refundAlreadyRefundedTarget": "msg_already",
    "keyboardType": "none",
    "buttons": []
  }
}
```

| Поле | Описание |
|------|----------|
| `refundUserSource` | `"current_user"` или `"custom"` |
| `refundUserId` | ID / `{var}` при `custom` |
| `refundChargeId` | Код покупки (`telegram_payment_charge_id`) |
| `autoTransitionTo` | Успех (`enableAutoTransition: true`) |
| `refundEmptyTarget` | Выход «Пустой код» |
| `refundNotFoundTarget` | Выход «Код не найден» / прочие |
| `refundAlreadyRefundedTarget` | Выход «Уже возвращён» |
| `refundMsg*` | Fallback-тексты, если выход не подключён |
| `ignoreErrors` | Без выхода ошибки — после текста идти на успех |

Цепочки: `/back КОД` → `refund_stars` → сообщения по выходам; демо: `send_invoice` (1⭐) → после оплаты `refund_stars`.
