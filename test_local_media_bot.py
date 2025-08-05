"""
Тест локальных медиафайлов - Telegram Bot
Сгенерировано с помощью TelegramBot Builder

Команды для @BotFather:
start - Запустить бота
photo - Отправить локальную фотографию
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

# Инициализация бота и диспетчера
bot = Bot(token=BOT_TOKEN, parse_mode=ParseMode.HTML)
dp = Dispatcher()

# Глобальные переменные для состояния
user_data = {}

async def is_admin(user_id: int) -> bool:
    # Здесь можно добавить логику проверки администраторов
    return user_id in [123456789]  # Замените на ваш Telegram ID

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

# Обработчик команды /start
@dp.message(CommandStart())
async def start_handler(message: types.Message):
    logging.info(f"Команда /start вызвана пользователем {message.from_user.id}")
    
    text = """🚀 Добро пожаловать в тест локальных медиафайлов!

Этот бот демонстрирует отправку загруженных медиафайлов."""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📸 Показать фото", callback_data="photo_node"))
    keyboard = builder.as_markup()
    
    await message.answer(text, reply_markup=keyboard)

# Обработчик команды /photo
@dp.message(Command("photo"))
async def photo_handler(message: types.Message):
    logging.info(f"Команда /photo вызвана пользователем {message.from_user.id}")
    
    caption = "📸 Это локальное загруженное изображение!"
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
        
        # Отправляем фото с подписью
        await message.answer_photo(photo_file, caption=caption)
        
    except Exception as e:
        logging.error(f"Ошибка отправки фото: {e}")
        await message.answer(f"❌ Не удалось загрузить фото\n{caption}")

# Обработчик callback кнопки для фото
@dp.callback_query(F.data == "photo_node")
async def handle_callback_photo_node(callback_query: types.CallbackQuery):
    await callback_query.answer()
    
    caption = "📸 Это локальное загруженное изображение через callback!"
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

async def set_bot_commands():
    """Устанавливает команды бота"""
    commands = [
        BotCommand(command="start", description="Запустить бота"),
        BotCommand(command="photo", description="Отправить локальную фотографию"),
    ]
    await bot.set_my_commands(commands)

async def main():
    # Настройка логирования
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Устанавливаем команды бота
    await set_bot_commands()
    
    logging.info("Бот запущен и готов к работе!")
    
    # Запускаем polling
    await dp.start_polling(bot)

if __name__ == '__main__':
    asyncio.run(main())