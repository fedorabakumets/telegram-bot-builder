# Шаблон обработчика команд (command.py.jinja2)

## Описание

Шаблон генерирует Python обработчик для команд Telegram бота. Поддерживает все основные функции обработки команд: проверки безопасности, сохранение пользователей, условные сообщения, клавиатуры, замену переменных и синонимы команд.

## Параметры

| Параметр | Тип | Описание | Значение по умолчанию |
|----------|-----|----------|----------------------|
| nodeId | string | Уникальный идентификатор узла | - |
| command | string | Команда (например, "/help") | - |
| messageText | string | Текст сообщения | '' |
| isPrivateOnly | boolean | Только приватные чаты | false |
| adminOnly | boolean | Только администраторы | false |
| requiresAuth | boolean | Требуется авторизация | false |
| userDatabaseEnabled | boolean | База данных пользователей включена | false |
| synonyms | string[] | Синонимы команды | [] |
| enableConditionalMessages | boolean | Условные сообщения включены | false |
| conditionalMessages | ConditionalMessage[] | Условные сообщения | [] |
| fallbackMessage | string | Запасное сообщение | '' |
| keyboardType | 'inline' \| 'reply' \| 'none' | Тип клавиатуры | 'none' |
| buttons | Button[] | Кнопки | [] |
| formatMode | 'html' \| 'markdown' \| 'none' | Режим форматирования | 'none' |
| imageUrl | string | URL изображения | '' |
| documentUrl | string | URL документа | '' |
| videoUrl | string | URL видео | '' |
| audioUrl | string | URL аудио | '' |
| attachedMedia | string[] | Прикреплённые медиа переменные | [] |

## Типы

### KeyboardType

```typescript
type KeyboardType = 'inline' | 'reply' | 'none';
```

### FormatMode

```typescript
type FormatMode = 'html' | 'markdown' | 'none';
```

### ConditionalMessage

```typescript
interface ConditionalMessage {
  condition: string;
  variableName?: string;
  priority?: number;
  buttons?: Button[];
  collectUserInput?: boolean;
  inputVariable?: string;
  nextNodeAfterInput?: string;
  waitForTextInput?: boolean;
  enableTextInput?: boolean;
}
```

### Button

```typescript
interface Button {
  text: string;
  action: string;
  target: string;
  id: string;
}
```

## Примеры использования

### Пример 1: Базовая команда

```typescript
generateCommand({
  nodeId: 'cmd_1',
  command: '/help',
  messageText: '🤖 Доступные команды:\n\n/start - Начать работу\n/help - Эта справка',
});
```

### Пример 2: Команда с проверками безопасности

```typescript
generateCommand({
  nodeId: 'cmd_2',
  command: '/admin',
  messageText: '🔒 Панель администратора',
  isPrivateOnly: true,
  adminOnly: true,
  requiresAuth: true,
  userDatabaseEnabled: true,
  formatMode: 'html',
});
```

### Пример 3: Команда с условными сообщениями

```typescript
generateCommand({
  nodeId: 'cmd_3',
  command: '/profile',
  messageText: '👤 Ваш профиль',
  enableConditionalMessages: true,
  conditionalMessages: [
    {
      condition: 'user_data_exists',
      variableName: 'balance',
      priority: 1,
      buttons: [
        { text: 'Пополнить', action: 'callback', target: 'deposit', id: 'btn_deposit' },
        { text: 'Вывести', action: 'callback', target: 'withdraw', id: 'btn_withdraw' },
      ],
    },
  ],
  fallbackMessage: '📝 Профиль не найден',
});
```

### Пример 4: Команда с inline клавиатурой

```typescript
generateCommand({
  nodeId: 'cmd_4',
  command: '/menu',
  messageText: '📋 Главное меню',
  keyboardType: 'inline',
  buttons: [
    { text: '📊 Статистика', action: 'callback', target: 'stats', id: 'btn_stats' },
    { text: '⚙️ Настройки', action: 'callback', target: 'settings', id: 'btn_settings' },
    { text: '🌐 Сайт', action: 'url', target: 'https://example.com', id: 'btn_site' },
  ],
});
```

### Пример 5: Команда с синонимами

```typescript
generateCommand({
  nodeId: 'cmd_5',
  command: '/start',
  messageText: '👋 Добро пожаловать!',
  synonyms: ['привет', 'здравствуй', 'hello'],
  keyboardType: 'reply',
  buttons: [
    { text: '📖 О боте', action: 'callback', target: 'about', id: 'btn_about' },
  ],
});
```

## Примеры вывода

