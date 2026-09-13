# successful_payment_trigger

Триггер оплаты звёздами вне цепочки текущего `send_invoice`.

## Роутер

Один `@dp.message(F.successful_payment)` в `send-invoice.py.jinja2`:

1. payload в `_stars_payment_targets` → выход счёта
2. иначе первый подходящий триггер (`exact` → `starts_with` → `all`)
3. иначе warn и выход

## Поля

| Поле | Описание |
|------|----------|
| `payloadFilter` | `all` / `exact` / `starts_with` |
| `payloadValue` | метка для exact / starts_with |
| `savePaymentAmountTo` | переменная суммы |
| `savePaymentChargeIdTo` | переменная кода покупки |
| `autoTransitionTo` | следующий узел (`trigger-next`) |
