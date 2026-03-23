# Шаблон multi-select reply обработчика (multi-select-reply.py.jinja2)

## Описание

Шаблон для генерации Python кода обработчика reply кнопок для узлов с множественным выбором. Генерирует логику обработки текстовых сообщений от пользователя при выборе кнопок reply клавиатуры с галочками (✓/✗).

## Параметры

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `multiSelectNodes` | `MultiSelectReplyNode[]` | Да | `[]` | Массив узлов с reply множественным выбором |
| `allNodes` | `any[]` | Да | `[]` | Массив всех узлов для поиска целевых узлов |
| `allNodeIds` | `string[]` | Да | `[]` | Массив всех ID узлов |
| `indentLevel` | `string` | Нет | `''` | Уровень отступа |

### Структура MultiSelectReplyNode

```typescript
interface MultiSelectReplyNode {
  id: string;                           // ID узла
  variableName: string;                 // Имя переменной для хранения
  continueButtonTarget?: string;        // Target кнопки продолжения
  continueButtonText?: string;          // Текст кнопки продолжения
  completeButton?: CompleteButton;      // Кнопка завершения
  selectionButtons: SelectionButton[];  // Кнопки выбора
  regularButtons: RegularButton[];      // Обычные кнопки
  gotoButtons: GotoButton[];            // Кнопки перехода
  adjustCode?: string;                  // Код для adjust()
  resizeKeyboard?: boolean;             // Resize keyboard
  oneTimeKeyboard?: boolean;            // One time keyboard
  messageText?: string;                 // Текст сообщения
  targetNode?: TargetNode;              // Целевой узел
}
```

## Примеры использования

### Базовый multi-select reply

```typescript
import { generateMultiSelectReply } from './multi-select-reply.renderer';

const code = generateMultiSelectReply({
  multiSelectNodes: [
    {
      id: 'node_123',
      variableName: 'user_interests',
      selectionButtons: [
        {
          id: 'btn_1',
          text: 'Опция 1',
          action: 'selection',
          target: 'opt1',
        },
        {
          id: 'btn_2',
          text: 'Опция 2',
          action: 'selection',
          target: 'opt2',
        },
      ],
      regularButtons: [],
      gotoButtons: [],
      completeButton: {
        text: 'Готово',
      },
      messageText: 'Выберите опции:',
      resizeKeyboard: true,
      oneTimeKeyboard: false,
    },
  ],
  allNodes: [...],
  allNodeIds: ['node_123'],
});
```

**Вывод:**

```python
# Обработчик для reply кнопок множественного выбора
@dp.message()
async def handle_multi_select_reply(message: types.Message):
    user_id = message.from_user.id
    user_input = message.text

    # Проверяем, находится ли пользователь в режиме множественного выбора reply
    if user_id in user_data and "multi_select_node" in user_data[user_id] and user_data[user_id].get("multi_select_type") == "reply":
        node_id = user_data[user_id]["multi_select_node"]

        if node_id == "node_123" and user_input == "Готово":
            # Завершение множественного выбора
            selected_options = user_data.get(user_id, {}).get("multi_select_node_123", [])
            if selected_options:
                selected_text = ", ".join(selected_options)
                await save_user_data_to_db(user_id, "user_interests", selected_text)

            # Очищаем состояние
            user_data[user_id].pop("multi_select_node_123", None)
            user_data[user_id].pop("multi_select_node", None)
            user_data[user_id].pop("multi_select_type", None)
            return

        # Обработка выбора опции
        if node_id == "node_123":
            clean_user_input = user_input.replace("✅ ", "").strip()
            if clean_user_input == "Опция 1":
                selected_list = user_data[user_id]["multi_select_node_123"]
                if "Опция 1" in selected_list:
                    selected_list.remove("Опция 1")
                    await message.answer(f"❌ Убрано: Опция 1")
                else:
                    selected_list.append("Опция 1")
                    await message.answer(f"✅ Выбрано: Опция 1")

                # Обновляем клавиатуру с галочками
                builder = ReplyKeyboardBuilder()
                builder.add(KeyboardButton(text=f"{'✅ ' if 'Опция 1' in selected_list else ''}Опция 1"))
                builder.add(KeyboardButton(text=f"{'✅ ' if 'Опция 2' in selected_list else ''}Опция 2"))
                builder.add(KeyboardButton(text="Готово"))
                builder.adjust(2)
                keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
                await message.answer("Выберите опции:", reply_markup=keyboard)
                return
```

