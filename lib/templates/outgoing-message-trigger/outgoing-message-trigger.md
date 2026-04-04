# Шаблон обработчиков триггера исходящего сообщения (outgoing-message-trigger.py.jinja2)

## Описание

Шаблон генерирует Python обработчики для узлов типа `outgoing_message_trigger`. Обработчики вызываются из middleware после каждой отправки сообщения ботом — включая текст, фото, видео, аудио и документы. Работают параллельно — не прерывают основной поток. Сохраняют `last_bot_message_id` и `message_text` в `user_data`.

## Параметры

### OutgoingMessageTriggerEntry

| Поле | Тип | Описание | Обязательное |
|------|-----|----------|--------------|
| nodeId | string | ID узла outgoing_message_trigger | ✅ |
| targetNodeId | string | ID целевого узла | ✅ |
| targetNodeType | string | Тип целевого узла | ✅ |

## Пример входных данных (Node[])

```typescript
const nodes: Node[] = [
  {
    id: 'omt_1',
    type: 'outgoing_message_trigger',
    position: { x: 0, y: 0 },
    data: { autoTransitionTo: 'fwd_to_admin' },
  },
  {
    id: 'fwd_to_admin',
    type: 'forward_message',
    position: { x: 200, y: 0 },
    data: { targetChatId: '123456789' },
  },
];
```

## Пример выходного Python кода

```python
async def outgoing_message_trigger_omt_1_handler(user_id: int, message_id, message_text: str, chat_id: int = 0):
    """Срабатывает когда бот отправляет сообщение пользователю"""
    try:
        logging.info(f"Исходящее сообщение для {user_id} — триггер узла omt_1")
        if user_id not in user_data:
            user_data[user_id] = {}
        user_data[user_id]["last_bot_message_id"] = message_id
        user_data[user_id]["message_text"] = message_text or ""
        _effective_chat_id = chat_id if chat_id else user_id
        fake_msg = FakeMessage(_effective_chat_id, message_id)
        # ... FakeCallbackQuery и вызов handle_callback_fwd_to_admin
    except Exception as e:
        logging.error(f"Ошибка в outgoing_message_trigger omt_1: {e}")

_outgoing_message_trigger_handlers = [
    outgoing_message_trigger_omt_1_handler,
]
```

## Связь исходящего сообщения с пользователем

Обработчик принимает `chat_id` — ID чата куда было отправлено сообщение. Для личных сообщений `chat_id == user_id`. Создаётся `FakeMessage` с `chat.id = chat_id` и `message_id` — это позволяет `forward_message` знать из какого чата пересылать сообщение.

```python
class FakeMessage:
    def __init__(self, chat_id_val, message_id_val):
        self.chat = type('Chat', (), {'id': chat_id_val})()
        self.message_id = message_id_val
        self.message_thread_id = None
```

Если `chat_id` не передан (0) — используется `user_id` как fallback.

## Использование

### Высокоуровневый API (из узлов)

```typescript
import { generateOutgoingMessageTriggerHandlers } from 'lib/templates/outgoing-message-trigger';

const code = generateOutgoingMessageTriggerHandlers(nodes);
```

### Низкоуровневый API (из параметров)

```typescript
import { generateOutgoingMessageTriggers } from 'lib/templates/outgoing-message-trigger';

const code = generateOutgoingMessageTriggers({
  entries: [{ nodeId: 'omt_1', targetNodeId: 'fwd_to_admin', targetNodeType: 'forward_message' }],
});
```

## Перехватываемые методы отправки

Обработчики вызываются из следующих обёрток после каждой отправки:

- `bot.send_message` → через `_wrap_bot_send_message`
- `bot.send_photo` → через `_wrap_bot_send_photo`
- `bot.send_sticker` → через `_wrap_bot_send_sticker` (текст: `[Стикер]`)
- `bot.send_voice` → через `_wrap_bot_send_voice` (текст: caption или `[Голосовое]`)
- `bot.send_animation` → через `_wrap_bot_send_animation` (текст: caption или `[Анимация]`)
- `bot.send_media_group` → через `_wrap_bot_send_media_group` (текст: `[Медиагруппа]`, message_id первого сообщения)
- `message.answer` → через `_patched_answer`
- `message.answer_photo` → через `_patched_answer_photo`
- `message.answer_video` → через `_patched_answer_video`
- `message.answer_audio` → через `_patched_answer_audio`
- `message.answer_document` → через `_patched_answer_document`

## Структура файлов

```
outgoing-message-trigger/
├── outgoing-message-trigger.py.jinja2     (шаблон обработчиков)
├── outgoing-message-trigger.params.ts     (TypeScript интерфейсы)
├── outgoing-message-trigger.schema.ts     (Zod схема валидации)
├── outgoing-message-trigger.renderer.ts   (collectOutgoingMessageTriggerEntries + generateOutgoingMessageTriggers)
├── outgoing-message-trigger.fixture.ts    (тестовые данные)
├── outgoing-message-trigger.test.ts       (тесты)
├── outgoing-message-trigger.md            (документация)
└── index.ts                               (экспорт)
```
