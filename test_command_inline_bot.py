"""
Тест команд с инлайн кнопками - Telegram Bot
Сгенерировано для тестирования проблемы с командами
"""

import asyncio
import logging
from aiogram import Bot, Dispatcher, types, F
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

# Список администраторов
ADMIN_IDS = [123456789]

# Хранилище пользователей
user_data = {}

# Утилитарные функции
async def is_admin(user_id: int) -> bool:
    return user_id in ADMIN_IDS

async def is_private_chat(message: types.Message) -> bool:
    return message.chat.type == "private"

async def check_auth(user_id: int) -> bool:
    return user_id in user_data

@dp.message(CommandStart())
async def start_handler(message: types.Message):
    user_data[message.from_user.id] = {
        "username": message.from_user.username,
        "first_name": message.from_user.first_name,
        "last_name": message.from_user.last_name,
        "registered_at": message.date
    }

    text = """🎉 Добро пожаловать!

Это тестовый бот для проверки команд с инлайн кнопками.

Попробуйте написать 'помощь' или 'старт' как обычное сообщение."""
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📋 Помощь", callback_data="help-cmd"))
    builder.add(InlineKeyboardButton(text="📱 Меню", callback_data="menu-msg"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

@dp.message(Command("help"))
async def help_handler(message: types.Message):
    text = """❓ Справка по командам:

/start - Запуск бота
/help - Эта справка
/menu - Главное меню

Вы также можете писать команды словами: 'помощь', 'старт', 'меню'"""
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📋 Все команды", callback_data="commands-msg"))
    builder.add(InlineKeyboardButton(text="🔙 На главную", callback_data="start-node"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

# Обработчики синонимов команд
@dp.message(lambda message: message.text and message.text.lower() == "старт")
async def start_synonym_старт_handler(message: types.Message):
    await start_handler(message)

@dp.message(lambda message: message.text and message.text.lower() == "начать")
async def start_synonym_начать_handler(message: types.Message):
    await start_handler(message)

@dp.message(lambda message: message.text and message.text.lower() == "привет")
async def start_synonym_привет_handler(message: types.Message):
    await start_handler(message)

@dp.message(lambda message: message.text and message.text.lower() == "помощь")
async def help_synonym_помощь_handler(message: types.Message):
    await help_handler(message)

@dp.message(lambda message: message.text and message.text.lower() == "справка")
async def help_synonym_справка_handler(message: types.Message):
    await help_handler(message)

@dp.message(lambda message: message.text and message.text.lower() == "команды")
async def help_synonym_команды_handler(message: types.Message):
    await help_handler(message)

# Обработчики inline кнопок
@dp.callback_query(lambda c: c.data == "help-cmd")
async def handle_callback_help_cmd(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """❓ Справка по командам:

/start - Запуск бота
/help - Эта справка
/menu - Главное меню

Вы также можете писать команды словами: 'помощь', 'старт', 'меню'"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📋 Все команды", callback_data="commands-msg"))
    builder.add(InlineKeyboardButton(text="🔙 На главную", callback_data="start-node"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "menu-msg")
async def handle_callback_menu_msg(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📱 Главное меню:

Выберите нужный раздел:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="ℹ️ Информация", callback_data="info-msg"))
    builder.add(InlineKeyboardButton(text="⚙️ Настройки", callback_data="settings-msg"))
    builder.add(InlineKeyboardButton(text="🔙 На главную", callback_data="start-node"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "start-node")
async def handle_callback_start_node(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🎉 Добро пожаловать!

Это тестовый бот для проверки команд с инлайн кнопками.

Попробуйте написать 'помощь' или 'старт' как обычное сообщение."""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📋 Помощь", callback_data="help-cmd"))
    builder.add(InlineKeyboardButton(text="📱 Меню", callback_data="menu-msg"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "commands-msg")
async def handle_callback_commands_msg(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📋 Список всех команд:

🔸 /start (или 'старт') - Запуск бота
🔸 /help (или 'помощь') - Справка
🔸 /menu (или 'меню') - Главное меню

Вы можете использовать как команды со слешем, так и обычные слова!"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🧪 Тестировать команды", callback_data="test-msg"))
    builder.add(InlineKeyboardButton(text="🔙 К справке", callback_data="help-cmd"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "test-msg")
async def handle_callback_test_msg(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🧪 Тестирование команд:

Попробуйте написать эти слова как обычные сообщения:

• старт
• помощь
• справка
• команды
• меню

Если они не работают, значит проблема в обработке синонимов команд с инлайн кнопками!"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 К командам", callback_data="commands-msg"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "info-msg")
async def handle_callback_info_msg(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """ℹ️ Информация:

Это тестовый бот для проверки работы команд с инлайн кнопками.

Проблема: когда команда содержит инлайн кнопки, синонимы команд могут не работать правильно."""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 К меню", callback_data="menu-msg"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "settings-msg")
async def handle_callback_settings_msg(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """⚙️ Настройки:

Здесь могут быть настройки бота.

Вы можете вернуться в главное меню или попробовать написать 'старт' для возврата на главную."""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 К меню", callback_data="menu-msg"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

# Запуск бота
async def main():
    print("Бот запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
