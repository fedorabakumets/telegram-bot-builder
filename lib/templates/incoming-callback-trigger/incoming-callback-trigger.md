# Шаблон middleware триггера входящего callback_query (incoming-callback-trigger.py.jinja2)

## Описание

Шаблон генерирует Python middleware для узлов типа `incoming_callback_trigger`. Middleware регистрируется через `dp.callback_query.middleware(...)` и срабатывает на каждое нажатие инлайн-кнопки — параллельно с основным потоком, не прерывая его. Читает `button_text` из `reply_markup`, сохраняет `callback_data` и `button_text` в `user_data`. После вызова сценария через `MockCallback` цепочка продолжается: `return await handler(event, data)`.

## Параметры

### IncomingCallbackTriggerEntry

| Поле | Тип | Описание | Обязательное |
|------|-----|----------|--------------|
| nodeId | string | ID узла incoming_callback_trigger | ✅ |
| targetNodeId | string | ID целевого узла | ✅ |
| targetNodeType | string | Тип целевого узла | ✅ |

## Пример входных данных (Node[])

```typescript
const nodes: Node[] = [
  {
    id: 'trigger_1',
    type: 'incoming_callback_trigger',
    position: { x: 0, y: 0 },
    data: {
      autoTransitionTo: 'msg_greeting',
    },
  },
  {
    id: 'msg_greeting',
    type: 'message',
    position: { x: 200, y: 0 },
    data: { messageText: 'Вы нажали: {callback_data}, кнопка: {button_text}' },
  },
];
```

## Пример выходного Python кода

```python
async def incoming_callback_trigger_trigger_1_middleware(handler, event: types.CallbackQuery, data: dict):
    """Срабатывает на каждое нажатие инлайн-кнопки пользователем"""
    try:
        user_id = event.from_user.id
        logging.info(f"Нажатие кнопки от {user_id} — триггер узла trigger_1")
        if user_id not in user_data:
            user_data[user_id] = {}
        user_data[user_id]["callback_data"] = event.data or ""
        _ict_btn_text = ""
        try:
            if event.data and event.message and hasattr(event.message, "reply_markup"):
                _rm = event.message.reply_markup
                if _rm and hasattr(_rm, "inline_keyboard"):
                    for _row in _rm.inline_keyboard:
                        for _btn in _row:
                            if getattr(_btn, "callback_data", None) == event.data:
                                _ict_btn_text = _btn.text or ""
                                break
                        if _ict_btn_text:
                            break
        except Exception:
            pass
        user_data[user_id]["button_text"] = _ict_btn_text

        class MockCallback:
            def __init__(self, data, user, msg):
                self.data = data
                self.from_user = user
                self.message = msg
                self._is_fake = True

            async def answer(self, *args, **kwargs):
                pass

            async def edit_text(self, text, **kwargs):
                try:
                    return await self.message.edit_text(text, **kwargs)
                except Exception as e:
                    logging.warning(f"Не удалось отредактировать сообщение: {e}")
                    return await self.message.answer(text, **kwargs)

        mock_callback = MockCallback("msg_greeting", event.from_user, event.message)
        await handle_callback_msg_greeting(mock_callback)
    except Exception as e:
        logging.error(f"Ошибка в incoming_callback_trigger middleware: {e}")

    return await handler(event, data)

dp.callback_query.middleware(incoming_callback_trigger_trigger_1_middleware)
```

## Отличие от `callback_trigger`

| Характеристика | `callback_trigger` | `incoming_callback_trigger` |
|---|---|---|
| Тип | Декоратор `@dp.callback_query(lambda ...)` | Middleware `dp.callback_query.middleware(...)` |
| Фильтрация | По конкретному `callback_data` | Перехватывает ВСЕ нажатия |
| Параллельность | Заменяет основной поток | Работает параллельно |
| Сохранение данных | Только `callback_data` и `button_text` | `callback_data` и `button_text` |

## Использование

### Высокоуровневый API (из узлов)

```typescript
import { generateIncomingCallbackTriggerHandlers } from 'lib/templates/incoming-callback-trigger';

const code = generateIncomingCallbackTriggerHandlers(nodes);
```

### Низкоуровневый API (из параметров)

```typescript
import { generateIncomingCallbackTriggers } from 'lib/templates/incoming-callback-trigger';

const code = generateIncomingCallbackTriggers({
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
incoming-callback-trigger/
├── incoming-callback-trigger.py.jinja2     (шаблон middleware)
├── incoming-callback-trigger.params.ts     (TypeScript интерфейсы)
├── incoming-callback-trigger.schema.ts     (Zod схема валидации)
├── incoming-callback-trigger.renderer.ts   (collectIncomingCallbackTriggerEntries + generateIncomingCallbackTriggers)
├── incoming-callback-trigger.fixture.ts    (тестовые данные)
├── incoming-callback-trigger.test.ts       (тесты)
├── incoming-callback-trigger.md            (документация)
└── index.ts                                (экспорт)
```
