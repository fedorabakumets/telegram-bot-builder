# Code-нода

## Простыми словами

`code` выполняет пользовательский Python как тело уже созданной async-функции. Не пиши собственный `async def` вокруг кода.

## Пример

```json
{
  "type": "code",
  "data": {
    "code": "answer = float(first_number) + float(second_number)",
    "autoTransitionTo": "result_message",
    "enableAutoTransition": true
  }
}
```

Переменная, присвоенная на верхнем уровне (`answer = ...`), автоматически становится пользовательской переменной следующей ноды и доступна как `{answer}`.

## Доступные имена

Доступны переменные текущего пользователя по имени, `user_data`, `all_user_data`, `set_user_var`, `user_id`, `client`, `userbot_client`, `bot`, `dp`, `callback_query`, `state`, `asyncio`, `json`, `re`, `math`, `datetime`, `logging`, `Button` и `events`.

`client` и `userbot_client` требуют настроенного Telethon Userbot. `callback_query` и `state` могут быть `None`.

## Передача результата

```python
answer = 0
try:
    left = float(first_number)
    right = float(second_number)
    if operation == '+': answer = left + right
    elif operation == '-': answer = left - right
    elif operation == '*': answer = left * right
    elif operation == '/': answer = left / right
except (ValueError, ZeroDivisionError):
    answer = 'Некорректное вычисление'
```

Во вложенной функции локальное присваивание не попадёт в пользовательские переменные. Для этого используй `_ns['answer'] = value`; имена, начинающиеся с `_`, не сохраняются как пользовательские переменные.

## Ограничения

Таймаут одного code-узла — 180 секунд. На self-hosted RestrictedPython не используется: код исполняется с доступными правами среды, поэтому не добавляй опасные операции без явной необходимости. Ошибки и таймауты проверяй по логам.

## Следующий шаг

После code-ноды направь переход на `message` с `{answer}` или на `condition`, затем проверь схему и проект. Не добавляй `generate_bot_code` в обычный workflow без отдельной просьбы.
