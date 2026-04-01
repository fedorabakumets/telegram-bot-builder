# group-message-trigger

Шаблон для генерации Python-обработчика узла `group_message_trigger`.

## Назначение

Триггер срабатывает когда оператор пишет сообщение в топик форум-группы Telegram.
По `message_thread_id` находит пользователя в базе данных и передаёт управление следующему узлу.

## Параметры узла

| Параметр | Тип | Описание |
|---|---|---|
| `groupChatId` | `string` | Числовой ID группы (без `-100` префикса) |
| `groupChatIdSource` | `'manual' \| 'variable'` | Источник ID группы |
| `groupChatVariableName` | `string` | Имя переменной с ID группы (если source=variable) |
| `threadIdVariable` | `string` | Имя переменной где у пользователей хранится thread_id |
| `resolvedUserIdVariable` | `string` | Имя переменной куда положить найденный user_id |
| `autoTransitionTo` | `string` | ID следующего узла |

## Генерируемый код

Для каждого узла генерируется `@dp.message` обработчик:

```python
@dp.message(F.chat.type.in_({'group', 'supergroup'}), F.message_thread_id)
async def group_message_trigger_<safeName>_handler(message: types.Message):
    # 1. Фильтр по ID группы
    # 2. Получение message_thread_id
    # 3. JSONB-запрос к bot_users для поиска user_id по thread_id
    # 4. set_user_var для сохранения resolved_user_id
    # 5. MockCallback + вызов handle_callback_<targetNodeId>
```

## Особенности

- **Не middleware** — использует `@dp.message` декоратор, не `dp.message.middleware()`
- **Фильтр по группе** — проверяет `message.chat.id` против ожидаемых значений
- **Префикс -100** — рендерер автоматически добавляет `-100` к числовому ID при сравнении
- **JSONB-запрос** — ищет пользователя через `user_data->>'threadIdVariable' = thread_id`
- **project_id** — если `PROJECT_ID` задан глобально, добавляет фильтр по проекту

## Файлы

| Файл | Описание |
|---|---|
| `group-message-trigger.params.ts` | TypeScript типы параметров |
| `group-message-trigger.schema.ts` | Zod-схема валидации |
| `group-message-trigger.renderer.ts` | Функции сбора и рендеринга |
| `group-message-trigger.py.jinja2` | Jinja2-шаблон Python-кода |
| `group-message-trigger.fixture.ts` | Тестовые данные |
| `group-message-trigger.test.ts` | Unit-тесты (vitest) |
| `index.ts` | Реэкспорт публичного API |

## Использование

```typescript
import { generateGroupMessageTriggerHandlers } from '../group-message-trigger';

const code = generateGroupMessageTriggerHandlers(nodes);
```
