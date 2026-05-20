# Шаблон userbot-inline-query

## Описание

Генерирует Python-код для выполнения inline-запроса через Telethon userbot.
Делает `inline_query` к указанному боту, выбирает результат по индексу,
отправляет его в целевой чат через `.click()`.
Сохраняет title, description результата и ID отправленного сообщения в переменные.

## Параметры

| Параметр | Тип | Обязательный | Описание |
|----------|-----|:---:|-----------|
| `nodeId` | string | ✅ | Уникальный ID узла |
| `botUsername` | string | — | Username бота для inline-запроса (@bot или {переменная}) |
| `query` | string | — | Текст inline-запроса |
| `targetChat` | string | — | Целевой чат для отправки результата (@username, ID, {переменная}) |
| `sendToSameChat` | boolean | — | Отправить в тот же чат что и botUsername (по умолчанию true) |
| `resultIndex` | string | — | Индекс результата: 0 = первый (по умолчанию '0') |
| `saveResultTitleTo` | string | — | Переменная для title выбранного результата |
| `saveResultDescTo` | string | — | Переменная для description выбранного результата |
| `saveResponseIdTo` | string | — | Переменная для ID отправленного сообщения |
| `autoTransitionTo` | string | — | ID узла для автоперехода |
| `projectId` | number \| null | — | ID проекта (для get_content) |

## Пример входных данных

```json
{
  "nodeId": "ub-iq-1",
  "botUsername": "@inline_games_bot",
  "query": "dice",
  "targetChat": "@my_channel",
  "sendToSameChat": false,
  "resultIndex": "0",
  "saveResultTitleTo": "game_title",
  "saveResultDescTo": "game_desc",
  "saveResponseIdTo": "sent_msg_id",
  "autoTransitionTo": "next-node",
  "projectId": 1
}
```

## Пример выходного Python-кода

```python
@dp.callback_query(lambda c: c.data == "ub-iq-1")
async def handle_callback_ub_iq_1(callback_query, state=None):
    user_id = callback_query.from_user.id

    all_user_vars = await init_all_user_vars(user_id)
    _bot = replace_variables_in_text(get_content("ub-iq-1.bot", "@inline_games_bot"), all_user_vars, {})
    _query = replace_variables_in_text(get_content("ub-iq-1.query", "dice"), all_user_vars, {})
    _target_chat = replace_variables_in_text(get_content("ub-iq-1.target", "@my_channel"), all_user_vars, {})

    _results = await userbot_client.inline_query(_bot, _query)
    _result = _results[0]

    # Сохраняем title и description
    user_data[user_id]["game_title"] = getattr(_result, 'title', '') or ''
    user_data[user_id]["game_desc"] = getattr(_result, 'description', '') or ''

    # Отправляем результат в целевой чат
    _sent = await _result.click(_target)

    # Сохраняем ID сообщения
    user_data[user_id]["sent_msg_id"] = _sent.id
```

## Использование API

```typescript
import { generateUserbotInlineQuery, generateUserbotInlineQueryHandlers } from './userbot-inline-query.renderer';

// Одиночная генерация
const code = generateUserbotInlineQuery({
  nodeId: 'ub-iq-1',
  botUsername: '@inline_bot',
  query: 'search text',
  sendToSameChat: true,
  resultIndex: '0',
  saveResultTitleTo: 'title_var',
});

// Генерация для всех узлов
const allCode = generateUserbotInlineQueryHandlers(nodes, projectId);
```

## Особенности

- **inline_query** — выполняется через `userbot_client.inline_query(bot, query)`
- **Выбор результата** — по индексу (0 = первый), с fallback на 0 если индекс вне диапазона
- **Отправка** — через `_result.click(target)` — отправляет выбранный inline-результат в чат
- **sendToSameChat** — если true, результат отправляется в чат с ботом (botUsername)
- **get_content** — botUsername, query, targetChat берутся из таблицы `_content` с фоллбеком
- **FloodWait** — автоматическое ожидание при ошибке FloodWaitError
- **Переменные** — title, description, ID сообщения сохраняются через `set_user_var`
- **Автопереход** — через FakeCallbackQuery к следующему узлу
