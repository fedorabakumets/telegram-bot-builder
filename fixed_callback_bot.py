"""
Исправленный Callback Бот - Telegram Bot
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

    text = "Привет! Выберите действие:"
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📊 Информация", callback_data="info-2"))
    builder.add(InlineKeyboardButton(text="❓ Помощь", callback_data="help-3"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "info-2")
async def handle_callback_btn_info(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📊 Информация:

Все работает корректно!"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="start-1"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "help-3")
async def handle_callback_btn_help(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """❓ Помощь:

Callback обработчики работают!"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="start-1"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "start-1")
async def handle_callback_btn_back1(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "Привет! Выберите действие:"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📊 Информация", callback_data="info-2"))
    builder.add(InlineKeyboardButton(text="❓ Помощь", callback_data="help-3"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)


# Запуск бота
async def main():
    print("Бот запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())