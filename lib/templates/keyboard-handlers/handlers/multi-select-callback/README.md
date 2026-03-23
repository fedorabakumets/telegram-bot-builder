# Шаблон multi-select callback обработчика (multi-select-callback.py.jinja2)

## Описание

Шаблон для генерации Python кода обработчика callback событий для кнопок с множественным выбором (multi-select). Генерирует логику переключения галочек (✓/✗) на кнопках и обновления клавиатуры.

## Параметры

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `multiSelectNodes` | `MultiSelectNode[]` | Да | `[]` | Массив узлов с множественным выбором |
| `allNodeIds` | `string[]` | Да | `[]` | Массив всех ID узлов для генерации коротких ID |
| `indentLevel` | `string` | Нет | `'    '` | Уровень отступа |

### Структура MultiSelectNode

```typescript
interface MultiSelectNode {
  id: string;                    // ID узла
  shortNodeId: string;           // Короткий ID (pre-computed)
  selectionButtons: MultiSelectButton[];  // Кнопки выбора
  regularButtons: RegularButton[];        // Обычные кнопки
  completeButton?: CompleteButton;        // Кнопка завершения
  doneCallbackData?: string;              // Callback для "Готово"
  hasKeyboardLayout?: boolean;            // Есть ли раскладка
  keyboardLayoutAuto?: boolean;           // Авто-раскладка
  adjustCode?: string;                    // Код для adjust()
  totalButtonsCount?: number;             // Общее количество кнопок
}
```

### Структура MultiSelectButton

```typescript
interface MultiSelectButton {
  id: string;           // ID кнопки
  text: string;         // Текст кнопки
  action: string;       // 'selection'
  target?: string;      // Target для callback
  value: string;        // Pre-computed значение
  valueTruncated: string;  // Обрезанное значение
  escapedText: string;  // Escaped текст для f-string
  callbackData: string; // Pre-computed callback_data
}
```

## Примеры использования

### Базовый multi-select узел

```typescript
import { generateMultiSelectCallback } from './multi-select-callback.renderer';

const code = generateMultiSelectCallback({
  multiSelectNodes: [
    {
      id: 'node_123',
      shortNodeId: 'abc123',
      selectionButtons: [
        {
          id: 'btn_1',
          text: 'Опция 1',
          action: 'selection',
          target: 'opt1',
          value: 'opt1',
          valueTruncated: 'opt1',
          escapedText: 'Опция 1',
          callbackData: 'ms_abc123_opt1',
        },
        {
          id: 'btn_2',
          text: 'Опция 2',
          action: 'selection',
          target: 'opt2',
          value: 'opt2',
          valueTruncated: 'opt2',
          escapedText: 'Опция 2',
          callbackData: 'ms_abc123_opt2',
        },
      ],
      regularButtons: [],
      completeButton: {
        text: 'Готово',
        target: 'next_node',
      },
      doneCallbackData: 'done_abc123',
      totalButtonsCount: 3,
    },
  ],
  allNodeIds: ['node_123', 'next_node'],
});
```

**Вывод:**

```python
    # Обработка выбора опции
    logging.info(f"📱 Обрабатываем callback_data: {callback_data}")

    # Поддерживаем и новый формат ms_ и старый multi_select_
    if callback_data.startswith("ms_"):
        # Новый короткий формат: ms_shortNodeId_shortTarget
        parts = callback_data.split("_")
        if len(parts) >= 3:
            short_node_id = parts[1]
            button_id = "_".join(parts[2:])
            node_id = None
            logging.info(f"🔍 Ищем узел по короткому ID: {short_node_id}")

            if short_node_id == "abc123":
                node_id = "node_123"
                logging.info(f"✅ Найден узел: {node_id}")

    # ... (продолжение обработки)

    if button_text:
        logging.info(f"🔘 Обрабатываем кнопку: {button_text}")
        selected_list = user_data[user_id][f"multi_select_{node_id}"]
        if button_text in selected_list:
            selected_list.remove(button_text)
            logging.info(f"➖ Убрали выбор: {button_text}")
        else:
            selected_list.append(button_text)
            logging.info(f"➕ Добавили выбор: {button_text}")

        # Обновляем клавиатуру с галочками
        builder = InlineKeyboardBuilder()
        if node_id == "node_123":
            builder.add(InlineKeyboardButton(text=f"{'✅ ' if 'Опция 1' in selected_list else ''}Опция 1", callback_data="ms_abc123_opt1"))
            builder.add(InlineKeyboardButton(text=f"{'✅ ' if 'Опция 2' in selected_list else ''}Опция 2", callback_data="ms_abc123_opt2"))
            builder.add(InlineKeyboardButton(text="Готово", callback_data="done_abc123"))
            builder.adjust(optimal_columns_with_done)

        keyboard = builder.as_markup()
        await callback_query.message.edit_reply_markup(reply_markup=keyboard)
```

### Несколько узлов

```typescript
const code = generateMultiSelectCallback({
  multiSelectNodes: [
    {
      id: 'node_1',
      shortNodeId: 'n1',
      selectionButtons: [...],
      regularButtons: [],
    },
    {
      id: 'node_2',
      shortNodeId: 'n2',
      selectionButtons: [...],
      regularButtons: [],
    },
  ],
  allNodeIds: ['node_1', 'node_2'],
});
```

### С обычными кнопками (goto, url)

```typescript
const code = generateMultiSelectCallback({
  multiSelectNodes: [
    {
      id: 'node_456',
      shortNodeId: 'def456',
      selectionButtons: [...],
      regularButtons: [
        {
          id: 'btn_goto',
          text: 'Перейти',
          action: 'goto',
          target: 'target_node',
        },
        {
          id: 'btn_url',
          text: 'Сайт',
          action: 'url',
          url: 'https://example.com',
        },
      ],
      completeButton: {...},
    },
  ],
  allNodeIds: ['node_456', 'target_node'],
});
```

## Функциональность

### Обработка callback_data

Шаблон поддерживает два формата callback_data:
- **Новый формат**: `ms_{shortNodeId}_{buttonId}` (короткий, для ограничения 64 символа)
- **Старый формат**: `multi_select_{nodeId}_{buttonId}` (для обратной совместимости)

### Восстановление из БД

При обработке callback автоматически загружаются ранее сохранённые выборы из базы данных.

### Обновление клавиатуры

После каждого выбора клавиатура обновляется с актуальными галочками на выбранных кнопках.

## Тесты

Запуск тестов:

```bash
npm test -- multi-select-callback.test.ts
```

### Покрытие тестов

- Валидные данные (6 тестов)
- Callback data генерация (3 теста)
- Логика выбора (3 теста)
- Галочки на кнопках (2 теста)
- Невалидные данные (2 теста)
- Валидация схемы (3 теста)
- Производительность (2 теста)
- Отступы (1 тест)

## Интеграция

Шаблон используется в:
- `bot.py.jinja2` - главный шаблон бота
- Адаптеры в `lib/bot-generator/Keyboard/`

Для использования в шаблоне:

```jinja2
{% include 'handlers/multi-select-callback/multi-select-callback.py.jinja2' %}
```

## Зависимости в генерируемом коде

- `InlineKeyboardBuilder` - из aiogram
- `InlineKeyboardButton` - из aiogram
- `user_data` - глобальная переменная для хранения данных пользователей
- `get_user_from_db()` - функция загрузки данных из БД
- `logging` - модуль логирования
- `calculate_optimal_columns()` - функция вычисления колонок
