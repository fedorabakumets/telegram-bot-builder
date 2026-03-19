"""
Phase6_i03 - Telegram Bot
Сгенерировано с помощью TelegramBot Builder

Команды для @BotFather:
start - Запустить бота"""

# -*- coding: utf-8 -*-
import os
import sys

# Устанавливаем UTF-8 кодировку для вывода
if sys.platform.startswith("win"):
    # Для Windows устанавливаем UTF-8 кодировку
    os.environ["PYTHONIOENCODING"] = "utf-8"
    try:
        import codecs
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except (AttributeError, UnicodeError):
        # Fallback для старых версий Python
        import codecs
        sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
        sys.stderr = codecs.getwriter("utf-8")(sys.stderr.detach())


import asyncio
import logging
import signal

from aiogram import Bot, Dispatcher, types, F, BaseMiddleware
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    BotCommand,
    ReplyKeyboardRemove,
    FSInputFile
)
from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder
from typing import Optional, Callable, Awaitable, Any

from dotenv import load_dotenv
from aiogram.filters import CommandStart, Command
from aiogram.exceptions import TelegramBadRequest
import aiohttp
from aiohttp import TCPConnector
from aiogram.enums import ParseMode

import re
from types import SimpleNamespace


# Safe helper for editing messages with fallback to new message
async def safe_edit_or_send(cbq, text, node_id=None, is_auto_transition=False, **kwargs):
    """
    Безопасное редактирование сообщения с fallback на новое сообщение
    При автопереходе или при использовании ReplyKeyboard сразу отправляем новое сообщение
    """
    result = None

    # Проверяем, есть ли reply_markup и является ли он ReplyKeyboardMarkup
    reply_markup = kwargs.get("reply_markup", None)
    is_reply_keyboard = reply_markup and ("ReplyKeyboard" in str(type(reply_markup)))

    try:
        # При автопереходе или при использовании ReplyKeyboard сразу отправляем новое сообщение
        if is_auto_transition or is_reply_keyboard:
            if is_reply_keyboard:
                logging.info(f"💬 Reply клавиатура: отправляем новое сообщение вместо редактирования")
            elif is_auto_transition:
                logging.info(f"⚡ Автопереход: отправляем новое сообщение вместо редактирования")
            if hasattr(cbq, "message") and cbq.message:
                result = await cbq.message.answer(text, **kwargs)
            else:
                raise Exception("Cannot send message in auto-transition or with reply keyboard")
        else:
            # Пробуем редактировать сообщение (только для inline клавиатуры)
            # Проверяем, содержит ли сообщение текст для редактирования
            if hasattr(cbq, "edit_text") and callable(getattr(cbq, "edit_text")) and cbq.message and cbq.message.text:
                result = await cbq.edit_text(text, **kwargs)
            elif (hasattr(cbq, "message") and cbq.message and cbq.message.text):
                result = await cbq.message.edit_text(text, **kwargs)
            else:
                # Если сообщение не содержит текста, отправляем новое
                if hasattr(cbq, "message") and cbq.message:
                    result = await cbq.message.answer(text, **kwargs)
                else:
                    raise Exception("No valid edit method found and no message to send new text")
    except Exception as e:
        # При любой ошибке отправляем новое сообщение
        if is_auto_transition:
            logging.info(f"⚡ Автопереход: {e}, отправляем новое сообщение")
        elif is_reply_keyboard:
            logging.info(f"💬 Reply клавиатура: {e}, отправляем новое сообщение")
        else:
            logging.warning(f"Не удалось отредактировать сообщение: {e}, отправляем новое")
        # Проверяем, является ли cbq объектом message или callback_query
        if hasattr(cbq, "answer"):  # cbq является message
            result = await cbq.answer(text, **kwargs)
        elif hasattr(cbq, "message") and cbq.message:  # cbq является callback_query
            result = await cbq.message.answer(text, **kwargs)
        else:
            logging.error("Не удалось ни отредактировать, ни отправить новое сообщение")
            raise

    return result


# Загрузка переменных окружения из .env файла
load_dotenv()


# Токен вашего бота (получите у @BotFather)
BOT_TOKEN = os.getenv("BOT_TOKEN")


# Настройка логирования с поддержкой UTF-8
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)


