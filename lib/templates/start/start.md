# Шаблон обработчика команды /start (start.py.jinja2)

## Описание

Шаблон генерирует Python обработчик для команды /start Telegram бота. Это специальная команда, которая вызывается при первом запуске бота пользователем. Поддерживает все основные функции: проверки безопасности, сохранение пользователей, множественный выбор, клавиатуры, замену переменных, синонимы команд и автопереходы.

## Параметры

| Параметр | Тип | Описание | Значение по умолчанию |
|----------|-----|----------|----------------------|
| nodeId | string | Уникальный идентификатор узла | - |
| messageText | string | Текст сообщения | '' |
| isPrivateOnly | boolean | Только приватные чаты | false |
| adminOnly | boolean | Только администраторы | false |
| requiresAuth | boolean | Требуется авторизация | false |
| userDatabaseEnabled | boolean | База данных пользователей включена | false |
| synonyms | string[] | Синонимы команды | [] |
| allowMultipleSelection | boolean | Множественный выбор включен | false |
| multiSelectVariable | string | Переменная для хранения выбора | '' |
| buttons | Button[] | Кнопки | [] |
| keyboardType | 'inline' \| 'reply' \| 'none' | Тип клавиатуры | 'none' |
| enableAutoTransition | boolean | Автопереход включен | false |
| autoTransitionTo | string | Цель автоперехода | '' |
| collectUserInput | boolean | Сбор пользовательского ввода | false |
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

### Пример 1: Базовый /start

```typescript
generateStart({
  nodeId: 'start_1',
  messageText: '👋 Добро пожаловать в наш бот!\n\nВыберите раздел меню:',
});
```

### Пример 2: /start с проверками безопасности

```typescript
generateStart({
  nodeId: 'start_2',
  messageText: '🔒 Привет, администратор!',
  isPrivateOnly: true,
  adminOnly: true,
  requiresAuth: true,
  userDatabaseEnabled: true,
  formatMode: 'html',
});
```

### Пример 3: /start с множественным выбором

```typescript
generateStart({
  nodeId: 'start_3',
  messageText: '📋 Выберите ваши интересы:',
  allowMultipleSelection: true,
  multiSelectVariable: 'user_interests',
  buttons: [
    { text: '🏃 Спорт', action: 'selection', target: 'sport', id: 'btn_sport' },
    { text: '🎵 Музыка', action: 'selection', target: 'music', id: 'btn_music' },
    { text: '✅ Готово', action: 'complete', target: 'done', id: 'btn_done' },
  ],
  keyboardType: 'inline',
});
```

### Пример 4: /start с автопереходом

```typescript
generateStart({
  nodeId: 'start_4',
  messageText: '🚀 Запускаю бота...',
  enableAutoTransition: true,
  autoTransitionTo: 'main_menu',
});
```

### Пример 5: /start с синонимами

```typescript
generateStart({
  nodeId: 'start_5',
  messageText: '👋 Привет! Рад вас видеть!',
  synonyms: ['привет', 'здравствуй', 'hello'],
  keyboardType: 'reply',
  buttons: [
    { text: '📖 О боте', action: 'callback', target: 'about', id: 'btn_about' },
  ],
});
```

## Примеры вывода

### Вывод 1: Базовый /start

```python
@dp.message(CommandStart())
async def start_handler(message: types.Message):
    """Обработчик команды /start"""
    logging.info(f"Команда /start вызвана пользователем {message.from_user.id}")

    text = "👋 Добро пожаловать в наш бот!\n\nВыберите раздел меню:"

    # Универсальная замена переменных
    all_user_vars = await init_all_user_vars(user_id)
    text = replace_variables_in_text(text, all_user_vars, {})

    keyboard = None
    await message.answer(text, reply_markup=keyboard)
```

### Вывод 2: /start с проверками безопасности

```python
@dp.message(CommandStart())
async def start_handler(message: types.Message):
    """Обработчик команды /start"""
    logging.info(f"Команда /start вызвана пользователем {message.from_user.id}")

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

    text = "🔒 Привет, администратор!"
    await message.answer(text, reply_markup=keyboard, parse_mode="HTML")
```

### Вывод 3: /start с множественным выбором

