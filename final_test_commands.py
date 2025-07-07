"""
Финальный тест команд - Telegram Bot
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

    text = "Главное меню бота"
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📋 Справка", callback_data="help-test"))
    builder.add(InlineKeyboardButton(text="⚙️ Настройки", callback_data="settings-test"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

@dp.message(Command("help"))
async def help_handler(message: types.Message):

    text = """Справка по боту:

Все команды работают с inline кнопками"""
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🏠 Главная", callback_data="start-test"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

@dp.message(Command("settings"))
async def settings_handler(message: types.Message):

    text = "Настройки бота"
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🏠 Главная", callback_data="start-test"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "help-test")
async def handle_callback_help_test(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """Справка по боту:

Все команды работают с inline кнопками"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🏠 Главная", callback_data="start-test"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "settings-test")
async def handle_callback_settings_test(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "Настройки бота"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🏠 Главная", callback_data="start-test"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "start-test")
async def handle_callback_start_test(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "Главное меню бота"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📋 Справка", callback_data="help-test"))
    builder.add(InlineKeyboardButton(text="⚙️ Настройки", callback_data="settings-test"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)


# Запуск бота
async def main():
    print("Бот запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
