# edit_star_subscription — управление автопродлением

Bot API `editUserStarSubscription`. Не путать с `refund_stars` и с галкой `invoiceSubscription` на ссылке.
Три выхода: успех / пустой код / ошибка. `subscriptionAction`: `cancel` → `is_canceled=True`, `enable` → `False`.

```json
{
  "type": "edit_star_subscription",
  "data": {
    "subscriptionUserSource": "current_user",
    "subscriptionUserId": "",
    "subscriptionChargeId": "{payment_charge_id}",
    "subscriptionAction": "cancel",
    "ignoreErrors": false,
    "subscriptionMsgEmpty": "Укажите код покупки подписки",
    "subscriptionMsgError": "Не удалось изменить автопродление. Проверьте код покупки.",
    "autoTransitionTo": "msg_done",
    "enableAutoTransition": true,
    "subscriptionEmptyTarget": "msg_empty",
    "subscriptionErrorTarget": "msg_err",
    "keyboardType": "none",
    "buttons": []
  }
}
```

| Поле | Описание |
|------|----------|
| `subscriptionAction` | `"cancel"` \| `"enable"` |
| `subscriptionChargeId` | Код покупки подписки |
| `autoTransitionTo` | Успех |
| `subscriptionEmptyTarget` / `subscriptionErrorTarget` | Ошибки |

Цепочка: `/cancel_sub` → `edit_star_subscription` → `message`.
