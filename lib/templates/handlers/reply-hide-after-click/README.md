# reply-hide-after-click

Генерация кода для обработки флага `hideAfterClick` для reply кнопок Telegram ботов.

## Назначение

Шаблон генерирует Python код для автоматического удаления сообщений пользователя после нажатия на reply кнопки с флагом `hideAfterClick`.

## Параметры

| Параметр | Тип | Описание |
|----------|-----|----------|
| `nodes` | `Node[]` | Все узлы для поиска кнопок с флагом hideAfterClick |
| `indentLevel` | `string` | Уровень отступа (по умолчанию `'    '`) |

## Пример использования

```typescript
import { generateReplyHideAfterClick } from '../../templates/handlers';

const code = generateReplyHideAfterClick({
  nodes: [
    {
      id: 'node1',
      type: 'message',
      data: {
        keyboardType: 'reply',
        messageText: 'Выберите опцию:',
        buttons: [
          {
            id: 'btn1',
            text: 'Скрыть после клика',
            action: 'goto',
            target: 'node2',
            hideAfterClick: true,
          },
        ],
      },
    },
  ],
});

console.log(code);
```

## Пример вывода

```python
# Проверяем, является ли сообщение нажатием на reply-кнопку с флагом hideAfterClick
# Используем message.text напрямую, так как user_text может быть не определен в этом месте
message_text_lower = message.text.lower() if message.text else ""

# Список текстов кнопок с флагом hideAfterClick
hide_after_click_texts = ["скрыть после клика"]

if message_text_lower in hide_after_click_texts:
    try:
        # Удаляем сообщение пользователя, которое содержит нажатие на кнопку
        await bot.delete_message(chat_id=message.chat.id, message_id=message.message_id)
        logging.info(f"🗑️ Сообщение пользователя удалено после нажатия reply-кнопки с флагом hideAfterClick: {message.text}")
    except Exception as e:
        logging.warning(f"⚠️ Не удалось удалить сообщение пользователя с reply-кнопкой hideAfterClick: {e}")
    return  # Прерываем дальнейшую обработку, так как сообщение уже удалено
```

## Особенности

1. **Автоматическое удаление** — удаляет сообщение пользователя после нажатия
2. **Обработка ошибок** — безопасно обрабатывает случаи когда удаление невозможно
3. **Прерывание обработки** — возвращает управление после удаления чтобы избежать дублирования

## Структура файлов

```
reply-hide-after-click/
├── reply-hide-after-click.py.jinja2    # Jinja2 шаблон
├── reply-hide-after-click.params.ts    # TypeScript интерфейс
├── reply-hide-after-click.schema.ts    # Zod схема
├── reply-hide-after-click.renderer.ts  # Функция рендеринга
├── reply-hide-after-click.fixture.ts   # Тестовые фикстуры
├── reply-hide-after-click.test.ts      # Тесты
└── README.md                           # Документация
```