```python
@dp.message(CommandStart())
async def start_handler(message: types.Message):
    """Обработчик команды /start"""
    logging.info(f"Команда /start вызвана пользователем {message.from_user.id}")

    # Инициализируем состояние множественного выбора
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["multi_select"] = []
    user_data[user_id]["multi_select_node"] = "start_3"
    logging.info(f"Инициализировано состояние множественного выбора для узла start_3")

    # Клавиатура
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🏃 Спорт", callback_data="select_btn_sport"))
    builder.add(InlineKeyboardButton(text="🎵 Музыка", callback_data="select_btn_music"))
    builder.add(InlineKeyboardButton(text="✅ Готово", callback_data="done"))
    keyboard = builder.as_markup()

    await message.answer(text, reply_markup=keyboard)
```

### Вывод 4: /start с автопереходом

```python
@dp.message(CommandStart())
async def start_handler(message: types.Message):
    """Обработчик команды /start"""
    logging.info(f"Команда /start вызвана пользователем {message.from_user.id}")

    text = "🚀 Запускаю бота..."
    await message.answer(text, reply_markup=keyboard)

    # ⚡ АВТОПЕРЕХОД к main_menu
    logging.info(f"⚡ Автопереход от узла start_4 к узлу main_menu")
    class FakeCallbackQuery:
        def __init__(self, message, target_node_id):
            self.from_user = message.from_user
            self.chat = message.chat
            self.data = target_node_id
            self.message = message

        async def answer(self, *args, **kwargs):
            pass

    fake_callback = FakeCallbackQuery(message, "main_menu")
    await handle_callback_main_menu(fake_callback)
    return
```

### Вывод 5: Обработчики синонимов

Синонимы для /start работают во всех типах чатов (без фильтра по типу чата). При `isPrivateOnly=true` добавляется проверка приватного чата:

```python
@dp.message(lambda message: message.text and message.text.lower() == "привет")
async def start_synonym_привет_handler(message: types.Message):
    # Синоним для команды /start
    await start_handler(message)
```

### Вывод 6: Второй обработчик handle_callback_start

Шаблон всегда генерирует второй обработчик `handle_callback_start` для кнопок "Назад в меню" (`callback_data="start"`):

```python
@dp.callback_query(lambda c: c.data == "start")
async def handle_callback_start(callback_query: types.CallbackQuery):
    """Обработчик callback кнопки с переходом на /start"""
    try:
        await callback_query.answer()
    except Exception:
        pass

    user_id = callback_query.from_user.id
    # ... сохранение пользователя, формирование текста и клавиатуры ...
    await bot.send_message(callback_query.message.chat.id, text, reply_markup=keyboard)
```

## Логика условий

### Проверки безопасности

1. **isPrivateOnly**: Проверяет тип чата через `is_private_chat(message)`
2. **adminOnly**: Проверяет права администратора через `is_admin(user_id)`
3. **requiresAuth**: Проверяет авторизацию через `check_auth(user_id)`

### Множественный выбор

1. Инициализируется массив `multi_select` в `user_data[user_id]`
2. Сохраняется `multi_select_node` для отслеживания текущего узла
3. Кнопки с `action='selection'` получают callback_data с префиксом `select_`

### Автопереходы

1. Создаётся класс `FakeCallbackQuery` для эмуляции callback
2. Вызывается `handle_callback_<target>(fake_callback)`
3. После автоперехода выполняется `return` для прекращения обработки

### Типы клавиатур

- **inline**: InlineKeyboardBuilder с InlineKeyboardButton
- **reply**: ReplyKeyboardBuilder с KeyboardButton
- **none**: keyboard = None

### Типы кнопок

- **callback**: InlineKeyboardButton с callback_data
- **url**: InlineKeyboardButton с url
- **selection**: InlineKeyboardButton с callback_data (префикс `select_`)
- **reply**: KeyboardButton с text

## Тесты

Запуск тестов:

```bash
npm test -- start.test.ts
```

Тесты покрывают:
- Валидные данные (14 тестов)
- Проверки безопасности (3 теста)
- Множественный выбор (3 теста)
- Автопереходы (2 теста)
- Синонимы (3 теста)
- Callback-обработчик handle_callback_start (3 теста)
- Невалидные данные (4 теста)
- Валидация схемы (5 тестов)
- Производительность (2 теста)

## Зависимости

- aiogram (Bot, types.Message, CommandStart, InlineKeyboardBuilder, ReplyKeyboardBuilder)
- datetime (для сохранения времени регистрации)
- logging (для логирования)
- json (для работы с данными пользователя)

## Структура файлов

```
start/
├── start.py.jinja2       (шаблон обработчика)
├── start.params.ts       (типы параметров)
├── start.schema.ts       (Zod схема)
├── start.renderer.ts     (функция рендеринга)
├── start.fixture.ts      (тестовые данные)
├── start.test.ts         (тесты)
├── start.md              (документация)
└── index.ts              (экспорт)
```
