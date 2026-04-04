# Шаблон обработчиков триггеров inline-кнопок (callback-trigger.py.jinja2)

## Описание

Шаблон генерирует Python обработчики для узлов типа `callback_trigger`. Каждый такой узел перехватывает нажатие inline-кнопки с заданным `callback_data` и переходит к целевому узлу через паттерн `MockCallback`.

Поддерживает два режима совпадения:
- `exact` — точное совпадение: `lambda c: c.data == "confirm_order"`
- `startswith` — по префиксу: `lambda c: c.data and c.data.startswith("order_")`

## Параметры

### CallbackTriggerEntry

| Поле | Тип | Описание | Обязательное |
|------|-----|----------|--------------|
| nodeId | string | ID узла callback_trigger | ✅ |
| callbackData | string | Значение callback_data для перехвата | ✅ |
| matchType | 'exact' \| 'startswith' | Режим совпадения | ✅ |
| targetNodeId | string | ID целевого узла | ✅ |
| targetNodeType | string | Тип целевого узла | ✅ |
| adminOnly | boolean | Только для администраторов | нет |
| requiresAuth | boolean | Требуется авторизация | нет |

## Пример выходного Python кода

```python
# exact:
@dp.callback_query(lambda c: c.data == "confirm_order")
async def callback_trigger_trigger_confirm_handler(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    logging.info(f"Пользователь {user_id} нажал кнопку 'confirm_order' — триггер узла trigger_confirm")
    mock_callback = MockCallback("msg_confirmed", callback_query.from_user, callback_query.message)
    await handle_callback_msg_confirmed(mock_callback)

# startswith:
@dp.callback_query(lambda c: c.data and c.data.startswith("order_"))
async def callback_trigger_trigger_order_handler(callback_query: types.CallbackQuery):
    ...
```

## Использование

```typescript
import { generateCallbackTriggerHandlers } from 'lib/templates/callback-trigger';

const code = generateCallbackTriggerHandlers(nodes);
```

## Структура файлов

```
callback-trigger/
├── callback-trigger.py.jinja2     (шаблон обработчиков)
├── callback-trigger.params.ts     (TypeScript интерфейсы)
├── callback-trigger.schema.ts     (Zod схема валидации)
├── callback-trigger.renderer.ts   (функции генерации)
├── callback-trigger.fixture.ts    (тестовые данные)
├── callback-trigger.test.ts       (тесты)
├── callback-trigger.md            (документация)
└── index.ts                       (экспорт)
```
