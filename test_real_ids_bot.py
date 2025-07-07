"""
Тест с реальными ID - Telegram Bot
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

Это тест с реальными ID из интерфейса."""
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📋 Помощь", callback_data="DeOMOuIu3NuQ1onv_dtJF"))
    builder.add(InlineKeyboardButton(text="⚙️ Настройки", callback_data="KpQrSt789MnOpQr_uvWxY"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

@dp.message(Command("help"))
async def help_handler(message: types.Message):

    text = """❓ Справка:

/start - Запуск
/help - Справка

Используйте кнопки для навигации."""
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="ylObKToWFsIl_opIcowPZ"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

@dp.message(Command("settings"))
async def settings_handler(message: types.Message):

    text = """⚙️ Настройки бота

Здесь можно изменить параметры."""
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🏠 Главная", callback_data="ylObKToWFsIl_opIcowPZ"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

# Обработчики синонимов команд

@dp.message(lambda message: message.text and message.text.lower() == "старт")
async def start_synonym_старт_handler(message: types.Message):
    # Синоним для команды /start
    await start_handler(message)

@dp.message(lambda message: message.text and message.text.lower() == "привет")
async def start_synonym_привет_handler(message: types.Message):
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

@dp.callback_query(lambda c: c.data == "DeOMOuIu3NuQ1onv_dtJF")
async def handle_callback_DeOMOuIu3NuQ1onv_dtJF(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """❓ Справка:

/start - Запуск
/help - Справка

Используйте кнопки для навигации."""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="ylObKToWFsIl_opIcowPZ"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "KpQrSt789MnOpQr_uvWxY")
async def handle_callback_KpQrSt789MnOpQr_uvWxY(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """⚙️ Настройки бота

Здесь можно изменить параметры."""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🏠 Главная", callback_data="ylObKToWFsIl_opIcowPZ"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "ylObKToWFsIl_opIcowPZ")
async def handle_callback_ylObKToWFsIl_opIcowPZ(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🎉 Добро пожаловать!

Это тест с реальными ID из интерфейса."""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📋 Помощь", callback_data="DeOMOuIu3NuQ1onv_dtJF"))
    builder.add(InlineKeyboardButton(text="⚙️ Настройки", callback_data="KpQrSt789MnOpQr_uvWxY"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)


# Запуск бота
async def main():
    print("Бот запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
