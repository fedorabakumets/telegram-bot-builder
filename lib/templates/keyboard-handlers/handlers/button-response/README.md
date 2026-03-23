# Шаблон button-response обработчика (button-response.py.jinja2)

## Описание

Шаблон для генерации Python кода обработчиков callback кнопок при сборе пользовательского ввода через кнопочные ответы. Генерирует логику обработки одиночного и множественного выбора, навигации к другим узлам, выполнения команд и открытия URL.

## Параметры

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `userInputNodes` | `UserInputNode[]` | Да | `[]` | Узлы с кнопочными ответами |
| `allNodes` | `any[]` | Да | `[]` | Массив всех узлов для навигации |
| `hasUrlButtonsInProject` | `boolean` | Нет | `false` | Есть ли URL кнопки в проекте |
| `indentLevel` | `string` | Нет | `''` | Уровень отступа |

### Структура UserInputNode

```typescript
interface UserInputNode {
  id: string;                    // ID узла
  responseOptions: ResponseOption[];  // Опции ответа
  allowSkip?: boolean;           // Разрешить пропуск
}
```

### Структура ResponseOption

```typescript
interface ResponseOption {
  text: string;      // Текст опции
  value?: string;    // Значение опции
  action?: string;   // Действие: 'goto', 'command', 'url'
  target?: string;   // Target для перехода
  url?: string;      // URL для action='url'
}
```

## Примеры использования

### Базовый button-response

```typescript
import { generateButtonResponse } from './button-response.renderer';

const code = generateButtonResponse({
  userInputNodes: [
    {
      id: 'node_123',
      responseOptions: [
        { text: 'Опция 1', value: 'opt1' },
        { text: 'Опция 2', value: 'opt2' },
        { text: 'Опция 3', value: 'opt3' },
      ],
      allowSkip: false,
    },
  ],
  allNodes: [
    { id: 'node_123', type: 'message' },
    { id: 'next_node', type: 'message' },
  ],
  hasUrlButtonsInProject: false,
});
```

**Вывод:**

```python
@dp.callback_query(F.data == "response_node_123_0")
async def handle_response_node_123_0(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id

    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return

    config = user_data[user_id]["button_response_config"]
    selected_value = "opt1"
    selected_text = "Опция 1"

    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
    timestamp = get_moscow_time()
    node_id = config.get("node_id", "unknown")

    response_data = {
        "value": selected_value,
        "text": selected_text,
        "type": "button_choice",
        "timestamp": timestamp,
        "nodeId": node_id,
        "variable": variable_name
    }

    user_data[user_id][variable_name] = response_data

    if config.get("save_to_database"):
        saved_to_db = await update_user_data_in_db(user_id, variable_name, response_data)
        if saved_to_db:
            logging.info(f"✅ Кнопочный ответ сохранен в БД: {variable_name} = {selected_text}")

    success_message = config.get("success_message", "Спасибо за ваш выбор!")
    await callback_query.message.edit_text(f"{success_message}\\n\\n✅ Ваш выбор: {selected_text}")

    del user_data[user_id]["button_response_config"]
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")

    # Навигация
    options = config.get("options", [])
    current_option = None
    for option in options:
        if option.get("callback_data") == "response_node_123_0":
            current_option = option
            break

    if current_option:
        option_action = current_option.get("action", "goto")
        option_target = current_option.get("target", "")

        if option_action == "goto" and option_target:
            target_node_id = option_target
            try:
                if target_node_id == "next_node":
                    await handle_callback_next_node(callback_query)
                else:
                    logging.warning(f"Неизвестный целевой узел: {target_node_id}")
            except Exception as e:
                logging.error(f"Ошибка при переходе к узлу {target_node_id}: {e}")
```

### С множественным выбором

```typescript
const code = generateButtonResponse({
  userInputNodes: [
    {
      id: 'node_multi',
      responseOptions: [
        { text: 'Опция 1', value: 'opt1' },
        { text: 'Опция 2', value: 'opt2' },
        { text: 'Готово', value: 'done' },
      ],
      allowSkip: false,
    },
  ],
  allNodes: [...],
  hasUrlButtonsInProject: false,
});
```

### С URL кнопками

```typescript
const code = generateButtonResponse({
  userInputNodes: [
    {
      id: 'node_url',
      responseOptions: [
        {
          text: 'Открыть сайт',
          value: 'site',
          action: 'url',
          url: 'https://example.com',
        },
        { text: 'Пропустить', value: 'skip', action: 'goto', target: 'next' },
      ],
      allowSkip: false,
    },
  ],
  allNodes: [...],
  hasUrlButtonsInProject: true,
});
```

### С allowSkip

```typescript
const code = generateButtonResponse({
  userInputNodes: [
    {
      id: 'node_skip',
      responseOptions: [
        { text: 'Да', value: 'yes' },
        { text: 'Нет', value: 'no' },
      ],
      allowSkip: true,
    },
  ],
  allNodes: [...],
  hasUrlButtonsInProject: false,
});
```

**Вывод для skip обработчика:**

```python
@dp.callback_query(F.data == "skip_node_skip")
async def handle_skip_node_skip(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id

    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла", show_alert=True)
        return

    await callback_query.message.edit_text("⏭️ Ответ пропущен")
    del user_data[user_id]["button_response_config"]

    logging.info(f"Пользователь {user_id} пропустил кнопочный ответ")
```

## Функциональность

### Одиночный выбор

- Сохранение выбора в `user_data` и БД
- Структурированный ответ с метаданными (timestamp, nodeId, variable)
- Сообщение об успехе с подтверждением выбора
- Очистка состояния `button_response_config`

### Множественный выбор

- Добавление/удаление элементов из списка выбора
- Кнопка "Готово" для завершения выбора
- Структурированный ответ с массивом выбранных значений
- Предупреждение при попытке завершить без выбора

### Навигация

- **goto**: Переход к целевому узлу через `handle_callback_*`
- **command**: Выполнение команды через `handle_command_*` или `start_handler`
- **url**: Открытие ссылки с InlineKeyboardMarkup

### Обработка ошибок

- Проверка сессии (`button_response_config`)
- Логирование ошибок навигации
- Предупреждения о неизвестных узлах/командах

## Тесты

Запуск тестов:

```bash
npm test -- button-response.test.ts
```

### Покрытие тестов

- Валидные данные (7 тестов)
- Обработка одиночного выбора (3 теста)
- Обработка множественного выбора (3 теста)
- Навигация (4 теста)
- Логирование (2 теста)
- Невалидные данные (2 теста)
- Валидация схемы (3 теста)
- Производительность (2 теста)

## Интеграция

Шаблон используется в:
- `bot.py.jinja2` - главный шаблон бота
- Адаптеры в `lib/bot-generator/Keyboard/`

Для использования в шаблоне:

```jinja2
{% include 'handlers/button-response/button-response.py.jinja2' %}
```

## Зависимости в генерируемом коде

- `types.CallbackQuery` - из aiogram
- `dp` - Dispatcher из aiogram
- `F` - Filter из aiogram
- `user_data` - глобальная переменная для хранения данных пользователей
- `update_user_data_in_db()` - функция обновления данных в БД
- `get_moscow_time()` - функция получения времени Москвы
- `InlineKeyboardMarkup`, `InlineKeyboardButton` - из aiogram
- `logging` - модуль логирования
- `handle_callback_*` - обработчики callback кнопок
- `handle_command_*`, `start_handler` - обработчики команд
