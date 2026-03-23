# reply-button-handlers

Генерация обработчиков reply кнопок для Telegram ботов.

## Назначение

Шаблон генерирует Python код для обработки нажатий на reply кнопки во всех узлах бота.

## Параметры

| Параметр | Тип | Описание |
|----------|-----|----------|
| `nodes` | `Node[]` | Все узлы для генерации обработчиков |
| `indentLevel` | `string` | Уровень отступа (по умолчанию `''`) |

## Пример использования

```typescript
import { generateReplyButtonHandlers } from '../../templates/handlers';

const code = generateReplyButtonHandlers({
  nodes: [
    {
      id: 'node1',
      type: 'message',
      data: {
        keyboardType: 'reply',
        messageText: 'Выберите опцию:',
        buttons: [
          { id: 'btn1', text: 'Опция 1', action: 'goto', target: 'node2' },
          { id: 'btn2', text: 'Опция 2', action: 'goto', target: 'node3' },
        ],
      },
    },
    { id: 'node2', type: 'message', data: { keyboardType: 'none' } },
    { id: 'node3', type: 'message', data: { keyboardType: 'none' } },
  ],
});

console.log(code);
```

## Пример вывода

```python
# Обработчики reply кнопок
@dp.message(lambda message: message.text == "Опция 1")
async def handle_reply_btn1(message: types.Message):
    user_id = message.from_user.id
    
    # Проверяем, находится ли пользователь в режиме мультивыбора
    if user_id in user_data and "multi_select_node" in user_data[user_id] and user_data[user_id].get("multi_select_type") == "reply":
        # Пользователь в режиме мультивыбора, передаем управление общему обработчику
        await handle_multi_select_reply(message)
        return
    
    # Очищаем состояние мультивыбора
    user_data[user_id].pop("multi_select_node", None)
    user_data[user_id].pop("multi_select_type", None)
    
    # Переход к целевому узлу
    user_data[user_id]["last_node_id"] = "node2"
    await handle_callback_node2(message)
```

## Особенности

1. **Избегание дублирования** — обработчики генерируются только для уникальных текстов кнопок
2. **Поддержка multi-select** — проверка режима множественного выбора перед обработкой
3. **Разные типы узлов** — поддержка command и message узлов

## Структура файлов

```
reply-button-handlers/
├── reply-button-handlers.py.jinja2    # Jinja2 шаблон
├── reply-button-handlers.params.ts    # TypeScript интерфейс
├── reply-button-handlers.schema.ts    # Zod схема
├── reply-button-handlers.renderer.ts  # Функция рендеринга
├── reply-button-handlers.fixture.ts   # Тестовые фикстуры
├── reply-button-handlers.test.ts      # Тесты
└── README.md                          # Документация
```
