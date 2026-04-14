# Шаблон multi-select button обработчика (multi-select-button-handler.py.jinja2)

## Описание

Шаблон для генерации Python кода обработчика callback событий для кнопок с множественным выбором (multi-select) с сохранением выбранных значений в базу данных. Генерирует логику обработки кнопок выбора, кнопки "Готово" и перехода к следующему узлу.

## Параметры

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `targetNode` | `TargetNode` | Нет | `undefined` | Целевой узел для перехода |
| `callbackData` | `string` | Да | - | Callback data для идентификации кнопки |
| `shortNodeIdForDone` | `string` | Нет | `undefined` | Короткий ID узла для done обработчика |
| `button` | `Button` | Да | - | Объект кнопки |
| `node` | `Node` | Да | - | Текущий узел (родительский) |
| `nodes` | `Node[]` | Да | - | Все узлы для проверки существования целевого |
| `indentLevel` | `string` | Нет | `'    '` | Уровень отступа |
| `state` | `FSMContext` | Нет | `None` | Опциональный FSM контекст (state: FSMContext = None). Используется для чтения/записи данных между переходами. |

### Структура Button

```typescript
interface Button {
  id: string;                    // ID кнопки
  text: string;                  // Текст кнопки
  action: string;                // Действие кнопки
  target?: string;               // Target для перехода
  url?: string;                  // URL для action='url'
  skipDataCollection?: boolean;  // Пропускать сбор данных
}
```

### Структура Node

```typescript
interface Node {
  id: string;           // ID узла
  inputVariable?: string;  // Input variable узла
}
```

### Структура TargetNode

```typescript
interface TargetNode {
  id: string;
  type: string;
  allowMultipleSelection?: boolean;
  continueButtonTarget?: string;
  multiSelectVariable?: string;
  data: {
    allowMultipleSelection?: boolean;
    continueButtonTarget?: string;
    multiSelectVariable?: string;
    keyboardType?: 'inline' | 'reply' | 'none';
    buttons?: any[];
    messageText?: string;
    resizeKeyboard?: boolean;
    oneTimeKeyboard?: boolean;
    command?: string;
  };
}
```

## Примеры использования

### Базовый multi-select с done кнопкой

```typescript
import { generateMultiSelectButtonHandler } from './multi-select-button-handler.renderer';

const code = generateMultiSelectButtonHandler({
  targetNode: {
    id: 'node_123',
    type: 'message',
    allowMultipleSelection: true,
    continueButtonTarget: 'next_node',
    multiSelectVariable: 'user_interests',
    data: {
      allowMultipleSelection: true,
      continueButtonTarget: 'next_node',
      multiSelectVariable: 'user_interests',
    },
  },
  callbackData: 'ms_abc123_btn456',
  shortNodeIdForDone: 'abc123',
  button: {
    id: 'btn_1',
    text: 'Опция 1',
    action: 'goto',
    target: 'next',
    skipDataCollection: false,
  },
  node: {
    id: 'node_123',
    inputVariable: 'user_choice',
  },
  nodes: [
    { id: 'node_123', type: 'message', data: {} },
    { id: 'next_node', type: 'message', data: {} },
  ],
});
```

**Вывод:**

