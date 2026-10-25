# create_invoice_link — ссылка на счёт

Отдельный узел (не режим `send_invoice`). Bot API `createInvoiceLink`: те же `invoiceCurrency` / токен провайдера. URL в `saveInvoiceLinkTo`, сразу `autoTransitionTo`, после оплаты — `afterPaymentTo` (или `successful_payment_trigger`). Без pay-клавиатуры. `pre_checkout` генерируется, если есть `send_invoice` **или** `create_invoice_link`. **Единственный** способ подписки Stars: `invoiceSubscription: true` при `invoiceCurrency: "XTR"`.

При фиате (`invoiceCurrency != XTR`) runtime читает те же переменные магазина, что и `send_invoice`: `shop_need_name` / `shop_need_email` / `shop_need_phone` / `shop_need_shipping` / `shop_need_photo` (+ `shop_photo_url`). UX ссылки: после `create_invoice_link` — `message` **без** голого URL в тексте + inline-кнопка `action: "url"`, `url: "{invoice_url}"` (например «Оплатить»).

```json
{
  "type": "create_invoice_link",
  "data": {
    "invoiceTitle": "Доступ",
    "invoiceDescription": "Оплата по ссылке",
    "invoiceAmount": "50",
    "invoiceCurrency": "XTR",
    "invoiceSubscription": false,
    "invoicePhotoUrl": "",
    "invoicePayload": "",
    "saveInvoiceLinkTo": "invoice_url",
    "savePaymentAmountTo": "paid_stars",
    "savePaymentChargeIdTo": "payment_charge_id",
    "autoTransitionTo": "msg_with_link",
    "enableAutoTransition": true,
    "afterPaymentTo": "msg_thanks"
  }
}
```

| Поле | Описание |
|------|----------|
| `invoiceCurrency` / токен | Как у `send_invoice` |
| `invoiceSubscription` | `true` → `subscription_period: 2592000` (подписка 30 дней, **только XTR**). Нельзя через `send_invoice` |
| `invoicePrices` / tips / shipping / provider_data / photo sizes / send_*_to_provider | Как у `send_invoice` (где есть в Bot API `createInvoiceLink`; **нет** protect/start_parameter/thread/silent/reply) |
| `invoiceNeed*` / `saveOrder*To` | Как у `send_invoice` (только фиат) |
| `saveInvoiceLinkTo` | Переменная под URL (`https://t.me/$…`) |
| `autoTransitionTo` | Сразу после создания ссылки |
| `afterPaymentTo` | После оплаты по этой ссылке (в текущей сессии) |
| `preCheckoutMode` и соседние поля | Как у `send_invoice`: общий `pre_checkout`, выбор правила по `invoicePayload` |

Цепочка: `/buy` → `create_invoice_link` → `message` «Нажмите кнопку, чтобы оплатить» + url-кнопка `{invoice_url}` (не показывать голый URL в тексте).
