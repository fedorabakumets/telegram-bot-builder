# Шаблон обработчиков триггера создания управляемого бота (managed-bot-updated-trigger.py.jinja2)

## Описание

Шаблон генерирует Python обработчики для узлов типа `managed_bot_updated_trigger`. Обработчик регистрируется через `@dp.message(lambda m: m.managed_bot_created is not None)` и срабатывает на сервисное сообщение `managed_bot_created` (ContentType.MANAGED_BOT_CREATED, Bot API 9.6) — когда пользователь создал управляемого бота. Сохраняет данные бота и создателя в `user_data`.

> **Важно:** Telegram присылает это событие как сервисное сообщение (`types.Message`), а не как отдельный апдейт `Update.managed_bot`. Поэтому обработчик регистрируется через `@dp.message`, а не через `outer_middleware`.

## Параметры

### ManagedBotUpdatedTriggerEntry

| Поле | Тип | Описание | Обязательное |
|------|-----|----------|--------------|
| nodeId | string | ID узла managed_bot_updated_trigger | ✅ |
| targetNodeId | string | ID целевого узла | ✅ |
| targetNodeType | string | Тип целевого узла | ✅ |
| saveBotIdTo | string | Переменная для bot.id | ❌ |
| saveBotUsernameTo | string | Переменная для bot.username | ❌ |
| saveBotNameTo | string | Переменная для bot.first_name | ❌ |
| saveCreatorIdTo | string | Переменная для user.id создателя | ❌ |
| saveCreatorUsernameTo | string | Переменная для user.username создателя | ❌ |
| filterByUserId | string | Фильтр по user.id (если пусто — реагирует на всех) | ❌ |

## Пример входных данных (Node[])

```typescript
const nodes: Node[] = [
  {
    id: 'mbu_1',
    type: 'managed_bot_updated_trigger',
    position: { x: 0, y: 0 },
    data: {
      autoTransitionTo: 'msg_bot_created',
      saveBotIdTo: 'bot_id',
      saveBotUsernameTo: 'bot_username',
      saveCreatorIdTo: 'creator_id',
      filterByUserId: '123456789',
    },
  },
  {
    id: 'msg_bot_created',
    type: 'message',
    position: { x: 200, y: 0 },
    data: { messageText: 'Бот @{bot_username} создан!' },
  },
];
```

## Пример выходного Python кода

```python
@dp.message(lambda m: m.managed_bot_created is not None)
async def managed_bot_updated_trigger_mbu_1_handler(message: types.Message):
    """Срабатывает когда пользователь создал управляемого бота"""
    try:
        managed_bot = message.managed_bot_created.bot
        creator_user = message.from_user
        user_id = creator_user.id if creator_user else None
        if not user_id:
            return

        if str(user_id) != "123456789":
            return

        logging.info(f"Управляемый бот создан — триггер узла mbu_1, user_id={user_id}")
        if user_id not in user_data:
            user_data[user_id] = {}

        user_data[user_id]["bot_id"] = managed_bot.id
        user_data[user_id]["bot_username"] = managed_bot.username or ""
        user_data[user_id]["creator_id"] = creator_user.id

        class FakeCallbackQuery:
            def __init__(self, user_id_val, msg):
                self.from_user = type('User', (), {'id': user_id_val, ...})()
                self.message = msg
                self.data = "msg_bot_created"
                self._is_fake = True

            async def answer(self, *args, **kwargs):
                pass

        fake_cb = FakeCallbackQuery(user_id, message)
        await handle_callback_msg_bot_created(fake_cb)
    except Exception as e:
        logging.error(f"Ошибка в managed_bot_updated_trigger mbu_1: {e}")
```

## Использование

### Высокоуровневый API (из узлов)

```typescript
import { generateManagedBotUpdatedTriggerHandlers } from 'lib/templates/managed-bot-updated-trigger';

const code = generateManagedBotUpdatedTriggerHandlers(nodes);
```

### Низкоуровневый API (из параметров)

```typescript
import { generateManagedBotUpdatedTriggers } from 'lib/templates/managed-bot-updated-trigger';

const code = generateManagedBotUpdatedTriggers({
  entries: [{
    nodeId: 'mbu_1',
    targetNodeId: 'msg_bot_created',
    targetNodeType: 'message',
    saveBotIdTo: 'bot_id',
  }],
});
```

## Структура файлов

