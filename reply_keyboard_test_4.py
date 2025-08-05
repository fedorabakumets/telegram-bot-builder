"""
⌨️ Тест Reply клавиатур - Telegram Bot
Сгенерировано с помощью TelegramBot Builder
"""

import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart, Command
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, BotCommand, ReplyKeyboardRemove
from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder
from aiogram.enums import ParseMode

# Токен вашего бота (получите у @BotFather)
BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"

# Настройка логирования
logging.basicConfig(level=logging.INFO)

# Создание бота и диспетчера
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# Список администраторов (добавьте свой Telegram ID)
ADMIN_IDS = [123456789]  # Замените на реальные ID администраторов

# Хранилище пользователей (в реальном боте используйте базу данных)
user_data = {}


# Утилитарные функции
async def is_admin(user_id: int) -> bool:
    return user_id in ADMIN_IDS

async def is_private_chat(message: types.Message) -> bool:
    return message.chat.type == "private"

async def check_auth(user_id: int) -> bool:
    # Здесь можно добавить логику проверки авторизации
    return user_id in user_data


@dp.message(CommandStart())
async def start_handler(message: types.Message):

    # Регистрируем пользователя в системе
    user_data[message.from_user.id] = {
        "username": message.from_user.username,
        "first_name": message.from_user.first_name,
        "last_name": message.from_user.last_name,
        "registered_at": message.date
    }

    text = "🎮 Добро пожаловать в тест Reply клавиатур!