# Подавление всех сообщений от asyncpg (настраивается через .env)
if os.getenv("DISABLE_ASYNC_LOG", "true").lower() == "true":
    logging.getLogger("asyncpg").setLevel(logging.CRITICAL)


# Создание бота и диспетчера
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()


# Список администраторов (загружается из .env)
ADMIN_IDS = [int(x.strip()) for x in os.getenv("ADMIN_IDS", "").replace(" ", "").split(",") if x.strip()]


# Директория проекта
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
logging.info(f"📁 PROJECT_DIR: {PROJECT_DIR}")


# Хранилище пользователей (временное состояние)
user_data = {}


# Утилитарные функции

def get_user_variables(user_id):
    return user_data.get(user_id, {})


async def init_user_variables(user_id: int, from_user) -> str:
    """Инициализирует переменные пользователя в локальном хранилище

    Args:
        user_id (int): ID пользователя Telegram
        from_user: Объект пользователя aiogram (types.User)

    Returns:
        str: Имя пользователя (username или first_name)
    """
    if user_id not in user_data:
        user_data[user_id] = {}
    username = getattr(from_user, 'username', None) or ''
    first_name = getattr(from_user, 'first_name', None) or ''
    last_name = getattr(from_user, 'last_name', None) or ''
    user_name = username or first_name or str(user_id)
    user_data[user_id]['username'] = username
    user_data[user_id]['first_name'] = first_name
    user_data[user_id]['last_name'] = last_name
    user_data[user_id]['user_name'] = user_name
    user_data[user_id]['user_id'] = user_id
    return user_name
async def check_auth(user_id: int) -> bool:
    return user_id in user_data


async def init_all_user_vars(user_id: int) -> dict:
    """Собирает все переменные пользователя из локального хранилища и БД

    Returns:
        dict: Объединённый словарь всех переменных пользователя
    """
    all_vars = dict(user_data.get(user_id, {}))
    return all_vars
async def save_message_to_api(user_id, message_type: str, message_text: str = None, node_id: str = None, message_data: dict = None):
    """Заглушка save_message_to_api когда БД отключена"""
    return None


def replace_variables_in_text(text: str, variables: dict, filters: dict = None) -> str:
    """Заменяет переменные вида {var_name} в тексте на их значения

    Args:
        text: Исходный текст с переменными
        variables: Словарь переменных для подстановки
        filters: Словарь фильтров форматирования (опционально)

    Returns:
        str: Текст с подставленными значениями
    """
    if not text or not variables:
        return text or ''
    result = text
    for key, value in variables.items():
        if value is not None:
            result = result.replace('{' + str(key) + '}', str(value))
    return result


# ┌─────────────────────────────────────────┐
# │      Сохранение медиа в БД              │
# └─────────────────────────────────────────┘

async def save_media_to_db(file_id: str, file_type: str, file_name: str = None, file_size: int = None, mime_type: str = None):
    """Сохраняет информацию о медиа-файле в базу данных напрямую"""
    try:
        file_path = f"/uploads/{PROJECT_ID}/{file_id}_{file_name or file_type}"
        file_url = f"{PROJECT_DIR}{file_path}"

        async with db_pool.acquire() as conn:
            result = await conn.fetchrow(
                """
                INSERT INTO media_files (project_id, file_name, file_type, file_path, file_size, mime_type, url, is_public, usage_count)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 0)
                RETURNING id, file_name, file_type, url
                """,
                PROJECT_ID,
                file_name or f"{file_type}_{file_id}",
                file_type,
                file_path,
                file_size or 0,
                mime_type or "application/octet-stream",
                file_url
            )
            logging.info(f"✅ Медиа сохранено в БД: {file_type} (id={result['id']})")
            return {"id": result["id"], "file_name": result["file_name"], "file_type": result["file_type"], "url": result["url"]}
    except Exception as e:
        logging.error(f"❌ Ошибка сохранения медиа в БД: {e}")
    return None


