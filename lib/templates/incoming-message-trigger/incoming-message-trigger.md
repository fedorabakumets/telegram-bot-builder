# Шаблон middleware триггера входящего сообщения (incoming-message-trigger.py.jinja2)

## Описание

Шаблон генерирует Python middleware для узлов типа `incoming_message_trigger`. Middleware регистрируется через `dp.message.middleware(...)` и срабатывает на каждое входящее сообщение от пользователя — до других хендлеров. После вызова сценария через `MockCallback` цепочка продолжается: `return await handler(event, data)`.

## Параметры

### IncomingMessageTriggerEntry

| Поле | Тип | Описание | Обязательное |
|------|-----|----------|--------------|
| nodeId | string | ID узла incoming_message_trigger | ✅ |
| targetNodeId | string | ID целевого узла | ✅ |
| targetNodeType | string | Тип целевого узла | ✅ |

## Пример входных данных (Node[])

```typescript
const nodes: Node[] = [
  {
    id: 'trigger_1',
    type: 'incoming_message_trigger',
    position: { x: 0, y: 0 },
    data: {
      autoTransitionTo: 'msg_greeting',
    },
  },
  {
    id: 'msg_greeting',
    type: 'message',
    position: { x: 200, y: 0 },
    data: { messageText: 'Привет!' },
  },
];
```

## Пример выходного Python кода

```python
async def incoming_message_trigger_trigger_1_middleware(handler, event: types.Message, data: dict):
    """Срабатывает на каждое входящее сообщение от пользователя"""
    try:
        user_id = event.from_user.id
        logging.info(f"Входящее сообщение от {user_id} — триггер узла trigger_1")

        class MockCallback:
            def __init__(self, data, user, msg):
                self.data = data
                self.from_user = user
                self.message = msg

            async def answer(self, *args, **kwargs):
                pass

            async def edit_text(self, text, **kwargs):
                try:
                    return await self.message.edit_text(text, **kwargs)
                except Exception as e:
                    logging.warning(f"Не удалось отредактировать сообщение: {e}")
                    return await self.message.answer(text, **kwargs)

        mock_callback = MockCallback("msg_greeting", event.from_user, event)
        await handle_callback_msg_greeting(mock_callback)
    except Exception as e:
        logging.error(f"Ошибка в incoming_message_trigger middleware: {e}")

    return await handler(event, data)

dp.message.middleware(incoming_message_trigger_trigger_1_middleware)
```

## Использование

### Высокоуровневый API (из узлов)

```typescript
import { generateIncomingMessageTriggerHandlers } from 'lib/templates/incoming-message-trigger';

const code = generateIncomingMessageTriggerHandlers(nodes);
```

### Низкоуровневый API (из параметров)

```typescript
import { generateIncomingMessageTriggers } from 'lib/templates/incoming-message-trigger';

const code = generateIncomingMessageTriggers({
  entries: [
    {
      nodeId: 'trigger_1',
      targetNodeId: 'msg_greeting',
      targetNodeType: 'message',
    },
  ],
});
```

## Структура файлов

```
incoming-message-trigger/
├── incoming-message-trigger.py.jinja2     (шаблон middleware)
├── incoming-message-trigger.params.ts     (TypeScript интерфейсы)
├── incoming-message-trigger.schema.ts     (Zod схема валидации)
├── incoming-message-trigger.renderer.ts   (collectIncomingMessageTriggerEntries + generateIncomingMessageTriggers)
├── incoming-message-trigger.fixture.ts    (тестовые данные)
├── incoming-message-trigger.test.ts       (тесты)
├── incoming-message-trigger.md            (документация)
└── index.ts                               (экспорт)
```