### С goto кнопками

```typescript
const code = generateMultiSelectReply({
  multiSelectNodes: [
    {
      id: 'node_456',
      variableName: 'user_topics',
      selectionButtons: [...],
      regularButtons: [
        {
          id: 'btn_skip',
          text: 'Пропустить',
          action: 'goto',
          target: 'skip_node',
        },
      ],
      gotoButtons: [
        {
          id: 'btn_goto',
          text: 'Перейти',
          action: 'goto',
          target: 'target_node',
          targetNode: {
            id: 'target_node',
            type: 'message',
            data: {},
          },
        },
      ],
      completeButton: { text: 'Завершить' },
      messageText: 'Выберите темы:',
    },
  ],
  allNodes: [...],
  allNodeIds: ['node_456', 'skip_node', 'target_node'],
});
```

### С command целевым узлом

```typescript
const code = generateMultiSelectReply({
  multiSelectNodes: [
    {
      id: 'node_cmd',
      variableName: 'user_data_var',
      selectionButtons: [...],
      regularButtons: [],
      gotoButtons: [],
      completeButton: {
        text: 'Готово',
        target: 'command_node',
      },
      continueButtonTarget: 'command_node',
      targetNode: {
        id: 'command_node',
        type: 'command',
        data: {
          command: '/mycommand',
        },
      },
      messageText: 'Выберите:',
    },
  ],
  allNodes: [...],
  allNodeIds: ['node_cmd', 'command_node'],
});
```

## Функциональность

### Обработка текстовых сообщений

Шаблон генерирует обработчик `@dp.message()` который:
1. Проверяет находится ли пользователь в режиме multi-select reply
2. Обрабатывает нажатие кнопки "Готово"
3. Обрабатывает выбор опций с галочками
4. Обрабатывает обычные кнопки (goto)

### Очистка текста от галочки

При обработке ввода пользователя автоматически удаляется префикс "✅ " для корректного сравнения с текстом кнопки.

### Обновление клавиатуры

После каждого выбора клавиатура обновляется с актуальными галочками на выбранных кнопках через `ReplyKeyboardBuilder`.

### Переход к другим узлам

Для кнопок с действием `goto`:
- Создаётся `fake_callback` с данными целевого узла
- Вызывается соответствующий `handle_callback_*` обработчик
- Для command узлов вызывается `handle_command_*` обработчик

## Тесты

Запуск тестов:

```bash
npm test -- multi-select-reply.test.ts
```

### Покрытие тестов

- Валидные данные (6 тестов)
- Обработка кнопки "Готово" (3 теста)
- Обработка выбора опций (4 теста)
- Обработка goto кнопок (3 теста)
- Невалидные данные (2 теста)
- Валидация схемы (3 теста)
- Производительность (2 теста)

## Интеграция

Шаблон используется в:
- `bot.py.jinja2` - главный шаблон бота
- Адаптеры в `lib/bot-generator/Keyboard/`

Для использования в шаблоне:

```jinja2
{% include 'handlers/multi-select-reply/multi-select-reply.py.jinja2' %}
```

## Зависимости в генерируемом коде

- `types.Message` - из aiogram
- `dp` - Dispatcher из aiogram
- `user_data` - глобальная переменная для хранения данных пользователей
- `save_user_data_to_db()` - функция сохранения данных в БД
- `ReplyKeyboardBuilder`, `KeyboardButton` - из aiogram
- `logging` - модуль логирования
- `handle_callback_*` - обработчики callback кнопок
- `handle_command_*` - обработчики команд
