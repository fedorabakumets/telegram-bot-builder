"""
Новый бот 2 - Telegram Bot
Сгенерировано с помощью TelegramBot Builder

Команды для @BotFather:
start - Приветствие и источник"""

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

# Токен вашего бота (получите у @BotFather)
BOT_TOKEN = "7713154819:AAEpLG7wuSPtzAto90fcxz5z0UN1evvXafE"

# Настройка логирования с поддержкой UTF-8
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

# Подавление всех сообщений от asyncpg
logging.getLogger("asyncpg").setLevel(logging.CRITICAL)

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
PROJECT_ID = int(os.getenv("PROJECT_ID", 15))  # ID проекта в системе

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
        # Команда start - Приветствие и источник
        BotCommand(command="start", description="Приветствие и источник"),
    ]
# Устанавливаем команды для бота
    await bot.set_my_commands(commands)

# Код сгенерирован в generate-node-handlers.ts

# @@NODE_START:start@@

# Код сгенерирован в generateStartHandler.ts

# Код сгенерирован в generate-node-handlers.ts
@dp.message(CommandStart())
# Код сгенерирован в generateStartHandler.ts
# Код сгенерирован в generate-node-handlers.ts
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
# Код сгенерирован в generateStartHandler.ts
# Код сгенерирован в generate-node-handlers.ts
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

    # Инициализируем базовые переменные пользователя если их нет
# Код сгенерирован в generateStartHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Безопасно проверяем наличие message (для message handlers)
# Код сгенерирован в generateStartHandler.ts
# Код сгенерирован в generate-node-handlers.ts
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Безопасно проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user
# Код сгенерирован в generateStartHandler.ts
# Код сгенерирован в generate-node-handlers.ts
        if user_obj:
            init_user_variables(user_id, user_obj)
    # Подставляем все доступные переменные пользователя в текст
    user_vars = await get_user_from_db(user_id)
# Код сгенерирован в generateStartHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    # get_user_from_db теперь возвращает уже обработанные user_data
# Код сгенерирован в generateStartHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if not isinstance(user_vars, dict):
        user_vars = user_data.get(user_id, {})
    text = """🌟 Привет от ᴠᴨᴩᴏᴦʏᴧᴋᴇ Bot!

Этот бот поможет тебе найти интересных людей в Санкт-Петербурге!

Откуда ты узнал о нашем чате? 😎"""

    # Подставляем все доступные переменные пользователя в текст
    user_vars = await get_user_from_db(user_id)
# Код сгенерирован в generateStartHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if not user_vars:
        user_vars = user_data.get(user_id, {})

    # get_user_from_db теперь возвращает уже обработанные user_data
# Код сгенерирован в generateStartHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if not isinstance(user_vars, dict):
        user_vars = user_data.get(user_id, {})

    # Заменяем все переменные в тексте
    text = replace_variables_in_text(text, user_vars)
    # Инициализируем базовые переменные пользователя если их нет
# Код сгенерирован в generateStartHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Безопасно проверяем наличие message (для message handlers)
# Код сгенерирован в generateStartHandler.ts
# Код сгенерирован в generate-node-handlers.ts
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Безопасно проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user
# Код сгенерирован в generateStartHandler.ts
# Код сгенерирован в generate-node-handlers.ts
        if user_obj:
            init_user_variables(user_id, user_obj)
    # Подставляем все доступные переменные пользователя в текст
    user_vars = await get_user_from_db(user_id)
# Код сгенерирован в generateStartHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    # get_user_from_db теперь возвращает уже обработанные user_data
# Код сгенерирован в generateStartHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if not isinstance(user_vars, dict):
        user_vars = user_data.get(user_id, {})
    text = replace_variables_in_text(text, user_vars)
    has_regular_buttons = False
    has_input_collection = True
    await message.answer(text, node_id="start")
    # Устанавливаем состояние ожидания ввода с полной структурой
    user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
    user_data[message.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "modes": ["text"],
        "variable": "user_source",
        "save_to_database": True,
        "node_id": "start",
        "next_node_id": "join_request",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной user_source (узел start)")
# @@NODE_END:start@@

# @@NODE_START:join_request@@

    # Обработчик для узла join_request типа message будет сгенерирован отдельно
# @@NODE_END:join_request@@

# @@NODE_START:decline_response@@

    # Обработчик для узла decline_response типа message будет сгенерирован отдельно
# @@NODE_END:decline_response@@

# @@NODE_START:pin_message_node@@


# Pin Message Handler

# Код сгенерирован в generate-node-handlers.ts
@dp.callback_query(lambda c: c.data.startswith("pin_message_pin_message_node_"))
# Код сгенерирован в generate-node-handlers.ts
async def handle_callback_pin_message_node(callback_query: types.CallbackQuery):
    """
    Обработчик callback запросов команды закрепления
    Работает в группах где бот имеет права администратора
    """
    user_id = callback_query.from_user.id
    chat_id = callback_query.message.chat.id  # Определяем ID группы из контекста сообщения
    
    # Проверяем, что это группа
# Код сгенерирован в generate-node-handlers.ts
    if callback_query.message.chat.type not in ['group', 'supergroup']:
        await callback_query.message.answer("❌ Команда работает только в группах")
        return
    
    # Определяем целевое сообщение из callback_data
    target_message_id = int(callback_query.data.split('_')[-1]) if callback_query.data.split('_').length > 3 else None
    
# Код сгенерирован в generate-node-handlers.ts
    if not target_message_id:
        await callback_query.message.answer("❌ Не удалось определить ID сообщения для закрепления")
        return
    
    try:
        await bot.pin_chat_message(
            chat_id=chat_id,
            message_id=target_message_id,
            disable_notification=False
        )
        await callback_query.message.answer("✅ Сообщение закреплено")
        logging.info(f"Сообщение {target_message_id} закреплено пользователем {user_id} в группе {chat_id}")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "message to pin not found" in str(e) or "message not found" in str(e):
            await callback_query.message.answer("❌ Сообщение не найдено")
        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await callback_query.message.answer("❌ Недостаточно прав для закрепления сообщения")
        else:
            await callback_query.message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка закрепления сообщения: {e}")
    except Exception as e:
        await callback_query.message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка при закреплении: {e}")
    
    try:
        await callback_query.answer()
    except:
        pass
# Код сгенерирован в generate-node-handlers.ts
@dp.message(Command("pin_message"))
# Код сгенерирован в generate-node-handlers.ts
async def pin_message_pin_message_node_command_handler(message: types.Message):
    """
    Обработчик команды /pin_message
    Работает в группах где бот имеет права администратора
    Использование: ответ на сообщение или указание ID сообщения
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Проверяем, что это группа
# Код сгенерирован в generate-node-handlers.ts
    if message.chat.type not in ['group', 'supergroup']:
        await message.answer("❌ Команда работает только в группах")
        return
    
    # Определяем целевое сообщение
    target_message_id = None
    
# Код сгенерирован в generate-node-handlers.ts
    if message.reply_to_message:
        target_message_id = message.reply_to_message.message_id
    else:
        text_parts = message.text.split()
# Код сгенерирован в generate-node-handlers.ts
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_message_id = int(text_parts[1])
        else:
            await message.answer("❌ Ответьте на сообщение или напишите /pin_message ID_сообщения")
            return
    
    try:
        await bot.pin_chat_message(
            chat_id=chat_id,
            message_id=target_message_id,
            disable_notification=False
        )
        await message.answer("✅ Сообщение закреплено")
        logging.info(f"Сообщение {target_message_id} закреплено пользователем {user_id} в группе {chat_id}")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "message to pin not found" in str(e) or "message not found" in str(e):
            await message.answer("❌ Сообщение не найдено")
        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для закрепления сообщения")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка закрепления сообщения: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка при закреплении: {e}")


# Код сгенерирован в generate-node-handlers.ts
@dp.message(lambda message: message.text and message.text.lower().startswith("закрепить") and message.chat.type in ['group', 'supergroup'])
# Код сгенерирован в generate-node-handlers.ts
async def pin_message_pin_message_node_закрепить_handler(message: types.Message):
    """
    Обработчик для закрепления сообщения по команде 'закрепить'
    Работает в любых группах где бот имеет права администратора
    """
    user_id = message.from_user.id
    chat_id = message.chat.id  # Автоматически определяем ID группы из контекста
    
    # Определяем целевое сообщение
    target_message_id = None
    
# Код сгенерирован в generate-node-handlers.ts
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_message_id = message.reply_to_message.message_id
        logging.info(f"DEBUG: Получен ответ на сообщение {target_message_id} в группе {chat_id}")
    else:
        # Если нет ответа, проверяем текст на наличие ID сообщения
        text_parts = message.text.split()
# Код сгенерирован в generate-node-handlers.ts
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_message_id = int(text_parts[1])
            logging.info(f"DEBUG: Получен ID сообщения {target_message_id} из текста в группе {chat_id}")
        else:
            logging.info(f"DEBUG: Получен текст закрепить без ID сообщения в группе {chat_id}")
            await message.answer("❌ Укажите сообщение: ответьте на сообщение или напишите 'закрепить ID_сообщения'")
            return
    
    try:
        # Закрепляем сообщение в текущей группе
        await bot.pin_chat_message(
            chat_id=chat_id,
            message_id=target_message_id,
            disable_notification=False
        )
        await message.answer("✅ Сообщение закреплено")
        logging.info(f"Сообщение {target_message_id} закреплено пользователем {user_id} в группе {chat_id}")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "message to pin not found" in str(e) or "message not found" in str(e):
            await message.answer("❌ Сообщение не найдено")
        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для закрепления сообщения")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка закрепления сообщения: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка при закреплении: {e}")


# Код сгенерирован в generate-node-handlers.ts
@dp.message(lambda message: message.text and message.text.lower().startswith("прикрепить") and message.chat.type in ['group', 'supergroup'])
# Код сгенерирован в generate-node-handlers.ts
async def pin_message_pin_message_node_прикрепить_handler(message: types.Message):
    """
    Обработчик для закрепления сообщения по команде 'прикрепить'
    Работает в любых группах где бот имеет права администратора
    """
    user_id = message.from_user.id
    chat_id = message.chat.id  # Автоматически определяем ID группы из контекста
    
    # Определяем целевое сообщение
    target_message_id = None
    
# Код сгенерирован в generate-node-handlers.ts
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_message_id = message.reply_to_message.message_id
        logging.info(f"DEBUG: Получен ответ на сообщение {target_message_id} в группе {chat_id}")
    else:
        # Если нет ответа, проверяем текст на наличие ID сообщения
        text_parts = message.text.split()
# Код сгенерирован в generate-node-handlers.ts
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_message_id = int(text_parts[1])
            logging.info(f"DEBUG: Получен ID сообщения {target_message_id} из текста в группе {chat_id}")
        else:
            logging.info(f"DEBUG: Получен текст прикрепить без ID сообщения в группе {chat_id}")
            await message.answer("❌ Укажите сообщение: ответьте на сообщение или напишите 'прикрепить ID_сообщения'")
            return
    
    try:
        # Закрепляем сообщение в текущей группе
        await bot.pin_chat_message(
            chat_id=chat_id,
            message_id=target_message_id,
            disable_notification=False
        )
        await message.answer("✅ Сообщение закреплено")
        logging.info(f"Сообщение {target_message_id} закреплено пользователем {user_id} в группе {chat_id}")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "message to pin not found" in str(e) or "message not found" in str(e):
            await message.answer("❌ Сообщение не найдено")
        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для закрепления сообщения")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка закрепления сообщения: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка при закреплении: {e}")


# Код сгенерирован в generate-node-handlers.ts
@dp.message(lambda message: message.text and message.text.lower().startswith("зафиксировать") and message.chat.type in ['group', 'supergroup'])
# Код сгенерирован в generate-node-handlers.ts
async def pin_message_pin_message_node_зафиксировать_handler(message: types.Message):
    """
    Обработчик для закрепления сообщения по команде 'зафиксировать'
    Работает в любых группах где бот имеет права администратора
    """
    user_id = message.from_user.id
    chat_id = message.chat.id  # Автоматически определяем ID группы из контекста
    
    # Определяем целевое сообщение
    target_message_id = None
    
# Код сгенерирован в generate-node-handlers.ts
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_message_id = message.reply_to_message.message_id
        logging.info(f"DEBUG: Получен ответ на сообщение {target_message_id} в группе {chat_id}")
    else:
        # Если нет ответа, проверяем текст на наличие ID сообщения
        text_parts = message.text.split()
# Код сгенерирован в generate-node-handlers.ts
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_message_id = int(text_parts[1])
            logging.info(f"DEBUG: Получен ID сообщения {target_message_id} из текста в группе {chat_id}")
        else:
            logging.info(f"DEBUG: Получен текст зафиксировать без ID сообщения в группе {chat_id}")
            await message.answer("❌ Укажите сообщение: ответьте на сообщение или напишите 'зафиксировать ID_сообщения'")
            return
    
    try:
        # Закрепляем сообщение в текущей группе
        await bot.pin_chat_message(
            chat_id=chat_id,
            message_id=target_message_id,
            disable_notification=False
        )
        await message.answer("✅ Сообщение закреплено")
        logging.info(f"Сообщение {target_message_id} закреплено пользователем {user_id} в группе {chat_id}")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "message to pin not found" in str(e) or "message not found" in str(e):
            await message.answer("❌ Сообщение не найдено")
        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для закрепления сообщения")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка закрепления сообщения: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка при закреплении: {e}")


# @@NODE_END:pin_message_node@@

# @@NODE_START:unpin_message_node@@


# Unpin Message Handler

# Код сгенерирован в generate-node-handlers.ts
@dp.callback_query(lambda c: c.data.startswith("unpin_message_unpin_message_node_"))
# Код сгенерирован в generate-node-handlers.ts
async def handle_callback_unpin_message_node(callback_query: types.CallbackQuery):
    """
    Обработчик callback запросов команды открепления
    Работает в группах где бот имеет права администратора
    """
    user_id = callback_query.from_user.id
    chat_id = callback_query.message.chat.id
    
    # Проверяем, что это группа
# Код сгенерирован в generate-node-handlers.ts
    if callback_query.message.chat.type not in ['group', 'supergroup']:
        await callback_query.message.answer("❌ Команда работает только в группах")
        return
    
    try:
        await bot.unpin_all_chat_messages(chat_id=chat_id)
        await callback_query.message.answer("✅ Все сообщения откреплены")
        logging.info(f"Все сообщения откреплены пользователем {user_id} в группе {chat_id}")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "message to unpin not found" in str(e) or "not found" in str(e):
            await callback_query.message.answer("❌ Нечего откреплять")
        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await callback_query.message.answer("❌ Недостаточно прав для открепления")
        else:
            await callback_query.message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка открепления: {e}")
    except Exception as e:
        await callback_query.message.answer("❌ Произошла ошибка")
        logging.error(f"Неожиданная ошибка при откреплении: {e}")
    
    try:
        await callback_query.answer()
    except:
        pass

# Код сгенерирован в generate-node-handlers.ts
@dp.message(Command("unpin_message"))
# Код сгенерирован в generate-node-handlers.ts
async def unpin_message_unpin_message_node_command_handler(message: types.Message):
    """
    Обработчик команды /unpin_message
    Работает в группах где бот имеет права администратора
    Использование: ответ на сообщение или указание ID сообщения
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Проверяем, что это группа
# Код сгенерирован в generate-node-handlers.ts
    if message.chat.type not in ['group', 'supergroup']:
        await message.answer("❌ Команда работает только в группах")
        return
    
    # Определяем целевое сообщение
    target_message_id = None
    
# Код сгенерирован в generate-node-handlers.ts
    if message.reply_to_message:
        target_message_id = message.reply_to_message.message_id
    else:
        text_parts = message.text.split()
# Код сгенерирован в generate-node-handlers.ts
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_message_id = int(text_parts[1])
        else:
            # Если нет конкретного сообщения, открепляем все
            target_message_id = None
    
    try:
# Код сгенерирован в generate-node-handlers.ts
        if target_message_id:
            await bot.unpin_chat_message(
                chat_id=chat_id,
                message_id=target_message_id
            )
            await message.answer("✅ Сообщение откреплено")
            logging.info(f"Сообщение {target_message_id} откреплено пользователем {user_id} в группе {chat_id}")
        else:
            await bot.unpin_all_chat_messages(chat_id=chat_id)
            await message.answer("✅ Все сообщения откреплены")
            logging.info(f"Все сообщения откреплены пользователем {user_id} в группе {chat_id}")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "message to unpin not found" in str(e) or "message not found" in str(e):
            await message.answer("❌ Сообщение не найдено")
        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для открепления сообщения")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка открепления сообщения: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка при откреплении: {e}")


# Код сгенерирован в generate-node-handlers.ts
@dp.message(lambda message: message.text and message.text.lower().startswith("открепить") and message.chat.type in ['group', 'supergroup'])
# Код сгенерирован в generate-node-handlers.ts
async def unpin_message_unpin_message_node_открепить_handler(message: types.Message):
    """
    Обработчик для открепления сообщения по команде 'открепить'
    Работает в любых группах где бот имеет права администратора
    """
    user_id = message.from_user.id
    chat_id = message.chat.id  # Автоматически определяем ID группы из контекста
    
    # Определяем целевое сообщение
    target_message_id = None
    
# Код сгенерирован в generate-node-handlers.ts
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_message_id = message.reply_to_message.message_id
        logging.info(f"DEBUG: Получен ответ на сообщение {target_message_id} для открепления в группе {chat_id}")
    else:
        # Если нет ответа, проверяем текст на наличие ID сообщения
        text_parts = message.text.split()
# Код сгенерирован в generate-node-handlers.ts
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_message_id = int(text_parts[1])
            logging.info(f"DEBUG: Получен ID сообщения {target_message_id} из текста для открепления в группе {chat_id}")
        else:
            logging.info(f"DEBUG: Получен текст открепить без ID сообщения - открепим все в группе {chat_id}")
            # Если нет конкретного сообщения, открепляем все
            target_message_id = None
    
    try:
        # Открепляем сообщение в текущей группе
# Код сгенерирован в generate-node-handlers.ts
        if target_message_id:
            await bot.unpin_chat_message(
                chat_id=chat_id,
                message_id=target_message_id
            )
            await message.answer("✅ Сообщение откреплено")
            logging.info(f"Сообщение {target_message_id} откреплено пользователем {user_id} в группе {chat_id}")
        else:
            await bot.unpin_all_chat_messages(chat_id=chat_id)
            await message.answer("✅ Все сообщения откреплены")
            logging.info(f"Все сообщения откреплены пользователем {user_id} в группе {chat_id}")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "message to unpin not found" in str(e) or "message not found" in str(e):
            await message.answer("❌ Сообщение не найдено")
        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для открепления сообщения")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка открепления сообщения: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка при откреплении: {e}")


# Код сгенерирован в generate-node-handlers.ts
@dp.message(lambda message: message.text and message.text.lower().startswith("отцепить") and message.chat.type in ['group', 'supergroup'])
# Код сгенерирован в generate-node-handlers.ts
async def unpin_message_unpin_message_node_отцепить_handler(message: types.Message):
    """
    Обработчик для открепления сообщения по команде 'отцепить'
    Работает в любых группах где бот имеет права администратора
    """
    user_id = message.from_user.id
    chat_id = message.chat.id  # Автоматически определяем ID группы из контекста
    
    # Определяем целевое сообщение
    target_message_id = None
    
# Код сгенерирован в generate-node-handlers.ts
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_message_id = message.reply_to_message.message_id
        logging.info(f"DEBUG: Получен ответ на сообщение {target_message_id} для открепления в группе {chat_id}")
    else:
        # Если нет ответа, проверяем текст на наличие ID сообщения
        text_parts = message.text.split()
# Код сгенерирован в generate-node-handlers.ts
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_message_id = int(text_parts[1])
            logging.info(f"DEBUG: Получен ID сообщения {target_message_id} из текста для открепления в группе {chat_id}")
        else:
            logging.info(f"DEBUG: Получен текст отцепить без ID сообщения - открепим все в группе {chat_id}")
            # Если нет конкретного сообщения, открепляем все
            target_message_id = None
    
    try:
        # Открепляем сообщение в текущей группе
# Код сгенерирован в generate-node-handlers.ts
        if target_message_id:
            await bot.unpin_chat_message(
                chat_id=chat_id,
                message_id=target_message_id
            )
            await message.answer("✅ Сообщение откреплено")
            logging.info(f"Сообщение {target_message_id} откреплено пользователем {user_id} в группе {chat_id}")
        else:
            await bot.unpin_all_chat_messages(chat_id=chat_id)
            await message.answer("✅ Все сообщения откреплены")
            logging.info(f"Все сообщения откреплены пользователем {user_id} в группе {chat_id}")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "message to unpin not found" in str(e) or "message not found" in str(e):
            await message.answer("❌ Сообщение не найдено")
        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для открепления сообщения")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка открепления сообщения: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка при откреплении: {e}")


# Код сгенерирован в generate-node-handlers.ts
@dp.message(lambda message: message.text and message.text.lower().startswith("убрать закрепление") and message.chat.type in ['group', 'supergroup'])
# Код сгенерирован в generate-node-handlers.ts
async def unpin_message_unpin_message_node_убрать_закрепление_handler(message: types.Message):
    """
    Обработчик для открепления сообщения по команде 'убрать закрепление'
    Работает в любых группах где бот имеет права администратора
    """
    user_id = message.from_user.id
    chat_id = message.chat.id  # Автоматически определяем ID группы из контекста
    
    # Определяем целевое сообщение
    target_message_id = None
    
# Код сгенерирован в generate-node-handlers.ts
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_message_id = message.reply_to_message.message_id
        logging.info(f"DEBUG: Получен ответ на сообщение {target_message_id} для открепления в группе {chat_id}")
    else:
        # Если нет ответа, проверяем текст на наличие ID сообщения
        text_parts = message.text.split()
# Код сгенерирован в generate-node-handlers.ts
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_message_id = int(text_parts[1])
            logging.info(f"DEBUG: Получен ID сообщения {target_message_id} из текста для открепления в группе {chat_id}")
        else:
            logging.info(f"DEBUG: Получен текст убрать закрепление без ID сообщения - открепим все в группе {chat_id}")
            # Если нет конкретного сообщения, открепляем все
            target_message_id = None
    
    try:
        # Открепляем сообщение в текущей группе
# Код сгенерирован в generate-node-handlers.ts
        if target_message_id:
            await bot.unpin_chat_message(
                chat_id=chat_id,
                message_id=target_message_id
            )
            await message.answer("✅ Сообщение откреплено")
            logging.info(f"Сообщение {target_message_id} откреплено пользователем {user_id} в группе {chat_id}")
        else:
            await bot.unpin_all_chat_messages(chat_id=chat_id)
            await message.answer("✅ Все сообщения откреплены")
            logging.info(f"Все сообщения откреплены пользователем {user_id} в группе {chat_id}")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "message to unpin not found" in str(e) or "message not found" in str(e):
            await message.answer("❌ Сообщение не найдено")
        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для открепления сообщения")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка открепления сообщения: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка при откреплении: {e}")


# @@NODE_END:unpin_message_node@@

# @@NODE_START:delete_message_node@@


# Delete Message Handler

# Код сгенерирован в generate-node-handlers.ts
@dp.callback_query(lambda c: c.data.startswith("delete_message_delete_message_node_"))
# Код сгенерирован в generate-node-handlers.ts
async def handle_callback_delete_message_node(callback_query: types.CallbackQuery):
    """
    Обработчик callback запросов команды удаления
    Работает в группах где бот имеет права администратора
    """
    user_id = callback_query.from_user.id
    chat_id = callback_query.message.chat.id
    
    # Проверяем, что это группа
# Код сгенерирован в generate-node-handlers.ts
    if callback_query.message.chat.type not in ['group', 'supergroup']:
        await callback_query.message.answer("❌ Команда работает только в группах")
        return
    
    # Определяем целевое сообщение из callback_data
    target_message_id = int(callback_query.data.split('_')[-1]) if callback_query.data.split('_').length > 3 else None
    
# Код сгенерирован в generate-node-handlers.ts
    if not target_message_id:
        await callback_query.message.answer("❌ Не удалось определить ID сообщения для удаления")
        return
    
    try:
        await bot.delete_message(
            chat_id=chat_id,
            message_id=target_message_id
        )
        await callback_query.message.answer("🗑️ Сообщение успешно удалено!")
        logging.info(f"Сообщение {target_message_id} удалено пользователем {user_id} в группе {chat_id}")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "message to delete not found" in str(e) or "message not found" in str(e):
            await callback_query.message.answer("❌ Сообщение не найдено")
        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await callback_query.message.answer("❌ Недостаточно прав для удаления")
        else:
            await callback_query.message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка удаления сообщения: {e}")
    except Exception as e:
        await callback_query.message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка при удалении: {e}")
    
    try:
        await callback_query.answer()
    except:
        pass

# Обработчик для удаления сообщения используя синонимы: удалить, стереть, убрать сообщение
# Поддерживает ответ на сообщение для автоматического определения target message ID
# Работает в любых группах где бот имеет права администратора

# Код сгенерирован в generate-node-handlers.ts
@dp.message(Command("delete_message"))
# Код сгенерирован в generate-node-handlers.ts
async def delete_message_delete_message_node_command_handler(message: types.Message):
    """
    Обработчик команды /delete_message
    Работает в любых группах где бот имеет права администратора
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Проверяем, что это группа
# Код сгенерирован в generate-node-handlers.ts
    if message.chat.type not in ['group', 'supergroup']:
        await message.answer("❌ Команда работает только в группах")
        return
    
    # Определяем целевое сообщение
    target_message_id = None
    
# Код сгенерирован в generate-node-handlers.ts
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_message_id = message.reply_to_message.message_id
        logging.info(f"DEBUG: Получен ответ на сообщение {target_message_id} для удаления")
    else:
        # Если нет ответа, проверяем текст на наличие ID сообщения
        text_parts = message.text.split()
# Код сгенерирован в generate-node-handlers.ts
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_message_id = int(text_parts[1])
            logging.info(f"DEBUG: Получен ID сообщения {target_message_id} из текста для удаления")
        else:
            logging.info(f"DEBUG: Получена команда удаления без ID сообщения")
            await message.answer("❌ Укажите сообщение: ответьте на сообщение или напишите '/delete_message ID_сообщения'")
            return
    
    try:
        # Удаляем сообщение
        await bot.delete_message(
            chat_id=chat_id,
            message_id=target_message_id
        )
        await message.answer("🗑️ Сообщение успешно удалено!")
        logging.info(f"Сообщение {target_message_id} удалено пользователем {user_id} в группе {chat_id}")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "message to delete not found" in str(e) or "message not found" in str(e):
            await message.answer("❌ Сообщение не найдено")
        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для удаления сообщения")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка удаления сообщения: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка при удалении: {e}")


# Код сгенерирован в generate-node-handlers.ts
@dp.message(lambda message: message.text and (message.text.lower() == "удалить" or message.text.lower().startswith("удалить ")) and message.chat.type in ['group', 'supergroup'])
# Код сгенерирован в generate-node-handlers.ts
async def delete_message_delete_message_node_удалить_handler(message: types.Message):
    """
    Обработчик синонима 'удалить' для удаления сообщения
    Работает в группах с ответом на сообщение или с указанием ID
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевое сообщение
    target_message_id = None
    
