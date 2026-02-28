"""
TestBot - Telegram Bot
Сгенерировано с помощью TelegramBot Builder

Команды для @BotFather:
start - Команда бота"""

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
from aiogram import Bot, Dispatcher, types, F
from aiogram.types import KeyboardButton, InlineKeyboardButton, InlineKeyboardMarkup, BotCommand, ReplyKeyboardRemove, FSInputFile
from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder
from typing import Optional
import asyncpg
import json
import aiohttp
from aiohttp import TCPConnector

import asyncio
import logging
import signal

from aiogram import Bot, Dispatcher, types, F

from aiogram.filters import CommandStart
from aiogram.types import URLInputFile
from aiogram.exceptions import TelegramBadRequest
import re
# Код сгенерирован в generateBasicBotSetupCode.ts
# Загрузка переменных окружения из .env файла
from dotenv import load_dotenv
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
# Код сгенерирован в generateBasicBotSetupCode.ts
if os.getenv("DISABLE_ASYNC_LOG", "true").lower() == "true":
    logging.getLogger("asyncpg").setLevel(logging.CRITICAL)

# Создание бота и диспетчера
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# Список администраторов (загружается из .env)
ADMIN_IDS = [int(x.strip()) for x in os.getenv("ADMIN_IDS", "").replace(" ", "").split(",") if x.strip()]
# Код сгенерирован в generateApiConfig.ts
# ┌─────────────────────────────────────────┐
# │        Конфигурация API                 │
# └─────────────────────────────────────────┘
# Таймаут запросов к API (секунды)
API_TIMEOUT = int(os.getenv("API_TIMEOUT", "10"))

# Использование SSL для API
API_USE_SSL = os.getenv("API_USE_SSL", "auto").lower()
# Хранилище пользователей (временное состояние)
user_data = {}

# ┌─────────────────────────────────────────┐
# │  Функция проверки пользовательских       │
# │           переменных (глобально)         │
# └─────────────────────────────────────────┘
# Код сгенерирован в generateGlobalCheckUserVariableFunction.ts
def check_user_variable_inline(var_name, user_data_dict):
    # Код сгенерирован в generateGlobalCheckUserVariableFunction.ts
    if "user_data" in user_data_dict and user_data_dict["user_data"]:
        try:
            parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
            # Код сгенерирован в generateGlobalCheckUserVariableFunction.ts
            if var_name in parsed_data:
                raw_value = parsed_data[var_name]
                # Код сгенерирован в generateGlobalCheckUserVariableFunction.ts
                if isinstance(raw_value, dict) and "value" in raw_value:
                    var_value = raw_value["value"]
                    # Код сгенерирован в generateGlobalCheckUserVariableFunction.ts
                    if var_value is not None and str(var_value).strip() != "":
                        return True, str(var_value)
                else:
                    # Код сгенерирован в generateGlobalCheckUserVariableFunction.ts
                    if raw_value is not None and str(raw_value).strip() != "":
                        return True, str(raw_value)
        except (json.JSONDecodeError, TypeError):
            pass
    # Код сгенерирован в generateGlobalCheckUserVariableFunction.ts
    if var_name in user_data_dict:
        variable_data = user_data_dict.get(var_name)
        # Код сгенерирован в generateGlobalCheckUserVariableFunction.ts
        if isinstance(variable_data, dict) and "value" in variable_data:
            var_value = variable_data["value"]
            # Код сгенерирован в generateGlobalCheckUserVariableFunction.ts
            if var_value is not None and str(var_value).strip() != "":
                return True, str(var_value)
        elif variable_data is not None and str(variable_data).strip() != "":
            return True, str(variable_data)
    return False, None
# Утилитарные функции
from aiogram import types

async def is_admin(user_id: int) -> bool:
    return user_id in ADMIN_IDS

async def is_private_chat(message: types.Message) -> bool:
    return message.chat.type == "private"

def get_user_variables(user_id):
    """Получает все переменные пользователя из локального хранилища
    
    Args:
        user_id (int): ID пользователя Telegram
    
    Returns:
        dict: Словарь с переменными пользователя или пустой словарь если пользователь не найден
    """
    # Возвращаем переменные пользователя из локального хранилища или пустой словарь
    return user_data.get(user_id, {})

async def check_auth(user_id: int) -> bool:
    return user_id in user_data


# Функция для получения пути к файлу в папке uploads
def get_upload_file_path(file_path):
    """Получает правильный путь к файлу в папке uploads

    Args:
        file_path: Путь к файлу в формате /uploads/...

    Returns:
        Полный путь к файлу в файловой системе
    """
    import os
    # Получаем директорию файла бота
    bot_dir = os.path.dirname(os.path.abspath(__file__))
    # Поднимаемся на два уровня выше к корню проекта
    project_root = os.path.dirname(os.path.dirname(bot_dir))  # поднимаемся из bots/bot_17_24 в bots, затем в корень
    # Формируем путь к файлу, убирая начальный символ '/' и используя правильные разделители
    relative_path = file_path[1:]  # убираем начальный '/'
    return os.path.join(project_root, relative_path)

async def register_telegram_photo(message_id: int, file_id: str, bot_token: str, media_type: str = "photo"):
    """Регистр??рует фото из Telegram в системе

    Args:
        message_id: ID сообщения в базе данных
        file_id: ID файла в Telegram
        bot_token: Токен бота для доступа к API Telegram
        media_type: Тип медиа ('photo', 'document', etc.)
    """
    try:
        if API_BASE_URL.startswith("http://") or API_BASE_URL.startswith("https://"):
            media_api_url = f"{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-photo"
        else:
            media_api_url = f"https://{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-photo"

        media_payload = {
            "messageId": message_id,
            "fileId": file_id,
            "botToken": bot_token,
            "mediaType": media_type
        }

        # Определяем, использовать ли SSL для медиа-запросов
        use_ssl_media = not (media_api_url.startswith("http://") or "localhost" in media_api_url or "127.0.0.1" in media_api_url or "0.0.0.0" in media_api_url)
        logging.debug(f"🔒 SSL требуется для медиа-запроса {media_api_url}: {use_ssl_media}")
        # ИСПРАВЛЕНИЕ: Для localhost всегда используем ssl=False, чтобы избежать ошибки SSL WRONG_VERSION_NUMBER
        if "localhost" in media_api_url or "127.0.0.1" in media_api_url or "0.0.0.0" in media_api_url:
            use_ssl_media = False
            logging.debug(f"🔓 SSL принудительно отключен для локального медиа-запроса: {media_api_url}")

        if use_ssl_media:
            # Для внешних соединений используем SSL-контекст
            connector = TCPConnector(ssl=True)
        else:
            # Для локальных соединений не используем SSL-контекст
            # Явно отключаем SSL и устанавливаем настройки для небезопасного соединения
            import ssl
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            connector = TCPConnector(ssl=ssl_context)

        async with aiohttp.ClientSession(connector=connector) as session:
            async with session.post(media_api_url, json=media_payload, timeout=aiohttp.ClientTimeout(total=API_TIMEOUT)) as response:
                if response.status == 200:
                    logging.info(f"✅ Медиа зарегистрировано для сообщения {message_id}")
                    return await response.json()
                else:
                    error_text = await response.text()
                    logging.warning(f"⚠️ Не удалось зарегистрировать медиа: {response.status} - {error_text}")
                    return None
    except Exception as e:
        logging.error(f"Ошибка при регистрации медиа: {e}")
        return None

async def download_and_save_photo(file_id: str, bot_token: str, filename: str = None):
    """Скачивает фото из Telegram и сохраняет его локальн??

    Args:
        file_id: ID файла в Telegram
        bot_token: Токен бота для доступа к API Telegram
        filename: Имя файла для сохранения (опционально)

    Returns:
        П??ть к сохраненному файлу или None в случае ошибки
    """
    try:
        import tempfile
        import os

        # Получаем информацию о файле
        file_info_url = f"https://api.telegram.org/bot{bot_token}/getFile?file_id={file_id}"
        async with aiohttp.ClientSession() as session:
            async with session.get(file_info_url) as response:
                if response.status != 200:
                    logging.error(f"❌ Не уда??ось получить информацию о файле: {response.status}")
                    return None

                file_info = await response.json()
                if not file_info.get("ok"):
                    logging.error(f"❌ Ошибка Telegram API при получении информации о файле: {file_info}")
                    return None

                file_path = file_info["result"]["file_path"]

                # Формируем URL для скачивания файла
                download_url = f"https://api.telegram.org/file/bot{bot_token}/{file_path}"

                # Определ???ем имя файла, если не задано
                if not filename:
                    filename = os.path.basename(file_path)

                # Создаем временную директорию для сохранения фото
                temp_dir = os.path.join(tempfile.gettempdir(), "telegram_bot_photos")
                os.makedirs(temp_dir, exist_ok=True)

                file_path_full = os.path.join(temp_dir, filename)

                # Скачиваем и сохраняем файл
                async with session.get(download_url) as file_response:
                    if file_response.status == 200:
                        with open(file_path_full, "wb") as f:
                            async for chunk in file_response.content.iter_chunked(8192):
                                f.write(chunk)

                        logging.info(f"📷 Фото успешно скача??о и сохранено: {file_path_full}")
                        return file_path_full
                    else:
                        logging.error(f"❌ Не удалось скачать фото: {file_response.status}")
                        return None
    except Exception as e:
        logging.error(f"Ошибка при скачивании фото: {e}")
        return None

