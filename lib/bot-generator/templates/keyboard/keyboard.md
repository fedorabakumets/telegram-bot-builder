# Шаблон клавиатуры (keyboard.py.jinja2)

## Описание

Шаблон для генерации Python кода клавиатур Telegram бота (inline и reply).

## Параметры

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `keyboardType` | `'inline' \| 'reply' \| 'none'` | Да | `'none'` | Тип клавиатуры |
| `buttons` | `Button[]` | Да | `[]` | Массив кнопок |
| `keyboardLayout` | `KeyboardLayout` | Нет | `undefined` | Раскладка клавиатуры |
| `oneTimeKeyboard` | `boolean` | Да | `false` | Скрыть после использования |
| `resizeKeyboard` | `boolean` | Да | `true` | Изменить размер под кнопки |

### Структура Button

```typescript
interface Button {
  id: string;      // Уникальный идентификатор
  text: string;    // Текст кнопки
  action: string;  // Действие: 'callback', 'url', 'selection', 'goto', 'command'
  target?: string; // Цель перехода
  url?: string;    // URL для action='url'
}
```

### Структура KeyboardLayout

```typescript
interface KeyboardLayout {
  rows: Array<{ buttonIds: string[] }>; // Ряды кнопок
  columns: number;                       // Количество колонок
  autoLayout: boolean;                   // Авто-раскладка
}
```

## Примеры использования

### Inline клавиатура

```typescript
import { generateKeyboard } from './keyboard.renderer';

const code = generateKeyboard({
  keyboardType: 'inline',
  buttons: [
    { text: '📊 Статистика', action: 'callback', target: 'stats', id: 'btn_stats' },
    { text: '⚙️ Настройки', action: 'callback', target: 'settings', id: 'btn_settings' },
    { text: '🌐 Сайт', action: 'url', target: 'https://example.com', id: 'btn_site' },
  ],
  oneTimeKeyboard: false,
  resizeKeyboard: true,
});
```

**Вывод:**

```python
builder = InlineKeyboardBuilder()
builder.add(InlineKeyboardButton(text="📊 Статистика", callback_data="btn_stats"))
builder.add(InlineKeyboardButton(text="⚙️ Настройки", callback_data="btn_settings"))
builder.add(InlineKeyboardButton(text="🌐 Сайт", url="https://example.com"))
keyboard = builder.as_markup()
```

### Reply клавиатура

```typescript
const code = generateKeyboard({
  keyboardType: 'reply',
  buttons: [
    { text: '📖 О боте', action: 'callback', target: 'about', id: 'btn_about' },
    { text: '📞 Контакты', action: 'callback', target: 'contacts', id: 'btn_contacts' },
  ],
  oneTimeKeyboard: false,
  resizeKeyboard: true,
});
```

**Вывод:**

```python
builder = ReplyKeyboardBuilder()
builder.add(KeyboardButton(text="📖 О боте"))
builder.add(KeyboardButton(text="📞 Контакты"))
keyboard = builder.as_markup(
    resize_keyboard=True,
    one_time_keyboard=False
)
```

### Пустая клавиатура

```typescript
const code = generateKeyboard({
  keyboardType: 'none',
  buttons: [],
  oneTimeKeyboard: false,
  resizeKeyboard: true,
});
```

**Вывод:**

```python
keyboard = None
```

### С раскладкой

```typescript
const code = generateKeyboard({
  keyboardType: 'inline',
  buttons: [
    { text: 'Btn 1', action: 'callback', target: 'btn1', id: 'btn_1' },
    { text: 'Btn 2', action: 'callback', target: 'btn2', id: 'btn_2' },
    { text: 'Btn 3', action: 'callback', target: 'btn3', id: 'btn_3' },
    { text: 'Btn 4', action: 'callback', target: 'btn4', id: 'btn_4' },
  ],
  keyboardLayout: {
    rows: [
      { buttonIds: ['btn_1', 'btn_2'] },
      { buttonIds: ['btn_3', 'btn_4'] },
    ],
    columns: 2,
    autoLayout: false,
  },
  oneTimeKeyboard: false,
  resizeKeyboard: true,
});
```

**Вывод:**

```python
builder = InlineKeyboardBuilder()
builder.add(InlineKeyboardButton(text="Btn 1", callback_data="btn_1"))
builder.add(InlineKeyboardButton(text="Btn 2", callback_data="btn_2"))
builder.add(InlineKeyboardButton(text="Btn 3", callback_data="btn_3"))
builder.add(InlineKeyboardButton(text="Btn 4", callback_data="btn_4"))

# Ряд 1: btn_1, btn_2
# Ряд 2: btn_3, btn_4

keyboard = builder.as_markup()
```

## Типы действий кнопок

| Action | Описание | Пример callback_data |
|--------|----------|---------------------|
| `callback` | Обычная callback кнопка | `btn_stats` |
| `url` | Кнопка с URL | `url="https://..."` |
| `selection` | Кнопка выбора (множественный выбор) | `select_btn_stats` |
| `goto` | Переход к узлу | `node_btn_0` |
| `command` | Вызов команды | `cmd_help` |

## Тесты

Запуск тестов:

```bash
npm test -- keyboard.test.ts
```

### Покрытие тестов

- Валидные данные (5 тестов)
- Inline клавиатура (3 теста)
- Reply клавиатура (3 теста)
- Раскладка (3 теста)
- Невалидные данные (3 теста)
- Валидация схемы (5 тестов)
- Производительность (2 теста)

## Интеграция

Шаблон используется в:
- `start.py.jinja2` - обработчик команды /start
- `command.py.jinja2` - обработчик команд

Для использования в шаблоне:

```jinja2
{# Клавиатура #}
{% include 'keyboard/keyboard.py.jinja2' %}
```
