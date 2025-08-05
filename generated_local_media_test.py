"""
Test Media Bot - Telegram Bot
Сгенерировано с помощью TelegramBot Builder
"""

import asyncio
import logging
import os
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, BotCommand, ReplyKeyboardRemove, URLInputFile, FSInputFile
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

def is_local_file(url: str) -> bool:
    """Проверяет, является ли URL локальным загруженным файлом"""
    return url.startswith("/uploads/") or url.startswith("uploads/")

def get_local_file_path(url: str) -> str:
    """Получает локальный путь к файлу из URL"""
    if url.startswith("/"):
        return url[1:]  # Убираем ведущий слеш
    return url


@dp.message(CommandStart())
async def start_handler(message: types.Message):

    # Регистрируем пользователя в системе
    user_data[message.from_user.id] = {
        "username": message.from_user.username,
        "first_name": message.from_user.first_name,
        "last_name": message.from_user.last_name,
        "registered_at": message.date
    }

    text = "Welcome! Test local media bot"
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📸 Show Local Photo", callback_data="photo-1"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

# Обработчик фото для узла photo-1

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "photo-1")
async def handle_callback_photo_1(callback_query: types.CallbackQuery):
    await callback_query.answer()
    caption = "This is a local uploaded photo!"
    photo_url = "/uploads/1751919935977-360494373.jpg"
    try:
        # Проверяем, является ли это локальным файлом
        if is_local_file(photo_url):
            # Отправляем локальный файл
            file_path = get_local_file_path(photo_url)
            if os.path.exists(file_path):
                photo_file = FSInputFile(file_path)
            else:
                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")
        else:
            # Используем URL для внешних файлов
            photo_file = photo_url
        
        await callback_query.message.delete()
        await bot.send_photo(callback_query.from_user.id, photo_file, caption=caption)
    except Exception as e:
        logging.error(f"Ошибка отправки фото: {e}")
        await callback_query.message.edit_text(f"❌ Не удалось загрузить фото\n{caption}")


# Запуск бота
async def main():
    print("Бот запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
