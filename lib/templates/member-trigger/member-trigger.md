# Шаблон обработчиков триггера участника (member-trigger.py.jinja2)

## Описание

Шаблон генерирует Python обработчики для узлов типа `member_trigger`. Триггер срабатывает когда участник вошёл в группу (`F.new_chat_members`) или вышел из неё (`F.left_chat_member`). Данные участника сохраняются в `user_data`, затем вызывается следующий узел через `FakeCallbackQuery`.

## Параметры

### MemberTriggerEntry

| Поле | Тип | Описание | Обязательное |
|------|-----|----------|--------------|
| nodeId | string | ID узла member_trigger | ✅ |
| targetNodeId | string | ID целевого узла | ✅ |
| targetNodeType | string | Тип целевого узла | ✅ |
| memberEventType | 'join' \| 'leave' \| 'both' | Тип события | ✅ |
| groupChatId | string | ID группы для фильтрации | ❌ |
| groupChatIdSource | 'manual' \| 'variable' | Источник ID группы | ✅ |
| groupChatVariableName | string | Имя переменной с ID группы | ❌ |
| saveJoinedUserIdTo | string | Переменная для user.id вошедшего | ❌ |
| saveJoinedUsernameTo | string | Переменная для username вошедшего | ❌ |
| saveLeftUserIdTo | string | Переменная для user.id вышедшего | ❌ |
| saveLeftUsernameTo | string | Переменная для username вышедшего | ❌ |
| hasGroupChatFilter | boolean | Применять фильтр по группе | ✅ |

## Пример входных данных (Node[])

```typescript
const nodes: Node[] = [
  {
    id: 'member_1',
    type: 'member_trigger',
    position: { x: 0, y: 0 },
    data: {
      memberEventType: 'join',
      groupChatId: '2300967595',
      groupChatIdSource: 'manual',
      saveJoinedUserIdTo: 'joined_user_id',
      saveJoinedUsernameTo: 'joined_username',
      autoTransitionTo: 'msg_welcome',
    },
  },
  {
    id: 'msg_welcome',
    type: 'message',
    position: { x: 200, y: 0 },
    data: { messageText: 'Новый участник: @{joined_username}' },
  },
];
```

## Пример выходного Python кода

```python
@dp.message(F.new_chat_members)
async def member_trigger_member_1_join_handler(message: types.Message):
  ...
  for new_member in message.new_chat_members:
      user_id = new_member.id
      await capture_message_context(user_id, message)
      user_data[user_id]["joined_user_id"] = new_member.id
      fake_cb = FakeCallbackQuery(new_member, message)
      await handle_callback_msg_welcome(fake_cb, state=None)
```

## Использование

### Высокоуровневый API (из узлов)

```typescript
import { generateMemberTriggerHandlers } from 'lib/templates/member-trigger';

const code = generateMemberTriggerHandlers(nodes);
```

### Низкоуровневый API (из параметров)

```typescript
import { generateMemberTriggers } from 'lib/templates/member-trigger';

const code = generateMemberTriggers({
  entries: [{
    nodeId: 'member_1',
    targetNodeId: 'msg_welcome',
    targetNodeType: 'message',
    memberEventType: 'join',
    groupChatIdSource: 'manual',
    hasGroupChatFilter: false,
  }],
});
```
