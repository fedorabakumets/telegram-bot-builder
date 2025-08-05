"""
Тестовый бот для проверки работы команд с inline кнопками
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

# Хранилище пользователей
user_data = {}

@dp.message(CommandStart())
async def start_handler(message: types.Message):
    # Регистрируем пользователя
    user_data[message.from_user.id] = {
        "username": message.from_user.username,
        "first_name": message.from_user.first_name,
        "last_name": message.from_user.last_name,
        "registered_at": message.date
    }

    text = "🎉 Добро пожаловать! Это тест команд с inline кнопками."
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📋 Помощь", callback_data="help-cmd"))
    builder.add(InlineKeyboardButton(text="📱 Меню", callback_data="menu-cmd"))
    keyboard = builder.as_markup()
    
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

@dp.message(Command("help"))
async def help_handler(message: types.Message):
    text = """❓ Справка по командам:

/start - Запуск бота
/help - Эта справка

Вы можете использовать inline кнопки для навигации."""
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="start-cmd"))
    builder.add(InlineKeyboardButton(text="📋 Команды", callback_data="commands-cmd"))
    keyboard = builder.as_markup()
    
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

# Обработчики синонимов
@dp.message(lambda message: message.text and message.text.lower() == "помощь")
async def help_synonym_handler(message: types.Message):
    await help_handler(message)

@dp.message(lambda message: message.text and message.text.lower() == "старт")
async def start_synonym_handler(message: types.Message):
    await start_handler(message)

# Обработчики inline кнопок
@dp.callback_query(lambda c: c.data == "help-cmd")
async def handle_callback_help(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """❓ Справка по командам:

/start - Запуск бота
/help - Эта справка

Вы можете использовать inline кнопки для навигации."""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="start-cmd"))
    keyboard = builder.as_markup()
    
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "start-cmd")
async def handle_callback_start(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "🎉 Добро пожаловать! Это тест команд с inline кнопками."
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📋 Помощь", callback_data="help-cmd"))
    builder.add(InlineKeyboardButton(text="📱 Меню", callback_data="menu-cmd"))
    keyboard = builder.as_markup()
    
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "menu-cmd")
async def handle_callback_menu(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "📱 Главное меню бота"
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="start-cmd"))
    keyboard = builder.as_markup()
    
    await callback_query.message.edit_text(text, reply_markup=keyboard)

# Запуск бота
async def main():
    print("Бот запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())