# Код сгенерирован в generate-node-handlers.ts
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_message_id = message.reply_to_message.message_id
        logging.info(f"DEBUG: Получен ответ на сообщение {target_message_id} для удаления через синоним 'удалить'")
    else:
        # Если нет ответа, проверяем текст на наличие ID сообщения
        text_parts = message.text.split()
# Код сгенерирован в generate-node-handlers.ts
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_message_id = int(text_parts[1])
            logging.info(f"DEBUG: Получен ID сообщения {target_message_id} из текста для удаления через синоним 'удалить'")
        else:
            logging.info(f"DEBUG: Получен синоним 'удалить' без ID сообщения")
            await message.answer("❌ Укажите сообщение: ответьте на сообщение или напишите 'удалить ID_сообщения'")
            return
    
    try:
        # Удаляем сообщение
        await bot.delete_message(
            chat_id=chat_id,
            message_id=target_message_id
        )
        await message.answer("🗑️ Сообщение успешно удалено!")
        logging.info(f"Сообщение {target_message_id} удалено пользователем {user_id} в группе {chat_id} через синоним 'удалить'")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "message to delete not found" in str(e) or "message not found" in str(e):
            await message.answer("❌ Сообщение не найдено")
        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для удаления сообщения")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка удаления сообщения через синоним 'удалить': {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка при удалении через синоним 'удалить': {e}")


# Код сгенерирован в generate-node-handlers.ts
@dp.message(lambda message: message.text and (message.text.lower() == "стереть" or message.text.lower().startswith("стереть ")) and message.chat.type in ['group', 'supergroup'])
# Код сгенерирован в generate-node-handlers.ts
async def delete_message_delete_message_node_стереть_handler(message: types.Message):
    """
    Обработчик синонима 'стереть' для удаления сообщения
    Работает в группах с ответом на сообщение или с указанием ID
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевое сообщение
    target_message_id = None
    
# Код сгенерирован в generate-node-handlers.ts
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_message_id = message.reply_to_message.message_id
        logging.info(f"DEBUG: Получен ответ на сообщение {target_message_id} для удаления через синоним 'стереть'")
    else:
        # Если нет ответа, проверяем текст на наличие ID сообщения
        text_parts = message.text.split()
# Код сгенерирован в generate-node-handlers.ts
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_message_id = int(text_parts[1])
            logging.info(f"DEBUG: Получен ID сообщения {target_message_id} из текста для удаления через синоним 'стереть'")
        else:
            logging.info(f"DEBUG: Получен синоним 'стереть' без ID сообщения")
            await message.answer("❌ Укажите сообщение: ответьте на сообщение или напишите 'стереть ID_сообщения'")
            return
    
    try:
        # Удаляем сообщение
        await bot.delete_message(
            chat_id=chat_id,
            message_id=target_message_id
        )
        await message.answer("🗑️ Сообщение успешно удалено!")
        logging.info(f"Сообщение {target_message_id} удалено пользователем {user_id} в группе {chat_id} через синоним 'стереть'")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "message to delete not found" in str(e) or "message not found" in str(e):
            await message.answer("❌ Сообщение не найдено")
        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для удаления сообщения")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка удаления сообщения через синоним 'стереть': {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка при удалении через синоним 'стереть': {e}")


# Код сгенерирован в generate-node-handlers.ts
@dp.message(lambda message: message.text and (message.text.lower() == "убрать сообщение" or message.text.lower().startswith("убрать сообщение ")) and message.chat.type in ['group', 'supergroup'])
# Код сгенерирован в generate-node-handlers.ts
async def delete_message_delete_message_node_убрать_сообщение_handler(message: types.Message):
    """
    Обработчик синонима 'убрать сообщение' для удаления сообщения
    Работает в группах с ответом на сообщение или с указанием ID
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевое сообщение
    target_message_id = None
    
# Код сгенерирован в generate-node-handlers.ts
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_message_id = message.reply_to_message.message_id
        logging.info(f"DEBUG: Получен ответ на сообщение {target_message_id} для удаления через синоним 'убрать сообщение'")
    else:
        # Если нет ответа, проверяем текст на наличие ID сообщения
        text_parts = message.text.split()
# Код сгенерирован в generate-node-handlers.ts
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_message_id = int(text_parts[1])
            logging.info(f"DEBUG: Получен ID сообщения {target_message_id} из текста для удаления через синоним 'убрать сообщение'")
        else:
            logging.info(f"DEBUG: Получен синоним 'убрать сообщение' без ID сообщения")
            await message.answer("❌ Укажите сообщение: ответьте на сообщение или напишите 'убрать сообщение ID_сообщения'")
            return
    
    try:
        # Удаляем сообщение
        await bot.delete_message(
            chat_id=chat_id,
            message_id=target_message_id
        )
        await message.answer("🗑️ Сообщение успешно удалено!")
        logging.info(f"Сообщение {target_message_id} удалено пользователем {user_id} в группе {chat_id} через синоним 'убрать сообщение'")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "message to delete not found" in str(e) or "message not found" in str(e):
            await message.answer("❌ Сообщение не найдено")
        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для удаления сообщения")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка удаления сообщения через синоним 'убрать сообщение': {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка при удалении через синоним 'убрать сообщение': {e}")


# @@NODE_END:delete_message_node@@

# @@NODE_START:ban_user_node@@


# Ban User Handler
# Код сгенерирован в generate-node-handlers.ts
@dp.message(Command("ban_user"))
# Код сгенерирован в generate-node-handlers.ts
async def ban_user_ban_user_node_command_handler(message: types.Message):
    """
    Обработчик команды /ban_user
    Работает в группах где бот имеет права администратора
    Использование: ответ на сообщение пользователя или указание ID
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Проверяем, что это группа
# Код сгенерирован в generate-node-handlers.ts
    if message.chat.type not in ['group', 'supergroup']:
        await message.answer("❌ Команда работает только в группах")
        return
    
    # Определяем целевого пользователя
    target_user_id = None
    
# Код сгенерирован в generate-node-handlers.ts
    if message.reply_to_message:
        target_user_id = message.reply_to_message.from_user.id
        target_username = message.reply_to_message.from_user.username or message.reply_to_message.from_user.first_name
    else:
        text_parts = message.text.split()
        # Пробуем найти упоминание пользователя в сообщении
# Код сгенерирован в generate-node-handlers.ts
        if message.entities:
            for entity in message.entities:
# Код сгенерирован в generate-node-handlers.ts
                if entity.type == "text_mention":
                    target_user_id = entity.user.id
                    break
# Код сгенерирован в generate-node-handlers.ts
        if not target_user_id:
            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия")
            return
    
# Код сгенерирован в generate-node-handlers.ts
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя для блокировки")
        return
    
    try:
        # Баним пользователя
        await bot.ban_chat_member(
            chat_id=chat_id,
            user_id=target_user_id
        )
        await message.answer(f"✅ Пользователь {target_user_id} заблокирован навсегда\nПричина: Нарушение правил группы")
        logging.info(f"Пользователь {target_user_id} заблокирован администратором {user_id} в группе {chat_id}")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для блокировки пользователя")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка блокировки пользователя: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка при блокировке: {e}")

# Код сгенерирован в generate-node-handlers.ts
@dp.message(lambda message: message.text and any(message.text.lower().startswith(word) for word in ["забанить", "заблокировать", "бан"]) and message.chat.type in ['group', 'supergroup'])
# Код сгенерирован в generate-node-handlers.ts
async def ban_user_ban_user_node_handler(message: types.Message):
    """
    Обработчик для блокировки пользователя
    Синонимы: забанить, заблокировать, бан
    Работает в любых группах где бот имеет права администратора
    Использование: ответ на сообщение пользователя или указание ID
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
# Код сгенерирован в generate-node-handlers.ts
    if message.reply_to_message:
        target_user_id = message.reply_to_message.from_user.id
        target_username = message.reply_to_message.from_user.username or message.reply_to_message.from_user.first_name
    else:
        text_parts = message.text.split()
        # Пробуем найти упоминание пользователя в сообщении
# Код сгенерирован в generate-node-handlers.ts
        if message.entities:
            for entity in message.entities:
# Код сгенерирован в generate-node-handlers.ts
                if entity.type == "text_mention":
                    target_user_id = entity.user.id
                    break
# Код сгенерирован в generate-node-handlers.ts
        if not target_user_id:
            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия")
            return
    
# Код сгенерирован в generate-node-handlers.ts
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя для блокировки")
        return
    
    try:
        # Баним пользователя
        await bot.ban_chat_member(
            chat_id=chat_id,
            user_id=target_user_id
        )
        await message.answer(f"✅ Пользователь {target_user_id} заблокирован навсегда\nПричина: Нарушение правил группы")
        logging.info(f"Пользователь {target_user_id} заблокирован администратором {user_id} в группе {chat_id}")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для блокировки пользователя")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка блокировки пользователя: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка при блокировке: {e}")


# @@NODE_END:ban_user_node@@

# @@NODE_START:unban_user_node@@


# Unban User Handler
# Код сгенерирован в generate-node-handlers.ts
@dp.message(Command("unban_user"))
# Код сгенерирован в generate-node-handlers.ts
async def unban_user_unban_user_node_command_handler(message: types.Message):
    """
    Обработчик команды /unban_user
    Работает в группах где бот имеет права администратора
    Использование: ответ на сообщение пользователя или указание ID
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Проверяем, что это группа
# Код сгенерирован в generate-node-handlers.ts
    if message.chat.type not in ['group', 'supergroup']:
        await message.answer("❌ Команда работает только в группах")
        return
    
    # Определяем целевого пользователя
    target_user_id = None
    
    # Проверяем, есть ли ответ на сообщение
# Код сгенерирован в generate-node-handlers.ts
    if message.reply_to_message:
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Определен пользователь для разбана из reply: {target_user_id}")
    else:
        # Пробуем найти упоминание пользователя в сообщении
# Код сгенерирован в generate-node-handlers.ts
        if message.entities:
            for entity in message.entities:
# Код сгенерирован в generate-node-handlers.ts
                if entity.type == "text_mention":
                    target_user_id = entity.user.id
                    break
# Код сгенерирован в generate-node-handlers.ts
        if not target_user_id:
            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для разблокировки")
            return
    
    try:
        # Разбаниваем пользователя
        await bot.unban_chat_member(
            chat_id=chat_id,
            user_id=target_user_id,
            only_if_banned=True
        )
        await message.answer(f"✅ Пользователь {target_user_id} разблокирован")
        logging.info(f"Пользователь {target_user_id} разблокирован администратором {user_id} в группе {chat_id}")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для разблокировки пользователя")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка разблокировки пользователя: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка при разблокировке: {e}")

# Код сгенерирован в generate-node-handlers.ts
@dp.message(lambda message: message.text and any(message.text.lower().startswith(word) for word in ["разбанить", "разблокировать", "unbан"]) and message.chat.type in ['group', 'supergroup'])
# Код сгенерирован в generate-node-handlers.ts
async def unban_user_unban_user_node_handler(message: types.Message):
    """
    Обработчик для разблокировки пользователя
    Синонимы: разбанить,разблокировать,unbан
    Использование: ответ на сообщение пользователя или указание ID
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
    # Проверяем, есть ли ответ на сообщение
# Код сгенерирован в generate-node-handlers.ts
    if message.reply_to_message:
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Определен пользователь для разбана из reply: {target_user_id}")
    else:
        # Пробуем найти упоминание пользователя в сообщении
# Код сгенерирован в generate-node-handlers.ts
        if message.entities:
            for entity in message.entities:
# Код сгенерирован в generate-node-handlers.ts
                if entity.type == "text_mention":
                    target_user_id = entity.user.id
                    break
# Код сгенерирован в generate-node-handlers.ts
        if not target_user_id:
            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для разблокировки")
            return
    
    try:
        # Разбаниваем пользователя
        await bot.unban_chat_member(
            chat_id=chat_id,
            user_id=target_user_id,
            only_if_banned=True
        )
        await message.answer(f"✅ Пользователь {target_user_id} разблокирован")
        logging.info(f"Пользователь {target_user_id} разблокирован администратором {user_id} в группе {chat_id}")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для разблокировки пользователя")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка разблокировки пользователя: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка при разблокировке: {e}")


# @@NODE_END:unban_user_node@@

# @@NODE_START:mute_user_node@@


# Mute User Handler
# Код сгенерирован в generate-node-handlers.ts
@dp.message(Command("mute_user"))
# Код сгенерирован в generate-node-handlers.ts
async def mute_user_mute_user_node_command_handler(message: types.Message):
    """
    Обработчик команды /mute_user
    Работает в группах где бот имеет права администратора
    Использование: ответ на сообщение пользователя или указание ID
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Проверяем, что это группа
# Код сгенерирован в generate-node-handlers.ts
    if message.chat.type not in ['group', 'supergroup']:
        await message.answer("❌ Команда работает только в группах")
        return
    
    # Определяем целевого пользователя
    target_user_id = None
    
# Код сгенерирован в generate-node-handlers.ts
    if message.reply_to_message:
        target_user_id = message.reply_to_message.from_user.id
    else:
        # Пробуем найти упоминание пользователя в сообщении
# Код сгенерирован в generate-node-handlers.ts
        if message.entities:
            for entity in message.entities:
# Код сгенерирован в generate-node-handlers.ts
                if entity.type == "text_mention":
                    target_user_id = entity.user.id
                    break
# Код сгенерирован в generate-node-handlers.ts
        if not target_user_id:
            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия")
            return
    
# Код сгенерирован в generate-node-handlers.ts
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя для ограничения")
        return
    
    try:
        # Вычисляем время окончания мута
        from datetime import datetime, timedelta
        until_date = datetime.now() + timedelta(seconds=3600)
        
        # Ограничиваем пользователя
        await bot.restrict_chat_member(
            chat_id=chat_id,
            user_id=target_user_id,
            permissions=types.ChatPermissions(
                can_send_messages=False,
                can_send_media_messages=False,
                can_send_polls=False,
                can_send_other_messages=False,
                can_add_web_page_previews=False,
                can_change_info=False,
                can_invite_users=False,
                can_pin_messages=False
            ),
            until_date=until_date
        )
        
        hours = 3600 // 3600
        minutes = (3600 % 3600) // 60
        time_str = f"{hours}ч {minutes}м" if hours > 0 else f"{minutes}м"
        
        await message.answer(f"✅ Пользователь {target_user_id} ограничен на {time_str}\nПричина: Нарушение правил группы")
        logging.info(f"Пользователь {target_user_id} ограничен администратором {user_id} в группе {chat_id} на 3600 секунд")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для ограничения пользователя")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка ограничения пользователя: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка при ограничении: {e}")

# Код сгенерирован в generate-node-handlers.ts
@dp.message(lambda message: message.text and any(message.text.lower().startswith(word) for word in ["замутить", "заглушить", "мут"]) and message.chat.type in ['group', 'supergroup'])
# Код сгенерирован в generate-node-handlers.ts
async def mute_user_mute_user_node_handler(message: types.Message):
    """
    Обработчик для ограничения пользователя
    Синонимы: замутить,заглушить,мут
    Использование: ответ на сообщение пользователя или указание ID
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
# Код сгенерирован в generate-node-handlers.ts
    if message.reply_to_message:
        target_user_id = message.reply_to_message.from_user.id
    else:
        # Пробуем найти упоминание пользователя в сообщении
# Код сгенерирован в generate-node-handlers.ts
        if message.entities:
            for entity in message.entities:
# Код сгенерирован в generate-node-handlers.ts
                if entity.type == "text_mention":
                    target_user_id = entity.user.id
                    break
# Код сгенерирован в generate-node-handlers.ts
        if not target_user_id:
            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия")
            return
    
# Код сгенерирован в generate-node-handlers.ts
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя для ограничения")
        return
    
    try:
        # Вычисляем время окончания мута
        from datetime import datetime, timedelta
        until_date = datetime.now() + timedelta(seconds=3600)
        
        # Ограничиваем пользователя
        await bot.restrict_chat_member(
            chat_id=chat_id,
            user_id=target_user_id,
            permissions=types.ChatPermissions(
                can_send_messages=False,
                can_send_media_messages=False,
                can_send_polls=False,
                can_send_other_messages=False,
                can_add_web_page_previews=False,
                can_change_info=False,
                can_invite_users=False,
                can_pin_messages=False
            ),
            until_date=until_date
        )
        
        hours = 3600 // 3600
        minutes = (3600 % 3600) // 60
        time_str = f"{hours}ч {minutes}м" if hours > 0 else f"{minutes}м"
        
        await message.answer(f"✅ Пользователь {target_user_id} ограничен на {time_str}\nПричина: Нарушение правил группы")
        logging.info(f"Пользователь {target_user_id} ограничен администратором {user_id} в группе {chat_id} на 3600 секунд")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для ограничения пользователя")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка ограничения пользователя: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка при ограничении: {e}")


# @@NODE_END:mute_user_node@@

# @@NODE_START:unmute_user_node@@


# Unmute User Handler
# Код сгенерирован в generate-node-handlers.ts
@dp.message(Command("unmute_user"))
# Код сгенерирован в generate-node-handlers.ts
async def unmute_user_unmute_user_node_command_handler(message: types.Message):
    """
    Обработчик команды /unmute_user
    Работает в группах где бот имеет права администратора
    Использование: ответ на сообщение пользователя или указание ID
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Проверяем, что это группа
# Код сгенерирован в generate-node-handlers.ts
    if message.chat.type not in ['group', 'supergroup']:
        await message.answer("❌ Команда работает только в группах")
        return
    
    # Определяем целевого пользователя
    target_user_id = None
    
# Код сгенерирован в generate-node-handlers.ts
    if message.reply_to_message:
        target_user_id = message.reply_to_message.from_user.id
    else:
        # Пробуем найти упоминание пользователя в сообщении
# Код сгенерирован в generate-node-handlers.ts
        if message.entities:
            for entity in message.entities:
# Код сгенерирован в generate-node-handlers.ts
                if entity.type == "text_mention":
                    target_user_id = entity.user.id
                    break
# Код сгенерирован в generate-node-handlers.ts
        if not target_user_id:
            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия")
            return
    
# Код сгенерирован в generate-node-handlers.ts
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя для снятия ограничений")
        return
    
    try:
        # Снимаем ограничения с пользователя
        await bot.restrict_chat_member(
            chat_id=chat_id,
            user_id=target_user_id,
            permissions=types.ChatPermissions(
                can_send_messages=True,
                can_send_media_messages=True,
                can_send_polls=True,
                can_send_other_messages=True,
                can_add_web_page_previews=True,
                can_change_info=False,
                can_invite_users=False,
                can_pin_messages=False
            )
        )
        await message.answer(f"✅ Ограничения с пользователя {target_user_id} сняты")
        logging.info(f"Ограничения с пользователя {target_user_id} сняты администратором {user_id} в группе {chat_id}")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для снятия ограничений")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка снятия ограничений: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка при снятии ограничений: {e}")

# Код сгенерирован в generate-node-handlers.ts
@dp.message(lambda message: message.text and any(message.text.lower().startswith(word) for word in ["размутить", "разглушить", "анмут"]) and message.chat.type in ['group', 'supergroup'])
# Код сгенерирован в generate-node-handlers.ts
async def unmute_user_unmute_user_node_handler(message: types.Message):
    """
    Обработчик для снятия ограничений с пользователя
    Синонимы: размутить,разглушить,анмут
    Использование: ответ на сообщение пользователя или указание ID
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
# Код сгенерирован в generate-node-handlers.ts
    if message.reply_to_message:
        target_user_id = message.reply_to_message.from_user.id
    else:
        # Пробуем найти упоминание пользователя в сообщении
# Код сгенерирован в generate-node-handlers.ts
        if message.entities:
            for entity in message.entities:
# Код сгенерирован в generate-node-handlers.ts
                if entity.type == "text_mention":
                    target_user_id = entity.user.id
                    break
# Код сгенерирован в generate-node-handlers.ts
        if not target_user_id:
            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия")
            return
    
# Код сгенерирован в generate-node-handlers.ts
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя для снятия ограничений")
        return
    
    try:
        # Снимаем ограничения с пользователя
        await bot.restrict_chat_member(
            chat_id=chat_id,
            user_id=target_user_id,
            permissions=types.ChatPermissions(
                can_send_messages=True,
                can_send_media_messages=True,
                can_send_polls=True,
                can_send_other_messages=True,
                can_add_web_page_previews=True,
                can_change_info=False,
                can_invite_users=False,
                can_pin_messages=False
            )
        )
        await message.answer(f"✅ Ограничения с пользователя {target_user_id} сняты")
        logging.info(f"Ограничения с пользователя {target_user_id} сняты администратором {user_id} в группе {chat_id}")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для снятия ограничений")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка снятия ограничений: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка при снятии ограничений: {e}")


# @@NODE_END:unmute_user_node@@

# @@NODE_START:kick_user_node@@


# Kick User Handler
# Код сгенерирован в generate-node-handlers.ts
@dp.message(Command("kick_user"))
# Код сгенерирован в generate-node-handlers.ts
async def kick_user_kick_user_node_command_handler(message: types.Message):
    """
    Обработчик команды /kick_user
    Работает в группах где бот имеет права администратора
    Использование: ответ на сообщение пользователя или указание ID
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Проверяем, что это группа
# Код сгенерирован в generate-node-handlers.ts
    if message.chat.type not in ['group', 'supergroup']:
        await message.answer("❌ Команда работает только в группах")
        return
    
    # Определяем целевого пользователя
    target_user_id = None
    
# Код сгенерирован в generate-node-handlers.ts
    if message.reply_to_message:
        target_user_id = message.reply_to_message.from_user.id
    else:
        # Пробуем найти упоминание пользователя в сообщении
# Код сгенерирован в generate-node-handlers.ts
        if message.entities:
            for entity in message.entities:
# Код сгенерирован в generate-node-handlers.ts
                if entity.type == "text_mention":
                    target_user_id = entity.user.id
                    break
# Код сгенерирован в generate-node-handlers.ts
        if not target_user_id:
            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия")
            return
    
# Код сгенерирован в generate-node-handlers.ts
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя для исключения")
        return
    
    try:
        # Исключаем пользователя (ban + unban)
        await bot.ban_chat_member(
            chat_id=chat_id,
            user_id=target_user_id
        )
        
        # Немедленно разбаниваем, чтобы пользователь мог вернуться
        await bot.unban_chat_member(
            chat_id=chat_id,
            user_id=target_user_id,
            only_if_banned=True
        )
        
        await message.answer(f"✅ Пользователь {target_user_id} исключен из группы\nПричина: Нарушение правил группы")
        logging.info(f"Пользователь {target_user_id} исключен администратором {user_id} из группы {chat_id}")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для исключения пользователя")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка исключения пользователя: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка при исключении: {e}")

# Код сгенерирован в generate-node-handlers.ts
@dp.message(lambda message: message.text and any(message.text.lower().startswith(word) for word in ["кикнуть", "исключить", "выгнать"]) and message.chat.type in ['group', 'supergroup'])
# Код сгенерирован в generate-node-handlers.ts
async def kick_user_kick_user_node_handler(message: types.Message):
    """
    Обработчик для исключения пользователя из группы
    Синонимы: кикнуть,исключить,выгнать
    Работает в любых группах где бот имеет права администратора
    Использование: ответ на сообщение пользователя или указание ID
    """
    user_id = message.from_user.id
    chat_id = message.chat.id  # Автоматически определяем ID группы из контекста
    
    # Определяем целевого пользователя
    target_user_id = None
    
# Код сгенерирован в generate-node-handlers.ts
    if message.reply_to_message:
        target_user_id = message.reply_to_message.from_user.id
    else:
        # Пробуем найти упоминание пользователя в сообщении
# Код сгенерирован в generate-node-handlers.ts
        if message.entities:
            for entity in message.entities:
# Код сгенерирован в generate-node-handlers.ts
                if entity.type == "text_mention":
                    target_user_id = entity.user.id
                    break
# Код сгенерирован в generate-node-handlers.ts
        if not target_user_id:
            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия")
            return
    
# Код сгенерирован в generate-node-handlers.ts
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя для исключения")
        return
    
    try:
        # Исключаем пользователя из группы (кик)
        await bot.ban_chat_member(
            chat_id=chat_id,
            user_id=target_user_id,
            revoke_messages=False  # Не удаляем сообщения пользователя
        )
        
        # Добавляем небольшую задержку для корректной обработки
        import asyncio
        await asyncio.sleep(0.5)
        
        # Сразу же разбаниваем, чтобы пользователь мог зайти обратно
        await bot.unban_chat_member(
            chat_id=chat_id,
            user_id=target_user_id,
            only_if_banned=True
        )
        
        await message.answer(f"✅ Пользователь {target_user_id} исключен из группы\nПричина: Нарушение правил группы")
        logging.info(f"Пользователь {target_user_id} исключен администратором {user_id} из группы {chat_id}")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для исключения пользователя")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка исключения пользователя: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка при исключении: {e}")


# @@NODE_END:kick_user_node@@

# @@NODE_START:promote_user_node@@


# Promote User Handler
# Код сгенерирован в generate-node-handlers.ts
@dp.message(Command("promote_user"))
# Код сгенерирован в generate-node-handlers.ts
async def promote_user_promote_user_node_command_handler(message: types.Message):
    """
    Обработчик команды /promote_user
    Работает в группах где бот имеет права администратора
    Использование: ответ на сообщение пользователя или указание ID
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Проверяем, что это группа
# Код сгенерирован в generate-node-handlers.ts
    if message.chat.type not in ['group', 'supergroup']:
        await message.answer("❌ Команда работает только в группах")
        return
    
    # Определяем целевого пользователя
    target_user_id = None
    
# Код сгенерирован в generate-node-handlers.ts
    if message.reply_to_message:
        target_user_id = message.reply_to_message.from_user.id
    else:
        # Пробуем найти упоминание пользователя в сообщении
# Код сгенерирован в generate-node-handlers.ts
        if message.entities:
            for entity in message.entities:
# Код сгенерирован в generate-node-handlers.ts
                if entity.type == "text_mention":
                    target_user_id = entity.user.id
                    break
# Код сгенерирован в generate-node-handlers.ts
        if not target_user_id:
            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для повышения")
            return
    
# Код сгенерирован в generate-node-handlers.ts
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя для повышения")
        return
    
    try:
        # Повышаем пользователя до админа
        await bot.promote_chat_member(
            chat_id=chat_id,
            user_id=target_user_id,
            can_change_info=False,
            can_delete_messages=True,
            can_invite_users=True,
            can_restrict_members=False,
            can_pin_messages=True,
            can_promote_members=False,
            can_manage_video_chats=False,
            is_anonymous=False
        )
        await message.answer(f"✅ Пользователь {target_user_id} назначен администратором!")
        logging.info(f"Пользователь {target_user_id} назначен администратором {user_id} в группе {chat_id}")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e) or "RIGHT_FORBIDDEN" in str(e):
            await message.answer("❌ Недостаточно прав для назначения администраторов. Бот должен быть администратором с правом назначать других администраторов.")
        elif "USER_NOT_PARTICIPANT" in str(e):
            await message.answer("❌ Пользователь не является участником группы")
        elif "USER_ALREADY_PARTICIPANT" in str(e):
            await message.answer("❌ Пользователь уже является администратором")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка назначения админа: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка при назначении админа: {e}")

