"""
🤖 Исправленный Медиа-бот - Telegram Bot
Сгенерировано с помощью TelegramBot Builder

Команды для @BotFather:
start - Запустить бота
help - Помощь по использованию бота
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
    # Здесь можно добавить логику проверки авторизации
    return user_id in user_data


# Настройка меню команд
async def set_bot_commands():
    commands = [
        BotCommand(command="start", description="Запустить бота"),
        BotCommand(command="help", description="Помощь по использованию бота"),
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

    text = """🤖 Добро пожаловать в Медиа-бот!

Этот бот демонстрирует отправку различных типов медиафайлов:
• Фотографии
• Видео
• Аудио
• Документы"""
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🖼️ Медиа контент", callback_data="media-menu"))
    builder.add(InlineKeyboardButton(text="❓ Помощь", callback_data="help-menu"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

@dp.message(Command("help"))
async def help_handler(message: types.Message):
    logging.info(f"Команда /help вызвана пользователем {message.from_user.id}")
    # Сохраняем статистику использования команд
    if message.from_user.id not in user_data:
        user_data[message.from_user.id] = {}
    if "commands_used" not in user_data[message.from_user.id]:
        user_data[message.from_user.id]["commands_used"] = {}
    user_data[message.from_user.id]["commands_used"]["/help"] = user_data[message.from_user.id]["commands_used"].get("/help", 0) + 1

    text = """❓ Справка по боту

Доступные команды:
• /start - Запуск бота и главное меню
• /help - Показать эту справку

Функции бота:
• Отправка фотографий
• Отправка видео
• Отправка аудиофайлов
• Отправка документов"""
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Главное меню", callback_data="start-menu"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "media-menu")
async def handle_callback_media_menu(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🖼️ Медиа контент

Выберите тип контента для демонстрации:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📸 Фото", callback_data="photo-demo"))
    builder.add(InlineKeyboardButton(text="🎥 Видео", callback_data="video-demo"))
    builder.add(InlineKeyboardButton(text="🎵 Аудио", callback_data="audio-demo"))
    builder.add(InlineKeyboardButton(text="📄 Документ", callback_data="document-demo"))
    builder.add(InlineKeyboardButton(text="🔙 Главное меню", callback_data="start-menu"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "photo-demo")
async def handle_callback_photo_demo(callback_query: types.CallbackQuery):
    await callback_query.answer()
    caption = """📸 Демонстрация фотографии

Это пример отправки изображения через бота."""
    photo_url = "https://picsum.photos/800/600?random=1"
    try:
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="🔙 К медиа", callback_data="media-menu"))
        keyboard = builder.as_markup()
        await callback_query.message.delete()
        await bot.send_photo(callback_query.from_user.id, photo_url, caption=caption, reply_markup=keyboard)
    except Exception as e:
        logging.error(f"Ошибка отправки фото: {e}")
        await callback_query.message.edit_text(f"❌ Не удалось загрузить фото\n{caption}")

@dp.callback_query(lambda c: c.data == "video-demo")
async def handle_callback_video_demo(callback_query: types.CallbackQuery):
    await callback_query.answer()
    caption = """🎥 Демонстрация видео

Это пример отправки видео файла через бота."""
    video_url = "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
    try:
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="🔙 К медиа", callback_data="media-menu"))
        keyboard = builder.as_markup()
        await callback_query.message.delete()
        await bot.send_video(callback_query.from_user.id, video_url, caption=caption, reply_markup=keyboard)
    except Exception as e:
        logging.error(f"Ошибка отправки видео: {e}")
        await callback_query.message.edit_text(f"❌ Не удалось загрузить видео\n{caption}")

@dp.callback_query(lambda c: c.data == "audio-demo")
async def handle_callback_audio_demo(callback_query: types.CallbackQuery):
    await callback_query.answer()
    caption = """🎵 Демонстрация аудио

Это пример отправки аудио файла через бота."""
    audio_url = "https://www.soundjay.com/misc/beep-07a.wav"
    try:
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="🔙 К медиа", callback_data="media-menu"))
        keyboard = builder.as_markup()
        await callback_query.message.delete()
        await bot.send_audio(callback_query.from_user.id, audio_url, caption=caption, reply_markup=keyboard)
    except Exception as e:
        logging.error(f"Ошибка отправки аудио: {e}")
        await callback_query.message.edit_text(f"❌ Не удалось загрузить аудио\n{caption}")

@dp.callback_query(lambda c: c.data == "document-demo")
async def handle_callback_document_demo(callback_query: types.CallbackQuery):
    await callback_query.answer()
    caption = """📄 Демонстрация документа

Это пример отправки документа через бота."""
    document_url = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    document_name = "example-document.pdf"
    try:
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="🔙 К медиа", callback_data="media-menu"))
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

@dp.callback_query(lambda c: c.data == "help-menu")
async def handle_callback_help_menu(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """❓ Справка по боту

Доступные команды:
• /start - Запуск бота и главное меню
• /help - Показать эту справку

Функции бота:
• Отправка фотографий
• Отправка видео
• Отправка аудиофайлов
• Отправка документов"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Главное меню", callback_data="start-menu"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "start-menu")
async def handle_callback_start_menu(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🤖 Добро пожаловать в Медиа-бот!

Этот бот демонстрирует отправку различных типов медиафайлов:
• Фотографии
• Видео
• Аудио
• Документы"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🖼️ Медиа контент", callback_data="media-menu"))
    builder.add(InlineKeyboardButton(text="❓ Помощь", callback_data="help-menu"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

async def main():
    logging.info("Запуск бота...")
    
    # Настройка команд для меню
    await set_bot_commands()
    
    # Запуск polling
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())