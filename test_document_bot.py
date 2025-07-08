"""
Тест отправки документов - Telegram Bot
Сгенерировано с помощью TelegramBot Builder

Команды для @BotFather:
start - Запустить бота
document - Отправить документ
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

# Установка команд бота
async def set_bot_commands():
    commands = [
        BotCommand(command="start", description="Запустить бота"),
        BotCommand(command="document", description="Отправить документ")
    ]
    await bot.set_my_commands(commands)

# Обработчик команды /start
@dp.message(CommandStart())
async def start_handler(message: types.Message):
    logging.info(f"Команда /start вызвана пользователем {message.from_user.id}")
    
    caption = """🚀 Добро пожаловать в тестовый бот!

Этот бот тестирует отправку документов."""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📄 Получить документ", callback_data="document-test"))
    keyboard = builder.as_markup()
    
    await message.answer(caption, reply_markup=keyboard)

# Обработчик команды /document
@dp.message(Command("document"))
async def document_handler(message: types.Message):
    logging.info(f"Команда /document вызвана пользователем {message.from_user.id}")
    
    caption = """📄 Тестовый документ

Это пример отправки документа через команду."""
    
    document_url = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    document_name = "test-document.pdf"
    
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
        
        await message.answer_document(
            document_file,
            caption=caption
        )
    except Exception as e:
        logging.error(f"Ошибка отправки документа: {e}")
        await message.answer(f"❌ Не удалось загрузить документ\n{caption}")

# Callback обработчик для inline кнопки
@dp.callback_query(lambda c: c.data == "document-test")
async def handle_callback_document_test(callback_query: types.CallbackQuery):
    await callback_query.answer()
    caption = """📄 Документ через callback

Это пример отправки документа через inline кнопку."""
    
    document_url = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    document_name = "callback-document.pdf"
    
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
        
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="start-menu"))
        keyboard = builder.as_markup()
        
        await callback_query.message.delete()
        await bot.send_document(callback_query.from_user.id, document_file, caption=caption, reply_markup=keyboard)
    except Exception as e:
        logging.error(f"Ошибка отправки документа: {e}")
        await callback_query.message.edit_text(f"❌ Не удалось загрузить документ\n{caption}")

# Callback для возврата в главное меню
@dp.callback_query(lambda c: c.data == "start-menu")
async def handle_callback_start_menu(callback_query: types.CallbackQuery):
    await callback_query.answer()
    caption = """🚀 Добро пожаловать в тестовый бот!

Этот бот тестирует отправку документов."""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📄 Получить документ", callback_data="document-test"))
    keyboard = builder.as_markup()
    
    await callback_query.message.edit_text(caption, reply_markup=keyboard)

# Основная функция запуска бота
async def main():
    logging.info("Запуск бота...")
    
    # Установка команд
    await set_bot_commands()
    
    # Запуск polling
    try:
        await dp.start_polling(bot)
    except Exception as e:
        logging.error(f"Ошибка при запуске бота: {e}")
    finally:
        await bot.session.close()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("Бот остановлен пользователем")
    except Exception as e:
        logging.error(f"Критическая ошибка: {e}")