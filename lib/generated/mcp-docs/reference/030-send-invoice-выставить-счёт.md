# send_invoice — выставить счёт

Счёт в чат. Валюта `invoiceCurrency`: `XTR` (дефолт, `provider_token=""`) или любой ISO 4217 из [Supported Currencies](https://core.telegram.org/bots/payments#supported-currencies) (нужен токен провайдера). `autoTransitionTo` срабатывает **после оплаты**, не после `answer_invoice`. Ссылка на оплату — отдельный тип `create_invoice_link`.

Токен при фиате: `invoiceProviderSource` = `inline` → `invoiceProviderToken` в data (удобно для теста; попадёт в project.json и код) или `env` → `os.getenv(invoiceProviderTokenEnv)` (рекомендуется для продакшена). Пустой токен при фиате — лог и сообщение пользователю, счёт не шлётся.

Можно привязать узел `keyboard` через `keyboardNodeId` (как у `message`). Первая кнопка клавиатуры обязана быть `"action": "pay"` (текст вроде «Оплатить ⭐»). Остальные кнопки — обычные (`goto`, `url`…). **При добавлении с холста** рядом сразу создаётся `keyboard` с одной кнопкой pay. Через MCP встроенные кнопки на `send_invoice` выносятся в `keyboard` (hoist). Без клавиатуры Телеграм сам покажет оплату. Тип `pay` нельзя ставить на клавиатуры обычных сообщений.

```json
{
  "type": "send_invoice",
  "data": {
    "invoiceTitle": "Доступ на месяц",
    "invoiceDescription": "Оплата звёздами",
    "invoiceAmount": "100",
    "invoiceCurrency": "XTR",
    "invoiceProviderSource": "inline",
    "invoiceProviderToken": "",
    "invoiceProviderTokenEnv": "PAYMENT_PROVIDER_TOKEN",
    "invoicePhotoUrl": "",
    "invoicePayload": "",
    "invoiceNeedName": false,
    "invoiceNeedEmail": false,
    "invoiceNeedPhone": false,
    "savePaymentAmountTo": "paid_stars",
    "savePaymentChargeIdTo": "payment_charge_id",
    "saveOrderNameTo": "",
    "saveOrderEmailTo": "",
    "saveOrderPhoneTo": "",
    "autoTransitionTo": "msg_thanks",
    "enableAutoTransition": true,
    "keyboardNodeId": "kbd_invoice",
    "keyboardType": "none",
    "buttons": []
  }
}
```

Пример кнопок у связанной клавиатуры:

```json
{
  "type": "keyboard",
  "data": {
    "keyboardType": "inline",
    "buttons": [
      { "id": "pay1", "text": "Оплатить ⭐", "action": "pay" },
      { "id": "cancel1", "text": "Отмена", "action": "goto", "target": "msg_cancel" }
    ]
  }
}
```

| Поле | Описание |
|------|----------|
| `invoiceTitle` | Название, 1–32 |
| `invoiceDescription` | Описание, 1–255 |
| `invoiceAmount` | Fallback цены, если `invoicePrices` пуст; XTR — целые звёзды; фиат — минорные единицы; `{переменные}` |
| `invoicePrices` | Массив `{ id, label, amount }` → несколько `LabeledPrice`; пусто = одна строка из `invoiceAmount`. Для **XTR** в API ровно одна позиция |
| `invoiceCurrency` | `XTR` или код из Bot Payments (EUR, RUB, USD, GBP, UAH, …); также `{переменная}` — код подставится в runtime |
| `invoiceProviderSource` | `inline` \| `env` (игнор при XTR) |
| `invoiceProviderToken` | Токен в ноде при `inline` |
| `invoiceProviderTokenEnv` | Имя env-ключа при `env` (дефолт `PAYMENT_PROVIDER_TOKEN`) |
| `invoicePhotoUrl` | Картинка: `https://…`, `/uploads/…` или `{var}`; для uploads бот склеит с `API_BASE_URL` |
| `invoicePhotoSize` / `Width` / `Height` | Опциональные размеры фото для API |
| `invoicePayload` | Скрытая метка; пусто = id узла |
| `invoiceProtectContent` | `protect_content` на этом счёте |
| `invoiceStartParameter` | `start_parameter` (deep-link) |
| `invoiceNeedName` / `Email` / `Phone` | Запросить имя/email/телефон (**только фиат**) |
| `invoiceNeedShipping` / `invoiceIsFlexible` | Адрес доставки / гибкая цена (**только фиат**; плюс runtime `shop_need_shipping`) |
| `invoiceMaxTipAmount` / `invoiceSuggestedTipAmounts` | Чаевые: число и строка `"10,20,50"` → массив (**только фиат**) |
| `invoiceProviderData` | Сырой `provider_data` (+ `{переменные}`) |
| `invoiceSendPhoneToProvider` / `SendEmailToProvider` | Передать контакты провайдеру (**только фиат**) |
| `invoiceMessageThreadId` / `invoiceDirectMessagesTopicId` | Тема форума / DM-топик (супергруппа) |
| `invoiceDisableNotification` / `invoiceReplyToMessageId` | Тихая отправка / ответ на message_id |
| `invoiceMessageEffectId` / `invoiceAllowPaidBroadcast` | Эффект в ЛС / платный broadcast |
| `invoiceSuggestedPostParams` | JSON для `suggested_post_parameters` |
| `savePaymentAmountTo` | Куда сохранить сумму |
| `savePaymentChargeIdTo` | Куда сохранить код покупки (для возврата позже) |
| `saveOrderNameTo` / `EmailTo` / `PhoneTo` | После оплаты ← `order_info` (пусто = не писать) |
| `keyboardNodeId` | Опционально: id узла `keyboard` со счётом |
| `autoTransitionTo` | Узел после успешной оплаты (`enableAutoTransition: true`) |
| `preCheckoutMode` | `always` (дефолт, поле можно не писать) — `pre_checkout` всегда `ok=True`. `condition` — отказ до списания |
| `preCheckoutVariable` | Имя переменной пользователя для `condition` |
| `preCheckoutOperator` | Как у `condition`, только по переменной: `filled`, `empty`, `equals`, `not_equals`, `contains`, `not_contains`, `starts_with`, `ends_with`, `matches_regex`, `greater_than`, `less_than`, `between`, `is_even`, `is_odd`, `divisible_by`. Не `is_private` / подписка / `else` |
| `preCheckoutValue` / `preCheckoutValue2` | Значение сравнения (`value2` только для `between`). Допускает `{переменные}` |
| `preCheckoutErrorMessage` | Текст `error_message` при ложном условии, `{переменные}`, до 200 знаков. Пусто → «Оплата сейчас недоступна» |

Отказ решается сразу в `pre_checkout` (лимит Telegram 10 секунд), без узла `input`. Условие истинно → `ok=True`, дальше обычная оплата и `autoTransitionTo`. Ложно → `ok=False`. Несколько счетов: правило по payload (сначала цель этой сессии, иначе статическая метка без `{переменных}`). Метка вида `order_{id}` проверяется в том же запуске бота после создания счёта. Неизвестный оператор не отказывает.

```json
"preCheckoutMode": "condition",
"preCheckoutVariable": "can_pay",
"preCheckoutOperator": "equals",
"preCheckoutValue": "yes",
"preCheckoutErrorMessage": "Оплата недоступна: {reason}"
```

Типичная цепочка: `command_trigger` `/buy` → `send_invoice` → (после оплаты) `message` «спасибо».  
Подписка 30 дней у `send_invoice` **недоступна** (Telegram: `SUBSCRIPTION_EXPORT_MISSING`) — только `create_invoice_link` + `invoiceSubscription` и только при `XTR`.
