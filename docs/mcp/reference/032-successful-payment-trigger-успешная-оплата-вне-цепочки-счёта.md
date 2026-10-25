# successful_payment_trigger — успешная оплата (вне цепочки счёта)

Ловит оплату звёздами, если payload **нет** в `_stars_payment_targets` текущей сессии (ссылка, старый счёт). Один общий `successful_payment` с `send_invoice` / `create_invoice_link`: сначала счёт/ссылка, иначе триггер. Фильтры проверяются в порядке `exact` → `starts_with` → `all`. Без счёта/ссылки хендлер всё равно генерируется при наличии триггера, но `pre_checkout` — нет. Для `/paysupport` и `/terms` используйте обычные `command_trigger` + `message`.

```json
{
  "type": "successful_payment_trigger",
  "data": {
    "payloadFilter": "starts_with",
    "payloadValue": "donate_",
    "savePaymentAmountTo": "payment_amount",
    "savePaymentChargeIdTo": "payment_charge_id",
    "autoTransitionTo": "msg_outside_pay",
    "enableAutoTransition": false
  }
}
```

| Поле | Описание |
|------|----------|
| `payloadFilter` | `"all"` / `"exact"` / `"starts_with"` |
| `payloadValue` | Метка для exact / starts_with |
| `savePaymentAmountTo` | Переменная суммы |
| `savePaymentChargeIdTo` | Переменная кода покупки |
| `autoTransitionTo` | Следующий узел (у триггеров `enableAutoTransition` не обязателен) |
