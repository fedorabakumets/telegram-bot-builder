# Поля command_trigger

```json
{
  "type": "command_trigger",
  "data": {
    "command": "/start",
    "description": "Запустить бота",
    "showInMenu": true,
    "autoTransitionTo": "nodeId"
  }
}
```

**Команда (`command`):** только латиница `a-z`, цифры и `_` (Telegram Bot API): `/buy`, `/refund`. Кириллица запрещена (`/купить` нельзя). `description` — по-русски.

**Аргументы:** поле `saveCommandArgsTo` — имя переменной для текста после команды. Пример: `/donate 777` → в `{donate_amount}` попадёт `777`.

```json
{
  "type": "command_trigger",
  "data": {
    "command": "/donate",
    "description": "Донат звёздами",
    "saveCommandArgsTo": "donate_amount",
    "autoTransitionTo": "check_amount"
  }
}
```

Цепочка: `command_trigger(/donate)` → `condition(between 1..2500 по donate_amount)` → `send_invoice(invoiceAmount: "{donate_amount}")`.
