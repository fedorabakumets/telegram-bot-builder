# Шаблон обработчиков узла получения токена управляемого бота (get-managed-bot-token.py.jinja2)

## Описание

Шаблон генерирует Python обработчики для узлов типа `get_managed_bot_token`. Обработчик регистрируется через `@dp.callback_query` (как обычный action-узел) и вызывает `await bot.get_managed_bot_token(user_id=<bot_id>)`, сохраняя полученный токен в `user_data`.

> **Важно:** Узел является action-узлом, а не триггером. Он вызывается из сценария через FakeCallbackQuery, поэтому регистрируется через `@dp.callback_query`, а не через `@dp.message`.

## Параметры

### GetManagedBotTokenEntry

| Поле | Тип | Описание | Обязательное |
|------|-----|----------|--------------|
| nodeId | string | ID узла get_managed_bot_token | ✅ |
| targetNodeId | string | ID целевого узла | ✅ |
| targetNodeType | string | Тип целевого узла | ✅ |
| botIdSource | string | Источник bot_id: 'variable' или 'manual' | ❌ |
| botIdVariable | string | Имя переменной с bot_id | ❌ |
| botIdManual | string | Ручной числовой ID бота | ❌ |
| saveTokenTo | string | Переменная для сохранения токена | ❌ |
| saveErrorTo | string | Переменная для сохранения ошибки | ❌ |
| state | FSMContext | Опциональный FSM контекст (state: FSMContext = None). Используется для чтения/записи данных между переходами. | ❌ |

## Пример входных данных (Node[])

```typescript
const nodes: Node[] = [
  {
    id: 'get_token_1',
    type: 'get_managed_bot_token',
    position: { x: 0, y: 0 },
    data: {
      autoTransitionTo: 'msg_success',
      botIdSource: 'variable',
      botIdVariable: 'bot_id',
      saveTokenTo: 'bot_token',
      saveErrorTo: 'token_error',
    },
  },
  {
    id: 'msg_success',
    type: 'message',
    position: { x: 200, y: 0 },
    data: { messageText: 'Токен получен!' },
  },
];
```

## Пример выходного Python кода

```python
@dp.callback_query(lambda c: c.data == "get_token_1")
async def handle_callback_get_token_1(callback_query: types.CallbackQuery):
    """Получить токен управляемого бота"""
    try:
        user_id = callback_query.from_user.id
        logging.info(f"Получение токена управляемого бота — узел get_token_1, user_id={user_id}")

        _bot_id = user_data.get(user_id, {}).get("bot_id")

        if not _bot_id:
            logging.error(f"bot_id не найден для пользователя {user_id}")
            user_data.setdefault(user_id, {})["token_error"] = "bot_id не найден"
            return

        _token = await bot.get_managed_bot_token(user_id=int(_bot_id))

        if user_id not in user_data:
            user_data[user_id] = {}

        user_data[user_id]["bot_token"] = _token
        logging.info(f"Токен управляемого бота получен для пользователя {user_id}")

        fake_cb = FakeCallbackQuery(user_id, callback_query.message)
        await handle_callback_msg_success(fake_cb)
    except Exception as e:
        logging.error(f"Ошибка в get_managed_bot_token get_token_1: {e}")
        user_data.setdefault(user_id, {})["token_error"] = str(e)
```

## Использование

### Высокоуровневый API (из узлов)

```typescript
import { generateGetManagedBotTokenHandlers } from 'lib/templates/get-managed-bot-token';

const code = generateGetManagedBotTokenHandlers(nodes);
```

### Низкоуровневый API (из параметров)

```typescript
import { generateGetManagedBotToken } from 'lib/templates/get-managed-bot-token';

const code = generateGetManagedBotToken({
  entries: [{
    nodeId: 'get_token_1',
    targetNodeId: 'msg_success',
    targetNodeType: 'message',
    botIdVariable: 'bot_id',
    saveTokenTo: 'bot_token',
  }],
});
```

## Структура файлов

```
get-managed-bot-token/
├── get-managed-bot-token.py.jinja2     (шаблон обработчиков)
├── get-managed-bot-token.params.ts     (TypeScript интерфейсы)
├── get-managed-bot-token.schema.ts     (Zod схема валидации)
├── get-managed-bot-token.renderer.ts   (collectGetManagedBotTokenEntries + generate*)
├── get-managed-bot-token.fixture.ts    (тестовые данные)
├── get-managed-bot-token.test.ts       (тесты)
├── get-managed-bot-token.md            (документация)
└── index.ts                            (экспорт)
```
