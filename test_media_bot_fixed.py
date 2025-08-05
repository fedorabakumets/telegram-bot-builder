"""
🤖 Тест медиафайлов - Telegram Bot
Исправленная версия с реальными медиафайлами

Команды для @BotFather:
start - Запустить бота
"""

import asyncio
import logging
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, BotCommand, ReplyKeyboardRemove, URLInputFile
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
ADMIN_IDS = [123456789]

# Хранилище пользователей
user_data = {}

# Утилитарные функции
async def is_admin(user_id: int) -> bool:
    return user_id in ADMIN_IDS

async def is_private_chat(message: types.Message) -> bool:
    return message.chat.type == "private"

async def check_auth(user_id: int) -> bool:
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

    text = """🤖 Добро пожаловать в тест медиафайлов!

Этот бот тестирует отправку различных типов медиа."""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🖼️ Медиа", callback_data="media-msg"))
    builder.add(InlineKeyboardButton(text="❓ Помощь", callback_data="help-msg"))
    keyboard = builder.as_markup()
    await message.answer(text, reply_markup=keyboard)

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "media-msg")
async def handle_callback_btn_media(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🖼️ Медиа контент:

Выберите тип медиа для тестирования:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🎥 Видео", callback_data="video-msg"))
    builder.add(InlineKeyboardButton(text="🎵 Аудио", callback_data="audio-msg"))
    builder.add(InlineKeyboardButton(text="📄 Документ", callback_data="document-msg"))
    builder.add(InlineKeyboardButton(text="🔙 Главное меню", callback_data="start-msg"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "video-msg")
async def handle_callback_btn_video(callback_query: types.CallbackQuery):
    await callback_query.answer()
    caption = """🎥 Демонстрация видео

Это пример отправки видеофайла."""
    video_url = "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
    try:
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="🔙 К медиа", callback_data="media-msg"))
        keyboard = builder.as_markup()
        await callback_query.message.delete()
        await bot.send_video(callback_query.from_user.id, video_url, caption=caption, reply_markup=keyboard)
    except Exception as e:
        logging.error(f"Ошибка отправки видео: {e}")
        await callback_query.message.edit_text(f"❌ Не удалось загрузить видео\n{caption}")

@dp.callback_query(lambda c: c.data == "audio-msg")
async def handle_callback_btn_audio(callback_query: types.CallbackQuery):
    await callback_query.answer()
    caption = """🎵 Демонстрация аудио

Это пример отправки аудиофайла."""
    audio_url = "https://www.soundjay.com/misc/beep-07a.wav"
    try:
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="🔙 К медиа", callback_data="media-msg"))
        keyboard = builder.as_markup()
        await callback_query.message.delete()
        await bot.send_audio(callback_query.from_user.id, audio_url, caption=caption, reply_markup=keyboard)
    except Exception as e:
        logging.error(f"Ошибка отправки аудио: {e}")
        await callback_query.message.edit_text(f"❌ Не удалось загрузить аудио\n{caption}")

@dp.callback_query(lambda c: c.data == "document-msg")
async def handle_callback_btn_document(callback_query: types.CallbackQuery):
    await callback_query.answer()
    caption = """📄 Демонстрация документа

Это пример отправки документа."""
    document_url = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    document_name = "test-document.pdf"
    try:
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="🔙 К медиа", callback_data="media-msg"))
        keyboard = builder.as_markup()
        await callback_query.message.delete()
        await bot.send_document(
            callback_query.from_user.id, 
            URLInputFile(document_url, filename=document_name), 
            caption=caption, 
            reply_markup=keyboard
        )
    except Exception as e:
        logging.error(f"Ошибка отправки документа: {e}")
        await callback_query.message.edit_text(f"❌ Не удалось загрузить документ\n{caption}")

@dp.callback_query(lambda c: c.data == "help-msg")
async def handle_callback_btn_help(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """❓ Справка

Этот бот демонстрирует отправку медиафайлов:
• Видео файлы
• Аудио файлы  
• Документы"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Главное меню", callback_data="start-msg"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "start-msg")
async def handle_callback_btn_start(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🤖 Добро пожаловать в тест медиафайлов!

Этот бот тестирует отправку различных типов медиа."""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🖼️ Медиа", callback_data="media-msg"))
    builder.add(InlineKeyboardButton(text="❓ Помощь", callback_data="help-msg"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

async def main():
    logging.info("Запуск бота...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())