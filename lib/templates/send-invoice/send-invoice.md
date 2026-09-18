# Счёт в звёздах (`send_invoice`)

Узел выставляет счёт на оплату звёздами в текущий чат.

## Параметры Entry

| Поле | Описание |
|------|----------|
| `nodeId` | ID узла |
| `title` | Название товара |
| `description` | Описание |
| `amount` | Цена в звёздах (строка, `{переменные}`) |
| `photoUrl` | URL / `/uploads/…` / `{переменная}`; `/uploads/` → `API_BASE_URL` + путь |
| `payload` | Скрытая метка (по умолчанию id узла) |
| `savePaymentAmountTo` | Переменная для суммы |
| `savePaymentChargeIdTo` | Переменная для кода покупки |
| `autoTransitionTo` | Узел после оплаты |
| `hasKeyboard` | Есть ли привязанная inline-клавиатура |
| `buttons` | Кнопки (первая — `pay`) |

## Поведение

1. `handle_callback_{id}` вызывает `answer_invoice` с `currency="XTR"` и пустым токеном кассы.
2. Если есть клавиатура — передаёт `reply_markup` с `pay=True` на первой кнопке.
3. Переход **не** выполняется после отправки счёта.
4. Глобальный `pre_checkout_query` отвечает `ok=True`.
5. `successful_payment` сохраняет переменные и вызывает следующий узел.

## API

```ts
import { generateSendInvoiceHandlers } from './send-invoice';

const code = generateSendInvoiceHandlers(nodes);
```