async def send_photo_with_caption(chat_id: int, photo_source, caption: str = None, **kwargs):
    """Отправляет фото с подписью и сохраняет в базу данных

    Args:
        chat_id: ID чата для отправки
        photo_source: Источник фото (file_id, URL или путь к файлу)
        caption: Подпись к фото (опционально)

    Returns:
        Результат отправки сообщения
    """
    try:
        # Проверяем, является ли photo_source относительным путем к локальному файлу
        if isinstance(photo_source, str) and photo_source.startswith('/uploads/'):
            # Для локальных файлов используем FSInputFile для отправки напрямую с диска
            file_path = get_upload_file_path(photo_source)
            result = await bot.send_photo(chat_id, FSInputFile(file_path), caption=caption, **kwargs)
        else:
            result = await bot.send_photo(chat_id, photo_source, caption=caption, **kwargs)

        # Сохраняем сообщение в базу данных
        message_data_obj = {"message_id": result.message_id if result else None}

        # Сохраняем информацию о фото
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
        logging.error(f"Ошибка при отправк?? фото: {e}")
        # Если отправка с фото не удалась, пробуем отправить просто текст
        if caption:
            return await bot.send_message(chat_id, caption, **kwargs)

def get_user_media_attachments(user_id: int):
    """Получает список медиа-вложений пользователя из его переменных

    Args:
        user_id: ID пользователя

    Returns:
        Список медиа-вложений
    """
    user_vars = get_user_variables(user_id)
    media_types = ["photo", "video", "audio", "document", "voice", "animation"]
    attachments = {}

    for media_type in media_types:
        if media_type in user_vars:
            media_data = user_vars[media_type]
            if isinstance(media_data, dict) and "value" in media_data:
                # ИСПРАВЛЕНИЕ: Проверяем правильные URL поля в зависимости от типа медиа
                media_url = None
                if media_type == "photo" and "photoUrl" in media_data:
                    media_url = media_data["photoUrl"]
                elif media_type == "video" and "videoUrl" in media_data:
                    media_url = media_data["videoUrl"]
                elif media_type == "audio" and "audioUrl" in media_data:
                    media_url = media_data["audioUrl"]
                elif media_type == "document" and "documentUrl" in media_data:
                    media_url = media_data["documentUrl"]
                
                # Используем URL если доступен, иначе используем value (file_id)
                attachments[media_type] = media_url if media_url else media_data["value"]
            elif media_data is not None:
                attachments[media_type] = media_data

    return attachments

def clear_user_media_attachments(user_id: int):
    """Очищает медиа-вложения пользователя

    Args:
        user_id: ID пользователя
    """
    media_types = ["photo", "video", "audio", "document", "voice", "animation"]

    for media_type in media_types:
        if user_id in user_data and media_type in user_data[user_id]:
            del user_data[user_id][media_type]
            logging.debug(f"🗑️ Очищено медиа '{media_type}' для пользователя {user_id}")
# Код сгенерирован в generate-node-handlers.ts

# @@NODE_START:start@@


# Код сгенерирован в initializeAndRestoreMultipleSelectionState.ts

# Код сгенерирован в generateKeyboardAndProcessAttachedMedia.ts

# Код сгенерирован в generateConditionalMessageLogicAndKeyboard.ts

# Код сгенерирован в generateStartHandler.ts

# Код сгенерирован в generate-node-handlers.ts
@dp.message(CommandStart())
# Код сгенерирован в initializeAndRestoreMultipleSelectionState.ts
# Код сгенерирован в generateKeyboardAndProcessAttachedMedia.ts
# Код сгенерирован в generateConditionalMessageLogicAndKeyboard.ts
# Код сгенерирован в generateStartHandler.ts
# Код сгенерирован в generate-node-handlers.ts
async def start_handler(message: types.Message):

    # Регистрируем пользователя в системе
    user_id = message.from_user.id
    username = message.from_user.username
    first_name = message.from_user.first_name
    last_name = message.from_user.last_name
    avatar_url = None
    # Получаем аватарку пользователя
    try:
        photos = await bot.get_user_profile_photos(user_id)
        # Код сгенерирован в initializeAndRestoreMultipleSelectionState.ts
        # Код сгенерирован в generateKeyboardAndProcessAttachedMedia.ts
        # Код сгенерирован в generateConditionalMessageLogicAndKeyboard.ts
        # Код сгенерирован в generateStartHandler.ts
        # Код сгенерирован в generate-node-handlers.ts
        if photos.photos and len(photos.photos) > 0:
            last_photo = photos.photos[-1][-1]
            file = await bot.get_file(last_photo.file_id)
            avatar_url = file.file_path
    except Exception as e:
        logging.warning(f"Не удалось получить аватарку: {e}")

    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, message.from_user)

# ┌─────────────────────────────────────────┐
# │      Инициализация пользовательских     │
# │            переменных                   │
# └─────────────────────────────────────────┘
    # Код сгенерирован в generateUniversalVariableReplacement.ts
    user_obj = None
    # Безопасно проверяем наличие message (для message handlers)
    # Код сгенерирован в generateUniversalVariableReplacement.ts
    # Код сгенерирован в initializeAndRestoreMultipleSelectionState.ts
    # Код сгенерирован в generateKeyboardAndProcessAttachedMedia.ts
    # Код сгенерирован в generateConditionalMessageLogicAndKeyboard.ts
    # Код сгенерирован в generateStartHandler.ts
    # Код сгенерирован в generate-node-handlers.ts
    if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
        user_obj = locals().get('message').from_user
    # Безопасно проверяем наличие callback_query (для callback handlers)
    elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
        user_obj = locals().get('callback_query').from_user

    # Код сгенерирован в generateUniversalVariableReplacement.ts
    # Код сгенерирован в initializeAndRestoreMultipleSelectionState.ts
    # Код сгенерирован в generateKeyboardAndProcessAttachedMedia.ts
    # Код сгенерирован в generateConditionalMessageLogicAndKeyboard.ts
    # Код сгенерирован в generateStartHandler.ts
    # Код сгенерирован в generate-node-handlers.ts
    if user_id not in user_data or 'user_name' not in user_data.get(user_id, {}):
        # Проверяем, что user_obj определен и инициализируем переменные пользователя
        # Код сгенерирован в generateUniversalVariableReplacement.ts
        # Код сгенерирован в initializeAndRestoreMultipleSelectionState.ts
        # Код сгенерирован в generateKeyboardAndProcessAttachedMedia.ts
        # Код сгенерирован в generateConditionalMessageLogicAndKeyboard.ts
        # Код сгенерирован в generateStartHandler.ts
        # Код сгенерирован в generate-node-handlers.ts
        if user_obj is not None:
            user_name = init_user_variables(user_id, user_obj)
    # Подставляем все доступные переменные пользователя в текст
    # Инициализируем user_vars пустым словарём ТОЛЬКО если он ещё не определён
    # Код сгенерирован в generateUniversalVariableReplacement.ts
    # Код сгенерирован в initializeAndRestoreMultipleSelectionState.ts
    # Код сгенерирован в generateKeyboardAndProcessAttachedMedia.ts
    # Код сгенерирован в generateConditionalMessageLogicAndKeyboard.ts
    # Код сгенерирован в generateStartHandler.ts
    # Код сгенерирован в generate-node-handlers.ts
    if "user_vars" not in locals():
        user_vars = {}
    # Получаем переменные из БД или используем локальные
    db_user_vars = await get_user_from_db(user_id)
    # Код сгенерирован в generateUniversalVariableReplacement.ts
    # Код сгенерирован в initializeAndRestoreMultipleSelectionState.ts
    # Код сгенерирован в generateKeyboardAndProcessAttachedMedia.ts
    # Код сгенерирован в generateConditionalMessageLogicAndKeyboard.ts
    # Код сгенерирован в generateStartHandler.ts
    # Код сгенерирован в generate-node-handlers.ts
    if not db_user_vars:
        db_user_vars = user_data.get(user_id, {})
    # get_user_from_db теперь возвращает уже обработанные user_data
    # Код сгенерирован в generateUniversalVariableReplacement.ts
    # Код сгенерирован в initializeAndRestoreMultipleSelectionState.ts
    # Код сгенерирован в generateKeyboardAndProcessAttachedMedia.ts
    # Код сгенерирован в generateConditionalMessageLogicAndKeyboard.ts
    # Код сгенерирован в generateStartHandler.ts
    # Код сгенерирован в generate-node-handlers.ts
    if not isinstance(db_user_vars, dict):
        db_user_vars = user_data.get(user_id, {})
    # Обновляем user_vars данными из БД (не перезаписываем!)
    # Код сгенерирован в generateUniversalVariableReplacement.ts
    # Код сгенерирован в initializeAndRestoreMultipleSelectionState.ts
    # Код сгенерирован в generateKeyboardAndProcessAttachedMedia.ts
    # Код сгенерирован в generateConditionalMessageLogicAndKeyboard.ts
    # Код сгенерирован в generateStartHandler.ts
    # Код сгенерирован в generate-node-handlers.ts
    if db_user_vars and isinstance(db_user_vars, dict):
        user_vars.update(db_user_vars)
    # Создаем объединенный словарь переменных из базы данных и локального хранилища
    all_user_vars = {}
    # Добавляем переменные из базы данных
    # Код сгенерирован в generateUniversalVariableReplacement.ts
    # Код сгенерирован в initializeAndRestoreMultipleSelectionState.ts
    # Код сгенерирован в generateKeyboardAndProcessAttachedMedia.ts
    # Код сгенерирован в generateConditionalMessageLogicAndKeyboard.ts
    # Код сгенерирован в generateStartHandler.ts
    # Код сгенерирован в generate-node-handlers.ts
    if user_vars and isinstance(user_vars, dict):
        all_user_vars.update(user_vars)
    # Добавляем переменные из локального хранилища
    local_user_vars = user_data.get(user_id, {})
    # Код сгенерирован в generateUniversalVariableReplacement.ts
    # Код сгенерирован в initializeAndRestoreMultipleSelectionState.ts
    # Код сгенерирован в generateKeyboardAndProcessAttachedMedia.ts
    # Код сгенерирован в generateConditionalMessageLogicAndKeyboard.ts
    # Код сгенерирован в generateStartHandler.ts
    # Код сгенерирован в generate-node-handlers.ts
    if isinstance(local_user_vars, dict):
        all_user_vars.update(local_user_vars)
    # Заменяем все переменные в тексте