# Код сгенерирован в generate-node-handlers.ts
@dp.message(lambda message: message.text and any(message.text.lower().startswith(word) for word in ["повысить", "назначить админом", "промоут"]) and message.chat.type in ['group', 'supergroup'])
# Код сгенерирован в generate-node-handlers.ts
async def promote_user_promote_user_node_handler(message: types.Message):
    """
    Обработчик для назначения пользователя администратором
    Синонимы: повысить,назначить админом,промоут
    Работает в любых группах где бот имеет права администратора
    Использование: ответ на сообщение пользователя или указание ID
    """
    user_id = message.from_user.id
    chat_id = message.chat.id  # Автоматически определяем ID группы из контекста
    
    # Определяем целевого пользователя
    target_user_id = None
    
# Код сгенерирован в generate-node-handlers.ts
    if message.reply_to_message:
        target_user_id = message.reply_to_message.from_user.id
    else:
        # Пробуем найти упоминание пользователя в сообщении
# Код сгенерирован в generate-node-handlers.ts
        if message.entities:
            for entity in message.entities:
# Код сгенерирован в generate-node-handlers.ts
                if entity.type == "text_mention":
                    target_user_id = entity.user.id
                    break
# Код сгенерирован в generate-node-handlers.ts
        if not target_user_id:
            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия")
            return
    
# Код сгенерирован в generate-node-handlers.ts
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя для назначения администратором")
        return
    
    try:
        # Назначаем пользователя администратором
        await bot.promote_chat_member(
            chat_id=chat_id,
            user_id=target_user_id,
            can_change_info=False,
            can_delete_messages=True,
            can_invite_users=True,
            can_restrict_members=False,
            can_pin_messages=True,
            can_promote_members=False,
            can_manage_video_chats=False,
            is_anonymous=False
        )
        
        # Создаем список предоставленных прав
        rights = []
        rights.append("удаление сообщений")
        rights.append("приглашение пользователей")
        rights.append("закрепление сообщений")
        rights_text = ", ".join(rights) if rights else "базовые права администратора"
        
        await message.answer(f"✅ Пользователь {target_user_id} назначен администратором\nПрава: {rights_text}")
        logging.info(f"Пользователь {target_user_id} назначен администратором пользователем {user_id} в группе {chat_id}")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e) or "RIGHT_FORBIDDEN" in str(e):
            await message.answer("❌ Недостаточно прав для назначения администратора. Бот должен быть администратором с правом назначать других администраторов.")
        elif "USER_NOT_PARTICIPANT" in str(e):
            await message.answer("❌ Пользователь не является участником группы")
        elif "USER_ALREADY_PARTICIPANT" in str(e):
            await message.answer("❌ Пользователь уже является администратором")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка назначения администратора: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка при назначении администратора: {e}")


# @@NODE_END:promote_user_node@@

# @@NODE_START:demote_user_node@@


# Demote User Handler
# Код сгенерирован в generate-node-handlers.ts
@dp.message(Command("demote_user"))
# Код сгенерирован в generate-node-handlers.ts
async def demote_user_demote_user_node_command_handler(message: types.Message):
    """
    Обработчик команды /demote_user
    Работает в группах где бот имеет права администратора
    Использование: ответ на сообщение пользователя или указание ID
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Проверяем, что это группа
# Код сгенерирован в generate-node-handlers.ts
    if message.chat.type not in ['group', 'supergroup']:
        await message.answer("❌ Команда работает только в группах")
        return
    
    # Определяем целевого пользователя
    target_user_id = None
    
# Код сгенерирован в generate-node-handlers.ts
    if message.reply_to_message:
        target_user_id = message.reply_to_message.from_user.id
    else:
        # Пробуем найти упоминание пользователя в сообщении
# Код сгенерирован в generate-node-handlers.ts
        if message.entities:
            for entity in message.entities:
# Код сгенерирован в generate-node-handlers.ts
                if entity.type == "text_mention":
                    target_user_id = entity.user.id
                    break
# Код сгенерирован в generate-node-handlers.ts
        if not target_user_id:
            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для понижения")
            return
    
# Код сгенерирован в generate-node-handlers.ts
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя для понижения")
        return
    
    try:
        # Понижаем пользователя - убираем все права админа
        await bot.promote_chat_member(
            chat_id=chat_id,
            user_id=target_user_id,
            can_change_info=False,
            can_delete_messages=False,
            can_invite_users=False,
            can_restrict_members=False,
            can_pin_messages=False,
            can_promote_members=False,
            can_manage_video_chats=False,
            can_manage_topics=False,
            is_anonymous=False
        )
        await message.answer(f"✅ Пользователь {target_user_id} снят с должности администратора!")
        logging.info(f"Пользователь {target_user_id} понижен администратором {user_id} в группе {chat_id}")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для понижения администраторов")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка понижения админа: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка при понижении админа: {e}")

# Код сгенерирован в generate-node-handlers.ts
@dp.message(lambda message: message.text and any(message.text.lower().startswith(word) for word in ["понизить", "снять с админа", "демоут"]) and message.chat.type in ['group', 'supergroup'])
# Код сгенерирован в generate-node-handlers.ts
async def demote_user_demote_user_node_handler(message: types.Message):
    """
    Обработчик для снятия прав администратора с пользователя
    Синонимы: понизить,снять с админа,демоут
    Работает в любых группах где бот имеет права администратора
    Использование: ответ на сообщение пользователя или указание ID
    """
    user_id = message.from_user.id
    chat_id = message.chat.id  # Автоматически определяем ID группы из контекста
    
    # Определяем целевого пользователя
    target_user_id = None
    
# Код сгенерирован в generate-node-handlers.ts
    if message.reply_to_message:
        target_user_id = message.reply_to_message.from_user.id
    else:
        # Пробуем найти упоминание пользователя в сообщении
# Код сгенерирован в generate-node-handlers.ts
        if message.entities:
            for entity in message.entities:
# Код сгенерирован в generate-node-handlers.ts
                if entity.type == "text_mention":
                    target_user_id = entity.user.id
                    break
# Код сгенерирован в generate-node-handlers.ts
        if not target_user_id:
            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия")
            return
    
# Код сгенерирован в generate-node-handlers.ts
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя для снятия прав администратора")
        return
    
    try:
        # Снимаем права администратора
        await bot.promote_chat_member(
            chat_id=chat_id,
            user_id=target_user_id,
            can_change_info=False,
            can_delete_messages=False,
            can_invite_users=False,
            can_restrict_members=False,
            can_pin_messages=False,
            can_promote_members=False,
            can_manage_video_chats=False,
            can_manage_topics=False,
            is_anonymous=False
        )
        
        await message.answer(f"✅ Права администратора сняты с пользователя {target_user_id}")
        logging.info(f"Права администратора сняты с пользователя {target_user_id} пользователем {user_id} в группе {chat_id}")
    except TelegramBadRequest as e:
# Код сгенерирован в generate-node-handlers.ts
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для снятия прав администратора")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка снятия прав администратора: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка при снятии прав администратора: {e}")


# @@NODE_END:demote_user_node@@

# @@NODE_START:admin_rights_node@@


# Interactive Admin Rights Handler for admin_rights_node
# Код сгенерирован в generate-node-handlers.ts
@dp.message(Command("admin_rights"))
# Код сгенерирован в generate-node-handlers.ts
async def admin_rights_node_command_handler(message: types.Message, bot):
    """
    Основной обработчик команды /admin_rights
    Автоматически определяет целевого пользователя из контекста
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    target_user_id = None
    
    logging.info(f"Команда admin_rights вызвана пользователем {user_id} в чате {chat_id}")
    
    # Проверяем права вызывающего пользователя
    try:
        current_user_member = await bot.get_chat_member(chat_id, user_id)
# Код сгенерирован в generate-node-handlers.ts
        if current_user_member.status not in ['administrator', 'creator']:
            await message.answer("❌ У вас нет прав администратора для использования этой команды")
            return
        
# Код сгенерирован в generate-node-handlers.ts
        if current_user_member.status != 'creator' and not getattr(current_user_member, 'can_promote_members', False):
            await message.answer("❌ У вас нет права на управление правами других администраторов")
            return
    except Exception as e:
        await message.answer(f"❌ Ошибка при проверке ваших прав: {e}")
        return
    
    # Автоматическое определение целевого пользователя
    
    # 1. Проверяем, есть ли ответ на сообщение
# Код сгенерирован в generate-node-handlers.ts
    if message.reply_to_message and message.reply_to_message.from_user:
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Целевой пользователь определен из ответа на сообщение: {target_user_id}")
    
    # 2. Проверяем, есть ли упоминание в тексте (@username или прямое упоминание)
    elif message.entities:
        for entity in message.entities:
            # Приоритет - прямое упоминание с объектом пользователя
# Код сгенерирован в generate-node-handlers.ts
            if entity.type == "text_mention" and hasattr(entity, 'user'):
                target_user_id = entity.user.id
                logging.info(f"Целевой пользователь определен из прямого упоминания: {target_user_id}")
                break
            elif entity.type == "mention":
                # Извлекаем username из упоминания
                username = message.text[entity.offset+1:entity.offset+entity.length]  # +1 чтобы убрать @
                try:
                    # Пытаемся найти пользователя по username через участников чата
                    chat_admins = await bot.get_chat_administrators(chat_id)
                    for member in chat_admins:
# Код сгенерирован в generate-node-handlers.ts
                        if member.user.username and member.user.username.lower() == username.lower():
                            target_user_id = member.user.id
                            logging.info(f"Целевой пользователь определен из упоминания @{username}: {target_user_id}")
                            break
                except Exception as e:
                    logging.warning(f"Не удалось найти пользователя @{username}: {e}")
                break
    
    # 3. Проверяем, есть ли ID в тексте команды
# Код сгенерирован в generate-node-handlers.ts
    if target_user_id is None:
        # Ищем числовой ID в аргументах команды
        import re
        # Извлекаем все числа из текста команды (исключая сам command)
        command_text = message.text or ""
        numbers = re.findall(r'\b\d{6,}\b', command_text)  # ID обычно 6+ цифр
        
        for number_str in numbers:
            try:
                potential_user_id = int(number_str)
                # Проверяем, что это валидный пользователь в чате
                try:
                    member_check = await bot.get_chat_member(chat_id, potential_user_id)
                    target_user_id = potential_user_id
                    logging.info(f"Целевой пользователь определен из ID в команде: {target_user_id}")
                    break
                except Exception:
                    logging.debug(f"ID {potential_user_id} не найден в чате, попробуем следующий")
                    continue
            except ValueError:
                continue
    
    # Если целевой пользователь не определен, показываем инструкцию
# Код сгенерирован в generate-node-handlers.ts
    if target_user_id is None:
        await message.answer(
            "❓ Укажите пользователя для управления правами:\n"
            "• Ответьте на сообщение пользователя\n"
            "• Упомяните пользователя: /admin_rights @username\n"
            "• Укажите ID: /admin_rights 123456789"
        )
        return
    
    # Проверяем, что целевой пользователь является администратором
    try:
        target_member = await bot.get_chat_member(chat_id, target_user_id)
# Код сгенерирован в generate-node-handlers.ts
        if target_member.status not in ['administrator', 'creator']:
            await message.answer("❌ Указанный пользователь не является администратором")
            return
    except Exception as e:
        await message.answer(f"❌ Не удалось проверить пользователя: {e}")
        return
    
    # Создаем и отправляем интерактивную клавиатуру
    keyboard = await create_admin_rights_keyboard_admin_rights_node(bot, chat_id, target_user_id)
    text = """⚙️ Права администратора настроены для пользователя!

💡 Чтобы настроить права, ответьте на сообщение пользователя и используйте команду /admin_rights"""
    # Инициализируем базовые переменные пользователя если их нет
# Код сгенерирован в generate-node-handlers.ts
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Безопасно проверяем наличие message (для message handlers)
# Код сгенерирован в generate-node-handlers.ts
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Безопасно проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user

# Код сгенерирован в generate-node-handlers.ts
        if user_obj:
            init_user_variables(user_id, user_obj)
    
    # Подставляем все доступные переменные пользователя в текст
    user_vars = await get_user_from_db(user_id)
# Код сгенерирован в generate-node-handlers.ts
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    
    # get_user_from_db теперь возвращает уже обработанные user_data
# Код сгенерирован в generate-node-handlers.ts
    if not isinstance(user_vars, dict):
        user_vars = user_data.get(user_id, {})
    
    
    await message.answer(text, reply_markup=keyboard)

# Код сгенерирован в generate-node-handlers.ts
async def get_admin_rights_admin_rights_node(bot, chat_id, target_user_id):
    """
    Получает текущие права администратора пользователя в чате
    """
    try:
        member = await bot.get_chat_member(chat_id, target_user_id)
# Код сгенерирован в generate-node-handlers.ts
        if hasattr(member, 'status') and member.status in ['administrator', 'creator']:
            # Возвращаем основные права администратора включая управление историями
            return {
                'can_change_info': getattr(member, 'can_change_info', False),
                'can_delete_messages': getattr(member, 'can_delete_messages', False),
                'can_restrict_members': getattr(member, 'can_restrict_members', False),
                'can_invite_users': getattr(member, 'can_invite_users', False),
                'can_pin_messages': getattr(member, 'can_pin_messages', False),
                'can_manage_video_chats': getattr(member, 'can_manage_video_chats', False),
                'can_post_stories': getattr(member, 'can_post_stories', False),
                'can_edit_stories': getattr(member, 'can_edit_stories', False),
                'can_delete_stories': getattr(member, 'can_delete_stories', False),
                'is_anonymous': getattr(member, 'is_anonymous', False),
                'can_promote_members': getattr(member, 'can_promote_members', False)
            }
        else:
            # Пользователь не является администратором
            return None
    except Exception as e:
        logging.error(f"Ошибка при получении прав администратора: {e}")
        return None

# Код сгенерирован в generate-node-handlers.ts
async def create_admin_rights_keyboard_admin_rights_node(bot, chat_id, target_user_id, node_id="admin_rights_node"):
    """
    Создает интерактивную клавиатуру с кнопками-переключателями прав
    """
    # Получаем текущие права
    current_rights = await get_admin_rights_admin_rights_node(bot, chat_id, target_user_id)
    
    builder = InlineKeyboardBuilder()
    
# Код сгенерирован в generate-node-handlers.ts
    if current_rights is None:
        # Пользователь не администратор
        builder.add(InlineKeyboardButton(text="❌ Пользователь не является администратором", callback_data="no_admin"))
        return builder.as_markup()
    
    # Список основных прав администратора включая управление историями
    admin_rights_list = [
        ('can_change_info', '🏷️ Изменение профиля'),
        ('can_delete_messages', '🗑️ Удаление сообщений'),
        ('can_restrict_members', '🚫 Блокировка участников'),
        ('can_invite_users', '📨 Приглашение участников'),
        ('can_pin_messages', '📌 Закрепление сообщений'),
        ('can_manage_video_chats', '🎥 Управление видеочатами'),
        ('can_post_stories', '📰 Публикация историй'),
        ('can_edit_stories', '✏️ Редактирование историй'),
        ('can_delete_stories', '🗑️ Удаление историй'),
        ('is_anonymous', '🔒 Анонимность'),
        ('can_promote_members', '👑 Назначение администраторов')
    ]
    
    # Создаем кнопки с индикаторами состояния
    for right_key, right_name in admin_rights_list:
        is_enabled = current_rights.get(right_key, False)
        indicator = "✅" if is_enabled else "❌"
        button_text = f"{indicator} {right_name}"
        # Укорачиваем callback_data для соблюдения лимита Telegram (64 байта)
        short_node_id = str(hash(node_id))[-6:]  # Берем последние 6 символов хэша
        callback_data = f"tr_{right_key[:12]}_{target_user_id}_{short_node_id}"
        builder.add(InlineKeyboardButton(text=button_text, callback_data=callback_data))
    
    # Кнопка для обновления состояния (с коротким callback_data)
    short_node_id = str(hash(node_id))[-6:]  # Берем последние 6 символов хэша
    builder.add(InlineKeyboardButton(text="🔄 Обновить", callback_data=f"ref_{target_user_id}_{short_node_id}"))
    
    builder.adjust(1)  # Располагаем кнопки в одну колонку для лучшей читаемости
    return builder.as_markup()

# Код сгенерирован в generate-node-handlers.ts
@dp.callback_query(lambda c: c.data == "admin_rights_node")
# Код сгенерирован в generate-node-handlers.ts
async def handle_callback_admin_rights_node(callback_query: types.CallbackQuery, bot):
    """
    Обработчик callback для узла admin_rights: admin_rights_node
    Отображает интерактивную клавиатуру для управления правами администратора
    """
    await callback_query.answer()
    user_id = callback_query.from_user.id
    chat_id = callback_query.message.chat.id
    
    logging.info(f"Обработка callback admin_rights от пользователя {user_id} в чате {chat_id}")
    
    # Проверяем права БОТА (не пользователя) на управление правами администраторов
    try:
        bot_member = await bot.get_chat_member(chat_id, bot.id)
# Код сгенерирован в generate-node-handlers.ts
        if bot_member.status not in ['administrator', 'creator']:
            await safe_edit_or_send(callback_query, "❌ Бот не является администратором этой группы")
            return
        
        # Проверяем, может ли бот управлять правами других администраторов
# Код сгенерирован в generate-node-handlers.ts
        if bot_member.status != 'creator' and not getattr(bot_member, 'can_promote_members', False):
            await safe_edit_or_send(callback_query, "❌ У бота нет права на управление правами администраторов")
            return
    except Exception as e:
        logging.error(f"Ошибка при проверке прав администратора: {e}")
        await safe_edit_or_send(callback_query, "❌ Не удалось проверить права администратора. Попробуйте позже.")
        return
    
    # Получаем target_user_id (пользователя, чьи права будем менять)
    # В данном случае, мы будем управлять правами пользователя, который вызвал команду
    # Но это можно изменить для работы с replied сообщениями
    target_user_id = user_id  # По умолчанию управляем своими правами
    
    # Если это ответ на сообщение, берем пользователя из ответа
# Код сгенерирован в generate-node-handlers.ts
    if hasattr(callback_query.message, 'reply_to_message') and callback_query.message.reply_to_message:
        target_user_id = callback_query.message.reply_to_message.from_user.id
        logging.info(f"Управляем правами пользователя {target_user_id} из ответа на сообщение")
    
    # Текст сообщения
    text = """⚙️ Права администратора настроены для пользователя!

💡 Чтобы настроить права, ответьте на сообщение пользователя и используйте команду /admin_rights"""
    # Инициализируем базовые переменные пользователя если их нет
# Код сгенерирован в generate-node-handlers.ts
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Безопасно проверяем наличие message (для message handlers)
# Код сгенерирован в generate-node-handlers.ts
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Безопасно проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user

# Код сгенерирован в generate-node-handlers.ts
        if user_obj:
            init_user_variables(user_id, user_obj)
    
    # Подставляем все доступные переменные пользователя в текст
    user_vars = await get_user_from_db(user_id)
# Код сгенерирован в generate-node-handlers.ts
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    
    # get_user_from_db теперь возвращает уже обработанные user_data
# Код сгенерирован в generate-node-handlers.ts
    if not isinstance(user_vars, dict):
        user_vars = user_data.get(user_id, {})
    
    
    # Создаем интерактивную клавиатуру
    keyboard = await create_admin_rights_keyboard_admin_rights_node(bot, chat_id, target_user_id)
    
    # Отправляем/обновляем сообщение с клавиатурой
    try:
        # Пробуем отредактировать сообщение (работает для inline callbacks)
        await safe_edit_or_send(callback_query, text, reply_markup=keyboard)
    except Exception as e:
        # Если не удалось отредактировать (например, для text commands), отправляем новое сообщение
        logging.info(f"Отправляем новое сообщение admin_rights: {e}")
        await callback_query.message.answer(text, reply_markup=keyboard)


# Обработчик переключения права: can_change_info
# Код сгенерирован в generate-node-handlers.ts
@dp.callback_query(lambda c: c.data.startswith("tr_can_change_i_"))
# Код сгенерирован в generate-node-handlers.ts
async def toggle_can_change_info_admin_rights_node(callback_query: types.CallbackQuery, bot):
    """
    Переключает право can_change_info для пользователя
    """
    await callback_query.answer()
    
    # Парсим данные из callback_data: tr_<right>_<user_id>_<node_hash>
    try:
        data_parts = callback_query.data.split('_')
        # Формат: ['tr', '<right_name>', '<user_id>', '<node_hash>']
# Код сгенерирован в generate-node-handlers.ts
        if len(data_parts) < 4:
            raise ValueError("Недостаточно частей в callback_data")
        target_user_id = int(data_parts[-2])
        node_hash = data_parts[-1]
        logging.info(f"Переключаем право can_change_info для пользователя {target_user_id}")
    except (ValueError, IndexError) as e:
        logging.error(f"Ошибка парсинга callback_data: {callback_query.data}, ошибка: {e}")
        await callback_query.answer("❌ Ошибка в данных кнопки")
        return
    
    user_id = callback_query.from_user.id
    chat_id = callback_query.message.chat.id
    
    try:
        # Проверяем права БОТА на управление правами администраторов
        bot_member = await bot.get_chat_member(chat_id, bot.id)
# Код сгенерирован в generate-node-handlers.ts
        if bot_member.status not in ['administrator', 'creator']:
            await safe_edit_or_send(callback_query, "❌ Бот не является администратором этой группы")
            return
            
# Код сгенерирован в generate-node-handlers.ts
        if bot_member.status != 'creator' and not getattr(bot_member, 'can_promote_members', False):
            await safe_edit_or_send(callback_query, "❌ У бота нет права на управление правами администраторов")
            return
        
        # Получаем текущие права целевого пользователя
        target_member = await bot.get_chat_member(chat_id, target_user_id)
# Код сгенерирован в generate-node-handlers.ts
        if target_member.status not in ['administrator', 'creator']:
            await safe_edit_or_send(callback_query, "❌ Целевой пользователь не является администратором")
            return
        
        # Получаем текущее состояние права
        current_value = getattr(target_member, 'can_change_info', False)
        new_value = not current_value
        
        # Подготавливаем права для обновления
        permissions = {
            'can_change_info': getattr(target_member, 'can_change_info', False),
            'can_delete_messages': getattr(target_member, 'can_delete_messages', False),
            'can_restrict_members': getattr(target_member, 'can_restrict_members', False),
            'can_invite_users': getattr(target_member, 'can_invite_users', False),
            'can_pin_messages': getattr(target_member, 'can_pin_messages', False),
            'can_manage_video_chats': getattr(target_member, 'can_manage_video_chats', False),
            'can_post_stories': getattr(target_member, 'can_post_stories', False),
            'can_edit_stories': getattr(target_member, 'can_edit_stories', False),
            'can_delete_stories': getattr(target_member, 'can_delete_stories', False),
            'is_anonymous': getattr(target_member, 'is_anonymous', False),
            'can_promote_members': getattr(target_member, 'can_promote_members', False),
        }
        permissions['can_change_info'] = new_value
        
        # Применяем изменения
        await bot.promote_chat_member(
            chat_id=chat_id,
            user_id=target_user_id,
            can_change_info=permissions['can_change_info'],
            can_delete_messages=permissions['can_delete_messages'],
            can_restrict_members=permissions['can_restrict_members'],
            can_invite_users=permissions['can_invite_users'],
            can_pin_messages=permissions['can_pin_messages'],
            can_manage_video_chats=permissions['can_manage_video_chats'],
            can_post_stories=permissions['can_post_stories'],
            can_edit_stories=permissions['can_edit_stories'],
            can_delete_stories=permissions['can_delete_stories'],
            is_anonymous=permissions['is_anonymous'],
            can_promote_members=permissions['can_promote_members'],
        )
        
        # Обновляем клавиатуру с новым состоянием
        keyboard = await create_admin_rights_keyboard_admin_rights_node(bot, chat_id, target_user_id)
        
        # Обновляем сообщение
        text = "⚙️ Управление правами администратора"
        await safe_edit_or_send(callback_query, text, reply_markup=keyboard)
        
        logging.info(f"Пользователь {user_id} {'включил' if new_value else 'отключил'} право 'can_change_info' для пользователя {target_user_id}")
        
    except Exception as e:
        logging.error(f"Ошибка при переключении права can_change_info: {e}")
        await safe_edit_or_send(callback_query, "❌ Не удалось изменить права администратора. Попробуйте позже.")

# Обработчик переключения права: can_delete_messages
# Код сгенерирован в generate-node-handlers.ts
@dp.callback_query(lambda c: c.data.startswith("tr_can_delete_m_"))
# Код сгенерирован в generate-node-handlers.ts
async def toggle_can_delete_messages_admin_rights_node(callback_query: types.CallbackQuery, bot):
    """
    Переключает право can_delete_messages для пользователя
    """
    await callback_query.answer()
    
    # Парсим данные из callback_data: tr_<right>_<user_id>_<node_hash>
    try:
        data_parts = callback_query.data.split('_')
        # Формат: ['tr', '<right_name>', '<user_id>', '<node_hash>']
# Код сгенерирован в generate-node-handlers.ts
        if len(data_parts) < 4:
            raise ValueError("Недостаточно частей в callback_data")
        target_user_id = int(data_parts[-2])
        node_hash = data_parts[-1]
        logging.info(f"Переключаем право can_delete_messages для пользователя {target_user_id}")
    except (ValueError, IndexError) as e:
        logging.error(f"Ошибка парсинга callback_data: {callback_query.data}, ошибка: {e}")
        await callback_query.answer("❌ Ошибка в данных кнопки")
        return
    
    user_id = callback_query.from_user.id
    chat_id = callback_query.message.chat.id
    
    try:
        # Проверяем права БОТА на управление правами администраторов
        bot_member = await bot.get_chat_member(chat_id, bot.id)
# Код сгенерирован в generate-node-handlers.ts
        if bot_member.status not in ['administrator', 'creator']:
            await safe_edit_or_send(callback_query, "❌ Бот не является администратором этой группы")
            return
            
# Код сгенерирован в generate-node-handlers.ts
        if bot_member.status != 'creator' and not getattr(bot_member, 'can_promote_members', False):
            await safe_edit_or_send(callback_query, "❌ У бота нет права на управление правами администраторов")
            return
        
        # Получаем текущие права целевого пользователя
        target_member = await bot.get_chat_member(chat_id, target_user_id)
