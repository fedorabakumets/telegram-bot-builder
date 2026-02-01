"""
Новый бот 2 - Telegram Bot
Сгенерировано с помощью TelegramBot Builder

Команды для @BotFather:
start - Запустить бота
settings - Настройки бота"""

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
import locale
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command
from aiogram.exceptions import TelegramBadRequest
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, BotCommand, ReplyKeyboardRemove, URLInputFile, FSInputFile
from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder
from aiogram.enums import ParseMode
from typing import Optional
import asyncpg
from datetime import datetime, timezone, timedelta
import json
import aiohttp
from aiohttp import TCPConnector

# Safe helper for editing messages with fallback to new message
async def safe_edit_or_send(cbq, text, node_id=None, is_auto_transition=False, **kwargs):
    """
    Безопасное редактирование сообщения с fallback на новое сообщение
    При автопереходе сразу отправляет новое сообщение без попытки редактирования
    """
    result = None
    user_id = None
    
    # Получаем user_id для сохранения
    if hasattr(cbq, "from_user") and cbq.from_user:
        user_id = str(cbq.from_user.id)
    elif hasattr(cbq, "message") and cbq.message and hasattr(cbq.message, "chat"):
        user_id = str(cbq.message.chat.id)
    
    try:
        # При автопереходе сразу отправляем новое сообщение без редактирования
        if is_auto_transition:
            logging.info(f"⚡ Автопереход: отправляем новое сообщение вместо редактирования")
            if hasattr(cbq, "message") and cbq.message:
                result = await cbq.message.answer(text, **kwargs)
            else:
                raise Exception("Cannot send message in auto-transition")
        else:
            # Пробуем редактировать сообщение
            if hasattr(cbq, "edit_text") and callable(getattr(cbq, "edit_text")):
                result = await cbq.edit_text(text, **kwargs)
            elif (hasattr(cbq, "message") and cbq.message):
                result = await cbq.message.edit_text(text, **kwargs)
            else:
                raise Exception("No valid edit method found")
    except Exception as e:
        # При любой ошибке отправляем новое сообщение
        if is_auto_transition:
            logging.info(f"⚡ Автопереход: {e}, отправляем новое сообщение")
        else:
            logging.warning(f"Не удалось отредактировать сообщение: {e}, отправляем новое")
        if hasattr(cbq, "message") and cbq.message:
            result = await cbq.message.answer(text, **kwargs)
        else:
            logging.error("Не удалось ни отредактировать, ни отправить новое сообщение")
            raise
    
    # Сохраняем сообщение в базу данных
    if result and user_id:
        message_data_obj = {"message_id": result.message_id if hasattr(result, "message_id") else None}
        
        # Извлекаем кнопки из reply_markup
        if "reply_markup" in kwargs:
            try:
                reply_markup = kwargs["reply_markup"]
                buttons_data = []
                # Обработка inline клавиатуры
                if hasattr(reply_markup, "inline_keyboard"):
                    for row in reply_markup.inline_keyboard:
                        for btn in row:
                            button_info = {"text": btn.text}
                            if hasattr(btn, "url") and btn.url:
                                button_info["url"] = btn.url
                            if hasattr(btn, "callback_data") and btn.callback_data:
                                button_info["callback_data"] = btn.callback_data
                            buttons_data.append(button_info)
                    if buttons_data:
                        message_data_obj["buttons"] = buttons_data
                        message_data_obj["keyboard_type"] = "inline"
                # Обработка reply клавиатуры
                elif hasattr(reply_markup, "keyboard"):
                    for row in reply_markup.keyboard:
                        for btn in row:
                            button_info = {"text": btn.text}
                            if hasattr(btn, "request_contact") and btn.request_contact:
                                button_info["request_contact"] = True
                            if hasattr(btn, "request_location") and btn.request_location:
                                button_info["request_location"] = True
                            buttons_data.append(button_info)
                    if buttons_data:
                        message_data_obj["buttons"] = buttons_data
                        message_data_obj["keyboard_type"] = "reply"
            except Exception as btn_error:
                logging.warning(f"Не удалось извлечь кнопки в safe_edit_or_send: {btn_error}")
        
        await save_message_to_api(
            user_id=user_id,
            message_type="bot",
            message_text=text,
            node_id=node_id,
            message_data=message_data_obj
        )
    
    return result

# Токен вашего бота (получите у @BotFather)
BOT_TOKEN = "7713154819:AAGtj0O7RFLMM1rRhQhFJoWT9JikU5GiRoQ"

# Настройка логирования с поддержкой UTF-8
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

# Создание бота и диспетчера
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# Список администраторов (добавьте свой Telegram ID)
ADMIN_IDS = [123456789]  # Замените на реальные ID администраторов

# API configuration для сохранения сообщений
# Определяем URL сервера автоматически
def get_api_base_url():
    # Сначала пробуем получить из переменных окружения
    env_url = os.getenv("API_BASE_URL", os.getenv("REPLIT_DEV_DOMAIN"))
    if env_url:
        # Если URL начинается с http/https, используем как есть
        if env_url.startswith(("http://", "https://")):
            # ИСПРАВЛЕНИЕ: Для локальных адресов всегда используем http, а не https
            if "localhost" in env_url or "127.0.0.1" in env_url or "0.0.0.0" in env_url:
                if env_url.startswith("https://"):
                    # Заменяем https на http для локальных адресов
                    env_url = "http://" + env_url[8:]  # Убираем "https://" и добавляем "http://"
            return env_url
        # Если нет, добавляем протокол
        elif ":" in env_url:  # содержит порт
            return f"http://{env_url}"
        else:  # домен без порта
            return f"https://{env_url}"
    
    # Пытаемся определить URL автоматически
    try:
        import socket
        # Получаем IP-адрес машины
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        
        # Определяем порт из переменной окружения или используем 5000 по умолчанию
        port = os.getenv("API_PORT", "5000")
        
        # Проверяем, является ли IP локальным
        if local_ip.startswith(("127.", "192.168.", "10.", "172.")) or local_ip == "::1":
            # Для локальных IP используем localhost
            return f"http://localhost:{port}"
        else:
            # Для внешних IP используем IP-адрес
            return f"http://{local_ip}:{port}"
    except:
        # Если не удалось определить автоматически, используем localhost с портом из переменной окружения
        port = os.getenv("API_PORT", "5000")
        return f"http://localhost:{port}"

API_BASE_URL = get_api_base_url()
logging.info(f"📡 API Base URL определён как: {API_BASE_URL}")
PROJECT_ID = int(os.getenv("PROJECT_ID", 7))  # ID проекта в системе

