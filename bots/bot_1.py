"""
Мой первый бот - Telegram Bot
Сгенерировано с помощью TelegramBot Builder

Команды для @BotFather:
start - Запустить бота"""

import asyncio
import logging
import os
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, BotCommand, ReplyKeyboardRemove, URLInputFile, FSInputFile
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

def is_local_file(url: str) -> bool:
    """Проверяет, является ли URL локальным загруженным файлом"""
    return url.startswith("/uploads/") or url.startswith("uploads/")

def get_local_file_path(url: str) -> str:
    """Получает локальный путь к файлу из URL"""
    if url.startswith("/"):
        return url[1:]  # Убираем ведущий слеш
    return url


# Настройка меню команд
async def set_bot_commands():
    commands = [
        BotCommand(command="start", description="Запустить бота"),
    ]
    await bot.set_my_commands(commands)


# Обработчик документа для узла zOw9Edh0SffqwNudyKh7A

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
    builder.add(InlineKeyboardButton(text="Новая кнопка", callback_data="zOw9Edh0SffqwNudyKh7A"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "zOw9Edh0SffqwNudyKh7A")
async def handle_callback_zOw9Edh0SffqwNudyKh7A(callback_query: types.CallbackQuery):
    await callback_query.answer()
    caption = "Описание документа"
    document_url = "/uploads/1/2025-07-08/1751940255004-607434323-___________________________.docx"
    document_name = "document.pdf"
    try:
        # Проверяем, является ли это локальным файлом
        if is_local_file(document_url):
            # Отправляем локальный файл
            file_path = get_local_file_path(document_url)
            if os.path.exists(file_path):
                document_file = FSInputFile(file_path, filename=document_name)
            else:
                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")
        else:
            # Используем URL для внешних файлов
            document_file = URLInputFile(document_url, filename=document_name)
        
        await callback_query.message.delete()
        await bot.send_document(callback_query.from_user.id, document_file, caption=caption)
    except Exception as e:
        logging.error(f"Ошибка отправки документа: {e}")
        await callback_query.message.edit_text(f"❌ Не удалось загрузить документ\n{caption}")


# Запуск бота
async def main():
    await set_bot_commands()
    print("Бот запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
