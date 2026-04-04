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
| buttonText | string | Текст кнопки, найденный по callbackData среди кнопок проекта | нет |

## Пример выходного Python кода

```python
# exact:
@dp.callback_query(lambda c: c.data == "confirm_order")
async def callback_trigger_trigger_confirm_handler(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    logging.info(f"Пользователь {user_id} нажал кнопку 'confirm_order' — триггер узла trigger_confirm")
    # Сохраняем данные нажатой кнопки для использования в переменных {callback_data} и {button_text}
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["callback_data"] = callback_query.data or "confirm_order"
    user_data[user_id]["button_text"] = "Подтвердить заказ"  # текст кнопки из проекта
    mock_callback = MockCallback("msg_confirmed", callback_query.from_user, callback_query.message)
    await handle_callback_msg_confirmed(mock_callback)

# startswith:
@dp.callback_query(lambda c: c.data and c.data.startswith("order_"))
async def callback_trigger_trigger_order_handler(callback_query: types.CallbackQuery):
    ...
```

## Переменные в тексте сообщений

После срабатывания триггера в `user_data` пользователя сохраняются две переменные:

| Переменная | Значение |
|------------|----------|
| `{callback_data}` | Реальное значение `callback_data` из Telegram (`callback_query.data`) |
| `{button_text}` | Текст нажатой кнопки — читается из `reply_markup` сообщения в рантайме |

**Логика получения `button_text`:**
1. Читаем `callback_query.message.reply_markup.inline_keyboard`
2. Ищем кнопку с совпадающим `callback_data`
3. Берём её `text`
4. Если не нашли — используем fallback: `buttonText` из проекта или само значение `callbackData`

**Пример использования в тексте сообщения:**
```
Вы нажали кнопку «{button_text}» (данные: {callback_data})
```

Это работает для любых нод — не нужно знать граф переходов.

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
