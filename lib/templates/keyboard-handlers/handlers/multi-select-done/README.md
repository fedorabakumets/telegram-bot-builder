# Шаблон multi-select done обработчика (multi-select-done.py.jinja2)

## Описание

Шаблон для генерации Python кода обработчика нажатия кнопки "Готово" для завершения множественного выбора. Генерирует логику сохранения выбранных опций в БД и перехода к следующему узлу.

## Параметры

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `multiSelectNodes` | `MultiSelectDoneNode[]` | Да | `[]` | Массив узлов с множественным выбором |
| `allNodes` | `any[]` | Да | `[]` | Массив всех узлов для поиска целевых узлов |
| `allNodeIds` | `string[]` | Да | `[]` | Массив всех ID узлов |
| `indentLevel` | `string` | Нет | `''` | Уровень отступа |

### Структура MultiSelectDoneNode

```typescript
interface MultiSelectDoneNode {
  id: string;                           // ID узла
  variableName: string;                 // Имя переменной для хранения
  continueButtonTarget?: string;        // Target кнопки продолжения
  targetNode?: TargetNode;              // Целевой узел
}
```

### Структура TargetNode

```typescript
interface TargetNode {
  id: string;               // ID узла
  type: string;             // Тип узла ('message', 'command', etc.)
  data: NodeData;           // Данные узла
  shortId?: string;         // Короткий ID
  keyboardCode?: string;    // Код для клавиатуры
  adjustCode?: string;      // Код для adjust()
}
```

## Примеры использования

### Базовый multi-select done

```typescript
import { generateMultiSelectDone } from './multi-select-done.renderer';

const code = generateMultiSelectDone({
  multiSelectNodes: [
    {
      id: 'node_123',
      variableName: 'user_interests',
      continueButtonTarget: 'next_node',
      targetNode: {
        id: 'next_node',
        type: 'message',
        data: {
          keyboardType: 'inline',
          messageText: 'Следующее сообщение',
        },
      },
    },
  ],
  allNodes: [...],
  allNodeIds: ['node_123', 'next_node'],
});
```

**Вывод:**

```python
# Обработчик для кнопок завершения множественного выбора
@dp.callback_query(lambda callback_query: callback_query.data and callback_query.data.startswith("multi_select_done_"))
async def handle_multi_select_done(callback_query: types.CallbackQuery):
    logging.info(f"🏁 ОБРАБОТЧИК ГОТОВО АКТИВИРОВАН! callback_data: {callback_query.data}")
    await callback_query.answer()
    user_id = callback_query.from_user.id
    callback_data = callback_query.data

    # Извлекаем node_id из callback_data
    node_id = callback_data.replace("multi_select_done_", "")
    logging.info(f"🎯 Node ID для завершения: {node_id}")

    if node_id == "node_123":
        # Получаем выбранные опции
        selected_options = user_data.get(user_id, {}).get("multi_select_node_123", [])
        
        if selected_options:
            selected_text = ", ".join(selected_options)
            await save_user_data_to_db(user_id, "user_interests", selected_text)
            logging.info(f"💾 ГЕНЕРАТОР DEBUG: Сохранили в БД: user_interests = {selected_text}")
        
        # Переход к следующему узлу
        logging.info(f"🚀 ГЕНЕРАТОР DEBUG: Переходим к узлу 'next_node'")
        # ... (код перехода)
```

### С множественным выбором в целевом узле

```typescript
const code = generateMultiSelectDone({
  multiSelectNodes: [
    {
      id: 'node_456',
      variableName: 'user_preferences',
      continueButtonTarget: 'multi_select_node',
      targetNode: {
        id: 'multi_select_node',
        type: 'message',
        data: {
          keyboardType: 'inline',
          allowMultipleSelection: true,
          messageText: 'Выберите опции',
          multiSelectVariable: 'user_choices',
          buttons: [
            { id: 'btn_1', text: 'Опция 1', action: 'selection', callbackData: 'ms_msn_opt1' },
            { id: 'btn_2', text: 'Опция 2', action: 'selection', callbackData: 'ms_msn_opt2' },
            { id: 'btn_done', text: 'Готово', action: 'complete' },
          ],
        },
        shortId: 'msn',
        adjustCode: 'builder.adjust(2)',
      },
    },
  ],
  allNodes: [...],
  allNodeIds: ['node_456', 'multi_select_node'],
});
```

### С reply клавиатурой

```typescript
const code = generateMultiSelectDone({
  multiSelectNodes: [
    {
      id: 'node_reply',
      variableName: 'user_topics',
      continueButtonTarget: 'reply_node',
      targetNode: {
        id: 'reply_node',
        type: 'message',
        data: {
          keyboardType: 'reply',
          allowMultipleSelection: true,
          messageText: 'Выберите темы',
          multiSelectVariable: 'topics',
          resizeKeyboard: true,
          oneTimeKeyboard: false,
          buttons: [
            { id: 'btn_1', text: 'Тема 1', action: 'selection' },
            { id: 'btn_done', text: 'Готово', action: 'complete' },
          ],
        },
      },
    },
  ],
  allNodes: [...],
  allNodeIds: ['node_reply', 'reply_node'],
});
```

## Функциональность

### Сохранение в БД

При нажатии кнопки "Готово" выбранные опции сохраняются в базу данных через `save_user_data_to_db()`.

### Переход к следующему узлу

Если указан `continueButtonTarget`, генерируется код перехода к целевому узлу с:
- Инициализацией состояния множественного выбора (если целевой узел поддерживает)
- Восстановлением ранее сохранённых выборов из БД
- Генерацией клавиатуры с галочками

### Генерация клавиатуры

Для целевых узлов с `allowMultipleSelection`:
- **Inline клавиатура**: `InlineKeyboardBuilder()` с кнопками с галочками
- **Reply клавиатура**: `ReplyKeyboardBuilder()` с кнопками с галочками

## Тесты

Запуск тестов:

```bash
npm test -- multi-select-done.test.ts
```

### Покрытие тестов

- Валидные данные (6 тестов)
- Сохранение в БД (2 теста)
- Переход к следующему узлу (3 теста)
- Генерация клавиатуры (4 теста)
- Невалидные данные (2 теста)
- Валидация схемы (3 теста)
- Производительность (2 теста)

## Интеграция

Шаблон используется в:
- `bot.py.jinja2` - главный шаблон бота
- Адаптеры в `lib/bot-generator/Keyboard/`

Для использования в шаблоне:

```jinja2
{% include 'handlers/multi-select-done/multi-select-done.py.jinja2' %}
```

## Зависимости в генерируемом коде

- `types.CallbackQuery` - из aiogram
- `dp` - Dispatcher из aiogram
- `user_data` - глобальная переменная для хранения данных пользователей
- `save_user_data_to_db()` - функция сохранения данных в БД
- `get_user_from_db()` - функция загрузки данных из БД
- `InlineKeyboardBuilder`, `InlineKeyboardButton` - из aiogram
- `ReplyKeyboardBuilder`, `KeyboardButton` - из aiogram
- `logging` - модуль логирования
- `json` - модуль JSON
