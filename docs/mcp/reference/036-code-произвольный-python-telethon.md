# code — произвольный Python (Telethon)

Пишите **тело async-функции** с `await` (без своего `async def`). Переменные пользователя доступны по имени. `client` и `userbot_client` — тот же Telethon-клиент, что у узлов юзербота.

```json
{
  "type": "code",
  "data": {
    "code": "msgs = await client.get_messages(entity, limit=1)\nresult_text = msgs[0].message if msgs else \"\"",
    "autoTransitionTo": "next_node_id",
    "enableAutoTransition": true
  }
}
```

| Поле | Описание |
|------|----------|
| `code` | Async-тело Python |
| `autoTransitionTo` | ID следующего узла |
| `enableAutoTransition` | Обязательно `true` вместе с autoTransitionTo |

#### Что доступно в namespace

| Имя | Что это |
|-----|---------|
| `client`, `userbot_client` | Telethon-клиент юзербота (тот же, что у userbot-узлов) |
| `bot` | Экземпляр aiogram `Bot` — можно править сообщения самого бота |
| `dp` | Dispatcher aiogram — можно один раз зарегистрировать свои callback-хендлеры |
| `user_id` | ID текущего пользователя |
| `user_data` | Словарь переменных **текущего** пользователя |
| `all_user_data` | Словарь всех пользователей: `all_user_data[user_id]` |
| `set_user_var` | Функция записи переменной пользователя |
| `callback_query`, `state` | Объекты aiogram текущего апдейта (могут быть `None`) |
| `asyncio`, `json`, `re`, `math`, `datetime`, `logging`, `Button`, `events` | Предзагруженные модули |

Переменные пользователя доступны просто по имени, без `user_data[...]`.

#### Как возвращать результат

Присвойте значение переменной на верхнем уровне кода — она автоматически запишется в переменные пользователя:

```python
lucky_payment = 8942
```

Внутри **вложенных функций** присваивание в локальную переменную наружу не попадёт. Пишите напрямую в `_ns`:

```python
async def _worker():
    _ns['lucky_payment'] = 8942   # так значение сохранится
```

`set_user_var` внутри вложенных функций вызывать нельзя — используйте `_ns[...]`.

#### Прогрессбар из кода

`bot` в namespace позволяет обновлять сообщение по ходу выполнения — удобно для долгих опросов:

```python
await bot.edit_message_text('Опрашиваю… 3/15', chat_id=chat_id,
                            message_id=progress_msg_id, parse_mode='HTML')
```

#### Ограничения

- Таймаут 180 с на весь код узла.
- Вызовы Telethon требуют `USERBOT_*` в окружении.
- RestrictedPython нет (self-hosted) — код исполняется как есть.
- Имена, начинающиеся с `_`, и предзагруженные модули в переменные пользователя не пишутся.
- `asyncio.wait_for` начинает отсчёт сразу: если задачи стоят в очереди семафора, таймаут выгорит на ожидании. Ставьте `wait_for` **внутри** воркера, а не вокруг всей очереди.