# ┌─────────────────────────────────────────┐
# │      Замена переменных в тексте         │
# └─────────────────────────────────────────┘
    # Код сгенерирован в replace_variables_in_text.ts
    # Код сгенерирован в generateUniversalVariableReplacement.ts
    # Код сгенерирован в initializeAndRestoreMultipleSelectionState.ts
    # Код сгенерирован в generateKeyboardAndProcessAttachedMedia.ts
    # Код сгенерирован в generateConditionalMessageLogicAndKeyboard.ts
    # Код сгенерирован в generateStartHandler.ts
    # Код сгенерирован в generate-node-handlers.ts
    def replace_variables_in_text(text_content, variables_dict):
        """Заменяет переменные формата {variable_name} в тексте на их значения
        
        Args:
            text_content (str): Текст с переменными для замены
            variables_dict (dict): Словарь переменных пользователя
        
        Returns:
            str: Текст с замененными переменными
        """
        # Код сгенерирован в replace_variables_in_text.ts
        # Код сгенерирован в generateUniversalVariableReplacement.ts
        # Код сгенерирован в initializeAndRestoreMultipleSelectionState.ts
        # Код сгенерирован в generateKeyboardAndProcessAttachedMedia.ts
        # Код сгенерирован в generateConditionalMessageLogicAndKeyboard.ts
        # Код сгенерирован в generateStartHandler.ts
        # Код сгенерирован в generate-node-handlers.ts
        if not text_content or not variables_dict:
            logging.debug(f"🔍 replace_variables_in_text: text_content={text_content is not None}, variables_dict={variables_dict is not None}")
            return text_content
        
        # Логируем доступные переменные для отладки
        logging.debug(f"🔍 Доступные переменные для замены: {list(variables_dict.keys())}")
        
        # Проходим по всем переменным пользователя
        for var_name, var_data in variables_dict.items():
            placeholder = "{" + var_name + "}"
            # Код сгенерирован в replace_variables_in_text.ts
            # Код сгенерирован в generateUniversalVariableReplacement.ts
            # Код сгенерирован в initializeAndRestoreMultipleSelectionState.ts
            # Код сгенерирован в generateKeyboardAndProcessAttachedMedia.ts
            # Код сгенерирован в generateConditionalMessageLogicAndKeyboard.ts
            # Код сгенерирован в generateStartHandler.ts
            # Код сгенерирован в generate-node-handlers.ts
            if placeholder in text_content:
                # Извлекаем значение переменной
                # Код сгенерирован в replace_variables_in_text.ts
                # Код сгенерирован в generateUniversalVariableReplacement.ts
                # Код сгенерирован в initializeAndRestoreMultipleSelectionState.ts
                # Код сгенерирован в generateKeyboardAndProcessAttachedMedia.ts
                # Код сгенерирован в generateConditionalMessageLogicAndKeyboard.ts
                # Код сгенерирован в generateStartHandler.ts
                # Код сгенерирован в generate-node-handlers.ts
                if isinstance(var_data, dict) and "value" in var_data:
                    var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                elif var_data is not None:
                    var_value = str(var_data)
                else:
                    var_value = var_name  # Показываем имя переменной если значения нет
                
                # Заменяем переменную на значение
                text_content = text_content.replace(placeholder, var_value)
                logging.info(f"🔄 Заменена переменная {placeholder} на '{var_value}'")
        
        # Логируем финальный текст
        logging.debug(f"📝 Финальный текст после замены: {text_content[:200] if text_content else 'None'}...")
        return text_content
    # Заменяем переменные в тексте, если text определена
    try:
        text = replace_variables_in_text(text, all_user_vars)
    except NameError:
        logging.warning("⚠️ Переменная text не определена при попытке замены переменных")
        text = ""  # Устанавливаем пустой текст по умолчанию

    # Сохраняем imageUrl в переменную imageUrlVar_start
    user_data[user_id] = user_data.get(user_id, {})
    user_data[user_id]["imageUrlVar_start"] = "https://example.com/image.jpg"
    text = "Hi"

    # Подставляем все доступные переменные пользователя в текст
    user_vars = await get_user_from_db(user_id)
    # Код сгенерирован в generateKeyboardAndProcessAttachedMedia.ts
    # Код сгенерирован в generateConditionalMessageLogicAndKeyboard.ts
    # Код сгенерирован в generateStartHandler.ts
    # Код сгенерирован в generate-node-handlers.ts
    if not user_vars:
        user_vars = user_data.get(user_id, {})

    # get_user_from_db теперь возвращает уже обработанные user_data
    # Код сгенерирован в generateKeyboardAndProcessAttachedMedia.ts
    # Код сгенерирован в generateConditionalMessageLogicAndKeyboard.ts
    # Код сгенерирован в generateStartHandler.ts
    # Код сгенерирован в generate-node-handlers.ts
    if not isinstance(user_vars, dict):
        user_vars = user_data.get(user_id, {})

    # Заменяем все переменные в тексте
    text = replace_variables_in_text(text, all_user_vars)
    keyboard = None
    # Код сгенерирован в generateAttachedMediaSendCode.ts
    keyboardHTML = locals().get('keyboardHTML', None) or globals().get('keyboardHTML', None) or None
    # Проверяем наличие прикрепленного медиа из переменной imageUrlVar_start
    attached_media = None
    # Создаем объединенный словарь переменных из базы данных и локального хранилища
    user_id = message.from_user.id
    all_user_vars = {}
    # Добавляем переменные из базы данных
    # Код сгенерирован в generateAttachedMediaSendCode.ts
    # Код сгенерирован в generateConditionalMessageLogicAndKeyboard.ts
    # Код сгенерирован в generateStartHandler.ts
    # Код сгенерирован в generate-node-handlers.ts
    if user_vars and isinstance(user_vars, dict):
        all_user_vars.update(user_vars)
    # Добавляем переменные из локального хранилища
    local_user_vars = user_data.get(user_id, {})
    # Код сгенерирован в generateAttachedMediaSendCode.ts
    # Код сгенерирован в generateConditionalMessageLogicAndKeyboard.ts
    # Код сгенерирован в generateStartHandler.ts
    # Код сгенерирован в generate-node-handlers.ts
    if isinstance(local_user_vars, dict):
        all_user_vars.update(local_user_vars)
    
    # Проверяем наличие прикрепленного медиа из переменной imageUrlVar_start в объединенном словаре
    attached_media = None
    # Код сгенерирован в generateAttachedMediaSendCode.ts
    # Код сгенерирован в generateConditionalMessageLogicAndKeyboard.ts
    # Код сгенерирован в generateStartHandler.ts
    # Код сгенерирован в generate-node-handlers.ts
    if "imageUrlVar_start" in all_user_vars:
        media_data = all_user_vars["imageUrlVar_start"]
        # Код сгенерирован в generateAttachedMediaSendCode.ts
        # Код сгенерирован в generateConditionalMessageLogicAndKeyboard.ts
        # Код сгенерирован в generateStartHandler.ts
        # Код сгенерирован в generate-node-handlers.ts
        if isinstance(media_data, dict) and "value" in media_data:
            # ИСПРАВЛЕНИЕ: Проверяем правильные URL поля в зависимости от типа медиа
            # Для фото проверяем photoUrl
            # Код сгенерирован в generateAttachedMediaSendCode.ts
            # Код сгенерирован в generateConditionalMessageLogicAndKeyboard.ts
            # Код сгенерирован в generateStartHandler.ts
            # Код сгенерирован в generate-node-handlers.ts
            if "photo" == "photo" and "photoUrl" in media_data and media_data["photoUrl"]:
                attached_media = media_data["photoUrl"]  # Используем URL вместо file_id
            # Для видео проверяем videoUrl
            elif "photo" == "video" and "videoUrl" in media_data and media_data["videoUrl"]:
                attached_media = media_data["videoUrl"]  # Используем URL вместо file_id
            # Для аудио проверяем audioUrl
            elif "photo" == "audio" and "audioUrl" in media_data and media_data["audioUrl"]:
                attached_media = media_data["audioUrl"]  # Используем URL вместо file_id
            # Для документов проверяем documentUrl
            elif "photo" == "document" and "documentUrl" in media_data and media_data["documentUrl"]:
                attached_media = media_data["documentUrl"]  # Используем URL вместо file_id
            else:
                attached_media = media_data["value"]  # Используем file_id только если URL недоступен
        elif isinstance(media_data, str):
            attached_media = media_data
    
    # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Устанавливаем состояние ожидания ввода для узла start
    # Код сгенерирован в generateWaitingStateCode.ts
    user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
    user_data[message.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "modes": ["text"],
        "variable": "response_start",
        "save_to_database": True,
        "node_id": "start",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной response_start (узел start)")
    logging.info(f"✅ Узел start настроен для сбора ввода (collectUserInput=true) после отправки медиа")
    # Если медиа найдено, отправляем с медиа, иначе обычное сообщение
    # Код сгенерирован в generateAttachedMediaSendCode.ts
    # Код сгенерирован в generateConditionalMessageLogicAndKeyboard.ts
    # Код сгенерирован в generateStartHandler.ts
    # Код сгенерирован в generate-node-handlers.ts
    if attached_media and str(attached_media).strip():
        logging.info(f"📎 Отправка photo медиа из переменной imageUrlVar_start: {attached_media}")
        try:
            # Заменяем переменные в тексте перед отправкой медиа
            # Используем all_user_vars вместо user_vars для корректной замены переменных
            processed_caption = replace_variables_in_text(text, all_user_vars)
            # Проверяем, является ли медиа относительным путем к локальному файлу
            # Код сгенерирован в generateAttachedMediaSendCode.ts
            # Код сгенерирован в generateConditionalMessageLogicAndKeyboard.ts
            # Код сгенерирован в generateStartHandler.ts
            # Код сгенерирован в generate-node-handlers.ts
            if str(attached_media).startswith('/uploads/') or str(attached_media).startswith('/uploads\\') or '\\uploads\\' in str(attached_media):
                attached_media_path = get_upload_file_path(attached_media)
                attached_media_url = FSInputFile(attached_media_path)
            else:
                attached_media_url = attached_media
            # Убедимся, что переменные keyboard и keyboardHTML определены
            # ВАЖНО: Не затираем keyboard, если он уже существует (сгенерирован ранее)
            # Код сгенерирован в generateAttachedMediaSendCode.ts
            # Код сгенерирован в generateConditionalMessageLogicAndKeyboard.ts
            # Код сгенерирован в generateStartHandler.ts
            # Код сгенерирован в generate-node-handlers.ts
            if 'keyboardHTML' not in locals():
                keyboardHTML = None
            await bot.send_photo(message.from_user.id, attached_media_url, caption=processed_caption, reply_markup=keyboard)
        except Exception as e:
            logging.error(f"Ошибка отправки photo: {e}")
            # Fallback на обычное сообщение при ошибке
            # Убедимся, что переменная keyboardHTML определена
            # Код сгенерирован в generateAttachedMediaSendCode.ts
            # Код сгенерирован в generateConditionalMessageLogicAndKeyboard.ts
            # Код сгенерирован в generateStartHandler.ts
            # Код сгенерирован в generate-node-handlers.ts
            if 'keyboardHTML' not in locals():
                keyboardHTML = None
            # Используем keyboard если keyboardHTML не определен
            reply_markup_to_use = keyboard if keyboard is not None else keyboardHTML
            await safe_edit_or_send(message, text, node_id="start", reply_markup=reply_markup_to_use, parse_mode=None)
    else:
        # Медиа не найдено, отправляем обычное текстовое сообщение
        logging.info(f"📝 Медиа imageUrlVar_start не найдено, отправка текстового сообщения")
        # Заменяем переменные в тексте перед отправкой
        # Используем all_user_vars вместо user_vars для корректной замены переменных
        processed_text = replace_variables_in_text(text, all_user_vars)
        # Убедимся, что переменная keyboardHTML определена
        # Код сгенерирован в generateAttachedMediaSendCode.ts
        # Код сгенерирован в generateConditionalMessageLogicAndKeyboard.ts
        # Код сгенерирован в generateStartHandler.ts
        # Код сгенерирован в generate-node-handlers.ts
        if 'keyboardHTML' not in locals():
            keyboardHTML = None
        # Отправляем сообщение с клавиатурой (используем keyboard если keyboardHTML не определен)
        reply_markup_to_use = keyboard if keyboard is not None else keyboardHTML
        await safe_edit_or_send(message, processed_text, node_id="start", reply_markup=reply_markup_to_use, parse_mode=None)

# @@NODE_END:start@@
# Обработчики автопереходов

@dp.callback_query(lambda c: c.data == "start" or c.data.startsWith("start_btn_") or c.data == "done_start")
async def handle_callback_start(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    callback_data = None  # Инициализируем переменную
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_start для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_start: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла start
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_start"] = False
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла start: false")
    
    text = "Hi"

    # Получаем переменные из базы данных
    user_data_dict = await get_user_from_db(user_id) or {}
    user_data_dict.update(user_data.get(user_id, {}))

    # Заменяем переменные в тексте
    user_vars = user_data_dict
    text = replace_variables_in_text(text, user_vars)

    keyboard = None
    
    # Проверяем, есть ли условная клавиатура для использования
    # Инициализируем переменную conditional_keyboard, если она не была определена
    if "conditional_keyboard" not in locals():
        conditional_keyboard = None
    user_id = callback_query.from_user.id
    if user_id not in user_data:
        user_data[user_id] = {}
    if "conditional_keyboard" in locals() and conditional_keyboard is not None:
        keyboard = conditional_keyboard
        user_data[user_id]["_has_conditional_keyboard"] = True
        logging.info("✅ Используем условную клавиатуру для навигации")
    else:
        user_data[user_id]["_has_conditional_keyboard"] = False
    
    # Устанавливаем переменную изображения для узла
    user_id = callback_query.from_user.id
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["image_url_start"] = "https://example.com/image.jpg"
    logging.info(f"✅ Переменная image_url_start установлена: https://example.com/image.jpg")
    
    # Устанавливаем переменные из attachedMedia
    user_id = callback_query.from_user.id
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["imageUrlVar_start"] = "https://example.com/image.jpg"
    logging.info(f"✅ Переменные из attachedMedia установлены для узла start")
    
    # Отправляем сообщение (с проверкой прикрепленного медиа)
    # Код сгенерирован в generateAttachedMediaSendCode.ts
    # Убедимся, что переменная keyboard определена
    # ВАЖНО: Не затираем keyboard, если он уже существует (сгенерирован ранее)
    
    # Узел содержит статическое изображение: https://example.com/image.jpg
    image_url = "https://example.com/image.jpg"
    logging.info(f"🖼️ Отправка изображения: {image_url}")
    # Отправляем статическое изображение
    try:
        # Заменяем переменные в тексте перед отправкой
        # Используем all_user_vars вместо user_vars для корректной замены переменных
        processed_caption = replace_variables_in_text(text, all_user_vars)
        # Код сгенерирован в generateAttachedMediaSendCode.ts
        if keyboard is not None:
            await bot.send_photo(callback_query.from_user.id, image_url, caption=processed_caption, reply_markup=keyboard, node_id="start")
        else:
            await bot.send_photo(callback_query.from_user.id, image_url, caption=processed_caption, node_id="start")
    except Exception as e:
        logging.error(f"Ошибка отправки статического изображения: {e}")
        # Fallback на обычное сообщение при ошибке
        # Код сгенерирован в generateAttachedMediaSendCode.ts
        if keyboard is not None:
            await safe_edit_or_send(callback_query, text, node_id="start", reply_markup=keyboard, parse_mode=None)
        else:
            await safe_edit_or_send(callback_query, text, node_id="start", parse_mode=None)
    keyboardHTML = locals().get('keyboardHTML', None) or globals().get('keyboardHTML', None) or None
    # Проверяем наличие прикрепленного медиа из переменной imageUrlVar_start
    attached_media = None
    # Создаем объединенный словарь переменных из базы данных и локального хранилища
    user_id = callback_query.from_user.id
    all_user_vars = {}
    # Добавляем переменные из базы данных
    # Код сгенерирован в generateAttachedMediaSendCode.ts
    if user_vars and isinstance(user_vars, dict):
        all_user_vars.update(user_vars)
    # Добавляем переменные из локального хранилища
    local_user_vars = user_data.get(user_id, {})
    # Код сгенерирован в generateAttachedMediaSendCode.ts
    if isinstance(local_user_vars, dict):
        all_user_vars.update(local_user_vars)
    
    # Проверяем наличие прикрепленного медиа из переменной imageUrlVar_start в объединенном словаре
    attached_media = None
    # Код сгенерирован в generateAttachedMediaSendCode.ts
    if "imageUrlVar_start" in all_user_vars:
        media_data = all_user_vars["imageUrlVar_start"]
        # Код сгенерирован в generateAttachedMediaSendCode.ts
        if isinstance(media_data, dict) and "value" in media_data:
            # ИСПРАВЛЕНИЕ: Проверяем правильные URL поля в зависимости от типа медиа
            # Для фото проверяем photoUrl
            # Код сгенерирован в generateAttachedMediaSendCode.ts
            if "photo" == "photo" and "photoUrl" in media_data and media_data["photoUrl"]:
                attached_media = media_data["photoUrl"]  # Используем URL вместо file_id
            # Для видео проверяем videoUrl
            elif "photo" == "video" and "videoUrl" in media_data and media_data["videoUrl"]:
                attached_media = media_data["videoUrl"]  # Используем URL вместо file_id
            # Для аудио проверяем audioUrl
            elif "photo" == "audio" and "audioUrl" in media_data and media_data["audioUrl"]:
                attached_media = media_data["audioUrl"]  # Используем URL вместо file_id
            # Для документов проверяем documentUrl
            elif "photo" == "document" and "documentUrl" in media_data and media_data["documentUrl"]:
                attached_media = media_data["documentUrl"]  # Используем URL вместо file_id
            else:
                attached_media = media_data["value"]  # Используем file_id только если URL недоступен
        elif isinstance(media_data, str):
            attached_media = media_data
    
    # Если медиа найдено, отправляем с медиа, иначе обычное сообщение
    # Код сгенерирован в generateAttachedMediaSendCode.ts
    if attached_media and str(attached_media).strip():
        logging.info(f"📎 Отправка photo медиа из переменной imageUrlVar_start: {attached_media}")
        try:
            # Заменяем переменные в тексте перед отправкой медиа
            # Используем all_user_vars вместо user_vars для корректной замены переменных
            processed_caption = replace_variables_in_text(text, all_user_vars)
            # Проверяем, является ли медиа относительным путем к локальному файлу
            # Код сгенерирован в generateAttachedMediaSendCode.ts
            if str(attached_media).startswith('/uploads/') or str(attached_media).startswith('/uploads\\') or '\\uploads\\' in str(attached_media):
                attached_media_path = get_upload_file_path(attached_media)
                attached_media_url = FSInputFile(attached_media_path)
            else:
                attached_media_url = attached_media
            # Убедимся, что переменные keyboard и keyboardHTML определены
            # ВАЖНО: Не затираем keyboard, если он уже существует (сгенерирован ранее)
            # Код сгенерирован в generateAttachedMediaSendCode.ts
            if 'keyboardHTML' not in locals():
                keyboardHTML = None
            await bot.send_photo(callback_query.from_user.id, attached_media_url, caption=processed_caption, reply_markup=keyboard)
        except Exception as e:
            logging.error(f"Ошибка отправки photo: {e}")
            # Fallback на обычное сообщение при ошибке
            # Убедимся, что переменная keyboardHTML определена
            # Код сгенерирован в generateAttachedMediaSendCode.ts
            if 'keyboardHTML' not in locals():
                keyboardHTML = None
            # Используем keyboard если keyboardHTML не определен
            reply_markup_to_use = keyboard if keyboard is not None else keyboardHTML
            await safe_edit_or_send(callback_query, text, node_id="start", reply_markup=reply_markup_to_use, parse_mode=None)
    else:
        # Медиа не найдено, отправляем обычное текстовое сообщение
        logging.info(f"📝 Медиа imageUrlVar_start не найдено, отправка текстового сообщения")
        # Заменяем переменные в тексте перед отправкой
        # Используем all_user_vars вместо user_vars для корректной замены переменных
        processed_text = replace_variables_in_text(text, all_user_vars)
        # Убедимся, что переменная keyboardHTML определена
        # Код сгенерирован в generateAttachedMediaSendCode.ts
        if 'keyboardHTML' not in locals():
            keyboardHTML = None
        # Отправляем сообщение с клавиатурой (используем keyboard если keyboardHTML не определен)
        reply_markup_to_use = keyboard if keyboard is not None else keyboardHTML
        await safe_edit_or_send(callback_query, processed_text, node_id="start", reply_markup=reply_markup_to_use, parse_mode=None)
    # Устанавливаем waiting_for_input, так как автопереход не выполнен
    # Код сгенерирован в generateWaitingStateCode.ts
    user_data[callback_query.from_user.id] = user_data.get(callback_query.from_user.id, {})
    user_data[callback_query.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "modes": ["text"],
        "variable": "response_start",
        "save_to_database": True,
        "node_id": "start",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной response_start (узел start)")
    user_id = callback_query.from_user.id
    
    
    # Определяем необходимость переадресации
    # hasButtons = false
    redirectTarget = "start"
    
    return


# Универсальный обработчик пользовательского ввода
@dp.message(F.text)
async def handle_user_input(message: types.Message):
    user_id = message.from_user.id
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, message.from_user)
    
# ┌─────────────────────────────────────────┐
# │      Инициализация пользовательских     │
# │            переменных                   │
# └─────────────────────────────────────────┘
    # Код сгенерирован в generateUniversalVariableReplacement.ts
    user_obj = None
    # Используем прямой доступ к message (гарантированно доступен как параметр функции)
    user_obj = message.from_user

    # Код сгенерирован в generateUniversalVariableReplacement.ts
    if user_id not in user_data or 'user_name' not in user_data.get(user_id, {}):
        # Проверяем, что user_obj определен и инициализируем переменные пользователя
        # Код сгенерирован в generateUniversalVariableReplacement.ts
        if user_obj is not None:
            user_name = init_user_variables(user_id, user_obj)
    # Подставляем все доступные переменные пользователя в текст
    # Инициализируем user_vars пустым словарём ТОЛЬКО если он ещё не определён
    # Код сгенерирован в generateUniversalVariableReplacement.ts
    if "user_vars" not in locals():
        user_vars = {}
    # Получаем переменные из БД или используем локальные
    db_user_vars = await get_user_from_db(user_id)
    # Код сгенерирован в generateUniversalVariableReplacement.ts
    if not db_user_vars:
        db_user_vars = user_data.get(user_id, {})
    # get_user_from_db теперь возвращает уже обработанные user_data
    # Код сгенерирован в generateUniversalVariableReplacement.ts
    if not isinstance(db_user_vars, dict):
        db_user_vars = user_data.get(user_id, {})
    # Обновляем user_vars данными из БД (не перезаписываем!)
    # Код сгенерирован в generateUniversalVariableReplacement.ts
    if db_user_vars and isinstance(db_user_vars, dict):
        user_vars.update(db_user_vars)
    # Создаем объединенный словарь переменных из базы данных и локального хранилища
    all_user_vars = {}
    # Добавляем переменные из базы данных
    # Код сгенерирован в generateUniversalVariableReplacement.ts
    if user_vars and isinstance(user_vars, dict):
        all_user_vars.update(user_vars)
    # Добавляем переменные из локального хранилища
    local_user_vars = user_data.get(user_id, {})
    # Код сгенерирован в generateUniversalVariableReplacement.ts
    if isinstance(local_user_vars, dict):
        all_user_vars.update(local_user_vars)
    # Заменяем все переменные в тексте
    # Заменяем переменные в тексте, если text определена
    try:
        text = replace_variables_in_text(text, all_user_vars)
    except NameError:
        logging.warning("⚠️ Переменная text не определена при попытке замены переменных")
        text = ""  # Устанавливаем пустой текст по умолчанию
    
    # Проверяем, является ли сообщение нажатием на reply-кнопку с флагом hideAfterClick
    
    
    # Проверяем, ожидаем ли мы ввод для условного сообщения
    if user_id in user_data and "waiting_for_conditional_input" in user_data[user_id]:
        config = user_data[user_id]["waiting_for_conditional_input"]
        user_text = message.text
        
        # ИСПРАВЛЕНИЕ: Проверяем, является ли текст кнопкой с skipDataCollection=true
        skip_buttons = config.get("skip_buttons", [])
        skip_button_target = None
        for skip_btn in skip_buttons:
            if skip_btn.get("text") == user_text:
                skip_button_target = skip_btn.get("target")
                logging.info(f"⏭️ Нажата кнопка с skipDataCollection: {user_text} -> {skip_button_target}")
                break
        
        # Если нажата кнопка пропуска - переходим к её target без сохранения
        if skip_button_target:
            # Очищаем состояние ожидания
            del user_data[user_id]["waiting_for_conditional_input"]
            
            # Переходим к целевому узлу кнопки
            try:
                logging.info(f"🚀 Переходим к узлу кнопки skipDataCollection: {skip_button_target}")
                import types as aiogram_types
                fake_callback = aiogram_types.SimpleNamespace(
                    id="skip_button_nav",
                    from_user=message.from_user,
                    chat_instance="",
                    data=skip_button_target,
                    message=message,
                    answer=lambda *args, **kwargs: asyncio.sleep(0)
                )
                if skip_button_target == "start":
                    # Проверяем и вызываем обработчик, если он существует
                    if 'handle_callback_start' in globals():
                        await handle_callback_start(fake_callback)
                    else:
                        logging.warning(f"⚠️ Обработчик не найден для узла: start, завершаем переход")
                        await message.answer("Переход завершен")
                else:
                    logging.warning(f"Неизвестный целевой узел кнопки skipDataCollection: {skip_button_target}")
            except Exception as e:
                logging.error(f"Ошибка при переходе к узлу кнопки skipDataCollection {skip_button_target}: {e}")
            return
        
        # Сохраняем текстовый ввод для условного сообщения (обычный случай без skipDataCollection)
        condition_id = config.get("condition_id", "unknown")
        next_node_id = config.get("next_node_id")
        
        # Сохраняем ответ пользователя
        timestamp = get_moscow_time()
        # Используем переменную из конфигурации или создаем автоматическую
        input_variable = config.get("input_variable", "")
        if input_variable:
            variable_name = input_variable
        else:
            variable_name = f"conditional_response_{condition_id}"
        
        # Сохраняем в пользовательские данные
        user_data[user_id][variable_name] = user_text
        
        # Сохраняем в базу данных
        saved_to_db = await update_user_data_in_db(user_id, variable_name, user_text)
        if saved_to_db:
            logging.info(f"✅ Условный ответ сохранен в БД: {variable_name} = {user_text} (пользователь {user_id})")
        else:
            logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
        
        # Очищаем состояние ожидания
        del user_data[user_id]["waiting_for_conditional_input"]
        
        logging.info(f"Получен ответ на условное сообщение: {variable_name} = {user_text}")
        
        # Переходим к следующему узлу если указан
        if next_node_id:
            try:
                logging.info(f"🚀 Переходим к следующему узлу: {next_node_id}")
                
                # Проверяем, является ли это командой
                if next_node_id == "profile_command":
                    logging.info("Переход к команде /profile")
                    # Проверяем существование profile_handler перед вызовом
                    profile_func = globals().get("profile_handler")
                    if profile_func:
                        await profile_func(message)
                    else:
                        logging.warning("profile_handler не найден, пропускаем вызов")
                        await message.answer("Команда /profile не найдена")
                else:
                    # Создаем фиктивный callback для навигации к обычному узлу
                    import types as aiogram_types
                    fake_callback = aiogram_types.SimpleNamespace(
                        id="conditional_nav",
                        from_user=message.from_user,
                        chat_instance="",
                        data=next_node_id,
                        message=message,
                        answer=lambda *args, **kwargs: asyncio.sleep(0)
                    )
                    
                    if next_node_id == "start":
                        # Обычный узел - отправляем сообщение
                        text = "Hi"
                        user_data[user_id] = user_data.get(user_id, {})
# ┌─────────────────────────────────────────┐
# │      Инициализация пользовательских     │
# │            переменных                   │
# └─────────────────────────────────────────┘
                        # Код сгенерирован в generateUniversalVariableReplacement.ts
                        user_obj = None
                        # Безопасно проверяем наличие message (для message handlers)
                        # Код сгенерирован в generateUniversalVariableReplacement.ts
                        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
                            user_obj = locals().get('message').from_user
                        # Безопасно проверяем наличие callback_query (для callback handlers)
                        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
                            user_obj = locals().get('callback_query').from_user

                        # Код сгенерирован в generateUniversalVariableReplacement.ts
                        if user_id not in user_data or 'user_name' not in user_data.get(user_id, {}):
                            # Проверяем, что user_obj определен и инициализируем переменные пользователя
                            # Код сгенерирован в generateUniversalVariableReplacement.ts
                            if user_obj is not None:
                                user_name = init_user_variables(user_id, user_obj)
                        # Подставляем все доступные переменные пользователя в текст
                        # Инициализируем user_vars пустым словарём ТОЛЬКО если он ещё не определён
                        # Код сгенерирован в generateUniversalVariableReplacement.ts
                        if "user_vars" not in locals():
                            user_vars = {}
                        # Получаем переменные из БД или используем локальные
                        db_user_vars = await get_user_from_db(user_id)
                        # Код сгенерирован в generateUniversalVariableReplacement.ts
                        if not db_user_vars:
                            db_user_vars = user_data.get(user_id, {})
                        # get_user_from_db теперь возвращает уже обработанные user_data
                        # Код сгенерирован в generateUniversalVariableReplacement.ts
                        if not isinstance(db_user_vars, dict):
                            db_user_vars = user_data.get(user_id, {})
                        # Обновляем user_vars данными из БД (не перезаписываем!)
                        # Код сгенерирован в generateUniversalVariableReplacement.ts
                        if db_user_vars and isinstance(db_user_vars, dict):
                            user_vars.update(db_user_vars)
                        # Создаем объединенный словарь переменных из базы данных и локального хранилища
                        all_user_vars = {}
                        # Добавляем переменные из базы данных
                        # Код сгенерирован в generateUniversalVariableReplacement.ts
                        if user_vars and isinstance(user_vars, dict):
                            all_user_vars.update(user_vars)
                        # Добавляем переменные из локального хранилища
                        local_user_vars = user_data.get(user_id, {})
                        # Код сгенерирован в generateUniversalVariableReplacement.ts
                        if isinstance(local_user_vars, dict):
                            all_user_vars.update(local_user_vars)
                        # Заменяем все переменные в тексте
                        # Заменяем переменные в тексте, если text определена
                        try:
                            text = replace_variables_in_text(text, all_user_vars)
                        except NameError:
                            logging.warning("⚠️ Переменная text не определена при попытке замены переменных")
                            text = ""  # Устанавливаем пустой текст по умолчанию
                        logging.info(f"Условная навигация к обычному узлу: start")
                        await message.answer(text)
                    else:
                        logging.warning(f"Неизвестныя следующий узел: {next_node_id}")
            except Exception as e:
                logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
        
        return  # Завершаем обработку для условного сообщения
        
    # Проверяем, ожидаем ли мы кнопочный ответ через reply клавиатуру
    if user_id in user_data and "button_response_config" in user_data[user_id]:
        config = user_data[user_id]["button_response_config"]
        user_text = message.text
        
        # Ищем выбранный вариант среди доступных опций
        selected_option = None
        for option in config.get("options", []):
            if option["text"] == user_text:
                selected_option = option
                break
        
        if selected_option:
            selected_value = selected_option["value"]
            selected_text = selected_option["text"]
            
            # Сохраняем ответ пользователя
            variable_name = config.get("variable", "button_response")
            timestamp = get_moscow_time()
            node_id = config.get("node_id", "unknown")
            
                # Создаем структурированный ответ
                response_data = {
                    "value": selected_value,
                    "text": selected_text,
                    "type": "button_choice",
                    "timestamp": timestamp,
                    "nodeId": node_id,
                    "variable": variable_name
                }
            
            # Сохраняем в пользовательские данные
            user_data[user_id][variable_name] = response_data
            
            # Сохраняем в базу данных если включено
            if config.get("save_to_database"):
                saved_to_db = await update_user_data_in_db(user_id, variable_name, response_data)
                if saved_to_db:
                    logging.info(f"✅ Кнопочный ответ сохранен в БД: {variable_name} = {selected_text} (пользователь {user_id})")
                else:
                    logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            # Отправляем сообщение об успехе
            success_message = config.get("success_message", "Спасибо за ваш выбор!")
            await message.answer(f"{success_message}\n\n✅ Ваш выбор: {selected_text}", reply_markup=ReplyKeyboardRemove())
            
            # Очищаем состояние
            del user_data[user_id]["button_response_config"]
                
            logging.info(f"Получен кнопочный ответ через reply клавиатуру: {variable_name} = {selected_text}")
                
            # Навигация на основе действия кнопки
            option_action = selected_option.get("action", "goto")
            option_target = selected_option.get("target", "")
            option_url = selected_option.get("url", "")
                
            if option_action == "command" and option_target:
                # Выполнение команды
                command = option_target
                # Создаем фиктивное сообщение для выполнения команды
                import types as aiogram_types
                fake_message = aiogram_types.SimpleNamespace(
                    from_user=message.from_user,
                    chat=message.chat,
                    text=command,
                    message_id=message.message_id
                )
                    
                if command == "/start":
                    try:
                        await start_handler(fake_message)
                    except Exception as e:
                        logging.error(f"Ошибка выполнения команды /start: {e}")
                else:
                    logging.warning(f"Неизвестная команда: {command}")
            elif option_action == "goto" and option_target:
                # Переход к узлу
                target_node_id = option_target
                try:
                    # Вызываем обработчик для целевого узла
                    if target_node_id == "start":
                        await handle_callback_start(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    else:
                        logging.warning(f"Неизвестный целевой узел: {target_node_id}")
                except Exception as e:
                    logging.error(f"Ошибка при переходе к узлу {target_node_id}: {e}")
            else:
                # Fallback к старой системе next_node_id если нет action
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start":
                            await handle_callback_start(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        else:
                            logging.warning(f"Неизвестный целевой узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
            return
        else:
            # Неверный выбор - показываем доступные варианты
            available_options = [option["text"] for option in config.get("options", [])]
            options_text = "\n".join([f"• {opt}" for opt in available_options])
            await message.answer(f"❌ Неверный выбор. Пожалуйста, выберите один из предложенных вариантов:\n\n{options_text}")
            return
    
    # ИСПРАВЛЕНИЕ: Проверяем pending_skip_buttons для медиа-узлов (фото/видео/аудио)
    # Эта проверка нужна когда узел ожидает медиа, но пользователь нажал reply-кнопку с skipDataCollection
    if user_id in user_data and "pending_skip_buttons" in user_data[user_id]:
        pending_buttons = user_data[user_id]["pending_skip_buttons"]
        user_text = message.text
        for skip_btn in pending_buttons:
            if skip_btn.get("text") == user_text:
                skip_target = skip_btn.get("target")
                logging.info(f"⏭️ Нажата кнопка skipDataCollection для медиа-узла: {user_text} -> {skip_target}")
            # Очищаем pending_skip_buttons и любые медиа-ожидания
            if "pending_skip_buttons" in user_data[user_id]:
                del user_data[user_id]["pending_skip_buttons"]
            # Проверяем и очищаем waiting_for_input если тип соответствует медиа
            if "waiting_for_input" in user_data[user_id]:
                waiting_config = user_data[user_id]["waiting_for_input"]
                if isinstance(waiting_config, dict) and waiting_config.get("type") in ["photo", "video", "audio", "document"]:
                    del user_data[user_id]["waiting_for_input"]
                # Переходим к целевому узлу
                if skip_target:
                    try:
                        logging.info(f"🚀 Переходим к узлу skipDataCollection медиа: {skip_target}")
                        import types as aiogram_types
                        fake_callback = aiogram_types.SimpleNamespace(
                            id="skip_media_nav",
                            from_user=message.from_user,
                            chat_instance="",
                            data=skip_target,
                            message=message,
                            answer=lambda *args, **kwargs: asyncio.sleep(0)
                        )
                        if skip_target == "start":
                            await handle_callback_start(fake_callback)
                        else:
                            logging.warning(f"Неизвестный целевой узел skipDataCollection медиа: {skip_target}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к узлу skipDataCollection медиа {skip_target}: {e}")
                return
    
    # Проверяем, находится ли пользователь в режиме множественного выбора
    if user_id in user_data and "multi_select_node" in user_data[user_id]:
        node_id = user_data[user_id]["multi_select_node"]
        multi_select_type = user_data[user_id].get("multi_select_type", "selection")
        user_input = message.text
        logging.info(f"🔍 Проверяем режим множественного выбора для пользователя {user_id}: node_id={node_id}, type={multi_select_type}")
        
    # Обработка обычных кнопок (goto) в режиме множественного выбора
    if user_id in user_data and "multi_select_node" in user_data[user_id]:
        node_id = user_data[user_id]["multi_select_node"]
        user_input = message.text
        
    
    # Если пользователь не находится в режиме множественного выбора, продолжаем стандартную обработку
    # Проверяем, ожидаем ли мы текстовый ввод от пользователя (универсальная система)
    has_waiting_state = user_id in user_data and "waiting_for_input" in user_data[user_id]
    logging.info(f"DEBUG: Получен текст {message.text}, состояние ожидания: {has_waiting_state}")
    if user_id in user_data and "waiting_for_input" in user_data[user_id]:
        # Обрабатываем ввод через универсальную систему
        waiting_config = user_data[user_id]["waiting_for_input"]
        
        # Проверяем, что пользователь все еще находится в состоянии ожидания ввода
        if not waiting_config:
            return  # Состояние ожидания пустое, игнорируем
        
        
        # Получаем переменные из базы данных (user_ids_list, user_ids_count)
        # generateDatabaseVariablesCode будет вызван отдельно
        # ┌─────────────────────────────────────────┐
        # │    Переменные из базы данных (user_ids) │
        # └─────────────────────────────────────────┘
        # Инициализируем user_vars если не определён
        # Код сгенерирован в generateDatabaseVariables.ts
        if "user_vars" not in locals():
            user_vars = {}
        # Получаем список всех ID из базы user_ids
        try:
            async with db_pool.acquire() as conn:
                rows = await conn.fetch(
                    "SELECT user_id FROM user_ids ORDER BY created_at DESC"
                )
                # Формируем список ID в столбик
                user_ids_list = "\n".join(str(row["user_id"]) for row in rows)
                # Количество ID
                user_ids_count = len(rows)
                logging.info(f"✅ Получено {user_ids_count} ID из базы user_ids")
        except Exception as e:
            logging.error(f"❌ Ошибка получения ID из базы: {e}")
            user_ids_list = "нет ID"
            user_ids_count = 0
            
        # Добавляем переменные базы данных в user_vars
        user_vars["user_ids_list"] = user_ids_list
        user_vars["user_ids_count"] = user_ids_count
        logging.info(f"🔧 Переменные базы данных добавлены в user_vars: user_ids_list={user_ids_list[:100] if len(user_ids_list) > 100 else user_ids_list}, user_ids_count={user_ids_count}")        
        # Проверяем формат конфигурации - новый (словарь) или старый (строка)
        if isinstance(waiting_config, dict):
            # Новый формат - извлекаем данные из словаря
            waiting_node_id = waiting_config.get("node_id")
            input_type = waiting_config.get("type", "text")
            variable_name = waiting_config.get("variable", "user_response")
            save_to_database = waiting_config.get("save_to_database", False)
            min_length = waiting_config.get("min_length", 0)
            max_length = waiting_config.get("max_length", 0)
            next_node_id = waiting_config.get("next_node_id")
                
            # ИСПРАВЛЕНИЕ: Проверяем, является ли тип ввода медиа (фото, видео, аудио, документ)
            # Если да, то текстовый обработчик не должен его обрабатывать
            if input_type in ["photo", "video", "audio", "document"]:
                logging.info(f"Текстовый ввод от пользователя {user_id} проигнорирован - ожидается медиа ({input_type})")
                return
        else:
            # Старый формат - waiting_config это строка с node_id
            waiting_node_id = waiting_config
            input_type = user_data[user_id].get("input_type", "text")
            variable_name = user_data[user_id].get("input_variable", "user_response")
            save_to_database = user_data[user_id].get("save_to_database", False)
            min_length = 0
            max_length = 0
            next_node_id = user_data[user_id].get("waiting_input_target_node_id") or user_data[user_id].get("input_target_node_id")
        
        user_text = message.text
        
        # ИСПРАВЛЕНИЕ: Проверяем, является ли текст кнопкой с skipDataCollection=true
        if isinstance(waiting_config, dict):
            skip_buttons = waiting_config.get("skip_buttons", [])
            for skip_btn in skip_buttons:
                if skip_btn.get("text") == user_text:
                    skip_target = skip_btn.get("target")
                    logging.info(f"⏭️ Нажата кнопка skipDataCollection в waiting_for_input: {user_text} -> {skip_target}")
                    # Очищаем состояние ожидания
                    if "waiting_for_input" in user_data[user_id]:
                        del user_data[user_id]["waiting_for_input"]
            # Переходим к целевому узлу
            if skip_target:
                try:
                    logging.info(f"🚀 Переходим к узлу skipDataCollection: {skip_target}")
                    import types as aiogram_types
                    fake_callback = aiogram_types.SimpleNamespace(
                        id="skip_button_nav",
                        from_user=message.from_user,
                        chat_instance="",
                        data=skip_target,
                        message=message,
                        answer=lambda *args, **kwargs: asyncio.sleep(0)
                    )
                            if skip_target == "start":
                                await handle_callback_start(fake_callback)
                            else:
                                logging.warning(f"Неизвестный целевой узел skipDataCollection: {skip_target}")
                        except Exception as e:
                            logging.error(f"Ошибка при переходе к узлу skipDataCollection {skip_target}: {e}")
                    return
        
        # Валидация для нового формата
        if isinstance(waiting_config, dict):
            # Валидация длины
            if min_length > 0 and len(user_text) < min_length:
                retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")
                await message.answer(f"❌ Слишком короткий ответ (минимум {min_length} символов). {retry_message}")
                return
            if max_length > 0 and len(user_text) > max_length:
                retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")
                await message.answer(f"❌ Слишком длинный ответ (максимум {max_length} символов). {retry_message}")
                return
                
            # Валидация типа ввода
            if input_type == "email":
                import re
                email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                if not re.match(email_pattern, user_text):
                    retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")
                    await message.answer(f"❌ Неверный формат email. {retry_message}")
                    return
            elif input_type == "number":
                try:
                    float(user_text)
                except ValueError:
                    retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")
                    await message.answer(f"❌ Введите корректное число. {retry_message}")
                    return
            elif input_type == "phone":
                import re
                phone_pattern = r"^[+]?[0-9\s\-\(\)]{10,}$"
                if not re.match(phone_pattern, user_text):
                    retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")
                    await message.answer(f"❌ Неверный формат телефона. {retry_message}")
                    return
            # Сохраняем ответ для нового формата
            timestamp = get_moscow_time()
            response_data = user_text
                
            # Сохраняем в пользовательские данные
            user_data[user_id][variable_name] = response_data
                
            # Сохраняем в базу данных если включено
            if save_to_database:
                saved_to_db = await update_user_data_in_db(user_id, variable_name, response_data)
                if saved_to_db:
                    logging.info(f"✅ Данные сохранены в БД: {variable_name} = {user_text} (пользователь {user_id})")
                else:
                    logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            # Сохранение ID в таблицу user_ids для рассылки
            if waiting_node_id == "BMsBsZJr-pWxjMB_rl33z":  # Узел добавления ID
                try:
                    async with db_pool.acquire() as conn:
                        await conn.execute(
                            """
                            INSERT INTO user_ids (user_id, source)
                            VALUES ($1, $2)
                            ON CONFLICT (user_id) DO NOTHING
                            """,
                            int(user_text),
                            'bot'
                        )
                        logging.info(f"✅ ID {user_text} вставлен в таблицу user_ids")
                except ValueError:
                    logging.error(f"❌ Ошибка: введённое значение не является числом: {user_text}")
                except Exception as e:
                    logging.error(f"❌ Ошибка сохранения ID в базу: {e}")
            # Сохранение ID в CSV файл для рассылки
            try:
                import os
                # Путь к файлу CSV в папке проекта
                csv_file = os.path.join(PROJECT_DIR, 'user_ids.csv')
                # Проверяем, есть ли уже такой ID в файле
                id_exists = False
                if os.path.exists(csv_file):
                    with open(csv_file, 'r', encoding='utf-8') as f:
                        existing_ids = [line.strip() for line in f if line.strip()]
                        if str(user_text).strip() in existing_ids:
                            id_exists = True
                            logging.info(f"⚠️ ID {user_text} уже есть в CSV, пропускаем")
                # Записываем ID в файл (один ID в строке)
                if not id_exists:
                    with open(csv_file, 'a', encoding='utf-8') as f:
                        f.write(f"{user_text}\n")
                    logging.info(f"✅ ID {user_text} записан в CSV файл: {csv_file}")
            except Exception as e:
                logging.error(f"❌ Ошибка записи в CSV: {e}")
            # Отправляем подтверждающее сообщение только если оно задано
            success_message = waiting_config.get("success_message", "")
            if success_message:
                logging.info(f"DEBUG: Отправляем подтверждение с текстом: {success_message}")
                await message.answer(success_message)
                logging.info(f"✅ Отправлено подтверждение: {success_message}")
            # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Очищаем старое состояние ожидания перед навигацией
            if "waiting_for_input" in user_data[user_id]:
                del user_data[user_id]["waiting_for_input"]
                
            logging.info(f"✅ Переход к следующему узлу выполнен успешно")
            logging.info(f"Получен пользовательский ввод: {variable_name} = {user_text}")
            # Навигация к следующему узлу для нового формата
            if next_node_id:
                try:
                    # Цикл для поддержки автопереходов
                    while next_node_id:
                        logging.info(f"🚀 Переходим к узлу: {next_node_id}")
                        current_node_id = next_node_id
                        next_node_id = None  # Сбрасываем, будет установлен при автопереходе
                        # Проверяем навигацию к узлам
                        if current_node_id == "start":
                            logging.info(f"Переход к узлу start типа start")
                            break  # Выходим из цикла для неизвестного типа узла
                except Exception as e:
                    logging.error(f"Ошибка при переходе к узлу: {e}")
            
            return  # Завершаем обработку для нового формата
        
        # Обработка старого формата (для совместимости)
        # Находим узел для получения настроек
        logging.info(f"DEBUG old format: checking inputNodes: ")
        logging.info(f"DEBUG: waiting_node_id = {waiting_node_id}")
        logging.info(f"DEBUG: waiting_config = {waiting_config}")


# Запуск бота
async def main():
    global db_pool
    
    # Обработчик сигналов для корректного завершения
    def signal_handler(signum, frame):
        print(f"⚠️ Получен сигнал {signum}, начинаем корректное завершение...")
        import sys
        sys.exit(0)
    
    # Регистрируем обработчики сигналов
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    
    try:
        
        print("🚀 Бот запущен и готов к работе!")
        await dp.start_polling(bot)
    except KeyboardInterrupt:
        print("⚠️ Получен сигнал остановки, завершаем работу...")
    except SystemExit:
        print("⚠️ Системное завершение, завершаем работу...")
    except Exception as e:
        logging.error(f"Ошибка: {e}")
    finally:
        # Закрытие соединений при выходе
        
        # Закрываем сессию бота
        await bot.session.close()


# Точка входа для запуска бота
if __name__ == "__main__":
    asyncio.run(main())

