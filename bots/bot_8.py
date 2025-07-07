"""
Тест разных ID - Telegram Bot
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
BOT_TOKEN = "7552080497:AAEJFmsxmY8PnDzgoUpM5NDg5E1ehNYAHYU"

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

    text = """🚀 Привет! Я твой первый бот!

Ты можешь написать:
• /start - чтобы запустить меня
• старт - это тоже работает!

Выбери действие:"""
    
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="ℹ️ Информация"))
    builder.add(KeyboardButton(text="❓ Помощь"))
    builder.add(KeyboardButton(text="Новая кнопка"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    await message.answer(text, reply_markup=keyboard)

# Обработчики синонимов команд

@dp.message(lambda message: message.text and message.text.lower() == "старт")
async def start_synonym_старт_handler(message: types.Message):
    # Синоним для команды /start
    await start_handler(message)

# Обработчики reply кнопок

@dp.message(lambda message: message.text == "ℹ️ Информация")
async def handle_reply_btn_info(message: types.Message):
    text = "📋 **Информация о боте:**\n\nЭто простой бот-пример, который показывает:\n• Как работают команды\n• Как использовать синонимы\n• Базовую навигацию\n\nТеперь ты можешь создать своего!"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="◀️ Назад"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "❓ Помощь")
async def handle_reply_btn_help(message: types.Message):
    text = "❓ **Справка:**\n\n🔤 **Команды:**\n• /start или старт - запуск бота\n\n🎯 **Советы:**\n• Используй кнопки для навигации\n• Синонимы делают бота удобнее\n• Экспериментируй с настройками!"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="◀️ Назад"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "Новая кнопка")
async def handle_reply_iSdZyZGM1AmuKCtToecMD(message: types.Message):
    text = "Новое сообщение"
    # Удаляем предыдущие reply клавиатуры если они были
    await message.answer(text, reply_markup=ReplyKeyboardRemove())

@dp.message(lambda message: message.text == "◀️ Назад")
async def handle_reply_btn_back_info(message: types.Message):
    text = "🚀 Привет! Я твой первый бот!\n\nТы можешь написать:\n• /start - чтобы запустить меня\n• старт - это тоже работает!\n\nВыбери действие:"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="ℹ️ Информация"))
    builder.add(KeyboardButton(text="❓ Помощь"))
    builder.add(KeyboardButton(text="Новая кнопка"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    await message.answer(text, reply_markup=keyboard)


# Запуск бота
async def main():
    print("Бот запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
