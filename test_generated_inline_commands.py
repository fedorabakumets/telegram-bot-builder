"""
Тест команд с inline кнопками - Telegram Bot
Сгенерировано с помощью TelegramBot Builder
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

    text = """🎉 Добро пожаловать!

Это тест команд с inline кнопками."""
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📋 Помощь", callback_data="help-1"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

@dp.message(Command("help"))
async def help_handler(message: types.Message):

    text = """❓ Справка по командам:

/start - Запуск бота
/help - Эта справка"""
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="start-1"))
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

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "help-1")
async def handle_callback_help_1(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """❓ Справка по командам:

/start - Запуск бота
/help - Эта справка"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="start-1"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "start-1")
async def handle_callback_start_1(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🎉 Добро пожаловать!

Это тест команд с inline кнопками."""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📋 Помощь", callback_data="help-1"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)


# Запуск бота
async def main():
    print("Бот запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())