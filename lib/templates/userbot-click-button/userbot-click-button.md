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
    _click_result = await _msg.click(text=_click_val)

    # Alert
    user_data[user_id]["alert_text"] = getattr(_click_result, 'message', '') or ''

    # Перечитываем сообщение
    await asyncio.sleep(1.5)
    _updated = await userbot_client.get_messages(_target, ids=_msg_id)

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

- **Три режима поиска:** по тексту кнопки, по callback_data, по индексу (row, col)
- **get_content** — entity, messageId, clickValue берутся из таблицы `_content` с фоллбеком
- **Задержка 1.5 сек** — после нажатия ждём обновления сообщения ботом
- **Медиа-объект** — сохраняется в памяти, можно переслать через `userbot_message`
- **FloodWait** — автоматический retry при ошибке
- **Кнопки JSON** — формат: `[{"text": "Назад", "data": "back"}, {"text": "Ссылка", "url": "https://..."}]`