# Код сгенерирован в generate-node-handlers.ts
        if target_member.status not in ['administrator', 'creator']:
            await safe_edit_or_send(callback_query, "❌ Целевой пользователь не является администратором")
            return
        
        # Получаем текущее состояние права
        current_value = getattr(target_member, 'can_delete_messages', False)
        new_value = not current_value
        
        # Подготавливаем права для обновления
        permissions = {
            'can_change_info': getattr(target_member, 'can_change_info', False),
            'can_delete_messages': getattr(target_member, 'can_delete_messages', False),
            'can_restrict_members': getattr(target_member, 'can_restrict_members', False),
            'can_invite_users': getattr(target_member, 'can_invite_users', False),
            'can_pin_messages': getattr(target_member, 'can_pin_messages', False),
            'can_manage_video_chats': getattr(target_member, 'can_manage_video_chats', False),
            'can_post_stories': getattr(target_member, 'can_post_stories', False),
            'can_edit_stories': getattr(target_member, 'can_edit_stories', False),
            'can_delete_stories': getattr(target_member, 'can_delete_stories', False),
            'is_anonymous': getattr(target_member, 'is_anonymous', False),
            'can_promote_members': getattr(target_member, 'can_promote_members', False),
        }
        permissions['can_delete_messages'] = new_value
        
        # Применяем изменения
        await bot.promote_chat_member(
            chat_id=chat_id,
            user_id=target_user_id,
            can_change_info=permissions['can_change_info'],
            can_delete_messages=permissions['can_delete_messages'],
            can_restrict_members=permissions['can_restrict_members'],
            can_invite_users=permissions['can_invite_users'],
            can_pin_messages=permissions['can_pin_messages'],
            can_manage_video_chats=permissions['can_manage_video_chats'],
            can_post_stories=permissions['can_post_stories'],
            can_edit_stories=permissions['can_edit_stories'],
            can_delete_stories=permissions['can_delete_stories'],
            is_anonymous=permissions['is_anonymous'],
            can_promote_members=permissions['can_promote_members'],
        )
        
        # Обновляем клавиатуру с новым состоянием
        keyboard = await create_admin_rights_keyboard_admin_rights_node(bot, chat_id, target_user_id)
        
        # Обновляем сообщение
        text = "⚙️ Управление правами администратора"
        await safe_edit_or_send(callback_query, text, reply_markup=keyboard)
        
        logging.info(f"Пользователь {user_id} {'включил' if new_value else 'отключил'} право 'can_delete_messages' для пользователя {target_user_id}")
        
    except Exception as e:
        logging.error(f"Ошибка при переключении права can_delete_messages: {e}")
        await safe_edit_or_send(callback_query, "❌ Не удалось изменить права администратора. Попробуйте позже.")

# Обработчик переключения права: can_restrict_members
# Код сгенерирован в generate-node-handlers.ts
@dp.callback_query(lambda c: c.data.startswith("tr_can_restrict_"))
# Код сгенерирован в generate-node-handlers.ts
async def toggle_can_restrict_members_admin_rights_node(callback_query: types.CallbackQuery, bot):
    """
    Переключает право can_restrict_members для пользователя
    """
    await callback_query.answer()
    
    # Парсим данные из callback_data: tr_<right>_<user_id>_<node_hash>
    try:
        data_parts = callback_query.data.split('_')
        # Формат: ['tr', '<right_name>', '<user_id>', '<node_hash>']
# Код сгенерирован в generate-node-handlers.ts
        if len(data_parts) < 4:
            raise ValueError("Недостаточно частей в callback_data")
        target_user_id = int(data_parts[-2])
        node_hash = data_parts[-1]
        logging.info(f"Переключаем право can_restrict_members для пользователя {target_user_id}")
    except (ValueError, IndexError) as e:
        logging.error(f"Ошибка парсинга callback_data: {callback_query.data}, ошибка: {e}")
        await callback_query.answer("❌ Ошибка в данных кнопки")
        return
    
    user_id = callback_query.from_user.id
    chat_id = callback_query.message.chat.id
    
    try:
        # Проверяем права БОТА на управление правами администраторов
        bot_member = await bot.get_chat_member(chat_id, bot.id)
# Код сгенерирован в generate-node-handlers.ts
        if bot_member.status not in ['administrator', 'creator']:
            await safe_edit_or_send(callback_query, "❌ Бот не является администратором этой группы")
            return
            
# Код сгенерирован в generate-node-handlers.ts
        if bot_member.status != 'creator' and not getattr(bot_member, 'can_promote_members', False):
            await safe_edit_or_send(callback_query, "❌ У бота нет права на управление правами администраторов")
            return
        
        # Получаем текущие права целевого пользователя
        target_member = await bot.get_chat_member(chat_id, target_user_id)
# Код сгенерирован в generate-node-handlers.ts
        if target_member.status not in ['administrator', 'creator']:
            await safe_edit_or_send(callback_query, "❌ Целевой пользователь не является администратором")
            return
        
        # Получаем текущее состояние права
        current_value = getattr(target_member, 'can_restrict_members', False)
        new_value = not current_value
        
        # Подготавливаем права для обновления
        permissions = {
            'can_change_info': getattr(target_member, 'can_change_info', False),
            'can_delete_messages': getattr(target_member, 'can_delete_messages', False),
            'can_restrict_members': getattr(target_member, 'can_restrict_members', False),
            'can_invite_users': getattr(target_member, 'can_invite_users', False),
            'can_pin_messages': getattr(target_member, 'can_pin_messages', False),
            'can_manage_video_chats': getattr(target_member, 'can_manage_video_chats', False),
            'can_post_stories': getattr(target_member, 'can_post_stories', False),
            'can_edit_stories': getattr(target_member, 'can_edit_stories', False),
            'can_delete_stories': getattr(target_member, 'can_delete_stories', False),
            'is_anonymous': getattr(target_member, 'is_anonymous', False),
            'can_promote_members': getattr(target_member, 'can_promote_members', False),
        }
        permissions['can_restrict_members'] = new_value
        
        # Применяем изменения
        await bot.promote_chat_member(
            chat_id=chat_id,
            user_id=target_user_id,
            can_change_info=permissions['can_change_info'],
            can_delete_messages=permissions['can_delete_messages'],
            can_restrict_members=permissions['can_restrict_members'],
            can_invite_users=permissions['can_invite_users'],
            can_pin_messages=permissions['can_pin_messages'],
            can_manage_video_chats=permissions['can_manage_video_chats'],
            can_post_stories=permissions['can_post_stories'],
            can_edit_stories=permissions['can_edit_stories'],
            can_delete_stories=permissions['can_delete_stories'],
            is_anonymous=permissions['is_anonymous'],
            can_promote_members=permissions['can_promote_members'],
        )
        
        # Обновляем клавиатуру с новым состоянием
        keyboard = await create_admin_rights_keyboard_admin_rights_node(bot, chat_id, target_user_id)
        
        # Обновляем сообщение
        text = "⚙️ Управление правами администратора"
        await safe_edit_or_send(callback_query, text, reply_markup=keyboard)
        
        logging.info(f"Пользователь {user_id} {'включил' if new_value else 'отключил'} право 'can_restrict_members' для пользователя {target_user_id}")
        
    except Exception as e:
        logging.error(f"Ошибка при переключении права can_restrict_members: {e}")
        await safe_edit_or_send(callback_query, "❌ Не удалось изменить права администратора. Попробуйте позже.")

# Обработчик переключения права: can_invite_users
# Код сгенерирован в generate-node-handlers.ts
@dp.callback_query(lambda c: c.data.startswith("tr_can_invite_u_"))
# Код сгенерирован в generate-node-handlers.ts
async def toggle_can_invite_users_admin_rights_node(callback_query: types.CallbackQuery, bot):
    """
    Переключает право can_invite_users для пользователя
    """
    await callback_query.answer()
    
    # Парсим данные из callback_data: tr_<right>_<user_id>_<node_hash>
    try:
        data_parts = callback_query.data.split('_')
        # Формат: ['tr', '<right_name>', '<user_id>', '<node_hash>']
# Код сгенерирован в generate-node-handlers.ts
        if len(data_parts) < 4:
            raise ValueError("Недостаточно частей в callback_data")
        target_user_id = int(data_parts[-2])
        node_hash = data_parts[-1]
        logging.info(f"Переключаем право can_invite_users для пользователя {target_user_id}")
    except (ValueError, IndexError) as e:
        logging.error(f"Ошибка парсинга callback_data: {callback_query.data}, ошибка: {e}")
        await callback_query.answer("❌ Ошибка в данных кнопки")
        return
    
    user_id = callback_query.from_user.id
    chat_id = callback_query.message.chat.id
    
    try:
        # Проверяем права БОТА на управление правами администраторов
        bot_member = await bot.get_chat_member(chat_id, bot.id)
# Код сгенерирован в generate-node-handlers.ts
        if bot_member.status not in ['administrator', 'creator']:
            await safe_edit_or_send(callback_query, "❌ Бот не является администратором этой группы")
            return
            
# Код сгенерирован в generate-node-handlers.ts
        if bot_member.status != 'creator' and not getattr(bot_member, 'can_promote_members', False):
            await safe_edit_or_send(callback_query, "❌ У бота нет права на управление правами администраторов")
            return
        
        # Получаем текущие права целевого пользователя
        target_member = await bot.get_chat_member(chat_id, target_user_id)
# Код сгенерирован в generate-node-handlers.ts
        if target_member.status not in ['administrator', 'creator']:
            await safe_edit_or_send(callback_query, "❌ Целевой пользователь не является администратором")
            return
        
        # Получаем текущее состояние права
        current_value = getattr(target_member, 'can_invite_users', False)
        new_value = not current_value
        
        # Подготавливаем права для обновления
        permissions = {
            'can_change_info': getattr(target_member, 'can_change_info', False),
            'can_delete_messages': getattr(target_member, 'can_delete_messages', False),
            'can_restrict_members': getattr(target_member, 'can_restrict_members', False),
            'can_invite_users': getattr(target_member, 'can_invite_users', False),
            'can_pin_messages': getattr(target_member, 'can_pin_messages', False),
            'can_manage_video_chats': getattr(target_member, 'can_manage_video_chats', False),
            'can_post_stories': getattr(target_member, 'can_post_stories', False),
            'can_edit_stories': getattr(target_member, 'can_edit_stories', False),
            'can_delete_stories': getattr(target_member, 'can_delete_stories', False),
            'is_anonymous': getattr(target_member, 'is_anonymous', False),
            'can_promote_members': getattr(target_member, 'can_promote_members', False),
        }
        permissions['can_invite_users'] = new_value
        
        # Применяем изменения
        await bot.promote_chat_member(
            chat_id=chat_id,
            user_id=target_user_id,
            can_change_info=permissions['can_change_info'],
            can_delete_messages=permissions['can_delete_messages'],
            can_restrict_members=permissions['can_restrict_members'],
            can_invite_users=permissions['can_invite_users'],
            can_pin_messages=permissions['can_pin_messages'],
            can_manage_video_chats=permissions['can_manage_video_chats'],
            can_post_stories=permissions['can_post_stories'],
            can_edit_stories=permissions['can_edit_stories'],
            can_delete_stories=permissions['can_delete_stories'],
            is_anonymous=permissions['is_anonymous'],
            can_promote_members=permissions['can_promote_members'],
        )
        
        # Обновляем клавиатуру с новым состоянием
        keyboard = await create_admin_rights_keyboard_admin_rights_node(bot, chat_id, target_user_id)
        
        # Обновляем сообщение
        text = "⚙️ Управление правами администратора"
        await safe_edit_or_send(callback_query, text, reply_markup=keyboard)
        
        logging.info(f"Пользователь {user_id} {'включил' if new_value else 'отключил'} право 'can_invite_users' для пользователя {target_user_id}")
        
    except Exception as e:
        logging.error(f"Ошибка при переключении права can_invite_users: {e}")
        await safe_edit_or_send(callback_query, "❌ Не удалось изменить права администратора. Попробуйте позже.")

# Обработчик переключения права: can_pin_messages
# Код сгенерирован в generate-node-handlers.ts
@dp.callback_query(lambda c: c.data.startswith("tr_can_pin_mess_"))
# Код сгенерирован в generate-node-handlers.ts
async def toggle_can_pin_messages_admin_rights_node(callback_query: types.CallbackQuery, bot):
    """
    Переключает право can_pin_messages для пользователя
    """
    await callback_query.answer()
    
    # Парсим данные из callback_data: tr_<right>_<user_id>_<node_hash>
    try:
        data_parts = callback_query.data.split('_')
        # Формат: ['tr', '<right_name>', '<user_id>', '<node_hash>']
# Код сгенерирован в generate-node-handlers.ts
        if len(data_parts) < 4:
            raise ValueError("Недостаточно частей в callback_data")
        target_user_id = int(data_parts[-2])
        node_hash = data_parts[-1]
        logging.info(f"Переключаем право can_pin_messages для пользователя {target_user_id}")
    except (ValueError, IndexError) as e:
        logging.error(f"Ошибка парсинга callback_data: {callback_query.data}, ошибка: {e}")
        await callback_query.answer("❌ Ошибка в данных кнопки")
        return
    
    user_id = callback_query.from_user.id
    chat_id = callback_query.message.chat.id
    
    try:
        # Проверяем права БОТА на управление правами администраторов
        bot_member = await bot.get_chat_member(chat_id, bot.id)
# Код сгенерирован в generate-node-handlers.ts
        if bot_member.status not in ['administrator', 'creator']:
            await safe_edit_or_send(callback_query, "❌ Бот не является администратором этой группы")
            return
            
# Код сгенерирован в generate-node-handlers.ts
        if bot_member.status != 'creator' and not getattr(bot_member, 'can_promote_members', False):
            await safe_edit_or_send(callback_query, "❌ У бота нет права на управление правами администраторов")
            return
        
        # Получаем текущие права целевого пользователя
        target_member = await bot.get_chat_member(chat_id, target_user_id)
# Код сгенерирован в generate-node-handlers.ts
        if target_member.status not in ['administrator', 'creator']:
            await safe_edit_or_send(callback_query, "❌ Целевой пользователь не является администратором")
            return
        
        # Получаем текущее состояние права
        current_value = getattr(target_member, 'can_pin_messages', False)
        new_value = not current_value
        
        # Подготавливаем права для обновления
        permissions = {
            'can_change_info': getattr(target_member, 'can_change_info', False),
            'can_delete_messages': getattr(target_member, 'can_delete_messages', False),
            'can_restrict_members': getattr(target_member, 'can_restrict_members', False),
            'can_invite_users': getattr(target_member, 'can_invite_users', False),
            'can_pin_messages': getattr(target_member, 'can_pin_messages', False),
            'can_manage_video_chats': getattr(target_member, 'can_manage_video_chats', False),
            'can_post_stories': getattr(target_member, 'can_post_stories', False),
            'can_edit_stories': getattr(target_member, 'can_edit_stories', False),
            'can_delete_stories': getattr(target_member, 'can_delete_stories', False),
            'is_anonymous': getattr(target_member, 'is_anonymous', False),
            'can_promote_members': getattr(target_member, 'can_promote_members', False),
        }
        permissions['can_pin_messages'] = new_value
        
        # Применяем изменения
        await bot.promote_chat_member(
            chat_id=chat_id,
            user_id=target_user_id,
            can_change_info=permissions['can_change_info'],
            can_delete_messages=permissions['can_delete_messages'],
            can_restrict_members=permissions['can_restrict_members'],
            can_invite_users=permissions['can_invite_users'],
            can_pin_messages=permissions['can_pin_messages'],
            can_manage_video_chats=permissions['can_manage_video_chats'],
            can_post_stories=permissions['can_post_stories'],
            can_edit_stories=permissions['can_edit_stories'],
            can_delete_stories=permissions['can_delete_stories'],
            is_anonymous=permissions['is_anonymous'],
            can_promote_members=permissions['can_promote_members'],
        )
        
        # Обновляем клавиатуру с новым состоянием
        keyboard = await create_admin_rights_keyboard_admin_rights_node(bot, chat_id, target_user_id)
        
        # Обновляем сообщение
        text = "⚙️ Управление правами администратора"
        await safe_edit_or_send(callback_query, text, reply_markup=keyboard)
        
        logging.info(f"Пользователь {user_id} {'включил' if new_value else 'отключил'} право 'can_pin_messages' для пользователя {target_user_id}")
        
    except Exception as e:
        logging.error(f"Ошибка при переключении права can_pin_messages: {e}")
        await safe_edit_or_send(callback_query, "❌ Не удалось изменить права администратора. Попробуйте позже.")

# Обработчик переключения права: can_manage_video_chats
# Код сгенерирован в generate-node-handlers.ts
@dp.callback_query(lambda c: c.data.startswith("tr_can_manage_v_"))
# Код сгенерирован в generate-node-handlers.ts
async def toggle_can_manage_video_chats_admin_rights_node(callback_query: types.CallbackQuery, bot):
    """
    Переключает право can_manage_video_chats для пользователя
    """
    await callback_query.answer()
    
    # Парсим данные из callback_data: tr_<right>_<user_id>_<node_hash>
    try:
        data_parts = callback_query.data.split('_')
        # Формат: ['tr', '<right_name>', '<user_id>', '<node_hash>']
# Код сгенерирован в generate-node-handlers.ts
        if len(data_parts) < 4:
            raise ValueError("Недостаточно частей в callback_data")
        target_user_id = int(data_parts[-2])
        node_hash = data_parts[-1]
        logging.info(f"Переключаем право can_manage_video_chats для пользователя {target_user_id}")
    except (ValueError, IndexError) as e:
        logging.error(f"Ошибка парсинга callback_data: {callback_query.data}, ошибка: {e}")
        await callback_query.answer("❌ Ошибка в данных кнопки")
        return
    
    user_id = callback_query.from_user.id
    chat_id = callback_query.message.chat.id
    
    try:
        # Проверяем права БОТА на управление правами администраторов
        bot_member = await bot.get_chat_member(chat_id, bot.id)
# Код сгенерирован в generate-node-handlers.ts
        if bot_member.status not in ['administrator', 'creator']:
            await safe_edit_or_send(callback_query, "❌ Бот не является администратором этой группы")
            return
            
# Код сгенерирован в generate-node-handlers.ts
        if bot_member.status != 'creator' and not getattr(bot_member, 'can_promote_members', False):
            await safe_edit_or_send(callback_query, "❌ У бота нет права на управление правами администраторов")
            return
        
        # Получаем текущие права целевого пользователя
        target_member = await bot.get_chat_member(chat_id, target_user_id)
# Код сгенерирован в generate-node-handlers.ts
        if target_member.status not in ['administrator', 'creator']:
            await safe_edit_or_send(callback_query, "❌ Целевой пользователь не является администратором")
            return
        
        # Получаем текущее состояние права
        current_value = getattr(target_member, 'can_manage_video_chats', False)
        new_value = not current_value
        
        # Подготавливаем права для обновления
        permissions = {
            'can_change_info': getattr(target_member, 'can_change_info', False),
            'can_delete_messages': getattr(target_member, 'can_delete_messages', False),
            'can_restrict_members': getattr(target_member, 'can_restrict_members', False),
            'can_invite_users': getattr(target_member, 'can_invite_users', False),
            'can_pin_messages': getattr(target_member, 'can_pin_messages', False),
            'can_manage_video_chats': getattr(target_member, 'can_manage_video_chats', False),
            'can_post_stories': getattr(target_member, 'can_post_stories', False),
            'can_edit_stories': getattr(target_member, 'can_edit_stories', False),
            'can_delete_stories': getattr(target_member, 'can_delete_stories', False),
            'is_anonymous': getattr(target_member, 'is_anonymous', False),
            'can_promote_members': getattr(target_member, 'can_promote_members', False),
        }
        permissions['can_manage_video_chats'] = new_value
        
        # Применяем изменения
        await bot.promote_chat_member(
            chat_id=chat_id,
            user_id=target_user_id,
            can_change_info=permissions['can_change_info'],
            can_delete_messages=permissions['can_delete_messages'],
            can_restrict_members=permissions['can_restrict_members'],
            can_invite_users=permissions['can_invite_users'],
            can_pin_messages=permissions['can_pin_messages'],
            can_manage_video_chats=permissions['can_manage_video_chats'],
            can_post_stories=permissions['can_post_stories'],
            can_edit_stories=permissions['can_edit_stories'],
            can_delete_stories=permissions['can_delete_stories'],
            is_anonymous=permissions['is_anonymous'],
            can_promote_members=permissions['can_promote_members'],
        )
        
        # Обновляем клавиатуру с новым состоянием
        keyboard = await create_admin_rights_keyboard_admin_rights_node(bot, chat_id, target_user_id)
        
        # Обновляем сообщение
        text = "⚙️ Управление правами администратора"
        await safe_edit_or_send(callback_query, text, reply_markup=keyboard)
        
        logging.info(f"Пользователь {user_id} {'включил' if new_value else 'отключил'} право 'can_manage_video_chats' для пользователя {target_user_id}")
        
    except Exception as e:
        logging.error(f"Ошибка при переключении права can_manage_video_chats: {e}")
        await safe_edit_or_send(callback_query, "❌ Не удалось изменить права администратора. Попробуйте позже.")

# Обработчик переключения права: can_post_stories
# Код сгенерирован в generate-node-handlers.ts
@dp.callback_query(lambda c: c.data.startswith("tr_can_post_sto_"))
# Код сгенерирован в generate-node-handlers.ts
async def toggle_can_post_stories_admin_rights_node(callback_query: types.CallbackQuery, bot):
    """
    Переключает право can_post_stories для пользователя
    """
    await callback_query.answer()
    
    # Парсим данные из callback_data: tr_<right>_<user_id>_<node_hash>
    try:
        data_parts = callback_query.data.split('_')
        # Формат: ['tr', '<right_name>', '<user_id>', '<node_hash>']
# Код сгенерирован в generate-node-handlers.ts
        if len(data_parts) < 4:
            raise ValueError("Недостаточно частей в callback_data")
        target_user_id = int(data_parts[-2])
        node_hash = data_parts[-1]
        logging.info(f"Переключаем право can_post_stories для пользователя {target_user_id}")
    except (ValueError, IndexError) as e:
        logging.error(f"Ошибка парсинга callback_data: {callback_query.data}, ошибка: {e}")
        await callback_query.answer("❌ Ошибка в данных кнопки")
        return
    
    user_id = callback_query.from_user.id
    chat_id = callback_query.message.chat.id
    
    try:
        # Проверяем права БОТА на управление правами администраторов
        bot_member = await bot.get_chat_member(chat_id, bot.id)
# Код сгенерирован в generate-node-handlers.ts
        if bot_member.status not in ['administrator', 'creator']:
            await safe_edit_or_send(callback_query, "❌ Бот не является администратором этой группы")
            return
            
# Код сгенерирован в generate-node-handlers.ts
        if bot_member.status != 'creator' and not getattr(bot_member, 'can_promote_members', False):
            await safe_edit_or_send(callback_query, "❌ У бота нет права на управление правами администраторов")
            return
        
        # Получаем текущие права целевого пользователя
        target_member = await bot.get_chat_member(chat_id, target_user_id)
# Код сгенерирован в generate-node-handlers.ts
        if target_member.status not in ['administrator', 'creator']:
            await safe_edit_or_send(callback_query, "❌ Целевой пользователь не является администратором")
            return
        
        # Получаем текущее состояние права
        current_value = getattr(target_member, 'can_post_stories', False)
        new_value = not current_value
        
        # Подготавливаем права для обновления
        permissions = {
            'can_change_info': getattr(target_member, 'can_change_info', False),
            'can_delete_messages': getattr(target_member, 'can_delete_messages', False),
            'can_restrict_members': getattr(target_member, 'can_restrict_members', False),
            'can_invite_users': getattr(target_member, 'can_invite_users', False),
            'can_pin_messages': getattr(target_member, 'can_pin_messages', False),
            'can_manage_video_chats': getattr(target_member, 'can_manage_video_chats', False),
            'can_post_stories': getattr(target_member, 'can_post_stories', False),
            'can_edit_stories': getattr(target_member, 'can_edit_stories', False),
            'can_delete_stories': getattr(target_member, 'can_delete_stories', False),
            'is_anonymous': getattr(target_member, 'is_anonymous', False),
            'can_promote_members': getattr(target_member, 'can_promote_members', False),
        }
        permissions['can_post_stories'] = new_value
        
        # Применяем изменения
        await bot.promote_chat_member(
            chat_id=chat_id,
            user_id=target_user_id,
            can_change_info=permissions['can_change_info'],
            can_delete_messages=permissions['can_delete_messages'],
            can_restrict_members=permissions['can_restrict_members'],
            can_invite_users=permissions['can_invite_users'],
            can_pin_messages=permissions['can_pin_messages'],
            can_manage_video_chats=permissions['can_manage_video_chats'],
            can_post_stories=permissions['can_post_stories'],
            can_edit_stories=permissions['can_edit_stories'],
            can_delete_stories=permissions['can_delete_stories'],
            is_anonymous=permissions['is_anonymous'],
            can_promote_members=permissions['can_promote_members'],
        )
        
        # Обновляем клавиатуру с новым состоянием
        keyboard = await create_admin_rights_keyboard_admin_rights_node(bot, chat_id, target_user_id)
        
        # Обновляем сообщение
        text = "⚙️ Управление правами администратора"
        await safe_edit_or_send(callback_query, text, reply_markup=keyboard)
        
        logging.info(f"Пользователь {user_id} {'включил' if new_value else 'отключил'} право 'can_post_stories' для пользователя {target_user_id}")
        
    except Exception as e:
        logging.error(f"Ошибка при переключении права can_post_stories: {e}")
        await safe_edit_or_send(callback_query, "❌ Не удалось изменить права администратора. Попробуйте позже.")

# Обработчик переключения права: can_edit_stories
# Код сгенерирован в generate-node-handlers.ts
@dp.callback_query(lambda c: c.data.startswith("tr_can_edit_sto_"))
# Код сгенерирован в generate-node-handlers.ts
async def toggle_can_edit_stories_admin_rights_node(callback_query: types.CallbackQuery, bot):
    """
    Переключает право can_edit_stories для пользователя
    """
    await callback_query.answer()
    
    # Парсим данные из callback_data: tr_<right>_<user_id>_<node_hash>
    try:
        data_parts = callback_query.data.split('_')
        # Формат: ['tr', '<right_name>', '<user_id>', '<node_hash>']
# Код сгенерирован в generate-node-handlers.ts
        if len(data_parts) < 4:
            raise ValueError("Недостаточно частей в callback_data")
        target_user_id = int(data_parts[-2])
        node_hash = data_parts[-1]
        logging.info(f"Переключаем право can_edit_stories для пользователя {target_user_id}")
    except (ValueError, IndexError) as e:
        logging.error(f"Ошибка парсинга callback_data: {callback_query.data}, ошибка: {e}")
        await callback_query.answer("❌ Ошибка в данных кнопки")
        return
    
    user_id = callback_query.from_user.id
    chat_id = callback_query.message.chat.id
    
    try:
        # Проверяем права БОТА на управление правами администраторов
        bot_member = await bot.get_chat_member(chat_id, bot.id)
# Код сгенерирован в generate-node-handlers.ts
        if bot_member.status not in ['administrator', 'creator']:
            await safe_edit_or_send(callback_query, "❌ Бот не является администратором этой группы")
            return
            
# Код сгенерирован в generate-node-handlers.ts
        if bot_member.status != 'creator' and not getattr(bot_member, 'can_promote_members', False):
            await safe_edit_or_send(callback_query, "❌ У бота нет права на управление правами администраторов")
            return
        
        # Получаем текущие права целевого пользователя
        target_member = await bot.get_chat_member(chat_id, target_user_id)
