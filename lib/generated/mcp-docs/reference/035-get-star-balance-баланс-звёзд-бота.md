# get_star_balance — баланс звёзд бота

Bot API `getMyStarBalance`. Баланс **бота**, не пользователя. Целое `amount` → переменная. Два выхода: успех / ошибка.

```json
{
  "type": "get_star_balance",
  "data": {
    "saveStarBalanceTo": "star_balance",
    "ignoreErrors": false,
    "balanceMsgError": "Не удалось получить баланс звёзд",
    "autoTransitionTo": "msg_bal",
    "enableAutoTransition": true,
    "balanceErrorTarget": "msg_err",
    "keyboardType": "none",
    "buttons": []
  }
}
```

| Поле | Описание |
|------|----------|
| `saveStarBalanceTo` | Переменная для целого amount (дефолт `star_balance`) |
| `autoTransitionTo` | Успех |
| `balanceErrorTarget` | Ошибка API |
| `ignoreErrors` | После текста ошибки идти на успех, если задан |

Цепочка: `/balance` → `get_star_balance` → `message` с `{star_balance}`.
