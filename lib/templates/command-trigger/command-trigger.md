# Шаблон обработчиков командных триггеров (command-trigger.py.jinja2)

## Описание

Шаблон генерирует Python обработчики для узлов типа `command_trigger` на холсте Telegram бота. Каждый такой узел содержит команду (например `/start`) и при её вызове автоматически переходит к целевому узлу (`autoTransitionTo`) через паттерн `MockCallback`.

Использует стандартный aiogram декоратор `@dp.message(Command("команда"))` для регистрации обработчиков команд.

## Параметры

### CommandTriggerEntry

| Поле | Тип | Описание | Обязательное |
|------|-----|----------|--------------|
| nodeId | string | ID узла command_trigger | ✅ |
| command | string | Команда, например "/start" | ✅ |
| description | string | Описание команды для BotFather | нет |
| showInMenu | boolean | Показывать команду в меню бота | нет |
| isPrivateOnly | boolean | Только приватные чаты | нет |
| targetNodeId | string | ID целевого узла | ✅ |
| targetNodeType | string | Тип целевого узла | ✅ |

## Пример входных данных (Node[])

```typescript
const nodes: Node[] = [
  {
    id: 'trigger_start',
    type: 'command_trigger',
    position: { x: 0, y: 0 },
    data: {
      command: '/start',
      description: 'Запустить бота',
      showInMenu: true,
      autoTransitionTo: 'msg_welcome',
    },
  },
  {
    id: 'msg_welcome',
    type: 'message',
    position: { x: 200, y: 0 },
    data: { messageText: 'Добро пожаловать!' },
  },
];
```

## Пример выходного Python кода

```python
@dp.message(Command("start"))
async def command_trigger_trigger_start_handler(message: types.Message):
    # Командный триггер для узла trigger_start, команда: /start
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} вызвал команду '/start' — триггер узла trigger_start")

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

    mock_callback = MockCallback("msg_welcome", message.from_user, message)
    await handle_callback_msg_welcome(mock_callback)
```

### С isPrivateOnly

```python
@dp.message(Command("secret"))
async def command_trigger_trigger_secret_handler(message: types.Message):
    ...
    if message.chat.type != 'private':
        await message.answer("❌ Эта команда доступна только в приватных чатах")
        return
    ...
```

## Использование

### Высокоуровневый API (из узлов)

```typescript
import { generateCommandTriggerHandlers } from 'lib/templates/command-trigger';

const code = generateCommandTriggerHandlers(nodes);
```

### Низкоуровневый API (из параметров)

```typescript
import { generateCommandTriggers } from 'lib/templates/command-trigger';

const code = generateCommandTriggers({
  entries: [
    {
      nodeId: 'trigger_start',
      command: '/start',
      description: 'Запустить бота',
      targetNodeId: 'msg_welcome',
      targetNodeType: 'message',
    },
  ],
});
```

## Структура файлов

```
command-trigger/
├── command-trigger.py.jinja2     (шаблон обработчиков)
├── command-trigger.params.ts     (TypeScript интерфейсы)
├── command-trigger.schema.ts     (Zod схема валидации)
├── command-trigger.renderer.ts   (collectCommandTriggerEntries + generateCommandTriggers)
├── command-trigger.fixture.ts    (тестовые данные)
├── command-trigger.test.ts       (тесты)
├── command-trigger.md            (документация)
└── index.ts                      (экспорт)
```