# Код сгенерирован в generate-node-handlers.ts
        if target_member.status not in ['administrator', 'creator']:
            await safe_edit_or_send(callback_query, "❌ Целевой пользователь не является администратором")
            return
        
        # Получаем текущее состояние права
        current_value = getattr(target_member, 'can_edit_stories', False)
        new_value = not current_value
        
        # Подготавливаем права для обновления
        permissions = {
            'can_change_info': getattr(target_member, 'can_change_info', False),
            'can_delete_messages': getattr(target_member, 'can_delete_messages', False),
            'can_restrict_members': getattr(target_member, 'can_restrict_members', False),
            'can_invite_users': getattr(target_member, 'can_invite_users', False),
            'can_pin_messages': getattr(target_member, 'can_pin_messages', False),
            'can_manage_video_chats': getattr(target_member, 'can_manage_video_chats', False),
            'can_post_stories': getattr(target_member, 'can_post_stories', False),
            'can_edit_stories': getattr(target_member, 'can_edit_stories', False),
            'can_delete_stories': getattr(target_member, 'can_delete_stories', False),
            'is_anonymous': getattr(target_member, 'is_anonymous', False),
            'can_promote_members': getattr(target_member, 'can_promote_members', False),
        }
        permissions['can_edit_stories'] = new_value
        
        # Применяем изменения
        await bot.promote_chat_member(
            chat_id=chat_id,
            user_id=target_user_id,
            can_change_info=permissions['can_change_info'],
            can_delete_messages=permissions['can_delete_messages'],
            can_restrict_members=permissions['can_restrict_members'],
            can_invite_users=permissions['can_invite_users'],
            can_pin_messages=permissions['can_pin_messages'],
            can_manage_video_chats=permissions['can_manage_video_chats'],
            can_post_stories=permissions['can_post_stories'],
            can_edit_stories=permissions['can_edit_stories'],
            can_delete_stories=permissions['can_delete_stories'],
            is_anonymous=permissions['is_anonymous'],
            can_promote_members=permissions['can_promote_members'],
        )
        
        # Обновляем клавиатуру с новым состоянием
        keyboard = await create_admin_rights_keyboard_admin_rights_node(bot, chat_id, target_user_id)
        
        # Обновляем сообщение
        text = "⚙️ Управление правами администратора"
        await safe_edit_or_send(callback_query, text, reply_markup=keyboard)
        
        logging.info(f"Пользователь {user_id} {'включил' if new_value else 'отключил'} право 'can_edit_stories' для пользователя {target_user_id}")
        
    except Exception as e:
        logging.error(f"Ошибка при переключении права can_edit_stories: {e}")
        await safe_edit_or_send(callback_query, "❌ Не удалось изменить права администратора. Попробуйте позже.")

# Обработчик переключения права: can_delete_stories
# Код сгенерирован в generate-node-handlers.ts
@dp.callback_query(lambda c: c.data.startswith("tr_can_delete_s_"))
# Код сгенерирован в generate-node-handlers.ts
async def toggle_can_delete_stories_admin_rights_node(callback_query: types.CallbackQuery, bot):
    """
    Переключает право can_delete_stories для пользователя
    """
    await callback_query.answer()
    
    # Парсим данные из callback_data: tr_<right>_<user_id>_<node_hash>
    try:
        data_parts = callback_query.data.split('_')
        # Формат: ['tr', '<right_name>', '<user_id>', '<node_hash>']
# Код сгенерирован в generate-node-handlers.ts
        if len(data_parts) < 4:
            raise ValueError("Недостаточно частей в callback_data")
        target_user_id = int(data_parts[-2])
        node_hash = data_parts[-1]
        logging.info(f"Переключаем право can_delete_stories для пользователя {target_user_id}")
    except (ValueError, IndexError) as e:
        logging.error(f"Ошибка парсинга callback_data: {callback_query.data}, ошибка: {e}")
        await callback_query.answer("❌ Ошибка в данных кнопки")
        return
    
    user_id = callback_query.from_user.id
    chat_id = callback_query.message.chat.id
    
    try:
        # Проверяем права БОТА на управление правами администраторов
        bot_member = await bot.get_chat_member(chat_id, bot.id)
# Код сгенерирован в generate-node-handlers.ts
        if bot_member.status not in ['administrator', 'creator']:
            await safe_edit_or_send(callback_query, "❌ Бот не является администратором этой группы")
            return
            
# Код сгенерирован в generate-node-handlers.ts
        if bot_member.status != 'creator' and not getattr(bot_member, 'can_promote_members', False):
            await safe_edit_or_send(callback_query, "❌ У бота нет права на управление правами администраторов")
            return
        
        # Получаем текущие права целевого пользователя
        target_member = await bot.get_chat_member(chat_id, target_user_id)
# Код сгенерирован в generate-node-handlers.ts
        if target_member.status not in ['administrator', 'creator']:
            await safe_edit_or_send(callback_query, "❌ Целевой пользователь не является администратором")
            return
        
        # Получаем текущее состояние права
        current_value = getattr(target_member, 'can_delete_stories', False)
        new_value = not current_value
        
        # Подготавливаем права для обновления
        permissions = {
            'can_change_info': getattr(target_member, 'can_change_info', False),
            'can_delete_messages': getattr(target_member, 'can_delete_messages', False),
            'can_restrict_members': getattr(target_member, 'can_restrict_members', False),
            'can_invite_users': getattr(target_member, 'can_invite_users', False),
            'can_pin_messages': getattr(target_member, 'can_pin_messages', False),
            'can_manage_video_chats': getattr(target_member, 'can_manage_video_chats', False),
            'can_post_stories': getattr(target_member, 'can_post_stories', False),
            'can_edit_stories': getattr(target_member, 'can_edit_stories', False),
            'can_delete_stories': getattr(target_member, 'can_delete_stories', False),
            'is_anonymous': getattr(target_member, 'is_anonymous', False),
            'can_promote_members': getattr(target_member, 'can_promote_members', False),
        }
        permissions['can_delete_stories'] = new_value
        
        # Применяем изменения
        await bot.promote_chat_member(
            chat_id=chat_id,
            user_id=target_user_id,
            can_change_info=permissions['can_change_info'],
            can_delete_messages=permissions['can_delete_messages'],
            can_restrict_members=permissions['can_restrict_members'],
            can_invite_users=permissions['can_invite_users'],
            can_pin_messages=permissions['can_pin_messages'],
            can_manage_video_chats=permissions['can_manage_video_chats'],
            can_post_stories=permissions['can_post_stories'],
            can_edit_stories=permissions['can_edit_stories'],
            can_delete_stories=permissions['can_delete_stories'],
            is_anonymous=permissions['is_anonymous'],
            can_promote_members=permissions['can_promote_members'],
        )
        
        # Обновляем клавиатуру с новым состоянием
        keyboard = await create_admin_rights_keyboard_admin_rights_node(bot, chat_id, target_user_id)
        
        # Обновляем сообщение
        text = "⚙️ Управление правами администратора"
        await safe_edit_or_send(callback_query, text, reply_markup=keyboard)
        
        logging.info(f"Пользователь {user_id} {'включил' if new_value else 'отключил'} право 'can_delete_stories' для пользователя {target_user_id}")
        
    except Exception as e:
        logging.error(f"Ошибка при переключении права can_delete_stories: {e}")
        await safe_edit_or_send(callback_query, "❌ Не удалось изменить права администратора. Попробуйте позже.")

# Обработчик переключения права: is_anonymous
# Код сгенерирован в generate-node-handlers.ts
@dp.callback_query(lambda c: c.data.startswith("tr_is_anonymous_"))
# Код сгенерирован в generate-node-handlers.ts
async def toggle_is_anonymous_admin_rights_node(callback_query: types.CallbackQuery, bot):
    """
    Переключает право is_anonymous для пользователя
    """
    await callback_query.answer()
    
    # Парсим данные из callback_data: tr_<right>_<user_id>_<node_hash>
    try:
        data_parts = callback_query.data.split('_')
        # Формат: ['tr', '<right_name>', '<user_id>', '<node_hash>']
# Код сгенерирован в generate-node-handlers.ts
        if len(data_parts) < 4:
            raise ValueError("Недостаточно частей в callback_data")
        target_user_id = int(data_parts[-2])
        node_hash = data_parts[-1]
        logging.info(f"Переключаем право is_anonymous для пользователя {target_user_id}")
    except (ValueError, IndexError) as e:
        logging.error(f"Ошибка парсинга callback_data: {callback_query.data}, ошибка: {e}")
        await callback_query.answer("❌ Ошибка в данных кнопки")
        return
    
    user_id = callback_query.from_user.id
    chat_id = callback_query.message.chat.id
    
    try:
        # Проверяем права БОТА на управление правами администраторов
        bot_member = await bot.get_chat_member(chat_id, bot.id)
# Код сгенерирован в generate-node-handlers.ts
        if bot_member.status not in ['administrator', 'creator']:
            await safe_edit_or_send(callback_query, "❌ Бот не является администратором этой группы")
            return
            
# Код сгенерирован в generate-node-handlers.ts
        if bot_member.status != 'creator' and not getattr(bot_member, 'can_promote_members', False):
            await safe_edit_or_send(callback_query, "❌ У бота нет права на управление правами администраторов")
            return
        
        # Получаем текущие права целевого пользователя
        target_member = await bot.get_chat_member(chat_id, target_user_id)
# Код сгенерирован в generate-node-handlers.ts
        if target_member.status not in ['administrator', 'creator']:
            await safe_edit_or_send(callback_query, "❌ Целевой пользователь не является администратором")
            return
        
        # Получаем текущее состояние права
        current_value = getattr(target_member, 'is_anonymous', False)
        new_value = not current_value
        
        # Подготавливаем права для обновления
        permissions = {
            'can_change_info': getattr(target_member, 'can_change_info', False),
            'can_delete_messages': getattr(target_member, 'can_delete_messages', False),
            'can_restrict_members': getattr(target_member, 'can_restrict_members', False),
            'can_invite_users': getattr(target_member, 'can_invite_users', False),
            'can_pin_messages': getattr(target_member, 'can_pin_messages', False),
            'can_manage_video_chats': getattr(target_member, 'can_manage_video_chats', False),
            'can_post_stories': getattr(target_member, 'can_post_stories', False),
            'can_edit_stories': getattr(target_member, 'can_edit_stories', False),
            'can_delete_stories': getattr(target_member, 'can_delete_stories', False),
            'is_anonymous': getattr(target_member, 'is_anonymous', False),
            'can_promote_members': getattr(target_member, 'can_promote_members', False),
        }
        permissions['is_anonymous'] = new_value
        
        # Применяем изменения
        await bot.promote_chat_member(
            chat_id=chat_id,
            user_id=target_user_id,
            can_change_info=permissions['can_change_info'],
            can_delete_messages=permissions['can_delete_messages'],
            can_restrict_members=permissions['can_restrict_members'],
            can_invite_users=permissions['can_invite_users'],
            can_pin_messages=permissions['can_pin_messages'],
            can_manage_video_chats=permissions['can_manage_video_chats'],
            can_post_stories=permissions['can_post_stories'],
            can_edit_stories=permissions['can_edit_stories'],
            can_delete_stories=permissions['can_delete_stories'],
            is_anonymous=permissions['is_anonymous'],
            can_promote_members=permissions['can_promote_members'],
        )
        
        # Обновляем клавиатуру с новым состоянием
        keyboard = await create_admin_rights_keyboard_admin_rights_node(bot, chat_id, target_user_id)
        
        # Обновляем сообщение
        text = "⚙️ Управление правами администратора"
        await safe_edit_or_send(callback_query, text, reply_markup=keyboard)
        
        logging.info(f"Пользователь {user_id} {'включил' if new_value else 'отключил'} право 'is_anonymous' для пользователя {target_user_id}")
        
    except Exception as e:
        logging.error(f"Ошибка при переключении права is_anonymous: {e}")
        await safe_edit_or_send(callback_query, "❌ Не удалось изменить права администратора. Попробуйте позже.")

# Обработчик переключения права: can_promote_members
# Код сгенерирован в generate-node-handlers.ts
@dp.callback_query(lambda c: c.data.startswith("tr_can_promote__"))
# Код сгенерирован в generate-node-handlers.ts
async def toggle_can_promote_members_admin_rights_node(callback_query: types.CallbackQuery, bot):
    """
    Переключает право can_promote_members для пользователя
    """
    await callback_query.answer()
    
    # Парсим данные из callback_data: tr_<right>_<user_id>_<node_hash>
    try:
        data_parts = callback_query.data.split('_')
        # Формат: ['tr', '<right_name>', '<user_id>', '<node_hash>']
# Код сгенерирован в generate-node-handlers.ts
        if len(data_parts) < 4:
            raise ValueError("Недостаточно частей в callback_data")
        target_user_id = int(data_parts[-2])
        node_hash = data_parts[-1]
        logging.info(f"Переключаем право can_promote_members для пользователя {target_user_id}")
    except (ValueError, IndexError) as e:
        logging.error(f"Ошибка парсинга callback_data: {callback_query.data}, ошибка: {e}")
        await callback_query.answer("❌ Ошибка в данных кнопки")
        return
    
    user_id = callback_query.from_user.id
    chat_id = callback_query.message.chat.id
    
    try:
        # Проверяем права БОТА на управление правами администраторов
        bot_member = await bot.get_chat_member(chat_id, bot.id)
# Код сгенерирован в generate-node-handlers.ts
        if bot_member.status not in ['administrator', 'creator']:
            await safe_edit_or_send(callback_query, "❌ Бот не является администратором этой группы")
            return
            
# Код сгенерирован в generate-node-handlers.ts
        if bot_member.status != 'creator' and not getattr(bot_member, 'can_promote_members', False):
            await safe_edit_or_send(callback_query, "❌ У бота нет права на управление правами администраторов")
            return
        
        # Получаем текущие права целевого пользователя
        target_member = await bot.get_chat_member(chat_id, target_user_id)
# Код сгенерирован в generate-node-handlers.ts
        if target_member.status not in ['administrator', 'creator']:
            await safe_edit_or_send(callback_query, "❌ Целевой пользователь не является администратором")
            return
        
        # Получаем текущее состояние права
        current_value = getattr(target_member, 'can_promote_members', False)
        new_value = not current_value
        
        # Подготавливаем права для обновления
        permissions = {
            'can_change_info': getattr(target_member, 'can_change_info', False),
            'can_delete_messages': getattr(target_member, 'can_delete_messages', False),
            'can_restrict_members': getattr(target_member, 'can_restrict_members', False),
            'can_invite_users': getattr(target_member, 'can_invite_users', False),
            'can_pin_messages': getattr(target_member, 'can_pin_messages', False),
            'can_manage_video_chats': getattr(target_member, 'can_manage_video_chats', False),
            'can_post_stories': getattr(target_member, 'can_post_stories', False),
            'can_edit_stories': getattr(target_member, 'can_edit_stories', False),
            'can_delete_stories': getattr(target_member, 'can_delete_stories', False),
            'is_anonymous': getattr(target_member, 'is_anonymous', False),
            'can_promote_members': getattr(target_member, 'can_promote_members', False),
        }
        permissions['can_promote_members'] = new_value
        
        # Применяем изменения
        await bot.promote_chat_member(
            chat_id=chat_id,
            user_id=target_user_id,
            can_change_info=permissions['can_change_info'],
            can_delete_messages=permissions['can_delete_messages'],
            can_restrict_members=permissions['can_restrict_members'],
            can_invite_users=permissions['can_invite_users'],
            can_pin_messages=permissions['can_pin_messages'],
            can_manage_video_chats=permissions['can_manage_video_chats'],
            can_post_stories=permissions['can_post_stories'],
            can_edit_stories=permissions['can_edit_stories'],
            can_delete_stories=permissions['can_delete_stories'],
            is_anonymous=permissions['is_anonymous'],
            can_promote_members=permissions['can_promote_members'],
        )
        
        # Обновляем клавиатуру с новым состоянием
        keyboard = await create_admin_rights_keyboard_admin_rights_node(bot, chat_id, target_user_id)
        
        # Обновляем сообщение
        text = "⚙️ Управление правами администратора"
        await safe_edit_or_send(callback_query, text, reply_markup=keyboard)
        
        logging.info(f"Пользователь {user_id} {'включил' if new_value else 'отключил'} право 'can_promote_members' для пользователя {target_user_id}")
        
    except Exception as e:
        logging.error(f"Ошибка при переключении права can_promote_members: {e}")
        await safe_edit_or_send(callback_query, "❌ Не удалось изменить права администратора. Попробуйте позже.")

# Обработчик кнопки обновления прав
# Код сгенерирован в generate-node-handlers.ts
@dp.callback_query(lambda c: c.data.startswith("ref_"))
# Код сгенерирован в generate-node-handlers.ts
async def refresh_admin_rights_admin_rights_node(callback_query: types.CallbackQuery, bot):
    """
    Обновляет отображение прав администратора
    """
    await callback_query.answer("🔄 Обновляем...")
    
    # Парсим данные: ref_<user_id>_<node_hash>
    data_parts = callback_query.data.split('_')
    target_user_id = int(data_parts[-2])
    
    chat_id = callback_query.message.chat.id
    
    try:
        # Создаем обновленную клавиатуру
        keyboard = await create_admin_rights_keyboard_admin_rights_node(bot, chat_id, target_user_id)
        
        # Обновляем сообщение
        text = "⚙️ Управление правами администратора"
        await safe_edit_or_send(callback_query, text, reply_markup=keyboard)
        
        logging.info(f"Обновлены права для пользователя {target_user_id}")
        
    except Exception as e:
        logging.error(f"Ошибка при обновлении прав: {e}")
        await safe_edit_or_send(callback_query, "❌ Не удалось обновить права. Попробуйте позже.")


# @@NODE_END:admin_rights_node@@
# Обработчики синонимов
# @@NODE_START:start@@

@dp.message(lambda message: message.text and message.text.lower() == "старт")
async def start_synonym_старт_handler(message: types.Message):
    # Синоним для команды /start
    await start_handler(message)
# @@NODE_END:start@@
# @@NODE_START:start@@

@dp.message(lambda message: message.text and message.text.lower() == "начать")
async def start_synonym_начать_handler(message: types.Message):
    # Синоним для команды /start
    await start_handler(message)
# @@NODE_END:start@@
# @@NODE_START:start@@

@dp.message(lambda message: message.text and message.text.lower() == "привет")
async def start_synonym_привет_handler(message: types.Message):
    # Синоним для команды /start
    await start_handler(message)
# @@NODE_END:start@@
# @@NODE_START:start@@

@dp.message(lambda message: message.text and message.text.lower() == "начало")
async def start_synonym_начало_handler(message: types.Message):
    # Синоним для команды /start
    await start_handler(message)
# @@NODE_END:start@@
# @@NODE_START:start@@

@dp.message(lambda message: message.text and message.text.lower() == "начинаем")
async def start_synonym_начинаем_handler(message: types.Message):
    # Синоним для команды /start
    await start_handler(message)
# @@NODE_END:start@@
# @@NODE_START:pin_message_node@@

@dp.message(lambda message: message.text and message.text.lower() == "закрепить")
async def message_pin_message_node_synonym_закрепить_handler(message: types.Message):
    # Синоним для сообщения pin_message_node
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'закрепить' для узла pin_message_node")
    
    # Обрабатываем синоним как переход к узлу pin_message_node
    # Создаем Mock callback для эмуляции кнопки
    class MockCallback:
        def __init__(self, data, user, msg):
            self.data = data
            self.from_user = user
            self.message = msg
        async def answer(self):
            pass  # Mock метод, ничего не делаем
        async def edit_text(self, text, **kwargs):
            try:
                return await self.message.edit_text(text, **kwargs)
            except Exception as e:
                logging.warning(f"Не удалось отредактировать сообщение: {e}")
                return await self.message.answer(text, **kwargs)
    
    mock_callback = MockCallback("pin_message_node", message.from_user, message)
    await handle_callback_pin_message_node(mock_callback)
# @@NODE_END:pin_message_node@@
# @@NODE_START:pin_message_node@@

@dp.message(lambda message: message.text and message.text.lower() == "прикрепить")
async def message_pin_message_node_synonym_прикрепить_handler(message: types.Message):
    # Синоним для сообщения pin_message_node
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'прикрепить' для узла pin_message_node")
    
    # Обрабатываем синоним как переход к узлу pin_message_node
    # Создаем Mock callback для эмуляции кнопки
    class MockCallback:
        def __init__(self, data, user, msg):
            self.data = data
            self.from_user = user
            self.message = msg
        async def answer(self):
            pass  # Mock метод, ничего не делаем
        async def edit_text(self, text, **kwargs):
            try:
                return await self.message.edit_text(text, **kwargs)
            except Exception as e:
                logging.warning(f"Не удалось отредактировать сообщение: {e}")
                return await self.message.answer(text, **kwargs)
    
    mock_callback = MockCallback("pin_message_node", message.from_user, message)
    await handle_callback_pin_message_node(mock_callback)
# @@NODE_END:pin_message_node@@
# @@NODE_START:pin_message_node@@

@dp.message(lambda message: message.text and message.text.lower() == "зафиксировать")
async def message_pin_message_node_synonym_зафиксировать_handler(message: types.Message):
    # Синоним для сообщения pin_message_node
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'зафиксировать' для узла pin_message_node")
    
    # Обрабатываем синоним как переход к узлу pin_message_node
    # Создаем Mock callback для эмуляции кнопки
    class MockCallback:
        def __init__(self, data, user, msg):
            self.data = data
            self.from_user = user
            self.message = msg
        async def answer(self):
            pass  # Mock метод, ничего не делаем
        async def edit_text(self, text, **kwargs):
            try:
                return await self.message.edit_text(text, **kwargs)
            except Exception as e:
                logging.warning(f"Не удалось отредактировать сообщение: {e}")
                return await self.message.answer(text, **kwargs)
    
    mock_callback = MockCallback("pin_message_node", message.from_user, message)
    await handle_callback_pin_message_node(mock_callback)
# @@NODE_END:pin_message_node@@
# @@NODE_START:unpin_message_node@@

@dp.message(lambda message: message.text and message.text.lower() == "открепить")
async def message_unpin_message_node_synonym_открепить_handler(message: types.Message):
    # Синоним для сообщения unpin_message_node
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'открепить' для узла unpin_message_node")
    
    # Обрабатываем синоним как переход к узлу unpin_message_node
    # Создаем Mock callback для эмуляции кнопки
    class MockCallback:
        def __init__(self, data, user, msg):
            self.data = data
            self.from_user = user
            self.message = msg
        async def answer(self):
            pass  # Mock метод, ничего не делаем
        async def edit_text(self, text, **kwargs):
            try:
                return await self.message.edit_text(text, **kwargs)
            except Exception as e:
                logging.warning(f"Не удалось отредактировать сообщение: {e}")
                return await self.message.answer(text, **kwargs)
    
    mock_callback = MockCallback("unpin_message_node", message.from_user, message)
    await handle_callback_unpin_message_node(mock_callback)
# @@NODE_END:unpin_message_node@@
# @@NODE_START:unpin_message_node@@

@dp.message(lambda message: message.text and message.text.lower() == "отцепить")
async def message_unpin_message_node_synonym_отцепить_handler(message: types.Message):
    # Синоним для сообщения unpin_message_node
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'отцепить' для узла unpin_message_node")
    
    # Обрабатываем синоним как переход к узлу unpin_message_node
    # Создаем Mock callback для эмуляции кнопки
    class MockCallback:
        def __init__(self, data, user, msg):
            self.data = data
            self.from_user = user
            self.message = msg
        async def answer(self):
            pass  # Mock метод, ничего не делаем
        async def edit_text(self, text, **kwargs):
            try:
                return await self.message.edit_text(text, **kwargs)
            except Exception as e:
                logging.warning(f"Не удалось отредактировать сообщение: {e}")
                return await self.message.answer(text, **kwargs)
    
    mock_callback = MockCallback("unpin_message_node", message.from_user, message)
    await handle_callback_unpin_message_node(mock_callback)
# @@NODE_END:unpin_message_node@@
# @@NODE_START:unpin_message_node@@

@dp.message(lambda message: message.text and message.text.lower() == "убрать закрепление")
async def message_unpin_message_node_synonym_убрать_закрепление_handler(message: types.Message):
    # Синоним для сообщения unpin_message_node
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'убрать закрепление' для узла unpin_message_node")
    
    # Обрабатываем синоним как переход к узлу unpin_message_node
    # Создаем Mock callback для эмуляции кнопки
    class MockCallback:
        def __init__(self, data, user, msg):
            self.data = data
            self.from_user = user
            self.message = msg
        async def answer(self):
            pass  # Mock метод, ничего не делаем
        async def edit_text(self, text, **kwargs):
            try:
                return await self.message.edit_text(text, **kwargs)
            except Exception as e:
                logging.warning(f"Не удалось отредактировать сообщение: {e}")
                return await self.message.answer(text, **kwargs)
    
    mock_callback = MockCallback("unpin_message_node", message.from_user, message)
    await handle_callback_unpin_message_node(mock_callback)
# @@NODE_END:unpin_message_node@@
# @@NODE_START:delete_message_node@@

@dp.message(lambda message: message.text and message.text.lower() == "удалить")
async def message_delete_message_node_synonym_удалить_handler(message: types.Message):
    # Синоним для сообщения delete_message_node
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'удалить' для узла delete_message_node")
    
    # Обрабатываем синоним как переход к узлу delete_message_node
    # Создаем Mock callback для эмуляции кнопки
    class MockCallback:
        def __init__(self, data, user, msg):
            self.data = data
            self.from_user = user
            self.message = msg
        async def answer(self):
            pass  # Mock метод, ничего не делаем
        async def edit_text(self, text, **kwargs):
            try:
                return await self.message.edit_text(text, **kwargs)
            except Exception as e:
                logging.warning(f"Не удалось отредактировать сообщение: {e}")
                return await self.message.answer(text, **kwargs)
    
    mock_callback = MockCallback("delete_message_node", message.from_user, message)
    await handle_callback_delete_message_node(mock_callback)
# @@NODE_END:delete_message_node@@
# @@NODE_START:delete_message_node@@

@dp.message(lambda message: message.text and message.text.lower() == "стереть")
async def message_delete_message_node_synonym_стереть_handler(message: types.Message):
    # Синоним для сообщения delete_message_node
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'стереть' для узла delete_message_node")
    
    # Обрабатываем синоним как переход к узлу delete_message_node
    # Создаем Mock callback для эмуляции кнопки
    class MockCallback:
        def __init__(self, data, user, msg):
            self.data = data
            self.from_user = user
            self.message = msg
        async def answer(self):
            pass  # Mock метод, ничего не делаем
        async def edit_text(self, text, **kwargs):
            try:
                return await self.message.edit_text(text, **kwargs)
            except Exception as e:
                logging.warning(f"Не удалось отредактировать сообщение: {e}")
                return await self.message.answer(text, **kwargs)
    
    mock_callback = MockCallback("delete_message_node", message.from_user, message)
    await handle_callback_delete_message_node(mock_callback)
# @@NODE_END:delete_message_node@@
# @@NODE_START:delete_message_node@@

@dp.message(lambda message: message.text and message.text.lower() == "убрать сообщение")
async def message_delete_message_node_synonym_убрать_сообщение_handler(message: types.Message):
    # Синоним для сообщения delete_message_node
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'убрать сообщение' для узла delete_message_node")
    
    # Обрабатываем синоним как переход к узлу delete_message_node
    # Создаем Mock callback для эмуляции кнопки
    class MockCallback:
        def __init__(self, data, user, msg):
            self.data = data
            self.from_user = user
            self.message = msg
        async def answer(self):
            pass  # Mock метод, ничего не делаем
        async def edit_text(self, text, **kwargs):
            try:
                return await self.message.edit_text(text, **kwargs)
            except Exception as e:
                logging.warning(f"Не удалось отредактировать сообщение: {e}")
                return await self.message.answer(text, **kwargs)
    
    mock_callback = MockCallback("delete_message_node", message.from_user, message)
    await handle_callback_delete_message_node(mock_callback)
