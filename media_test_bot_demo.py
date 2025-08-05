"""
🎥 Демонстрационный медиа-бот - Telegram Bot
Сгенерировано с помощью TelegramBot Builder

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
ADMIN_IDS = [123456789]  # Замените на реальные ID администраторов

# Хранилище пользователей (в реальном боте используйте базу данных)
user_data = {}

# Утилитарные функции
async def is_admin(user_id: int) -> bool:
    return user_id in ADMIN_IDS

async def is_private_chat(message: types.Message) -> bool:
    return message.chat.type == "private"

async def check_auth(user_id: int) -> bool:
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

    text = """🎥 Демонстрационный медиа-бот

Этот бот показывает, как правильно отправлять различные типы медиафайлов:
• Фотографии
• Видео
• Аудио
• Документы

Выберите тип медиа для тестирования:"""
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📸 Фото", callback_data="photo_demo"))
    builder.add(InlineKeyboardButton(text="🎥 Видео", callback_data="video_demo"))
    builder.add(InlineKeyboardButton(text="🎵 Аудио", callback_data="audio_demo"))
    builder.add(InlineKeyboardButton(text="📄 Документ", callback_data="document_demo"))
    builder.adjust(2)  # Размещаем кнопки по 2 в ряд
    keyboard = builder.as_markup()
    
    await message.answer(text, reply_markup=keyboard)

# Обработчики inline кнопок для медиа

@dp.callback_query(lambda c: c.data == "photo_demo")
async def handle_callback_photo_demo(callback_query: types.CallbackQuery):
    await callback_query.answer()
    caption = """📸 Демонстрация фото

Это пример отправки фотографии через бота."""
    photo_url = "https://picsum.photos/800/600?random=1"
    try:
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_menu"))
        keyboard = builder.as_markup()
        await callback_query.message.delete()
        await bot.send_photo(callback_query.from_user.id, photo_url, caption=caption, reply_markup=keyboard)
    except Exception as e:
        logging.error(f"Ошибка отправки фото: {e}")
        await callback_query.message.edit_text(f"❌ Не удалось загрузить фото\n{caption}")

@dp.callback_query(lambda c: c.data == "video_demo")
async def handle_callback_video_demo(callback_query: types.CallbackQuery):
    await callback_query.answer()
    caption = """🎥 Демонстрация видео

Это пример отправки видеофайла через бота."""
    video_url = "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
    try:
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_menu"))
        keyboard = builder.as_markup()
        await callback_query.message.delete()
        await bot.send_video(callback_query.from_user.id, video_url, caption=caption, reply_markup=keyboard)
    except Exception as e:
        logging.error(f"Ошибка отправки видео: {e}")
        await callback_query.message.edit_text(f"❌ Не удалось загрузить видео\n{caption}")

@dp.callback_query(lambda c: c.data == "audio_demo")
async def handle_callback_audio_demo(callback_query: types.CallbackQuery):
    await callback_query.answer()
    caption = """🎵 Демонстрация аудио

Это пример отправки аудиофайла через бота."""
    audio_url = "https://www.soundjay.com/misc/beep-07a.wav"
    try:
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_menu"))
        keyboard = builder.as_markup()
        await callback_query.message.delete()
        await bot.send_audio(callback_query.from_user.id, audio_url, caption=caption, reply_markup=keyboard)
    except Exception as e:
        logging.error(f"Ошибка отправки аудио: {e}")
        await callback_query.message.edit_text(f"❌ Не удалось загрузить аудио\n{caption}")

@dp.callback_query(lambda c: c.data == "document_demo")
async def handle_callback_document_demo(callback_query: types.CallbackQuery):
    await callback_query.answer()
    caption = """📄 Демонстрация документа

Это пример отправки документа через бота."""
    document_url = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    document_name = "demo-document.pdf"
    try:
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_menu"))
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

@dp.callback_query(lambda c: c.data == "back_to_menu")
async def handle_callback_back_to_menu(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🎥 Демонстрационный медиа-бот

Этот бот показывает, как правильно отправлять различные типы медиафайлов:
• Фотографии
• Видео
• Аудио
• Документы

Выберите тип медиа для тестирования:"""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📸 Фото", callback_data="photo_demo"))
    builder.add(InlineKeyboardButton(text="🎥 Видео", callback_data="video_demo"))
    builder.add(InlineKeyboardButton(text="🎵 Аудио", callback_data="audio_demo"))
    builder.add(InlineKeyboardButton(text="📄 Документ", callback_data="document_demo"))
    builder.adjust(2)  # Размещаем кнопки по 2 в ряд
    keyboard = builder.as_markup()
    
    await callback_query.message.edit_text(text, reply_markup=keyboard)

# Запуск бота
async def main():
    await set_bot_commands()
    print("Демонстрационный медиа-бот запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())