Этот бот демонстрирует все возможности Reply кнопок:
• Обычные кнопки
• Контактные кнопки
• Геолокация
• Динамическое изменение клавиатур
• Удаление клавиатур"
    
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📋 Меню"))
    builder.add(KeyboardButton(text="📞 Мой контакт"))
    builder.add(KeyboardButton(text="📍 Моя геолокация"))
    builder.add(KeyboardButton(text="🎮 Игры"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

# Обработчики reply кнопок

@dp.message(lambda message: message.text == "📋 Меню")
async def handle_reply_btn_menu(message: types.Message):
    text = "📋 Главное меню:

Выберите раздел для изучения функций Reply клавиатур:"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="ℹ️ Информация"))
    builder.add(KeyboardButton(text="⚙️ Настройки"))
    builder.add(KeyboardButton(text="❓ Помощь"))
    builder.add(KeyboardButton(text="⌨️ Тест клавиатур"))
    builder.add(KeyboardButton(text="🔙 На главную"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🎮 Игры")
async def handle_reply_btn_games(message: types.Message):
    text = "🎮 Игры с Reply клавиатурами:

Простые игры используя только Reply кнопки:"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="✂️ Камень-Ножницы"))
    builder.add(KeyboardButton(text="🧠 Викторина"))
    builder.add(KeyboardButton(text="🔢 Калькулятор"))
    builder.add(KeyboardButton(text="🔙 На главную"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "ℹ️ Информация")
async def handle_reply_btn_info(message: types.Message):
    text = "ℹ️ Информация о Reply клавиатурах:

• Показываются внизу экрана
• Заменяют стандартную клавиатуру
• Могут запрашивать контакт/геолокацию
• Поддерживают автоматическое изменение размера
• Могут быть одноразовыми или постоянными"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔧 Возможности"))
    builder.add(KeyboardButton(text="📝 Примеры"))
    builder.add(KeyboardButton(text="🔙 Меню"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "⚙️ Настройки")
async def handle_reply_btn_settings(message: types.Message):
    text = "⚙️ Настройки Reply клавиатур:

Здесь можно настроить поведение клавиатур:
• Размер кнопок
• Поведение после нажатия
• Запрос разрешений"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📏 Размер"))
    builder.add(KeyboardButton(text="🎭 Поведение"))
    builder.add(KeyboardButton(text="🔙 Меню"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "❓ Помощь")
async def handle_reply_btn_help(message: types.Message):
    text = "❓ Справка по Reply клавиатурам:

📋 Основы использования
🔧 Настройки и возможности
🎯 Примеры и демонстрации
📞 Специальные кнопки
📍 Геолокация и контакты"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📋 Основы"))
    builder.add(KeyboardButton(text="📞 Спец кнопки"))
    builder.add(KeyboardButton(text="❓ FAQ"))
    builder.add(KeyboardButton(text="🔙 Меню"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "⌨️ Тест клавиатур")
async def handle_reply_btn_keyboard_test(message: types.Message):
    text = "⌨️ Тест различных конфигураций клавиатур:

Проверим все возможности Reply кнопок:"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔢 Сетка кнопок"))
    builder.add(KeyboardButton(text="🎭 Смешанные кнопки"))
    builder.add(KeyboardButton(text="📱 Минимальная"))
    builder.add(KeyboardButton(text="🔙 Меню"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🔙 На главную")
async def handle_reply_btn_back_start(message: types.Message):
    text = "🎮 Добро пожаловать в тест Reply клавиатур!

Этот бот демонстрирует все возможности Reply кнопок:
• Обычные кнопки
• Контактные кнопки
• Геолокация
• Динамическое изменение клавиатур
• Удаление клавиатур"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📋 Меню"))
    builder.add(KeyboardButton(text="📞 Мой контакт"))
    builder.add(KeyboardButton(text="📍 Моя геолокация"))
    builder.add(KeyboardButton(text="🎮 Игры"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🔧 Возможности")
async def handle_reply_btn_features(message: types.Message):
    text = "🔧 Возможности Reply кнопок:

✅ Быстрый доступ к функциям
✅ Запрос контактных данных
✅ Получение геолокации
✅ Настраиваемый размер
✅ Одноразовое использование
✅ Постоянное отображение
✅ Автоматическое скрытие"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📞 Контакт"))
    builder.add(KeyboardButton(text="📍 Геолокация"))
    builder.add(KeyboardButton(text="🔙 Информация"))
    builder.add(KeyboardButton(text="❌ Убрать клавиатуру"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "📝 Примеры")
async def handle_reply_btn_examples(message: types.Message):
    text = "📝 Примеры использования:

🎯 Одноразовая клавиатура - скрывается после нажатия
🎯 Постоянная клавиатура - остается видимой
🎯 Запрос данных - получение контакта/геолокации"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="⚡ Одноразовая"))
    builder.add(KeyboardButton(text="🔒 Постоянная"))
    builder.add(KeyboardButton(text="🔙 Информация"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=true)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🔙 Меню")
async def handle_reply_btn_back_menu(message: types.Message):
    text = "📋 Главное меню:

Выберите раздел для изучения функций Reply клавиатур:"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="ℹ️ Информация"))
    builder.add(KeyboardButton(text="⚙️ Настройки"))
    builder.add(KeyboardButton(text="❓ Помощь"))
    builder.add(KeyboardButton(text="⌨️ Тест клавиатур"))
    builder.add(KeyboardButton(text="🔙 На главную"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🔙 Информация")
async def handle_reply_btn_back_info(message: types.Message):
    text = "ℹ️ Информация о Reply клавиатурах:

• Показываются внизу экрана
• Заменяют стандартную клавиатуру
• Могут запрашивать контакт/геолокацию
• Поддерживают автоматическое изменение размера
• Могут быть одноразовыми или постоянными"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔧 Возможности"))
    builder.add(KeyboardButton(text="📝 Примеры"))
    builder.add(KeyboardButton(text="🔙 Меню"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "❌ Убрать клавиатуру")
async def handle_reply_btn_remove_keyboard(message: types.Message):
    text = "❌ Клавиатура убрана!

Теперь пользователь видит стандартную клавиатуру устройства. Это полезно когда нужно:
• Завершить диалог
• Перейти к свободному вводу
• Очистить интерфейс"
    # Удаляем предыдущие reply клавиатуры если они были
    await message.answer(text, reply_markup=ReplyKeyboardRemove())

@dp.message(lambda message: message.text == "⚡ Одноразовая")
async def handle_reply_btn_one_time(message: types.Message):
    text = "⚡ Одноразовая клавиатура!

Эта клавиатура исчезнет после нажатия любой кнопки. Удобно для:
• Выбора из списка
• Подтверждения действий
• Разовых опросов"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="✅ Вариант 1"))
    builder.add(KeyboardButton(text="✅ Вариант 2"))
    builder.add(KeyboardButton(text="✅ Вариант 3"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=true)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🔒 Постоянная")
async def handle_reply_btn_permanent(message: types.Message):
    text = "🔒 Постоянная клавиатура!

Эта клавиатура остается видимой после нажатий. Подходит для:
• Основного меню
• Частых действий
• Навигации по боту"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🎯 Действие 1"))
    builder.add(KeyboardButton(text="🎯 Действие 2"))
    builder.add(KeyboardButton(text="🎯 Действие 3"))
    builder.add(KeyboardButton(text="👁️ Скрыть клавиатуру"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "✅ Вариант 1")
async def handle_reply_btn_choice_1(message: types.Message):
    text = "✅ Выбор сделан!

Клавиатура исчезла автоматически. Теперь пользователь может:
• Вводить текст свободно
• Использовать стандартную клавиатуру
• Дождаться новой Reply клавиатуры"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔄 Новая клавиатура"))
    builder.add(KeyboardButton(text="🔙 В меню"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "✅ Вариант 2")
async def handle_reply_btn_choice_2(message: types.Message):
    text = "✅ Выбор сделан!

Клавиатура исчезла автоматически. Теперь пользователь может:
• Вводить текст свободно
• Использовать стандартную клавиатуру
• Дождаться новой Reply клавиатуры"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔄 Новая клавиатура"))
    builder.add(KeyboardButton(text="🔙 В меню"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "✅ Вариант 3")
async def handle_reply_btn_choice_3(message: types.Message):
    text = "✅ Выбор сделан!

Клавиатура исчезла автоматически. Теперь пользователь может:
• Вводить текст свободно
• Использовать стандартную клавиатуру
• Дождаться новой Reply клавиатуры"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔄 Новая клавиатура"))
    builder.add(KeyboardButton(text="🔙 В меню"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🔄 Новая клавиатура")
async def handle_reply_btn_new_keyboard(message: types.Message):
    text = "📝 Примеры использования:

🎯 Одноразовая клавиатура - скрывается после нажатия
🎯 Постоянная клавиатура - остается видимой
🎯 Запрос данных - получение контакта/геолокации"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="⚡ Одноразовая"))
    builder.add(KeyboardButton(text="🔒 Постоянная"))
    builder.add(KeyboardButton(text="🔙 Информация"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=true)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🔙 В меню")
async def handle_reply_btn_back_menu2(message: types.Message):
    text = "📋 Главное меню:

Выберите раздел для изучения функций Reply клавиатур:"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="ℹ️ Информация"))
    builder.add(KeyboardButton(text="⚙️ Настройки"))
    builder.add(KeyboardButton(text="❓ Помощь"))
    builder.add(KeyboardButton(text="⌨️ Тест клавиатур"))
    builder.add(KeyboardButton(text="🔙 На главную"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🎯 Действие 1")
async def handle_reply_btn_action_1(message: types.Message):
    text = "🎯 Действие выполнено!

Клавиатура осталась видимой для продолжения работы. Пользователь может:
• Выполнить другие действия
• Продолжить навигацию
• Использовать те же кнопки"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="▶️ Продолжить"))
    builder.add(KeyboardButton(text="📝 К примерам"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🎯 Действие 2")
async def handle_reply_btn_action_2(message: types.Message):
    text = "🎯 Действие выполнено!

Клавиатура осталась видимой для продолжения работы. Пользователь может:
• Выполнить другие действия
• Продолжить навигацию
• Использовать те же кнопки"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="▶️ Продолжить"))
    builder.add(KeyboardButton(text="📝 К примерам"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🎯 Действие 3")
async def handle_reply_btn_action_3(message: types.Message):
    text = "🎯 Действие выполнено!

Клавиатура осталась видимой для продолжения работы. Пользователь может:
• Выполнить другие действия
• Продолжить навигацию
• Использовать те же кнопки"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="▶️ Продолжить"))
    builder.add(KeyboardButton(text="📝 К примерам"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "👁️ Скрыть клавиатуру")
async def handle_reply_btn_hide_keyboard(message: types.Message):
    text = "❌ Клавиатура убрана!

Теперь пользователь видит стандартную клавиатуру устройства. Это полезно когда нужно:
• Завершить диалог
• Перейти к свободному вводу
• Очистить интерфейс"
    # Удаляем предыдущие reply клавиатуры если они были
    await message.answer(text, reply_markup=ReplyKeyboardRemove())

@dp.message(lambda message: message.text == "▶️ Продолжить")
async def handle_reply_btn_continue(message: types.Message):
    text = "🔒 Постоянная клавиатура!

Эта клавиатура остается видимой после нажатий. Подходит для:
• Основного меню
• Частых действий
• Навигации по боту"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🎯 Действие 1"))
    builder.add(KeyboardButton(text="🎯 Действие 2"))
    builder.add(KeyboardButton(text="🎯 Действие 3"))
    builder.add(KeyboardButton(text="👁️ Скрыть клавиатуру"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "📝 К примерам")
async def handle_reply_btn_examples_back(message: types.Message):
    text = "📝 Примеры использования:

🎯 Одноразовая клавиатура - скрывается после нажатия
🎯 Постоянная клавиатура - остается видимой
🎯 Запрос данных - получение контакта/геолокации"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="⚡ Одноразовая"))
    builder.add(KeyboardButton(text="🔒 Постоянная"))
    builder.add(KeyboardButton(text="🔙 Информация"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=true)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "📏 Размер")
async def handle_reply_btn_size_settings(message: types.Message):
    text = "📏 Настройки размера:

🔹 Автоматический размер - подстраивается под текст
🔹 Фиксированный размер - одинаковые кнопки

Текущий режим: Автоматический"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔄 Авто размер"))
    builder.add(KeyboardButton(text="📐 Фикс размер"))
    builder.add(KeyboardButton(text="🔙 Настройки"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🎭 Поведение")
async def handle_reply_btn_behavior_settings(message: types.Message):
    text = "🎭 Настройки поведения:

• Одноразовые клавиатуры исчезают
• Постоянные остаются видимыми
• Специальные кнопки запрашивают разрешения"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="⚡ Тест одноразовой"))
    builder.add(KeyboardButton(text="🔒 Тест постоянной"))
    builder.add(KeyboardButton(text="🔙 Настройки"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🔄 Авто размер")
async def handle_reply_btn_auto_size(message: types.Message):
    text = "🔄 Автоматический размер активен!

Кнопки подстраиваются под длину текста:"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="Короткая"))
    builder.add(KeyboardButton(text="Средняя кнопка"))
    builder.add(KeyboardButton(text="Очень длинная кнопка с большим текстом"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "📐 Фикс размер")
async def handle_reply_btn_fixed_size(message: types.Message):
    text = "📐 Фиксированный размер активен!

Все кнопки одинакового размера:"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="Кнопка 1"))
    builder.add(KeyboardButton(text="Кнопка 2"))
    builder.add(KeyboardButton(text="Кнопка 3"))
    keyboard = builder.as_markup(resize_keyboard=false, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🔙 Настройки")
async def handle_reply_btn_back_settings(message: types.Message):
    text = "⚙️ Настройки Reply клавиатур:

Здесь можно настроить поведение клавиатур:
• Размер кнопок
• Поведение после нажатия
• Запрос разрешений"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📏 Размер"))
    builder.add(KeyboardButton(text="🎭 Поведение"))
    builder.add(KeyboardButton(text="🔙 Меню"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "Короткая")
async def handle_reply_btn_short(message: types.Message):
    text = "📏 Настройки размера:

🔹 Автоматический размер - подстраивается под текст
🔹 Фиксированный размер - одинаковые кнопки

Текущий режим: Автоматический"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔄 Авто размер"))
    builder.add(KeyboardButton(text="📐 Фикс размер"))
    builder.add(KeyboardButton(text="🔙 Настройки"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "Средняя кнопка")
async def handle_reply_btn_medium_length(message: types.Message):
    text = "📏 Настройки размера:

🔹 Автоматический размер - подстраивается под текст
🔹 Фиксированный размер - одинаковые кнопки

Текущий режим: Автоматический"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔄 Авто размер"))
    builder.add(KeyboardButton(text="📐 Фикс размер"))
    builder.add(KeyboardButton(text="🔙 Настройки"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "Очень длинная кнопка с большим текстом")
async def handle_reply_btn_very_long_button(message: types.Message):
    text = "📏 Настройки размера:

🔹 Автоматический размер - подстраивается под текст
🔹 Фиксированный размер - одинаковые кнопки

Текущий режим: Автоматический"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔄 Авто размер"))
    builder.add(KeyboardButton(text="📐 Фикс размер"))
    builder.add(KeyboardButton(text="🔙 Настройки"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "Кнопка 1")
async def handle_reply_btn_fixed_1(message: types.Message):
    text = "📏 Настройки размера:

🔹 Автоматический размер - подстраивается под текст
🔹 Фиксированный размер - одинаковые кнопки

Текущий режим: Автоматический"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔄 Авто размер"))
    builder.add(KeyboardButton(text="📐 Фикс размер"))
    builder.add(KeyboardButton(text="🔙 Настройки"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "Кнопка 2")
async def handle_reply_btn_fixed_2(message: types.Message):
    text = "📏 Настройки размера:

🔹 Автоматический размер - подстраивается под текст
🔹 Фиксированный размер - одинаковые кнопки

Текущий режим: Автоматический"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔄 Авто размер"))
    builder.add(KeyboardButton(text="📐 Фикс размер"))
    builder.add(KeyboardButton(text="🔙 Настройки"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "Кнопка 3")
async def handle_reply_btn_fixed_3(message: types.Message):
    text = "📏 Настройки размера:

🔹 Автоматический размер - подстраивается под текст
🔹 Фиксированный размер - одинаковые кнопки

Текущий режим: Автоматический"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔄 Авто размер"))
    builder.add(KeyboardButton(text="📐 Фикс размер"))
    builder.add(KeyboardButton(text="🔙 Настройки"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "⚡ Тест одноразовой")
async def handle_reply_btn_one_time_demo(message: types.Message):
    text = "⚡ Тест одноразового поведения:

Нажмите любую кнопку - клавиатура исчезнет!"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🎯 Исчезну!"))
    builder.add(KeyboardButton(text="👻 И я тоже!"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=true)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🔒 Тест постоянной")
async def handle_reply_btn_permanent_demo(message: types.Message):
    text = "🔒 Тест постоянного поведения:

Клавиатура останется после нажатия любой кнопки!"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="💪 Останусь!"))
    builder.add(KeyboardButton(text="🏠 И я здесь!"))
    builder.add(KeyboardButton(text="🔙 Назад"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🎯 Исчезну!")
async def handle_reply_btn_disappear_1(message: types.Message):
    text = "👻 Клавиатура исчезла!

Теперь пользователь видит стандартную клавиатуру устройства."
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔄 Восстановить"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "👻 И я тоже!")
async def handle_reply_btn_disappear_2(message: types.Message):
    text = "👻 Клавиатура исчезла!

Теперь пользователь видит стандартную клавиатуру устройства."
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔄 Восстановить"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🔄 Восстановить")
async def handle_reply_btn_restore(message: types.Message):
    text = "🎭 Настройки поведения:

• Одноразовые клавиатуры исчезают
• Постоянные остаются видимыми
• Специальные кнопки запрашивают разрешения"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="⚡ Тест одноразовой"))
    builder.add(KeyboardButton(text="🔒 Тест постоянной"))
    builder.add(KeyboardButton(text="🔙 Настройки"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "💪 Останусь!")
async def handle_reply_btn_stay_1(message: types.Message):
    text = "💪 Клавиатура осталась!

Пользователь может продолжать использовать те же кнопки."
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="▶️ Продолжить тест"))
    builder.add(KeyboardButton(text="🔙 К настройкам"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🏠 И я здесь!")
async def handle_reply_btn_stay_2(message: types.Message):
    text = "💪 Клавиатура осталась!

Пользователь может продолжать использовать те же кнопки."
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="▶️ Продолжить тест"))
    builder.add(KeyboardButton(text="🔙 К настройкам"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🔙 Назад")
async def handle_reply_btn_back_behavior(message: types.Message):
    text = "🎭 Настройки поведения:

• Одноразовые клавиатуры исчезают
• Постоянные остаются видимыми
• Специальные кнопки запрашивают разрешения"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="⚡ Тест одноразовой"))
    builder.add(KeyboardButton(text="🔒 Тест постоянной"))
    builder.add(KeyboardButton(text="🔙 Настройки"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "▶️ Продолжить тест")
async def handle_reply_btn_continue_test(message: types.Message):
    text = "🔒 Тест постоянного поведения:

Клавиатура останется после нажатия любой кнопки!"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="💪 Останусь!"))
    builder.add(KeyboardButton(text="🏠 И я здесь!"))
    builder.add(KeyboardButton(text="🔙 Назад"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🔙 К настройкам")
async def handle_reply_btn_back_behavior2(message: types.Message):
    text = "🎭 Настройки поведения:

• Одноразовые клавиатуры исчезают
• Постоянные остаются видимыми
• Специальные кнопки запрашивают разрешения"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="⚡ Тест одноразовой"))
    builder.add(KeyboardButton(text="🔒 Тест постоянной"))
    builder.add(KeyboardButton(text="🔙 Настройки"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "📋 Основы")
async def handle_reply_btn_help_basics(message: types.Message):
    text = "📋 Основы Reply клавиатур:

1️⃣ Показываются вместо обычной клавиатуры
2️⃣ Можно настроить размер и поведение
3️⃣ Поддерживают специальные действия
4️⃣ Упрощают навигацию по боту
5️⃣ Можно скрыть в любой момент"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔙 Справка"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "📞 Спец кнопки")
async def handle_reply_btn_help_special(message: types.Message):
    text = "📞 Специальные кнопки:

📞 Запрос контакта - получает номер телефона
📍 Запрос геолокации - получает координаты

Попробуйте прямо сейчас:"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📞 Тест контакта"))
    builder.add(KeyboardButton(text="📍 Тест геолокации"))
    builder.add(KeyboardButton(text="🔙 Справка"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "❓ FAQ")
async def handle_reply_btn_help_faq(message: types.Message):
    text = "❓ Часто задаваемые вопросы:

Q: Как убрать Reply клавиатуру?
A: Отправить сообщение с ReplyKeyboardRemove

Q: Можно ли изменить размер кнопок?
A: Да, через параметр resize_keyboard

Q: Работают ли спец кнопки в группах?
A: Контакт только в приватных чатах"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔙 Справка"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🔙 Справка")
async def handle_reply_btn_back_help(message: types.Message):
    text = "❓ Справка по Reply клавиатурам:

📋 Основы использования
🔧 Настройки и возможности
🎯 Примеры и демонстрации
📞 Специальные кнопки
📍 Геолокация и контакты"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📋 Основы"))
    builder.add(KeyboardButton(text="📞 Спец кнопки"))
    builder.add(KeyboardButton(text="❓ FAQ"))
    builder.add(KeyboardButton(text="🔙 Меню"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🔢 Сетка кнопок")
async def handle_reply_btn_grid_test(message: types.Message):
    text = "🔢 Сетка кнопок 3x3:

Максимальное количество кнопок в удобном формате:"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="1️⃣"))
    builder.add(KeyboardButton(text="2️⃣"))
    builder.add(KeyboardButton(text="3️⃣"))
    builder.add(KeyboardButton(text="4️⃣"))
    builder.add(KeyboardButton(text="5️⃣"))
    builder.add(KeyboardButton(text="6️⃣"))
    builder.add(KeyboardButton(text="7️⃣"))
    builder.add(KeyboardButton(text="8️⃣"))
    builder.add(KeyboardButton(text="9️⃣"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=true)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🎭 Смешанные кнопки")
async def handle_reply_btn_mixed_test(message: types.Message):
    text = "🎭 Смешанные типы кнопок:

Обычные + специальные в одной клавиатуре:"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📝 Обычная"))
    builder.add(KeyboardButton(text="📞 Контакт"))
    builder.add(KeyboardButton(text="📍 Геолокация"))
    builder.add(KeyboardButton(text="🔙 Назад"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "📱 Минимальная")
async def handle_reply_btn_minimal_test(message: types.Message):
    text = "📱 Минимальная клавиатура:

Простейший интерфейс с двумя кнопками:"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="✅ Да"))
    builder.add(KeyboardButton(text="❌ Нет"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=true)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "1️⃣")
async def handle_reply_btn_1(message: types.Message):
    text = "✅ Кнопка нажата!

Сетка 3x3 удобна для:
• Цифровых клавиатур
• Меню выбора
• Игровых интерфейсов"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔙 Тест клавиатур"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "2️⃣")
async def handle_reply_btn_2(message: types.Message):
    text = "✅ Кнопка нажата!

Сетка 3x3 удобна для:
• Цифровых клавиатур
• Меню выбора
• Игровых интерфейсов"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔙 Тест клавиатур"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "3️⃣")
async def handle_reply_btn_3(message: types.Message):
    text = "✅ Кнопка нажата!

Сетка 3x3 удобна для:
• Цифровых клавиатур
• Меню выбора
• Игровых интерфейсов"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔙 Тест клавиатур"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "4️⃣")
async def handle_reply_btn_4(message: types.Message):
    text = "✅ Кнопка нажата!

Сетка 3x3 удобна для:
• Цифровых клавиатур
• Меню выбора
• Игровых интерфейсов"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔙 Тест клавиатур"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "5️⃣")
async def handle_reply_btn_5(message: types.Message):
    text = "✅ Кнопка нажата!

Сетка 3x3 удобна для:
• Цифровых клавиатур
• Меню выбора
• Игровых интерфейсов"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔙 Тест клавиатур"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "6️⃣")
async def handle_reply_btn_6(message: types.Message):
    text = "✅ Кнопка нажата!

Сетка 3x3 удобна для:
• Цифровых клавиатур
• Меню выбора
• Игровых интерфейсов"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔙 Тест клавиатур"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "7️⃣")
async def handle_reply_btn_7(message: types.Message):
    text = "✅ Кнопка нажата!

Сетка 3x3 удобна для:
• Цифровых клавиатур
• Меню выбора
• Игровых интерфейсов"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔙 Тест клавиатур"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "8️⃣")
async def handle_reply_btn_8(message: types.Message):
    text = "✅ Кнопка нажата!

Сетка 3x3 удобна для:
• Цифровых клавиатур
• Меню выбора
• Игровых интерфейсов"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔙 Тест клавиатур"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "9️⃣")
async def handle_reply_btn_9(message: types.Message):
    text = "✅ Кнопка нажата!

Сетка 3x3 удобна для:
• Цифровых клавиатур
• Меню выбора
• Игровых интерфейсов"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔙 Тест клавиатур"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🔙 Тест клавиатур")
async def handle_reply_btn_back_keyboard_test(message: types.Message):
    text = "⌨️ Тест различных конфигураций клавиатур:

Проверим все возможности Reply кнопок:"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔢 Сетка кнопок"))
    builder.add(KeyboardButton(text="🎭 Смешанные кнопки"))
    builder.add(KeyboardButton(text="📱 Минимальная"))
    builder.add(KeyboardButton(text="🔙 Меню"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "📝 Обычная")
async def handle_reply_btn_normal(message: types.Message):
    text = "🎭 Смешанные кнопки работают!

Можно комбинировать:
• Обычные текстовые кнопки
• Кнопки запроса контакта
• Кнопки запроса геолокации"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔙 К смешанным"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🔙 К смешанным")
async def handle_reply_btn_back_mixed(message: types.Message):
    text = "🎭 Смешанные типы кнопок:

Обычные + специальные в одной клавиатуре:"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📝 Обычная"))
    builder.add(KeyboardButton(text="📞 Контакт"))
    builder.add(KeyboardButton(text="📍 Геолокация"))
    builder.add(KeyboardButton(text="🔙 Назад"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "✅ Да")
async def handle_reply_btn_yes(message: types.Message):
    text = "📱 Минимальная клавиатура сработала!

Идеальна для:
• Простых вопросов
• Подтверждений
• Быстрых опросов"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔙 Тест клавиатур"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "❌ Нет")
async def handle_reply_btn_no(message: types.Message):
    text = "📱 Минимальная клавиатура сработала!