# @@NODE_END:delete_message_node@@
# @@NODE_START:ban_user_node@@

@dp.message(lambda message: message.text and (message.text.lower() == "забанить" or message.text.lower().startswith("забанить ")) and message.chat.type in ['group', 'supergroup'])
async def ban_user_ban_user_node_synonym_забанить_handler(message: types.Message):
    """
    Обработчик синонима 'забанить' для ban_user
    Работает в группах с ответом на сообщение или с указанием ID пользователя
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Пользователь {user_id} использовал команду 'забанить' для пользователя {target_user_id} (через ответ)")
    else:
        # Если нет ответа, проверяем текст на наличие ID пользователя
        text_parts = message.text.split()
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_user_id = int(text_parts[1])
            logging.info(f"Пользователь {user_id} использовал команду 'забанить' для пользователя {target_user_id} (через ID)")
        else:
            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите 'забанить ID_пользователя'")
            return
    
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя")
        return
    
    # Тип текущего узла для логирования
    current_node_type = "ban_user"
    try:
        await bot.ban_chat_member(chat_id=chat_id, user_id=target_user_id)
        await message.answer(f"✅ Пользователь {target_user_id} заблокирован навсегда\nПричина: Нарушение правил группы")
        logging.info(f"Пользователь {target_user_id} заблокирован администратором {user_id}")
    except TelegramBadRequest as e:
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для выполнения операции")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка {current_node_type}: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")

# @@NODE_END:ban_user_node@@
# @@NODE_START:ban_user_node@@

@dp.message(lambda message: message.text and (message.text.lower() == "заблокировать" or message.text.lower().startswith("заблокировать ")) and message.chat.type in ['group', 'supergroup'])
async def ban_user_ban_user_node_synonym_заблокировать_handler(message: types.Message):
    """
    Обработчик синонима 'заблокировать' для ban_user
    Работает в группах с ответом на сообщение или с указанием ID пользователя
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Пользователь {user_id} использовал команду 'заблокировать' для пользователя {target_user_id} (через ответ)")
    else:
        # Если нет ответа, проверяем текст на наличие ID пользователя
        text_parts = message.text.split()
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_user_id = int(text_parts[1])
            logging.info(f"Пользователь {user_id} использовал команду 'заблокировать' для пользователя {target_user_id} (через ID)")
        else:
            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите 'заблокировать ID_пользователя'")
            return
    
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя")
        return
    
    # Тип текущего узла для логирования
    current_node_type = "ban_user"
    try:
        await bot.ban_chat_member(chat_id=chat_id, user_id=target_user_id)
        await message.answer(f"✅ Пользователь {target_user_id} заблокирован навсегда\nПричина: Нарушение правил группы")
        logging.info(f"Пользователь {target_user_id} заблокирован администратором {user_id}")
    except TelegramBadRequest as e:
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для выполнения операции")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка {current_node_type}: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")

# @@NODE_END:ban_user_node@@
# @@NODE_START:ban_user_node@@

@dp.message(lambda message: message.text and (message.text.lower() == "бан" or message.text.lower().startswith("бан ")) and message.chat.type in ['group', 'supergroup'])
async def ban_user_ban_user_node_synonym_бан_handler(message: types.Message):
    """
    Обработчик синонима 'бан' для ban_user
    Работает в группах с ответом на сообщение или с указанием ID пользователя
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Пользователь {user_id} использовал команду 'бан' для пользователя {target_user_id} (через ответ)")
    else:
        # Если нет ответа, проверяем текст на наличие ID пользователя
        text_parts = message.text.split()
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_user_id = int(text_parts[1])
            logging.info(f"Пользователь {user_id} использовал команду 'бан' для пользователя {target_user_id} (через ID)")
        else:
            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите 'бан ID_пользователя'")
            return
    
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя")
        return
    
    # Тип текущего узла для логирования
    current_node_type = "ban_user"
    try:
        await bot.ban_chat_member(chat_id=chat_id, user_id=target_user_id)
        await message.answer(f"✅ Пользователь {target_user_id} заблокирован навсегда\nПричина: Нарушение правил группы")
        logging.info(f"Пользователь {target_user_id} заблокирован администратором {user_id}")
    except TelegramBadRequest as e:
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для выполнения операции")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка {current_node_type}: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")

# @@NODE_END:ban_user_node@@
# @@NODE_START:unban_user_node@@

@dp.message(lambda message: message.text and (message.text.lower() == "разбанить" or message.text.lower().startswith("разбанить ")) and message.chat.type in ['group', 'supergroup'])
async def unban_user_unban_user_node_synonym_разбанить_handler(message: types.Message):
    """
    Обработчик синонима 'разбанить' для unban_user
    Работает в группах с ответом на сообщение или с указанием ID пользователя
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Пользователь {user_id} использовал команду 'разбанить' для пользователя {target_user_id} (через ответ)")
    else:
        # Если нет ответа, проверяем текст на наличие ID пользователя
        text_parts = message.text.split()
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_user_id = int(text_parts[1])
            logging.info(f"Пользователь {user_id} использовал команду 'разбанить' для пользователя {target_user_id} (через ID)")
        else:
            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите 'разбанить ID_пользователя'")
            return
    
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя")
        return
    
    # Тип текущего узла для логирования
    current_node_type = "unban_user"
    try:
        await bot.unban_chat_member(chat_id=chat_id, user_id=target_user_id, only_if_banned=True)
        await message.answer(f"✅ Пользователь {target_user_id} разблокирован")
        logging.info(f"Пользователь {target_user_id} разблокирован администратором {user_id}")
    except TelegramBadRequest as e:
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для выполнения операции")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка {current_node_type}: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")

# @@NODE_END:unban_user_node@@
# @@NODE_START:unban_user_node@@

@dp.message(lambda message: message.text and (message.text.lower() == "разблокировать" or message.text.lower().startswith("разблокировать ")) and message.chat.type in ['group', 'supergroup'])
async def unban_user_unban_user_node_synonym_разблокировать_handler(message: types.Message):
    """
    Обработчик синонима 'разблокировать' для unban_user
    Работает в группах с ответом на сообщение или с указанием ID пользователя
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Пользователь {user_id} использовал команду 'разблокировать' для пользователя {target_user_id} (через ответ)")
    else:
        # Если нет ответа, проверяем текст на наличие ID пользователя
        text_parts = message.text.split()
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_user_id = int(text_parts[1])
            logging.info(f"Пользователь {user_id} использовал команду 'разблокировать' для пользователя {target_user_id} (через ID)")
        else:
            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите 'разблокировать ID_пользователя'")
            return
    
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя")
        return
    
    # Тип текущего узла для логирования
    current_node_type = "unban_user"
    try:
        await bot.unban_chat_member(chat_id=chat_id, user_id=target_user_id, only_if_banned=True)
        await message.answer(f"✅ Пользователь {target_user_id} разблокирован")
        logging.info(f"Пользователь {target_user_id} разблокирован администратором {user_id}")
    except TelegramBadRequest as e:
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для выполнения операции")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка {current_node_type}: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")

# @@NODE_END:unban_user_node@@
# @@NODE_START:unban_user_node@@

@dp.message(lambda message: message.text and (message.text.lower() == "unbан" or message.text.lower().startswith("unbан ")) and message.chat.type in ['group', 'supergroup'])
async def unban_user_unban_user_node_synonym_unbан_handler(message: types.Message):
    """
    Обработчик синонима 'unbан' для unban_user
    Работает в группах с ответом на сообщение или с указанием ID пользователя
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Пользователь {user_id} использовал команду 'unbан' для пользователя {target_user_id} (через ответ)")
    else:
        # Если нет ответа, проверяем текст на наличие ID пользователя
        text_parts = message.text.split()
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_user_id = int(text_parts[1])
            logging.info(f"Пользователь {user_id} использовал команду 'unbан' для пользователя {target_user_id} (через ID)")
        else:
            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите 'unbан ID_пользователя'")
            return
    
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя")
        return
    
    # Тип текущего узла для логирования
    current_node_type = "unban_user"
    try:
        await bot.unban_chat_member(chat_id=chat_id, user_id=target_user_id, only_if_banned=True)
        await message.answer(f"✅ Пользователь {target_user_id} разблокирован")
        logging.info(f"Пользователь {target_user_id} разблокирован администратором {user_id}")
    except TelegramBadRequest as e:
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для выполнения операции")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка {current_node_type}: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")

# @@NODE_END:unban_user_node@@
# @@NODE_START:mute_user_node@@

@dp.message(lambda message: message.text and (message.text.lower() == "замутить" or message.text.lower().startswith("замутить ")) and message.chat.type in ['group', 'supergroup'])
async def mute_user_mute_user_node_synonym_замутить_handler(message: types.Message):
    """
    Обработчик синонима 'замутить' для mute_user
    Работает в группах с ответом на сообщение или с указанием ID пользователя
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Пользователь {user_id} использовал команду 'замутить' для пользователя {target_user_id} (через ответ)")
    else:
        # Если нет ответа, проверяем текст на наличие ID пользователя
        text_parts = message.text.split()
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_user_id = int(text_parts[1])
            logging.info(f"Пользователь {user_id} использовал команду 'замутить' для пользователя {target_user_id} (через ID)")
        else:
            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите 'замутить ID_пользователя'")
            return
    
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя")
        return
    
    # Тип текущего узла для логирования
    current_node_type = "mute_user"
    try:
        from datetime import datetime, timedelta
        until_date = datetime.now() + timedelta(seconds=3600)
        await bot.restrict_chat_member(
            chat_id=chat_id, user_id=target_user_id,
            permissions=types.ChatPermissions(
                can_send_messages=False,
                can_send_media_messages=False
            ), until_date=until_date
        )
        hours = 3600 // 3600
        minutes = (3600 % 3600) // 60
        time_str = f"{hours}ч {minutes}м" if hours > 0 else f"{minutes}м"
        await message.answer(f"✅ Пользователь {target_user_id} ограничен на {time_str}\nПричина: Нарушение правил группы")
        logging.info(f"Пользователь {target_user_id} ограничен администратором {user_id}")
    except TelegramBadRequest as e:
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для выполнения операции")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка {current_node_type}: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")

# @@NODE_END:mute_user_node@@
# @@NODE_START:mute_user_node@@

@dp.message(lambda message: message.text and (message.text.lower() == "заглушить" or message.text.lower().startswith("заглушить ")) and message.chat.type in ['group', 'supergroup'])
async def mute_user_mute_user_node_synonym_заглушить_handler(message: types.Message):
    """
    Обработчик синонима 'заглушить' для mute_user
    Работает в группах с ответом на сообщение или с указанием ID пользователя
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Пользователь {user_id} использовал команду 'заглушить' для пользователя {target_user_id} (через ответ)")
    else:
        # Если нет ответа, проверяем текст на наличие ID пользователя
        text_parts = message.text.split()
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_user_id = int(text_parts[1])
            logging.info(f"Пользователь {user_id} использовал команду 'заглушить' для пользователя {target_user_id} (через ID)")
        else:
            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите 'заглушить ID_пользователя'")
            return
    
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя")
        return
    
    # Тип текущего узла для логирования
    current_node_type = "mute_user"
    try:
        from datetime import datetime, timedelta
        until_date = datetime.now() + timedelta(seconds=3600)
        await bot.restrict_chat_member(
            chat_id=chat_id, user_id=target_user_id,
            permissions=types.ChatPermissions(
                can_send_messages=False,
                can_send_media_messages=False
            ), until_date=until_date
        )
        hours = 3600 // 3600
        minutes = (3600 % 3600) // 60
        time_str = f"{hours}ч {minutes}м" if hours > 0 else f"{minutes}м"
        await message.answer(f"✅ Пользователь {target_user_id} ограничен на {time_str}\nПричина: Нарушение правил группы")
        logging.info(f"Пользователь {target_user_id} ограничен администратором {user_id}")
    except TelegramBadRequest as e:
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для выполнения операции")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка {current_node_type}: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")

# @@NODE_END:mute_user_node@@
# @@NODE_START:mute_user_node@@

@dp.message(lambda message: message.text and (message.text.lower() == "мут" or message.text.lower().startswith("мут ")) and message.chat.type in ['group', 'supergroup'])
async def mute_user_mute_user_node_synonym_мут_handler(message: types.Message):
    """
    Обработчик синонима 'мут' для mute_user
    Работает в группах с ответом на сообщение или с указанием ID пользователя
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Пользователь {user_id} использовал команду 'мут' для пользователя {target_user_id} (через ответ)")
    else:
        # Если нет ответа, проверяем текст на наличие ID пользователя
        text_parts = message.text.split()
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_user_id = int(text_parts[1])
            logging.info(f"Пользователь {user_id} использовал команду 'мут' для пользователя {target_user_id} (через ID)")
        else:
            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите 'мут ID_пользователя'")
            return
    
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя")
        return
    
    # Тип текущего узла для логирования
    current_node_type = "mute_user"
    try:
        from datetime import datetime, timedelta
        until_date = datetime.now() + timedelta(seconds=3600)
        await bot.restrict_chat_member(
            chat_id=chat_id, user_id=target_user_id,
            permissions=types.ChatPermissions(
                can_send_messages=False,
                can_send_media_messages=False
            ), until_date=until_date
        )
        hours = 3600 // 3600
        minutes = (3600 % 3600) // 60
        time_str = f"{hours}ч {minutes}м" if hours > 0 else f"{minutes}м"
        await message.answer(f"✅ Пользователь {target_user_id} ограничен на {time_str}\nПричина: Нарушение правил группы")
        logging.info(f"Пользователь {target_user_id} ограничен администратором {user_id}")
    except TelegramBadRequest as e:
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для выполнения операции")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка {current_node_type}: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")

# @@NODE_END:mute_user_node@@
# @@NODE_START:unmute_user_node@@

@dp.message(lambda message: message.text and (message.text.lower() == "размутить" or message.text.lower().startswith("размутить ")) and message.chat.type in ['group', 'supergroup'])
async def unmute_user_unmute_user_node_synonym_размутить_handler(message: types.Message):
    """
    Обработчик синонима 'размутить' для unmute_user
    Работает в группах с ответом на сообщение или с указанием ID пользователя
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Пользователь {user_id} использовал команду 'размутить' для пользователя {target_user_id} (через ответ)")
    else:
        # Если нет ответа, проверяем текст на наличие ID пользователя
        text_parts = message.text.split()
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_user_id = int(text_parts[1])
            logging.info(f"Пользователь {user_id} использовал команду 'размутить' для пользователя {target_user_id} (через ID)")
        else:
            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите 'размутить ID_пользователя'")
            return
    
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя")
        return
    
    # Тип текущего узла для логирования
    current_node_type = "unmute_user"
    try:
        await bot.restrict_chat_member(
            chat_id=chat_id, user_id=target_user_id,
            permissions=types.ChatPermissions(
                can_send_messages=True, can_send_media_messages=True,
                can_send_polls=True, can_send_other_messages=True,
                can_add_web_page_previews=True
            )
        )
        await message.answer(f"✅ Ограничения с пользователя {target_user_id} сняты")
        logging.info(f"Ограничения с пользователя {target_user_id} сняты администратором {user_id}")
    except TelegramBadRequest as e:
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для выполнения операции")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка {current_node_type}: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")

# @@NODE_END:unmute_user_node@@
# @@NODE_START:unmute_user_node@@

@dp.message(lambda message: message.text and (message.text.lower() == "разглушить" or message.text.lower().startswith("разглушить ")) and message.chat.type in ['group', 'supergroup'])
async def unmute_user_unmute_user_node_synonym_разглушить_handler(message: types.Message):
    """
    Обработчик синонима 'разглушить' для unmute_user
    Работает в группах с ответом на сообщение или с указанием ID пользователя
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Пользователь {user_id} использовал команду 'разглушить' для пользователя {target_user_id} (через ответ)")
    else:
        # Если нет ответа, проверяем текст на наличие ID пользователя
        text_parts = message.text.split()
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_user_id = int(text_parts[1])
            logging.info(f"Пользователь {user_id} использовал команду 'разглушить' для пользователя {target_user_id} (через ID)")
        else:
            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите 'разглушить ID_пользователя'")
            return
    
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя")
        return
    
    # Тип текущего узла для логирования
    current_node_type = "unmute_user"
    try:
        await bot.restrict_chat_member(
            chat_id=chat_id, user_id=target_user_id,
            permissions=types.ChatPermissions(
                can_send_messages=True, can_send_media_messages=True,
                can_send_polls=True, can_send_other_messages=True,
                can_add_web_page_previews=True
            )
        )
        await message.answer(f"✅ Ограничения с пользователя {target_user_id} сняты")
        logging.info(f"Ограничения с пользователя {target_user_id} сняты администратором {user_id}")
    except TelegramBadRequest as e:
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для выполнения операции")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка {current_node_type}: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")

# @@NODE_END:unmute_user_node@@
# @@NODE_START:unmute_user_node@@

@dp.message(lambda message: message.text and (message.text.lower() == "анмут" or message.text.lower().startswith("анмут ")) and message.chat.type in ['group', 'supergroup'])
async def unmute_user_unmute_user_node_synonym_анмут_handler(message: types.Message):
    """
    Обработчик синонима 'анмут' для unmute_user
    Работает в группах с ответом на сообщение или с указанием ID пользователя
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Пользователь {user_id} использовал команду 'анмут' для пользователя {target_user_id} (через ответ)")
    else:
        # Если нет ответа, проверяем текст на наличие ID пользователя
        text_parts = message.text.split()
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_user_id = int(text_parts[1])
            logging.info(f"Пользователь {user_id} использовал команду 'анмут' для пользователя {target_user_id} (через ID)")
        else:
            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите 'анмут ID_пользователя'")
            return
    
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя")
        return
    
    # Тип текущего узла для логирования
    current_node_type = "unmute_user"
    try:
        await bot.restrict_chat_member(
            chat_id=chat_id, user_id=target_user_id,
            permissions=types.ChatPermissions(
                can_send_messages=True, can_send_media_messages=True,
                can_send_polls=True, can_send_other_messages=True,
                can_add_web_page_previews=True
            )
        )
        await message.answer(f"✅ Ограничения с пользователя {target_user_id} сняты")
        logging.info(f"Ограничения с пользователя {target_user_id} сняты администратором {user_id}")
    except TelegramBadRequest as e:
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для выполнения операции")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка {current_node_type}: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")

# @@NODE_END:unmute_user_node@@
# @@NODE_START:kick_user_node@@

@dp.message(lambda message: message.text and (message.text.lower() == "кикнуть" or message.text.lower().startswith("кикнуть ")) and message.chat.type in ['group', 'supergroup'])
async def kick_user_kick_user_node_synonym_кикнуть_handler(message: types.Message):
    """
    Обработчик синонима 'кикнуть' для kick_user
    Работает в группах с ответом на сообщение или с указанием ID пользователя
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Пользователь {user_id} использовал команду 'кикнуть' для пользователя {target_user_id} (через ответ)")
    else:
        # Если нет ответа, проверяем текст на наличие ID пользователя
        text_parts = message.text.split()
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_user_id = int(text_parts[1])
            logging.info(f"Пользователь {user_id} использовал команду 'кикнуть' для пользователя {target_user_id} (через ID)")
        else:
            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите 'кикнуть ID_пользователя'")
            return
    
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя")
        return
    
    # Тип текущего узла для логирования
    current_node_type = "kick_user"
    try:
        await bot.ban_chat_member(chat_id=chat_id, user_id=target_user_id)
        await bot.unban_chat_member(chat_id=chat_id, user_id=target_user_id)
        await message.answer(f"✅ Пользователь {target_user_id} исключен из группы\nПричина: Нарушение правил группы")
        logging.info(f"Пользователь {target_user_id} исключен администратором {user_id}")
    except TelegramBadRequest as e:
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для выполнения операции")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка {current_node_type}: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")

# @@NODE_END:kick_user_node@@
# @@NODE_START:kick_user_node@@

@dp.message(lambda message: message.text and (message.text.lower() == "исключить" or message.text.lower().startswith("исключить ")) and message.chat.type in ['group', 'supergroup'])
async def kick_user_kick_user_node_synonym_исключить_handler(message: types.Message):
    """
    Обработчик синонима 'исключить' для kick_user
    Работает в группах с ответом на сообщение или с указанием ID пользователя
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Пользователь {user_id} использовал команду 'исключить' для пользователя {target_user_id} (через ответ)")
    else:
        # Если нет ответа, проверяем текст на наличие ID пользователя
        text_parts = message.text.split()
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_user_id = int(text_parts[1])
            logging.info(f"Пользователь {user_id} использовал команду 'исключить' для пользователя {target_user_id} (через ID)")
        else:
            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите 'исключить ID_пользователя'")
            return
    
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя")
        return
    
    # Тип текущего узла для логирования
    current_node_type = "kick_user"
    try:
        await bot.ban_chat_member(chat_id=chat_id, user_id=target_user_id)
        await bot.unban_chat_member(chat_id=chat_id, user_id=target_user_id)
        await message.answer(f"✅ Пользователь {target_user_id} исключен из группы\nПричина: Нарушение правил группы")
        logging.info(f"Пользователь {target_user_id} исключен администратором {user_id}")
    except TelegramBadRequest as e:
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для выполнения операции")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка {current_node_type}: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")

# @@NODE_END:kick_user_node@@
# @@NODE_START:kick_user_node@@

@dp.message(lambda message: message.text and (message.text.lower() == "выгнать" or message.text.lower().startswith("выгнать ")) and message.chat.type in ['group', 'supergroup'])
async def kick_user_kick_user_node_synonym_выгнать_handler(message: types.Message):
    """
    Обработчик синонима 'выгнать' для kick_user
    Работает в группах с ответом на сообщение или с указанием ID пользователя
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Пользователь {user_id} использовал команду 'выгнать' для пользователя {target_user_id} (через ответ)")
    else:
        # Если нет ответа, проверяем текст на наличие ID пользователя
        text_parts = message.text.split()
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_user_id = int(text_parts[1])
            logging.info(f"Пользователь {user_id} использовал команду 'выгнать' для пользователя {target_user_id} (через ID)")
        else:
            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите 'выгнать ID_пользователя'")
            return
    
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя")
        return
    
    # Тип текущего узла для логирования
    current_node_type = "kick_user"
    try:
        await bot.ban_chat_member(chat_id=chat_id, user_id=target_user_id)
        await bot.unban_chat_member(chat_id=chat_id, user_id=target_user_id)
        await message.answer(f"✅ Пользователь {target_user_id} исключен из группы\nПричина: Нарушение правил группы")
        logging.info(f"Пользователь {target_user_id} исключен администратором {user_id}")
    except TelegramBadRequest as e:
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для выполнения операции")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка {current_node_type}: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")

# @@NODE_END:kick_user_node@@
# @@NODE_START:promote_user_node@@

@dp.message(lambda message: message.text and (message.text.lower() == "повысить" or message.text.lower().startswith("повысить ")) and message.chat.type in ['group', 'supergroup'])
async def promote_user_promote_user_node_synonym_повысить_handler(message: types.Message):
    """
    Обработчик синонима 'повысить' для promote_user
    Работает в группах с ответом на сообщение или с указанием ID пользователя
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Пользователь {user_id} использовал команду 'повысить' для пользователя {target_user_id} (через ответ)")
    else:
        # Если нет ответа, проверяем текст на наличие ID пользователя
        text_parts = message.text.split()
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_user_id = int(text_parts[1])
            logging.info(f"Пользователь {user_id} использовал команду 'повысить' для пользователя {target_user_id} (через ID)")
        else:
            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите 'повысить ID_пользователя'")
            return
    
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя")
        return
    
    # Тип текущего узла для логирования
    current_node_type = "promote_user"
    try:
        await bot.promote_chat_member(
            chat_id=chat_id, user_id=target_user_id,
            can_delete_messages=True,
            can_invite_users=True,
            can_pin_messages=True
        )
        await message.answer(f"✅ Пользователь {target_user_id} назначен администратором")
        logging.info(f"Пользователь {target_user_id} назначен администратором пользователем {user_id}")
    except TelegramBadRequest as e:
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для выполнения операции")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка {current_node_type}: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")

# @@NODE_END:promote_user_node@@
# @@NODE_START:promote_user_node@@

@dp.message(lambda message: message.text and (message.text.lower() == "назначить админом" or message.text.lower().startswith("назначить админом ")) and message.chat.type in ['group', 'supergroup'])
async def promote_user_promote_user_node_synonym_назначить_админом_handler(message: types.Message):
    """
    Обработчик синонима 'назначить админом' для promote_user
    Работает в группах с ответом на сообщение или с указанием ID пользователя
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Пользователь {user_id} использовал команду 'назначить админом' для пользователя {target_user_id} (через ответ)")
    else:
        # Если нет ответа, проверяем текст на наличие ID пользователя
        text_parts = message.text.split()
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_user_id = int(text_parts[1])
            logging.info(f"Пользователь {user_id} использовал команду 'назначить админом' для пользователя {target_user_id} (через ID)")
        else:
            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите 'назначить админом ID_пользователя'")
            return
    
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя")
        return
    
    # Тип текущего узла для логирования
    current_node_type = "promote_user"
    try:
        await bot.promote_chat_member(
            chat_id=chat_id, user_id=target_user_id,
            can_delete_messages=True,
            can_invite_users=True,
            can_pin_messages=True
        )
        await message.answer(f"✅ Пользователь {target_user_id} назначен администратором")
        logging.info(f"Пользователь {target_user_id} назначен администратором пользователем {user_id}")
    except TelegramBadRequest as e:
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для выполнения операции")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка {current_node_type}: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")

# @@NODE_END:promote_user_node@@
# @@NODE_START:promote_user_node@@

@dp.message(lambda message: message.text and (message.text.lower() == "промоут" or message.text.lower().startswith("промоут ")) and message.chat.type in ['group', 'supergroup'])
async def promote_user_promote_user_node_synonym_промоут_handler(message: types.Message):
    """
    Обработчик синонима 'промоут' для promote_user
    Работает в группах с ответом на сообщение или с указанием ID пользователя
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Пользователь {user_id} использовал команду 'промоут' для пользователя {target_user_id} (через ответ)")
    else:
        # Если нет ответа, проверяем текст на наличие ID пользователя
        text_parts = message.text.split()
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_user_id = int(text_parts[1])
            logging.info(f"Пользователь {user_id} использовал команду 'промоут' для пользователя {target_user_id} (через ID)")
        else:
            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите 'промоут ID_пользователя'")
            return
    
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя")
        return
    
    # Тип текущего узла для логирования
    current_node_type = "promote_user"
    try:
        await bot.promote_chat_member(
            chat_id=chat_id, user_id=target_user_id,
            can_delete_messages=True,
            can_invite_users=True,
            can_pin_messages=True
        )
        await message.answer(f"✅ Пользователь {target_user_id} назначен администратором")
        logging.info(f"Пользователь {target_user_id} назначен администратором пользователем {user_id}")
    except TelegramBadRequest as e:
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для выполнения операции")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка {current_node_type}: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")

# @@NODE_END:promote_user_node@@
# @@NODE_START:demote_user_node@@