### Вывод 1: Базовая команда

```python
@dp.message(Command("help"))
async def help_handler(message: types.Message):
    """Обработчик команды /help"""
    logging.info(f"Команда /help вызвана пользователем {message.from_user.id}")

    text = "🤖 Доступные команды:\n\n/start - Начать работу\n/help - Эта справка"

    # Универсальная замена переменных
    all_user_vars = await init_all_user_vars(user_id)
    text = replace_variables_in_text(text, all_user_vars, {})

    keyboard = None
    await message.answer(text, reply_markup=keyboard)
```

### Вывод 2: Команда с проверками безопасности

```python
@dp.message(Command("admin"))
async def admin_handler(message: types.Message):
    """Обработчик команды /admin"""
    logging.info(f"Команда /admin вызвана пользователем {message.from_user.id}")

    if not await is_private_chat(message):
        await message.answer("❌ Эта команда доступна только в приватных чатах")
        return

    if not await is_admin(message.from_user.id):
        await message.answer("❌ У вас нет прав для выполнения этой команды")
        return

    if not await check_auth(message.from_user.id):
        await message.answer("❌ Необходимо войти в систему для выполнения этой команды")
        return

    # Сохранение пользователя в БД
    saved_to_db = await save_user_to_db(user_id, username, first_name, last_name, avatar_url)
    user_name = await init_user_variables(user_id, message.from_user)

    text = "🔒 Панель администратора"
    await message.answer(text, reply_markup=keyboard, parse_mode="HTML")
```

### Вывод 3: Команда с inline клавиатурой

```python
@dp.message(Command("menu"))
async def menu_handler(message: types.Message):
    """Обработчик команды /menu"""
    logging.info(f"Команда /menu вызвана пользователем {message.from_user.id}")

    text = "📋 Главное меню"

    # Клавиатура
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📊 Статистика", callback_data="btn_stats"))
    builder.add(InlineKeyboardButton(text="⚙️ Настройки", callback_data="btn_settings"))
    builder.add(InlineKeyboardButton(text="🌐 Сайт", url="https://example.com"))
    keyboard = builder.as_markup()

    await message.answer(text, reply_markup=keyboard)
```

### Вывод 4: Обработчики синонимов

```python
@dp.message(lambda message: message.text and message.text.lower() == "привет" and message.chat.type in ['group', 'supergroup'])
async def start_synonym_1_handler(message: types.Message):
    """Обработчик синоима 'привет' для команды /start"""
    logging.info(f"Синоним 'привет' вызван пользователем {message.from_user.id}")

    # ... та же логика что и в основной команде
```

## Логика условий

### Проверки безопасности

1. **isPrivateOnly**: Проверяет тип чата через `is_private_chat(message)`
2. **adminOnly**: Проверяет права администратора через `is_admin(user_id)`
3. **requiresAuth**: Проверяет авторизацию через `check_auth(user_id)`

### Условные сообщения

1. Сортируются по приоритету (убывание)
2. Проверяются через `check_user_variable_inline(variableName, user_data_dict)`
3. При выполнении условия показывается клавиатура (если есть кнопки)
4. При `collectUserInput=true` настраивается ожидание ввода
5. Если ни одно условие не выполнено, используется fallback сообщение

### Типы клавиатур

- **inline**: InlineKeyboardBuilder с InlineKeyboardButton
- **reply**: ReplyKeyboardBuilder с KeyboardButton
- **none**: keyboard = None

### Типы кнопок

- **callback**: InlineKeyboardButton с callback_data
- **url**: InlineKeyboardButton с url
- **reply**: KeyboardButton с text

## Тесты

Запуск тестов:

```bash
npm test -- command.test.ts
```

Тесты покрывают:
- Валидные данные (14 тестов)
- Проверки безопасности (3 теста)
- Условные сообщения (3 теста)
- Клавиатуры (3 теста)
- Синонимы (3 теста)
- Невалидные данные (4 теста)
- Валидация схемы (5 тестов)
- Производительность (2 теста)

## Зависимости

- aiogram (Bot, types.Message, Command, InlineKeyboardBuilder, ReplyKeyboardBuilder)
- datetime (для сохранения статистики команд)
- logging (для логирования)

## Структура файлов

```
command/
├── command.py.jinja2       (шаблон обработчика)
├── command.params.ts       (типы параметров)
├── command.schema.ts       (Zod схема)
├── command.renderer.ts     (функция рендеринга)
├── command.fixture.ts      (тестовые данные)
├── command.test.ts         (тесты)
├── command.md              (документация)
└── index.ts                (экспорт)
```
