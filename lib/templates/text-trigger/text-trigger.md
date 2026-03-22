# Шаблон обработчиков текстовых триггеров (text-trigger.py.jinja2)

## Описание

Шаблон генерирует Python обработчики для узлов типа `text_trigger` на холсте Telegram бота. Каждый такой узел содержит одну или несколько текстовых фраз (`textSynonyms`) и при совпадении входящего сообщения автоматически переходит к целевому узлу (`autoTransitionTo`) через паттерн `MockCallback`.

Поддерживает два режима совпадения:
- `exact` — точное совпадение (`message.text.lower() == "фраза"`)
- `contains` — вхождение подстроки (`"фраза" in message.text.lower()`)

## Параметры

### TextTriggerEntry

| Поле | Тип | Описание | Обязательное |
|------|-----|----------|--------------|
| nodeId | string | ID узла text_trigger | ✅ |
| synonyms | string[] | Список текстовых фраз | ✅ |
| matchType | 'exact' \| 'contains' | Тип совпадения | ✅ |
| targetNodeId | string | ID целевого узла | ✅ |
| targetNodeType | string | Тип целевого узла | ✅ |
| isPrivateOnly | boolean | Только приватные чаты | нет |

## Пример входных данных (Node[])

```typescript
const nodes: Node[] = [
  {
    id: 'trigger_1',
    type: 'text_trigger',
    position: { x: 0, y: 0 },
    data: {
      textSynonyms: ['привет', 'hello'],
      textMatchType: 'exact',
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

### exact match

```python
@dp.message(lambda message: message.text and message.text.lower() == "привет")
async def text_trigger_trigger_1_привет_handler(message: types.Message):
    # Текстовый триггер для узла trigger_1, фраза: привет
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал 'привет' — триггер узла trigger_1")

    class MockCallback:
        def __init__(self, data, user, msg):
            self.data = data
            self.from_user = user
            self.message = msg

        async def answer(self):
            pass

        async def edit_text(self, text, **kwargs):
            try:
                return await self.message.edit_text(text, **kwargs)
            except Exception as e:
                logging.warning(f"Не удалось отредактировать сообщение: {e}")
                return await self.message.answer(text, **kwargs)

    mock_callback = MockCallback("msg_greeting", message.from_user, message)
    await handle_callback_msg_greeting(mock_callback)
```

### contains match

```python
@dp.message(lambda message: message.text and "помощь" in message.text.lower())
async def text_trigger_trigger_2_помощь_handler(message: types.Message):
    ...
```

## Использование

### Высокоуровневый API (из узлов)

```typescript
import { generateTextTriggerHandlers } from 'lib/templates/text-trigger';

const code = generateTextTriggerHandlers(nodes);
```

### Низкоуровневый API (из параметров)

```typescript
import { generateTextTriggers } from 'lib/templates/text-trigger';

const code = generateTextTriggers({
  entries: [
    {
      nodeId: 'trigger_1',
      synonyms: ['привет', 'hello'],
      matchType: 'exact',
      targetNodeId: 'msg_greeting',
      targetNodeType: 'message',
    },
  ],
});
```

## Структура файлов

```
text-trigger/
├── text-trigger.py.jinja2     (шаблон обработчиков)
├── text-trigger.params.ts     (TypeScript интерфейсы)
├── text-trigger.schema.ts     (Zod схема валидации)
├── text-trigger.renderer.ts   (collectTextTriggerEntries + generateTextTriggers)
├── text-trigger.fixture.ts    (тестовые данные)
├── text-trigger.test.ts       (тесты)
├── text-trigger.md            (документация)
└── index.ts                   (экспорт)
```
