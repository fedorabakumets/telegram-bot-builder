"""
Отладочный бот для тестирования отправки документов
"""

import asyncio
import logging
import os
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, URLInputFile, FSInputFile
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.enums import ParseMode

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Токен бота - замените на свой
BOT_TOKEN = "YOUR_TOKEN_HERE"

if BOT_TOKEN == "YOUR_TOKEN_HERE":
    print("❌ ОШИБКА: Замените BOT_TOKEN на реальный токен вашего бота!")
    exit(1)

# Создание бота и диспетчера
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

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
    logger.info(f"Команда /start от пользователя {message.from_user.id}")
    
    text = "🤖 Тестовый бот для отправки документов\n\nВыберите тип документа:"
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📄 PDF документ", callback_data="pdf_doc"))
    builder.add(InlineKeyboardButton(text="📋 Текстовый файл", callback_data="txt_doc"))
    builder.add(InlineKeyboardButton(text="📊 Excel файл", callback_data="xlsx_doc"))
    keyboard = builder.as_markup()
    
    await message.answer(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "pdf_doc")
async def send_pdf_document(callback_query: types.CallbackQuery):
    await callback_query.answer()
    logger.info(f"Запрос PDF документа от пользователя {callback_query.from_user.id}")
    
    try:
        document_url = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
        document_name = "test-document.pdf"
        caption = "📄 Тестовый PDF документ\n\nЭто пример отправки PDF файла."
        
        logger.info(f"Попытка отправки PDF: {document_url}")
        
        # Проверяем тип файла
        if is_local_file(document_url):
            logger.info("Это локальный файл")
            file_path = get_local_file_path(document_url)
            if os.path.exists(file_path):
                document_file = FSInputFile(file_path, filename=document_name)
                logger.info(f"Используем FSInputFile для файла: {file_path}")
            else:
                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")
        else:
            logger.info("Это внешний URL файл")
            document_file = URLInputFile(document_url, filename=document_name)
            logger.info(f"Используем URLInputFile для URL: {document_url}")
        
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_menu"))
        keyboard = builder.as_markup()
        
        await callback_query.message.delete()
        
        # Отправляем документ
        result = await bot.send_document(
            chat_id=callback_query.from_user.id,
            document=document_file,
            caption=caption,
            reply_markup=keyboard
        )
        
        logger.info(f"✅ Документ успешно отправлен! Message ID: {result.message_id}")
        
    except Exception as e:
        logger.error(f"❌ Ошибка отправки PDF документа: {e}")
        await callback_query.message.edit_text(
            f"❌ Не удалось отправить PDF документ\n\nОшибка: {str(e)}",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
                InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_menu")
            ]])
        )

@dp.callback_query(lambda c: c.data == "txt_doc")
async def send_txt_document(callback_query: types.CallbackQuery):
    await callback_query.answer()
    logger.info(f"Запрос TXT документа от пользователя {callback_query.from_user.id}")
    
    try:
        # Создаем временный текстовый файл
        file_content = """Это тестовый текстовый файл.

Содержимое файла:
- Строка 1
- Строка 2
- Строка 3

Файл создан для тестирования отправки документов в Telegram боте.
"""
        
        file_path = "temp_test.txt"
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(file_content)
        
        caption = "📋 Тестовый текстовый файл\n\nЭто пример отправки TXT файла."
        
        document_file = FSInputFile(file_path, filename="test-file.txt")
        logger.info(f"Отправляем локальный файл: {file_path}")
        
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_menu"))
        keyboard = builder.as_markup()
        
        await callback_query.message.delete()
        
        result = await bot.send_document(
            chat_id=callback_query.from_user.id,
            document=document_file,
            caption=caption,
            reply_markup=keyboard
        )
        
        logger.info(f"✅ TXT документ успешно отправлен! Message ID: {result.message_id}")
        
        # Удаляем временный файл
        os.remove(file_path)
        
    except Exception as e:
        logger.error(f"❌ Ошибка отправки TXT документа: {e}")
        await callback_query.message.edit_text(
            f"❌ Не удалось отправить TXT документ\n\nОшибка: {str(e)}",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
                InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_menu")
            ]])
        )

@dp.callback_query(lambda c: c.data == "xlsx_doc")
async def send_xlsx_document(callback_query: types.CallbackQuery):
    await callback_query.answer()
    logger.info(f"Запрос XLSX документа от пользователя {callback_query.from_user.id}")
    
    try:
        # URL реального Excel файла
        document_url = "https://file-examples.com/storage/fe68c0a3c44ad8d98b29c39/2017/10/file_example_XLS_10.xls"
        document_name = "test-spreadsheet.xls"
        caption = "📊 Тестовый Excel файл\n\nЭто пример отправки XLS файла."
        
        logger.info(f"Попытка отправки Excel: {document_url}")
        
        document_file = URLInputFile(document_url, filename=document_name)
        
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_menu"))
        keyboard = builder.as_markup()
        
        await callback_query.message.delete()
        
        result = await bot.send_document(
            chat_id=callback_query.from_user.id,
            document=document_file,
            caption=caption,
            reply_markup=keyboard
        )
        
        logger.info(f"✅ Excel документ успешно отправлен! Message ID: {result.message_id}")
        
    except Exception as e:
        logger.error(f"❌ Ошибка отправки Excel документа: {e}")
        await callback_query.message.edit_text(
            f"❌ Не удалось отправить Excel документ\n\nОшибка: {str(e)}",
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
                InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_menu")
            ]])
        )

@dp.callback_query(lambda c: c.data == "back_to_menu")
async def back_to_menu(callback_query: types.CallbackQuery):
    await callback_query.answer()
    
    text = "🤖 Тестовый бот для отправки документов\n\nВыберите тип документа:"
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📄 PDF документ", callback_data="pdf_doc"))
    builder.add(InlineKeyboardButton(text="📋 Текстовый файл", callback_data="txt_doc"))
    builder.add(InlineKeyboardButton(text="📊 Excel файл", callback_data="xlsx_doc"))
    keyboard = builder.as_markup()
    
    await callback_query.message.edit_text(text, reply_markup=keyboard)

async def main():
    logger.info("🚀 Запуск отладочного бота...")
    
    try:
        # Получаем информацию о боте
        bot_info = await bot.get_me()
        logger.info(f"Бот запущен: @{bot_info.username}")
        
        # Запуск polling
        await dp.start_polling(bot)
        
    except Exception as e:
        logger.error(f"❌ Критическая ошибка: {e}")
    finally:
        await bot.session.close()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("⏹️ Бот остановлен пользователем")
    except Exception as e:
        logger.error(f"❌ Ошибка запуска: {e}")