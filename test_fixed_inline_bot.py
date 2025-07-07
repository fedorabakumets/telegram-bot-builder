"""
Исправленный тест команд с инлайн кнопками - Telegram Bot
Сгенерировано для проверки исправления проблемы
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

    text = """🎉 Добро пожаловать в исправленный тест-бот!

Этот бот демонстрирует исправленную работу команд с инлайн кнопками.

Попробуйте:
• Команду /start (должна показать инлайн кнопки)
• Команду /help (должна показать инлайн кнопки)
• Синонимы: 'старт', 'помощь', 'справка' (должны показать те же кнопки)"""
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📋 Помощь", callback_data="help-cmd"))
    builder.add(InlineKeyboardButton(text="📱 Меню", callback_data="menu-msg"))
    builder.add(InlineKeyboardButton(text="🧪 Тест", callback_data="test-msg"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

@dp.message(Command("help"))
async def help_handler(message: types.Message):

    text = """❓ Справка по команд с инлайн кнопками:

🔹 /start - Запуск бота (показывает инлайн кнопки)
🔹 /help - Эта справка (показывает инлайн кнопки)
🔹 Синонимы:
   • 'старт' = /start
   • 'помощь' = /help
   • 'справка' = /help

📝 Проверьте:
1. Команды отправляют инлайн кнопки
2. Синонимы отправляют те же инлайн кнопки
3. Инлайн кнопки работают правильно"""
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 На главную", callback_data="start-node"))
    builder.add(InlineKeyboardButton(text="📋 Все команды", callback_data="commands-msg"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

# Обработчики синонимов команд
@dp.message(lambda message: message.text and message.text.lower() == "старт")
async def start_synonym_старт_handler(message: types.Message):
    # Синоним для команды /start
    await start_handler(message)

@dp.message(lambda message: message.text and message.text.lower() == "помощь")
async def help_synonym_помощь_handler(message: types.Message):
    # Синоним для команды /help
    await help_handler(message)

@dp.message(lambda message: message.text and message.text.lower() == "справка")
async def help_synonym_справка_handler(message: types.Message):
    # Синоним для команды /help
    await help_handler(message)

# Обработчики inline кнопок
@dp.callback_query(lambda c: c.data == "help-cmd")
async def handle_callback_help_cmd(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """❓ Справка по команд с инлайн кнопками:

🔹 /start - Запуск бота (показывает инлайн кнопки)
🔹 /help - Эта справка (показывает инлайн кнопки)
🔹 Синонимы:
   • 'старт' = /start
   • 'помощь' = /help
   • 'справка' = /help

📝 Проверьте:
1. Команды отправляют инлайн кнопки
2. Синонимы отправляют те же инлайн кнопки
3. Инлайн кнопки работают правильно"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 На главную", callback_data="start-node"))
    builder.add(InlineKeyboardButton(text="📋 Все команды", callback_data="commands-msg"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "menu-msg")
async def handle_callback_menu_msg(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📱 Меню тестирования:

Выберите что хотите протестировать:

🧪 Команды - тест команд /start и /help
🎯 Синонимы - тест синонимов 'старт', 'помощь'
📋 Кнопки - тест работы инлайн кнопок"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🧪 Команды", callback_data="test-commands"))
    builder.add(InlineKeyboardButton(text="🎯 Синонимы", callback_data="test-synonyms"))
    builder.add(InlineKeyboardButton(text="🔙 На главную", callback_data="start-node"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "test-msg")
async def handle_callback_test_msg(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🧪 Тестирование исправлений:

✅ ЧТО ДОЛЖНО РАБОТАТЬ:
1. Команда /start отправляет инлайн кнопки
2. Команда /help отправляет инлайн кнопки
3. Синоним 'старт' отправляет те же инлайн кнопки
4. Синоним 'помощь' отправляет те же инлайн кнопки
5. Синоним 'справка' отправляет те же инлайн кнопки
6. Все инлайн кнопки работают

🎯 КАК ТЕСТИРОВАТЬ:
• Напишите /start и проверьте кнопки
• Напишите /help и проверьте кнопки
• Напишите 'старт' и проверьте кнопки
• Напишите 'помощь' и проверьте кнопки
• Нажмите на кнопки и проверьте переходы"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📋 Инструкции", callback_data="instructions"))
    builder.add(InlineKeyboardButton(text="🔙 На главную", callback_data="start-node"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "start-node")
async def handle_callback_start_node(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🎉 Добро пожаловать в исправленный тест-бот!

Этот бот демонстрирует исправленную работу команд с инлайн кнопками.

Попробуйте:
• Команду /start (должна показать инлайн кнопки)
• Команду /help (должна показать инлайн кнопки)
• Синонимы: 'старт', 'помощь', 'справка' (должны показать те же кнопки)"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📋 Помощь", callback_data="help-cmd"))
    builder.add(InlineKeyboardButton(text="📱 Меню", callback_data="menu-msg"))
    builder.add(InlineKeyboardButton(text="🧪 Тест", callback_data="test-msg"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "commands-msg")
async def handle_callback_commands_msg(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📋 Список всех команд:

🔸 /start - Запуск бота (с инлайн кнопками)
🔸 /help - Справка (с инлайн кнопками)

🔸 Синонимы команд:
   • 'старт' → /start
   • 'помощь' → /help  
   • 'справка' → /help

💡 Все команды и синонимы должны отправлять инлайн кнопки!"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 К справке", callback_data="help-cmd"))
    builder.add(InlineKeyboardButton(text="🏠 На главную", callback_data="start-node"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "test-commands")
async def handle_callback_test_commands(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🧪 Тест команд:

Напишите следующие команды и проверьте, что они отправляют инлайн кнопки:

1️⃣ /start
2️⃣ /help

Каждая команда должна отправить сообщение с инлайн кнопками внизу."""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 К меню", callback_data="menu-msg"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "test-synonyms")
async def handle_callback_test_synonyms(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🎯 Тест синонимов:

Напишите следующие слова как обычные сообщения:

1️⃣ старт
2️⃣ помощь
3️⃣ справка

Каждый синоним должен работать как соответствующая команда и отправить те же инлайн кнопки."""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 К меню", callback_data="menu-msg"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "instructions")
async def handle_callback_instructions(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📋 Подробные инструкции:

🔧 НАСТРОЙКА:
1. Замените YOUR_BOT_TOKEN_HERE на реальный токен
2. Запустите бота

🧪 ТЕСТИРОВАНИЕ:
1. Отправьте /start - должны появиться инлайн кнопки
2. Отправьте /help - должны появиться инлайн кнопки  
3. Отправьте 'старт' - должны появиться те же кнопки что и у /start
4. Отправьте 'помощь' - должны появиться те же кнопки что и у /help
5. Отправьте 'справка' - должны появиться те же кнопки что и у /help
6. Нажмите на любую инлайн кнопку - должен произойти переход

✅ УСПЕХ: Если все работает, проблема исправлена!
❌ ОШИБКА: Если синонимы не показывают кнопки, проблема остается."""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 К тестам", callback_data="test-msg"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)


# Запуск бота
async def main():
    print("🤖 Исправленный тест-бот запущен!")
    print("📝 Проверьте работу команд с инлайн кнопками:")
    print("   • /start должен показать инлайн кнопки")
    print("   • /help должен показать инлайн кнопки")
    print("   • 'старт' должен показать те же кнопки")
    print("   • 'помощь' должен показать те же кнопки")
    print("   • 'справка' должен показать те же кнопки")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())