Идеальна для:
• Простых вопросов
• Подтверждений
• Быстрых опросов"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔙 Тест клавиатур"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "✂️ Камень-Ножницы")
async def handle_reply_btn_rock_paper(message: types.Message):
    text = "✂️ Камень-Ножницы-Бумага!

Выберите ваш ход:"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🗿 Камень"))
    builder.add(KeyboardButton(text="📄 Бумага"))
    builder.add(KeyboardButton(text="✂️ Ножницы"))
    builder.add(KeyboardButton(text="🔙 Игры"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=true)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🗿 Камень")
async def handle_reply_btn_rock(message: types.Message):
    text = "🎯 Результат игры:

Вы: {выбор игрока}
Бот: {случайный выбор}

Результат: {выигрыш/проигрыш/ничья}"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔄 Играть снова"))
    builder.add(KeyboardButton(text="🔙 Игры"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "📄 Бумага")
async def handle_reply_btn_paper(message: types.Message):
    text = "🎯 Результат игры:

Вы: {выбор игрока}
Бот: {случайный выбор}

Результат: {выигрыш/проигрыш/ничья}"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔄 Играть снова"))
    builder.add(KeyboardButton(text="🔙 Игры"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "✂️ Ножницы")
async def handle_reply_btn_scissors(message: types.Message):
    text = "🎯 Результат игры:

Вы: {выбор игрока}
Бот: {случайный выбор}

Результат: {выигрыш/проигрыш/ничья}"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🔄 Играть снова"))
    builder.add(KeyboardButton(text="🔙 Игры"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🔙 Игры")
async def handle_reply_btn_back_games(message: types.Message):
    text = "🎮 Игры с Reply клавиатурами:

Простые игры используя только Reply кнопки:"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="✂️ Камень-Ножницы"))
    builder.add(KeyboardButton(text="🧠 Викторина"))
    builder.add(KeyboardButton(text="🔢 Калькулятор"))
    builder.add(KeyboardButton(text="🔙 На главную"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🔄 Играть снова")
async def handle_reply_btn_play_again(message: types.Message):
    text = "✂️ Камень-Ножницы-Бумага!

Выберите ваш ход:"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🗿 Камень"))
    builder.add(KeyboardButton(text="📄 Бумага"))
    builder.add(KeyboardButton(text="✂️ Ножницы"))
    builder.add(KeyboardButton(text="🔙 Игры"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=true)
    await message.answer(text, reply_markup=keyboard)


# Запуск бота
async def main():
    print("Бот запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