@dp.message(lambda message: message.text and (message.text.lower() == "понизить" or message.text.lower().startswith("понизить ")) and message.chat.type in ['group', 'supergroup'])
async def demote_user_demote_user_node_synonym_понизить_handler(message: types.Message):
    """
    Обработчик синонима 'понизить' для demote_user
    Работает в группах с ответом на сообщение или с указанием ID пользователя
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Пользователь {user_id} использовал команду 'понизить' для пользователя {target_user_id} (через ответ)")
    else:
        # Если нет ответа, проверяем текст на наличие ID пользователя
        text_parts = message.text.split()
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_user_id = int(text_parts[1])
            logging.info(f"Пользователь {user_id} использовал команду 'понизить' для пользователя {target_user_id} (через ID)")
        else:
            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите 'понизить ID_пользователя'")
            return
    
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя")
        return
    
    # Тип текущего узла для логирования
    current_node_type = "demote_user"
    try:
        await bot.promote_chat_member(
            chat_id=chat_id, user_id=target_user_id,
            can_change_info=False, can_delete_messages=False,
            can_invite_users=False, can_restrict_members=False,
            can_pin_messages=False, can_promote_members=False
        )
        await message.answer(f"✅ Права администратора сняты с пользователя {target_user_id}")
        logging.info(f"Права администратора сняты с пользователя {target_user_id} администратором {user_id}")
    except TelegramBadRequest as e:
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для выполнения операции")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка {current_node_type}: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")

# @@NODE_END:demote_user_node@@
# @@NODE_START:demote_user_node@@

@dp.message(lambda message: message.text and (message.text.lower() == "снять с админа" or message.text.lower().startswith("снять с админа ")) and message.chat.type in ['group', 'supergroup'])
async def demote_user_demote_user_node_synonym_снять_с_админа_handler(message: types.Message):
    """
    Обработчик синонима 'снять с админа' для demote_user
    Работает в группах с ответом на сообщение или с указанием ID пользователя
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Пользователь {user_id} использовал команду 'снять с админа' для пользователя {target_user_id} (через ответ)")
    else:
        # Если нет ответа, проверяем текст на наличие ID пользователя
        text_parts = message.text.split()
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_user_id = int(text_parts[1])
            logging.info(f"Пользователь {user_id} использовал команду 'снять с админа' для пользователя {target_user_id} (через ID)")
        else:
            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите 'снять с админа ID_пользователя'")
            return
    
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя")
        return
    
    # Тип текущего узла для логирования
    current_node_type = "demote_user"
    try:
        await bot.promote_chat_member(
            chat_id=chat_id, user_id=target_user_id,
            can_change_info=False, can_delete_messages=False,
            can_invite_users=False, can_restrict_members=False,
            can_pin_messages=False, can_promote_members=False
        )
        await message.answer(f"✅ Права администратора сняты с пользователя {target_user_id}")
        logging.info(f"Права администратора сняты с пользователя {target_user_id} администратором {user_id}")
    except TelegramBadRequest as e:
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для выполнения операции")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка {current_node_type}: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")

# @@NODE_END:demote_user_node@@
# @@NODE_START:demote_user_node@@

@dp.message(lambda message: message.text and (message.text.lower() == "демоут" or message.text.lower().startswith("демоут ")) and message.chat.type in ['group', 'supergroup'])
async def demote_user_demote_user_node_synonym_демоут_handler(message: types.Message):
    """
    Обработчик синонима 'демоут' для demote_user
    Работает в группах с ответом на сообщение или с указанием ID пользователя
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Пользователь {user_id} использовал команду 'демоут' для пользователя {target_user_id} (через ответ)")
    else:
        # Если нет ответа, проверяем текст на наличие ID пользователя
        text_parts = message.text.split()
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_user_id = int(text_parts[1])
            logging.info(f"Пользователь {user_id} использовал команду 'демоут' для пользователя {target_user_id} (через ID)")
        else:
            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите 'демоут ID_пользователя'")
            return
    
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя")
        return
    
    # Тип текущего узла для логирования
    current_node_type = "demote_user"
    try:
        await bot.promote_chat_member(
            chat_id=chat_id, user_id=target_user_id,
            can_change_info=False, can_delete_messages=False,
            can_invite_users=False, can_restrict_members=False,
            can_pin_messages=False, can_promote_members=False
        )
        await message.answer(f"✅ Права администратора сняты с пользователя {target_user_id}")
        logging.info(f"Права администратора сняты с пользователя {target_user_id} администратором {user_id}")
    except TelegramBadRequest as e:
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для выполнения операции")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка {current_node_type}: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")

# @@NODE_END:demote_user_node@@
# @@NODE_START:admin_rights_node@@

@dp.message(lambda message: message.text and (message.text.lower() == "права админа" or message.text.lower().startswith("права админа ")))
async def admin_rights_admin_rights_node_synonym_права_админа_handler(message: types.Message):
    """
    Обработчик синонима 'права админа' для admin_rights
    Работает в группах с ответом на сообщение или с указанием ID пользователя
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Пользователь {user_id} использовал команду 'права админа' для пользователя {target_user_id} (через ответ)")
    else:
        # Если нет ответа, проверяем текст на наличие ID пользователя
        text_parts = message.text.split()
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_user_id = int(text_parts[1])
            logging.info(f"Пользователь {user_id} использовал команду 'права админа' для пользователя {target_user_id} (через ID)")
        else:
            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите 'права админа ID_пользователя'")
            return
    
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя")
        return
    
    # Тип текущего узла для логирования
    current_node_type = "admin_rights"
    try:
        # Создаем Mock callback для эмуляции inline кнопки admin_rights
        class MockCallback:
            def __init__(self, data, user, msg):
                self.data = data
                self.from_user = user
                self.message = msg
            async def answer(self):
                pass  # Mock метод, ничего не делаем
            async def edit_text(self, text, **kwargs):
                try:
                    return await self.message.edit_text(text, **kwargs)
                except Exception as e:
                    logging.warning(f"Не удалось отредактировать сообщение: {e}")
                    return await self.message.answer(text, **kwargs)
        
        mock_callback = MockCallback("admin_rights_node", message.from_user, message)
        # bot уже определен глобально
        await handle_callback_admin_rights_node(mock_callback, bot)
        return  # Завершаем обработку, так как все сделано в callback
    except TelegramBadRequest as e:
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для выполнения операции")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка {current_node_type}: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")

# @@NODE_END:admin_rights_node@@
# @@NODE_START:admin_rights_node@@

@dp.message(lambda message: message.text and (message.text.lower() == "настроить права" or message.text.lower().startswith("настроить права ")))
async def admin_rights_admin_rights_node_synonym_настроить_права_handler(message: types.Message):
    """
    Обработчик синонима 'настроить права' для admin_rights
    Работает в группах с ответом на сообщение или с указанием ID пользователя
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Пользователь {user_id} использовал команду 'настроить права' для пользователя {target_user_id} (через ответ)")
    else:
        # Если нет ответа, проверяем текст на наличие ID пользователя
        text_parts = message.text.split()
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_user_id = int(text_parts[1])
            logging.info(f"Пользователь {user_id} использовал команду 'настроить права' для пользователя {target_user_id} (через ID)")
        else:
            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите 'настроить права ID_пользователя'")
            return
    
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя")
        return
    
    # Тип текущего узла для логирования
    current_node_type = "admin_rights"
    try:
        # Создаем Mock callback для эмуляции inline кнопки admin_rights
        class MockCallback:
            def __init__(self, data, user, msg):
                self.data = data
                self.from_user = user
                self.message = msg
            async def answer(self):
                pass  # Mock метод, ничего не делаем
            async def edit_text(self, text, **kwargs):
                try:
                    return await self.message.edit_text(text, **kwargs)
                except Exception as e:
                    logging.warning(f"Не удалось отредактировать сообщение: {e}")
                    return await self.message.answer(text, **kwargs)
        
        mock_callback = MockCallback("admin_rights_node", message.from_user, message)
        # bot уже определен глобально
        await handle_callback_admin_rights_node(mock_callback, bot)
        return  # Завершаем обработку, так как все сделано в callback
    except TelegramBadRequest as e:
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для выполнения операции")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка {current_node_type}: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")

# @@NODE_END:admin_rights_node@@
# @@NODE_START:admin_rights_node@@

@dp.message(lambda message: message.text and (message.text.lower() == "тг права" or message.text.lower().startswith("тг права ")))
async def admin_rights_admin_rights_node_synonym_тг_права_handler(message: types.Message):
    """
    Обработчик синонима 'тг права' для admin_rights
    Работает в группах с ответом на сообщение или с указанием ID пользователя
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Пользователь {user_id} использовал команду 'тг права' для пользователя {target_user_id} (через ответ)")
    else:
        # Если нет ответа, проверяем текст на наличие ID пользователя
        text_parts = message.text.split()
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_user_id = int(text_parts[1])
            logging.info(f"Пользователь {user_id} использовал команду 'тг права' для пользователя {target_user_id} (через ID)")
        else:
            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите 'тг права ID_пользователя'")
            return
    
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя")
        return
    
    # Тип текущего узла для логирования
    current_node_type = "admin_rights"
    try:
        # Создаем Mock callback для эмуляции inline кнопки admin_rights
        class MockCallback:
            def __init__(self, data, user, msg):
                self.data = data
                self.from_user = user
                self.message = msg
            async def answer(self):
                pass  # Mock метод, ничего не делаем
            async def edit_text(self, text, **kwargs):
                try:
                    return await self.message.edit_text(text, **kwargs)
                except Exception as e:
                    logging.warning(f"Не удалось отредактировать сообщение: {e}")
                    return await self.message.answer(text, **kwargs)
        
        mock_callback = MockCallback("admin_rights_node", message.from_user, message)
        # bot уже определен глобально
        await handle_callback_admin_rights_node(mock_callback, bot)
        return  # Завершаем обработку, так как все сделано в callback
    except TelegramBadRequest as e:
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для выполнения операции")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка {current_node_type}: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")

# @@NODE_END:admin_rights_node@@
# @@NODE_START:admin_rights_node@@

@dp.message(lambda message: message.text and (message.text.lower() == "права администратора" or message.text.lower().startswith("права администратора ")))
async def admin_rights_admin_rights_node_synonym_права_администратора_handler(message: types.Message):
    """
    Обработчик синонима 'права администратора' для admin_rights
    Работает в группах с ответом на сообщение или с указанием ID пользователя
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Пользователь {user_id} использовал команду 'права администратора' для пользователя {target_user_id} (через ответ)")
    else:
        # Если нет ответа, проверяем текст на наличие ID пользователя
        text_parts = message.text.split()
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_user_id = int(text_parts[1])
            logging.info(f"Пользователь {user_id} использовал команду 'права администратора' для пользователя {target_user_id} (через ID)")
        else:
            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите 'права администратора ID_пользователя'")
            return
    
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя")
        return
    
    # Тип текущего узла для логирования
    current_node_type = "admin_rights"
    try:
        # Создаем Mock callback для эмуляции inline кнопки admin_rights
        class MockCallback:
            def __init__(self, data, user, msg):
                self.data = data
                self.from_user = user
                self.message = msg
            async def answer(self):
                pass  # Mock метод, ничего не делаем
            async def edit_text(self, text, **kwargs):
                try:
                    return await self.message.edit_text(text, **kwargs)
                except Exception as e:
                    logging.warning(f"Не удалось отредактировать сообщение: {e}")
                    return await self.message.answer(text, **kwargs)
        
        mock_callback = MockCallback("admin_rights_node", message.from_user, message)
        # bot уже определен глобально
        await handle_callback_admin_rights_node(mock_callback, bot)
        return  # Завершаем обработку, так как все сделано в callback
    except TelegramBadRequest as e:
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для выполнения операции")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка {current_node_type}: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")

# @@NODE_END:admin_rights_node@@
# @@NODE_START:admin_rights_node@@

@dp.message(lambda message: message.text and (message.text.lower() == "admin rights" or message.text.lower().startswith("admin rights ")))
async def admin_rights_admin_rights_node_synonym_admin_rights_handler(message: types.Message):
    """
    Обработчик синонима 'admin rights' для admin_rights
    Работает в группах с ответом на сообщение или с указанием ID пользователя
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    
    # Определяем целевого пользователя
    target_user_id = None
    
    if message.reply_to_message:
        # Если есть ответ на сообщение - используем его
        target_user_id = message.reply_to_message.from_user.id
        logging.info(f"Пользователь {user_id} использовал команду 'admin rights' для пользователя {target_user_id} (через ответ)")
    else:
        # Если нет ответа, проверяем текст на наличие ID пользователя
        text_parts = message.text.split()
        if len(text_parts) > 1 and text_parts[1].isdigit():
            target_user_id = int(text_parts[1])
            logging.info(f"Пользователь {user_id} использовал команду 'admin rights' для пользователя {target_user_id} (через ID)")
        else:
            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите 'admin rights ID_пользователя'")
            return
    
    if not target_user_id:
        await message.answer("❌ Не удалось определить пользователя")
        return
    
    # Тип текущего узла для логирования
    current_node_type = "admin_rights"
    try:
        # Создаем Mock callback для эмуляции inline кнопки admin_rights
        class MockCallback:
            def __init__(self, data, user, msg):
                self.data = data
                self.from_user = user
                self.message = msg
            async def answer(self):
                pass  # Mock метод, ничего не делаем
            async def edit_text(self, text, **kwargs):
                try:
                    return await self.message.edit_text(text, **kwargs)
                except Exception as e:
                    logging.warning(f"Не удалось отредактировать сообщение: {e}")
                    return await self.message.answer(text, **kwargs)
        
        mock_callback = MockCallback("admin_rights_node", message.from_user, message)
        # bot уже определен глобально
        await handle_callback_admin_rights_node(mock_callback, bot)
        return  # Завершаем обработку, так как все сделано в callback
    except TelegramBadRequest as e:
        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):
            await message.answer("❌ Недостаточно прав для выполнения операции")
        else:
            await message.answer(f"❌ Ошибка: {e}")
        logging.error(f"Ошибка {current_node_type}: {e}")
    except Exception as e:
        await message.answer("❌ Произошла неожиданная ошибка")
        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")

# @@NODE_END:admin_rights_node@@

# Обработчики автопереходов

