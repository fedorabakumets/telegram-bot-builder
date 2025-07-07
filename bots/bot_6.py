"""
Тест inline кнопок - Telegram Bot
Сгенерировано с помощью TelegramBot Builder

Команды для @BotFather:
start - Запустить бота"""

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
        BotCommand(command="start", description="Запустить бота"),
    ]
    await bot.set_my_commands(commands)


@dp.message(CommandStart())
async def start_handler(message: types.Message):

    # Регистрируем пользователя в системе
    user_data[message.from_user.id] = {
        "username": message.from_user.username,
        "first_name": message.from_user.first_name,
        "last_name": message.from_user.last_name,
        "registered_at": message.date
    }

    text = "Привет! Добро пожаловать!"
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="Новая кнопка", callback_data="jXT7yNocl-BRwqicw1R_G"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "jXT7yNocl-BRwqicw1R_G")
async def handle_callback_jXT7yNocl_BRwqicw1R_G(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "Новое сообщение"
    await callback_query.message.edit_text(text)


# Запуск бота
async def main():
    await set_bot_commands()
    print("Бот запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