async def link_media_to_message(message_id: int, media_id: int, media_kind: str = "photo", order_index: int = 0):
    """Связывает медиа с сообщением в базе данных"""
    try:
        async with db_pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO bot_message_media (message_id, media_file_id, media_kind, order_index)
                VALUES ($1, $2, $3, $4)
                """,
                message_id, media_id, media_kind, order_index
            )
            await conn.execute(
                """
                UPDATE bot_messages SET primary_media_id = $1 WHERE id = $2
                """,
                media_id, message_id
            )
            logging.info(f"🔗 Медиа связано с сообщением {message_id}")
            return True
    except Exception as e:
        logging.error(f"❌ Ошибка связи медиа с сообщением: {e}")
    return False


# Функция для получения пути к файлу в папке uploads
def get_upload_file_path(file_path):
    """Получает правильный путь к файлу в папке uploads"""
    import os
    bot_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(bot_dir))
    relative_path = file_path[1:]
    return os.path.join(project_root, relative_path)


async def register_telegram_photo(message_id: int, file_id: str, bot_token: str, media_type: str = "photo"):
    """Регистрирует фото из Telegram в системе и сохраняет в БД"""
    try:
        media_result = await save_media_to_db(
            file_id=file_id,
            file_type=media_type,
            file_name=f"{media_type}_{file_id}",
            file_size=0,
            mime_type=f"image/{media_type}" if media_type == "photo" else "application/octet-stream"
        )
        if media_result:
            await link_media_to_message(
                message_id=message_id,
                media_id=media_result["id"],
                media_kind=media_type,
                order_index=0
            )
            logging.info(f"✅ Медиа зарегистрировано для сообщения {message_id}")
            return media_result
        else:
            logging.warning(f"⚠️ Не удалось сохранить медиа для сообщения {message_id}")
            return None
    except Exception as e:
        logging.error(f"Ошибка при регистрации медиа: {e}")
        return None


async def send_photo_with_caption(chat_id: int, photo_source, caption: str = None, **kwargs):
    """Отправляет фото с подписью и сохраняет в базу данных"""
    try:
        if isinstance(photo_source, str) and photo_source.startswith('/uploads/'):
            file_path = get_upload_file_path(photo_source)
            result = await bot.send_photo(chat_id, FSInputFile(file_path), caption=caption, **kwargs)
        else:
            result = await bot.send_photo(chat_id, photo_source, caption=caption, **kwargs)

        message_data_obj = {"message_id": result.message_id if result else None}
        if result and hasattr(result, "photo") and result.photo:
            largest_photo = result.photo[-1]
            message_data_obj["photo"] = {
                "file_id": largest_photo.file_id,
                "file_unique_id": largest_photo.file_unique_id,
                "width": largest_photo.width,
                "height": largest_photo.height
            }

        await save_message_to_api(
            user_id=str(chat_id),
            message_type="bot",
            message_text=caption or "[Фото]",
            message_data=message_data_obj
        )
        return result
    except Exception as e:
        logging.error(f"Ошибка при отправке фото: {e}")
        if caption:
            return await bot.send_message(chat_id, caption, **kwargs)


# @@NODE_START:sYCfWgnaiQ3RYmDo_rLtm@@


@dp.message(CommandStart())
async def start_handler(message: types.Message):
    """Обработчик команды /start"""
    logging.info(f"Команда /start вызвана пользователем {message.from_user.id}")

    user_id = message.from_user.id
    username = message.from_user.username
    first_name = message.from_user.first_name
    last_name = message.from_user.last_name

    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["username"] = username
    user_data[user_id]["first_name"] = first_name
    user_data[user_id]["last_name"] = last_name

    user_data[user_id] = user_data.get(user_id, {})
    user_data[user_id]["audio_url_sYCfWgnaiQ3RYmDo_rLtm"] = "https://example.com/audio.mp3"

    text = "Привет! Добро пожаловать!"

    all_user_vars = await init_all_user_vars(user_id)
    text = replace_variables_in_text(text, all_user_vars, {})

    

    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="кнопка 2", callback_data="1KvQin0bE6-tRu9mm8xK_"))
    builder.add(InlineKeyboardButton(text="кнопка 1", callback_data="1KvQin0bE6-tRu9mm8xK_"))
    builder.adjust(1, 1)
    keyboard = builder.as_markup()

    await message.answer_audio("https://example.com/audio.mp3", caption=text, reply_markup=keyboard)


# Обработчики синонимов


@dp.message(lambda message: message.text and message.text.lower() == "старт")
async def start_synonym_______handler(message: types.Message):
    # Синоним для команды /start
    await start_handler(message)


# @@NODE_END:sYCfWgnaiQ3RYmDo_rLtm@@

# @@NODE_START:1KvQin0bE6-tRu9mm8xK_@@


# Обработчики синонимов


@dp.message(lambda message: message.text and message.text.lower() == "новое")
async def message_1KvQin0bE6_tRu9mm8xK__synonym_______handler(message: types.Message):
    # Синоним для сообщения 1KvQin0bE6-tRu9mm8xK_
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'новое' для узла 1KvQin0bE6-tRu9mm8xK_")

    class MockCallback:
        def __init__(self, data, user, msg):
            self.data = data
            self.from_user = user
            self.message = msg

        async def answer(self):
            pass

        async def edit_text(self, text, **kwargs):
            try:
                return await self.message.edit_text(text, **kwargs)
            except Exception as e:
                logging.warning(f"Не удалось отредактировать сообщение: {e}")
                return await self.message.answer(text, **kwargs)

    mock_callback = MockCallback("1KvQin0bE6-tRu9mm8xK_", message.from_user, message)
    await handle_callback_1KvQin0bE6_tRu9mm8xK_(mock_callback)


@dp.callback_query(lambda c: c.data == "1KvQin0bE6-tRu9mm8xK_" or c.data.startswith("1KvQin0bE6-tRu9mm8xK__btn_"))
async def handle_callback_1KvQin0bE6_tRu9mm8xK_(callback_query: types.CallbackQuery):
    """Обработчик перехода к узлу 1KvQin0bE6-tRu9mm8xK_"""
    user_id = callback_query.from_user.id
    logging.info(f"🔵 Переход к узлу 1KvQin0bE6-tRu9mm8xK_ для пользователя {user_id}")

    # Отвечаем на callback (чтобы убрать часы загрузки)
    try:
        await callback_query.answer()
    except Exception:
        pass

    
    username = callback_query.from_user.username
    first_name = callback_query.from_user.first_name
    last_name = callback_query.from_user.last_name

    # Сохранение в локальное хранилище
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["username"] = username
    user_data[user_id]["first_name"] = first_name
    user_data[user_id]["last_name"] = last_name

    text = "<b><strike>привет </strike></b><i style=\"font-weight: bold;\"><u>красавчик</u></i>"

    all_user_vars = await init_all_user_vars(user_id)
    text = replace_variables_in_text(text, all_user_vars, {})

    

    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="кнопка 1", callback_data="1773753866038"))
    builder.add(InlineKeyboardButton(text="кнопка 2", callback_data="1773753866311"))
    builder.adjust(1, 1)
    keyboard = builder.as_markup()

    
    await callback_query.message.answer(text, reply_markup=keyboard, parse_mode="HTML")


# @@NODE_END:1KvQin0bE6-tRu9mm8xK_@@

@dp.message(F.text)
async def fallback_text_handler(message: types.Message):
    """
    Fallback обработчик для всех текстовых сообщений без специфичного обработчика.
    """
    logging.info(f"📩 Получено необработанное текстовое сообщение от {message.from_user.id}: {message.text}")


@dp.message(F.photo)
async def handle_unhandled_photo(message: types.Message):
    """
    Обрабатывает фотографии, которые не были обработаны другими обработчиками.
    """
    logging.info(f"📸 Получено фото от пользователя {message.from_user.id}")


async def set_bot_commands():
    """Настройка меню команд для BotFather"""
    commands = [

        BotCommand(command="start", description="Запустить бота"),

    ]
    await bot.set_my_commands(commands)


async def main():
    """Главная функция запуска бота"""
    global db_pool

    def signal_handler(signum, frame):
        print(f"⚠️ Получен сигнал {signum}, начинаем корректное завершение...")
        import sys
        sys.exit(0)

    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)

    try:
        await set_bot_commands()

        print("🚀 Бот запущен и готов к работе!")
        await dp.start_polling(bot)
    except KeyboardInterrupt:
        print("⚠️ Получен сигнал остановки, завершаем работу...")
    except SystemExit:
        print("⚠️ Системное завершение, завершаем работу...")
    except Exception as e:
        logging.error(f"Ошибка: {e}")
    finally:

        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
