# Шаблон userbot-message

## Описание

Генерирует Python-код для отправки сообщения через Telethon userbot (аккаунт пользователя, не бот).
Используется параллельно с aiogram-ботом в одном проекте.

## Параметры

| Параметр | Тип | Обязательный | Описание |
|----------|-----|:---:|-----------|
| `nodeId` | string | ✅ | Уникальный ID узла |
| `messageText` | string | — | Текст сообщения (поддерживает {переменные}) |
| `formatMode` | 'html' \| 'markdown' \| 'none' | — | Режим форматирования (по умолчанию 'html') |
| `disableLinkPreview` | boolean | — | Отключить превью ссылок |
| `userbotEntity` | string | — | Получатель: @username, ID, {переменная}, 'me' |
| `attachedMedia` | string[] | — | Медиафайлы (/uploads/... или URL) |
| `saveMessageIdTo` | string | — | Переменная для сохранения ID сообщения |
| `autoTransitionTo` | string | — | ID узла для автоперехода |
| `projectId` | number \| null | — | ID проекта (для get_content) |

## Пример входных данных

```json
{
  "nodeId": "ub-msg-1",
  "messageText": "Привет, {user_name}!",
  "formatMode": "html",
  "userbotEntity": "@target_channel",
  "attachedMedia": ["/uploads/42/photo.jpg"],
  "saveMessageIdTo": "sent_id",
  "autoTransitionTo": "next-node",
  "projectId": 1
}
```

## Пример выходного Python-кода

```python
@dp.callback_query(lambda c: c.data == "ub-msg-1")
async def handle_callback_ub_msg_1(callback_query: types.CallbackQuery, state: FSMContext = None):
    """Обработчик узла ub-msg-1 — отправка через userbot"""
    user_id = callback_query.from_user.id

    try:
        await callback_query.answer()
    except Exception:
        pass

    if user_id not in user_data:
        user_data[user_id] = {}

    text = get_content("ub-msg-1", "Привет, {user_name}!")
    all_user_vars = await init_all_user_vars(user_id)
    text = replace_variables_in_text(text, all_user_vars, {})

    _entity_raw = get_content("ub-msg-1.entity", "@target_channel")
    _entity = replace_variables_in_text(_entity_raw, all_user_vars, {})

    _parse_mode = 'html'

    sent = None
    try:
        _target = int(_entity) if _entity.lstrip('-').isdigit() else _entity
        _media_path = get_upload_file_path("/uploads/42/photo.jpg")
        if os.path.exists(_media_path):
            sent = await userbot_client.send_file(_target, _media_path, caption=text, parse_mode=_parse_mode)
        else:
            sent = await userbot_client.send_message(_target, text, parse_mode=_parse_mode)
    except Exception as _ub_err:
        logging.error(f"Ошибка отправки через userbot: {_ub_err}")

    if sent and hasattr(sent, 'id'):
        user_data[user_id]["sent_id"] = sent.id
        await set_user_var(user_id, "sent_id", sent.id)
```

## Использование API

```typescript
import { generateUserbotMessage, generateUserbotMessageHandlers } from './userbot-message.renderer';

// Одиночная генерация
const code = generateUserbotMessage({
  nodeId: 'ub-msg-1',
  messageText: 'Привет!',
  userbotEntity: '@channel',
  projectId: 1,
});

// Генерация для всех узлов
const allCode = generateUserbotMessageHandlers(nodes, projectId);
```

## Особенности

- **get_content** — текст и entity берутся из таблицы `_content` с фоллбеком на значение из JSON
- **Переменные** — подставляются через `replace_variables_in_text()`
- **Медиа** — поддерживаются локальные файлы (`/uploads/...`) и URL. File_id от Bot API НЕ поддерживается (разные сессии)
- **FloodWait** — автоматический retry при ошибке FloodWaitError
- **Альбомы** — несколько файлов отправляются через `send_file(entity, [file1, file2])`
- **Кнопки** — НЕ поддерживаются (ограничение Telegram для user-аккаунтов)
