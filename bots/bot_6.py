"""
Тест inline кнопок - Telegram Bot
Сгенерировано с помощью TelegramBot Builder

Команды для @BotFather:
help - Справка по боту"""

import asyncio
import logging
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, BotCommand, ReplyKeyboardRemove
from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder
from aiogram.enums import ParseMode

# Токен вашего бота (получите у @BotFather)
BOT_TOKEN = "8082906513:AAEkTEm-HYvpRkI8ZuPuWmx3f25zi5tm1OE"

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


# Настройка меню команд
async def set_bot_commands():
    commands = [
        BotCommand(command="help", description="Справка по боту"),
    ]
    await bot.set_my_commands(commands)


@dp.message(Command("help"))
async def help_handler(message: types.Message):

    text = """🤖 Доступные команды:

/start - Начать работу
/help - Эта справка
/settings - Настройки"""
    
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="Новая кнопка"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    await message.answer(text, reply_markup=keyboard)

# Обработчики reply кнопок


# Запуск бота
async def main():
    await set_bot_commands()
    print("Бот запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