@dp.callback_query(lambda c: c.data == "join_request" or c.data.startswith("join_request_btn_") or c.data == "done_in_request")
async def handle_callback_join_request(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_join_request для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_join_request: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла join_request
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_join_request"] = True
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла join_request: true")
    
    # Проверяем, был ли переход через кнопку с skipDataCollection
    skip_transition_flag = user_data.get(user_id, {}).get("skipDataCollectionTransition", False)
    if not skip_transition_flag:
        await update_user_data_in_db(user_id, "join_request_response", callback_query.data)
        logging.info(f"Переменная join_request_response сохранена: " + str(callback_query.data) + f" (пользователь {user_id})")
    else:
        # Сбрасываем флаг
        if user_id in user_data and "skipDataCollectionTransition" in user_data[user_id]:
            del user_data[user_id]["skipDataCollectionTransition"]
        logging.info(f"Переход через skipDataCollection, переменная join_request_response не сохраняется (пользователь {user_id})")
    
    # Обрабатываем узел join_request: join_request
    text = "Хочешь присоединиться к нашему чату? 🚀"
    
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
    
    # Отправляем сообщение
    try:
        if keyboard:
            await safe_edit_or_send(callback_query, text, reply_markup=keyboard)
        else:
            # Для узлов без кнопок просто отправляем новое сообщение (избегаем дубликатов при автопереходах)
            await callback_query.message.answer(text)
    except Exception as e:
        logging.debug(f"Ошибка отправки сообщения: {e}")
        if keyboard:
            await callback_query.message.answer(text, reply_markup=keyboard)
        else:
            await callback_query.message.answer(text)
    
    # Устанавливаем waiting_for_input, так как автопереход не выполнен
    user_data[user_id] = user_data.get(user_id, {})
    user_data[user_id]["waiting_for_input"] = {
        "type": "text",
        "modes": ["text"],
        "variable": "join_request_response",
        "save_to_database": True,
        "node_id": "join_request",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной join_request_response (узел join_request)")
    user_id = callback_query.from_user.id
    
    
    # Удаляем старое сообщение
    
    text = "Хочешь присоединиться к нашему чату? 🚀"
    # ИСПРАВЛЕНИЕ: Не отправляем сообщение второй раз, если оно уже было отправлено ранее в обработчике
    # Вместо этого, просто настраиваем ожидание ввода
    # Настраиваем ожидание ввода (collectUserInput=true)
    user_data[callback_query.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "variable": "join_request_response",
        "save_to_database": False,
        "node_id": "join_request",
        "next_node_id": ""
    }
    return

@dp.callback_query(lambda c: c.data == "decline_response" or c.data.startswith("decline_response_btn_") or c.data == "done_e_response")
async def handle_callback_decline_response(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_decline_response для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_decline_response: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла decline_response
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_decline_response"] = False
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла decline_response: false")
    
    # Обрабатываем узел decline_response: decline_response
    text = "Понятно! Если передумаешь, напиши /start! 😊"
    
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
    
    # Отправляем сообщение
    try:
        if keyboard:
            await safe_edit_or_send(callback_query, text, reply_markup=keyboard)
        else:
            # Для узлов без кнопок просто отправляем новое сообщение (избегаем дубликатов при автопереходах)
            await callback_query.message.answer(text)
    except Exception as e:
        logging.debug(f"Ошибка отправки сообщения: {e}")
        if keyboard:
            await callback_query.message.answer(text, reply_markup=keyboard)
        else:
            await callback_query.message.answer(text)
    
    # Устанавливаем waiting_for_input, так как автопереход не выполнен
    user_data[user_id] = user_data.get(user_id, {})
    user_data[user_id]["waiting_for_input"] = {
        "type": "text",
        "modes": ["text"],
        "variable": "response_decline_response",
        "save_to_database": True,
        "node_id": "decline_response",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной response_decline_response (узел decline_response)")
    user_id = callback_query.from_user.id
    
    # Сохраняем нажатие кнопки в базу данных
    # Ищем текят кнопки по callback_data
    button_display_text = "Нет 🙅"
    
    # Сохраняем ответ в базу данных
    timestamp = get_moscow_time()
    
    response_data = button_display_text  # Простое значение
    
    # Сохраняем в пользовательские данные
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["button_click"] = button_display_text
    
    # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, была ли показана условная клавиатура
    # Если да - НЕ сохраняем переменную сейчас, ждём выбора пользователя
    has_conditional_keyboard_for_save = user_data.get(user_id, {}).get("_has_conditional_keyboard", False)
    if not has_conditional_keyboard_for_save:
        # Сохраняем в базу данных с правильным именем переяенной
        await update_user_data_in_db(user_id, "join_request_response", button_display_text)
        logging.info(f"Переменная join_request_response сохранена: " + str(button_display_text) + f" (пользователь {user_id})")
    else:
        logging.info("⏸️ Пропускаем сохранение переменной: показана условная клавиатура, ждём выбор пользователя")
    
    
    return

@dp.callback_query(lambda c: c.data == "pin_message_node" or c.data.startswith("pin_message_node_btn_") or c.data == "done_ssage_node")
async def handle_callback_pin_message_node(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_pin_message_node для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_pin_message_node: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла pin_message_node
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_pin_message_node"] = False
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла pin_message_node: false")
    
    # Обрабатываем узел pin_message_node: pin_message_node
    text = "📌 Сообщение успешно закреплено!"
    
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
    
    # Отправляем сообщение
    try:
        if keyboard:
            await safe_edit_or_send(callback_query, text, reply_markup=keyboard)
        else:
            # Для узлов без кнопок просто отправляем новое сообщение (избегаем дубликатов при автопереходах)
            await callback_query.message.answer(text)
    except Exception as e:
        logging.debug(f"Ошибка отправки сообщения: {e}")
        if keyboard:
            await callback_query.message.answer(text, reply_markup=keyboard)
        else:
            await callback_query.message.answer(text)
    
    # Устанавливаем waiting_for_input, так как автопереход не выполнен
    user_data[user_id] = user_data.get(user_id, {})
    user_data[user_id]["waiting_for_input"] = {
        "type": "text",
        "modes": ["text"],
        "variable": "response_pin_message_node",
        "save_to_database": True,
        "node_id": "pin_message_node",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной response_pin_message_node (узел pin_message_node)")
    user_id = callback_query.from_user.id
    
    
    return

@dp.callback_query(lambda c: c.data == "unpin_message_node" or c.data.startswith("unpin_message_node_btn_") or c.data == "done_ssage_node")
async def handle_callback_unpin_message_node(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_unpin_message_node для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_unpin_message_node: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла unpin_message_node
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_unpin_message_node"] = False
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла unpin_message_node: false")
    
    # Обрабатываем узел unpin_message_node: unpin_message_node
    text = "📌❌ Сообщение успешно откреплено!"
    
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
    
    # Отправляем сообщение
    try:
        if keyboard:
            await safe_edit_or_send(callback_query, text, reply_markup=keyboard)
        else:
            # Для узлов без кнопок просто отправляем новое сообщение (избегаем дубликатов при автопереходах)
            await callback_query.message.answer(text)
    except Exception as e:
        logging.debug(f"Ошибка отправки сообщения: {e}")
        if keyboard:
            await callback_query.message.answer(text, reply_markup=keyboard)
        else:
            await callback_query.message.answer(text)
    
    # Устанавливаем waiting_for_input, так как автопереход не выполнен
    user_data[user_id] = user_data.get(user_id, {})
    user_data[user_id]["waiting_for_input"] = {
        "type": "text",
        "modes": ["text"],
        "variable": "response_unpin_message_node",
        "save_to_database": True,
        "node_id": "unpin_message_node",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной response_unpin_message_node (узел unpin_message_node)")
    user_id = callback_query.from_user.id
    
    
    return

@dp.callback_query(lambda c: c.data == "delete_message_node" or c.data.startswith("delete_message_node_btn_") or c.data == "done_ssage_node")
async def handle_callback_delete_message_node(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_delete_message_node для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_delete_message_node: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла delete_message_node
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_delete_message_node"] = False
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла delete_message_node: false")
    
    # Обрабатываем узел delete_message_node: delete_message_node
    text = "🗑️ Сообщение успешно удалено!"
    
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
    
    # Отправляем сообщение
    try:
        if keyboard:
            await safe_edit_or_send(callback_query, text, reply_markup=keyboard)
        else:
            # Для узлов без кнопок просто отправляем новое сообщение (избегаем дубликатов при автопереходах)
            await callback_query.message.answer(text)
    except Exception as e:
        logging.debug(f"Ошибка отправки сообщения: {e}")
        if keyboard:
            await callback_query.message.answer(text, reply_markup=keyboard)
        else:
            await callback_query.message.answer(text)
    
    # Устанавливаем waiting_for_input, так как автопереход не выполнен
    user_data[user_id] = user_data.get(user_id, {})
    user_data[user_id]["waiting_for_input"] = {
        "type": "text",
        "modes": ["text"],
        "variable": "response_delete_message_node",
        "save_to_database": True,
        "node_id": "delete_message_node",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной response_delete_message_node (узел delete_message_node)")
    user_id = callback_query.from_user.id
    
    
    return

@dp.callback_query(lambda c: c.data == "ban_user_node" or c.data.startswith("ban_user_node_btn_") or c.data == "done_user_node")
async def handle_callback_ban_user_node(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_ban_user_node для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_ban_user_node: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла ban_user_node
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_ban_user_node"] = False
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла ban_user_node: false")
    
    # Обрабатываем узел ban_user_node: ban_user_node
    text = "🚫 Пользователь заблокирован в группе!"
    
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
    
    # Отправляем сообщение
    try:
        if keyboard:
            await safe_edit_or_send(callback_query, text, reply_markup=keyboard)
        else:
            # Для узлов без кнопок просто отправляем новое сообщение (избегаем дубликатов при автопереходах)
            await callback_query.message.answer(text)
    except Exception as e:
        logging.debug(f"Ошибка отправки сообщения: {e}")
        if keyboard:
            await callback_query.message.answer(text, reply_markup=keyboard)
        else:
            await callback_query.message.answer(text)
    
    # Устанавливаем waiting_for_input, так как автопереход не выполнен
    user_data[user_id] = user_data.get(user_id, {})
    user_data[user_id]["waiting_for_input"] = {
        "type": "text",
        "modes": ["text"],
        "variable": "response_ban_user_node",
        "save_to_database": True,
        "node_id": "ban_user_node",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной response_ban_user_node (узел ban_user_node)")
    user_id = callback_query.from_user.id
    
    
    return

@dp.callback_query(lambda c: c.data == "unban_user_node" or c.data.startswith("unban_user_node_btn_") or c.data == "done_user_node")
async def handle_callback_unban_user_node(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_unban_user_node для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_unban_user_node: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла unban_user_node
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_unban_user_node"] = False
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла unban_user_node: false")
    
    # Обрабатываем узел unban_user_node: unban_user_node
    text = "✅ Пользователь разблокирован!"
    
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
    
    # Отправляем сообщение
    try:
        if keyboard:
            await safe_edit_or_send(callback_query, text, reply_markup=keyboard)
        else:
            # Для узлов без кнопок просто отправляем новое сообщение (избегаем дубликатов при автопереходах)
            await callback_query.message.answer(text)
    except Exception as e:
        logging.debug(f"Ошибка отправки сообщения: {e}")
        if keyboard:
            await callback_query.message.answer(text, reply_markup=keyboard)
        else:
            await callback_query.message.answer(text)
    
    # Устанавливаем waiting_for_input, так как автопереход не выполнен
    user_data[user_id] = user_data.get(user_id, {})
    user_data[user_id]["waiting_for_input"] = {
        "type": "text",
        "modes": ["text"],
        "variable": "response_unban_user_node",
        "save_to_database": True,
        "node_id": "unban_user_node",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной response_unban_user_node (узел unban_user_node)")
    user_id = callback_query.from_user.id
    
    
    return

@dp.callback_query(lambda c: c.data == "mute_user_node" or c.data.startswith("mute_user_node_btn_") or c.data == "done_user_node")
async def handle_callback_mute_user_node(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_mute_user_node для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_mute_user_node: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла mute_user_node
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_mute_user_node"] = False
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла mute_user_node: false")
    
    # Обрабатываем узел mute_user_node: mute_user_node
    text = "🔇 Пользователь ограничен в правах!"
    
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
    
    # Отправляем сообщение
    try:
        if keyboard:
            await safe_edit_or_send(callback_query, text, reply_markup=keyboard)
        else:
            # Для узлов без кнопок просто отправляем новое сообщение (избегаем дубликатов при автопереходах)
            await callback_query.message.answer(text)
    except Exception as e:
        logging.debug(f"Ошибка отправки сообщения: {e}")
        if keyboard:
            await callback_query.message.answer(text, reply_markup=keyboard)
        else:
            await callback_query.message.answer(text)
    
    # Устанавливаем waiting_for_input, так как автопереход не выполнен
    user_data[user_id] = user_data.get(user_id, {})
    user_data[user_id]["waiting_for_input"] = {
        "type": "text",
        "modes": ["text"],
        "variable": "response_mute_user_node",
        "save_to_database": True,
        "node_id": "mute_user_node",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной response_mute_user_node (узел mute_user_node)")
    user_id = callback_query.from_user.id
    
    
    return

@dp.callback_query(lambda c: c.data == "unmute_user_node" or c.data.startswith("unmute_user_node_btn_") or c.data == "done_user_node")
async def handle_callback_unmute_user_node(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_unmute_user_node для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_unmute_user_node: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла unmute_user_node
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_unmute_user_node"] = False
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла unmute_user_node: false")
    
    # Обрабатываем узел unmute_user_node: unmute_user_node
    text = "🔊 Ограничения с пользователя сняты!"
    
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
    
    # Отправляем сообщение
    try:
        if keyboard:
            await safe_edit_or_send(callback_query, text, reply_markup=keyboard)
        else:
            # Для узлов без кнопок просто отправляем новое сообщение (избегаем дубликатов при автопереходах)
            await callback_query.message.answer(text)
    except Exception as e:
        logging.debug(f"Ошибка отправки сообщения: {e}")
        if keyboard:
            await callback_query.message.answer(text, reply_markup=keyboard)
        else:
            await callback_query.message.answer(text)
    
    # Устанавливаем waiting_for_input, так как автопереход не выполнен
    user_data[user_id] = user_data.get(user_id, {})
    user_data[user_id]["waiting_for_input"] = {
        "type": "text",
        "modes": ["text"],
        "variable": "response_unmute_user_node",
        "save_to_database": True,
        "node_id": "unmute_user_node",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной response_unmute_user_node (узел unmute_user_node)")
    user_id = callback_query.from_user.id
    
    
    return

@dp.callback_query(lambda c: c.data == "kick_user_node" or c.data.startswith("kick_user_node_btn_") or c.data == "done_user_node")
async def handle_callback_kick_user_node(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_kick_user_node для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_kick_user_node: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла kick_user_node
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_kick_user_node"] = False
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла kick_user_node: false")
    
    # Обрабатываем узел kick_user_node: kick_user_node
    text = "👢 Пользователь исключен из группы!"
    
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
    
    # Отправляем сообщение
    try:
        if keyboard:
            await safe_edit_or_send(callback_query, text, reply_markup=keyboard)
        else:
            # Для узлов без кнопок просто отправляем новое сообщение (избегаем дубликатов при автопереходах)
            await callback_query.message.answer(text)
    except Exception as e:
        logging.debug(f"Ошибка отправки сообщения: {e}")
        if keyboard:
            await callback_query.message.answer(text, reply_markup=keyboard)
        else:
            await callback_query.message.answer(text)
    
    # Устанавливаем waiting_for_input, так как автопереход не выполнен
    user_data[user_id] = user_data.get(user_id, {})
    user_data[user_id]["waiting_for_input"] = {
        "type": "text",
        "modes": ["text"],
        "variable": "response_kick_user_node",
        "save_to_database": True,
        "node_id": "kick_user_node",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной response_kick_user_node (узел kick_user_node)")
    user_id = callback_query.from_user.id
    
    
    return

@dp.callback_query(lambda c: c.data == "promote_user_node" or c.data.startswith("promote_user_node_btn_") or c.data == "done_user_node")
async def handle_callback_promote_user_node(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_promote_user_node для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_promote_user_node: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла promote_user_node
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_promote_user_node"] = False
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла promote_user_node: false")
    
    # Обрабатываем узел promote_user_node: promote_user_node
    text = "👑 Пользователь назначен администратором!"
    
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
    
    # Отправляем сообщение
    try:
        if keyboard:
            await safe_edit_or_send(callback_query, text, reply_markup=keyboard)
        else:
            # Для узлов без кнопок просто отправляем новое сообщение (избегаем дубликатов при автопереходах)
            await callback_query.message.answer(text)
    except Exception as e:
        logging.debug(f"Ошибка отправки сообщения: {e}")
        if keyboard:
            await callback_query.message.answer(text, reply_markup=keyboard)
        else:
            await callback_query.message.answer(text)
    
    # Устанавливаем waiting_for_input, так как автопереход не выполнен
    user_data[user_id] = user_data.get(user_id, {})
    user_data[user_id]["waiting_for_input"] = {
        "type": "text",
        "modes": ["text"],
        "variable": "response_promote_user_node",
        "save_to_database": True,
        "node_id": "promote_user_node",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной response_promote_user_node (узел promote_user_node)")
    user_id = callback_query.from_user.id
    
    
    return

@dp.callback_query(lambda c: c.data == "demote_user_node" or c.data.startswith("demote_user_node_btn_") or c.data == "done_user_node")
async def handle_callback_demote_user_node(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_demote_user_node для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_demote_user_node: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла demote_user_node
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_demote_user_node"] = False
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла demote_user_node: false")
    
    # Обрабатываем узел demote_user_node: demote_user_node
    text = "👤 Пользователь снят с должности администратора!"
    
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
    
    # Отправляем сообщение
    try:
        if keyboard:
            await safe_edit_or_send(callback_query, text, reply_markup=keyboard)
        else:
            # Для узлов без кнопок просто отправляем новое сообщение (избегаем дубликатов при автопереходах)
            await callback_query.message.answer(text)
    except Exception as e:
        logging.debug(f"Ошибка отправки сообщения: {e}")
        if keyboard:
            await callback_query.message.answer(text, reply_markup=keyboard)
        else:
            await callback_query.message.answer(text)
    
    # Устанавливаем waiting_for_input, так как автопереход не выполнен
    user_data[user_id] = user_data.get(user_id, {})
    user_data[user_id]["waiting_for_input"] = {
        "type": "text",
        "modes": ["text"],
        "variable": "response_demote_user_node",
        "save_to_database": True,
        "node_id": "demote_user_node",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной response_demote_user_node (узел demote_user_node)")
    user_id = callback_query.from_user.id
    
    
    return

@dp.callback_query(lambda c: c.data == "admin_rights_node" or c.data.startswith("admin_rights_node_btn_") or c.data == "done_ights_node")
async def handle_callback_admin_rights_node(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_admin_rights_node для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_admin_rights_node: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла admin_rights_node
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_admin_rights_node"] = False
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла admin_rights_node: false")
    
    # Обрабатываем узел admin_rights_node: admin_rights_node
    text = """⚙️ Права администратора настроены для пользователя!

💡 Чтобы настроить права, ответьте на сообщение пользователя и используйте команду /admin_rights"""
    
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
    
    # Отправляем сообщение
    try:
        if keyboard:
            await safe_edit_or_send(callback_query, text, reply_markup=keyboard)
        else:
            # Для узлов без кнопок просто отправляем новое сообщение (избегаем дубликатов при автопереходах)
            await callback_query.message.answer(text)
    except Exception as e:
        logging.debug(f"Ошибка отправки сообщения: {e}")
        if keyboard:
            await callback_query.message.answer(text, reply_markup=keyboard)
        else:
            await callback_query.message.answer(text)
    
    # Устанавливаем waiting_for_input, так как автопереход не выполнен
    user_data[user_id] = user_data.get(user_id, {})
    user_data[user_id]["waiting_for_input"] = {
        "type": "text",
        "modes": ["text"],
        "variable": "response_admin_rights_node",
        "save_to_database": True,
        "node_id": "admin_rights_node",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной response_admin_rights_node (узел admin_rights_node)")
    user_id = callback_query.from_user.id
    
    
    return


# Универсальный обработчик пользовательского ввода
@dp.message(F.text)
async def handle_user_input(message: types.Message):
    user_id = message.from_user.id
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, message.from_user)
    
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
                    answer=lambda text="", show_alert=False: asyncio.sleep(0)
                )
                if skip_button_target == "start":
                    await handle_callback_start(fake_callback)
                elif skip_button_target == "join_request":
                    await handle_callback_join_request(fake_callback)
                elif skip_button_target == "decline_response":
                    await handle_callback_decline_response(fake_callback)
                elif skip_button_target == "pin_message_node":
                    await handle_callback_pin_message_node(fake_callback)
                elif skip_button_target == "unpin_message_node":
                    await handle_callback_unpin_message_node(fake_callback)
                elif skip_button_target == "delete_message_node":
                    await handle_callback_delete_message_node(fake_callback)
                elif skip_button_target == "ban_user_node":
                    await handle_callback_ban_user_node(fake_callback)
                elif skip_button_target == "unban_user_node":
                    await handle_callback_unban_user_node(fake_callback)
                elif skip_button_target == "mute_user_node":
                    await handle_callback_mute_user_node(fake_callback)
                elif skip_button_target == "unmute_user_node":
                    await handle_callback_unmute_user_node(fake_callback)
                elif skip_button_target == "kick_user_node":
                    await handle_callback_kick_user_node(fake_callback)
                elif skip_button_target == "promote_user_node":
                    await handle_callback_promote_user_node(fake_callback)
                elif skip_button_target == "demote_user_node":
                    await handle_callback_demote_user_node(fake_callback)
                elif skip_button_target == "admin_rights_node":
                    await handle_callback_admin_rights_node(fake_callback)
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
                        answer=lambda text="", show_alert=False: asyncio.sleep(0)
                    )
                    
                    if next_node_id == "start":
                        # Узел собирает пользовательский ввод
                        logging.info(f"🔧 Условная навигация к узлу с вводом: start")
                        text = """🌟 Привет от ᴠᴨᴩᴏᴦʏᴧᴋᴇ Bot!

Этот бот поможет тебе найти интересных людей в Санкт-Петербурге!

Откуда ты узнал о нашем чате? 😎"""
                        await message.answer(text)
                        # Настраиваем ожидание ввода
                        user_data[user_id]["waiting_for_input"] = {
                            "type": "text",
                            "modes": ["text"],
                            "variable": "user_source",
                            "save_to_database": True,
                            "node_id": "start",
                            "next_node_id": "join_request"
                        }
                        logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной user_source (узел start)")
                    elif next_node_id == "join_request":
                        # ИСПРАВЛЕНИЕ: У узла есть кнопки - показываем их И настраиваем ожидание для сохранения ответа
                        logging.info(f"✅ Показаны кнопки для узла join_request с collectUserInput=true")
                        text = "Хочешь присоединиться к нашему чату? 🚀"
                        user_data[user_id] = user_data.get(user_id, {})
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
                        
                        builder = InlineKeyboardBuilder()
                        builder.add(InlineKeyboardButton(text="Да 😎", callback_data="gender_selection"))
                        builder.add(InlineKeyboardButton(text="Нет 🙅", callback_data="decline_response"))
                        builder.adjust(1)
                        keyboard = builder.as_markup()
                        await message.answer(text, reply_markup=keyboard)
                        # Настраиваем ожидание ввода для сохранения ответа кнопки
                        user_data[user_id]["waiting_for_input"] = {
                            "type": "button",
                            "modes": ['button'],
                            "variable": "join_request_response",
                            "save_to_database": True,
                            "node_id": "join_request",
                            "next_node_id": "",
                            "skip_buttons": []
                        }
                        logging.info(f"✅ Сояяяятояние ожид����ия настроено: modes=['button'] для пер��менной join_request_response (узел join_request)")
                    elif next_node_id == "decline_response":
                        # Обычный узел - отправляем сообщение
                        text = "Понятно! Если передумаешь, напиши /start! 😊"
                        user_data[user_id] = user_data.get(user_id, {})
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
                        
                        logging.info(f"Условная навигация к обычному узлу: decline_response")
                        await message.answer(text)
                    elif next_node_id == "pin_message_node":
                        # Обычный узел - отправляем сообщение
                        text = "📌 Сообщение успешно закреплено!"
                        user_data[user_id] = user_data.get(user_id, {})
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
                        
                        logging.info(f"Условная навигация к обычному узлу: pin_message_node")
                        await message.answer(text)
                    elif next_node_id == "unpin_message_node":
                        # Обычный узел - отправляем сообщение
                        text = "📌❌ Сообщение успешно откреплено!"
                        user_data[user_id] = user_data.get(user_id, {})
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
                        
                        logging.info(f"Условная навигация к обычному узлу: unpin_message_node")
                        await message.answer(text)
                    elif next_node_id == "delete_message_node":
                        # Обычный узел - отправляем сообщение
                        text = "🗑️ Сообщение успешно удалено!"
                        user_data[user_id] = user_data.get(user_id, {})
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
                        
                        logging.info(f"Условная навигация к обычному узлу: delete_message_node")
                        await message.answer(text)
                    elif next_node_id == "ban_user_node":
                        # Обычный узел - отправляем сообщение
                        text = "🚫 Пользователь заблокирован в группе!"
                        user_data[user_id] = user_data.get(user_id, {})
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
                        
                        logging.info(f"Условная навигация к обычному узлу: ban_user_node")
                        await message.answer(text)
                    elif next_node_id == "unban_user_node":
                        # Обычный узел - отправляем сообщение
                        text = "✅ Пользователь разблокирован!"
                        user_data[user_id] = user_data.get(user_id, {})
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
                        
                        logging.info(f"Условная навигация к обычному узлу: unban_user_node")
                        await message.answer(text)
                    elif next_node_id == "mute_user_node":
                        # Обычный узел - отправляем сообщение
                        text = "🔇 Пользователь ограничен в правах!"
                        user_data[user_id] = user_data.get(user_id, {})
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
                        
                        logging.info(f"Условная навигация к обычному узлу: mute_user_node")
                        await message.answer(text)
                    elif next_node_id == "unmute_user_node":
                        # Обычный узел - отправляем сообщение
                        text = "🔊 Ограничения с пользователя сняты!"
                        user_data[user_id] = user_data.get(user_id, {})
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
                        
                        logging.info(f"Условная навигация к обычному узлу: unmute_user_node")
                        await message.answer(text)
                    elif next_node_id == "kick_user_node":
                        # Обычный узел - отправляем сообщение
                        text = "👢 Пользователь исключен из группы!"
                        user_data[user_id] = user_data.get(user_id, {})
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
                        
                        logging.info(f"Условная навигация к обычному узлу: kick_user_node")
                        await message.answer(text)
                    elif next_node_id == "promote_user_node":
                        # Обычный узел - отправляем сообщение
                        text = "👑 Пользователь назначен администратором!"
                        user_data[user_id] = user_data.get(user_id, {})
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
                        
                        logging.info(f"Условная навигация к обычному узлу: promote_user_node")
                        await message.answer(text)
                    elif next_node_id == "demote_user_node":
                        # Обычный узел - отправляем сообщение
                        text = "👤 Пользователь снят с должности администратора!"
                        user_data[user_id] = user_data.get(user_id, {})
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
                        
                        logging.info(f"Условная навигация к обычному узлу: demote_user_node")
                        await message.answer(text)
                    elif next_node_id == "admin_rights_node":
                        # Обычный узел - отправляем сообщение
                        text = """⚙️ Права администратора настроены для пользователя!

💡 Чтобы настроить права, ответьте на сообщение пользователя и используйте команду /admin_rights"""
                        user_data[user_id] = user_data.get(user_id, {})
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
                        
                        logging.info(f"Условная навигация к обычному узлу: admin_rights_node")
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
            
            if option_action == "url" and option_url:
                # Открытие ссылки
                url = option_url
                keyboard = InlineKeyboardMarkup(inline_keyboard=[
                    [InlineKeyboardButton(text="🔗 Открыть ссылку", url=url)]
                ])
                await message.answer("Нажмите кнопку ниже, чтобы открыть ссылку:", reply_markup=keyboard)
            elif option_action == "command" and option_target:
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
                    elif target_node_id == "join_request":
                        await handle_callback_join_request(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "decline_response":
                        await handle_callback_decline_response(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "pin_message_node":
                        await handle_callback_pin_message_node(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "unpin_message_node":
                        await handle_callback_unpin_message_node(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "delete_message_node":
                        await handle_callback_delete_message_node(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "ban_user_node":
                        await handle_callback_ban_user_node(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "unban_user_node":
                        await handle_callback_unban_user_node(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "mute_user_node":
                        await handle_callback_mute_user_node(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "unmute_user_node":
                        await handle_callback_unmute_user_node(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "kick_user_node":
                        await handle_callback_kick_user_node(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "promote_user_node":
                        await handle_callback_promote_user_node(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "demote_user_node":
                        await handle_callback_demote_user_node(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "admin_rights_node":
                        await handle_callback_admin_rights_node(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
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
                        elif next_node_id == "join_request":
                            await handle_callback_join_request(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "decline_response":
                            await handle_callback_decline_response(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "pin_message_node":
                            await handle_callback_pin_message_node(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "unpin_message_node":
                            await handle_callback_unpin_message_node(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "delete_message_node":
                            await handle_callback_delete_message_node(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "ban_user_node":
                            await handle_callback_ban_user_node(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "unban_user_node":
                            await handle_callback_unban_user_node(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "mute_user_node":
                            await handle_callback_mute_user_node(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "unmute_user_node":
                            await handle_callback_unmute_user_node(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "kick_user_node":
                            await handle_callback_kick_user_node(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "promote_user_node":
                            await handle_callback_promote_user_node(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "demote_user_node":
                            await handle_callback_demote_user_node(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "admin_rights_node":
                            await handle_callback_admin_rights_node(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
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
                            answer=lambda text="", show_alert=False: asyncio.sleep(0)
                        )
                        if skip_target == "start":
                            await handle_callback_start(fake_callback)
                        elif skip_target == "join_request":
                            await handle_callback_join_request(fake_callback)
                        elif skip_target == "decline_response":
                            await handle_callback_decline_response(fake_callback)
                        elif skip_target == "pin_message_node":
                            await handle_callback_pin_message_node(fake_callback)
                        elif skip_target == "unpin_message_node":
                            await handle_callback_unpin_message_node(fake_callback)
                        elif skip_target == "delete_message_node":
                            await handle_callback_delete_message_node(fake_callback)
                        elif skip_target == "ban_user_node":
                            await handle_callback_ban_user_node(fake_callback)
                        elif skip_target == "unban_user_node":
                            await handle_callback_unban_user_node(fake_callback)
                        elif skip_target == "mute_user_node":
                            await handle_callback_mute_user_node(fake_callback)
                        elif skip_target == "unmute_user_node":
                            await handle_callback_unmute_user_node(fake_callback)
                        elif skip_target == "kick_user_node":
                            await handle_callback_kick_user_node(fake_callback)
                        elif skip_target == "promote_user_node":
                            await handle_callback_promote_user_node(fake_callback)
                        elif skip_target == "demote_user_node":
                            await handle_callback_demote_user_node(fake_callback)
                        elif skip_target == "admin_rights_node":
                            await handle_callback_admin_rights_node(fake_callback)
                        else:
                            logging.warning(f"Неизвестный целевой узел skipDataCollection медиа: {skip_target}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к узлу skipDataCollection медиа {skip_target}: {e}")
                return
    
    # Проверяем, ожидаем ли мы текстовый ввод от пользователя (универсальная система)
    has_waiting_state = user_id in user_data and "waiting_for_input" in user_data[user_id]
    logging.info(f"DEBUG: Получен текст {message.text}, состояние ожидания: {has_waiting_state}")
    if user_id in user_data and "waiting_for_input" in user_data[user_id]:
        # Обрабатываем ввод через универсальную систему
        waiting_config = user_data[user_id]["waiting_for_input"]
        
        # Проверяем, что пользователь все еще находится в состоянии ожидания ввода
        if not waiting_config:
            return  # Состояние ожидания пустое, игнорируем
        
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
                                answer=lambda text="", show_alert=False: asyncio.sleep(0)
                            )
                            if skip_target == "start":
                                await handle_callback_start(fake_callback)
                            elif skip_target == "join_request":
                                await handle_callback_join_request(fake_callback)
                            elif skip_target == "decline_response":
                                await handle_callback_decline_response(fake_callback)
                            elif skip_target == "pin_message_node":
                                await handle_callback_pin_message_node(fake_callback)
                            elif skip_target == "unpin_message_node":
                                await handle_callback_unpin_message_node(fake_callback)
                            elif skip_target == "delete_message_node":
                                await handle_callback_delete_message_node(fake_callback)
                            elif skip_target == "ban_user_node":
                                await handle_callback_ban_user_node(fake_callback)
                            elif skip_target == "unban_user_node":
                                await handle_callback_unban_user_node(fake_callback)
                            elif skip_target == "mute_user_node":
                                await handle_callback_mute_user_node(fake_callback)
                            elif skip_target == "unmute_user_node":
                                await handle_callback_unmute_user_node(fake_callback)
                            elif skip_target == "kick_user_node":
                                await handle_callback_kick_user_node(fake_callback)
                            elif skip_target == "promote_user_node":
                                await handle_callback_promote_user_node(fake_callback)
                            elif skip_target == "demote_user_node":
                                await handle_callback_demote_user_node(fake_callback)
                            elif skip_target == "admin_rights_node":
                                await handle_callback_admin_rights_node(fake_callback)
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
                        elif current_node_id == "join_request":
                            text = "Хочешь присоединиться к нашему чату? 🚀"
                            # Замена переменных в тексте
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
                            
                            # Заменяем все переменные в тексте
                            text = replace_variables_in_text(text, user_vars)
                            # Устанавливаем состояние ожидания ввода для узла join_request
                            user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
                            user_data[message.from_user.id]["waiting_for_input"] = {
                                "type": "text",
                                "modes": ["text"],
                                "variable": "join_request_response",
                                "save_to_database": True,
                                "node_id": "join_request",
                                "next_node_id": "",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной join_request_response (узел join_request)")
                            logging.info(f"✅ Узел join_request настроен для сбора ввода (collectUserInput=true)")
                            # Заменяем все переменные в тексте
                            text = replace_variables_in_text(text, user_vars)
                            await message.answer(text)
                            # Настраиваем ожидание ввода для message узла (универсальная функция опяяяяеделит тип: text/photo/video/audio/document)
                            user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
                            user_data[message.from_user.id]["waiting_for_input"] = {
                                "type": "text",
                                "modes": ["text"],
                                "variable": "join_request_response",
                                "save_to_database": True,
                                "node_id": "join_request",
                                "next_node_id": "",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной join_request_response (узел join_request)")
                        elif current_node_id == "decline_response":
                            text = "Понятно! Если передумаешь, напиши /start! 😊"
                            # Замена переменных в тексте
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
                            
                            # Заменяем все переменные в тексте
                            text = replace_variables_in_text(text, user_vars)
                            # Заменяем все переменные в тексте
                            text = replace_variables_in_text(text, user_vars)
                            await message.answer(text)
                            # НЕ отправляем сообщение об успехе здесь - это делается в старом формате
                            # Очищаем сястояние ожидания ввода после уяпеянояо перехода
                            if "waiting_for_input" in user_data[user_id]:
                                del user_data[user_id]["waiting_for_input"]
                            
                            logging.info("✅ Переход к следующему уялу выполнен успешно")
                            break  # Нет автоперехода, завершаем цикл
                        elif current_node_id == "pin_message_node":
                            logging.info(f"Переход к узлу pin_message_node типа pin_message")
                            break  # Выходим из цикла для неизвестного типа узла
                        elif current_node_id == "unpin_message_node":
                            logging.info(f"Переход к узлу unpin_message_node типа unpin_message")
                            break  # Выходим из цикла для неизвестного типа узла
                        elif current_node_id == "delete_message_node":
                            logging.info(f"Переход к узлу delete_message_node типа delete_message")
                            break  # Выходим из цикла для неизвестного типа узла
                        elif current_node_id == "ban_user_node":
                            logging.info(f"Переход к узлу ban_user_node типа ban_user")
                            break  # Выходим из цикла для неизвестного типа узла
                        elif current_node_id == "unban_user_node":
                            logging.info(f"Переход к узлу unban_user_node типа unban_user")
                            break  # Выходим из цикла для неизвестного типа узла
                        elif current_node_id == "mute_user_node":
                            logging.info(f"Переход к узлу mute_user_node типа mute_user")
                            break  # Выходим из цикла для неизвестного типа узла
                        elif current_node_id == "unmute_user_node":
                            logging.info(f"Переход к узлу unmute_user_node типа unmute_user")
                            break  # Выходим из цикла для неизвестного типа узла
                        elif current_node_id == "kick_user_node":
                            logging.info(f"Переход к узлу kick_user_node типа kick_user")
                            break  # Выходим из цикла для неизвестного типа узла
                        elif current_node_id == "promote_user_node":
                            logging.info(f"Переход к узлу promote_user_node типа promote_user")
                            break  # Выходим из цикла для неизвестного типа узла
                        elif current_node_id == "demote_user_node":
                            logging.info(f"Переход к узлу demote_user_node типа demote_user")
                            break  # Выходим из цикла для неизвестного типа узла
                        elif current_node_id == "admin_rights_node":
                            logging.info(f"Переход к узлу admin_rights_node типа admin_rights")
                            break  # Выходим из цикла для неизвестного типа узла
                        else:
                            logging.warning(f"Неизвестный узел: {current_node_id}")
                            break  # Выходим из цикла при неизвестном узле
                except Exception as e:
                    logging.error(f"Ошибка при переходе к узлу: {e}")
            
            return  # Завершаем обработку для нового формата
        
        # Обработка старого формата (для совместимости)
        # Находим узел для получения настроек
        logging.info(f"DEBUG old format: checking inputNodes: start, join_request")
        if waiting_node_id == "start":
            
            # Сохраняем ответ пользователя
            import datetime
            timestamp = get_moscow_time()
            
            # Сохраняем простое значение для совместимости с логикой профиля
            response_data = user_text  # Простое значение вместо сложного объекта
            
            # Сохраняем в пользовательские данные
            user_data[user_id]["user_source"] = response_data
            
            # Сохраняем в базу данных
            saved_to_db = await update_user_data_in_db(user_id, "user_source", response_data)
            if saved_to_db:
                logging.info(f"✅ Данные сохранены в БД: user_source = {user_text} (пользователь {user_id})")
            else:
                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            
            logging.info(f"Получен пользовательский ввод: user_source = {user_text}")
            
            # Переходим к следующему узлу
            try:
                # Отправляем сообщение для узла join_request
                text = "Хочешь присоединиться к нашему чату? 🚀"
                # Настраиваем новое ожидание ввода для узла join_request
                user_data[user_id]["waiting_for_input"] = {
                    "type": "text",
                    "variable": "join_request_response",
                    "save_to_database": True,
                    "node_id": "join_request",
                    "next_node_id": "",
                    "min_length": 0,
                    "max_length": 0,
                    "retry_message": "Пожалуйста, попробуйте еще раз.",
                    "success_message": ""
                }
                
                # Заменяем все переменные в тексте
                text = replace_variables_in_text(text, user_vars)
                await message.answer(text)
                
                logging.info("✅ Переход к следующему узлу выполнен успешно")
            except Exception as e:
                logging.error(f"Ошябка при переходе к следующему узлу: {e}")
            return
        elif waiting_node_id == "join_request":
            
            # Сохраняем ответ пользователя
            import datetime
            timestamp = get_moscow_time()
            
            # Сохраняем простое значение для совместимости с логикой профиля
            response_data = user_text  # Простое значение вместо сложного объекта
            
            # Сохраняем в пользовательские данные
            user_data[user_id]["join_request_response"] = response_data
            
            # Сохраняем в базу данных
            saved_to_db = await update_user_data_in_db(user_id, "join_request_response", response_data)
            if saved_to_db:
                logging.info(f"✅ Данные сохранены в БД: join_request_response = {user_text} (пользователь {user_id})")
            else:
                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            
            logging.info(f"Получен пользовательский ввод: join_request_response = {user_text}")
            
            # Конец цепочки ввода - завершаем обработку
            logging.info("Завершена цепочка сбора пользовательских данных")
            return

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
        import sys
        sys.exit(0)
    
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
        
        # Закрываем сессию бота
        await bot.session.close()
if __name__ == "__main__":
    asyncio.run(main())