# Функция для сохранения сообщений в базу данных через API
async def save_message_to_api(user_id: str, message_type: str, message_text: str = None, node_id: str = None, message_data: dict = None):
    """Сохраняет сообщение в базу данных через API"""
    try:
        # Формируем полный URL для API
        if API_BASE_URL.startswith("http"):
            api_url = f"{API_BASE_URL}/api/projects/{PROJECT_ID}/messages"
        else:
            api_url = f"https://{API_BASE_URL}/api/projects/{PROJECT_ID}/messages"
        
        payload = {
            "userId": str(user_id),
            "messageType": message_type,
            "messageText": message_text,
            "nodeId": node_id,
            "messageData": message_data or {}
        }
        
        logging.debug(f"💾 Отправка сообщения в API: {payload}")
        logging.debug(f"📡 API URL: {api_url}")
        
        # Определяем, использовать ли SSL
        use_ssl = not (api_url.startswith("http://") or "localhost" in api_url or "127.0.0.1" in api_url or "0.0.0.0" in api_url)
        logging.debug(f"🔒 SSL требуется для URL {api_url}: {use_ssl}")
        # ИСПРАВЛЕНИЕ: Для localhost всегда используем ssl=False, чтобы избежать ошибки SSL WRONG_VERSION_NUMBER
        if "localhost" in api_url or "127.0.0.1" in api_url or "0.0.0.0" in api_url:
            use_ssl = False
            logging.debug(f"🔓 SSL принудительно отключен для локального URL: {api_url}")
        
        if use_ssl:
            # Для внешних соединений используем SSL-контекст
            connector = aiohttp.TCPConnector(ssl=True)
        else:
            # Для локальных соединений не используем SSL-контекст
            # Явно отключаем SSL и устанавливаем настройки для небезопасного соединения
            import ssl
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            connector = aiohttp.TCPConnector(ssl=ssl_context)
        
        async with aiohttp.ClientSession(connector=connector) as session:
            async with session.post(api_url, json=payload, timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status == 200:
                    logging.info(f"✅ Сообщение сохранено: {message_type} от {user_id}")
                    response_data = await response.json()
                    return response_data.get("data")  # Возвращаем сохраненное сообщение с id
                elif response.status == 429:
                    logging.warning(f"⚠️ Слишком много запросов при попытке сохранить сообщение: {user_id}, {message_type}")
                    return None
                else:
                    error_text = await response.text()
                    logging.error(f"❌ Не удалось сохранить сообщение: {response.status} - {error_text}")
                    logging.error(f"Отправленный payload: {payload}")
                    return None
    except aiohttp.ClientConnectorError as e:
        logging.error(f"Ошибка подключения к API: {e}")
    except asyncio.TimeoutError as e:
        logging.error(f"Таймаут при обращении к API: {e}")
    except Exception as e:
        logging.error(f"Неизвестная ошибка при сохранении сообщения: {type(e).__name__}: {e}")
    return None

# Middleware для сохранения входящих сообщений
async def message_logging_middleware(handler, event: types.Message, data: dict):
    """Middleware для автоматического сохранения входящих сообщений от пользователей"""
    try:
        # Сохраняем входящее сообщение от пользователя
        user_id = str(event.from_user.id)
        message_text = event.text or event.caption or "[медиа]"
        message_data = {"message_id": event.message_id}
        
        # Проверяем наличие фото
        photo_file_id = None
        if event.photo:
            # Берем фото наибольшего размера (последнее в списке)
            largest_photo = event.photo[-1]
            photo_file_id = largest_photo.file_id
            message_data["photo"] = {
                "file_id": largest_photo.file_id,
                "file_unique_id": largest_photo.file_unique_id,
                "width": largest_photo.width,
                "height": largest_photo.height,
                "file_size": largest_photo.file_size if hasattr(largest_photo, "file_size") else None
            }
            if not message_text or message_text == "[медиа]":
                message_text = "[Фото]"
        
        # Сохраняем сообщение в базу данных
        saved_message = await save_message_to_api(
            user_id=user_id,
            message_type="user",
            message_text=message_text,
            message_data=message_data
        )
        
        # Если есть фото и сообщение сохранено, регистрируем медиа
        if photo_file_id and saved_message and "id" in saved_message:
            try:
                if API_BASE_URL.startswith("http://") or API_BASE_URL.startswith("https://"):
                    media_api_url = f"{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-photo"
                else:
                    media_api_url = f"https://{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-photo"
                
                media_payload = {
                    "messageId": saved_message["id"],
                    "fileId": photo_file_id,
                    "botToken": BOT_TOKEN,
                    "mediaType": "photo"
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
                    connector = aiohttp.TCPConnector(ssl=True)
                else:
                    # Для локальных соединений не используем SSL-контекст
                    # Явно отключаем SSL и устанавливаем настройки для небезопасного соединения
                    import ssl
                    ssl_context = ssl.create_default_context()
                    ssl_context.check_hostname = False
                    ssl_context.verify_mode = ssl.CERT_NONE
                    connector = aiohttp.TCPConnector(ssl=ssl_context)
                
                async with aiohttp.ClientSession(connector=connector) as session:
                    async with session.post(media_api_url, json=media_payload, timeout=aiohttp.ClientTimeout(total=10)) as response:
                        if response.status == 200:
                            message_id = saved_message.get("id")
                            logging.info(f"✅ Медиа зарегистрировано для сообщения {message_id}")
                        else:
                            error_text = await response.text()
                            logging.warning(f"⚠️ Не удалось зарегистрировать медиа: {response.status} - {error_text}")
            except Exception as media_error:
                logging.warning(f"Ошибка при регистрации медиа: {media_error}")
    except Exception as e:
        logging.error(f"Ошибка в middleware сохранения сообщений: {e}")
    
    # Продолжаем обработку сообщения
    return await handler(event, data)

# Обертка для сохранения исходящих сообщений
original_send_message = bot.send_message
async def send_message_with_logging(chat_id, text, *args, node_id=None, **kwargs):
    """Обертка для bot.send_message с автоматическим сохранением"""
    result = await original_send_message(chat_id, text, *args, **kwargs)
    
    # Извлекаем информацию о кнопках из reply_markup
    message_data_obj = {"message_id": result.message_id if result else None}
    if "reply_markup" in kwargs:
        try:
            reply_markup = kwargs["reply_markup"]
            buttons_data = []
            # Обработка inline клавиатуры
            if hasattr(reply_markup, "inline_keyboard"):
                for row in reply_markup.inline_keyboard:
                    for btn in row:
                        button_info = {"text": btn.text}
                        if hasattr(btn, "url") and btn.url:
                            button_info["url"] = btn.url
                        if hasattr(btn, "callback_data") and btn.callback_data:
                            button_info["callback_data"] = btn.callback_data
                        buttons_data.append(button_info)
                if buttons_data:
                    message_data_obj["buttons"] = buttons_data
                    message_data_obj["keyboard_type"] = "inline"
            # Обработка reply клавиатуры
            elif hasattr(reply_markup, "keyboard"):
                for row in reply_markup.keyboard:
                    for btn in row:
                        button_info = {"text": btn.text}
                        if hasattr(btn, "request_contact") and btn.request_contact:
                            button_info["request_contact"] = True
                        if hasattr(btn, "request_location") and btn.request_location:
                            button_info["request_location"] = True
                        buttons_data.append(button_info)
                if buttons_data:
                    message_data_obj["buttons"] = buttons_data
                    message_data_obj["keyboard_type"] = "reply"
        except Exception as e:
            logging.warning(f"Не удалось извлечь кнопки: {e}")
    
    # Сохраняем синхронно для гарантии доставки
    await save_message_to_api(
        user_id=str(chat_id),
        message_type="bot",
        message_text=text,
        node_id=node_id,
        message_data=message_data_obj
    )
    return result

bot.send_message = send_message_with_logging

# Обертка для message.answer с сохранением
original_answer = types.Message.answer
async def answer_with_logging(self, text, *args, node_id=None, **kwargs):
    """Обертка для message.answer с автоматическим сохранением"""
    result = await original_answer(self, text, *args, **kwargs)
    
    # Извлекаем информацию о кнопках из reply_markup
    message_data_obj = {"message_id": result.message_id if result else None}
    if "reply_markup" in kwargs:
        try:
            reply_markup = kwargs["reply_markup"]
            buttons_data = []
            # Обработка inline клавиатуры
            if hasattr(reply_markup, "inline_keyboard"):
                for row in reply_markup.inline_keyboard:
                    for btn in row:
                        button_info = {"text": btn.text}
                        if hasattr(btn, "url") and btn.url:
                            button_info["url"] = btn.url
                        if hasattr(btn, "callback_data") and btn.callback_data:
                            button_info["callback_data"] = btn.callback_data
                        buttons_data.append(button_info)
                if buttons_data:
                    message_data_obj["buttons"] = buttons_data
                    message_data_obj["keyboard_type"] = "inline"
            # Обработка reply клавиатуры
            elif hasattr(reply_markup, "keyboard"):
                for row in reply_markup.keyboard:
                    for btn in row:
                        button_info = {"text": btn.text}
                        if hasattr(btn, "request_contact") and btn.request_contact:
                            button_info["request_contact"] = True
                        if hasattr(btn, "request_location") and btn.request_location:
                            button_info["request_location"] = True
                        buttons_data.append(button_info)
                if buttons_data:
                    message_data_obj["buttons"] = buttons_data
                    message_data_obj["keyboard_type"] = "reply"
        except Exception as e:
            logging.warning(f"Не удалось извлечь кнопки: {e}")
    
    # Сохраняем синхронно для гарантии доставки
    await save_message_to_api(
        user_id=str(self.chat.id),
        message_type="bot",
        message_text=text if isinstance(text, str) else str(text),
        node_id=node_id,
        message_data=message_data_obj
    )
    return result

types.Message.answer = answer_with_logging

# Обертка для bot.send_photo с сохранением
original_send_photo = bot.send_photo
async def send_photo_with_logging(chat_id, photo, *args, caption=None, node_id=None, **kwargs):
    """Обертка для bot.send_photo с автоматическим сохранением"""
    result = await original_send_photo(chat_id, photo, *args, caption=caption, **kwargs)
    
    # Создаем message_data с информацией о фото
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
    # Если photo это строка (URL), сохраняем URL
    elif isinstance(photo, str):
        message_data_obj["photo_url"] = photo
    
    # Извлекаем информацию о кнопках из reply_markup
    if "reply_markup" in kwargs:
        try:
            reply_markup = kwargs["reply_markup"]
            buttons_data = []
            if hasattr(reply_markup, "inline_keyboard"):
                for row in reply_markup.inline_keyboard:
                    for btn in row:
                        button_info = {"text": btn.text}
                        if hasattr(btn, "url") and btn.url:
                            button_info["url"] = btn.url
                        if hasattr(btn, "callback_data") and btn.callback_data:
                            button_info["callback_data"] = btn.callback_data
                        buttons_data.append(button_info)
                if buttons_data:
                    message_data_obj["buttons"] = buttons_data
                    message_data_obj["keyboard_type"] = "inline"
        except Exception as e:
            logging.warning(f"Не удалось извлечь кнопки из send_photo: {e}")
    
    # Сохраняем сообщение в базу данных
    saved_message = await save_message_to_api(
        user_id=str(chat_id),
        message_type="bot",
        message_text=caption or "[Фото]",
        node_id=node_id,
        message_data=message_data_obj
    )
    
    # Если фото отправлено от бота с file_id, регистрируем медиа
    if result and hasattr(result, "photo") and result.photo and saved_message and "id" in saved_message:
        try:
            largest_photo = result.photo[-1]
            if API_BASE_URL.startswith("http://") or API_BASE_URL.startswith("https://"):
                media_api_url = f"{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-photo"
            else:
                media_api_url = f"https://{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-photo"
            
            media_payload = {
                "messageId": saved_message["id"],
                "fileId": largest_photo.file_id,
                "botToken": BOT_TOKEN,
                "mediaType": "photo"
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
                connector = aiohttp.TCPConnector(ssl=True)
            else:
                # Для локальных соединений не используем SSL-контекст
                # Явно отключаем SSL и устанавливаем настройки для небезопасного соединения
                import ssl
                ssl_context = ssl.create_default_context()
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE
                connector = aiohttp.TCPConnector(ssl=ssl_context)
            
            async with aiohttp.ClientSession(connector=connector) as session:
                async with session.post(media_api_url, json=media_payload, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status == 200:
                        bot_message_id = saved_message.get("id")
                        logging.info(f"✅ Медиа бота зарегистрировано для сообщения {bot_message_id}")
                    else:
                        error_text = await response.text()
                        logging.warning(f"⚠️ Не удалось зарегистрировать медиа бота: {response.status} - {error_text}")
        except Exception as media_error:
            logging.warning(f"Ошибка при регистрации медиа бота: {media_error}")
    
    return result

bot.send_photo = send_photo_with_logging

# Хранилище пользователей (временное состояние)
user_data = {}

# Настройки базы данных
DATABASE_URL = os.getenv("DATABASE_URL")

# Пул соединений с базой данных
db_pool = None


# Функции для работы с базой данных
async def init_database():
    """Инициализация подключения к базе данных и создание таблиц"""
    global db_pool
    try:
        db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10)
        # Создаем таблицу пользователей если её нет
        async with db_pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS bot_users (
                    user_id BIGINT PRIMARY KEY,
                    username TEXT,
                    first_name TEXT,
                    last_name TEXT,
                    registered_at TIMESTAMP DEFAULT NOW(),
                    last_interaction TIMESTAMP DEFAULT NOW(),
                    interaction_count INTEGER DEFAULT 0,
                    user_data JSONB DEFAULT '{}',
                    is_active BOOLEAN DEFAULT TRUE
                );
            """)
            # Создаем таблицу сообщений если её нет
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS bot_messages (
                    id SERIAL PRIMARY KEY,
                    project_id INTEGER,
                    user_id TEXT NOT NULL,
                    message_type TEXT NOT NULL,
                    message_text TEXT,
                    message_data JSONB,
                    node_id TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """)
        logging.info("✅ База данных инициализирована")
    except Exception as e:
        logging.warning(f"⚠️ Не удалось подключиться к БД: {e}. Используем локальное хранилище.")
        db_pool = None

def get_moscow_time():
    """Возвращает текущее время в московском часовом поясе"""
    from datetime import datetime, timezone, timedelta
    moscow_tz = timezone(timedelta(hours=3))
    return datetime.now(moscow_tz).isoformat()

def replace_variables_in_text(text_content, variables_dict):
    """Заменяет переменные формата {variable_name} в тексте на их значения
    
    Args:
        text_content (str): Текст с переменными для замены
        variables_dict (dict): Словарь переменных пользователя
    
    Returns:
        str: Текст с замененными переменными
    """
    if not text_content or not variables_dict:
        return text_content
    
    # Проходим по всем переменным пользователя
    for var_name, var_data in variables_dict.items():
        placeholder = "{" + var_name + "}"
        if placeholder in text_content:
            # Извлекаем значение переменной
            if isinstance(var_data, dict) and "value" in var_data:
                var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
            elif var_data is not None:
                var_value = str(var_data)
            else:
                var_value = var_name  # Показываем имя переменной если значения нет
            
            # Заменяем переменную на значение
            text_content = text_content.replace(placeholder, var_value)
            logging.debug(f"🔄 Заменена переменная {placeholder} на '{var_value}'")
    
    return text_content
def init_user_variables(user_id, user_obj):
    """Инициализирует базовые переменные пользователя из Telegram API
    
    Args:
        user_id (int): ID пользователя Telegram
        user_obj: Объект пользователя из aiogram (message.from_user или callback_query.from_user)
    
    Returns:
        str: Имя пользователя для отображения (приоритет: first_name > username > "Пользователь")
    """
    # Инициализируем пользовательские данные если их нет
    if user_id not in user_data:
        user_data[user_id] = {}
    
    # Безопасно извлекаем данные из Telegram API
    username = user_obj.username if hasattr(user_obj, "username") else None
    first_name = user_obj.first_name if hasattr(user_obj, "first_name") else None
    last_name = user_obj.last_name if hasattr(user_obj, "last_name") else None
    
    # Определяем отображаемое имя по приоритету
    user_name = first_name or username or "Пользователь"
    
    # Сохраняем все переменные в пользовательские данные
    user_data[user_id]["user_name"] = user_name
    user_data[user_id]["first_name"] = first_name
    user_data[user_id]["last_name"] = last_name
    user_data[user_id]["username"] = username
    
    # Логируем инициализацию для отладки
    logging.info(f"✅ Инициализированы переменные пользователя {user_id}: user_name='{user_name}', first_name='{first_name}', username='{username}'")
    
    return user_name
async def save_user_to_db(user_id: int, username: Optional[str] = None, first_name: Optional[str] = None, last_name: Optional[str] = None):
    """Сохраняет пользователя в базу данных"""
    if not db_pool:
        return False
    try:
        async with db_pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO bot_users (user_id, username, first_name, last_name)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (user_id) DO UPDATE SET
                    username = EXCLUDED.username,
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    last_interaction = NOW(),
                    interaction_count = bot_users.interaction_count + 1
            """, user_id, username, first_name, last_name)
        return True
    except Exception as e:
        logging.error(f"Ошибка сохранения пользователя в БД: {e}")
        return False

async def get_user_from_db(user_id: int):
    """Получает данные пользователя из базы данных"""
    if not db_pool:
        return None
    try:
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM bot_users WHERE user_id = $1", user_id)
            if row:
                # Преобразуем Record в словарь
                row_dict = {key: row[key] for key in row.keys()}
                # Если есть user_data, возвращаем его содержимое
                if "user_data" in row_dict and row_dict["user_data"]:
                    user_data = row_dict["user_data"]
                    if isinstance(user_data, str):
                        try:
                            import json
                            return json.loads(user_data)
                        except (json.JSONDecodeError, TypeError):
                            return {}
                    elif isinstance(user_data, dict):
                        return user_data
                    else:
                        return {}
                # Если нет user_data, возвращаем полную запись
                return row_dict
        return None
    except Exception as e:
        logging.error(f"Ошибка получения пользователя из БД: {e}")
        return None

async def get_user_data_from_db(user_id: int, data_key: str):
    """Получает конкретное значение из поля user_data пользователя"""
    if not db_pool:
        return None
    try:
        async with db_pool.acquire() as conn:
            # Используем оператор ->> для получения значения поля JSONB как текста
            value = await conn.fetchval(
                "SELECT user_data ->> $2 FROM bot_users WHERE user_id = $1",
                user_id,
                data_key
            )
            return value
    except Exception as e:
        logging.error(f"Ошибка получения данных пользователя из БД: {e}")
        return None

# Алиас функции для callback обработчиков
async def handle_command_start(message):
    """Алиас для start_handler, используется в callback обработчиках"""
    await start_handler(message)

async def handle_command_settings(message):
    """Алиас для settings_handler, используется в callback обработчиках"""
    await settings_handler(message)

async def update_user_data_in_db(user_id: int, data_key: str, data_value):
    """Обновляет пользовательские данные в базе данных"""
    if not db_pool:
        return False
    try:
        import json
        async with db_pool.acquire() as conn:
            # Сначала создаём или получаем существующую запись
            await conn.execute("""
                INSERT INTO bot_users (user_id) 
                VALUES ($1) 
                ON CONFLICT (user_id) DO NOTHING
            """, user_id)
            
            # Обновляем данные пользователя
            update_data = {data_key: data_value}
            await conn.execute("""
                UPDATE bot_users 
                SET user_data = COALESCE(user_data, '{}'::jsonb) || $2::jsonb,
                    last_interaction = NOW()
                WHERE user_id = $1
            """, user_id, json.dumps(update_data))
        return True
    except Exception as e:
        logging.error(f"Ошибка обновления данных пользователя: {e}")
        return False

async def save_user_data_to_db(user_id: int, data_key: str, data_value):
    """Алиас для update_user_data_in_db для обратной совместимости"""
    return await update_user_data_in_db(user_id, data_key, data_value)

async def update_user_variable_in_db(user_id: int, variable_name: str, variable_value: str):
    """Сохраняет переменную пользователя в базу данных"""
    if not db_pool:
        return False
    try:
        import json
        async with db_pool.acquire() as conn:
            # Сначала создаём или получаем существующую запись
            await conn.execute("""
                INSERT INTO bot_users (user_id) 
                VALUES ($1) 
                ON CONFLICT (user_id) DO NOTHING
            """, user_id)
            
            # Обновляем переменную пользователя
            update_data = {variable_name: variable_value}
            await conn.execute("""
                UPDATE bot_users 
                SET user_data = COALESCE(user_data, '{}'::jsonb) || $2::jsonb,
                    last_interaction = NOW()
                WHERE user_id = $1
            """, user_id, json.dumps(update_data))
        return True
    except Exception as e:
        logging.error(f"Ошибка сохранения переменной пользователя: {e}")
        return False

async def log_message(user_id: int, message_type: str, message_text: str = None, message_data: dict = None, node_id: str = None):
    """Логирует сообщение в базу данных"""
    if not db_pool:
        return False
    try:
        import json
        async with db_pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO bot_messages (user_id, message_type, message_text, message_data, node_id)
                VALUES ($1, $2, $3, $4, $5)
            """, str(user_id), message_type, message_text, json.dumps(message_data) if message_data else None, node_id)
        return True
    except Exception as e:
        logging.error(f"Ошибка логирования сообщения: {e}")
        return False


# Утилитарные функции
from aiogram import types

async def is_admin(user_id: int) -> bool:
    return user_id in ADMIN_IDS

async def is_private_chat(message: types.Message) -> bool:
    return message.chat.type == "private"

async def check_auth(user_id: int) -> bool:
    # Проверяем наличие пользователя в БД или локальном хранилище
    if db_pool:
        user = await get_user_from_db(user_id)
        return user is not None
    return user_id in user_data


# Настройка меню команд
# Генерируем настройку меню команд для BotFather
async def set_bot_commands():
    commands = [
        # Команда start - Запустить бота
        BotCommand(command="start", description="Запустить бота"),
        # Команда settings - Настройки бота
        BotCommand(command="settings", description="Настройки бота"),
    ]
# Устанавливаем команды для бота
    await bot.set_my_commands(commands)


# @@NODE_START:start@@

@dp.message(CommandStart())
async def start_handler(message: types.Message):

    # Регистрируем пользователя в системе
    user_id = message.from_user.id
    username = message.from_user.username
    first_name = message.from_user.first_name
    last_name = message.from_user.last_name
    
    # Сохраняем пользователя в базу данных
    saved_to_db = await save_user_to_db(user_id, username, first_name, last_name)
    
    # Сохраняем переменные пользователя в базу данных
    user_name = init_user_variables(user_id, message.from_user)
    await update_user_data_in_db(user_id, "user_name", user_name)
    await update_user_data_in_db(user_id, "first_name", first_name)
    await update_user_data_in_db(user_id, "last_name", last_name)
    await update_user_data_in_db(user_id, "username", username)
    
    # Резервное сохранение в локальное хранилище
    if not saved_to_db:
        user_data[user_id] = {
            "username": username,
            "first_name": first_name,
            "last_name": last_name,
            "user_name": user_name,
            "registered_at": message.date
        }
        logging.info(f"Пользователь {user_id} сохранен в локальное хранилище")
    else:
        logging.info(f"Пользователь {user_id} сохранен в базу данных")

    # Сохраняем imageUrl в переменную image_url_start
    user_data[user_id]["image_url_start"] = "https://i.pinimg.com/originals/24/ac/ef/24acef8b3a6a45d7239480bcc4ff0193.jpg"
    await update_user_data_in_db(user_id, "image_url_start", "https://i.pinimg.com/originals/24/ac/ef/24acef8b3a6a45d7239480bcc4ff0193.jpg")
    # Инициализируем базовые переменные пользователя если их нет
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Безопасно проверяем наличие message (для message handlers)
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Безопасно проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user

        if user_obj:
            init_user_variables(user_id, user_obj)
    
    # Подставляем все доступные переменные пользователя в текст
    user_vars = await get_user_from_db(user_id)
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    
    # get_user_from_db теперь возвращает уже обработанные user_data
    if not isinstance(user_vars, dict):
        user_vars = user_data.get(user_id, {})
    text = "Привет! Я ваш новый бот. Нажмите /help для получения помощи."
    # Инициализируем базовые переменные пользователя если их нет
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Безопасно проверяем наличие message (для message handlers)
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Безопасно проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user

        if user_obj:
            init_user_variables(user_id, user_obj)
    
    # Подставляем все доступные переменные пользователя в текст
    user_vars = await get_user_from_db(user_id)
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    
    # get_user_from_db теперь возвращает уже обработанные user_data
    if not isinstance(user_vars, dict):
        user_vars = user_data.get(user_id, {})
    text = replace_variables_in_text(text, user_vars)
    
    has_regular_buttons = False
    has_input_collection = False
    logging.info(f"DEBUG: generateKeyboard для узла start - hasRegularButtons={has_regular_buttons}, hasInputCollection={has_input_collection}, collectUserInput=undefined, enableTextInput=undefined, enablePhotoInput=undefined, enableVideoInput=undefined, enableAudioInput=undefined, enableDocumentInput=undefined")
    # DEBUG: Узел start - hasRegularButtons=False, hasInputCollection=False
    logging.info(f"DEBUG: Узел start обработка кнопок - keyboardType=none, buttons=0")
    await message.answer(text)

    # АВТОПЕРЕХОД: Переходим к следующему узлу автоматически (если collectUserInput!=true)
    logging.info(f"⚡ Автопереход от узла start к узлу DDmAXMnH_Dyd8T7J-wm9S")
    # Создаем временный callback_query объект для вызова обработчика
    from aiogram.types import CallbackQuery
    temp_callback = CallbackQuery(
        id="auto_transition",
        from_user=message.from_user,
        data="DDmAXMnH_Dyd8T7J-wm9S",
        chat_instance=str(message.chat.id),
        message=message
    )
    await handle_callback_DDmAXMnH_Dyd8T7J_wm9S(temp_callback)
    logging.info(f"✅ Автопереход выполнен: start -> DDmAXMnH_Dyd8T7J-wm9S")
# @@NODE_END:start@@

# @@NODE_START:DDmAXMnH_Dyd8T7J-wm9S@@
# @@NODE_END:DDmAXMnH_Dyd8T7J-wm9S@@

# @@NODE_START:2pmaMDNyVr3oVOHL98LwP@@

@dp.message(Command("settings"))
async def settings_handler(message: types.Message):
    logging.info(f"Команда /settings вызвана пользователем {message.from_user.id}")
    # Сохраняем пользователя и статистику использования команд
    user_id = message.from_user.id
    username = message.from_user.username
    first_name = message.from_user.first_name
    last_name = message.from_user.last_name
    
    # Сохраняем пользователя в базу данных
    saved_to_db = await save_user_to_db(user_id, username, first_name, last_name)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, message.from_user)
    await update_user_data_in_db(user_id, "user_name", user_name)
    await update_user_data_in_db(user_id, "first_name", first_name)
    await update_user_data_in_db(user_id, "last_name", last_name)
    await update_user_data_in_db(user_id, "username", username)
    
    # Обновляем статистику команд в БД
    if saved_to_db:
        await update_user_data_in_db(user_id, "command_settings", datetime.now().isoformat())
    
    # Сохранение в локальное хранилище
    # Инициализируем базовые переменные пользователя в локальном хранилище
    user_name = init_user_variables(user_id, message.from_user)
    
    if "commands_used" not in user_data[user_id]:
        user_data[user_id]["commands_used"] = {}
    user_data[user_id]["commands_used"]["/settings"] = user_data[user_id]["commands_used"].get("/settings", 0) + 1

    text = "⚙️ Настройки бота:"
    # Сохраняем documentUrl в переменную document_url_2pmaMDNyVr3oVOHL98LwP
    user_data[user_id]["document_url_2pmaMDNyVr3oVOHL98LwP"] = "​https://img.freepik.com/free-photo/cartoon-style-hugging-day-celebration_23-2151033271.jpg?semt=ais_hybrid&w=740"
    await update_user_data_in_db(user_id, "document_url_2pmaMDNyVr3oVOHL98LwP", "​https://img.freepik.com/free-photo/cartoon-style-hugging-day-celebration_23-2151033271.jpg?semt=ais_hybrid&w=740")
    
    # Инициализируем базовые переменные пользователя если их нет
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Безопасно проверяем наличие message (для message handlers)
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Безопасно проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user

        if user_obj:
            init_user_variables(user_id, user_obj)
    
    # Подставляем все доступные переменные пользователя в текст
    user_vars = await get_user_from_db(user_id)
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    
    # get_user_from_db теперь возвращает уже обработанные user_data
    if not isinstance(user_vars, dict):
        user_vars = user_data.get(user_id, {})
    # Инициализируем базовые переменные пользователя если их нет
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Безопасно проверяем наличие message (для message handlers)
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Безопасно проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user

        if user_obj:
            init_user_variables(user_id, user_obj)
    
    # Подставляем все доступные переменные пользователя в текст
    user_vars = await get_user_from_db(user_id)
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    
    # get_user_from_db теперь возвращает уже обработанные user_data
    if not isinstance(user_vars, dict):
        user_vars = user_data.get(user_id, {})
    text = replace_variables_in_text(text, user_vars)
    
    has_regular_buttons = False
    has_input_collection = False
    logging.info(f"DEBUG: generateKeyboard для узла 2pmaMDNyVr3oVOHL98LwP - hasRegularButtons={has_regular_buttons}, hasInputCollection={has_input_collection}, collectUserInput=undefined, enableTextInput=undefined, enablePhotoInput=undefined, enableVideoInput=undefined, enableAudioInput=undefined, enableDocumentInput=undefined")
    # DEBUG: Узел 2pmaMDNyVr3oVOHL98LwP - hasRegularButtons=False, hasInputCollection=False
    logging.info(f"DEBUG: Узел 2pmaMDNyVr3oVOHL98LwP обработка кнопок - keyboardType=none, buttons=2")
    await message.answer(text, parse_mode=ParseMode.MARKDOWN)
