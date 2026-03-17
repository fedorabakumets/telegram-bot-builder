# Шаблон обработчиков управления пользователями (user-handler.py.jinja2)

## Описание

Генерирует Python обработчики для управления участниками Telegram групп.
Каждый узел порождает два обработчика: command handler (`/ban_user`, `/kick_user` и т.д.)
и synonym handler (реагирует на текстовые триггеры).

## Поддерживаемые типы узлов

| nodeType | Действие |
|---|---|
| `ban_user` | Бан пользователя (навсегда или до даты) |
| `unban_user` | Разбан пользователя |
| `kick_user` | Исключение (ban + unban) |
| `mute_user` | Ограничение прав на отправку сообщений |
| `unmute_user` | Снятие ограничений |
| `promote_user` | Назначение администратором |
| `demote_user` | Снятие прав администратора |

## Параметры

### Общие

| Параметр | Тип | Описание | Обязательный |
|---|---|---|---|
| nodeType | UserHandlerNodeType | Тип узла | ✅ |
| nodeId | string | ID узла | ✅ |
| safeName | string | Безопасное имя функции (safe_name от nodeId) | ✅ |
| synonyms | string[] | Список текстовых триггеров (min 1) | ✅ |
| targetGroupId | string | ID конкретной группы, или '' для всех групп | нет |

### ban_user / kick_user

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| reason | string | 'Нарушение правил группы' | Причина |
| untilDate | number | 0 | Unix timestamp окончания бана (0 = навсегда) |

### mute_user

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| duration | number | 3600 | Длительность в секундах |
| reason | string | 'Нарушение правил группы' | Причина |
| canSendMessages | boolean | false | |
| canSendMediaMessages | boolean | false | |
| canSendPolls | boolean | false | |
| canSendOtherMessages | boolean | false | |
| canAddWebPagePreviews | boolean | false | |
| canChangeGroupInfo | boolean | false | |
| canInviteUsers2 | boolean | false | |
| canPinMessages2 | boolean | false | |

### promote_user

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| canChangeInfo | boolean | false | |
| canDeleteMessages | boolean | true | |
| canInviteUsers | boolean | true | |
| canRestrictMembers | boolean | false | |
| canPinMessages | boolean | true | |
| canPromoteMembers | boolean | false | |
| canManageVideoChats | boolean | false | |
| canManageTopics | boolean | false | |
| isAnonymous | boolean | false | |

## Примеры использования

### Низкоуровневый API

```typescript
import { generateUserHandler } from './templates/user-handler';

const code = generateUserHandler({
  nodeType: 'ban_user',
  nodeId: 'ban_1',
  safeName: 'ban_1',
  synonyms: ['бан', 'забанить'],
  reason: 'Спам',
  untilDate: 0,
});
```

### Высокоуровневый API (из узла графа)

```typescript
import { generateUserHandlerFromNode } from './templates/user-handler';

const code = generateUserHandlerFromNode(node);
```

## Генерируемый Python код

Каждый тип генерирует два обработчика:

```python
# Command handler
@dp.message(Command("ban_user"))
async def ban_user_ban_1_command_handler(message: types.Message):
    ...

# Synonym handler
@dp.message(lambda message: message.text and any(
    message.text.lower().startswith(word) for word in ["бан", "забанить"]
) and message.chat.type in ['group', 'supergroup'])
async def ban_user_ban_1_handler(message: types.Message):
    ...
```

## Структура файлов

```
user-handler/
├── user-handler.py.jinja2     (шаблон)
├── user-handler.params.ts     (TypeScript интерфейсы)
├── user-handler.schema.ts     (Zod схема)
├── user-handler.renderer.ts   (generateUserHandler, generateUserHandlerFromNode)
├── user-handler.fixture.ts    (тестовые данные)
├── user-handler.test.ts       (тесты)
├── user-handler.md            (документация)
└── index.ts                   (экспорт)
```

## Запуск тестов

```bash
npm run test:user-handler
```
