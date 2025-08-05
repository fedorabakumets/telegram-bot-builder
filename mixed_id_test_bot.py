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

    text = "Тест ID форматов"
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔤 Простой ID", callback_data="simple-node-2"))
    builder.add(InlineKeyboardButton(text="🔠 Сложный ID", callback_data="ylObKToWFsIl-opIcowPZ"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "simple-node-2")
async def handle_callback_simple_node_2(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "Простой ID работает!"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="↩️ Назад"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    # Для reply клавиатуры отправляем новое сообщение и удаляем старое
    try:
        await callback_query.message.delete()
    except:
        pass  # Игнорируем ошибки удаления
    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "ylObKToWFsIl-opIcowPZ")
async def handle_callback_ylObKToWFsIl_opIcowPZ(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "Сложный ID тоже работает!"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="⬅️ Назад к старту"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    # Для reply клавиатуры отправляем новое сообщение и удаляем старое
    try:
        await callback_query.message.delete()
    except:
        pass  # Игнорируем ошибки удаления
    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)

# Обработчики reply кнопок

@dp.message(lambda message: message.text == "↩️ Назад")
async def handle_reply_btn_back_simple(message: types.Message):
    text = "Тест ID форматов"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔤 Простой ID", callback_data="simple-node-2"))
    builder.add(InlineKeyboardButton(text="🔠 Сложный ID", callback_data="ylObKToWFsIl-opIcowPZ"))
    keyboard = builder.as_markup()
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "⬅️ Назад к старту")
async def handle_reply_btn_back_complex(message: types.Message):
    text = "Тест ID форматов"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔤 Простой ID", callback_data="simple-node-2"))
    builder.add(InlineKeyboardButton(text="🔠 Сложный ID", callback_data="ylObKToWFsIl-opIcowPZ"))
    keyboard = builder.as_markup()
    await message.answer(text, reply_markup=keyboard)


# Запуск бота
async def main():
    print("Бот запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())