# @@NODE_END:2pmaMDNyVr3oVOHL98LwP@@

# Обработчики автопереходов

@dp.callback_query(lambda c: c.data == "DDmAXMnH_Dyd8T7J-wm9S" or c.data.startswith("DDmAXMnH_Dyd8T7J-wm9S_btn_") or c.data == "done_d8T7J-wm9S")
async def handle_callback_DDmAXMnH_Dyd8T7J_wm9S(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_DDmAXMnH_Dyd8T7J_wm9S для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_DDmAXMnH_Dyd8T7J_wm9S: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла DDmAXMnH_Dyd8T7J-wm9S
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_DDmAXMnH_Dyd8T7J-wm9S"] = False
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла DDmAXMnH_Dyd8T7J-wm9S: false")
    
    # Обрабатываем узел DDmAXMnH_Dyd8T7J-wm9S: DDmAXMnH_Dyd8T7J-wm9S
    text = "Новое сообщение"
    
    # Сохраняем imageUrl в переменную image_url_DDmAXMnH_Dyd8T7J-wm9S
    user_data[user_id]["image_url_DDmAXMnH_Dyd8T7J-wm9S"] = "https://i.pinimg.com/originals/22/ea/6c/22ea6c80800709ebd03e3ba2c0c12499.jpg"
    await update_user_data_in_db(user_id, "image_url_DDmAXMnH_Dyd8T7J-wm9S", "https://i.pinimg.com/originals/22/ea/6c/22ea6c80800709ebd03e3ba2c0c12499.jpg")
    # Инициализируем базовые переменные пользователя если их нет
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Безопасно проверяем наличие message (для message handlers)
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Безопасно проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user

        if user_obj:
            init_user_variables(user_id, user_obj)
    
    # Подставляем все доступные переменные пользователя в текст
    user_vars = await get_user_from_db(user_id)
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    
    # get_user_from_db теперь возвращает уже обработанные user_data
    if not isinstance(user_vars, dict):
        user_vars = user_data.get(user_id, {})
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
    
    # Отправляем сообщение (с проверкой прикрепленного медиа)
    # Проверяем наличие прикрепленного медиа из переменной image_url_DDmAXMnH_Dyd8T7J-wm9S
    attached_media = None
    if user_vars and "image_url_DDmAXMnH_Dyd8T7J-wm9S" in user_vars:
        media_data = user_vars["image_url_DDmAXMnH_Dyd8T7J-wm9S"]
        if isinstance(media_data, dict) and "value" in media_data:
            attached_media = media_data["value"]
        elif isinstance(media_data, str):
            attached_media = media_data
    else:
        # Проверяем, есть ли медиа в переменных пользователя
        user_id = callback_query.from_user.id
        user_node_vars = user_data.get(user_id, {})
        if "image_url_DDmAXMnH_Dyd8T7J-wm9S" in user_node_vars:
            attached_media = user_node_vars["image_url_DDmAXMnH_Dyd8T7J-wm9S"]
    
    # Если медиа найдено, отправляем с медиа, иначе обычное сообщение
    if attached_media and str(attached_media).strip():
        logging.info(f"📎 Отправка photo медиа из переменной image_url_DDmAXMnH_Dyd8T7J-wm9S: {attached_media}")
        try:
            # Заменяем переменные в тексте перед отправкой медиа
            processed_caption = replace_variables_in_text(text, user_vars)
            await bot.send_photo(callback_query.from_user.id, attached_media, caption=processed_caption, reply_markup=keyboard)
        except Exception as e:
            logging.error(f"Ошибка отправки photo: {e}")
            # Fallback на обычное сообщение при ошибке
            await safe_edit_or_send(callback_query, text, node_id="DDmAXMnH_Dyd8T7J-wm9S", reply_markup=keyboard if keyboard is not None else None)
    else:
        # Медиа не найдено, отправляем обычное текстовое сообщение
        logging.info(f"📝 Медиа image_url_DDmAXMnH_Dyd8T7J-wm9S не найдено, отправка текстового сообщения")
        # Заменяем переменные в тексте перед отправкой
        processed_text = replace_variables_in_text(text, user_vars)
        if False:
            # Узел ожидает ввод, не отправляем сообщение
            logging.info(f"ℹ️ Узел DDmAXMnH_Dyd8T7J-wm9S ожидает ввод, пропускаем отправку сообщения")
        else:
            await safe_edit_or_send(callback_query, processed_text, node_id="DDmAXMnH_Dyd8T7J-wm9S", reply_markup=keyboard if keyboard is not None else None)
    # АВТОПЕРЕХОД: Проверяем, есть ли автопереход для этого узла
    # ИСПРАВЛЕНИЕ: НЕ делаем автопереход если была показана условная клавиатура
    user_id = callback_query.from_user.id
    has_conditional_keyboard = user_data.get(user_id, {}).get("_has_conditional_keyboard", False)
    if has_conditional_keyboard:
        logging.info("⏸️ Автопереход ОТЛОЖЕН: показана условная клавиатура - ждём нажатия кнопки")
    elif user_id in user_data and ("waiting_for_input" in user_data[user_id] or "waiting_for_conditional_input" in user_data[user_id]):
        logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем ввод для узла DDmAXMnH_Dyd8T7J-wm9S")
    # ИСПРАВЛЕНИЕ: НЕ делаем автопереход если collectUserInput=true (узел ожидает ввод)
    elif user_id in user_data and user_data[user_id].get("collectUserInput_DDmAXMnH_Dyd8T7J-wm9S", True) == True:
        logging.info(f"ℹ️ Узел DDmAXMnH_Dyd8T7J-wm9S ожидает ввод (collectUserInput=true из user_data), автопереход пропущен")
    else:
        # ⚡ Автопереход к узлу 2pmaMDNyVr3oVOHL98LwP
        logging.info(f"⚡ Автопереход от узла DDmAXMnH_Dyd8T7J-wm9S к узлу 2pmaMDNyVr3oVOHL98LwP")
        await handle_callback_2pmaMDNyVr3oVOHL98LwP(callback_query)
        logging.info(f"✅ Автопереход выполнен: DDmAXMnH_Dyd8T7J-wm9S -> 2pmaMDNyVr3oVOHL98LwP")
        return
    
    user_id = callback_query.from_user.id
    
    
    return

@dp.callback_query(lambda c: c.data == "2pmaMDNyVr3oVOHL98LwP" or c.data.startswith("2pmaMDNyVr3oVOHL98LwP_btn_") or c.data == "done_oVOHL98LwP")
async def handle_callback_2pmaMDNyVr3oVOHL98LwP(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_2pmaMDNyVr3oVOHL98LwP для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_2pmaMDNyVr3oVOHL98LwP: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла 2pmaMDNyVr3oVOHL98LwP
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_2pmaMDNyVr3oVOHL98LwP"] = False
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла 2pmaMDNyVr3oVOHL98LwP: false")
    
    # Обрабатываем узел 2pmaMDNyVr3oVOHL98LwP: 2pmaMDNyVr3oVOHL98LwP
    text = "⚙️ Настройки бота:"
    
    # Сохраняем documentUrl в переменную document_url_2pmaMDNyVr3oVOHL98LwP
    user_data[user_id]["document_url_2pmaMDNyVr3oVOHL98LwP"] = "​https://img.freepik.com/free-photo/cartoon-style-hugging-day-celebration_23-2151033271.jpg?semt=ais_hybrid&w=740"
    await update_user_data_in_db(user_id, "document_url_2pmaMDNyVr3oVOHL98LwP", "​https://img.freepik.com/free-photo/cartoon-style-hugging-day-celebration_23-2151033271.jpg?semt=ais_hybrid&w=740")
    # Инициализируем базовые переменные пользователя если их нет
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Безопасно проверяем наличие message (для message handlers)
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Безопасно проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user

        if user_obj:
            init_user_variables(user_id, user_obj)
    
    # Подставляем все доступные переменные пользователя в текст
    user_vars = await get_user_from_db(user_id)
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    
    # get_user_from_db теперь возвращает уже обработанные user_data
    if not isinstance(user_vars, dict):
        user_vars = user_data.get(user_id, {})
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
    
    # Отправляем сообщение (с проверкой прикрепленного медиа)
    # Проверяем наличие прикрепленного медиа из переменной document_url_2pmaMDNyVr3oVOHL98LwP
    attached_media = None
    if user_vars and "document_url_2pmaMDNyVr3oVOHL98LwP" in user_vars:
        media_data = user_vars["document_url_2pmaMDNyVr3oVOHL98LwP"]
        if isinstance(media_data, dict) and "value" in media_data:
            attached_media = media_data["value"]
        elif isinstance(media_data, str):
            attached_media = media_data
    else:
        # Проверяем, есть ли медиа в переменных пользователя
        user_id = callback_query.from_user.id
        user_node_vars = user_data.get(user_id, {})
        if "document_url_2pmaMDNyVr3oVOHL98LwP" in user_node_vars:
            attached_media = user_node_vars["document_url_2pmaMDNyVr3oVOHL98LwP"]
    
    # Если медиа найдено, отправляем с медиа, иначе обычное сообщение
    if attached_media and str(attached_media).strip():
        logging.info(f"📎 Отправка document медиа из переменной document_url_2pmaMDNyVr3oVOHL98LwP: {attached_media}")
        try:
            # Заменяем переменные в тексте перед отправкой медиа
            processed_caption = replace_variables_in_text(text, user_vars)
            await bot.send_document(callback_query.from_user.id, attached_media, caption=processed_caption, reply_markup=keyboard)
        except Exception as e:
            logging.error(f"Ошибка отправки document: {e}")
            # Fallback на обычное сообщение при ошибке
            await safe_edit_or_send(callback_query, text, node_id="2pmaMDNyVr3oVOHL98LwP", reply_markup=keyboard if keyboard is not None else None)
    else:
        # Медиа не найдено, отправляем обычное текстовое сообщение
        logging.info(f"📝 Медиа document_url_2pmaMDNyVr3oVOHL98LwP не найдено, отправка текстового сообщения")
        # Заменяем переменные в тексте перед отправкой
        processed_text = replace_variables_in_text(text, user_vars)
        if False:
            # Узел ожидает ввод, не отправляем сообщение
            logging.info(f"ℹ️ Узел 2pmaMDNyVr3oVOHL98LwP ожидает ввод, пропускаем отправку сообщения")
        else:
            await safe_edit_or_send(callback_query, processed_text, node_id="2pmaMDNyVr3oVOHL98LwP", reply_markup=keyboard if keyboard is not None else None)
    user_id = callback_query.from_user.id
    
    
    return

# Обработчики для кнопок команд
# Найдено 2 кнопок команд: cmd_language, cmd_notifications

@dp.callback_query(lambda c: c.data == "cmd_language")
async def handle_cmd_language(callback_query: types.CallbackQuery):
    await callback_query.answer()
    logging.info(f"Обработка кнопки команды: cmd_language -> /language (пользователь {callback_query.from_user.id})")
    # Симулияуем выполнение команды /language
    
    # Создаем fake message object для команды
    from types import SimpleNamespace
    fake_message = SimpleNamespace()
    fake_message.from_user = callback_query.from_user
    fake_message.chat = callback_query.message.chat
    fake_message.date = callback_query.message.date
    fake_message.answer = callback_query.message.answer
    fake_message.edit_text = callback_query.message.edit_text
    
    await callback_query.message.edit_text("Команда /language выполнена")
    logging.info(f"Команда /language выполнена через callback кнопку (пользователь {callback_query.from_user.id})")

@dp.callback_query(lambda c: c.data == "cmd_notifications")
async def handle_cmd_notifications(callback_query: types.CallbackQuery):
    await callback_query.answer()
    logging.info(f"Обработка кнопки команды: cmd_notifications -> /notifications (пользователь {callback_query.from_user.id})")
    # Симулияуем выполнение команды /notifications
    
    # Создаем fake message object для команды
    from types import SimpleNamespace
    fake_message = SimpleNamespace()
    fake_message.from_user = callback_query.from_user
    fake_message.chat = callback_query.message.chat
    fake_message.date = callback_query.message.date
    fake_message.answer = callback_query.message.answer
    fake_message.edit_text = callback_query.message.edit_text
    
    await callback_query.message.edit_text("Команда /notifications выполнена")
    logging.info(f"Команда /notifications выполнена через callback кнопку (пользователь {callback_query.from_user.id})")

# Обработчики для групп бота

# Универсальный fallback-обработчик для всех необработанных текстовых сообщений
@dp.message(F.text)
async def fallback_text_handler(message: types.Message):
    """
    Fallback обработчик для всех текстовых сообщений без специфичного обработчика.
    Благодаря middleware, сообщение уже сохранено в БД.
    Этот обработчик просто логирует факт необработанного сообщения.
    """
    logging.info(f"💬 Получено необработанное текстовое сообщение от {message.from_user.id}: {message.text}")
    # Можно отправить ответ пользователю (опционально)
    # await message.answer("Извините, я не понимаю эту команду. Используйте /start для начала.")


# Универсальный обработчик для необработанных фото
@dp.message(F.photo)
async def handle_unhandled_photo(message: types.Message):
    """
    Обрабатывает фотографии, которые не были обработаны другими обработчиками.
    Благодаря middleware, фото уже будет сохранено в БД.
    """
    logging.info(f"📸 Получено фото от пользователя {message.from_user.id}")
    # Middleware автоматически сохранит фото



# Запуск бота
async def main():
    global db_pool
    
    # Обработчик сигналов для корректного завершения
    def signal_handler(signum, frame):
        print(f"🛑 Получен сигнал {signum}, начинаем корректное завершение...")
        raise KeyboardInterrupt()
    
    # Регистрируем обработчики сигналов
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    
    try:
        # Инициализируем базу данных
        await init_database()
        await set_bot_commands()
        
        # Регистрация middleware для сохранения сообщений
        dp.message.middleware(message_logging_middleware)
        
        print("🤖 Бот запущен и готов к работе!")
        await dp.start_polling(bot)
    except KeyboardInterrupt:
        print("🛑 Получен сигнал остановки, завершаем работу...")
    except SystemExit:
        print("🛑 Системное завершение, завершаем работу...")
    except Exception as e:
        logging.error(f"Критическая ошибка: {e}")
    finally:
        # Правильно закрываем все соединения
        if db_pool:
            await db_pool.close()
            print("🔌 Соединение с базой данных закрыто")
        
        # Закрываем сессию бота
        await bot.session.close()
        print("🔌 Сессия бота закрыта")
        print("✅ Бот корректно завершил работу")

        return
    
if __name__ == "__main__":
    asyncio.run(main())
