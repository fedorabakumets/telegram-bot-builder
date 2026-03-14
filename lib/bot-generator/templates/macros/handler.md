# Макрос: handler.py.jinja2

## Описание

Предоставляет макросы для генерации обработчиков разных типов узлов Telegram бота: start, command, callback.

## Параметры

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `node.id` | `string` | - | ID узла |
| `node.type` | `'start' \| 'command' \| 'callback'` | - | Тип узла |
| `node.data.messageText` | `string` | - | Текст сообщения |
| `node.data.command` | `string` | - | Команда (для command типа) |
| `node.data.buttons` | `Button[][]` | - | Кнопки |
| `node.data.keyboardType` | `'inline' \| 'reply'` | `'inline'` | Тип клавиатуры |
| `enableComments` | `boolean` | `false` | Включить комментарии |

## Использование

### Базовое

```typescript
import { renderHandlerMacro } from './handler.renderer';

const code = renderHandlerMacro({
  node: {
    id: 'start_1',
    type: 'start',
    data: { messageText: 'Hello!' },
  },
  enableComments: true,
});
```

### Start узел

**Вход:**
```typescript
{
  node: {
    id: 'start_1',
    type: 'start',
    data: { messageText: 'Привет!' }
  },
  enableComments: false
}
```

**Выход:**
```python
@dp.message(CommandStart())
async def start_handler(message: types.Message):
    user_id = message.from_user.id
    username = message.from_user.username
    first_name = message.from_user.first_name
    last_name = message.from_user.last_name

    await save_user_to_db(user_id, username, first_name, last_name)

    user_name = await init_user_variables(user_id, message.from_user)

    text = "Привет!"

    all_user_vars = await init_all_user_vars(user_id)
    variable_filters = user_data.get(user_id, {}).get("_variable_filters", {})
    text = replace_variables_in_text(text, all_user_vars, variable_filters)

    await message.answer(text)
```

### Command узел

**Вход:**
```typescript
{
  node: {
    id: 'cmd_help',
    type: 'command',
    data: { command: '/help', messageText: 'Помощь' }
  },
  enableComments: false
}
```

**Выход:**
```python
@dp.message(Command("help"))
async def handle_help_command(message: types.Message):
    user_id = message.from_user.id

    text = "Помощь"
    all_user_vars = await init_all_user_vars(user_id)
    variable_filters = user_data.get(user_id, {}).get("_variable_filters", {})
    text = replace_variables_in_text(text, all_user_vars, variable_filters)

    await message.answer(text)
```

### Callback узел

**Вход:**
```typescript
{
  node: {
    id: 'cb_1',
    type: 'callback',
    data: { messageText: 'Callback!' }
  },
  enableComments: false
}
```

**Выход:**
```python
@dp.callback_query(lambda c: c.data == "cb_1" or c.data.startswith("cb_1_btn_"))
async def handle_callback_cb_1(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id

    try:
        await callback_query.answer()
    except Exception:
        pass

    text = "Callback!"
    all_user_vars = await init_all_user_vars(user_id)
    variable_filters = user_data.get(user_id, {}).get("_variable_filters", {})
    text = replace_variables_in_text(text, all_user_vars, variable_filters)

    await safe_edit_or_send(callback_query, text, node_id="cb_1")
```

## Логика условий

### Типы узлов
```typescript
if (node.type === 'start') {
  // render_start_handler
} else if (node.type === 'command') {
  // render_command_handler
} else if (node.type === 'callback') {
  // render_callback_handler
}
```

### Комментарии
```typescript
if (enableComments === true) {
  // Добавить @@NODE_START:id@@ и @@NODE_END:id@@
}
```

### Клавиатура
```typescript
if (node.data.buttons) {
  // Сгенерировать keyboard
  if (keyboardType === 'inline') {
    // InlineKeyboardMarkup
  } else {
    // ReplyKeyboardBuilder
  }
}
```

## Тесты

### Запуск тестов

```bash
npm test -- handler.test.ts
```

### Покрытие тестов

- ✅ Start узел
- ✅ Command узел
- ✅ Callback узел
- ✅ Комментарии (включено/выключено)
- ✅ Клавиатуры (inline/reply)
- ✅ Невалидные данные
- ✅ Производительность

## Зависимости

### Внешние
- `zod` — валидация параметров
- `nunjucks` — рендеринг макроса

### Внутренние
- `../template-renderer` — функция рендеринга
- `./handler.params` — типы параметров
- `./handler.schema` — Zod схема

## Файлы

```
macros/
├── handler.py.jinja2       # Макрос (120 строк)
├── handler.params.ts       # Типы (24 строки)
├── handler.schema.ts       # Zod схема (24 строки)
├── handler.renderer.ts     # Функция рендеринга (26 строк)
├── handler.test.ts         # Тесты (180 строк)
└── handler.md              # Документация
```

## См. также

- [`universal-handlers.py.jinja2`](../universal-handlers/universal-handlers.md) — fallback обработчики
- [`bot.py.jinja2`](../bot.py.jinja2) — главный шаблон бота
