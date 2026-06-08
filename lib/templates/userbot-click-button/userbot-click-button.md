# Шаблон userbot-click-button

## Описание

Генерирует Python-код для нажатия inline-кнопки через Telethon userbot.
Поддерживает поиск кнопки по тексту, callback_data или индексу (row, col).
Сохраняет alert, текст обновлённого сообщения, кнопки (JSON), медиа.

## Параметры

| Параметр | Тип | Обязательный | Описание |
|----------|-----|:---:|-----------|
| `nodeId` | string | ✅ | Уникальный ID узла |
| `userbotEntity` | string | — | Entity чата (@username, ID, {переменная}) |
| `messageId` | string | — | ID сообщения с кнопками ({переменная} или число) |
| `clickMode` | 'text' \| 'data' \| 'index' | — | Способ поиска кнопки (по умолчанию 'text') |
| `clickValue` | string | — | Текст кнопки / callback_data / "row, col" |
| `saveAlertTo` | string | — | Переменная для alert от бота |
| `saveResultTo` | string | — | Переменная для текста обновлённого сообщения |
| `saveButtonsTo` | string | — | Переменная для JSON массива кнопок |
| `saveHasMediaTo` | string | — | Переменная для флага наличия медиа |
| `saveMediaTo` | string | — | Переменная для медиа-объекта (пересылка) |
| `clickDelivery` | 'fire_and_forget' \| 'await' | — | Способ отправки клика (по умолчанию fire_and_forget) |
| `autoTransitionTo` | string | — | ID узла для автоперехода |
| `projectId` | number \| null | — | ID проекта (для get_content) |

## Пример входных данных

```json
{
  "nodeId": "ub-click-1",
  "userbotEntity": "@target_bot",
  "messageId": "{last_msg_id}",
  "clickMode": "text",
  "clickValue": "Играть",
  "saveAlertTo": "alert_text",
  "saveResultTo": "new_text",
  "saveButtonsTo": "buttons_json",
  "saveHasMediaTo": "has_media",
  "saveMediaTo": "media_obj",
  "autoTransitionTo": "next-node",
  "projectId": 1
}
```

## Пример выходного Python-кода

```python
@dp.callback_query(lambda c: c.data == "ub-click-1")
async def handle_callback_ub_click_1(callback_query, state=None):
    user_id = callback_query.from_user.id

    all_user_vars = await init_all_user_vars(user_id)
    _entity = replace_variables_in_text(get_content("ub-click-1.entity", "@target_bot"), all_user_vars, {})
    _msg_id = int(replace_variables_in_text(get_content("ub-click-1.msg_id", "{last_msg_id}"), all_user_vars, {}))
    _click_val = replace_variables_in_text(get_content("ub-click-1.click_val", "Играть"), all_user_vars, {})

    _msg = await userbot_client.get_messages(_target, ids=_msg_id)

    # Поиск кнопки вручную
    _click_btn = None
    for _row in _msg.reply_markup.rows:
        for _btn in _row.buttons:
            if hasattr(_btn, 'text') and _click_val in _btn.text:
                _click_btn = _btn
                break

    # Регистрируем event handler ДО нажатия
    _edit_future = asyncio.get_event_loop().create_future()
    @userbot_client.on(events.MessageEdited(chats=_target))
    async def _on_edit(event):
        if event.message.id == _msg_id and not _edit_future.done():
            _edit_future.set_result(event.message)

    # Fire-and-forget: отправляем callback без ожидания ответа
    if _click_btn and _click_btn.data:
        asyncio.create_task(userbot_client(GetBotCallbackAnswerRequest(...)))

    # Ждём edit/new_message event
    _updated = await asyncio.wait_for(_edit_future, timeout=5)

    # Текст, кнопки, медиа
    user_data[user_id]["new_text"] = _updated.text or ''
    user_data[user_id]["buttons_json"] = json.dumps([...])
    user_data[user_id]["has_media"] = "true" if _updated.media else "false"
    user_data[user_id]["media_obj"] = _updated.media
```

## Использование API

```typescript
import { generateUserbotClickButton, generateUserbotClickButtonHandlers } from './userbot-click-button.renderer';

// Одиночная генерация
const code = generateUserbotClickButton({
  nodeId: 'ub-click-1',
  userbotEntity: '@bot',
  messageId: '123',
  clickMode: 'text',
  clickValue: 'Играть',
});

// Генерация для всех узлов
const allCode = generateUserbotClickButtonHandlers(nodes, projectId);
```

## Особенности

- **clickDelivery:** `fire_and_forget` (по умолчанию) — callback в фоне через `create_task`; `await` — `await msg.click()` с ожиданием ответа Telegram (для ботов вроде Vortex)
- **Fire-and-forget нажатие:** при `fire_and_forget` callback отправляется без ожидания — устраняет блокировку на 15+ секунд для медленных ботов
- **Порядок: event handler → click:** event handler регистрируется ДО нажатия кнопки, чтобы не пропустить быстрый ответ бота
- **Три режима поиска:** по тексту кнопки, по callback_data, по индексу (row, col)
- **get_content** — entity, messageId, clickValue берутся из таблицы `_content` с фоллбеком
- **Event-based ожидание** — после fire-and-forget ждём MessageEdited или NewMessage event (с fallback на чтение истории)
- **Медиа-объект** — сохраняется в памяти, можно переслать через `userbot_message`
- **FloodWait** — автоматический retry при ошибке
- **Кнопки JSON** — формат: `[{"text": "Назад", "data": "back"}, {"text": "Ссылка", "url": "https://..."}]`
- **Alert недоступен** — при fire-and-forget подходе alert от бота не сохраняется (переменная будет пустой)
