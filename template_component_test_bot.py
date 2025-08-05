"""
Тест кнопки к компоненту - Telegram Bot
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

    text = """🚀 Привет! Базовый шаблон

Выбери действие:"""
    
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📋 Шаблонная кнопка"))
    builder.add(KeyboardButton(text="🔗 К компоненту"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    await message.answer(text, reply_markup=keyboard)

# Обработчики синонимов команд

@dp.message(lambda message: message.text and message.text.lower() == "старт")
async def start_synonym_старт_handler(message: types.Message):
    # Синоним для команды /start
    await start_handler(message)

# Обработчики reply кнопок

@dp.message(lambda message: message.text == "📋 Шаблонная кнопка")
async def handle_reply_btn_template(message: types.Message):
    text = "📋 Это шаблонный узел"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="◀️ Назад"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🔗 К компоненту")
async def handle_reply_new_btn_to_component(message: types.Message):
    text = "🎯 Это пользовательский компонент!"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="⬅️ Назад к старту"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "◀️ Назад")
async def handle_reply_btn_back(message: types.Message):
    text = "🚀 Привет! Базовый шаблон\n\nВыбери действие:"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📋 Шаблонная кнопка"))
    builder.add(KeyboardButton(text="🔗 К компоненту"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "⬅️ Назад к старту")
async def handle_reply_btn_back_component(message: types.Message):
    text = "🚀 Привет! Базовый шаблон\n\nВыбери действие:"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📋 Шаблонная кнопка"))
    builder.add(KeyboardButton(text="🔗 К компоненту"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    await message.answer(text, reply_markup=keyboard)


# Запуск бота
async def main():
    print("Бот запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())