```
managed-bot-updated-trigger/
├── managed-bot-updated-trigger.py.jinja2     (шаблон обработчиков)
├── managed-bot-updated-trigger.params.ts     (TypeScript интерфейсы)
├── managed-bot-updated-trigger.schema.ts     (Zod схема валидации)
├── managed-bot-updated-trigger.renderer.ts   (collectManagedBotUpdatedTriggerEntries + generate*)
├── managed-bot-updated-trigger.fixture.ts    (тестовые данные)
├── managed-bot-updated-trigger.test.ts       (тесты)
├── managed-bot-updated-trigger.md            (документация)
└── index.ts                                  (экспорт)
```


## Параметры

### ManagedBotUpdatedTriggerEntry

| Поле | Тип | Описание | Обязательное |
|------|-----|----------|--------------|
| nodeId | string | ID узла managed_bot_updated_trigger | ✅ |
| targetNodeId | string | ID целевого узла | ✅ |
| targetNodeType | string | Тип целевого узла | ✅ |
| saveBotIdTo | string | Переменная для bot.id | ❌ |
| saveBotUsernameTo | string | Переменная для bot.username | ❌ |
| saveBotNameTo | string | Переменная для bot.first_name | ❌ |
| saveCreatorIdTo | string | Переменная для user.id создателя | ❌ |
| saveCreatorUsernameTo | string | Переменная для user.username создателя | ❌ |
| filterByUserId | string | Фильтр по user.id (если пусто — реагирует на всех) | ❌ |

## Пример входных данных (Node[])

```typescript
const nodes: Node[] = [
  {
    id: 'mbu_1',
    type: 'managed_bot_updated_trigger',
    position: { x: 0, y: 0 },
    data: {
      autoTransitionTo: 'msg_bot_created',
      saveBotIdTo: 'bot_id',
      saveBotUsernameTo: 'bot_username',
      saveCreatorIdTo: 'creator_id',
      filterByUserId: '123456789',
    },
  },
  {
    id: 'msg_bot_created',
    type: 'message',
    position: { x: 200, y: 0 },
    data: { messageText: 'Бот @{bot_username} создан!' },
  },
];
```

## Пример выходного Python кода

```python
@dp.update.outer_middleware()
async def managed_bot_updated_trigger_mbu_1_middleware(handler, event: types.Update, data: dict):
    """Срабатывает когда пользователь создал управляемого бота или сменил его токен"""
    if not event.managed_bot:
        return await handler(event, data)
    try:
        managed_bot_update = event.managed_bot
        creator_user = managed_bot_update.user
        managed_bot = managed_bot_update.bot
        user_id = creator_user.id

        if str(user_id) != "123456789":
            return await handler(event, data)

        logging.info(f"Управляемый бот создан/обновлён — триггер узла mbu_1, user_id={user_id}")
        if user_id not in user_data:
            user_data[user_id] = {}

        user_data[user_id]["bot_id"] = managed_bot.id
        user_data[user_id]["bot_username"] = managed_bot.username or ""
        user_data[user_id]["creator_id"] = creator_user.id

        class FakeCallbackQuery:
            ...

        fake_cb = FakeCallbackQuery(user_id)
        await handle_callback_msg_bot_created(fake_cb)
    except Exception as e:
        logging.error(f"Ошибка в managed_bot_updated_trigger mbu_1: {e}")

    return await handler(event, data)
```

## Использование

### Высокоуровневый API (из узлов)

```typescript
import { generateManagedBotUpdatedTriggerHandlers } from 'lib/templates/managed-bot-updated-trigger';

const code = generateManagedBotUpdatedTriggerHandlers(nodes);
```

### Низкоуровневый API (из параметров)

```typescript
import { generateManagedBotUpdatedTriggers } from 'lib/templates/managed-bot-updated-trigger';

const code = generateManagedBotUpdatedTriggers({
  entries: [{
    nodeId: 'mbu_1',
    targetNodeId: 'msg_bot_created',
    targetNodeType: 'message',
    saveBotIdTo: 'bot_id',
  }],
});
```

## Структура файлов

```
managed-bot-updated-trigger/
├── managed-bot-updated-trigger.py.jinja2     (шаблон middleware)
├── managed-bot-updated-trigger.params.ts     (TypeScript интерфейсы)
├── managed-bot-updated-trigger.schema.ts     (Zod схема валидации)
├── managed-bot-updated-trigger.renderer.ts   (collectManagedBotUpdatedTriggerEntries + generate*)
├── managed-bot-updated-trigger.fixture.ts    (тестовые данные)
├── managed-bot-updated-trigger.test.ts       (тесты)
├── managed-bot-updated-trigger.md            (документация)
└── index.ts                                  (экспорт)
```