```python
    @dp.callback_query(lambda c: c.data == "ms_abc123_btn456" or c.data.startswith("ms_abc123_btn456_btn_") or c.data == "done_abc123")
    async def handle_callback_ms_abc123_btn456(callback_query: types.CallbackQuery):
        await callback_query.answer()
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"📱 Обработка callback: {callback_data}")

        # Проверяем, является ли это кнопкой "Готово" для множественного выбора
        if callback_data == "done_abc123":
            logging.info(f"🏁 Обработка кнопки Готово для множественного выбора: {callback_data}")

            # Сохраняем выбранные значения в базу данных
            selected_options = user_data.get(user_id, {}).get("multi_select_ms_abc123_btn456", [])
            if selected_options:
                selected_text = ", ".join(selected_options)

                # Универсальная логика аккумуляции для всех множественных выборов
                existing_data = await get_user_data_from_db(user_id, "user_interests")
                existing_selections = []
                if existing_data and existing_data.strip():
                    existing_selections = [s.strip() for s in existing_data.split(",") if s.strip()]

                all_selections = list(set(existing_selections + selected_options))
                final_text = ", ".join(all_selections)
                await update_user_data_in_db(user_id, "user_interests", final_text)
                logging.info(f"✅ Аккумулировано в переменную user_interests: {final_text}")

            # Очищаем состояние множественного выбора
            if user_id in user_data:
                user_data[user_id].pop("multi_select_ms_abc123_btn456", None)
                user_data[user_id].pop("multi_select_node", None)
                user_data[user_id].pop("multi_select_type", None)
                user_data[user_id].pop("multi_select_variable", None)

            # Переход к следующему узлу
            next_node_id = "next_node"
            logging.info(f"🚀 DEBUG: targetNode.id=node_123, continueButtonTarget=next_node, nextNodeId=next_node")

            try:
                await handle_callback_next_node(callback_query)
            except Exception as e:
                logging.error(f"Ошибка при переходе к следующему узлу next_node: {e}")
                await callback_query.message.edit_text("Переход завершен")
            return

        button_text = "Опция 1"

        # Сохранение переменной из узла
        await update_user_data_in_db(user_id, "user_choice", button_text)
        logging.info(f"Переменная user_choice сохранена: " + str(button_text) + f" (пользователь {user_id})")
```

### Без done кнопки

```typescript
const code = generateMultiSelectButtonHandler({
  targetNode: {
    id: 'node_456',
    type: 'message',
    allowMultipleSelection: false,
    data: {},
  },
  callbackData: 'ms_def456_btn789',
  button: {
    id: 'btn_2',
    text: 'Кнопка 2',
    action: 'goto',
    skipDataCollection: false,
  },
  node: {
    id: 'node_456',
    inputVariable: 'selection',
  },
  nodes: [{ id: 'node_456', type: 'message', data: {} }],
});
```

### С skipDataCollection

```typescript
const code = generateMultiSelectButtonHandler({
  targetNode: { id: 'node_789', type: 'message', data: {} },
  callbackData: 'ms_ghi789_btn012',
  button: {
    id: 'btn_3',
    text: 'Пропустить',
    action: 'goto',
    skipDataCollection: true,
  },
  node: { id: 'node_789', inputVariable: 'skip_var' },
  nodes: [{ id: 'node_789', type: 'message', data: {} }],
});
```

## Функциональность

### Обработка кнопки "Готово"

Если `targetNode.allowMultipleSelection === true` и `targetNode.continueButtonTarget` указан, генерируется обработчик для кнопки "Готово" с логикой:
- Сохранение выбранных значений в БД с аккумуляцией
- Очистка состояния multi-select
- Переход к следующему узлу

### Специальная логика для metro_selection

Для узлов с ID содержащим `metro_selection` и переходом к `interests_result` генерируется специальная логика сохранения выбора метро и установки флага `show_metro_keyboard`.

### Сохранение переменных

- При наличии `node.inputVariable` - сохранение в указанную переменную
- При отсутствии - сохранение как простое значение
- При `button.skipDataCollection === true` - пропуск сохранения

## Тесты

Запуск тестов:

```bash
npm test -- multi-select-button-handler.test.ts
```

### Покрытие тестов

- Валидные данные (6 тестов)
- Логика сохранения переменных (3 теста)
- Callback data генерация (2 теста)
- Невалидные данные (2 теста)
- Валидация схемы (3 теста)
- Производительность (2 теста)
- Отступы (2 теста)

## Интеграция

Шаблон используется в:
- `lib/bot-generator/node-handlers/process-node-buttons.ts` - обработка кнопок inline-узлов

Для использования в шаблоне:

```jinja2
{% include 'handlers/multi-select-button-handler/multi-select-button-handler.py.jinja2' %}
```

## Зависимости в генерируемом коде

- `user_data` - глобальная переменная для хранения данных пользователей
- `get_user_data_from_db()` - функция загрузки данных из БД
- `update_user_data_in_db()` - функция сохранения данных в БД
- `get_moscow_time()` - функция получения московского времени
- `logging` - модуль логирования
- `safe_edit_or_send()` - функция безопасной отправки/редактирования сообщения
