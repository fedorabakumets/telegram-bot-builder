# kick_user — Исключение пользователя из чата

## Описание

Шаблон генерирует Python callback-обработчик, который исключает пользователя из чата
через вызов `bot.unban_chat_member(chat_id, user_id, only_if_banned=False)`.

В Telegram API вызов `unbanChatMember` с `only_if_banned=False` эквивалентен кику —
пользователь удаляется из чата, но не банится и может вернуться по ссылке-приглашению.

## Параметры

| Параметр       | Тип                                      | По умолчанию   | Описание                                      |
|----------------|------------------------------------------|----------------|-----------------------------------------------|
| userIdSource   | `'current_user' \| 'reply_user' \| 'custom'` | `current_user` | Источник ID пользователя для исключения       |
| userIdManual   | `string`                                 | `''`           | ID или `{переменная}` — для режима `custom`   |
| chatIdSource   | `'current_chat' \| 'custom'`             | `current_chat` | Источник ID чата                              |
| chatIdManual   | `string`                                 | `''`           | ID чата или `{переменная}` — для `custom`     |
| ignoreErrors   | `boolean`                                | `true`         | Не прерывать сценарий при ошибке              |

## Пример сгенерированного Python-кода

```python
@dp.callback_query(lambda c: c.data == "kick_node_1")
async def handle_callback_kick_node_1(callback_query: types.CallbackQuery, state: FSMContext = None):
    """Исключение пользователя из чата"""
    try:
        user_id = callback_query.from_user.id
        logging.info(f"👢 kick_user узел kick_node_1 для пользователя {user_id}")

        _chat_id = callback_query.message.chat.id
        _target_user_id = callback_query.from_user.id

        # Исключаем пользователя (unbanChatMember с only_if_banned=False = кик)
        await bot.unban_chat_member(chat_id=_chat_id, user_id=_target_user_id, only_if_banned=False)
        logging.info(f"👢 kick_user kick_node_1: пользователь {_target_user_id} исключён из чата {_chat_id}")

        await handle_callback_next_node(callback_query, state=None)

    except Exception as _e:
        logging.error(f"Ошибка в kick_user kick_node_1: {_e}")
        await handle_callback_next_node(callback_query, state=None)
```
