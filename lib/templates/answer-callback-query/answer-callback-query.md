# Шаблон обработчиков узла answer_callback_query

## Описание

Шаблон генерирует Python обработчики для узлов типа `answer_callback_query`. Узел является **действием** — регистрируется как `@dp.callback_query` обработчик и вызывает Telegram Bot API метод `answerCallbackQuery`. Показывает уведомление пользователю после нажатия inline-кнопки: тост (кратко) или алерт (с кнопкой OK).

## Параметры

### AnswerCallbackQueryEntry

| Поле | Тип | Описание | Обязательное |
|------|-----|----------|--------------|
| nodeId | string | ID узла answer_callback_query | ✅ |
| targetNodeId | string | ID следующего узла | ✅ |
| targetNodeType | string | Тип следующего узла | ✅ |
| notificationText | string | Текст уведомления (0–200 символов, поддерживает `{{var}}`) | ✅ |
| showAlert | boolean | true = алерт с OK, false = тост | ✅ |
| cacheTime | number | Время кеширования ответа в секундах | ✅ |

## Пример входных данных (Node[])

```typescript
const nodes: Node[] = [
  {
    id: 'node_id_123',
    type: 'answer_callback_query',
    position: { x: 0, y: 0 },
    data: {
      autoTransitionTo: 'next_node',
      callbackNotificationText: 'Готово, {{username}}!',
      callbackShowAlert: false,
      callbackCacheTime: 0,
    },
  },
];
```

## Пример выходного Python кода

```python
@dp.callback_query(lambda c: c.data == "node_id_123")
async def handle_callback_node_id_123(callback_query: types.CallbackQuery):
    """Уведомление inline-кнопки"""
    try:
        user_id = callback_query.from_user.id
        logging.info(f"🔔 answer_callback_query узел node_id_123 для пользователя {user_id}")

        _notification_text = "Готово, {{username}}!"
        if user_id in user_data:
            for _k, _v in user_data[user_id].items():
                _notification_text = _notification_text.replace("{" + _k + "}", str(_v))
        await callback_query.answer(text=_notification_text, show_alert=False, cache_time=0)

        await handle_callback_next_node(callback_query)
    except Exception as e:
        logging.error(f"Ошибка в answer_callback_query node_id_123: {e}")
```

## Использование

### Высокоуровневый API (из узлов)

```typescript
import { generateAnswerCallbackQueryHandlers } from 'lib/templates/answer-callback-query';

const code = generateAnswerCallbackQueryHandlers(nodes);
```

### Низкоуровневый API (из параметров)

```typescript
import { generateAnswerCallbackQuery } from 'lib/templates/answer-callback-query';

const code = generateAnswerCallbackQuery({
  entries: [{
    nodeId: 'node_id_123',
    targetNodeId: 'next_node',
    targetNodeType: 'message',
    notificationText: 'Готово!',
    showAlert: false,
    cacheTime: 0,
  }],
});
```

## Структура файлов

```
answer-callback-query/
├── answer-callback-query.py.jinja2   (шаблон обработчиков)
├── answer-callback-query.params.ts   (TypeScript интерфейсы)
├── answer-callback-query.schema.ts   (Zod схема валидации)
├── answer-callback-query.renderer.ts (collectAnswerCallbackQueryEntries + generate*)
├── answer-callback-query.fixture.ts  (тестовые данные)
├── answer-callback-query.test.ts     (тесты)
├── answer-callback-query.md          (документация)
└── index.ts                          (экспорт)
```
