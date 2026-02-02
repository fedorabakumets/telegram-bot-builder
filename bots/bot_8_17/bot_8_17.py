"""
Новый бот 2 - Telegram Bot
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
PROJECT_ID = int(os.getenv("PROJECT_ID", 8))  # ID проекта в системе

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

# Middleware для сохранения нажатий на кнопки
async def callback_query_logging_middleware(handler, event: types.CallbackQuery, data: dict):
    """Middleware для автоматического сохранения нажатий на кнопки"""
    try:
        user_id = str(event.from_user.id)
        callback_data = event.data or ""
        
        # Пытаемся найти текст кнопки из сообщения
        button_text = None
        if event.message and hasattr(event.message, "reply_markup"):
            reply_markup = event.message.reply_markup
            if hasattr(reply_markup, "inline_keyboard"):
                for row in reply_markup.inline_keyboard:
                    for btn in row:
                        if hasattr(btn, "callback_data") and btn.callback_data == callback_data:
                            button_text = btn.text
                            break
                    if button_text:
                        break
        
        # Сохраняем информацию о нажатии кнопки
        message_text_to_save = f"[Нажата кнопка: {button_text}]" if button_text else "[Нажата кнопка]"
        await save_message_to_api(
            user_id=user_id,
            message_type="user",
            message_text=message_text_to_save,
            message_data={
                "button_clicked": True,
                "button_text": button_text,
                "callback_data": callback_data
            }
        )
    except Exception as e:
        logging.error(f"Ошибка в middleware сохранения нажатий кнопок: {e}")
    
    # Продолжаем обработку callback query
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


# Функция для сохранения статистики сообщений пользователя
async def save_user_message_stats(user_id: str, message_text: str):
    """Сохраняет статистику сообщения пользователя в базу данных"""
    await save_message_to_api(
        user_id=user_id,
        message_type="user",
        message_text=message_text
    )

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
        # Команда start - Запустить бота
        BotCommand(command="start", description="Запустить бота"),
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
    # Проверяем условные сообщения
    text = "Сколько тебе лет?"  # Основной текст узла как fallback
    conditional_parse_mode = None
    conditional_keyboard = None
    
    # Получаем данные пользователя для проверки условий
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    
    # Безопасно извлекаем user_data
    if isinstance(user_record, dict):
        if "user_data" in user_record and isinstance(user_record["user_data"], dict):
            user_data_dict = user_record["user_data"]
        else:
            user_data_dict = user_record
    else:
        user_data_dict = {}
    
    # Инициализируем базовые переменные пользователя если их нет
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Проверяем наличие message (для message handlers)
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user
        
        if user_obj:
            init_user_variables(user_id, user_obj)
    
    # Подставляем все доступные переменные пользователя в текст кнопок
    user_vars = await get_user_from_db(user_id)
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    
    # get_user_from_db теперь возвращает уже обработанные user_data
    if not isinstance(user_vars, dict):
        user_vars = {}
    
    # Заменяем все переменные в тексте
    import re
    def replace_variables_in_text(text_content, variables_dict):
        if not text_content or not variables_dict:
            return text_content
        
        for var_name, var_data in variables_dict.items():
            placeholder = "{" + var_name + "}"
            if placeholder in text_content:
                if isinstance(var_data, dict) and "value" in var_data:
                    var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                elif var_data is not None:
                    var_value = str(var_data)
                else:
                    var_value = var_name  # Показываем имя переменной если значения нет
                text_content = text_content.replace(placeholder, var_value)
        return text_content
    
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        # Дополнительная проверка: если переменная не найдена напрямую, проверяем, не является ли она частью user_data в другом формате
        # Это может случиться, если переменная была сохранена в формате, отличном от ожидаемого
        if "user_data" in user_data_dict and isinstance(user_data_dict["user_data"], dict):
            nested_data = user_data_dict["user_data"]
            if var_name in nested_data:
                raw_value = nested_data[var_name]
                if isinstance(raw_value, dict) and "value" in raw_value:
                    var_value = raw_value["value"]
                    # Проверяем, что значение действительно существует и не пустое
                    if var_value is not None and str(var_value).strip() != "":
                        return True, str(var_value)
                else:
                    # Проверяем, что значение действительно существует и не пустое
                    if raw_value is not None and str(raw_value).strip() != "":
                        return True, str(raw_value)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: age
    if (
        check_user_variable("age", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["age"] = check_user_variable("age", user_data_dict)
        text = "Сколько тебе лет?"
        conditional_parse_mode = None
        if "{age}" in text and variable_values["age"] is not None:
            text = text.replace("{age}", variable_values["age"])
        # Создаем reply клавиатуру для условного сообщения
        builder = ReplyKeyboardBuilder()
        builder.add(KeyboardButton(text=replace_variables_in_text("{age}", user_vars)))
        keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
        conditional_keyboard = keyboard
        # ВАЖНО: Логируем состояние условной клавиатуры для отладки
        logging.info(f"🎹 Условная клавиатура для user_data_exists: conditional_keyboard={'установлена' if conditional_keyboard else 'не установлена'}")
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "condition-1763692642023",
            "wait_for_input": True,
            "input_variable": "age",
            "next_node_id": "f90r9k3FSLu2Tjn74cBn_",
            "source_type": "conditional_message",
            "skip_buttons": []
        }
        # Настраиваем ожидание ввода для условного сообщения с waitForTextInput
        if conditional_message_config and conditional_message_config.get("wait_for_input"):
            if user_id not in user_data:
                user_data[user_id] = {}
            user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config
            logging.info(f"Активировано ожидание условного ввода (переменная существует, но ждём новое значение): {conditional_message_config}")
            # ВАЖНО: Переменная существует, но waitForTextInput=true, поэтому НЕ делаем автопереход
            # Сбрасываем флаг условия чтобы fallback показал сообщение и дождался ввода
            # НО мы уже установили waiting_for_conditional_input, так что НЕ нужно делать break
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
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
    
    # Проверка условных сообщений для клавиатуры
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    user_data_dict = user_record if user_record else user_data.get(user_id, {})
    # Инициализируем базовые переменные пользователя если их нет
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Проверяем наличие message (для message handlers)
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user
        
        if user_obj:
            init_user_variables(user_id, user_obj)
    
    # Подставляем все доступные переменные пользователя в текст кнопок
    user_vars = await get_user_from_db(user_id)
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    
    # get_user_from_db теперь возвращает уже обработанные user_data
    if not isinstance(user_vars, dict):
        user_vars = {}
    
    # Заменяем все переменные в тексте
    import re
    def replace_variables_in_text(text_content, variables_dict):
        if not text_content or not variables_dict:
            return text_content
        
        for var_name, var_data in variables_dict.items():
            placeholder = "{" + var_name + "}"
            if placeholder in text_content:
                if isinstance(var_data, dict) and "value" in var_data:
                    var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                elif var_data is not None:
                    var_value = str(var_data)
                else:
                    var_value = var_name  # Показываем имя переменной если значения нет
                text_content = text_content.replace(placeholder, var_value)
        return text_content
    
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        # Дополнительная проверка: если переменная не найдена напрямую, проверяем, не является ли она частью user_data в другом формате
        # Это может случиться, если переменная была сохранена в формате, отличном от ожидаемого
        if "user_data" in user_data_dict and isinstance(user_data_dict["user_data"], dict):
            nested_data = user_data_dict["user_data"]
            if var_name in nested_data:
                raw_value = nested_data[var_name]
                if isinstance(raw_value, dict) and "value" in raw_value:
                    var_value = raw_value["value"]
                    # Проверяем, что значение действительно существует и не пустое
                    if var_value is not None and str(var_value).strip() != "":
                        return True, str(var_value)
                else:
                    # Проверяем, что значение действительно существует и не пустое
                    if raw_value is not None and str(raw_value).strip() != "":
                        return True, str(raw_value)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: age
    if (
        check_user_variable("age", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["age"] = check_user_variable("age", user_data_dict)
        # Условное сообщение пустое, используем основной текст узла (text уже инициализирован)
        conditional_parse_mode = None
        if "{age}" in text and variable_values["age"] is not None:
            text = text.replace("{age}", variable_values["age"])
        # Создаем reply клавиатуру для условного сообщения
        builder = ReplyKeyboardBuilder()
        builder.add(KeyboardButton(text=replace_variables_in_text("{age}", user_vars)))
        keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
        conditional_keyboard = keyboard
        # ВАЖНО: Логируем состояние условной клавиатуры для отладки
        logging.info(f"🎹 Условная клавиатура для user_data_exists: conditional_keyboard={'установлена' if conditional_keyboard else 'не установлена'}")
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "condition-1763692642023",
            "wait_for_input": True,
            "input_variable": "age",
            "next_node_id": "f90r9k3FSLu2Tjn74cBn_",
            "source_type": "conditional_message",
            "skip_buttons": []
        }
        # Настраиваем ожидание ввода для условного сообщения с waitForTextInput
        if conditional_message_config and conditional_message_config.get("wait_for_input"):
            if user_id not in user_data:
                user_data[user_id] = {}
            user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config
            logging.info(f"Активировано ожидание условного ввода (переменная существует, но ждём новое значение): {conditional_message_config}")
            # ВАЖНО: Переменная существует, но waitForTextInput=true, поэтому НЕ делаем автопереход
            # Сбрасываем флаг условия чтобы fallback показал сообщение и дождался ввода
            # НО мы уже установили waiting_for_conditional_input, так что НЕ нужно делать break
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
    # Используем условное сообщение если есть подходящее условие
    if "text" not in locals():
        # Используем исходный текст клавиатуры если условие не сработало
        pass  # text уже установлен выше
    
    # Проверяем, нужно ли использовать условную клавиатуру
    use_conditional_keyboard = conditional_keyboard is not None
    # Определяем режим форматирования (приоритет у условного сообщения)
    if "conditional_parse_mode" in locals() and conditional_parse_mode is not None:
        current_parse_mode = conditional_parse_mode
    else:
        current_parse_mode = None
    has_regular_buttons = False
    has_input_collection = True
    logging.info(f"DEBUG: generateKeyboard для узла start - hasRegularButtons={has_regular_buttons}, hasInputCollection={has_input_collection}, collectUserInput=true, enableTextInput=true, enablePhotoInput=undefined, enableVideoInput=undefined, enableAudioInput=undefined, enableDocumentInput=undefined")
    
    # Проверяем, нужно ли использовать условную клавиатуру
    if use_conditional_keyboard:
        await message.answer(text, reply_markup=conditional_keyboard, parse_mode=current_parse_mode if current_parse_mode else None)
    else:
        await message.answer(text, parse_mode=current_parse_mode if current_parse_mode else None)
    
    # Устанавливаем состояние ожидания ввода с полной структурой
    user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
    user_data[message.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "modes": ["text"],
        "variable": "age",
        "save_to_database": True,
        "node_id": "start",
        "next_node_id": "f90r9k3FSLu2Tjn74cBn_",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной age (узел start)")
# @@NODE_END:start@@

# @@NODE_START:f90r9k3FSLu2Tjn74cBn_@@
# @@NODE_END:f90r9k3FSLu2Tjn74cBn_@@

# @@NODE_START:RFTgm4KzC6dI39AMTPcmo@@
# @@NODE_END:RFTgm4KzC6dI39AMTPcmo@@

# @@NODE_START:sIh3xXKEtb_TtrhHqZQzX@@
# @@NODE_END:sIh3xXKEtb_TtrhHqZQzX@@

# @@NODE_START:tS2XGL2Mn4LkE63SnxhPy@@
# @@NODE_END:tS2XGL2Mn4LkE63SnxhPy@@

# @@NODE_START:lBPy3gcGVLla0NGdSYb35@@
# @@NODE_END:lBPy3gcGVLla0NGdSYb35@@

# @@NODE_START:Y9zLRp1BLpVhm-HcsNkJV@@
# @@NODE_END:Y9zLRp1BLpVhm-HcsNkJV@@

# @@NODE_START:vxPv7G4n0QGyhnv4ucOM5@@
# @@NODE_END:vxPv7G4n0QGyhnv4ucOM5@@

# @@NODE_START:8xSJaWAJNz7Hz_54mjFTF@@
# @@NODE_END:8xSJaWAJNz7Hz_54mjFTF@@

# @@NODE_START:KE-8sR9elPEefApjXtBxC@@
# @@NODE_END:KE-8sR9elPEefApjXtBxC@@

# @@NODE_START:yrsc8v81qQa5oQx538Dzn@@
# @@NODE_END:yrsc8v81qQa5oQx538Dzn@@

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "f90r9k3FSLu2Tjn74cBn_" or c.data.startswith("f90r9k3FSLu2Tjn74cBn__btn_") or c.data == "done_2Tjn74cBn_")
async def handle_callback_f90r9k3FSLu2Tjn74cBn_(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_f90r9k3FSLu2Tjn74cBn_ для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_f90r9k3FSLu2Tjn74cBn_: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла f90r9k3FSLu2Tjn74cBn_
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_f90r9k3FSLu2Tjn74cBn_"] = True
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла f90r9k3FSLu2Tjn74cBn_: true")
    
    # Проверяем, был ли переход через кнопку с skipDataCollection
    skip_transition_flag = user_data.get(user_id, {}).get("skipDataCollectionTransition", False)
    if not skip_transition_flag:
        await update_user_data_in_db(user_id, "gender", callback_query.data)
        logging.info(f"Переменная gender сохранена: " + str(callback_query.data) + f" (пользователь {user_id})")
    else:
        # Сбрасываем флаг
        if user_id in user_data and "skipDataCollectionTransition" in user_data[user_id]:
            del user_data[user_id]["skipDataCollectionTransition"]
        logging.info(f"Переход через skipDataCollection, переменная gender не сохраняется (пользователь {user_id})")
    
    # Обрабатываем узел f90r9k3FSLu2Tjn74cBn_: f90r9k3FSLu2Tjn74cBn_
    text = "Теперь определимся с полом"
    
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
    # Create reply keyboard
    # Удаляем старое сообщение и отправляем новое с reply клавиатурой
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="Я девушка"))
    builder.add(KeyboardButton(text="Я парень"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    # Для reply клавиатуры нужно отправить новое сообщение
    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)
    
    # Настройка waiting_for_input для узла с reply клавиатурой (collectUserInput=true)
    user_id = callback_query.from_user.id
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["waiting_for_input"] = {
        "type": "button",
        "modes": ['button', 'text'],
        "variable": "gender",
        "save_to_database": True,
        "node_id": "f90r9k3FSLu2Tjn74cBn_",
        "next_node_id": "",
        "skip_buttons": []
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['button', 'text'] для переменной gender (узел f90r9k3FSLu2Tjn74cBn_)")
    return  # Возвращаемся чтобы не отправить сообщение дважды
    
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
        "type": "button",
        "modes": ["button", "text"],
        "variable": "gender",
        "save_to_database": True,
        "node_id": "f90r9k3FSLu2Tjn74cBn_",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['button', 'text'] для переменной gender (узел f90r9k3FSLu2Tjn74cBn_)")
    user_id = callback_query.from_user.id
    
    # ПЕРЕАДРЕСАЦИЯ: Переходим к следующему узлу после сояранения данных
    next_node_id = "RFTgm4KzC6dI39AMTPcmo"
    try:
        logging.info(f"🚀 Переходим к следующему узлу после выбора кнопки: {next_node_id}")
        if next_node_id == "start":
            logging.info("Переход к узлу start")
        elif next_node_id == "f90r9k3FSLu2Tjn74cBn_":
            nav_text = "Теперь определимся с полом"
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            # Удаляем старое сообщение и отправляем новое с reply клавиатурой
            builder = ReplyKeyboardBuilder()
            builder.add(KeyboardButton(text="Я девушка"))
            builder.add(KeyboardButton(text="Я парень"))
            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
            await bot.send_message(callback_query.from_user.id, nav_text, reply_markup=keyboard)
            # ИСПРАВЛЕНИЕ: Проверяем, не была ли переменная уже сохранена inline кнопкой
            user_id = callback_query.from_user.id
            if user_id not in user_data:
                user_data[user_id] = {}
            # Проверяем, не была ли переменная gender уже сохранена
            if "gender" not in user_data[user_id] or not user_data[user_id]["gender"]:
                # Переменная не сохранена - используем универсальную функцию для настройки ожидания ввода
                # Тип ввода: text
                            user_data[callback_query.from_user.id] = user_data.get(callback_query.from_user.id, {})
                            user_data[callback_query.from_user.id]["waiting_for_input"] = {
                                "type": "button",
                                "modes": ["button", "text"],
                                "variable": "gender",
                                "save_to_database": True,
                                "node_id": "f90r9k3FSLu2Tjn74cBn_",
                                "next_node_id": "",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['button', 'text'] для переменной gender (узел f90r9k3FSLu2Tjn74cBn_)")
            else:
                logging.info(f"⏭️ Переменная gender уже сохранена, пропускаем ожидание ввода")
        elif next_node_id == "RFTgm4KzC6dI39AMTPcmo":
            nav_text = "Кто тебе интересен?"
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            # Удаляем старое сообщение и отправляем новое с reply клавиатурой
            builder = ReplyKeyboardBuilder()
            builder.add(KeyboardButton(text="Девушки"))
            builder.add(KeyboardButton(text="Парни"))
            builder.add(KeyboardButton(text="Все равно"))
            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
            await bot.send_message(callback_query.from_user.id, nav_text, reply_markup=keyboard)
            # ИСПРАВЛЕНИЕ: Проверяем, не была ли переменная уже сохранена inline кнопкой
            user_id = callback_query.from_user.id
            if user_id not in user_data:
                user_data[user_id] = {}
            # Проверяем, не была ли переменная sex уже сохранена
            if "sex" not in user_data[user_id] or not user_data[user_id]["sex"]:
                # Переменная не сохранена - используем универсальную функцию для настройки ожидания ввода
                # Тип ввода: text
                            user_data[callback_query.from_user.id] = user_data.get(callback_query.from_user.id, {})
                            user_data[callback_query.from_user.id]["waiting_for_input"] = {
                                "type": "button",
                                "modes": ["button", "text"],
                                "variable": "sex",
                                "save_to_database": True,
                                "node_id": "RFTgm4KzC6dI39AMTPcmo",
                                "next_node_id": "",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['button', 'text'] для переменной sex (узел RFTgm4KzC6dI39AMTPcmo)")
            else:
                logging.info(f"⏭️ Переменная sex уже сохранена, пропускаем ожидание ввода")
        elif next_node_id == "sIh3xXKEtb_TtrhHqZQzX":
            # Узел с условными сообщениями - вызываем полноценный обработчик
            logging.info(f"🔧 Callback навигация к узлу с условными сообщениями: sIh3xXKEtb_TtrhHqZQzX")
            await handle_node_sIh3xXKEtb_TtrhHqZQzX(callback_query.message)
        elif next_node_id == "tS2XGL2Mn4LkE63SnxhPy":
            # Узел с условными сообщениями - вызываем полноценный обработчик
            logging.info(f"🔧 Callback навигация к узлу с условными сообщениями: tS2XGL2Mn4LkE63SnxhPy")
            await handle_node_tS2XGL2Mn4LkE63SnxhPy(callback_query.message)
        elif next_node_id == "lBPy3gcGVLla0NGdSYb35":
            # Узел с условными сообщениями - вызываем полноценный обработчик
            logging.info(f"🔧 Callback навигация к узлу с условными сообщениями: lBPy3gcGVLla0NGdSYb35")
            await handle_node_lBPy3gcGVLla0NGdSYb35(callback_query.message)
        elif next_node_id == "Y9zLRp1BLpVhm-HcsNkJV":
            # Узел с условными сообщениями - вызываем полноценный обработчик
            logging.info(f"🔧 Callback навигация к узлу с условными сообщениями: Y9zLRp1BLpVhm-HcsNkJV")
            await handle_node_Y9zLRp1BLpVhm_HcsNkJV(callback_query.message)
        elif next_node_id == "vxPv7G4n0QGyhnv4ucOM5":
            nav_text = "Так выглядит твоя анкета:"
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            await callback_query.message.edit_text(nav_text)
            
            # Проверяем, не ждем ли мы ввод перед автопереходом
            if user_id in user_data and ("waiting_for_input" in user_data[user_id] or "waiting_for_conditional_input" in user_data[user_id]):
                logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем ввод для узла vxPv7G4n0QGyhnv4ucOM5")
            # Проверяем, разрешён ли автопереход для этого узла (collectUserInput)
            elif user_id in user_data and user_data[user_id].get("collectUserInput_vxPv7G4n0QGyhnv4ucOM5", True) == True:
                logging.info(f"ℹ️ Узел vxPv7G4n0QGyhnv4ucOM5 ожидает ввод (collectUserInput=true), автопереход пропущен")
            else:
                # ⚡ Автопереход к узлу 8xSJaWAJNz7Hz_54mjFTF
                logging.info(f"⚡ Автопереход от узла vxPv7G4n0QGyhnv4ucOM5 к узлу 8xSJaWAJNz7Hz_54mjFTF")
                await handle_callback_8xSJaWAJNz7Hz_54mjFTF(callback_query)
                logging.info(f"✅ Автопереход выполнен: vxPv7G4n0QGyhnv4ucOM5 -> 8xSJaWAJNz7Hz_54mjFTF")
                return
        elif next_node_id == "8xSJaWAJNz7Hz_54mjFTF":
            nav_text = """
{name}, {age}, {city} - {info}
"""
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            # Проверяем наличие прикрепленного медиа
            nav_attached_media = None
            if nav_user_vars and "photo" in nav_user_vars:
                media_data = nav_user_vars["photo"]
                if isinstance(media_data, dict) and "value" in media_data:
                    nav_attached_media = media_data["value"]
                elif isinstance(media_data, str):
                    nav_attached_media = media_data
            if nav_attached_media and str(nav_attached_media).strip():
                logging.info(f"📎 Отправка фото из переменной photo: {nav_attached_media}")
                await bot.send_photo(callback_query.from_user.id, nav_attached_media, caption=nav_text)
            else:
                logging.info("📝 Медиа не найдено, отправка текстового сообщения")
                await callback_query.message.edit_text(nav_text)
            
            # Проверяем, не ждем ли мы ввод перед автопереходом
            if user_id in user_data and ("waiting_for_input" in user_data[user_id] or "waiting_for_conditional_input" in user_data[user_id]):
                logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем ввод для узла 8xSJaWAJNz7Hz_54mjFTF")
            # Проверяем, разрешён ли автопереход для этого узла (collectUserInput)
            elif user_id in user_data and user_data[user_id].get("collectUserInput_8xSJaWAJNz7Hz_54mjFTF", True) == True:
                logging.info(f"ℹ️ Узел 8xSJaWAJNz7Hz_54mjFTF ожидает ввод (collectUserInput=true), автопереход пропущен")
            else:
                # ⚡ Автопереход к узлу KE-8sR9elPEefApjXtBxC
                logging.info(f"⚡ Автопереход от узла 8xSJaWAJNz7Hz_54mjFTF к узлу KE-8sR9elPEefApjXtBxC")
                await handle_callback_KE_8sR9elPEefApjXtBxC(callback_query)
                logging.info(f"✅ Автопереход выполнен: 8xSJaWAJNz7Hz_54mjFTF -> KE-8sR9elPEefApjXtBxC")
                return
        elif next_node_id == "KE-8sR9elPEefApjXtBxC":
            nav_text = "Все верно?"
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            # Удаляем старое сообщение и отправляем новое с reply клавиатурой
            builder = ReplyKeyboardBuilder()
            builder.add(KeyboardButton(text="Да"))
            builder.add(KeyboardButton(text="Изменить анкету"))
            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
            await bot.send_message(callback_query.from_user.id, nav_text, reply_markup=keyboard)
        elif next_node_id == "yrsc8v81qQa5oQx538Dzn":
            nav_text = """1. Смотреть анкеты.
2. Заполнить анкету заново.
3. Изменить фото/видео.
4. Изменить текст анкеты."""
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            # Удаляем старое сообщение и отправляем новое с reply клавиатурой
            builder = ReplyKeyboardBuilder()
            builder.add(KeyboardButton(text="1"))
            builder.add(KeyboardButton(text="2"))
            builder.add(KeyboardButton(text="3"))
            builder.add(KeyboardButton(text="4"))
            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
            await bot.send_message(callback_query.from_user.id, nav_text, reply_markup=keyboard)
        else:
            logging.warning(f"Неизяяестный следующий узел: {next_node_id}")
    except Exception as e:
        logging.error(f"Ошибка при пяяяяреходе к следующему узлу {next_node_id}: {e}")
    
    return  # Завершаем обработку после переадресации
    
    # Удаляем старое сообщение
    
    text = "Теперь определимся с полом"
    await bot.send_message(callback_query.from_user.id, text)
    # Настраиваем ожидание ввода (collectUserInput=true)
    user_data[callback_query.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "variable": "gender",
        "save_to_database": False,
        "node_id": "f90r9k3FSLu2Tjn74cBn_",
        "next_node_id": "RFTgm4KzC6dI39AMTPcmo"
    }
    return

@dp.callback_query(lambda c: c.data == "tS2XGL2Mn4LkE63SnxhPy" or c.data.startswith("tS2XGL2Mn4LkE63SnxhPy_btn_") or c.data == "done_kE63SnxhPy")
async def handle_callback_tS2XGL2Mn4LkE63SnxhPy(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_tS2XGL2Mn4LkE63SnxhPy для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_tS2XGL2Mn4LkE63SnxhPy: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла tS2XGL2Mn4LkE63SnxhPy
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_tS2XGL2Mn4LkE63SnxhPy"] = True
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла tS2XGL2Mn4LkE63SnxhPy: true")
    
    # Проверяем, был ли переход через кнопку с skipDataCollection
    skip_transition_flag = user_data.get(user_id, {}).get("skipDataCollectionTransition", False)
    if not skip_transition_flag:
        await update_user_data_in_db(user_id, "name", callback_query.data)
        logging.info(f"Переменная name сохранена: " + str(callback_query.data) + f" (пользователь {user_id})")
    else:
        # Сбрасываем флаг
        if user_id in user_data and "skipDataCollectionTransition" in user_data[user_id]:
            del user_data[user_id]["skipDataCollectionTransition"]
        logging.info(f"Переход через skipDataCollection, переменная name не сохраняется (пользователь {user_id})")
    
    # Обрабатываем узел tS2XGL2Mn4LkE63SnxhPy: tS2XGL2Mn4LkE63SnxhPy
    text = "Как мне тебя называть?"
    
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
    
    # Проверка условных сообщений дляя навигации
    conditional_parse_mode = None
    conditional_keyboard = None
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    user_data_dict = user_record if user_record else user_data.get(user_id, {})
    # Инициализируем базовые переменные пользователя если их нет
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Проверяем наличие message (для message handlers)
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user
        
        if user_obj:
            init_user_variables(user_id, user_obj)
    
    # Подставляем все доступные переменные пользователя в текст кнопок
    user_vars = await get_user_from_db(user_id)
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    
    # get_user_from_db теперь возвращает уже обработанные user_data
    if not isinstance(user_vars, dict):
        user_vars = {}
    
    # Заменяем все переменные в тексте
    import re
    def replace_variables_in_text(text_content, variables_dict):
        if not text_content or not variables_dict:
            return text_content
        
        for var_name, var_data in variables_dict.items():
            placeholder = "{" + var_name + "}"
            if placeholder in text_content:
                if isinstance(var_data, dict) and "value" in var_data:
                    var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                elif var_data is not None:
                    var_value = str(var_data)
                else:
                    var_value = var_name  # Показываем имя переменной если значения нет
                text_content = text_content.replace(placeholder, var_value)
        return text_content
    
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        # Дополнительная проверка: если переменная не найдена напрямую, проверяем, не является ли она частью user_data в другом формате
        # Это может случиться, если переменная была сохранена в формате, отличном от ожидаемого
        if "user_data" in user_data_dict and isinstance(user_data_dict["user_data"], dict):
            nested_data = user_data_dict["user_data"]
            if var_name in nested_data:
                raw_value = nested_data[var_name]
                if isinstance(raw_value, dict) and "value" in raw_value:
                    var_value = raw_value["value"]
                    # Проверяем, что значение действительно существует и не пустое
                    if var_value is not None and str(var_value).strip() != "":
                        return True, str(var_value)
                else:
                    # Проверяем, что значение действительно существует и не пустое
                    if raw_value is not None and str(raw_value).strip() != "":
                        return True, str(raw_value)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: name
    if (
        check_user_variable("name", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["name"] = check_user_variable("name", user_data_dict)
        # Условное сообщение пустое, используем основной текст узла (text уже инициализирован)
        conditional_parse_mode = None
        if "{name}" in text and variable_values["name"] is not None:
            text = text.replace("{name}", variable_values["name"])
        # Создаем reply клавиатуру для условного сообщения
        builder = ReplyKeyboardBuilder()
        builder.add(KeyboardButton(text=replace_variables_in_text("{name}", user_vars)))
        keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
        conditional_keyboard = keyboard
        # ВАЖНО: Логируем состояние условной клавиатуры для отладки
        logging.info(f"🎹 Условная клавиатура для user_data_exists: conditional_keyboard={'установлена' if conditional_keyboard else 'не установлена'}")
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "cond-name-1",
            "wait_for_input": True,
            "input_variable": "name",
            "next_node_id": "lBPy3gcGVLla0NGdSYb35",
            "source_type": "conditional_message",
            "skip_buttons": []
        }
        # Настраиваем ожидание ввода для условного сообщения с waitForTextInput
        if conditional_message_config and conditional_message_config.get("wait_for_input"):
            if user_id not in user_data:
                user_data[user_id] = {}
            user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config
            logging.info(f"Активировано ожидание условного ввода (переменная существует, но ждём новое значение): {conditional_message_config}")
            # ВАЖНО: Переменная существует, но waitForTextInput=true, поэтому НЕ делаем автопереход
            # Сбрасываем флаг условия чтобы fallback показал сообщение и дождался ввода
            # НО мы уже установили waiting_for_conditional_input, так что НЕ нужно делать break
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
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
    
    # АВТОПЕРЕХОД: Проверяем, есть ли автопереход для этого узла
    # ИСПРАВЛЕНИЕ: НЕ делаем автопереход если была показана условная клавиатура
    user_id = callback_query.from_user.id
    has_conditional_keyboard = user_data.get(user_id, {}).get("_has_conditional_keyboard", False)
    if has_conditional_keyboard:
        logging.info("⏸️ Автопереход ОТЛОЖЕН: показана условная клавиатура - ждём нажатия кнопки")
    elif user_id in user_data and ("waiting_for_input" in user_data[user_id] or "waiting_for_conditional_input" in user_data[user_id]):
        logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем ввод для узла tS2XGL2Mn4LkE63SnxhPy")
    # ИСПРАВЛЕНИЕ: НЕ делаем автопереход если collectUserInput=true (узел ожидает ввод)
    elif user_id in user_data and user_data[user_id].get("collectUserInput_tS2XGL2Mn4LkE63SnxhPy", True) == True:
        logging.info(f"ℹ️ Узел tS2XGL2Mn4LkE63SnxhPy ожидает ввод (collectUserInput=true из user_data), автопереход пропущен")
    elif True:  # Узел ожидает ввод (статическая проверка)
        logging.info(f"ℹ️ Узел tS2XGL2Mn4LkE63SnxhPy ожидает ввод (collectUserInput=true из статической проверки), автопереход пропущен")
    else:
        # ⚡ Автопереход к узлу lBPy3gcGVLla0NGdSYb35
        logging.info(f"⚡ Автопереход от узла tS2XGL2Mn4LkE63SnxhPy к узлу lBPy3gcGVLla0NGdSYb35")
        await handle_callback_lBPy3gcGVLla0NGdSYb35(callback_query)
        logging.info(f"✅ Автопереход выполнен: tS2XGL2Mn4LkE63SnxhPy -> lBPy3gcGVLla0NGdSYb35")
        return
    
    # Устанавливаем waiting_for_input, так как автопереход не выполнен
    user_data[user_id] = user_data.get(user_id, {})
    user_data[user_id]["waiting_for_input"] = {
        "type": "text",
        "modes": ["text"],
        "variable": "name",
        "save_to_database": True,
        "node_id": "tS2XGL2Mn4LkE63SnxhPy",
        "next_node_id": "lBPy3gcGVLla0NGdSYb35",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной name (узел tS2XGL2Mn4LkE63SnxhPy)")
    user_id = callback_query.from_user.id
    
    
    # Удаляем старое сообщение
    
    text = "Как мне тебя называть?"
    await bot.send_message(callback_query.from_user.id, text)
    # Настраиваем ожидание ввода (collectUserInput=true)
    user_data[callback_query.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "variable": "name",
        "save_to_database": False,
        "node_id": "tS2XGL2Mn4LkE63SnxhPy",
        "next_node_id": "lBPy3gcGVLla0NGdSYb35"
    }
    return

@dp.callback_query(lambda c: c.data == "lBPy3gcGVLla0NGdSYb35" or c.data.startswith("lBPy3gcGVLla0NGdSYb35_btn_") or c.data == "done_a0NGdSYb35")
async def handle_callback_lBPy3gcGVLla0NGdSYb35(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_lBPy3gcGVLla0NGdSYb35 для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_lBPy3gcGVLla0NGdSYb35: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла lBPy3gcGVLla0NGdSYb35
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_lBPy3gcGVLla0NGdSYb35"] = True
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла lBPy3gcGVLla0NGdSYb35: true")
    
    # Проверяем, был ли переход через кнопку с skipDataCollection
    skip_transition_flag = user_data.get(user_id, {}).get("skipDataCollectionTransition", False)
    if not skip_transition_flag:
        await update_user_data_in_db(user_id, "info", callback_query.data)
        logging.info(f"Переменная info сохранена: " + str(callback_query.data) + f" (пользователь {user_id})")
    else:
        # Сбрасываем флаг
        if user_id in user_data and "skipDataCollectionTransition" in user_data[user_id]:
            del user_data[user_id]["skipDataCollectionTransition"]
        logging.info(f"Переход через skipDataCollection, переменная info не сохраняется (пользователь {user_id})")
    
    # Обрабатываем узел lBPy3gcGVLla0NGdSYb35: lBPy3gcGVLla0NGdSYb35
    text = "Расскажи о себе и кого хочешь найти, чем предлагаешь заняться. Это поможет лучше подобрать тебе компанию."
    
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
    
    # Проверка условных сообщений дляя навигации
    conditional_parse_mode = None
    conditional_keyboard = None
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    user_data_dict = user_record if user_record else user_data.get(user_id, {})
    # Инициализируем базовые переменные пользователя если их нет
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Проверяем наличие message (для message handlers)
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user
        
        if user_obj:
            init_user_variables(user_id, user_obj)
    
    # Подставляем все доступные переменные пользователя в текст кнопок
    user_vars = await get_user_from_db(user_id)
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    
    # get_user_from_db теперь возвращает уже обработанные user_data
    if not isinstance(user_vars, dict):
        user_vars = {}
    
    # Заменяем все переменные в тексте
    import re
    def replace_variables_in_text(text_content, variables_dict):
        if not text_content or not variables_dict:
            return text_content
        
        for var_name, var_data in variables_dict.items():
            placeholder = "{" + var_name + "}"
            if placeholder in text_content:
                if isinstance(var_data, dict) and "value" in var_data:
                    var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                elif var_data is not None:
                    var_value = str(var_data)
                else:
                    var_value = var_name  # Показываем имя переменной если значения нет
                text_content = text_content.replace(placeholder, var_value)
        return text_content
    
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        # Дополнительная проверка: если переменная не найдена напрямую, проверяем, не является ли она частью user_data в другом формате
        # Это может случиться, если переменная была сохранена в формате, отличном от ожидаемого
        if "user_data" in user_data_dict and isinstance(user_data_dict["user_data"], dict):
            nested_data = user_data_dict["user_data"]
            if var_name in nested_data:
                raw_value = nested_data[var_name]
                if isinstance(raw_value, dict) and "value" in raw_value:
                    var_value = raw_value["value"]
                    # Проверяем, что значение действительно существует и не пустое
                    if var_value is not None and str(var_value).strip() != "":
                        return True, str(var_value)
                else:
                    # Проверяем, что значение действительно существует и не пустое
                    if raw_value is not None and str(raw_value).strip() != "":
                        return True, str(raw_value)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: info
    if (
        check_user_variable("info", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["info"] = check_user_variable("info", user_data_dict)
        # Условное сообщение пустое, используем основной текст узла (text уже инициализирован)
        conditional_parse_mode = None
        if "{info}" in text and variable_values["info"] is not None:
            text = text.replace("{info}", variable_values["info"])
        # Создаем reply клавиатуру для условного сообщения
        builder = ReplyKeyboardBuilder()
        builder.add(KeyboardButton(text="Оставить текущий текст"))
        keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
        conditional_keyboard = keyboard
        # ВАЖНО: Логируем состояние условной клавиатуры для отладки
        logging.info(f"🎹 Условная клавиатура для user_data_exists: conditional_keyboard={'установлена' if conditional_keyboard else 'не установлена'}")
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "cond-info-1",
            "wait_for_input": True,
            "input_variable": "info",
            "next_node_id": "vxPv7G4n0QGyhnv4ucOM5",
            "source_type": "conditional_message",
            "skip_buttons": [{"text":"Оставить текущий текст","target":"Y9zLRp1BLpVhm-HcsNkJV"}]
        }
        # Настраиваем ожидание ввода для условного сообщения с waitForTextInput
        if conditional_message_config and conditional_message_config.get("wait_for_input"):
            if user_id not in user_data:
                user_data[user_id] = {}
            user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config
            logging.info(f"Активировано ожидание условного ввода (переменная существует, но ждём новое значение): {conditional_message_config}")
            # ВАЖНО: Переменная существует, но waitForTextInput=true, поэтому НЕ делаем автопереход
            # Сбрасываем флаг условия чтобы fallback показал сообщение и дождался ввода
            # НО мы уже установили waiting_for_conditional_input, так что НЕ нужно делать break
        # Сохраняем skip_buttons для проверки в текстовом обработчике (для медиа-узлов)
        if user_id not in user_data:
            user_data[user_id] = {}
        user_data[user_id]["pending_skip_buttons"] = [{"text":"Оставить текущий текст","target":"Y9zLRp1BLpVhm-HcsNkJV"}]
        logging.info(f"📌 Сохранены pending_skip_buttons для медиа-узла: {user_data[user_id]['pending_skip_buttons']}")
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
    # Create reply keyboard
    if "conditional_keyboard" not in locals():
        conditional_keyboard = None
    # Проверяем, есть ли условная клавиатура
    if "conditional_keyboard" in locals() and conditional_keyboard is not None:
        keyboard = conditional_keyboard
        logging.info("✅ Используем уяловную reply клавиатуру")
    else:
        # Условная клавиатура не создана, используем обычную
        builder = ReplyKeyboardBuilder()
        builder.add(KeyboardButton(text="Пропустить"))
        keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
        logging.info("✅ Используем обычную reply клавиатуру")
    # Для reply клавиатуры нужно отправить новое сообщение
    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)
    
    # Настройка waiting_for_input для узла с reply клавиатурой (collectUserInput=true)
    user_id = callback_query.from_user.id
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["waiting_for_input"] = {
        "type": "button",
        "modes": ['button', 'text'],
        "variable": "info",
        "save_to_database": True,
        "node_id": "lBPy3gcGVLla0NGdSYb35",
        "next_node_id": "",
        "skip_buttons": [{"text":"Пропустить","target":"Y9zLRp1BLpVhm-HcsNkJV"}]
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['button', 'text'] для переменной info (узел lBPy3gcGVLla0NGdSYb35)")
    return  # Возвращаемся чтобы не отправить сообщение дважды
    
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
        "type": "button",
        "modes": ["button", "text"],
        "variable": "info",
        "save_to_database": True,
        "node_id": "lBPy3gcGVLla0NGdSYb35",
        "next_node_id": "Y9zLRp1BLpVhm-HcsNkJV",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['button', 'text'] для переменной info (узел lBPy3gcGVLla0NGdSYb35)")
    user_id = callback_query.from_user.id
    
    # Сохраняем нажатие кнопки в базу данных
    # Ищем текят кнопки по callback_data
    button_display_text = "4"
    
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
        await update_user_data_in_db(user_id, "button_click", button_display_text)
        logging.info(f"Переменная button_click сохранена: " + str(button_display_text) + f" (пользователь {user_id})")
    else:
        logging.info("⏸️ Пропускаем сохранение переменной: показана условная клавиатура, ждём выбор пользователя")
    
    # ПЕРЕАДРЕСАЦИЯ: Переходим к следующему узлу после сояранения данных
    next_node_id = "Y9zLRp1BLpVhm-HcsNkJV"
    try:
        logging.info(f"🚀 Переходим к следующему узлу после выбора кнопки: {next_node_id}")
        if next_node_id == "start":
            logging.info("Переход к узлу start")
        elif next_node_id == "f90r9k3FSLu2Tjn74cBn_":
            nav_text = "Теперь определимся с полом"
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            # Удаляем старое сообщение и отправляем новое с reply клавиатурой
            builder = ReplyKeyboardBuilder()
            builder.add(KeyboardButton(text="Я девушка"))
            builder.add(KeyboardButton(text="Я парень"))
            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
            await bot.send_message(callback_query.from_user.id, nav_text, reply_markup=keyboard)
            # ИСПРАВЛЕНИЕ: Проверяем, не была ли переменная уже сохранена inline кнопкой
            user_id = callback_query.from_user.id
            if user_id not in user_data:
                user_data[user_id] = {}
            # Проверяем, не была ли переменная gender уже сохранена
            if "gender" not in user_data[user_id] or not user_data[user_id]["gender"]:
                # Переменная не сохранена - используем универсальную функцию для настройки ожидания ввода
                # Тип ввода: text
                            user_data[callback_query.from_user.id] = user_data.get(callback_query.from_user.id, {})
                            user_data[callback_query.from_user.id]["waiting_for_input"] = {
                                "type": "button",
                                "modes": ["button", "text"],
                                "variable": "gender",
                                "save_to_database": True,
                                "node_id": "f90r9k3FSLu2Tjn74cBn_",
                                "next_node_id": "",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['button', 'text'] для переменной gender (узел f90r9k3FSLu2Tjn74cBn_)")
            else:
                logging.info(f"⏭️ Переменная gender уже сохранена, пропускаем ожидание ввода")
        elif next_node_id == "RFTgm4KzC6dI39AMTPcmo":
            nav_text = "Кто тебе интересен?"
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            # Удаляем старое сообщение и отправляем новое с reply клавиатурой
            builder = ReplyKeyboardBuilder()
            builder.add(KeyboardButton(text="Девушки"))
            builder.add(KeyboardButton(text="Парни"))
            builder.add(KeyboardButton(text="Все равно"))
            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
            await bot.send_message(callback_query.from_user.id, nav_text, reply_markup=keyboard)
            # ИСПРАВЛЕНИЕ: Проверяем, не была ли переменная уже сохранена inline кнопкой
            user_id = callback_query.from_user.id
            if user_id not in user_data:
                user_data[user_id] = {}
            # Проверяем, не была ли переменная sex уже сохранена
            if "sex" not in user_data[user_id] or not user_data[user_id]["sex"]:
                # Переменная не сохранена - используем универсальную функцию для настройки ожидания ввода
                # Тип ввода: text
                            user_data[callback_query.from_user.id] = user_data.get(callback_query.from_user.id, {})
                            user_data[callback_query.from_user.id]["waiting_for_input"] = {
                                "type": "button",
                                "modes": ["button", "text"],
                                "variable": "sex",
                                "save_to_database": True,
                                "node_id": "RFTgm4KzC6dI39AMTPcmo",
                                "next_node_id": "",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['button', 'text'] для переменной sex (узел RFTgm4KzC6dI39AMTPcmo)")
            else:
                logging.info(f"⏭️ Переменная sex уже сохранена, пропускаем ожидание ввода")
        elif next_node_id == "sIh3xXKEtb_TtrhHqZQzX":
            # Узел с условными сообщениями - вызываем полноценный обработчик
            logging.info(f"🔧 Callback навигация к узлу с условными сообщениями: sIh3xXKEtb_TtrhHqZQzX")
            await handle_node_sIh3xXKEtb_TtrhHqZQzX(callback_query.message)
        elif next_node_id == "tS2XGL2Mn4LkE63SnxhPy":
            # Узел с условными сообщениями - вызываем полноценный обработчик
            logging.info(f"🔧 Callback навигация к узлу с условными сообщениями: tS2XGL2Mn4LkE63SnxhPy")
            await handle_node_tS2XGL2Mn4LkE63SnxhPy(callback_query.message)
        elif next_node_id == "lBPy3gcGVLla0NGdSYb35":
            # Узел с условными сообщениями - вызываем полноценный обработчик
            logging.info(f"🔧 Callback навигация к узлу с условными сообщениями: lBPy3gcGVLla0NGdSYb35")
            await handle_node_lBPy3gcGVLla0NGdSYb35(callback_query.message)
        elif next_node_id == "Y9zLRp1BLpVhm-HcsNkJV":
            # Узел с условными сообщениями - вызываем полноценный обработчик
            logging.info(f"🔧 Callback навигация к узлу с условными сообщениями: Y9zLRp1BLpVhm-HcsNkJV")
            await handle_node_Y9zLRp1BLpVhm_HcsNkJV(callback_query.message)
        elif next_node_id == "vxPv7G4n0QGyhnv4ucOM5":
            nav_text = "Так выглядит твоя анкета:"
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            await callback_query.message.edit_text(nav_text)
            
            # Проверяем, не ждем ли мы ввод перед автопереходом
            if user_id in user_data and ("waiting_for_input" in user_data[user_id] or "waiting_for_conditional_input" in user_data[user_id]):
                logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем ввод для узла vxPv7G4n0QGyhnv4ucOM5")
            # Проверяем, разрешён ли автопереход для этого узла (collectUserInput)
            elif user_id in user_data and user_data[user_id].get("collectUserInput_vxPv7G4n0QGyhnv4ucOM5", True) == True:
                logging.info(f"ℹ️ Узел vxPv7G4n0QGyhnv4ucOM5 ожидает ввод (collectUserInput=true), автопереход пропущен")
            else:
                # ⚡ Автопереход к узлу 8xSJaWAJNz7Hz_54mjFTF
                logging.info(f"⚡ Автопереход от узла vxPv7G4n0QGyhnv4ucOM5 к узлу 8xSJaWAJNz7Hz_54mjFTF")
                await handle_callback_8xSJaWAJNz7Hz_54mjFTF(callback_query)
                logging.info(f"✅ Автопереход выполнен: vxPv7G4n0QGyhnv4ucOM5 -> 8xSJaWAJNz7Hz_54mjFTF")
                return
        elif next_node_id == "8xSJaWAJNz7Hz_54mjFTF":
            nav_text = """
{name}, {age}, {city} - {info}
"""
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            # Проверяем наличие прикрепленного медиа
            nav_attached_media = None
            if nav_user_vars and "photo" in nav_user_vars:
                media_data = nav_user_vars["photo"]
                if isinstance(media_data, dict) and "value" in media_data:
                    nav_attached_media = media_data["value"]
                elif isinstance(media_data, str):
                    nav_attached_media = media_data
            if nav_attached_media and str(nav_attached_media).strip():
                logging.info(f"📎 Отправка фото из переменной photo: {nav_attached_media}")
                await bot.send_photo(callback_query.from_user.id, nav_attached_media, caption=nav_text)
            else:
                logging.info("📝 Медиа не найдено, отправка текстового сообщения")
                await callback_query.message.edit_text(nav_text)
            
            # Проверяем, не ждем ли мы ввод перед автопереходом
            if user_id in user_data and ("waiting_for_input" in user_data[user_id] or "waiting_for_conditional_input" in user_data[user_id]):
                logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем ввод для узла 8xSJaWAJNz7Hz_54mjFTF")
            # Проверяем, разрешён ли автопереход для этого узла (collectUserInput)
            elif user_id in user_data and user_data[user_id].get("collectUserInput_8xSJaWAJNz7Hz_54mjFTF", True) == True:
                logging.info(f"ℹ️ Узел 8xSJaWAJNz7Hz_54mjFTF ожидает ввод (collectUserInput=true), автопереход пропущен")
            else:
                # ⚡ Автопереход к узлу KE-8sR9elPEefApjXtBxC
                logging.info(f"⚡ Автопереход от узла 8xSJaWAJNz7Hz_54mjFTF к узлу KE-8sR9elPEefApjXtBxC")
                await handle_callback_KE_8sR9elPEefApjXtBxC(callback_query)
                logging.info(f"✅ Автопереход выполнен: 8xSJaWAJNz7Hz_54mjFTF -> KE-8sR9elPEefApjXtBxC")
                return
        elif next_node_id == "KE-8sR9elPEefApjXtBxC":
            nav_text = "Все верно?"
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            # Удаляем старое сообщение и отправляем новое с reply клавиатурой
            builder = ReplyKeyboardBuilder()
            builder.add(KeyboardButton(text="Да"))
            builder.add(KeyboardButton(text="Изменить анкету"))
            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
            await bot.send_message(callback_query.from_user.id, nav_text, reply_markup=keyboard)
        elif next_node_id == "yrsc8v81qQa5oQx538Dzn":
            nav_text = """1. Смотреть анкеты.
2. Заполнить анкету заново.
3. Изменить фото/видео.
4. Изменить текст анкеты."""
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            # Удаляем старое сообщение и отправляем новое с reply клавиатурой
            builder = ReplyKeyboardBuilder()
            builder.add(KeyboardButton(text="1"))
            builder.add(KeyboardButton(text="2"))
            builder.add(KeyboardButton(text="3"))
            builder.add(KeyboardButton(text="4"))
            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
            await bot.send_message(callback_query.from_user.id, nav_text, reply_markup=keyboard)
        else:
            logging.warning(f"Неизяяестный следующий узел: {next_node_id}")
    except Exception as e:
        logging.error(f"Ошибка при пяяяяреходе к следующему узлу {next_node_id}: {e}")
    
    return  # Завершаем обработку после переадресации
    
    # Удаляем старое сообщение
    
    text = "Расскажи о себе и кого хочешь найти, чем предлагаешь заняться. Это поможет лучше подобрать тебе компанию."
    await bot.send_message(callback_query.from_user.id, text)
    # Настраиваем ожидание ввода (collectUserInput=true)
    user_data[callback_query.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "variable": "info",
        "save_to_database": False,
        "node_id": "lBPy3gcGVLla0NGdSYb35",
        "next_node_id": "Y9zLRp1BLpVhm-HcsNkJV"
    }
    return

@dp.callback_query(lambda c: c.data == "Y9zLRp1BLpVhm-HcsNkJV" or c.data.startswith("Y9zLRp1BLpVhm-HcsNkJV_btn_") or c.data == "done_hm-HcsNkJV")
async def handle_callback_Y9zLRp1BLpVhm_HcsNkJV(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_Y9zLRp1BLpVhm_HcsNkJV для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_Y9zLRp1BLpVhm_HcsNkJV: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла Y9zLRp1BLpVhm-HcsNkJV
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_Y9zLRp1BLpVhm-HcsNkJV"] = True
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла Y9zLRp1BLpVhm-HcsNkJV: true")
    
    # Обрабатываем узел Y9zLRp1BLpVhm-HcsNkJV: Y9zLRp1BLpVhm-HcsNkJV
    text = "Теперь пришли фото или запиши видео 👍 (до 15 сек), его будут видеть другие пользователи"
    
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
    
    # Проверка условных сообщений дляя навигации
    conditional_parse_mode = None
    conditional_keyboard = None
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    user_data_dict = user_record if user_record else user_data.get(user_id, {})
    # Инициализируем базовые переменные пользователя если их нет
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Проверяем наличие message (для message handlers)
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user
        
        if user_obj:
            init_user_variables(user_id, user_obj)
    
    # Подставляем все доступные переменные пользователя в текст кнопок
    user_vars = await get_user_from_db(user_id)
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    
    # get_user_from_db теперь возвращает уже обработанные user_data
    if not isinstance(user_vars, dict):
        user_vars = {}
    
    # Заменяем все переменные в тексте
    import re
    def replace_variables_in_text(text_content, variables_dict):
        if not text_content or not variables_dict:
            return text_content
        
        for var_name, var_data in variables_dict.items():
            placeholder = "{" + var_name + "}"
            if placeholder in text_content:
                if isinstance(var_data, dict) and "value" in var_data:
                    var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                elif var_data is not None:
                    var_value = str(var_data)
                else:
                    var_value = var_name  # Показываем имя переменной если значения нет
                text_content = text_content.replace(placeholder, var_value)
        return text_content
    
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        # Дополнительная проверка: если переменная не найдена напрямую, проверяем, не является ли она частью user_data в другом формате
        # Это может случиться, если переменная была сохранена в формате, отличном от ожидаемого
        if "user_data" in user_data_dict and isinstance(user_data_dict["user_data"], dict):
            nested_data = user_data_dict["user_data"]
            if var_name in nested_data:
                raw_value = nested_data[var_name]
                if isinstance(raw_value, dict) and "value" in raw_value:
                    var_value = raw_value["value"]
                    # Проверяем, что значение действительно существует и не пустое
                    if var_value is not None and str(var_value).strip() != "":
                        return True, str(var_value)
                else:
                    # Проверяем, что значение действительно существует и не пустое
                    if raw_value is not None and str(raw_value).strip() != "":
                        return True, str(raw_value)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: photo
    if (
        check_user_variable("photo", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["photo"] = check_user_variable("photo", user_data_dict)
        # Условное сообщение пустое, используем основной текст узла (text уже инициализирован)
        conditional_parse_mode = None
        if "{photo}" in text and variable_values["photo"] is not None:
            text = text.replace("{photo}", variable_values["photo"])
        # Создаем reply клавиатуру для условного сообщения
        builder = ReplyKeyboardBuilder()
        builder.add(KeyboardButton(text="Оставить текущее"))
        keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
        conditional_keyboard = keyboard
        # ВАЖНО: Логируем состояние условной клавиатуры для отладки
        logging.info(f"🎹 Условная клавиатура для user_data_exists: conditional_keyboard={'установлена' if conditional_keyboard else 'не установлена'}")
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "cond-photo-1",
            "wait_for_input": False,
            "input_variable": "photo",
            "next_node_id": "",
            "source_type": "conditional_message",
            "skip_buttons": [{"text":"Оставить текущее","target":"vxPv7G4n0QGyhnv4ucOM5"}]
        }
        # Настраиваем ожидание ввода для условного сообщения с waitForTextInput
        # Сохраняем skip_buttons для проверки в текстовом обработчике (для медиа-узлов)
        if user_id not in user_data:
            user_data[user_id] = {}
        user_data[user_id]["pending_skip_buttons"] = [{"text":"Оставить текущее","target":"vxPv7G4n0QGyhnv4ucOM5"}]
        logging.info(f"📌 Сохранены pending_skip_buttons для медиа-узла: {user_data[user_id]['pending_skip_buttons']}")
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
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
    
    # АВТОПЕРЕХОД: Проверяем, есть ли автопереход для этого узла
    # ИСПРАВЛЕНИЕ: НЕ делаем автопереход если была показана условная клавиатура
    user_id = callback_query.from_user.id
    has_conditional_keyboard = user_data.get(user_id, {}).get("_has_conditional_keyboard", False)
    if has_conditional_keyboard:
        logging.info("⏸️ Автопереход ОТЛОЖЕН: показана условная клавиатура - ждём нажатия кнопки")
    elif user_id in user_data and ("waiting_for_input" in user_data[user_id] or "waiting_for_conditional_input" in user_data[user_id]):
        logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем ввод для узла Y9zLRp1BLpVhm-HcsNkJV")
    # ИСПРАВЛЕНИЕ: НЕ делаем автопереход если collectUserInput=true (узел ожидает ввод)
    elif user_id in user_data and user_data[user_id].get("collectUserInput_Y9zLRp1BLpVhm-HcsNkJV", True) == True:
        logging.info(f"ℹ️ Узел Y9zLRp1BLpVhm-HcsNkJV ожидает ввод (collectUserInput=true из user_data), автопереход пропущен")
    elif True:  # Узел ожидает ввод (статическая проверка)
        logging.info(f"ℹ️ Узел Y9zLRp1BLpVhm-HcsNkJV ожидает ввод (collectUserInput=true из статической проверки), автопереход пропущен")
    else:
        # ⚡ Автопереход к узлу vxPv7G4n0QGyhnv4ucOM5
        logging.info(f"⚡ Автопереход от узла Y9zLRp1BLpVhm-HcsNkJV к узлу vxPv7G4n0QGyhnv4ucOM5")
        await handle_callback_vxPv7G4n0QGyhnv4ucOM5(callback_query)
        logging.info(f"✅ Автопереход выполнен: Y9zLRp1BLpVhm-HcsNkJV -> vxPv7G4n0QGyhnv4ucOM5")
        return
    
    # Устанавливаем waiting_for_input, так как автопереход не выполнен
    user_data[user_id] = user_data.get(user_id, {})
    user_data[user_id]["waiting_for_input"] = {
        "type": "photo",
        "modes": ["photo"],
        "variable": "photo",
        "save_to_database": True,
        "node_id": "Y9zLRp1BLpVhm-HcsNkJV",
        "next_node_id": "vxPv7G4n0QGyhnv4ucOM5",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['photo'] для переменной photo (узел Y9zLRp1BLpVhm-HcsNkJV)")
    user_id = callback_query.from_user.id
    
    # Сохраняем нажатие кнопки в базу данных
    # Ищем текят кнопки по callback_data
    button_display_text = "Пропустить"
    
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
        await update_user_data_in_db(user_id, "info", button_display_text)
        logging.info(f"Переменная info сохранена: " + str(button_display_text) + f" (пользователь {user_id})")
    else:
        logging.info("⏸️ Пропускаем сохранение переменной: показана условная клавиатура, ждём выбор пользователя")
    
    
    return

@dp.callback_query(lambda c: c.data == "vxPv7G4n0QGyhnv4ucOM5" or c.data.startswith("vxPv7G4n0QGyhnv4ucOM5_btn_") or c.data == "done_yhnv4ucOM5")
async def handle_callback_vxPv7G4n0QGyhnv4ucOM5(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_vxPv7G4n0QGyhnv4ucOM5 для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_vxPv7G4n0QGyhnv4ucOM5: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла vxPv7G4n0QGyhnv4ucOM5
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_vxPv7G4n0QGyhnv4ucOM5"] = False
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла vxPv7G4n0QGyhnv4ucOM5: false")
    
    # Обрабатываем узел vxPv7G4n0QGyhnv4ucOM5: vxPv7G4n0QGyhnv4ucOM5
    text = "Так выглядит твоя анкета:"
    
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
    
    # АВТОПЕРЕХОД: Проверяем, есть ли автопереход для этого узла
    # ИСПРАВЛЕНИЕ: НЕ делаем автопереход если была показана условная клавиатура
    user_id = callback_query.from_user.id
    has_conditional_keyboard = user_data.get(user_id, {}).get("_has_conditional_keyboard", False)
    if has_conditional_keyboard:
        logging.info("⏸️ Автопереход ОТЛОЖЕН: показана условная клавиатура - ждём нажатия кнопки")
    elif user_id in user_data and ("waiting_for_input" in user_data[user_id] or "waiting_for_conditional_input" in user_data[user_id]):
        logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем ввод для узла vxPv7G4n0QGyhnv4ucOM5")
    # ИСПРАВЛЕНИЕ: НЕ делаем автопереход если collectUserInput=true (узел ожидает ввод)
    elif user_id in user_data and user_data[user_id].get("collectUserInput_vxPv7G4n0QGyhnv4ucOM5", True) == True:
        logging.info(f"ℹ️ Узел vxPv7G4n0QGyhnv4ucOM5 ожидает ввод (collectUserInput=true из user_data), автопереход пропущен")
    else:
        # ⚡ Автопереход к узлу 8xSJaWAJNz7Hz_54mjFTF
        logging.info(f"⚡ Автопереход от узла vxPv7G4n0QGyhnv4ucOM5 к узлу 8xSJaWAJNz7Hz_54mjFTF")
        await handle_callback_8xSJaWAJNz7Hz_54mjFTF(callback_query)
        logging.info(f"✅ Автопереход выполнен: vxPv7G4n0QGyhnv4ucOM5 -> 8xSJaWAJNz7Hz_54mjFTF")
        return
    
    # Устанавливаем waiting_for_input, так как автопереход не выполнен
    user_data[user_id] = user_data.get(user_id, {})
    user_data[user_id]["waiting_for_input"] = {
        "type": "text",
        "modes": ["text"],
        "variable": "response_vxPv7G4n0QGyhnv4ucOM5",
        "save_to_database": True,
        "node_id": "vxPv7G4n0QGyhnv4ucOM5",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной response_vxPv7G4n0QGyhnv4ucOM5 (узел vxPv7G4n0QGyhnv4ucOM5)")
    user_id = callback_query.from_user.id
    
    
    return

@dp.callback_query(lambda c: c.data == "8xSJaWAJNz7Hz_54mjFTF" or c.data.startswith("8xSJaWAJNz7Hz_54mjFTF_btn_") or c.data == "done_Hz_54mjFTF")
async def handle_callback_8xSJaWAJNz7Hz_54mjFTF(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_8xSJaWAJNz7Hz_54mjFTF для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_8xSJaWAJNz7Hz_54mjFTF: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла 8xSJaWAJNz7Hz_54mjFTF
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_8xSJaWAJNz7Hz_54mjFTF"] = False
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла 8xSJaWAJNz7Hz_54mjFTF: false")
    
    # Обрабатываем узел 8xSJaWAJNz7Hz_54mjFTF: 8xSJaWAJNz7Hz_54mjFTF
    text = """
{name}, {age}, {city} - {info}
"""
    
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
    # Проверяем наличие прикрепленного медиа из переменной photo
    attached_media = None
    if user_vars and "photo" in user_vars:
        media_data = user_vars["photo"]
        if isinstance(media_data, dict) and "value" in media_data:
            attached_media = media_data["value"]
        elif isinstance(media_data, str):
            attached_media = media_data
    
    # Если медиа найдено, отправляем с медиа, иначе обычное сообщение
    if attached_media and str(attached_media).strip():
        logging.info(f"📎 Отправка photo медиа из переменной photo: {attached_media}")
        try:
            # Заменяем переменные в тексте перед отправкой медиа
            processed_caption = replace_variables_in_text(text, user_vars)
            await bot.send_photo(callback_query.from_user.id, attached_media, caption=processed_caption, reply_markup=keyboard)
        except Exception as e:
            logging.error(f"Ошибка отправки photo: {e}")
            # Fallback на обычное сообщение при ошибке
            await safe_edit_or_send(callback_query, text, node_id="8xSJaWAJNz7Hz_54mjFTF", reply_markup=keyboard if keyboard is not None else None)
    else:
        # Медиа не найдено, отправляем обычное текстовое сообщение
        logging.info(f"📝 Медиа photo не найдено, отправка текстового сообщения")
        # Заменяем переменные в тексте перед отправкой
        processed_text = replace_variables_in_text(text, user_vars)
        if True:
            # Узел ожидает ввод, не отправляем сообщение
            logging.info(f"ℹ️ Узел 8xSJaWAJNz7Hz_54mjFTF ожидает ввод, пропускаем отправку сообщения")
        else:
            await safe_edit_or_send(callback_query, processed_text, node_id="8xSJaWAJNz7Hz_54mjFTF", reply_markup=keyboard if keyboard is not None else None)
    # АВТОПЕРЕХОД: Проверяем, есть ли автопереход для этого узла
    # ИСПРАВЛЕНИЕ: НЕ делаем автопереход если была показана условная клавиатура
    user_id = callback_query.from_user.id
    has_conditional_keyboard = user_data.get(user_id, {}).get("_has_conditional_keyboard", False)
    if has_conditional_keyboard:
        logging.info("⏸️ Автопереход ОТЛОЖЕН: показана условная клавиатура - ждём нажатия кнопки")
    elif user_id in user_data and ("waiting_for_input" in user_data[user_id] or "waiting_for_conditional_input" in user_data[user_id]):
        logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем ввод для узла 8xSJaWAJNz7Hz_54mjFTF")
    # ИСПРАВЛЕНИЕ: НЕ делаем автопереход если collectUserInput=true (узел ожидает ввод)
    elif user_id in user_data and user_data[user_id].get("collectUserInput_8xSJaWAJNz7Hz_54mjFTF", True) == True:
        logging.info(f"ℹ️ Узел 8xSJaWAJNz7Hz_54mjFTF ожидает ввод (collectUserInput=true из user_data), автопереход пропущен")
    else:
        # ⚡ Автопереход к узлу KE-8sR9elPEefApjXtBxC
        logging.info(f"⚡ Автопереход от узла 8xSJaWAJNz7Hz_54mjFTF к узлу KE-8sR9elPEefApjXtBxC")
        await handle_callback_KE_8sR9elPEefApjXtBxC(callback_query)
        logging.info(f"✅ Автопереход выполнен: 8xSJaWAJNz7Hz_54mjFTF -> KE-8sR9elPEefApjXtBxC")
        return
    
    # Устанавливаем waiting_for_input, так как автопереход не выполнен
    user_data[user_id] = user_data.get(user_id, {})
    user_data[user_id]["waiting_for_input"] = {
        "type": "text",
        "modes": ["text"],
        "variable": "response_8xSJaWAJNz7Hz_54mjFTF",
        "save_to_database": True,
        "node_id": "8xSJaWAJNz7Hz_54mjFTF",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной response_8xSJaWAJNz7Hz_54mjFTF (узел 8xSJaWAJNz7Hz_54mjFTF)")
    user_id = callback_query.from_user.id
    
    
    return

@dp.callback_query(lambda c: c.data == "KE-8sR9elPEefApjXtBxC" or c.data.startswith("KE-8sR9elPEefApjXtBxC_btn_") or c.data == "done_efApjXtBxC")
async def handle_callback_KE_8sR9elPEefApjXtBxC(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_KE_8sR9elPEefApjXtBxC для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_KE_8sR9elPEefApjXtBxC: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла KE-8sR9elPEefApjXtBxC
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_KE-8sR9elPEefApjXtBxC"] = False
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла KE-8sR9elPEefApjXtBxC: false")
    
    # Обрабатываем узел KE-8sR9elPEefApjXtBxC: KE-8sR9elPEefApjXtBxC
    text = "Все верно?"
    
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
    # Create reply keyboard
    # Удаляем старое сообщение и отправляем новое с reply клавиатурой
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="Да"))
    builder.add(KeyboardButton(text="Изменить анкету"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    # Для reply клавиатуры нужно отправить новое сообщение
    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)
    
    # Узел KE-8sR9elPEefApjXtBxC имеет collectUserInput=false - НЕ устанавливаем waiting_for_input
    logging.info(f"ℹ️ Узел KE-8sR9elPEefApjXtBxC не собирает ответы (collectUserInput=false)")
    return  # Возвращаемся чтобы не отправить сообщение дважды
    
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
        "type": "button",
        "modes": ["button"],
        "variable": "response_KE-8sR9elPEefApjXtBxC",
        "save_to_database": True,
        "node_id": "KE-8sR9elPEefApjXtBxC",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['button'] для переменной response_KE-8sR9elPEefApjXtBxC (узел KE-8sR9elPEefApjXtBxC)")
    user_id = callback_query.from_user.id
    
    # ПЕРЕАДРЕСАЦИЯ: Переходим к следующему узлу после сояранения данных
    next_node_id = "yrsc8v81qQa5oQx538Dzn"
    try:
        logging.info(f"🚀 Переходим к следующему узлу после выбора кнопки: {next_node_id}")
        if next_node_id == "start":
            logging.info("Переход к узлу start")
        elif next_node_id == "f90r9k3FSLu2Tjn74cBn_":
            nav_text = "Теперь определимся с полом"
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            # Удаляем старое сообщение и отправляем новое с reply клавиатурой
            builder = ReplyKeyboardBuilder()
            builder.add(KeyboardButton(text="Я девушка"))
            builder.add(KeyboardButton(text="Я парень"))
            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
            await bot.send_message(callback_query.from_user.id, nav_text, reply_markup=keyboard)
            # ИСПРАВЛЕНИЕ: Проверяем, не была ли переменная уже сохранена inline кнопкой
            user_id = callback_query.from_user.id
            if user_id not in user_data:
                user_data[user_id] = {}
            # Проверяем, не была ли переменная gender уже сохранена
            if "gender" not in user_data[user_id] or not user_data[user_id]["gender"]:
                # Переменная не сохранена - используем универсальную функцию для настройки ожидания ввода
                # Тип ввода: text
                            user_data[callback_query.from_user.id] = user_data.get(callback_query.from_user.id, {})
                            user_data[callback_query.from_user.id]["waiting_for_input"] = {
                                "type": "button",
                                "modes": ["button", "text"],
                                "variable": "gender",
                                "save_to_database": True,
                                "node_id": "f90r9k3FSLu2Tjn74cBn_",
                                "next_node_id": "",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['button', 'text'] для переменной gender (узел f90r9k3FSLu2Tjn74cBn_)")
            else:
                logging.info(f"⏭️ Переменная gender уже сохранена, пропускаем ожидание ввода")
        elif next_node_id == "RFTgm4KzC6dI39AMTPcmo":
            nav_text = "Кто тебе интересен?"
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            # Удаляем старое сообщение и отправляем новое с reply клавиатурой
            builder = ReplyKeyboardBuilder()
            builder.add(KeyboardButton(text="Девушки"))
            builder.add(KeyboardButton(text="Парни"))
            builder.add(KeyboardButton(text="Все равно"))
            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
            await bot.send_message(callback_query.from_user.id, nav_text, reply_markup=keyboard)
            # ИСПРАВЛЕНИЕ: Проверяем, не была ли переменная уже сохранена inline кнопкой
            user_id = callback_query.from_user.id
            if user_id not in user_data:
                user_data[user_id] = {}
            # Проверяем, не была ли переменная sex уже сохранена
            if "sex" not in user_data[user_id] or not user_data[user_id]["sex"]:
                # Переменная не сохранена - используем универсальную функцию для настройки ожидания ввода
                # Тип ввода: text
                            user_data[callback_query.from_user.id] = user_data.get(callback_query.from_user.id, {})
                            user_data[callback_query.from_user.id]["waiting_for_input"] = {
                                "type": "button",
                                "modes": ["button", "text"],
                                "variable": "sex",
                                "save_to_database": True,
                                "node_id": "RFTgm4KzC6dI39AMTPcmo",
                                "next_node_id": "",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['button', 'text'] для переменной sex (узел RFTgm4KzC6dI39AMTPcmo)")
            else:
                logging.info(f"⏭️ Переменная sex уже сохранена, пропускаем ожидание ввода")
        elif next_node_id == "sIh3xXKEtb_TtrhHqZQzX":
            # Узел с условными сообщениями - вызываем полноценный обработчик
            logging.info(f"🔧 Callback навигация к узлу с условными сообщениями: sIh3xXKEtb_TtrhHqZQzX")
            await handle_node_sIh3xXKEtb_TtrhHqZQzX(callback_query.message)
        elif next_node_id == "tS2XGL2Mn4LkE63SnxhPy":
            # Узел с условными сообщениями - вызываем полноценный обработчик
            logging.info(f"🔧 Callback навигация к узлу с условными сообщениями: tS2XGL2Mn4LkE63SnxhPy")
            await handle_node_tS2XGL2Mn4LkE63SnxhPy(callback_query.message)
        elif next_node_id == "lBPy3gcGVLla0NGdSYb35":
            # Узел с условными сообщениями - вызываем полноценный обработчик
            logging.info(f"🔧 Callback навигация к узлу с условными сообщениями: lBPy3gcGVLla0NGdSYb35")
            await handle_node_lBPy3gcGVLla0NGdSYb35(callback_query.message)
        elif next_node_id == "Y9zLRp1BLpVhm-HcsNkJV":
            # Узел с условными сообщениями - вызываем полноценный обработчик
            logging.info(f"🔧 Callback навигация к узлу с условными сообщениями: Y9zLRp1BLpVhm-HcsNkJV")
            await handle_node_Y9zLRp1BLpVhm_HcsNkJV(callback_query.message)
        elif next_node_id == "vxPv7G4n0QGyhnv4ucOM5":
            nav_text = "Так выглядит твоя анкета:"
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            await callback_query.message.edit_text(nav_text)
            
            # Проверяем, не ждем ли мы ввод перед автопереходом
            if user_id in user_data and ("waiting_for_input" in user_data[user_id] or "waiting_for_conditional_input" in user_data[user_id]):
                logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем ввод для узла vxPv7G4n0QGyhnv4ucOM5")
            # Проверяем, разрешён ли автопереход для этого узла (collectUserInput)
            elif user_id in user_data and user_data[user_id].get("collectUserInput_vxPv7G4n0QGyhnv4ucOM5", True) == True:
                logging.info(f"ℹ️ Узел vxPv7G4n0QGyhnv4ucOM5 ожидает ввод (collectUserInput=true), автопереход пропущен")
            else:
                # ⚡ Автопереход к узлу 8xSJaWAJNz7Hz_54mjFTF
                logging.info(f"⚡ Автопереход от узла vxPv7G4n0QGyhnv4ucOM5 к узлу 8xSJaWAJNz7Hz_54mjFTF")
                await handle_callback_8xSJaWAJNz7Hz_54mjFTF(callback_query)
                logging.info(f"✅ Автопереход выполнен: vxPv7G4n0QGyhnv4ucOM5 -> 8xSJaWAJNz7Hz_54mjFTF")
                return
        elif next_node_id == "8xSJaWAJNz7Hz_54mjFTF":
            nav_text = """
{name}, {age}, {city} - {info}
"""
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            # Проверяем наличие прикрепленного медиа
            nav_attached_media = None
            if nav_user_vars and "photo" in nav_user_vars:
                media_data = nav_user_vars["photo"]
                if isinstance(media_data, dict) and "value" in media_data:
                    nav_attached_media = media_data["value"]
                elif isinstance(media_data, str):
                    nav_attached_media = media_data
            if nav_attached_media and str(nav_attached_media).strip():
                logging.info(f"📎 Отправка фото из переменной photo: {nav_attached_media}")
                await bot.send_photo(callback_query.from_user.id, nav_attached_media, caption=nav_text)
            else:
                logging.info("📝 Медиа не найдено, отправка текстового сообщения")
                await callback_query.message.edit_text(nav_text)
            
            # Проверяем, не ждем ли мы ввод перед автопереходом
            if user_id in user_data and ("waiting_for_input" in user_data[user_id] or "waiting_for_conditional_input" in user_data[user_id]):
                logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем ввод для узла 8xSJaWAJNz7Hz_54mjFTF")
            # Проверяем, разрешён ли автопереход для этого узла (collectUserInput)
            elif user_id in user_data and user_data[user_id].get("collectUserInput_8xSJaWAJNz7Hz_54mjFTF", True) == True:
                logging.info(f"ℹ️ Узел 8xSJaWAJNz7Hz_54mjFTF ожидает ввод (collectUserInput=true), автопереход пропущен")
            else:
                # ⚡ Автопереход к узлу KE-8sR9elPEefApjXtBxC
                logging.info(f"⚡ Автопереход от узла 8xSJaWAJNz7Hz_54mjFTF к узлу KE-8sR9elPEefApjXtBxC")
                await handle_callback_KE_8sR9elPEefApjXtBxC(callback_query)
                logging.info(f"✅ Автопереход выполнен: 8xSJaWAJNz7Hz_54mjFTF -> KE-8sR9elPEefApjXtBxC")
                return
        elif next_node_id == "KE-8sR9elPEefApjXtBxC":
            nav_text = "Все верно?"
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            # Удаляем старое сообщение и отправляем новое с reply клавиатурой
            builder = ReplyKeyboardBuilder()
            builder.add(KeyboardButton(text="Да"))
            builder.add(KeyboardButton(text="Изменить анкету"))
            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
            await bot.send_message(callback_query.from_user.id, nav_text, reply_markup=keyboard)
        elif next_node_id == "yrsc8v81qQa5oQx538Dzn":
            nav_text = """1. Смотреть анкеты.
2. Заполнить анкету заново.
3. Изменить фото/видео.
4. Изменить текст анкеты."""
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            # Удаляем старое сообщение и отправляем новое с reply клавиатурой
            builder = ReplyKeyboardBuilder()
            builder.add(KeyboardButton(text="1"))
            builder.add(KeyboardButton(text="2"))
            builder.add(KeyboardButton(text="3"))
            builder.add(KeyboardButton(text="4"))
            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
            await bot.send_message(callback_query.from_user.id, nav_text, reply_markup=keyboard)
        else:
            logging.warning(f"Неизяяестный следующий узел: {next_node_id}")
    except Exception as e:
        logging.error(f"Ошибка при пяяяяреходе к следующему узлу {next_node_id}: {e}")
    
    return  # Завершаем обработку после переадресации
    
    return

@dp.callback_query(lambda c: c.data == "RFTgm4KzC6dI39AMTPcmo" or c.data.startswith("RFTgm4KzC6dI39AMTPcmo_btn_") or c.data == "done_I39AMTPcmo")
async def handle_callback_RFTgm4KzC6dI39AMTPcmo(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_RFTgm4KzC6dI39AMTPcmo для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_RFTgm4KzC6dI39AMTPcmo: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла RFTgm4KzC6dI39AMTPcmo
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_RFTgm4KzC6dI39AMTPcmo"] = True
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла RFTgm4KzC6dI39AMTPcmo: true")
    
    # Проверяем, был ли переход через кнопку с skipDataCollection
    skip_transition_flag = user_data.get(user_id, {}).get("skipDataCollectionTransition", False)
    if not skip_transition_flag:
        await update_user_data_in_db(user_id, "sex", callback_query.data)
        logging.info(f"Переменная sex сохранена: " + str(callback_query.data) + f" (пользователь {user_id})")
    else:
        # Сбрасываем флаг
        if user_id in user_data and "skipDataCollectionTransition" in user_data[user_id]:
            del user_data[user_id]["skipDataCollectionTransition"]
        logging.info(f"Переход через skipDataCollection, переменная sex не сохраняется (пользователь {user_id})")
    
    # Обрабатываем узел RFTgm4KzC6dI39AMTPcmo: RFTgm4KzC6dI39AMTPcmo
    text = "Кто тебе интересен?"
    
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
    # Create reply keyboard
    # Удаляем старое сообщение и отправляем новое с reply клавиатурой
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="Девушки"))
    builder.add(KeyboardButton(text="Парни"))
    builder.add(KeyboardButton(text="Все равно"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    # Для reply клавиатуры нужно отправить новое сообщение
    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)
    
    # Настройка waiting_for_input для узла с reply клавиатурой (collectUserInput=true)
    user_id = callback_query.from_user.id
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["waiting_for_input"] = {
        "type": "button",
        "modes": ['button', 'text'],
        "variable": "sex",
        "save_to_database": True,
        "node_id": "RFTgm4KzC6dI39AMTPcmo",
        "next_node_id": "",
        "skip_buttons": []
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['button', 'text'] для переменной sex (узел RFTgm4KzC6dI39AMTPcmo)")
    return  # Возвращаемся чтобы не отправить сообщение дважды
    
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
        "type": "button",
        "modes": ["button", "text"],
        "variable": "sex",
        "save_to_database": True,
        "node_id": "RFTgm4KzC6dI39AMTPcmo",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['button', 'text'] для переменной sex (узел RFTgm4KzC6dI39AMTPcmo)")
    user_id = callback_query.from_user.id
    
    # Сохраняем нажатие кнопки в базу данных
    # Ищем текят кнопки по callback_data
    # Определяем тякст кнопки по callback_data
    button_display_text = "Неизвестная кнопка"
    if callback_query.data.endswith("_btn_0"):
        button_display_text = "Я девушка"
    if callback_query.data.endswith("_btn_1"):
        button_display_text = "Я парень"
    # Дополнительная проверка по точному соответствию callback_data
    if callback_query.data == "RFTgm4KzC6dI39AMTPcmo":
        button_display_text = "Я девушка"
    if callback_query.data == "RFTgm4KzC6dI39AMTPcmo":
        button_display_text = "Я парень"
    
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
        await update_user_data_in_db(user_id, "gender", button_display_text)
        logging.info(f"Переменная gender сохранена: " + str(button_display_text) + f" (пользователь {user_id})")
    else:
        logging.info("⏸️ Пропускаем сохранение переменной: показана условная клавиатура, ждём выбор пользователя")
    
    # ПЕРЕАДРЕСАЦИЯ: Переходим к следующему узлу после сояранения данных
    next_node_id = "sIh3xXKEtb_TtrhHqZQzX"
    try:
        logging.info(f"🚀 Переходим к следующему узлу после выбора кнопки: {next_node_id}")
        if next_node_id == "start":
            logging.info("Переход к узлу start")
        elif next_node_id == "f90r9k3FSLu2Tjn74cBn_":
            nav_text = "Теперь определимся с полом"
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            # Удаляем старое сообщение и отправляем новое с reply клавиатурой
            builder = ReplyKeyboardBuilder()
            builder.add(KeyboardButton(text="Я девушка"))
            builder.add(KeyboardButton(text="Я парень"))
            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
            await bot.send_message(callback_query.from_user.id, nav_text, reply_markup=keyboard)
            # ИСПРАВЛЕНИЕ: Проверяем, не была ли переменная уже сохранена inline кнопкой
            user_id = callback_query.from_user.id
            if user_id not in user_data:
                user_data[user_id] = {}
            # Проверяем, не была ли переменная gender уже сохранена
            if "gender" not in user_data[user_id] or not user_data[user_id]["gender"]:
                # Переменная не сохранена - используем универсальную функцию для настройки ожидания ввода
                # Тип ввода: text
                            user_data[callback_query.from_user.id] = user_data.get(callback_query.from_user.id, {})
                            user_data[callback_query.from_user.id]["waiting_for_input"] = {
                                "type": "button",
                                "modes": ["button", "text"],
                                "variable": "gender",
                                "save_to_database": True,
                                "node_id": "f90r9k3FSLu2Tjn74cBn_",
                                "next_node_id": "",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['button', 'text'] для переменной gender (узел f90r9k3FSLu2Tjn74cBn_)")
            else:
                logging.info(f"⏭️ Переменная gender уже сохранена, пропускаем ожидание ввода")
        elif next_node_id == "RFTgm4KzC6dI39AMTPcmo":
            nav_text = "Кто тебе интересен?"
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            # Удаляем старое сообщение и отправляем новое с reply клавиатурой
            builder = ReplyKeyboardBuilder()
            builder.add(KeyboardButton(text="Девушки"))
            builder.add(KeyboardButton(text="Парни"))
            builder.add(KeyboardButton(text="Все равно"))
            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
            await bot.send_message(callback_query.from_user.id, nav_text, reply_markup=keyboard)
            # ИСПРАВЛЕНИЕ: Проверяем, не была ли переменная уже сохранена inline кнопкой
            user_id = callback_query.from_user.id
            if user_id not in user_data:
                user_data[user_id] = {}
            # Проверяем, не была ли переменная sex уже сохранена
            if "sex" not in user_data[user_id] or not user_data[user_id]["sex"]:
                # Переменная не сохранена - используем универсальную функцию для настройки ожидания ввода
                # Тип ввода: text
                            user_data[callback_query.from_user.id] = user_data.get(callback_query.from_user.id, {})
                            user_data[callback_query.from_user.id]["waiting_for_input"] = {
                                "type": "button",
                                "modes": ["button", "text"],
                                "variable": "sex",
                                "save_to_database": True,
                                "node_id": "RFTgm4KzC6dI39AMTPcmo",
                                "next_node_id": "",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['button', 'text'] для переменной sex (узел RFTgm4KzC6dI39AMTPcmo)")
            else:
                logging.info(f"⏭️ Переменная sex уже сохранена, пропускаем ожидание ввода")
        elif next_node_id == "sIh3xXKEtb_TtrhHqZQzX":
            # Узел с условными сообщениями - вызываем полноценный обработчик
            logging.info(f"🔧 Callback навигация к узлу с условными сообщениями: sIh3xXKEtb_TtrhHqZQzX")
            await handle_node_sIh3xXKEtb_TtrhHqZQzX(callback_query.message)
        elif next_node_id == "tS2XGL2Mn4LkE63SnxhPy":
            # Узел с условными сообщениями - вызываем полноценный обработчик
            logging.info(f"🔧 Callback навигация к узлу с условными сообщениями: tS2XGL2Mn4LkE63SnxhPy")
            await handle_node_tS2XGL2Mn4LkE63SnxhPy(callback_query.message)
        elif next_node_id == "lBPy3gcGVLla0NGdSYb35":
            # Узел с условными сообщениями - вызываем полноценный обработчик
            logging.info(f"🔧 Callback навигация к узлу с условными сообщениями: lBPy3gcGVLla0NGdSYb35")
            await handle_node_lBPy3gcGVLla0NGdSYb35(callback_query.message)
        elif next_node_id == "Y9zLRp1BLpVhm-HcsNkJV":
            # Узел с условными сообщениями - вызываем полноценный обработчик
            logging.info(f"🔧 Callback навигация к узлу с условными сообщениями: Y9zLRp1BLpVhm-HcsNkJV")
            await handle_node_Y9zLRp1BLpVhm_HcsNkJV(callback_query.message)
        elif next_node_id == "vxPv7G4n0QGyhnv4ucOM5":
            nav_text = "Так выглядит твоя анкета:"
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            await callback_query.message.edit_text(nav_text)
            
            # Проверяем, не ждем ли мы ввод перед автопереходом
            if user_id in user_data and ("waiting_for_input" in user_data[user_id] or "waiting_for_conditional_input" in user_data[user_id]):
                logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем ввод для узла vxPv7G4n0QGyhnv4ucOM5")
            # Проверяем, разрешён ли автопереход для этого узла (collectUserInput)
            elif user_id in user_data and user_data[user_id].get("collectUserInput_vxPv7G4n0QGyhnv4ucOM5", True) == True:
                logging.info(f"ℹ️ Узел vxPv7G4n0QGyhnv4ucOM5 ожидает ввод (collectUserInput=true), автопереход пропущен")
            else:
                # ⚡ Автопереход к узлу 8xSJaWAJNz7Hz_54mjFTF
                logging.info(f"⚡ Автопереход от узла vxPv7G4n0QGyhnv4ucOM5 к узлу 8xSJaWAJNz7Hz_54mjFTF")
                await handle_callback_8xSJaWAJNz7Hz_54mjFTF(callback_query)
                logging.info(f"✅ Автопереход выполнен: vxPv7G4n0QGyhnv4ucOM5 -> 8xSJaWAJNz7Hz_54mjFTF")
                return
        elif next_node_id == "8xSJaWAJNz7Hz_54mjFTF":
            nav_text = """
{name}, {age}, {city} - {info}
"""
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            # Проверяем наличие прикрепленного медиа
            nav_attached_media = None
            if nav_user_vars and "photo" in nav_user_vars:
                media_data = nav_user_vars["photo"]
                if isinstance(media_data, dict) and "value" in media_data:
                    nav_attached_media = media_data["value"]
                elif isinstance(media_data, str):
                    nav_attached_media = media_data
            if nav_attached_media and str(nav_attached_media).strip():
                logging.info(f"📎 Отправка фото из переменной photo: {nav_attached_media}")
                await bot.send_photo(callback_query.from_user.id, nav_attached_media, caption=nav_text)
            else:
                logging.info("📝 Медиа не найдено, отправка текстового сообщения")
                await callback_query.message.edit_text(nav_text)
            
            # Проверяем, не ждем ли мы ввод перед автопереходом
            if user_id in user_data and ("waiting_for_input" in user_data[user_id] or "waiting_for_conditional_input" in user_data[user_id]):
                logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем ввод для узла 8xSJaWAJNz7Hz_54mjFTF")
            # Проверяем, разрешён ли автопереход для этого узла (collectUserInput)
            elif user_id in user_data and user_data[user_id].get("collectUserInput_8xSJaWAJNz7Hz_54mjFTF", True) == True:
                logging.info(f"ℹ️ Узел 8xSJaWAJNz7Hz_54mjFTF ожидает ввод (collectUserInput=true), автопереход пропущен")
            else:
                # ⚡ Автопереход к узлу KE-8sR9elPEefApjXtBxC
                logging.info(f"⚡ Автопереход от узла 8xSJaWAJNz7Hz_54mjFTF к узлу KE-8sR9elPEefApjXtBxC")
                await handle_callback_KE_8sR9elPEefApjXtBxC(callback_query)
                logging.info(f"✅ Автопереход выполнен: 8xSJaWAJNz7Hz_54mjFTF -> KE-8sR9elPEefApjXtBxC")
                return
        elif next_node_id == "KE-8sR9elPEefApjXtBxC":
            nav_text = "Все верно?"
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            # Удаляем старое сообщение и отправляем новое с reply клавиатурой
            builder = ReplyKeyboardBuilder()
            builder.add(KeyboardButton(text="Да"))
            builder.add(KeyboardButton(text="Изменить анкету"))
            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
            await bot.send_message(callback_query.from_user.id, nav_text, reply_markup=keyboard)
        elif next_node_id == "yrsc8v81qQa5oQx538Dzn":
            nav_text = """1. Смотреть анкеты.
2. Заполнить анкету заново.
3. Изменить фото/видео.
4. Изменить текст анкеты."""
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            # Удаляем старое сообщение и отправляем новое с reply клавиатурой
            builder = ReplyKeyboardBuilder()
            builder.add(KeyboardButton(text="1"))
            builder.add(KeyboardButton(text="2"))
            builder.add(KeyboardButton(text="3"))
            builder.add(KeyboardButton(text="4"))
            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
            await bot.send_message(callback_query.from_user.id, nav_text, reply_markup=keyboard)
        else:
            logging.warning(f"Неизяяестный следующий узел: {next_node_id}")
    except Exception as e:
        logging.error(f"Ошибка при пяяяяреходе к следующему узлу {next_node_id}: {e}")
    
    return  # Завершаем обработку после переадресации
    
    # Удаляем старое сообщение
    
    text = "Кто тебе интересен?"
    await bot.send_message(callback_query.from_user.id, text)
    # Настраиваем ожидание ввода (collectUserInput=true)
    user_data[callback_query.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "variable": "sex",
        "save_to_database": False,
        "node_id": "RFTgm4KzC6dI39AMTPcmo",
        "next_node_id": "sIh3xXKEtb_TtrhHqZQzX"
    }
    return

@dp.callback_query(lambda c: c.data == "sIh3xXKEtb_TtrhHqZQzX" or c.data.startswith("sIh3xXKEtb_TtrhHqZQzX_btn_") or c.data == "done_TtrhHqZQzX")
async def handle_callback_sIh3xXKEtb_TtrhHqZQzX(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_sIh3xXKEtb_TtrhHqZQzX для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_sIh3xXKEtb_TtrhHqZQzX: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла sIh3xXKEtb_TtrhHqZQzX
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_sIh3xXKEtb_TtrhHqZQzX"] = True
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла sIh3xXKEtb_TtrhHqZQzX: true")
    
    # Проверяем, был ли переход через кнопку с skipDataCollection
    skip_transition_flag = user_data.get(user_id, {}).get("skipDataCollectionTransition", False)
    if not skip_transition_flag:
        await update_user_data_in_db(user_id, "city", callback_query.data)
        logging.info(f"Переменная city сохранена: " + str(callback_query.data) + f" (пользователь {user_id})")
    else:
        # Сбрасываем флаг
        if user_id in user_data and "skipDataCollectionTransition" in user_data[user_id]:
            del user_data[user_id]["skipDataCollectionTransition"]
        logging.info(f"Переход через skipDataCollection, переменная city не сохраняется (пользователь {user_id})")
    
    # Обрабатываем узел sIh3xXKEtb_TtrhHqZQzX: sIh3xXKEtb_TtrhHqZQzX
    text = "Из какого ты города?"
    
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
    
    # Проверка условных сообщений дляя навигации
    conditional_parse_mode = None
    conditional_keyboard = None
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    user_data_dict = user_record if user_record else user_data.get(user_id, {})
    # Инициализируем базовые переменные пользователя если их нет
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Проверяем наличие message (для message handlers)
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user
        
        if user_obj:
            init_user_variables(user_id, user_obj)
    
    # Подставляем все доступные переменные пользователя в текст кнопок
    user_vars = await get_user_from_db(user_id)
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    
    # get_user_from_db теперь возвращает уже обработанные user_data
    if not isinstance(user_vars, dict):
        user_vars = {}
    
    # Заменяем все переменные в тексте
    import re
    def replace_variables_in_text(text_content, variables_dict):
        if not text_content or not variables_dict:
            return text_content
        
        for var_name, var_data in variables_dict.items():
            placeholder = "{" + var_name + "}"
            if placeholder in text_content:
                if isinstance(var_data, dict) and "value" in var_data:
                    var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                elif var_data is not None:
                    var_value = str(var_data)
                else:
                    var_value = var_name  # Показываем имя переменной если значения нет
                text_content = text_content.replace(placeholder, var_value)
        return text_content
    
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        # Дополнительная проверка: если переменная не найдена напрямую, проверяем, не является ли она частью user_data в другом формате
        # Это может случиться, если переменная была сохранена в формате, отличном от ожидаемого
        if "user_data" in user_data_dict and isinstance(user_data_dict["user_data"], dict):
            nested_data = user_data_dict["user_data"]
            if var_name in nested_data:
                raw_value = nested_data[var_name]
                if isinstance(raw_value, dict) and "value" in raw_value:
                    var_value = raw_value["value"]
                    # Проверяем, что значение действительно существует и не пустое
                    if var_value is not None and str(var_value).strip() != "":
                        return True, str(var_value)
                else:
                    # Проверяем, что значение действительно существует и не пустое
                    if raw_value is not None and str(raw_value).strip() != "":
                        return True, str(raw_value)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: city
    if (
        check_user_variable("city", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["city"] = check_user_variable("city", user_data_dict)
        # Условное сообщение пустое, используем основной текст узла (text уже инициализирован)
        conditional_parse_mode = None
        if "{city}" in text and variable_values["city"] is not None:
            text = text.replace("{city}", variable_values["city"])
        # Создаем reply клавиатуру для условного сообщения
        builder = ReplyKeyboardBuilder()
        builder.add(KeyboardButton(text=replace_variables_in_text("{city}", user_vars)))
        keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
        conditional_keyboard = keyboard
        # ВАЖНО: Логируем состояние условной клавиатуры для отладки
        logging.info(f"🎹 Условная клавиатура для user_data_exists: conditional_keyboard={'установлена' if conditional_keyboard else 'не установлена'}")
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "cond-city-1",
            "wait_for_input": True,
            "input_variable": "city",
            "next_node_id": "tS2XGL2Mn4LkE63SnxhPy",
            "source_type": "conditional_message",
            "skip_buttons": []
        }
        # Настраиваем ожидание ввода для условного сообщения с waitForTextInput
        if conditional_message_config and conditional_message_config.get("wait_for_input"):
            if user_id not in user_data:
                user_data[user_id] = {}
            user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config
            logging.info(f"Активировано ожидание условного ввода (переменная существует, но ждём новое значение): {conditional_message_config}")
            # ВАЖНО: Переменная существует, но waitForTextInput=true, поэтому НЕ делаем автопереход
            # Сбрасываем флаг условия чтобы fallback показал сообщение и дождался ввода
            # НО мы уже установили waiting_for_conditional_input, так что НЕ нужно делать break
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
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
    
    # АВТОПЕРЕХОД: Проверяем, есть ли автопереход для этого узла
    # ИСПРАВЛЕНИЕ: НЕ делаем автопереход если была показана условная клавиатура
    user_id = callback_query.from_user.id
    has_conditional_keyboard = user_data.get(user_id, {}).get("_has_conditional_keyboard", False)
    if has_conditional_keyboard:
        logging.info("⏸️ Автопереход ОТЛОЖЕН: показана условная клавиатура - ждём нажатия кнопки")
    elif user_id in user_data and ("waiting_for_input" in user_data[user_id] or "waiting_for_conditional_input" in user_data[user_id]):
        logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем ввод для узла sIh3xXKEtb_TtrhHqZQzX")
    # ИСПРАВЛЕНИЕ: НЕ делаем автопереход если collectUserInput=true (узел ожидает ввод)
    elif user_id in user_data and user_data[user_id].get("collectUserInput_sIh3xXKEtb_TtrhHqZQzX", True) == True:
        logging.info(f"ℹ️ Узел sIh3xXKEtb_TtrhHqZQzX ожидает ввод (collectUserInput=true из user_data), автопереход пропущен")
    elif True:  # Узел ожидает ввод (статическая проверка)
        logging.info(f"ℹ️ Узел sIh3xXKEtb_TtrhHqZQzX ожидает ввод (collectUserInput=true из статической проверки), автопереход пропущен")
    else:
        # ⚡ Автопереход к узлу tS2XGL2Mn4LkE63SnxhPy
        logging.info(f"⚡ Автопереход от узла sIh3xXKEtb_TtrhHqZQzX к узлу tS2XGL2Mn4LkE63SnxhPy")
        await handle_callback_tS2XGL2Mn4LkE63SnxhPy(callback_query)
        logging.info(f"✅ Автопереход выполнен: sIh3xXKEtb_TtrhHqZQzX -> tS2XGL2Mn4LkE63SnxhPy")
        return
    
    # Устанавливаем waiting_for_input, так как автопереход не выполнен
    user_data[user_id] = user_data.get(user_id, {})
    user_data[user_id]["waiting_for_input"] = {
        "type": "text",
        "modes": ["text"],
        "variable": "city",
        "save_to_database": True,
        "node_id": "sIh3xXKEtb_TtrhHqZQzX",
        "next_node_id": "tS2XGL2Mn4LkE63SnxhPy",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной city (узел sIh3xXKEtb_TtrhHqZQzX)")
    user_id = callback_query.from_user.id
    
    # Сохраняем нажатие кнопки в базу данных
    # Ищем текят кнопки по callback_data
    # Определяем тякст кнопки по callback_data
    button_display_text = "Неизвестная кнопка"
    if callback_query.data.endswith("_btn_0"):
        button_display_text = "Девушки"
    if callback_query.data.endswith("_btn_1"):
        button_display_text = "Парни"
    if callback_query.data.endswith("_btn_2"):
        button_display_text = "Все равно"
    # Дополнительная проверка по точному соответствию callback_data
    if callback_query.data == "sIh3xXKEtb_TtrhHqZQzX":
        button_display_text = "Девушки"
    if callback_query.data == "sIh3xXKEtb_TtrhHqZQzX":
        button_display_text = "Парни"
    if callback_query.data == "sIh3xXKEtb_TtrhHqZQzX":
        button_display_text = "Все равно"
    
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
        await update_user_data_in_db(user_id, "sex", button_display_text)
        logging.info(f"Переменная sex сохранена: " + str(button_display_text) + f" (пользователь {user_id})")
    else:
        logging.info("⏸️ Пропускаем сохранение переменной: показана условная клавиатура, ждём выбор пользователя")
    
    
    # Удаляем старое сообщение
    
    text = "Из какого ты города?"
    await bot.send_message(callback_query.from_user.id, text)
    # Настраиваем ожидание ввода (collectUserInput=true)
    user_data[callback_query.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "variable": "city",
        "save_to_database": False,
        "node_id": "sIh3xXKEtb_TtrhHqZQzX",
        "next_node_id": "tS2XGL2Mn4LkE63SnxhPy"
    }
    return

@dp.callback_query(lambda c: c.data == "yrsc8v81qQa5oQx538Dzn" or c.data.startswith("yrsc8v81qQa5oQx538Dzn_btn_") or c.data == "done_5oQx538Dzn")
async def handle_callback_yrsc8v81qQa5oQx538Dzn(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_yrsc8v81qQa5oQx538Dzn для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_yrsc8v81qQa5oQx538Dzn: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла yrsc8v81qQa5oQx538Dzn
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_yrsc8v81qQa5oQx538Dzn"] = False
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла yrsc8v81qQa5oQx538Dzn: false")
    
    # Обрабатываем узел yrsc8v81qQa5oQx538Dzn: yrsc8v81qQa5oQx538Dzn
    text = """1. Смотреть анкеты.
2. Заполнить анкету заново.
3. Изменить фото/видео.
4. Изменить текст анкеты."""
    
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
    # Create reply keyboard
    # Удаляем старое сообщение и отправляем новое с reply клавиатурой
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="1"))
    builder.add(KeyboardButton(text="2"))
    builder.add(KeyboardButton(text="3"))
    builder.add(KeyboardButton(text="4"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    # Для reply клавиатуры нужно отправить новое сообщение
    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)
    
    # Узел yrsc8v81qQa5oQx538Dzn имеет collectUserInput=false - НЕ устанавливаем waiting_for_input
    logging.info(f"ℹ️ Узел yrsc8v81qQa5oQx538Dzn не собирает ответы (collectUserInput=false)")
    return  # Возвращаемся чтобы не отправить сообщение дважды
    
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
        "type": "button",
        "modes": ["button"],
        "variable": "response_yrsc8v81qQa5oQx538Dzn",
        "save_to_database": True,
        "node_id": "yrsc8v81qQa5oQx538Dzn",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['button'] для переменной response_yrsc8v81qQa5oQx538Dzn (узел yrsc8v81qQa5oQx538Dzn)")
    user_id = callback_query.from_user.id
    
    # Сохраняем нажатие кнопки в базу данных
    # Ищем текят кнопки по callback_data
    button_display_text = "Да"
    
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
        await update_user_data_in_db(user_id, "button_click", button_display_text)
        logging.info(f"Переменная button_click сохранена: " + str(button_display_text) + f" (пользователь {user_id})")
    else:
        logging.info("⏸️ Пропускаем сохранение переменной: показана условная клавиатура, ждём выбор пользователя")
    
    # ПЕРЕАДРЕСАЦИЯ: Переходим к следующему узлу после сояранения данных
    next_node_id = "start"
    try:
        logging.info(f"🚀 Переходим к следующему узлу после выбора кнопки: {next_node_id}")
        if next_node_id == "start":
            logging.info("Переход к узлу start")
        elif next_node_id == "f90r9k3FSLu2Tjn74cBn_":
            nav_text = "Теперь определимся с полом"
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            # Удаляем старое сообщение и отправляем новое с reply клавиатурой
            builder = ReplyKeyboardBuilder()
            builder.add(KeyboardButton(text="Я девушка"))
            builder.add(KeyboardButton(text="Я парень"))
            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
            await bot.send_message(callback_query.from_user.id, nav_text, reply_markup=keyboard)
            # ИСПРАВЛЕНИЕ: Проверяем, не была ли переменная уже сохранена inline кнопкой
            user_id = callback_query.from_user.id
            if user_id not in user_data:
                user_data[user_id] = {}
            # Проверяем, не была ли переменная gender уже сохранена
            if "gender" not in user_data[user_id] or not user_data[user_id]["gender"]:
                # Переменная не сохранена - используем универсальную функцию для настройки ожидания ввода
                # Тип ввода: text
                            user_data[callback_query.from_user.id] = user_data.get(callback_query.from_user.id, {})
                            user_data[callback_query.from_user.id]["waiting_for_input"] = {
                                "type": "button",
                                "modes": ["button", "text"],
                                "variable": "gender",
                                "save_to_database": True,
                                "node_id": "f90r9k3FSLu2Tjn74cBn_",
                                "next_node_id": "",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['button', 'text'] для переменной gender (узел f90r9k3FSLu2Tjn74cBn_)")
            else:
                logging.info(f"⏭️ Переменная gender уже сохранена, пропускаем ожидание ввода")
        elif next_node_id == "RFTgm4KzC6dI39AMTPcmo":
            nav_text = "Кто тебе интересен?"
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            # Удаляем старое сообщение и отправляем новое с reply клавиатурой
            builder = ReplyKeyboardBuilder()
            builder.add(KeyboardButton(text="Девушки"))
            builder.add(KeyboardButton(text="Парни"))
            builder.add(KeyboardButton(text="Все равно"))
            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
            await bot.send_message(callback_query.from_user.id, nav_text, reply_markup=keyboard)
            # ИСПРАВЛЕНИЕ: Проверяем, не была ли переменная уже сохранена inline кнопкой
            user_id = callback_query.from_user.id
            if user_id not in user_data:
                user_data[user_id] = {}
            # Проверяем, не была ли переменная sex уже сохранена
            if "sex" not in user_data[user_id] or not user_data[user_id]["sex"]:
                # Переменная не сохранена - используем универсальную функцию для настройки ожидания ввода
                # Тип ввода: text
                            user_data[callback_query.from_user.id] = user_data.get(callback_query.from_user.id, {})
                            user_data[callback_query.from_user.id]["waiting_for_input"] = {
                                "type": "button",
                                "modes": ["button", "text"],
                                "variable": "sex",
                                "save_to_database": True,
                                "node_id": "RFTgm4KzC6dI39AMTPcmo",
                                "next_node_id": "",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['button', 'text'] для переменной sex (узел RFTgm4KzC6dI39AMTPcmo)")
            else:
                logging.info(f"⏭️ Переменная sex уже сохранена, пропускаем ожидание ввода")
        elif next_node_id == "sIh3xXKEtb_TtrhHqZQzX":
            # Узел с условными сообщениями - вызываем полноценный обработчик
            logging.info(f"🔧 Callback навигация к узлу с условными сообщениями: sIh3xXKEtb_TtrhHqZQzX")
            await handle_node_sIh3xXKEtb_TtrhHqZQzX(callback_query.message)
        elif next_node_id == "tS2XGL2Mn4LkE63SnxhPy":
            # Узел с условными сообщениями - вызываем полноценный обработчик
            logging.info(f"🔧 Callback навигация к узлу с условными сообщениями: tS2XGL2Mn4LkE63SnxhPy")
            await handle_node_tS2XGL2Mn4LkE63SnxhPy(callback_query.message)
        elif next_node_id == "lBPy3gcGVLla0NGdSYb35":
            # Узел с условными сообщениями - вызываем полноценный обработчик
            logging.info(f"🔧 Callback навигация к узлу с условными сообщениями: lBPy3gcGVLla0NGdSYb35")
            await handle_node_lBPy3gcGVLla0NGdSYb35(callback_query.message)
        elif next_node_id == "Y9zLRp1BLpVhm-HcsNkJV":
            # Узел с условными сообщениями - вызываем полноценный обработчик
            logging.info(f"🔧 Callback навигация к узлу с условными сообщениями: Y9zLRp1BLpVhm-HcsNkJV")
            await handle_node_Y9zLRp1BLpVhm_HcsNkJV(callback_query.message)
        elif next_node_id == "vxPv7G4n0QGyhnv4ucOM5":
            nav_text = "Так выглядит твоя анкета:"
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            await callback_query.message.edit_text(nav_text)
            
            # Проверяем, не ждем ли мы ввод перед автопереходом
            if user_id in user_data and ("waiting_for_input" in user_data[user_id] or "waiting_for_conditional_input" in user_data[user_id]):
                logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем ввод для узла vxPv7G4n0QGyhnv4ucOM5")
            # Проверяем, разрешён ли автопереход для этого узла (collectUserInput)
            elif user_id in user_data and user_data[user_id].get("collectUserInput_vxPv7G4n0QGyhnv4ucOM5", True) == True:
                logging.info(f"ℹ️ Узел vxPv7G4n0QGyhnv4ucOM5 ожидает ввод (collectUserInput=true), автопереход пропущен")
            else:
                # ⚡ Автопереход к узлу 8xSJaWAJNz7Hz_54mjFTF
                logging.info(f"⚡ Автопереход от узла vxPv7G4n0QGyhnv4ucOM5 к узлу 8xSJaWAJNz7Hz_54mjFTF")
                await handle_callback_8xSJaWAJNz7Hz_54mjFTF(callback_query)
                logging.info(f"✅ Автопереход выполнен: vxPv7G4n0QGyhnv4ucOM5 -> 8xSJaWAJNz7Hz_54mjFTF")
                return
        elif next_node_id == "8xSJaWAJNz7Hz_54mjFTF":
            nav_text = """
{name}, {age}, {city} - {info}
"""
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            # Проверяем наличие прикрепленного медиа
            nav_attached_media = None
            if nav_user_vars and "photo" in nav_user_vars:
                media_data = nav_user_vars["photo"]
                if isinstance(media_data, dict) and "value" in media_data:
                    nav_attached_media = media_data["value"]
                elif isinstance(media_data, str):
                    nav_attached_media = media_data
            if nav_attached_media and str(nav_attached_media).strip():
                logging.info(f"📎 Отправка фото из переменной photo: {nav_attached_media}")
                await bot.send_photo(callback_query.from_user.id, nav_attached_media, caption=nav_text)
            else:
                logging.info("📝 Медиа не найдено, отправка текстового сообщения")
                await callback_query.message.edit_text(nav_text)
            
            # Проверяем, не ждем ли мы ввод перед автопереходом
            if user_id in user_data and ("waiting_for_input" in user_data[user_id] or "waiting_for_conditional_input" in user_data[user_id]):
                logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем ввод для узла 8xSJaWAJNz7Hz_54mjFTF")
            # Проверяем, разрешён ли автопереход для этого узла (collectUserInput)
            elif user_id in user_data and user_data[user_id].get("collectUserInput_8xSJaWAJNz7Hz_54mjFTF", True) == True:
                logging.info(f"ℹ️ Узел 8xSJaWAJNz7Hz_54mjFTF ожидает ввод (collectUserInput=true), автопереход пропущен")
            else:
                # ⚡ Автопереход к узлу KE-8sR9elPEefApjXtBxC
                logging.info(f"⚡ Автопереход от узла 8xSJaWAJNz7Hz_54mjFTF к узлу KE-8sR9elPEefApjXtBxC")
                await handle_callback_KE_8sR9elPEefApjXtBxC(callback_query)
                logging.info(f"✅ Автопереход выполнен: 8xSJaWAJNz7Hz_54mjFTF -> KE-8sR9elPEefApjXtBxC")
                return
        elif next_node_id == "KE-8sR9elPEefApjXtBxC":
            nav_text = "Все верно?"
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            # Удаляем старое сообщение и отправляем новое с reply клавиатурой
            builder = ReplyKeyboardBuilder()
            builder.add(KeyboardButton(text="Да"))
            builder.add(KeyboardButton(text="Изменить анкету"))
            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
            await bot.send_message(callback_query.from_user.id, nav_text, reply_markup=keyboard)
        elif next_node_id == "yrsc8v81qQa5oQx538Dzn":
            nav_text = """1. Смотреть анкеты.
2. Заполнить анкету заново.
3. Изменить фото/видео.
4. Изменить текст анкеты."""
            # Подставляем переменные пользователя в текст
            nav_user_vars = await get_user_from_db(callback_query.from_user.id)
            if not nav_user_vars:
                nav_user_vars = user_data.get(callback_query.from_user.id, {})
            if not isinstance(nav_user_vars, dict):
                nav_user_vars = {}
            # Заменяем переменные в nav_text
            for var_name, var_data in nav_user_vars.items():
                placeholder = "{" + var_name + "}"
                if placeholder in nav_text:
                    if isinstance(var_data, dict) and "value" in var_data:
                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                    elif var_data is not None:
                        var_value = str(var_data)
                    else:
                        var_value = var_name
                    nav_text = nav_text.replace(placeholder, var_value)
            # Удаляем старое сообщение и отправляем новое с reply клавиатурой
            builder = ReplyKeyboardBuilder()
            builder.add(KeyboardButton(text="1"))
            builder.add(KeyboardButton(text="2"))
            builder.add(KeyboardButton(text="3"))
            builder.add(KeyboardButton(text="4"))
            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
            await bot.send_message(callback_query.from_user.id, nav_text, reply_markup=keyboard)
        else:
            logging.warning(f"Неизяяестный следующий узел: {next_node_id}")
    except Exception as e:
        logging.error(f"Ошибка при пяяяяреходе к следующему узлу {next_node_id}: {e}")
    
    return  # Завершаем обработку после переадресации
    
    return

# Обработчики reply кнопок

@dp.message(lambda message: message.text == "Я девушка")
async def handle_reply_iIkbMb2jlZRJOxGHMNl1a(message: types.Message):
    text = "Кто тебе интересен?"
    user_id = message.from_user.id
    skip_collection = False
    
    if not skip_collection and user_id in user_data and "waiting_for_input" in user_data[user_id]:
        waiting_config = user_data[user_id]["waiting_for_input"]
        modes = waiting_config.get("modes", [waiting_config.get("type", "text")]) if isinstance(waiting_config, dict) else []
        waiting_node_id = waiting_config.get("node_id", "") if isinstance(waiting_config, dict) else ""
        if isinstance(waiting_config, dict) and waiting_config.get("save_to_database") and ("button" in modes or waiting_config.get("type") == "button"):
            variable_name = waiting_config.get("variable", "button_response")
            button_text = "Я девушка"
            logging.info(f"💾 Сохраняем ответ кнопки в переменную: {variable_name} = {button_text} (modes: {modes}, waiting_node: {waiting_node_id})")
            
            # Сохраняем в пользовательские данные
            user_data[user_id][variable_name] = button_text
            
            # Сохраняем в базу данных
            saved_to_db = await update_user_data_in_db(user_id, variable_name, button_text)
            if saved_to_db:
                logging.info(f"✅ Ответ кнопки сохранён в БД: {variable_name} = {button_text} (пользователь {user_id})")
            else:
                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            # Очищаем состояние ожидания после сохранения
            logging.info(f"🧹 Очищаем waiting_for_input после сохранения ответа кнопки")
            del user_data[user_id]["waiting_for_input"]
        elif isinstance(waiting_config, dict):
            logging.info(f"ℹ️ waiting_for_input активен, но button не в modes: {modes}, пропускаем сохранение")
    elif skip_collection:
        logging.info(f"⏭️ Кнопка имеет skipDataCollection=true, пропускаем сохранение")
    
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
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="Девушки"))
    builder.add(KeyboardButton(text="Парни"))
    builder.add(KeyboardButton(text="Все равно"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    
    # Устанавливаем waiting_for_input для целевого узла (collectUserInput=true)
    user_data[user_id]["waiting_for_input"] = {
        "type": "text",
        "modes": ['button', 'text'],
        "variable": "sex",
        "save_to_database": True,
        "node_id": "RFTgm4KzC6dI39AMTPcmo",
        "skip_buttons": []
    }
    logging.info(f"✅ Состояние ожидания настроено: type='text', modes=['button', 'text'] для переменной sex (узел RFTgm4KzC6dI39AMTPcmo)")
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "Я парень")
async def handle_reply_0dBjAkcTa9rEsjEP48XzB(message: types.Message):
    text = "Кто тебе интересен?"
    user_id = message.from_user.id
    skip_collection = False
    
    if not skip_collection and user_id in user_data and "waiting_for_input" in user_data[user_id]:
        waiting_config = user_data[user_id]["waiting_for_input"]
        modes = waiting_config.get("modes", [waiting_config.get("type", "text")]) if isinstance(waiting_config, dict) else []
        waiting_node_id = waiting_config.get("node_id", "") if isinstance(waiting_config, dict) else ""
        if isinstance(waiting_config, dict) and waiting_config.get("save_to_database") and ("button" in modes or waiting_config.get("type") == "button"):
            variable_name = waiting_config.get("variable", "button_response")
            button_text = "Я парень"
            logging.info(f"💾 Сохраняем ответ кнопки в переменную: {variable_name} = {button_text} (modes: {modes}, waiting_node: {waiting_node_id})")
            
            # Сохраняем в пользовательские данные
            user_data[user_id][variable_name] = button_text
            
            # Сохраняем в базу данных
            saved_to_db = await update_user_data_in_db(user_id, variable_name, button_text)
            if saved_to_db:
                logging.info(f"✅ Ответ кнопки сохранён в БД: {variable_name} = {button_text} (пользователь {user_id})")
            else:
                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            # Очищаем состояние ожидания после сохранения
            logging.info(f"🧹 Очищаем waiting_for_input после сохранения ответа кнопки")
            del user_data[user_id]["waiting_for_input"]
        elif isinstance(waiting_config, dict):
            logging.info(f"ℹ️ waiting_for_input активен, но button не в modes: {modes}, пропускаем сохранение")
    elif skip_collection:
        logging.info(f"⏭️ Кнопка имеет skipDataCollection=true, пропускаем сохранение")
    
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
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="Девушки"))
    builder.add(KeyboardButton(text="Парни"))
    builder.add(KeyboardButton(text="Все равно"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    
    # Устанавливаем waiting_for_input для целевого узла (collectUserInput=true)
    user_data[user_id]["waiting_for_input"] = {
        "type": "text",
        "modes": ['button', 'text'],
        "variable": "sex",
        "save_to_database": True,
        "node_id": "RFTgm4KzC6dI39AMTPcmo",
        "skip_buttons": []
    }
    logging.info(f"✅ Состояние ожидания настроено: type='text', modes=['button', 'text'] для переменной sex (узел RFTgm4KzC6dI39AMTPcmo)")
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "Девушки")
async def handle_reply_6bA3YPgWd20pCqPAeyuLe(message: types.Message):
    text = "Из какого ты города?"
    user_id = message.from_user.id
    skip_collection = False
    
    if not skip_collection and user_id in user_data and "waiting_for_input" in user_data[user_id]:
        waiting_config = user_data[user_id]["waiting_for_input"]
        modes = waiting_config.get("modes", [waiting_config.get("type", "text")]) if isinstance(waiting_config, dict) else []
        waiting_node_id = waiting_config.get("node_id", "") if isinstance(waiting_config, dict) else ""
        if isinstance(waiting_config, dict) and waiting_config.get("save_to_database") and ("button" in modes or waiting_config.get("type") == "button"):
            variable_name = waiting_config.get("variable", "button_response")
            button_text = "Девушки"
            logging.info(f"💾 Сохраняем ответ кнопки в переменную: {variable_name} = {button_text} (modes: {modes}, waiting_node: {waiting_node_id})")
            
            # Сохраняем в пользовательские данные
            user_data[user_id][variable_name] = button_text
            
            # Сохраняем в базу данных
            saved_to_db = await update_user_data_in_db(user_id, variable_name, button_text)
            if saved_to_db:
                logging.info(f"✅ Ответ кнопки сохранён в БД: {variable_name} = {button_text} (пользователь {user_id})")
            else:
                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            # Очищаем состояние ожидания после сохранения
            logging.info(f"🧹 Очищаем waiting_for_input после сохранения ответа кнопки")
            del user_data[user_id]["waiting_for_input"]
        elif isinstance(waiting_config, dict):
            logging.info(f"ℹ️ waiting_for_input активен, но button не в modes: {modes}, пропускаем сохранение")
    elif skip_collection:
        logging.info(f"⏭️ Кнопка имеет skipDataCollection=true, пропускаем сохранение")
    
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
    # Проверка условных сообщений для целевого узла
    conditional_parse_mode = None
    conditional_keyboard = None
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    user_data_dict = user_record if user_record else user_data.get(user_id, {})
    # Инициализируем базовые переменные пользователя если их нет
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Проверяем наличие message (для message handlers)
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user
        
        if user_obj:
            init_user_variables(user_id, user_obj)
    
    # Подставляем все доступные переменные пользователя в текст кнопок
    user_vars = await get_user_from_db(user_id)
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    
    # get_user_from_db теперь возвращает уже обработанные user_data
    if not isinstance(user_vars, dict):
        user_vars = {}
    
    # Заменяем все переменные в тексте
    import re
    def replace_variables_in_text(text_content, variables_dict):
        if not text_content or not variables_dict:
            return text_content
        
        for var_name, var_data in variables_dict.items():
            placeholder = "{" + var_name + "}"
            if placeholder in text_content:
                if isinstance(var_data, dict) and "value" in var_data:
                    var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                elif var_data is not None:
                    var_value = str(var_data)
                else:
                    var_value = var_name  # Показываем имя переменной если значения нет
                text_content = text_content.replace(placeholder, var_value)
        return text_content
    
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        # Дополнительная проверка: если переменная не найдена напрямую, проверяем, не является ли она частью user_data в другом формате
        # Это может случиться, если переменная была сохранена в формате, отличном от ожидаемого
        if "user_data" in user_data_dict and isinstance(user_data_dict["user_data"], dict):
            nested_data = user_data_dict["user_data"]
            if var_name in nested_data:
                raw_value = nested_data[var_name]
                if isinstance(raw_value, dict) and "value" in raw_value:
                    var_value = raw_value["value"]
                    # Проверяем, что значение действительно существует и не пустое
                    if var_value is not None and str(var_value).strip() != "":
                        return True, str(var_value)
                else:
                    # Проверяем, что значение действительно существует и не пустое
                    if raw_value is not None and str(raw_value).strip() != "":
                        return True, str(raw_value)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: city
    if (
        check_user_variable("city", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["city"] = check_user_variable("city", user_data_dict)
        # Условное сообщение пустое, используем основной текст узла (text уже инициализирован)
        conditional_parse_mode = None
        if "{city}" in text and variable_values["city"] is not None:
            text = text.replace("{city}", variable_values["city"])
        # Создаем reply клавиатуру для условного сообщения
        builder = ReplyKeyboardBuilder()
        builder.add(KeyboardButton(text=replace_variables_in_text("{city}", user_vars)))
        keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
        conditional_keyboard = keyboard
        # ВАЖНО: Логируем состояние условной клавиатуры для отладки
        logging.info(f"🎹 Условная клавиатура для user_data_exists: conditional_keyboard={'установлена' if conditional_keyboard else 'не установлена'}")
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "cond-city-1",
            "wait_for_input": True,
            "input_variable": "city",
            "next_node_id": "tS2XGL2Mn4LkE63SnxhPy",
            "source_type": "conditional_message",
            "skip_buttons": []
        }
        # Настраиваем ожидание ввода для условного сообщения с waitForTextInput
        if conditional_message_config and conditional_message_config.get("wait_for_input"):
            if user_id not in user_data:
                user_data[user_id] = {}
            user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config
            logging.info(f"Активировано ожидание условного ввода (переменная существует, но ждём новое значение): {conditional_message_config}")
            # ВАЖНО: Переменная существует, но waitForTextInput=true, поэтому НЕ делаем автопереход
            # Сбрасываем флаг условия чтобы fallback показал сообщение и дождался ввода
            # НО мы уже установили waiting_for_conditional_input, так что НЕ нужно делать break
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
    if "conditional_keyboard" not in locals():
        conditional_keyboard = None
    if "conditional_keyboard" in locals() and conditional_keyboard is not None:
        await message.answer(text, reply_markup=conditional_keyboard)
    else:
        await message.answer(text, reply_markup=ReplyKeyboardRemove())
    
    user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
    user_data[message.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "modes": ["text"],
        "variable": "city",
        "save_to_database": True,
        "node_id": "sIh3xXKEtb_TtrhHqZQzX",
        "next_node_id": "tS2XGL2Mn4LkE63SnxhPy",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной city (узел sIh3xXKEtb_TtrhHqZQzX)")

@dp.message(lambda message: message.text == "Парни")
async def handle_reply_hI7nsCdodrcUnft1SXYpg(message: types.Message):
    text = "Из какого ты города?"
    user_id = message.from_user.id
    skip_collection = False
    
    if not skip_collection and user_id in user_data and "waiting_for_input" in user_data[user_id]:
        waiting_config = user_data[user_id]["waiting_for_input"]
        modes = waiting_config.get("modes", [waiting_config.get("type", "text")]) if isinstance(waiting_config, dict) else []
        waiting_node_id = waiting_config.get("node_id", "") if isinstance(waiting_config, dict) else ""
        if isinstance(waiting_config, dict) and waiting_config.get("save_to_database") and ("button" in modes or waiting_config.get("type") == "button"):
            variable_name = waiting_config.get("variable", "button_response")
            button_text = "Парни"
            logging.info(f"💾 Сохраняем ответ кнопки в переменную: {variable_name} = {button_text} (modes: {modes}, waiting_node: {waiting_node_id})")
            
            # Сохраняем в пользовательские данные
            user_data[user_id][variable_name] = button_text
            
            # Сохраняем в базу данных
            saved_to_db = await update_user_data_in_db(user_id, variable_name, button_text)
            if saved_to_db:
                logging.info(f"✅ Ответ кнопки сохранён в БД: {variable_name} = {button_text} (пользователь {user_id})")
            else:
                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            # Очищаем состояние ожидания после сохранения
            logging.info(f"🧹 Очищаем waiting_for_input после сохранения ответа кнопки")
            del user_data[user_id]["waiting_for_input"]
        elif isinstance(waiting_config, dict):
            logging.info(f"ℹ️ waiting_for_input активен, но button не в modes: {modes}, пропускаем сохранение")
    elif skip_collection:
        logging.info(f"⏭️ Кнопка имеет skipDataCollection=true, пропускаем сохранение")
    
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
    # Проверка условных сообщений для целевого узла
    conditional_parse_mode = None
    conditional_keyboard = None
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    user_data_dict = user_record if user_record else user_data.get(user_id, {})
    # Инициализируем базовые переменные пользователя если их нет
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Проверяем наличие message (для message handlers)
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user
        
        if user_obj:
            init_user_variables(user_id, user_obj)
    
    # Подставляем все доступные переменные пользователя в текст кнопок
    user_vars = await get_user_from_db(user_id)
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    
    # get_user_from_db теперь возвращает уже обработанные user_data
    if not isinstance(user_vars, dict):
        user_vars = {}
    
    # Заменяем все переменные в тексте
    import re
    def replace_variables_in_text(text_content, variables_dict):
        if not text_content or not variables_dict:
            return text_content
        
        for var_name, var_data in variables_dict.items():
            placeholder = "{" + var_name + "}"
            if placeholder in text_content:
                if isinstance(var_data, dict) and "value" in var_data:
                    var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                elif var_data is not None:
                    var_value = str(var_data)
                else:
                    var_value = var_name  # Показываем имя переменной если значения нет
                text_content = text_content.replace(placeholder, var_value)
        return text_content
    
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        # Дополнительная проверка: если переменная не найдена напрямую, проверяем, не является ли она частью user_data в другом формате
        # Это может случиться, если переменная была сохранена в формате, отличном от ожидаемого
        if "user_data" in user_data_dict and isinstance(user_data_dict["user_data"], dict):
            nested_data = user_data_dict["user_data"]
            if var_name in nested_data:
                raw_value = nested_data[var_name]
                if isinstance(raw_value, dict) and "value" in raw_value:
                    var_value = raw_value["value"]
                    # Проверяем, что значение действительно существует и не пустое
                    if var_value is not None and str(var_value).strip() != "":
                        return True, str(var_value)
                else:
                    # Проверяем, что значение действительно существует и не пустое
                    if raw_value is not None and str(raw_value).strip() != "":
                        return True, str(raw_value)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: city
    if (
        check_user_variable("city", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["city"] = check_user_variable("city", user_data_dict)
        # Условное сообщение пустое, используем основной текст узла (text уже инициализирован)
        conditional_parse_mode = None
        if "{city}" in text and variable_values["city"] is not None:
            text = text.replace("{city}", variable_values["city"])
        # Создаем reply клавиатуру для условного сообщения
        builder = ReplyKeyboardBuilder()
        builder.add(KeyboardButton(text=replace_variables_in_text("{city}", user_vars)))
        keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
        conditional_keyboard = keyboard
        # ВАЖНО: Логируем состояние условной клавиатуры для отладки
        logging.info(f"🎹 Условная клавиатура для user_data_exists: conditional_keyboard={'установлена' if conditional_keyboard else 'не установлена'}")
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "cond-city-1",
            "wait_for_input": True,
            "input_variable": "city",
            "next_node_id": "tS2XGL2Mn4LkE63SnxhPy",
            "source_type": "conditional_message",
            "skip_buttons": []
        }
        # Настраиваем ожидание ввода для условного сообщения с waitForTextInput
        if conditional_message_config and conditional_message_config.get("wait_for_input"):
            if user_id not in user_data:
                user_data[user_id] = {}
            user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config
            logging.info(f"Активировано ожидание условного ввода (переменная существует, но ждём новое значение): {conditional_message_config}")
            # ВАЖНО: Переменная существует, но waitForTextInput=true, поэтому НЕ делаем автопереход
            # Сбрасываем флаг условия чтобы fallback показал сообщение и дождался ввода
            # НО мы уже установили waiting_for_conditional_input, так что НЕ нужно делать break
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
    if "conditional_keyboard" not in locals():
        conditional_keyboard = None
    if "conditional_keyboard" in locals() and conditional_keyboard is not None:
        await message.answer(text, reply_markup=conditional_keyboard)
    else:
        await message.answer(text, reply_markup=ReplyKeyboardRemove())
    
    user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
    user_data[message.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "modes": ["text"],
        "variable": "city",
        "save_to_database": True,
        "node_id": "sIh3xXKEtb_TtrhHqZQzX",
        "next_node_id": "tS2XGL2Mn4LkE63SnxhPy",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной city (узел sIh3xXKEtb_TtrhHqZQzX)")

@dp.message(lambda message: message.text == "Все равно")
async def handle_reply_VhOGaPeyFpFV9a7QDBfzo(message: types.Message):
    text = "Из какого ты города?"
    user_id = message.from_user.id
    skip_collection = False
    
    if not skip_collection and user_id in user_data and "waiting_for_input" in user_data[user_id]:
        waiting_config = user_data[user_id]["waiting_for_input"]
        modes = waiting_config.get("modes", [waiting_config.get("type", "text")]) if isinstance(waiting_config, dict) else []
        waiting_node_id = waiting_config.get("node_id", "") if isinstance(waiting_config, dict) else ""
        if isinstance(waiting_config, dict) and waiting_config.get("save_to_database") and ("button" in modes or waiting_config.get("type") == "button"):
            variable_name = waiting_config.get("variable", "button_response")
            button_text = "Все равно"
            logging.info(f"💾 Сохраняем ответ кнопки в переменную: {variable_name} = {button_text} (modes: {modes}, waiting_node: {waiting_node_id})")
            
            # Сохраняем в пользовательские данные
            user_data[user_id][variable_name] = button_text
            
            # Сохраняем в базу данных
            saved_to_db = await update_user_data_in_db(user_id, variable_name, button_text)
            if saved_to_db:
                logging.info(f"✅ Ответ кнопки сохранён в БД: {variable_name} = {button_text} (пользователь {user_id})")
            else:
                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            # Очищаем состояние ожидания после сохранения
            logging.info(f"🧹 Очищаем waiting_for_input после сохранения ответа кнопки")
            del user_data[user_id]["waiting_for_input"]
        elif isinstance(waiting_config, dict):
            logging.info(f"ℹ️ waiting_for_input активен, но button не в modes: {modes}, пропускаем сохранение")
    elif skip_collection:
        logging.info(f"⏭️ Кнопка имеет skipDataCollection=true, пропускаем сохранение")
    
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
    # Проверка условных сообщений для целевого узла
    conditional_parse_mode = None
    conditional_keyboard = None
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    user_data_dict = user_record if user_record else user_data.get(user_id, {})
    # Инициализируем базовые переменные пользователя если их нет
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Проверяем наличие message (для message handlers)
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user
        
        if user_obj:
            init_user_variables(user_id, user_obj)
    
    # Подставляем все доступные переменные пользователя в текст кнопок
    user_vars = await get_user_from_db(user_id)
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    
    # get_user_from_db теперь возвращает уже обработанные user_data
    if not isinstance(user_vars, dict):
        user_vars = {}
    
    # Заменяем все переменные в тексте
    import re
    def replace_variables_in_text(text_content, variables_dict):
        if not text_content or not variables_dict:
            return text_content
        
        for var_name, var_data in variables_dict.items():
            placeholder = "{" + var_name + "}"
            if placeholder in text_content:
                if isinstance(var_data, dict) and "value" in var_data:
                    var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                elif var_data is not None:
                    var_value = str(var_data)
                else:
                    var_value = var_name  # Показываем имя переменной если значения нет
                text_content = text_content.replace(placeholder, var_value)
        return text_content
    
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        # Дополнительная проверка: если переменная не найдена напрямую, проверяем, не является ли она частью user_data в другом формате
        # Это может случиться, если переменная была сохранена в формате, отличном от ожидаемого
        if "user_data" in user_data_dict and isinstance(user_data_dict["user_data"], dict):
            nested_data = user_data_dict["user_data"]
            if var_name in nested_data:
                raw_value = nested_data[var_name]
                if isinstance(raw_value, dict) and "value" in raw_value:
                    var_value = raw_value["value"]
                    # Проверяем, что значение действительно существует и не пустое
                    if var_value is not None and str(var_value).strip() != "":
                        return True, str(var_value)
                else:
                    # Проверяем, что значение действительно существует и не пустое
                    if raw_value is not None and str(raw_value).strip() != "":
                        return True, str(raw_value)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: city
    if (
        check_user_variable("city", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["city"] = check_user_variable("city", user_data_dict)
        # Условное сообщение пустое, используем основной текст узла (text уже инициализирован)
        conditional_parse_mode = None
        if "{city}" in text and variable_values["city"] is not None:
            text = text.replace("{city}", variable_values["city"])
        # Создаем reply клавиатуру для условного сообщения
        builder = ReplyKeyboardBuilder()
        builder.add(KeyboardButton(text=replace_variables_in_text("{city}", user_vars)))
        keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
        conditional_keyboard = keyboard
        # ВАЖНО: Логируем состояние условной клавиатуры для отладки
        logging.info(f"🎹 Условная клавиатура для user_data_exists: conditional_keyboard={'установлена' if conditional_keyboard else 'не установлена'}")
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "cond-city-1",
            "wait_for_input": True,
            "input_variable": "city",
            "next_node_id": "tS2XGL2Mn4LkE63SnxhPy",
            "source_type": "conditional_message",
            "skip_buttons": []
        }
        # Настраиваем ожидание ввода для условного сообщения с waitForTextInput
        if conditional_message_config and conditional_message_config.get("wait_for_input"):
            if user_id not in user_data:
                user_data[user_id] = {}
            user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config
            logging.info(f"Активировано ожидание условного ввода (переменная существует, но ждём новое значение): {conditional_message_config}")
            # ВАЖНО: Переменная существует, но waitForTextInput=true, поэтому НЕ делаем автопереход
            # Сбрасываем флаг условия чтобы fallback показал сообщение и дождался ввода
            # НО мы уже установили waiting_for_conditional_input, так что НЕ нужно делать break
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
    if "conditional_keyboard" not in locals():
        conditional_keyboard = None
    if "conditional_keyboard" in locals() and conditional_keyboard is not None:
        await message.answer(text, reply_markup=conditional_keyboard)
    else:
        await message.answer(text, reply_markup=ReplyKeyboardRemove())
    
    user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
    user_data[message.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "modes": ["text"],
        "variable": "city",
        "save_to_database": True,
        "node_id": "sIh3xXKEtb_TtrhHqZQzX",
        "next_node_id": "tS2XGL2Mn4LkE63SnxhPy",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной city (узел sIh3xXKEtb_TtrhHqZQzX)")

@dp.message(lambda message: message.text == "Пропустить")
async def handle_reply_g9KWWguVciHEUMMeyZ_WN(message: types.Message):
    text = "Теперь пришли фото или запиши видео 👍 (до 15 сек), его будут видеть другие пользователи"
    user_id = message.from_user.id
    skip_collection = True
    
    if not skip_collection and user_id in user_data and "waiting_for_input" in user_data[user_id]:
        waiting_config = user_data[user_id]["waiting_for_input"]
        modes = waiting_config.get("modes", [waiting_config.get("type", "text")]) if isinstance(waiting_config, dict) else []
        waiting_node_id = waiting_config.get("node_id", "") if isinstance(waiting_config, dict) else ""
        if isinstance(waiting_config, dict) and waiting_config.get("save_to_database") and ("button" in modes or waiting_config.get("type") == "button"):
            variable_name = waiting_config.get("variable", "button_response")
            button_text = "Пропустить"
            logging.info(f"💾 Сохраняем ответ кнопки в переменную: {variable_name} = {button_text} (modes: {modes}, waiting_node: {waiting_node_id})")
            
            # Сохраняем в пользовательские данные
            user_data[user_id][variable_name] = button_text
            
            # Сохраняем в базу данных
            saved_to_db = await update_user_data_in_db(user_id, variable_name, button_text)
            if saved_to_db:
                logging.info(f"✅ Ответ кнопки сохранён в БД: {variable_name} = {button_text} (пользователь {user_id})")
            else:
                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            # Очищаем состояние ожидания после сохранения
            logging.info(f"🧹 Очищаем waiting_for_input после сохранения ответа кнопки")
            del user_data[user_id]["waiting_for_input"]
        elif isinstance(waiting_config, dict):
            logging.info(f"ℹ️ waiting_for_input активен, но button не в modes: {modes}, пропускаем сохранение")
    elif skip_collection:
        logging.info(f"⏭️ Кнопка имеет skipDataCollection=true, пропускаем сохранение")
    
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
    # Проверка условных сообщений для целевого узла
    conditional_parse_mode = None
    conditional_keyboard = None
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    user_data_dict = user_record if user_record else user_data.get(user_id, {})
    # Инициализируем базовые переменные пользователя если их нет
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Проверяем наличие message (для message handlers)
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user
        
        if user_obj:
            init_user_variables(user_id, user_obj)
    
    # Подставляем все доступные переменные пользователя в текст кнопок
    user_vars = await get_user_from_db(user_id)
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    
    # get_user_from_db теперь возвращает уже обработанные user_data
    if not isinstance(user_vars, dict):
        user_vars = {}
    
    # Заменяем все переменные в тексте
    import re
    def replace_variables_in_text(text_content, variables_dict):
        if not text_content or not variables_dict:
            return text_content
        
        for var_name, var_data in variables_dict.items():
            placeholder = "{" + var_name + "}"
            if placeholder in text_content:
                if isinstance(var_data, dict) and "value" in var_data:
                    var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                elif var_data is not None:
                    var_value = str(var_data)
                else:
                    var_value = var_name  # Показываем имя переменной если значения нет
                text_content = text_content.replace(placeholder, var_value)
        return text_content
    
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        # Дополнительная проверка: если переменная не найдена напрямую, проверяем, не является ли она частью user_data в другом формате
        # Это может случиться, если переменная была сохранена в формате, отличном от ожидаемого
        if "user_data" in user_data_dict and isinstance(user_data_dict["user_data"], dict):
            nested_data = user_data_dict["user_data"]
            if var_name in nested_data:
                raw_value = nested_data[var_name]
                if isinstance(raw_value, dict) and "value" in raw_value:
                    var_value = raw_value["value"]
                    # Проверяем, что значение действительно существует и не пустое
                    if var_value is not None and str(var_value).strip() != "":
                        return True, str(var_value)
                else:
                    # Проверяем, что значение действительно существует и не пустое
                    if raw_value is not None and str(raw_value).strip() != "":
                        return True, str(raw_value)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: photo
    if (
        check_user_variable("photo", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["photo"] = check_user_variable("photo", user_data_dict)
        # Условное сообщение пустое, используем основной текст узла (text уже инициализирован)
        conditional_parse_mode = None
        if "{photo}" in text and variable_values["photo"] is not None:
            text = text.replace("{photo}", variable_values["photo"])
        # Создаем reply клавиатуру для условного сообщения
        builder = ReplyKeyboardBuilder()
        builder.add(KeyboardButton(text="Оставить текущее"))
        keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
        conditional_keyboard = keyboard
        # ВАЖНО: Логируем состояние условной клавиатуры для отладки
        logging.info(f"🎹 Условная клавиатура для user_data_exists: conditional_keyboard={'установлена' if conditional_keyboard else 'не установлена'}")
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "cond-photo-1",
            "wait_for_input": False,
            "input_variable": "photo",
            "next_node_id": "",
            "source_type": "conditional_message",
            "skip_buttons": [{"text":"Оставить текущее","target":"vxPv7G4n0QGyhnv4ucOM5"}]
        }
        # Настраиваем ожидание ввода для условного сообщения с waitForTextInput
        # Сохраняем skip_buttons для проверки в текстовом обработчике (для медиа-узлов)
        if user_id not in user_data:
            user_data[user_id] = {}
        user_data[user_id]["pending_skip_buttons"] = [{"text":"Оставить текущее","target":"vxPv7G4n0QGyhnv4ucOM5"}]
        logging.info(f"📌 Сохранены pending_skip_buttons для медиа-узла: {user_data[user_id]['pending_skip_buttons']}")
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
    if "conditional_keyboard" not in locals():
        conditional_keyboard = None
    if "conditional_keyboard" in locals() and conditional_keyboard is not None:
        await message.answer(text, reply_markup=conditional_keyboard)
    else:
        await message.answer(text, reply_markup=ReplyKeyboardRemove())
    
    user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
    user_data[message.from_user.id]["waiting_for_input"] = {
        "type": "photo",
        "modes": ["photo"],
        "variable": "photo",
        "save_to_database": True,
        "node_id": "Y9zLRp1BLpVhm-HcsNkJV",
        "next_node_id": "vxPv7G4n0QGyhnv4ucOM5",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['photo'] для переменной photo (узел Y9zLRp1BLpVhm-HcsNkJV)")

@dp.message(lambda message: message.text == "Да")
async def handle_reply_Y6DFar0NH2ejdlKLTFgwC(message: types.Message):
    text = """1. Смотреть анкеты.
2. Заполнить анкету заново.
3. Изменить фото/видео.
4. Изменить текст анкеты."""
    user_id = message.from_user.id
    skip_collection = False
    
    if not skip_collection and user_id in user_data and "waiting_for_input" in user_data[user_id]:
        waiting_config = user_data[user_id]["waiting_for_input"]
        modes = waiting_config.get("modes", [waiting_config.get("type", "text")]) if isinstance(waiting_config, dict) else []
        waiting_node_id = waiting_config.get("node_id", "") if isinstance(waiting_config, dict) else ""
        if isinstance(waiting_config, dict) and waiting_config.get("save_to_database") and ("button" in modes or waiting_config.get("type") == "button"):
            variable_name = waiting_config.get("variable", "button_response")
            button_text = "Да"
            logging.info(f"💾 Сохраняем ответ кнопки в переменную: {variable_name} = {button_text} (modes: {modes}, waiting_node: {waiting_node_id})")
            
            # Сохраняем в пользовательские данные
            user_data[user_id][variable_name] = button_text
            
            # Сохраняем в базу данных
            saved_to_db = await update_user_data_in_db(user_id, variable_name, button_text)
            if saved_to_db:
                logging.info(f"✅ Ответ кнопки сохранён в БД: {variable_name} = {button_text} (пользователь {user_id})")
            else:
                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            # Очищаем состояние ожидания после сохранения
            logging.info(f"🧹 Очищаем waiting_for_input после сохранения ответа кнопки")
            del user_data[user_id]["waiting_for_input"]
        elif isinstance(waiting_config, dict):
            logging.info(f"ℹ️ waiting_for_input активен, но button не в modes: {modes}, пропускаем сохранение")
    elif skip_collection:
        logging.info(f"⏭️ Кнопка имеет skipDataCollection=true, пропускаем сохранение")
    
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
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="1"))
    builder.add(KeyboardButton(text="2"))
    builder.add(KeyboardButton(text="3"))
    builder.add(KeyboardButton(text="4"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    
    # Узел yrsc8v81qQa5oQx538Dzn имеет collectUserInput=false - НЕ устанавливаем waiting_for_input
    logging.info(f"ℹ️ Узел yrsc8v81qQa5oQx538Dzn не собирает ответы (collectUserInput=false)")
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "Изменить анкету")
async def handle_reply_e1ZTOjUMpLqjln0LWH3JD(message: types.Message):
    text = "Сколько тебе лет?"
    user_id = message.from_user.id
    skip_collection = False
    
    if not skip_collection and user_id in user_data and "waiting_for_input" in user_data[user_id]:
        waiting_config = user_data[user_id]["waiting_for_input"]
        modes = waiting_config.get("modes", [waiting_config.get("type", "text")]) if isinstance(waiting_config, dict) else []
        waiting_node_id = waiting_config.get("node_id", "") if isinstance(waiting_config, dict) else ""
        if isinstance(waiting_config, dict) and waiting_config.get("save_to_database") and ("button" in modes or waiting_config.get("type") == "button"):
            variable_name = waiting_config.get("variable", "button_response")
            button_text = "Изменить анкету"
            logging.info(f"💾 Сохраняем ответ кнопки в переменную: {variable_name} = {button_text} (modes: {modes}, waiting_node: {waiting_node_id})")
            
            # Сохраняем в пользовательские данные
            user_data[user_id][variable_name] = button_text
            
            # Сохраняем в базу данных
            saved_to_db = await update_user_data_in_db(user_id, variable_name, button_text)
            if saved_to_db:
                logging.info(f"✅ Ответ кнопки сохранён в БД: {variable_name} = {button_text} (пользователь {user_id})")
            else:
                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            # Очищаем состояние ожидания после сохранения
            logging.info(f"🧹 Очищаем waiting_for_input после сохранения ответа кнопки")
            del user_data[user_id]["waiting_for_input"]
        elif isinstance(waiting_config, dict):
            logging.info(f"ℹ️ waiting_for_input активен, но button не в modes: {modes}, пропускаем сохранение")
    elif skip_collection:
        logging.info(f"⏭️ Кнопка имеет skipDataCollection=true, пропускаем сохранение")
    
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
    # Проверка условных сообщений для целевого узла
    conditional_parse_mode = None
    conditional_keyboard = None
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    user_data_dict = user_record if user_record else user_data.get(user_id, {})
    # Инициализируем базовые переменные пользователя если их нет
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Проверяем наличие message (для message handlers)
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user
        
        if user_obj:
            init_user_variables(user_id, user_obj)
    
    # Подставляем все доступные переменные пользователя в текст кнопок
    user_vars = await get_user_from_db(user_id)
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    
    # get_user_from_db теперь возвращает уже обработанные user_data
    if not isinstance(user_vars, dict):
        user_vars = {}
    
    # Заменяем все переменные в тексте
    import re
    def replace_variables_in_text(text_content, variables_dict):
        if not text_content or not variables_dict:
            return text_content
        
        for var_name, var_data in variables_dict.items():
            placeholder = "{" + var_name + "}"
            if placeholder in text_content:
                if isinstance(var_data, dict) and "value" in var_data:
                    var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                elif var_data is not None:
                    var_value = str(var_data)
                else:
                    var_value = var_name  # Показываем имя переменной если значения нет
                text_content = text_content.replace(placeholder, var_value)
        return text_content
    
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        # Дополнительная проверка: если переменная не найдена напрямую, проверяем, не является ли она частью user_data в другом формате
        # Это может случиться, если переменная была сохранена в формате, отличном от ожидаемого
        if "user_data" in user_data_dict and isinstance(user_data_dict["user_data"], dict):
            nested_data = user_data_dict["user_data"]
            if var_name in nested_data:
                raw_value = nested_data[var_name]
                if isinstance(raw_value, dict) and "value" in raw_value:
                    var_value = raw_value["value"]
                    # Проверяем, что значение действительно существует и не пустое
                    if var_value is not None and str(var_value).strip() != "":
                        return True, str(var_value)
                else:
                    # Проверяем, что значение действительно существует и не пустое
                    if raw_value is not None and str(raw_value).strip() != "":
                        return True, str(raw_value)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: age
    if (
        check_user_variable("age", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["age"] = check_user_variable("age", user_data_dict)
        # Условное сообщение пустое, используем основной текст узла (text уже инициализирован)
        conditional_parse_mode = None
        if "{age}" in text and variable_values["age"] is not None:
            text = text.replace("{age}", variable_values["age"])
        # Создаем reply клавиатуру для условного сообщения
        builder = ReplyKeyboardBuilder()
        builder.add(KeyboardButton(text=replace_variables_in_text("{age}", user_vars)))
        keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
        conditional_keyboard = keyboard
        # ВАЖНО: Логируем состояние условной клавиатуры для отладки
        logging.info(f"🎹 Условная клавиатура для user_data_exists: conditional_keyboard={'установлена' if conditional_keyboard else 'не установлена'}")
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "condition-1763692642023",
            "wait_for_input": True,
            "input_variable": "age",
            "next_node_id": "f90r9k3FSLu2Tjn74cBn_",
            "source_type": "conditional_message",
            "skip_buttons": []
        }
        # Настраиваем ожидание ввода для условного сообщения с waitForTextInput
        if conditional_message_config and conditional_message_config.get("wait_for_input"):
            if user_id not in user_data:
                user_data[user_id] = {}
            user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config
            logging.info(f"Активировано ожидание условного ввода (переменная существует, но ждём новое значение): {conditional_message_config}")
            # ВАЖНО: Переменная существует, но waitForTextInput=true, поэтому НЕ делаем автопереход
            # Сбрасываем флаг условия чтобы fallback показал сообщение и дождался ввода
            # НО мы уже установили waiting_for_conditional_input, так что НЕ нужно делать break
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
    if "conditional_keyboard" not in locals():
        conditional_keyboard = None
    if "conditional_keyboard" in locals() and conditional_keyboard is not None:
        await message.answer(text, reply_markup=conditional_keyboard)
    else:
        await message.answer(text, reply_markup=ReplyKeyboardRemove())
    
    user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
    user_data[message.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "modes": ["text"],
        "variable": "age",
        "save_to_database": True,
        "node_id": "start",
        "next_node_id": "f90r9k3FSLu2Tjn74cBn_",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной age (узел start)")

@dp.message(lambda message: message.text == "2")
async def handle_reply_YqVio9545knVkcQWVLbgT(message: types.Message):
    text = "Сколько тебе лет?"
    user_id = message.from_user.id
    skip_collection = False
    
    if not skip_collection and user_id in user_data and "waiting_for_input" in user_data[user_id]:
        waiting_config = user_data[user_id]["waiting_for_input"]
        modes = waiting_config.get("modes", [waiting_config.get("type", "text")]) if isinstance(waiting_config, dict) else []
        waiting_node_id = waiting_config.get("node_id", "") if isinstance(waiting_config, dict) else ""
        if isinstance(waiting_config, dict) and waiting_config.get("save_to_database") and ("button" in modes or waiting_config.get("type") == "button"):
            variable_name = waiting_config.get("variable", "button_response")
            button_text = "2"
            logging.info(f"💾 Сохраняем ответ кнопки в переменную: {variable_name} = {button_text} (modes: {modes}, waiting_node: {waiting_node_id})")
            
            # Сохраняем в пользовательские данные
            user_data[user_id][variable_name] = button_text
            
            # Сохраняем в базу данных
            saved_to_db = await update_user_data_in_db(user_id, variable_name, button_text)
            if saved_to_db:
                logging.info(f"✅ Ответ кнопки сохранён в БД: {variable_name} = {button_text} (пользователь {user_id})")
            else:
                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            # Очищаем состояние ожидания после сохранения
            logging.info(f"🧹 Очищаем waiting_for_input после сохранения ответа кнопки")
            del user_data[user_id]["waiting_for_input"]
        elif isinstance(waiting_config, dict):
            logging.info(f"ℹ️ waiting_for_input активен, но button не в modes: {modes}, пропускаем сохранение")
    elif skip_collection:
        logging.info(f"⏭️ Кнопка имеет skipDataCollection=true, пропускаем сохранение")
    
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
    # Проверка условных сообщений для целевого узла
    conditional_parse_mode = None
    conditional_keyboard = None
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    user_data_dict = user_record if user_record else user_data.get(user_id, {})
    # Инициализируем базовые переменные пользователя если их нет
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Проверяем наличие message (для message handlers)
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user
        
        if user_obj:
            init_user_variables(user_id, user_obj)
    
    # Подставляем все доступные переменные пользователя в текст кнопок
    user_vars = await get_user_from_db(user_id)
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    
    # get_user_from_db теперь возвращает уже обработанные user_data
    if not isinstance(user_vars, dict):
        user_vars = {}
    
    # Заменяем все переменные в тексте
    import re
    def replace_variables_in_text(text_content, variables_dict):
        if not text_content or not variables_dict:
            return text_content
        
        for var_name, var_data in variables_dict.items():
            placeholder = "{" + var_name + "}"
            if placeholder in text_content:
                if isinstance(var_data, dict) and "value" in var_data:
                    var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                elif var_data is not None:
                    var_value = str(var_data)
                else:
                    var_value = var_name  # Показываем имя переменной если значения нет
                text_content = text_content.replace(placeholder, var_value)
        return text_content
    
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        # Дополнительная проверка: если переменная не найдена напрямую, проверяем, не является ли она частью user_data в другом формате
        # Это может случиться, если переменная была сохранена в формате, отличном от ожидаемого
        if "user_data" in user_data_dict and isinstance(user_data_dict["user_data"], dict):
            nested_data = user_data_dict["user_data"]
            if var_name in nested_data:
                raw_value = nested_data[var_name]
                if isinstance(raw_value, dict) and "value" in raw_value:
                    var_value = raw_value["value"]
                    # Проверяем, что значение действительно существует и не пустое
                    if var_value is not None and str(var_value).strip() != "":
                        return True, str(var_value)
                else:
                    # Проверяем, что значение действительно существует и не пустое
                    if raw_value is not None and str(raw_value).strip() != "":
                        return True, str(raw_value)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: age
    if (
        check_user_variable("age", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["age"] = check_user_variable("age", user_data_dict)
        # Условное сообщение пустое, используем основной текст узла (text уже инициализирован)
        conditional_parse_mode = None
        if "{age}" in text and variable_values["age"] is not None:
            text = text.replace("{age}", variable_values["age"])
        # Создаем reply клавиатуру для условного сообщения
        builder = ReplyKeyboardBuilder()
        builder.add(KeyboardButton(text=replace_variables_in_text("{age}", user_vars)))
        keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
        conditional_keyboard = keyboard
        # ВАЖНО: Логируем состояние условной клавиатуры для отладки
        logging.info(f"🎹 Условная клавиатура для user_data_exists: conditional_keyboard={'установлена' if conditional_keyboard else 'не установлена'}")
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "condition-1763692642023",
            "wait_for_input": True,
            "input_variable": "age",
            "next_node_id": "f90r9k3FSLu2Tjn74cBn_",
            "source_type": "conditional_message",
            "skip_buttons": []
        }
        # Настраиваем ожидание ввода для условного сообщения с waitForTextInput
        if conditional_message_config and conditional_message_config.get("wait_for_input"):
            if user_id not in user_data:
                user_data[user_id] = {}
            user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config
            logging.info(f"Активировано ожидание условного ввода (переменная существует, но ждём новое значение): {conditional_message_config}")
            # ВАЖНО: Переменная существует, но waitForTextInput=true, поэтому НЕ делаем автопереход
            # Сбрасываем флаг условия чтобы fallback показал сообщение и дождался ввода
            # НО мы уже установили waiting_for_conditional_input, так что НЕ нужно делать break
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
    if "conditional_keyboard" not in locals():
        conditional_keyboard = None
    if "conditional_keyboard" in locals() and conditional_keyboard is not None:
        await message.answer(text, reply_markup=conditional_keyboard)
    else:
        await message.answer(text, reply_markup=ReplyKeyboardRemove())
    
    user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
    user_data[message.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "modes": ["text"],
        "variable": "age",
        "save_to_database": True,
        "node_id": "start",
        "next_node_id": "f90r9k3FSLu2Tjn74cBn_",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной age (узел start)")

@dp.message(lambda message: message.text == "3")
async def handle_reply_vMzKMEg84JLzu6EEnrQ5W(message: types.Message):
    text = "Теперь пришли фото или запиши видео 👍 (до 15 сек), его будут видеть другие пользователи"
    user_id = message.from_user.id
    skip_collection = False
    
    if not skip_collection and user_id in user_data and "waiting_for_input" in user_data[user_id]:
        waiting_config = user_data[user_id]["waiting_for_input"]
        modes = waiting_config.get("modes", [waiting_config.get("type", "text")]) if isinstance(waiting_config, dict) else []
        waiting_node_id = waiting_config.get("node_id", "") if isinstance(waiting_config, dict) else ""
        if isinstance(waiting_config, dict) and waiting_config.get("save_to_database") and ("button" in modes or waiting_config.get("type") == "button"):
            variable_name = waiting_config.get("variable", "button_response")
            button_text = "3"
            logging.info(f"💾 Сохраняем ответ кнопки в переменную: {variable_name} = {button_text} (modes: {modes}, waiting_node: {waiting_node_id})")
            
            # Сохраняем в пользовательские данные
            user_data[user_id][variable_name] = button_text
            
            # Сохраняем в базу данных
            saved_to_db = await update_user_data_in_db(user_id, variable_name, button_text)
            if saved_to_db:
                logging.info(f"✅ Ответ кнопки сохранён в БД: {variable_name} = {button_text} (пользователь {user_id})")
            else:
                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            # Очищаем состояние ожидания после сохранения
            logging.info(f"🧹 Очищаем waiting_for_input после сохранения ответа кнопки")
            del user_data[user_id]["waiting_for_input"]
        elif isinstance(waiting_config, dict):
            logging.info(f"ℹ️ waiting_for_input активен, но button не в modes: {modes}, пропускаем сохранение")
    elif skip_collection:
        logging.info(f"⏭️ Кнопка имеет skipDataCollection=true, пропускаем сохранение")
    
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
    # Проверка условных сообщений для целевого узла
    conditional_parse_mode = None
    conditional_keyboard = None
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    user_data_dict = user_record if user_record else user_data.get(user_id, {})
    # Инициализируем базовые переменные пользователя если их нет
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Проверяем наличие message (для message handlers)
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user
        
        if user_obj:
            init_user_variables(user_id, user_obj)
    
    # Подставляем все доступные переменные пользователя в текст кнопок
    user_vars = await get_user_from_db(user_id)
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    
    # get_user_from_db теперь возвращает уже обработанные user_data
    if not isinstance(user_vars, dict):
        user_vars = {}
    
    # Заменяем все переменные в тексте
    import re
    def replace_variables_in_text(text_content, variables_dict):
        if not text_content or not variables_dict:
            return text_content
        
        for var_name, var_data in variables_dict.items():
            placeholder = "{" + var_name + "}"
            if placeholder in text_content:
                if isinstance(var_data, dict) and "value" in var_data:
                    var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                elif var_data is not None:
                    var_value = str(var_data)
                else:
                    var_value = var_name  # Показываем имя переменной если значения нет
                text_content = text_content.replace(placeholder, var_value)
        return text_content
    
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        # Дополнительная проверка: если переменная не найдена напрямую, проверяем, не является ли она частью user_data в другом формате
        # Это может случиться, если переменная была сохранена в формате, отличном от ожидаемого
        if "user_data" in user_data_dict and isinstance(user_data_dict["user_data"], dict):
            nested_data = user_data_dict["user_data"]
            if var_name in nested_data:
                raw_value = nested_data[var_name]
                if isinstance(raw_value, dict) and "value" in raw_value:
                    var_value = raw_value["value"]
                    # Проверяем, что значение действительно существует и не пустое
                    if var_value is not None and str(var_value).strip() != "":
                        return True, str(var_value)
                else:
                    # Проверяем, что значение действительно существует и не пустое
                    if raw_value is not None and str(raw_value).strip() != "":
                        return True, str(raw_value)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: photo
    if (
        check_user_variable("photo", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["photo"] = check_user_variable("photo", user_data_dict)
        # Условное сообщение пустое, используем основной текст узла (text уже инициализирован)
        conditional_parse_mode = None
        if "{photo}" in text and variable_values["photo"] is not None:
            text = text.replace("{photo}", variable_values["photo"])
        # Создаем reply клавиатуру для условного сообщения
        builder = ReplyKeyboardBuilder()
        builder.add(KeyboardButton(text="Оставить текущее"))
        keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
        conditional_keyboard = keyboard
        # ВАЖНО: Логируем состояние условной клавиатуры для отладки
        logging.info(f"🎹 Условная клавиатура для user_data_exists: conditional_keyboard={'установлена' if conditional_keyboard else 'не установлена'}")
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "cond-photo-1",
            "wait_for_input": False,
            "input_variable": "photo",
            "next_node_id": "",
            "source_type": "conditional_message",
            "skip_buttons": [{"text":"Оставить текущее","target":"vxPv7G4n0QGyhnv4ucOM5"}]
        }
        # Настраиваем ожидание ввода для условного сообщения с waitForTextInput
        # Сохраняем skip_buttons для проверки в текстовом обработчике (для медиа-узлов)
        if user_id not in user_data:
            user_data[user_id] = {}
        user_data[user_id]["pending_skip_buttons"] = [{"text":"Оставить текущее","target":"vxPv7G4n0QGyhnv4ucOM5"}]
        logging.info(f"📌 Сохранены pending_skip_buttons для медиа-узла: {user_data[user_id]['pending_skip_buttons']}")
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
    if "conditional_keyboard" not in locals():
        conditional_keyboard = None
    if "conditional_keyboard" in locals() and conditional_keyboard is not None:
        await message.answer(text, reply_markup=conditional_keyboard)
    else:
        await message.answer(text, reply_markup=ReplyKeyboardRemove())
    
    user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
    user_data[message.from_user.id]["waiting_for_input"] = {
        "type": "photo",
        "modes": ["photo"],
        "variable": "photo",
        "save_to_database": True,
        "node_id": "Y9zLRp1BLpVhm-HcsNkJV",
        "next_node_id": "vxPv7G4n0QGyhnv4ucOM5",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['photo'] для переменной photo (узел Y9zLRp1BLpVhm-HcsNkJV)")

@dp.message(lambda message: message.text == "4")
async def handle_reply_En0QBjOLWkcEpIGLqy6EQ(message: types.Message):
    text = "Расскажи о себе и кого хочешь найти, чем предлагаешь заняться. Это поможет лучше подобрать тебе компанию."
    user_id = message.from_user.id
    skip_collection = False
    
    if not skip_collection and user_id in user_data and "waiting_for_input" in user_data[user_id]:
        waiting_config = user_data[user_id]["waiting_for_input"]
        modes = waiting_config.get("modes", [waiting_config.get("type", "text")]) if isinstance(waiting_config, dict) else []
        waiting_node_id = waiting_config.get("node_id", "") if isinstance(waiting_config, dict) else ""
        if isinstance(waiting_config, dict) and waiting_config.get("save_to_database") and ("button" in modes or waiting_config.get("type") == "button"):
            variable_name = waiting_config.get("variable", "button_response")
            button_text = "4"
            logging.info(f"💾 Сохраняем ответ кнопки в переменную: {variable_name} = {button_text} (modes: {modes}, waiting_node: {waiting_node_id})")
            
            # Сохраняем в пользовательские данные
            user_data[user_id][variable_name] = button_text
            
            # Сохраняем в базу данных
            saved_to_db = await update_user_data_in_db(user_id, variable_name, button_text)
            if saved_to_db:
                logging.info(f"✅ Ответ кнопки сохранён в БД: {variable_name} = {button_text} (пользователь {user_id})")
            else:
                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            # Очищаем состояние ожидания после сохранения
            logging.info(f"🧹 Очищаем waiting_for_input после сохранения ответа кнопки")
            del user_data[user_id]["waiting_for_input"]
        elif isinstance(waiting_config, dict):
            logging.info(f"ℹ️ waiting_for_input активен, но button не в modes: {modes}, пропускаем сохранение")
    elif skip_collection:
        logging.info(f"⏭️ Кнопка имеет skipDataCollection=true, пропускаем сохранение")
    
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
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="Пропустить"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    
    # Устанавливаем waiting_for_input для целевого узла (collectUserInput=true)
    user_data[user_id]["waiting_for_input"] = {
        "type": "text",
        "modes": ['button', 'text'],
        "variable": "info",
        "save_to_database": True,
        "node_id": "lBPy3gcGVLla0NGdSYb35",
        "skip_buttons": [{"text":"Пропустить","target":"Y9zLRp1BLpVhm-HcsNkJV"}]
    }
    logging.info(f"✅ Состояние ожидания настроено: type='text', modes=['button', 'text'] для переменной info (узел lBPy3gcGVLla0NGdSYb35)")
    await message.answer(text, reply_markup=keyboard)


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
                elif skip_button_target == "f90r9k3FSLu2Tjn74cBn_":
                    await handle_callback_f90r9k3FSLu2Tjn74cBn_(fake_callback)
                elif skip_button_target == "RFTgm4KzC6dI39AMTPcmo":
                    await handle_callback_RFTgm4KzC6dI39AMTPcmo(fake_callback)
                elif skip_button_target == "sIh3xXKEtb_TtrhHqZQzX":
                    await handle_callback_sIh3xXKEtb_TtrhHqZQzX(fake_callback)
                elif skip_button_target == "tS2XGL2Mn4LkE63SnxhPy":
                    await handle_callback_tS2XGL2Mn4LkE63SnxhPy(fake_callback)
                elif skip_button_target == "lBPy3gcGVLla0NGdSYb35":
                    await handle_callback_lBPy3gcGVLla0NGdSYb35(fake_callback)
                elif skip_button_target == "Y9zLRp1BLpVhm-HcsNkJV":
                    await handle_callback_Y9zLRp1BLpVhm_HcsNkJV(fake_callback)
                elif skip_button_target == "vxPv7G4n0QGyhnv4ucOM5":
                    await handle_callback_vxPv7G4n0QGyhnv4ucOM5(fake_callback)
                elif skip_button_target == "8xSJaWAJNz7Hz_54mjFTF":
                    await handle_callback_8xSJaWAJNz7Hz_54mjFTF(fake_callback)
                elif skip_button_target == "KE-8sR9elPEefApjXtBxC":
                    await handle_callback_KE_8sR9elPEefApjXtBxC(fake_callback)
                elif skip_button_target == "yrsc8v81qQa5oQx538Dzn":
                    await handle_callback_yrsc8v81qQa5oQx538Dzn(fake_callback)
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
                    await profile_handler(message)
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
                        # Узел с условными сообщениями - проверяем условия
                        logging.info(f"🔧 Условная навигация к узлу с условными сообщениями: start")
                        user_data_dict = await get_user_from_db(user_id) or {}
                        user_data_dict.update(user_data.get(user_id, {}))
                        # Функция для проверки переменных пользователя
                        def check_user_variable_inline(var_name, user_data_dict):
                            if "user_data" in user_data_dict and user_data_dict["user_data"]:
                                try:
                                    import json
                                    parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                                    if var_name in parsed_data:
                                        raw_value = parsed_data[var_name]
                                        if isinstance(raw_value, dict) and "value" in raw_value:
                                            var_value = raw_value["value"]
                                            if var_value is not None and str(var_value).strip() != "":
                                                return True, str(var_value)
                                        else:
                                            if raw_value is not None and str(raw_value).strip() != "":
                                                return True, str(raw_value)
                                except (json.JSONDecodeError, TypeError):
                                    pass
                            if var_name in user_data_dict:
                                variable_data = user_data_dict.get(var_name)
                                if isinstance(variable_data, dict) and "value" in variable_data:
                                    var_value = variable_data["value"]
                                    if var_value is not None and str(var_value).strip() != "":
                                        return True, str(var_value)
                                elif variable_data is not None and str(variable_data).strip() != "":
                                    return True, str(variable_data)
                            return False, None
                        
                        conditional_met = False
                        if (
                            check_user_variable_inline("age", user_data_dict)[0]
                        ):
                            conditional_met = True
                            text = """
"""
                            _, var_value_age = check_user_variable_inline("age", user_data_dict)
                            if "{age}" in text and var_value_age is not None:
                                text = text.replace("{age}", var_value_age)
                            conditional_met = True
                            logging.info(f"✅ Условие выполнено: переменная суяесявует")
                            # waitForTextInput=true: показываем сообщение и ждем ввода
                            # Генерируем клавиатуру с кнопками из условного сообщения
                            builder = ReplyKeyboardBuilder()
                            btn_text_b5XNyuzu__YIFk3yfUfpj = "{age}"
                            _, btn_var_value = check_user_variable_inline("age", user_data_dict)
                            if btn_var_value is not None:
                                btn_text_b5XNyuzu__YIFk3yfUfpj = btn_text_b5XNyuzu__YIFk3yfUfpj.replace("{age}", btn_var_value)
                            builder.add(KeyboardButton(text=btn_text_b5XNyuzu__YIFk3yfUfpj))
                            builder.adjust(1)
                            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
                            main_text = "Сколько тебе лет?"
                            await message.answer(main_text, reply_markup=keyboard)
                            user_data[user_id]["waiting_for_input"] = {
                                "type": "text",
                                "variable": "age",
                                "save_to_database": True,
                                "node_id": "start",
                                "next_node_id": "f90r9k3FSLu2Tjn74cBn_"
                            }
                            logging.info(f"✅ Показана условная клавиатура для узла start")
                        if not conditional_met:
                            # Условие не выполнено - показываем основнояя сообщение
                            text = "Сколько тебе лет?"
                            await message.answer(text)
                            user_data[user_id]["waiting_for_input"] = {
                                "type": "text",
                                "modes": ["text"],
                                "variable": "age",
                                "save_to_database": True,
                                "node_id": "start",
                                "next_node_id": "f90r9k3FSLu2Tjn74cBn_"
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной age (узел start)")
                    elif next_node_id == "f90r9k3FSLu2Tjn74cBn_":
                        # ИСПРАВЛЕНИЕ: У узла есть кнопки - показываем их И настраиваем ожидание для сохранения ответа
                        logging.info(f"✅ Показаны кнопки для узла f90r9k3FSLu2Tjn74cBn_ с collectUserInput=true")
                        text = "Теперь определимся с полом"
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
                        # Создаем reply клавиатуру
                        builder = ReplyKeyboardBuilder()
                        builder.add(KeyboardButton(text="Я девушка"))
                        builder.add(KeyboardButton(text="Я парень"))
                        keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
                        await message.answer(text, reply_markup=keyboard)
                        # Настраиваем ожидание ввода для сохранения ответа кнопки
                        user_data[user_id]["waiting_for_input"] = {
                            "type": "button",
                            "modes": ['button'],
                            "variable": "gender",
                            "save_to_database": True,
                            "node_id": "f90r9k3FSLu2Tjn74cBn_",
                            "next_node_id": "",
                            "skip_buttons": []
                        }
                        logging.info(f"✅ Сояяяятояние ожидания настроено: modes=['button'] для переменной gender (узел f90r9k3FSLu2Tjn74cBn_)")
                    elif next_node_id == "RFTgm4KzC6dI39AMTPcmo":
                        # ИСПРАВЛЕНИЕ: У узла есть кнопки - показываем их И настраиваем ожидание для сохранения ответа
                        logging.info(f"✅ Показаны кнопки для узла RFTgm4KzC6dI39AMTPcmo с collectUserInput=true")
                        text = "Кто тебе интересен?"
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
                        # Создаем reply клавиатуру
                        builder = ReplyKeyboardBuilder()
                        builder.add(KeyboardButton(text="Девушки"))
                        builder.add(KeyboardButton(text="Парни"))
                        builder.add(KeyboardButton(text="Все равно"))
                        keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
                        await message.answer(text, reply_markup=keyboard)
                        # Настраиваем ожидание ввода для сохранения ответа кнопки
                        user_data[user_id]["waiting_for_input"] = {
                            "type": "button",
                            "modes": ['button'],
                            "variable": "sex",
                            "save_to_database": True,
                            "node_id": "RFTgm4KzC6dI39AMTPcmo",
                            "next_node_id": "",
                            "skip_buttons": []
                        }
                        logging.info(f"✅ Сояяяятояние ожидания настроено: modes=['button'] для переменной sex (узел RFTgm4KzC6dI39AMTPcmo)")
                    elif next_node_id == "sIh3xXKEtb_TtrhHqZQzX":
                        # Узел с условными сообщениями - проверяем условия
                        logging.info(f"🔧 Условная навигация к узлу с условными сообщениями: sIh3xXKEtb_TtrhHqZQzX")
                        user_data_dict = await get_user_from_db(user_id) or {}
                        user_data_dict.update(user_data.get(user_id, {}))
                        # Функция для проверки переменных пользователя
                        def check_user_variable_inline(var_name, user_data_dict):
                            if "user_data" in user_data_dict and user_data_dict["user_data"]:
                                try:
                                    import json
                                    parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                                    if var_name in parsed_data:
                                        raw_value = parsed_data[var_name]
                                        if isinstance(raw_value, dict) and "value" in raw_value:
                                            var_value = raw_value["value"]
                                            if var_value is not None and str(var_value).strip() != "":
                                                return True, str(var_value)
                                        else:
                                            if raw_value is not None and str(raw_value).strip() != "":
                                                return True, str(raw_value)
                                except (json.JSONDecodeError, TypeError):
                                    pass
                            if var_name in user_data_dict:
                                variable_data = user_data_dict.get(var_name)
                                if isinstance(variable_data, dict) and "value" in variable_data:
                                    var_value = variable_data["value"]
                                    if var_value is not None and str(var_value).strip() != "":
                                        return True, str(var_value)
                                elif variable_data is not None and str(variable_data).strip() != "":
                                    return True, str(variable_data)
                            return False, None
                        
                        conditional_met = False
                        if (
                            check_user_variable_inline("city", user_data_dict)[0]
                        ):
                            conditional_met = True
                            text = """
"""
                            _, var_value_city = check_user_variable_inline("city", user_data_dict)
                            if "{city}" in text and var_value_city is not None:
                                text = text.replace("{city}", var_value_city)
                            conditional_met = True
                            logging.info(f"✅ Условие выполнено: переменная суяесявует")
                            # waitForTextInput=true: показываем сообщение и ждем ввода
                            # Генерируем клавиатуру с кнопками из условного сообщения
                            builder = ReplyKeyboardBuilder()
                            btn_text_btn_city_yes = "{city}"
                            _, btn_var_value = check_user_variable_inline("city", user_data_dict)
                            if btn_var_value is not None:
                                btn_text_btn_city_yes = btn_text_btn_city_yes.replace("{city}", btn_var_value)
                            builder.add(KeyboardButton(text=btn_text_btn_city_yes))
                            builder.adjust(1)
                            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
                            main_text = "Из какого ты города?"
                            await message.answer(main_text, reply_markup=keyboard)
                            user_data[user_id]["waiting_for_input"] = {
                                "type": "text",
                                "variable": "city",
                                "save_to_database": True,
                                "node_id": "sIh3xXKEtb_TtrhHqZQzX",
                                "next_node_id": "tS2XGL2Mn4LkE63SnxhPy"
                            }
                            logging.info(f"✅ Показана условная клавиатура для узла sIh3xXKEtb_TtrhHqZQzX")
                        if not conditional_met:
                            # Условие не выполнено - показываем основнояя сообщение
                            text = "Из какого ты города?"
                            await message.answer(text)
                            user_data[user_id]["waiting_for_input"] = {
                                "type": "text",
                                "modes": ["text"],
                                "variable": "city",
                                "save_to_database": True,
                                "node_id": "sIh3xXKEtb_TtrhHqZQzX",
                                "next_node_id": "tS2XGL2Mn4LkE63SnxhPy"
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной city (узел sIh3xXKEtb_TtrhHqZQzX)")
                    elif next_node_id == "tS2XGL2Mn4LkE63SnxhPy":
                        # Узел с условными сообщениями - проверяем условия
                        logging.info(f"🔧 Условная навигация к узлу с условными сообщениями: tS2XGL2Mn4LkE63SnxhPy")
                        user_data_dict = await get_user_from_db(user_id) or {}
                        user_data_dict.update(user_data.get(user_id, {}))
                        # Функция для проверки переменных пользователя
                        def check_user_variable_inline(var_name, user_data_dict):
                            if "user_data" in user_data_dict and user_data_dict["user_data"]:
                                try:
                                    import json
                                    parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                                    if var_name in parsed_data:
                                        raw_value = parsed_data[var_name]
                                        if isinstance(raw_value, dict) and "value" in raw_value:
                                            var_value = raw_value["value"]
                                            if var_value is not None and str(var_value).strip() != "":
                                                return True, str(var_value)
                                        else:
                                            if raw_value is not None and str(raw_value).strip() != "":
                                                return True, str(raw_value)
                                except (json.JSONDecodeError, TypeError):
                                    pass
                            if var_name in user_data_dict:
                                variable_data = user_data_dict.get(var_name)
                                if isinstance(variable_data, dict) and "value" in variable_data:
                                    var_value = variable_data["value"]
                                    if var_value is not None and str(var_value).strip() != "":
                                        return True, str(var_value)
                                elif variable_data is not None and str(variable_data).strip() != "":
                                    return True, str(variable_data)
                            return False, None
                        
                        conditional_met = False
                        if (
                            check_user_variable_inline("name", user_data_dict)[0]
                        ):
                            conditional_met = True
                            text = """
"""
                            _, var_value_name = check_user_variable_inline("name", user_data_dict)
                            if "{name}" in text and var_value_name is not None:
                                text = text.replace("{name}", var_value_name)
                            conditional_met = True
                            logging.info(f"✅ Условие выполнено: переменная суяесявует")
                            # waitForTextInput=true: показываем сообщение и ждем ввода
                            # Генерируем клавиатуру с кнопками из условного сообщения
                            builder = ReplyKeyboardBuilder()
                            btn_text_9Qihav_1tM43MLvkUr1y1 = "{name}"
                            _, btn_var_value = check_user_variable_inline("name", user_data_dict)
                            if btn_var_value is not None:
                                btn_text_9Qihav_1tM43MLvkUr1y1 = btn_text_9Qihav_1tM43MLvkUr1y1.replace("{name}", btn_var_value)
                            builder.add(KeyboardButton(text=btn_text_9Qihav_1tM43MLvkUr1y1))
                            builder.adjust(1)
                            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
                            main_text = "Как мне тебя называть?"
                            await message.answer(main_text, reply_markup=keyboard)
                            user_data[user_id]["waiting_for_input"] = {
                                "type": "text",
                                "variable": "name",
                                "save_to_database": True,
                                "node_id": "tS2XGL2Mn4LkE63SnxhPy",
                                "next_node_id": "lBPy3gcGVLla0NGdSYb35"
                            }
                            logging.info(f"✅ Показана условная клавиатура для узла tS2XGL2Mn4LkE63SnxhPy")
                        if not conditional_met:
                            # Условие не выполнено - показываем основнояя сообщение
                            text = "Как мне тебя называть?"
                            await message.answer(text)
                            user_data[user_id]["waiting_for_input"] = {
                                "type": "text",
                                "modes": ["text"],
                                "variable": "name",
                                "save_to_database": True,
                                "node_id": "tS2XGL2Mn4LkE63SnxhPy",
                                "next_node_id": "lBPy3gcGVLla0NGdSYb35"
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной name (узел tS2XGL2Mn4LkE63SnxhPy)")
                    elif next_node_id == "lBPy3gcGVLla0NGdSYb35":
                        # Узел с условными сообщениями - проверяем условия
                        logging.info(f"🔧 Условная навигация к узлу с условными сообщениями: lBPy3gcGVLla0NGdSYb35")
                        user_data_dict = await get_user_from_db(user_id) or {}
                        user_data_dict.update(user_data.get(user_id, {}))
                        # Функция для проверки переменных пользователя
                        def check_user_variable_inline(var_name, user_data_dict):
                            if "user_data" in user_data_dict and user_data_dict["user_data"]:
                                try:
                                    import json
                                    parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                                    if var_name in parsed_data:
                                        raw_value = parsed_data[var_name]
                                        if isinstance(raw_value, dict) and "value" in raw_value:
                                            var_value = raw_value["value"]
                                            if var_value is not None and str(var_value).strip() != "":
                                                return True, str(var_value)
                                        else:
                                            if raw_value is not None and str(raw_value).strip() != "":
                                                return True, str(raw_value)
                                except (json.JSONDecodeError, TypeError):
                                    pass
                            if var_name in user_data_dict:
                                variable_data = user_data_dict.get(var_name)
                                if isinstance(variable_data, dict) and "value" in variable_data:
                                    var_value = variable_data["value"]
                                    if var_value is not None and str(var_value).strip() != "":
                                        return True, str(var_value)
                                elif variable_data is not None and str(variable_data).strip() != "":
                                    return True, str(variable_data)
                            return False, None
                        
                        conditional_met = False
                        if (
                            check_user_variable_inline("info", user_data_dict)[0]
                        ):
                            conditional_met = True
                            text = """
"""
                            _, var_value_info = check_user_variable_inline("info", user_data_dict)
                            if "{info}" in text and var_value_info is not None:
                                text = text.replace("{info}", var_value_info)
                            conditional_met = True
                            logging.info(f"✅ Условие выполнено: переменная суяесявует")
                            # waitForTextInput=true: показываем сообщение и ждем ввода
                            # Генерируем клавиатуру с кнопками из условного сообщения
                            builder = ReplyKeyboardBuilder()
                            builder.add(KeyboardButton(text="Оставить текущий текст"))
                            builder.adjust(1)
                            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
                            main_text = "Расскажи о себе и кого хочешь найти, чем предлагаешь заняться. Это поможет лучше подобрать тебе компанию."
                            await message.answer(main_text, reply_markup=keyboard)
                            user_data[user_id]["waiting_for_input"] = {
                                "type": "text",
                                "variable": "info",
                                "save_to_database": True,
                                "node_id": "lBPy3gcGVLla0NGdSYb35",
                                "next_node_id": "vxPv7G4n0QGyhnv4ucOM5"
                            }
                            logging.info(f"✅ Показана условная клавиатура для узла lBPy3gcGVLla0NGdSYb35")
                        if not conditional_met:
                            # Условие не выполнено - показываем основнояя сообщение
                            text = "Расскажи о себе и кого хочешь найти, чем предлагаешь заняться. Это поможет лучше подобрать тебе компанию."
                            await message.answer(text)
                            user_data[user_id]["waiting_for_input"] = {
                                "type": "text",
                                "modes": ["text"],
                                "variable": "info",
                                "save_to_database": True,
                                "node_id": "lBPy3gcGVLla0NGdSYb35",
                                "next_node_id": "Y9zLRp1BLpVhm-HcsNkJV"
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной info (узел lBPy3gcGVLla0NGdSYb35)")
                    elif next_node_id == "Y9zLRp1BLpVhm-HcsNkJV":
                        # Узел с условными сообщениями - проверяем условия
                        logging.info(f"🔧 Условная навигация к узлу с условными сообщениями: Y9zLRp1BLpVhm-HcsNkJV")
                        user_data_dict = await get_user_from_db(user_id) or {}
                        user_data_dict.update(user_data.get(user_id, {}))
                        # Функция для проверки переменных пользователя
                        def check_user_variable_inline(var_name, user_data_dict):
                            if "user_data" in user_data_dict and user_data_dict["user_data"]:
                                try:
                                    import json
                                    parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                                    if var_name in parsed_data:
                                        raw_value = parsed_data[var_name]
                                        if isinstance(raw_value, dict) and "value" in raw_value:
                                            var_value = raw_value["value"]
                                            if var_value is not None and str(var_value).strip() != "":
                                                return True, str(var_value)
                                        else:
                                            if raw_value is not None and str(raw_value).strip() != "":
                                                return True, str(raw_value)
                                except (json.JSONDecodeError, TypeError):
                                    pass
                            if var_name in user_data_dict:
                                variable_data = user_data_dict.get(var_name)
                                if isinstance(variable_data, dict) and "value" in variable_data:
                                    var_value = variable_data["value"]
                                    if var_value is not None and str(var_value).strip() != "":
                                        return True, str(var_value)
                                elif variable_data is not None and str(variable_data).strip() != "":
                                    return True, str(variable_data)
                            return False, None
                        
                        conditional_met = False
                        if (
                            check_user_variable_inline("photo", user_data_dict)[0]
                        ):
                            conditional_met = True
                            text = """
"""
                            _, var_value_photo = check_user_variable_inline("photo", user_data_dict)
                            if "{photo}" in text and var_value_photo is not None:
                                text = text.replace("{photo}", var_value_photo)
                            conditional_met = True
                            logging.info(f"✅ Условие выполнено: переменная суяесявует")
                            # Условное сообщение с кнопками: показываем клавиатуру
                            builder = ReplyKeyboardBuilder()
                            builder.add(KeyboardButton(text="Оставить текущее"))
                            builder.adjust(1)
                            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
                            await safe_edit_or_send(callback_query, text, reply_markup=keyboard, node_id="Y9zLRp1BLpVhm-HcsNkJV")
                            logging.info(f"✅ Показана условная клавиатура (кнопяи ведут напрямую, автопереход НЕ выполняется)")
                        if not conditional_met:
                            # Условие не выполнено - показываем основнояя сообщение
                            text = "Теперь пришли фото или запиши видео 👍 (до 15 сек), его будут видеть другие пользователи"
                            await message.answer(text)
                            user_data[user_id]["waiting_for_input"] = {
                                "type": "text",
                                "modes": ["text"],
                                "variable": "response_Y9zLRp1BLpVhm-HcsNkJV",
                                "save_to_database": True,
                                "node_id": "Y9zLRp1BLpVhm-HcsNkJV",
                                "next_node_id": "vxPv7G4n0QGyhnv4ucOM5"
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной response_Y9zLRp1BLpVhm-HcsNkJV (узел Y9zLRp1BLpVhm-HcsNkJV)")
                    elif next_node_id == "vxPv7G4n0QGyhnv4ucOM5":
                        # Обычный узел - отправляем сообщение
                        text = "Так выглядит твоя анкета:"
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
                        logging.info(f"Условная навигация к обычному узлу: vxPv7G4n0QGyhnv4ucOM5")
                        await message.answer(text)
                    elif next_node_id == "8xSJaWAJNz7Hz_54mjFTF":
                        # Обычный узел - отправляем сообщение
                        text = """
{name}, {age}, {city} - {info}
"""
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
                        logging.info(f"Условная навигация к обычному узлу: 8xSJaWAJNz7Hz_54mjFTF")
                        await message.answer(text)
                    elif next_node_id == "KE-8sR9elPEefApjXtBxC":
                        # Обычный узел - отправляем сообщение
                        text = "Все верно?"
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
                        # Создаем reply клавиатуру
                        builder = ReplyKeyboardBuilder()
                        builder.add(KeyboardButton(text="Да"))
                        builder.add(KeyboardButton(text="Изменить анкету"))
                        keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
                        logging.info(f"Условная навигация к обычному узлу: KE-8sR9elPEefApjXtBxC")
                        await message.answer(text, reply_markup=keyboard)
                    elif next_node_id == "yrsc8v81qQa5oQx538Dzn":
                        # Обычный узел - отправляем сообщение
                        text = """1. Смотреть анкеты.
2. Заполнить анкету заново.
3. Изменить фото/видео.
4. Изменить текст анкеты."""
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
                        # Создаем reply клавиатуру
                        builder = ReplyKeyboardBuilder()
                        builder.add(KeyboardButton(text="1"))
                        builder.add(KeyboardButton(text="2"))
                        builder.add(KeyboardButton(text="3"))
                        builder.add(KeyboardButton(text="4"))
                        keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
                        logging.info(f"Условная навигация к обычному узлу: yrsc8v81qQa5oQx538Dzn")
                        await message.answer(text, reply_markup=keyboard)
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
                    elif target_node_id == "f90r9k3FSLu2Tjn74cBn_":
                        await handle_callback_f90r9k3FSLu2Tjn74cBn_(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "RFTgm4KzC6dI39AMTPcmo":
                        await handle_callback_RFTgm4KzC6dI39AMTPcmo(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "sIh3xXKEtb_TtrhHqZQzX":
                        await handle_callback_sIh3xXKEtb_TtrhHqZQzX(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "tS2XGL2Mn4LkE63SnxhPy":
                        await handle_callback_tS2XGL2Mn4LkE63SnxhPy(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "lBPy3gcGVLla0NGdSYb35":
                        await handle_callback_lBPy3gcGVLla0NGdSYb35(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "Y9zLRp1BLpVhm-HcsNkJV":
                        await handle_callback_Y9zLRp1BLpVhm_HcsNkJV(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "vxPv7G4n0QGyhnv4ucOM5":
                        await handle_callback_vxPv7G4n0QGyhnv4ucOM5(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "8xSJaWAJNz7Hz_54mjFTF":
                        await handle_callback_8xSJaWAJNz7Hz_54mjFTF(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "KE-8sR9elPEefApjXtBxC":
                        await handle_callback_KE_8sR9elPEefApjXtBxC(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "yrsc8v81qQa5oQx538Dzn":
                        await handle_callback_yrsc8v81qQa5oQx538Dzn(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
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
                        elif next_node_id == "f90r9k3FSLu2Tjn74cBn_":
                            await handle_callback_f90r9k3FSLu2Tjn74cBn_(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "RFTgm4KzC6dI39AMTPcmo":
                            await handle_callback_RFTgm4KzC6dI39AMTPcmo(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "sIh3xXKEtb_TtrhHqZQzX":
                            await handle_callback_sIh3xXKEtb_TtrhHqZQzX(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "tS2XGL2Mn4LkE63SnxhPy":
                            await handle_callback_tS2XGL2Mn4LkE63SnxhPy(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "lBPy3gcGVLla0NGdSYb35":
                            await handle_callback_lBPy3gcGVLla0NGdSYb35(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "Y9zLRp1BLpVhm-HcsNkJV":
                            await handle_callback_Y9zLRp1BLpVhm_HcsNkJV(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "vxPv7G4n0QGyhnv4ucOM5":
                            await handle_callback_vxPv7G4n0QGyhnv4ucOM5(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "8xSJaWAJNz7Hz_54mjFTF":
                            await handle_callback_8xSJaWAJNz7Hz_54mjFTF(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "KE-8sR9elPEefApjXtBxC":
                            await handle_callback_KE_8sR9elPEefApjXtBxC(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "yrsc8v81qQa5oQx538Dzn":
                            await handle_callback_yrsc8v81qQa5oQx538Dzn(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
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
                        elif skip_target == "f90r9k3FSLu2Tjn74cBn_":
                            await handle_callback_f90r9k3FSLu2Tjn74cBn_(fake_callback)
                        elif skip_target == "RFTgm4KzC6dI39AMTPcmo":
                            await handle_callback_RFTgm4KzC6dI39AMTPcmo(fake_callback)
                        elif skip_target == "sIh3xXKEtb_TtrhHqZQzX":
                            await handle_callback_sIh3xXKEtb_TtrhHqZQzX(fake_callback)
                        elif skip_target == "tS2XGL2Mn4LkE63SnxhPy":
                            await handle_callback_tS2XGL2Mn4LkE63SnxhPy(fake_callback)
                        elif skip_target == "lBPy3gcGVLla0NGdSYb35":
                            await handle_callback_lBPy3gcGVLla0NGdSYb35(fake_callback)
                        elif skip_target == "Y9zLRp1BLpVhm-HcsNkJV":
                            await handle_callback_Y9zLRp1BLpVhm_HcsNkJV(fake_callback)
                        elif skip_target == "vxPv7G4n0QGyhnv4ucOM5":
                            await handle_callback_vxPv7G4n0QGyhnv4ucOM5(fake_callback)
                        elif skip_target == "8xSJaWAJNz7Hz_54mjFTF":
                            await handle_callback_8xSJaWAJNz7Hz_54mjFTF(fake_callback)
                        elif skip_target == "KE-8sR9elPEefApjXtBxC":
                            await handle_callback_KE_8sR9elPEefApjXtBxC(fake_callback)
                        elif skip_target == "yrsc8v81qQa5oQx538Dzn":
                            await handle_callback_yrsc8v81qQa5oQx538Dzn(fake_callback)
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
                            elif skip_target == "f90r9k3FSLu2Tjn74cBn_":
                                await handle_callback_f90r9k3FSLu2Tjn74cBn_(fake_callback)
                            elif skip_target == "RFTgm4KzC6dI39AMTPcmo":
                                await handle_callback_RFTgm4KzC6dI39AMTPcmo(fake_callback)
                            elif skip_target == "sIh3xXKEtb_TtrhHqZQzX":
                                await handle_callback_sIh3xXKEtb_TtrhHqZQzX(fake_callback)
                            elif skip_target == "tS2XGL2Mn4LkE63SnxhPy":
                                await handle_callback_tS2XGL2Mn4LkE63SnxhPy(fake_callback)
                            elif skip_target == "lBPy3gcGVLla0NGdSYb35":
                                await handle_callback_lBPy3gcGVLla0NGdSYb35(fake_callback)
                            elif skip_target == "Y9zLRp1BLpVhm-HcsNkJV":
                                await handle_callback_Y9zLRp1BLpVhm_HcsNkJV(fake_callback)
                            elif skip_target == "vxPv7G4n0QGyhnv4ucOM5":
                                await handle_callback_vxPv7G4n0QGyhnv4ucOM5(fake_callback)
                            elif skip_target == "8xSJaWAJNz7Hz_54mjFTF":
                                await handle_callback_8xSJaWAJNz7Hz_54mjFTF(fake_callback)
                            elif skip_target == "KE-8sR9elPEefApjXtBxC":
                                await handle_callback_KE_8sR9elPEefApjXtBxC(fake_callback)
                            elif skip_target == "yrsc8v81qQa5oQx538Dzn":
                                await handle_callback_yrsc8v81qQa5oQx538Dzn(fake_callback)
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
                        elif current_node_id == "f90r9k3FSLu2Tjn74cBn_":
                            text = "Теперь определимся с полом"
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
                            # Устанавливаем состояние ожидания ввода для узла f90r9k3FSLu2Tjn74cBn_
                            user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
                            user_data[message.from_user.id]["waiting_for_input"] = {
                                "type": "button",
                                "modes": ["button", "text"],
                                "variable": "gender",
                                "save_to_database": True,
                                "node_id": "f90r9k3FSLu2Tjn74cBn_",
                                "next_node_id": "",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['button', 'text'] для переменной gender (узел f90r9k3FSLu2Tjn74cBn_)")
                            logging.info(f"✅ Узел f90r9k3FSLu2Tjn74cBn_ настроен для сбора ввода (collectUserInput=true)")
                            # ИСПРАВЛЕНИЕ: У узла есть reply кнопки - показываем их вместо ожидания тттекста
                            builder = ReplyKeyboardBuilder()
                            builder.add(KeyboardButton(text="Я девушка"))
                            builder.add(KeyboardButton(text="Я парень"))
                            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
                            await message.answer(text, reply_markup=keyboard)
                            logging.info(f"✅ Показана reply клавиатура для узла f90r9k3FSLu2Tjn74cBn_ с collectUserInput")
                            # Настраиваем ожидание ввода для message узла с reply кнопками (используем универсальную функцию)
                            user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
                            user_data[message.from_user.id]["waiting_for_input"] = {
                                "type": "button",
                                "modes": ["button", "text"],
                                "variable": "gender",
                                "save_to_database": True,
                                "node_id": "f90r9k3FSLu2Tjn74cBn_",
                                "next_node_id": "",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['button', 'text'] для переменной gender (узел f90r9k3FSLu2Tjn74cBn_)")
                        elif current_node_id == "RFTgm4KzC6dI39AMTPcmo":
                            text = "Кто тебе интересен?"
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
                            # Устанавливаем состояние ожидания ввода для узла RFTgm4KzC6dI39AMTPcmo
                            user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
                            user_data[message.from_user.id]["waiting_for_input"] = {
                                "type": "button",
                                "modes": ["button", "text"],
                                "variable": "sex",
                                "save_to_database": True,
                                "node_id": "RFTgm4KzC6dI39AMTPcmo",
                                "next_node_id": "",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['button', 'text'] для переменной sex (узел RFTgm4KzC6dI39AMTPcmo)")
                            logging.info(f"✅ Узел RFTgm4KzC6dI39AMTPcmo настроен для сбора ввода (collectUserInput=true)")
                            # ИСПРАВЛЕНИЕ: У узла есть reply кнопки - показываем их вместо ожидания тттекста
                            builder = ReplyKeyboardBuilder()
                            builder.add(KeyboardButton(text="Девушки"))
                            builder.add(KeyboardButton(text="Парни"))
                            builder.add(KeyboardButton(text="Все равно"))
                            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
                            await message.answer(text, reply_markup=keyboard)
                            logging.info(f"✅ Показана reply клавиатура для узла RFTgm4KzC6dI39AMTPcmo с collectUserInput")
                            # Настраиваем ожидание ввода для message узла с reply кнопками (используем универсальную функцию)
                            user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
                            user_data[message.from_user.id]["waiting_for_input"] = {
                                "type": "button",
                                "modes": ["button", "text"],
                                "variable": "sex",
                                "save_to_database": True,
                                "node_id": "RFTgm4KzC6dI39AMTPcmo",
                                "next_node_id": "",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['button', 'text'] для переменной sex (узел RFTgm4KzC6dI39AMTPcmo)")
                        elif current_node_id == "sIh3xXKEtb_TtrhHqZQzX":
                            text = "Из какого ты города?"
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
                            # Устанавливаем состояние ожидания ввода для узла sIh3xXKEtb_TtrhHqZQzX
                            user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
                            user_data[message.from_user.id]["waiting_for_input"] = {
                                "type": "text",
                                "modes": ["text"],
                                "variable": "city",
                                "save_to_database": True,
                                "node_id": "sIh3xXKEtb_TtrhHqZQzX",
                                "next_node_id": "tS2XGL2Mn4LkE63SnxhPy",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной city (узел sIh3xXKEtb_TtrhHqZQzX)")
                            logging.info(f"✅ Узел sIh3xXKEtb_TtrhHqZQzX настроен для сбора ввода (collectUserInput=true)")
                            await message.answer(text)
                            # Настраиваем ожидание ввода для message узла (универсальная функция опяяяяеделит тип: text/photo/video/audio/document)
                            user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
                            user_data[message.from_user.id]["waiting_for_input"] = {
                                "type": "text",
                                "modes": ["text"],
                                "variable": "city",
                                "save_to_database": True,
                                "node_id": "sIh3xXKEtb_TtrhHqZQzX",
                                "next_node_id": "tS2XGL2Mn4LkE63SnxhPy",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной city (узел sIh3xXKEtb_TtrhHqZQzX)")
                        elif current_node_id == "tS2XGL2Mn4LkE63SnxhPy":
                            text = "Как мне тебя называть?"
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
                            # Устанавливаем состояние ожидания ввода для узла tS2XGL2Mn4LkE63SnxhPy
                            user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
                            user_data[message.from_user.id]["waiting_for_input"] = {
                                "type": "text",
                                "modes": ["text"],
                                "variable": "name",
                                "save_to_database": True,
                                "node_id": "tS2XGL2Mn4LkE63SnxhPy",
                                "next_node_id": "lBPy3gcGVLla0NGdSYb35",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной name (узел tS2XGL2Mn4LkE63SnxhPy)")
                            logging.info(f"✅ Узел tS2XGL2Mn4LkE63SnxhPy настроен для сбора ввода (collectUserInput=true)")
                            await message.answer(text)
                            # Настраиваем ожидание ввода для message узла (универсальная функция опяяяяеделит тип: text/photo/video/audio/document)
                            user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
                            user_data[message.from_user.id]["waiting_for_input"] = {
                                "type": "text",
                                "modes": ["text"],
                                "variable": "name",
                                "save_to_database": True,
                                "node_id": "tS2XGL2Mn4LkE63SnxhPy",
                                "next_node_id": "lBPy3gcGVLla0NGdSYb35",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной name (узел tS2XGL2Mn4LkE63SnxhPy)")
                        elif current_node_id == "lBPy3gcGVLla0NGdSYb35":
                            text = "Расскажи о себе и кого хочешь найти, чем предлагаешь заняться. Это поможет лучше подобрать тебе компанию."
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
                            # Устанавливаем состояние ожидания ввода для узла lBPy3gcGVLla0NGdSYb35
                            user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
                            user_data[message.from_user.id]["waiting_for_input"] = {
                                "type": "button",
                                "modes": ["button", "text"],
                                "variable": "info",
                                "save_to_database": True,
                                "node_id": "lBPy3gcGVLla0NGdSYb35",
                                "next_node_id": "Y9zLRp1BLpVhm-HcsNkJV",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['button', 'text'] для переменной info (узел lBPy3gcGVLla0NGdSYb35)")
                            logging.info(f"✅ Узел lBPy3gcGVLla0NGdSYb35 настроен для сбора ввода (collectUserInput=true)")
                            # Узел с условными сообщениями - проверяем условия
                            logging.info(f"🔧 Обработка узла с условными сообщениями: lBPy3gcGVLla0NGdSYb35")
                            user_data_dict = await get_user_from_db(user_id) or {}
                            user_data_dict.update(user_data.get(user_id, {}))
                            # Функция для проверки переменных пользователя
                            def check_user_variable_inline(var_name, user_data_dict):
                                if "user_data" in user_data_dict and user_data_dict["user_data"]:
                                    try:
                                        import json
                                        parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                                        if var_name in parsed_data:
                                            raw_value = parsed_data[var_name]
                                            if isinstance(raw_value, dict) and "value" in raw_value:
                                                var_value = raw_value["value"]
                                                if var_value is not None and str(var_value).strip() != "":
                                                    return True, str(var_value)
                                            else:
                                                if raw_value is not None and str(raw_value).strip() != "":
                                                    return True, str(raw_value)
                                    except (json.JSONDecodeError, TypeError):
                                        pass
                                if var_name in user_data_dict:
                                    variable_data = user_data_dict.get(var_name)
                                    if isinstance(variable_data, dict) and "value" in variable_data:
                                        var_value = variable_data["value"]
                                        if var_value is not None and str(var_value).strip() != "":
                                            return True, str(var_value)
                                    elif variable_data is not None and str(variable_data).strip() != "":
                                        return True, str(variable_data)
                                return False, None
                            
                            conditional_met = False
                            if (
                                check_user_variable_inline("info", user_data_dict)[0]
                            ):
                                conditional_met = True
                                builder = ReplyKeyboardBuilder()
                                builder.add(KeyboardButton(text="Оставить текущий текст"))
                                keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
                                main_text = text
                                await message.answer(main_text, reply_markup=keyboard)
                                logging.info(f"✅ Показана условная клавиатура для узла lBPy3gcGVLla0NGdSYb35 (сбор ответов НАСТРОЕН)")
                                # Настраиваем ожидание ввода для условного сообщения
                                user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
                                user_data[message.from_user.id]["waiting_for_input"] = {
                                    "type": "text",
                                    "variable": "info",
                                    "save_to_database": True,
                                    "node_id": "lBPy3gcGVLla0NGdSYb35",
                                    "next_node_id": "vxPv7G4n0QGyhnv4ucOM5",
                                    "skip_buttons": [{"text":"Оставить текущий текст","target":"Y9zLRp1BLpVhm-HcsNkJV"}]
                                }
                                logging.info(f"🔧 Установлено ожидание ввода для условного сообщения: {user_data[message.from_user.id]['waiting_for_input']}")
                            if not conditional_met:
                                # Условие не выполнено - показываем основное сообщение
                                # ИСПяАВЛЕяИЕ: яя узла еять reply кнопки - показяваем их вместо ожидания тттекста
                                builder = ReplyKeyboardBuilder()
                                builder.add(KeyboardButton(text="Пропустить"))
                                keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
                                await message.answer(text, reply_markup=keyboard)
                                logging.info(f"✅ Показана основная reply клавиатура для узла lBPy3gcGVLla0NGdSYb35")
                                # Настраиваем ожидание ввода для message узла с reply кнопками
                                user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
                                user_data[message.from_user.id]["waiting_for_input"] = {
                                    "type": "button",
                                    "modes": ["button", "text"],
                                    "variable": "info",
                                    "save_to_database": True,
                                    "node_id": "lBPy3gcGVLla0NGdSYb35",
                                    "next_node_id": "Y9zLRp1BLpVhm-HcsNkJV",
                                    "min_length": 0,
                                    "max_length": 0,
                                    "retry_message": "Пожалуйста, попробуйте еще раз.",
                                    "success_message": ""
                                }
                                logging.info(f"✅ Состояние ожидания настроено: modes=['button', 'text'] для переменной info (узел lBPy3gcGVLla0NGdSYb35)")
                        elif current_node_id == "Y9zLRp1BLpVhm-HcsNkJV":
                            text = "Теперь пришли фото или запиши видео 👍 (до 15 сек), его будут видеть другие пользователи"
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
                            # Устанавливаем состояние ожидания ввода для узла Y9zLRp1BLpVhm-HcsNkJV
                            user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
                            user_data[message.from_user.id]["waiting_for_input"] = {
                                "type": "photo",
                                "modes": ["photo"],
                                "variable": "photo",
                                "save_to_database": True,
                                "node_id": "Y9zLRp1BLpVhm-HcsNkJV",
                                "next_node_id": "vxPv7G4n0QGyhnv4ucOM5",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['photo'] для переменной photo (узел Y9zLRp1BLpVhm-HcsNkJV)")
                            logging.info(f"✅ Узел Y9zLRp1BLpVhm-HcsNkJV настроен для сбора ввода (collectUserInput=true)")
                            await message.answer(text)
                            # Настраиваем ожидание ввода для message узла (универсальная функция опяяяяеделит тип: text/photo/video/audio/document)
                            user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
                            user_data[message.from_user.id]["waiting_for_input"] = {
                                "type": "photo",
                                "modes": ["photo"],
                                "variable": "photo",
                                "save_to_database": True,
                                "node_id": "Y9zLRp1BLpVhm-HcsNkJV",
                                "next_node_id": "vxPv7G4n0QGyhnv4ucOM5",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['photo'] для переменной photo (узел Y9zLRp1BLpVhm-HcsNkJV)")
                        elif current_node_id == "vxPv7G4n0QGyhnv4ucOM5":
                            text = "Так выглядит твоя анкета:"
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
                            await message.answer(text)
                            # НЕ отправляем сообщение об успехе здесь - это делается в старом формате
                            # Очищаем сястояние ожидания ввода после уяпеянояо перехода
                            if "waiting_for_input" in user_data[user_id]:
                                del user_data[user_id]["waiting_for_input"]
                            
                            logging.info("✅ Переход к следующему уялу выполнен успешно")
                            
                            # ⚡ Автопереход к узлу 8xSJaWAJNz7Hz_54mjFTF (только если collectUserInput=true)
                            logging.info(f"⚡ Автопереход от узла vxPv7G4n0QGyhnv4ucOM5 к узлу 8xSJaWAJNz7Hz_54mjFTF")
                            import types as aiogram_types
                            async def noop(*args, **kwargs):
                                return None
                            fake_message = aiogram_types.SimpleNamespace(
                                chat=aiogram_types.SimpleNamespace(id=message.from_user.id),
                                message_id=message.message_id,
                                delete=noop,
                                edit_text=noop,
                                answer=lambda text, **kwargs: bot.send_message(message.from_user.id, text, **kwargs)
                            )
                            fake_callback = aiogram_types.SimpleNamespace(
                                id="auto_transition",
                                from_user=message.from_user,
                                chat_instance="",
                                data="8xSJaWAJNz7Hz_54mjFTF",
                                message=fake_message,
                                answer=noop
                            )
                            await handle_callback_8xSJaWAJNz7Hz_54mjFTF(fake_callback)
                        elif current_node_id == "8xSJaWAJNz7Hz_54mjFTF":
                            text = """
{name}, {age}, {city} - {info}
"""
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
                            await message.answer(text)
                            # НЕ отправляем сообщение об успехе здесь - это делается в старом формате
                            # Очищаем сястояние ожидания ввода после уяпеянояо перехода
                            if "waiting_for_input" in user_data[user_id]:
                                del user_data[user_id]["waiting_for_input"]
                            
                            logging.info("✅ Переход к следующему уялу выполнен успешно")
                            
                            # ⚡ Автопереход к узлу KE-8sR9elPEefApjXtBxC (только если collectUserInput=true)
                            logging.info(f"⚡ Автопереход от узла 8xSJaWAJNz7Hz_54mjFTF к узлу KE-8sR9elPEefApjXtBxC")
                            import types as aiogram_types
                            async def noop(*args, **kwargs):
                                return None
                            fake_message = aiogram_types.SimpleNamespace(
                                chat=aiogram_types.SimpleNamespace(id=message.from_user.id),
                                message_id=message.message_id,
                                delete=noop,
                                edit_text=noop,
                                answer=lambda text, **kwargs: bot.send_message(message.from_user.id, text, **kwargs)
                            )
                            fake_callback = aiogram_types.SimpleNamespace(
                                id="auto_transition",
                                from_user=message.from_user,
                                chat_instance="",
                                data="KE-8sR9elPEefApjXtBxC",
                                message=fake_message,
                                answer=noop
                            )
                            await handle_callback_KE_8sR9elPEefApjXtBxC(fake_callback)
                        elif current_node_id == "KE-8sR9elPEefApjXtBxC":
                            text = "Все верно?"
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
                            # Создаем reply клавиатуру
                            builder = ReplyKeyboardBuilder()
                            builder.add(KeyboardButton(text="Да"))
                            builder.add(KeyboardButton(text="Изменить анкету"))
                            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
                            await message.answer(text, reply_markup=keyboard)
                            logging.info(f"✅ Показана reply клавиатура для переходного узла")
                            # НЕ отправляем сообщение об успехе здесь - это делается в старом формате
                            # Очищаем сястояние ожидания ввода после уяпеянояо перехода
                            if "waiting_for_input" in user_data[user_id]:
                                del user_data[user_id]["waiting_for_input"]
                            
                            logging.info("✅ Переход к следующему уялу выполнен успешно")
                            break  # Нет автоперехода, завершаем цикл
                        elif current_node_id == "yrsc8v81qQa5oQx538Dzn":
                            text = """1. Смотреть анкеты.
2. Заполнить анкету заново.
3. Изменить фото/видео.
4. Изменить текст анкеты."""
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
                            # Создаем reply клавиатуру
                            builder = ReplyKeyboardBuilder()
                            builder.add(KeyboardButton(text="1"))
                            builder.add(KeyboardButton(text="2"))
                            builder.add(KeyboardButton(text="3"))
                            builder.add(KeyboardButton(text="4"))
                            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
                            await message.answer(text, reply_markup=keyboard)
                            logging.info(f"✅ Показана reply клавиатура для переходного узла")
                            # НЕ отправляем сообщение об успехе здесь - это делается в старом формате
                            # Очищаем сястояние ожидания ввода после уяпеянояо перехода
                            if "waiting_for_input" in user_data[user_id]:
                                del user_data[user_id]["waiting_for_input"]
                            
                            logging.info("✅ Переход к следующему уялу выполнен успешно")
                            break  # Нет автоперехода, завершаем цикл
                        else:
                            logging.warning(f"Неизвестный узел: {current_node_id}")
                            break  # Выходим из цикла при неизвестном узле
                except Exception as e:
                    logging.error(f"Ошибка при переходе к узлу: {e}")
            
            return  # Завершаем обработку для нового формата
        
        # Обработка старого формата (для совместимости)
        # Находим узел для получения настроек
        logging.info(f"DEBUG old format: checking inputNodes: start, f90r9k3FSLu2Tjn74cBn_, RFTgm4KzC6dI39AMTPcmo, sIh3xXKEtb_TtrhHqZQzX, tS2XGL2Mn4LkE63SnxhPy, lBPy3gcGVLla0NGdSYb35, Y9zLRp1BLpVhm-HcsNkJV")
        if waiting_node_id == "start":
            
            # Сохраняем ответ пользователя
            import datetime
            timestamp = get_moscow_time()
            
            # Сохраняем простое значение для совместимости с логикой профиля
            response_data = user_text  # Простое значение вместо сложного объекта
            
            # Сохраняем в пользовательские данные
            user_data[user_id]["age"] = response_data
            
            # Сохраняем в базу данных
            saved_to_db = await update_user_data_in_db(user_id, "age", response_data)
            if saved_to_db:
                logging.info(f"✅ Данные сохранены в БД: age = {user_text} (пользователь {user_id})")
            else:
                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            
            logging.info(f"Получен пользовательский ввод: age = {user_text}")
            
            # Переходим к следующему узлу
            try:
                # Отправляем сообщение для узла f90r9k3FSLu2Tjn74cBn_
                text = "Теперь определимся с полом"
                # Настраиваем новое ожидание ввода для узла f90r9k3FSLu2Tjn74cBn_
                user_data[user_id]["waiting_for_input"] = {
                    "type": "text",
                    "variable": "gender",
                    "save_to_database": True,
                    "node_id": "f90r9k3FSLu2Tjn74cBn_",
                    "next_node_id": "",
                    "min_length": 0,
                    "max_length": 0,
                    "retry_message": "Пожалуйста, попробуйте еще раз.",
                    "success_message": ""
                }
                
                await message.answer(text)
                
                logging.info("✅ Переход к следующему узлу выполнен успешно")
            except Exception as e:
                logging.error(f"Ошябка при переходе к следующему узлу: {e}")
            return
        elif waiting_node_id == "f90r9k3FSLu2Tjn74cBn_":
            
            # Сохраняем ответ пользователя
            import datetime
            timestamp = get_moscow_time()
            
            # Сохраняем простое значение для совместимости с логикой профиля
            response_data = user_text  # Простое значение вместо сложного объекта
            
            # Сохраняем в пользовательские данные
            user_data[user_id]["gender"] = response_data
            
            # Сохраняем в базу данных
            saved_to_db = await update_user_data_in_db(user_id, "gender", response_data)
            if saved_to_db:
                logging.info(f"✅ Данные сохранены в БД: gender = {user_text} (пользователь {user_id})")
            else:
                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            
            logging.info(f"Получен пользовательский ввод: gender = {user_text}")
            
            # Конец цепочки ввода - завершаем обработку
            logging.info("Завершена цепочка сбора пользовательских данных")
            return
        elif waiting_node_id == "RFTgm4KzC6dI39AMTPcmo":
            
            # Сохраняем ответ пользователя
            import datetime
            timestamp = get_moscow_time()
            
            # Сохраняем простое значение для совместимости с логикой профиля
            response_data = user_text  # Простое значение вместо сложного объекта
            
            # Сохраняем в пользовательские данные
            user_data[user_id]["sex"] = response_data
            
            # Сохраняем в базу данных
            saved_to_db = await update_user_data_in_db(user_id, "sex", response_data)
            if saved_to_db:
                logging.info(f"✅ Данные сохранены в БД: sex = {user_text} (пользователь {user_id})")
            else:
                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            
            logging.info(f"Получен пользовательский ввод: sex = {user_text}")
            
            # Конец цепочки ввода - завершаем обработку
            logging.info("Завершена цепочка сбора пользовательских данных")
            return
        elif waiting_node_id == "sIh3xXKEtb_TtrhHqZQzX":
            
            # Сохраняем ответ пользователя
            import datetime
            timestamp = get_moscow_time()
            
            # Сохраняем простое значение для совместимости с логикой профиля
            response_data = user_text  # Простое значение вместо сложного объекта
            
            # Сохраняем в пользовательские данные
            user_data[user_id]["city"] = response_data
            
            # Сохраняем в базу данных
            saved_to_db = await update_user_data_in_db(user_id, "city", response_data)
            if saved_to_db:
                logging.info(f"✅ Данные сохранены в БД: city = {user_text} (пользователь {user_id})")
            else:
                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            
            logging.info(f"Получен пользовательский ввод: city = {user_text}")
            
            # Переходим к следующему узлу
            try:
                # Отправляем сообщение для узла tS2XGL2Mn4LkE63SnxhPy
                text = "Как мне тебя называть?"
                # Настраиваем новое ожидание ввода для узла tS2XGL2Mn4LkE63SnxhPy
                user_data[user_id]["waiting_for_input"] = {
                    "type": "text",
                    "variable": "name",
                    "save_to_database": True,
                    "node_id": "tS2XGL2Mn4LkE63SnxhPy",
                    "next_node_id": "lBPy3gcGVLla0NGdSYb35",
                    "min_length": 0,
                    "max_length": 0,
                    "retry_message": "Пожалуйста, попробуйте еще раз.",
                    "success_message": ""
                }
                
                await message.answer(text)
                
                logging.info("✅ Переход к следующему узлу выполнен успешно")
            except Exception as e:
                logging.error(f"Ошябка при переходе к следующему узлу: {e}")
            return
        elif waiting_node_id == "tS2XGL2Mn4LkE63SnxhPy":
            
            # Сохраняем ответ пользователя
            import datetime
            timestamp = get_moscow_time()
            
            # Сохраняем простое значение для совместимости с логикой профиля
            response_data = user_text  # Простое значение вместо сложного объекта
            
            # Сохраняем в пользовательские данные
            user_data[user_id]["name"] = response_data
            
            # Сохраняем в базу данных
            saved_to_db = await update_user_data_in_db(user_id, "name", response_data)
            if saved_to_db:
                logging.info(f"✅ Данные сохранены в БД: name = {user_text} (пользователь {user_id})")
            else:
                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            
            logging.info(f"Получен пользовательский ввод: name = {user_text}")
            
            # Переходим к следующему узлу
            try:
                # Отправляем сообщение для узла lBPy3gcGVLla0NGdSYb35
                text = "Расскажи о себе и кого хочешь найти, чем предлагаешь заняться. Это поможет лучше подобрать тебе компанию."
                # Настраиваем новое ожидание ввода для узла lBPy3gcGVLla0NGdSYb35
                user_data[user_id]["waiting_for_input"] = {
                    "type": "text",
                    "variable": "info",
                    "save_to_database": True,
                    "node_id": "lBPy3gcGVLla0NGdSYb35",
                    "next_node_id": "Y9zLRp1BLpVhm-HcsNkJV",
                    "min_length": 0,
                    "max_length": 0,
                    "retry_message": "Пожалуйста, попробуйте еще раз.",
                    "success_message": ""
                }
                
                await message.answer(text)
                
                logging.info("✅ Переход к следующему узлу выполнен успешно")
            except Exception as e:
                logging.error(f"Ошябка при переходе к следующему узлу: {e}")
            return
        elif waiting_node_id == "lBPy3gcGVLla0NGdSYb35":
            
            # Сохраняем ответ пользователя
            import datetime
            timestamp = get_moscow_time()
            
            # Сохраняем простое значение для совместимости с логикой профиля
            response_data = user_text  # Простое значение вместо сложного объекта
            
            # Сохраняем в пользовательские данные
            user_data[user_id]["info"] = response_data
            
            # Сохраняем в базу данных
            saved_to_db = await update_user_data_in_db(user_id, "info", response_data)
            if saved_to_db:
                logging.info(f"✅ Данные сохранены в БД: info = {user_text} (пользователь {user_id})")
            else:
                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            
            logging.info(f"Получен пользовательский ввод: info = {user_text}")
            
            # Переходим к следующему узлу
            try:
                # Отправляем сообщение для узла Y9zLRp1BLpVhm-HcsNkJV
                text = "Теперь пришли фото или запиши видео 👍 (до 15 сек), его будут видеть другие пользователи"
                # Настраиваем новое ожидание ввода для узла Y9zLRp1BLpVhm-HcsNkJV
                user_data[user_id]["waiting_for_input"] = {
                    "type": "text",
                    "variable": "response_Y9zLRp1BLpVhm-HcsNkJV",
                    "save_to_database": True,
                    "node_id": "Y9zLRp1BLpVhm-HcsNkJV",
                    "next_node_id": "vxPv7G4n0QGyhnv4ucOM5",
                    "min_length": 0,
                    "max_length": 0,
                    "retry_message": "Пожалуйста, попробуйте еще раз.",
                    "success_message": ""
                }
                
                await message.answer(text)
                
                logging.info("✅ Переход к следующему узлу выполнен успешно")
            except Exception as e:
                logging.error(f"Ошябка при переходе к следующему узлу: {e}")
            return
        elif waiting_node_id == "Y9zLRp1BLpVhm-HcsNkJV":
            
            # Сохраняем ответ пользователя
            import datetime
            timestamp = get_moscow_time()
            
            # Сохраняем простое значение для совместимости с логикой профиля
            response_data = user_text  # Простое значение вместо сложного объекта
            
            # Сохраняем в пользовательские данные
            user_data[user_id]["user_response"] = response_data
            
            # Сохраняем в базу данных
            saved_to_db = await update_user_data_in_db(user_id, "user_response", response_data)
            if saved_to_db:
                logging.info(f"✅ Данные сохранены в БД: user_response = {user_text} (пользователь {user_id})")
            else:
                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            
            logging.info(f"Получен пользовательский ввод: user_response = {user_text}")
            
            # Переходим к следующему узлу
            try:
                # Отправляем сообщение для узла vxPv7G4n0QGyhnv4ucOM5
                text = "Так выглядит твоя анкета:"
                await message.answer(text)
                # Очищаем состояние ожидания ввода после успешного перехода
                if "waiting_for_input" in user_data[user_id]:
                    del user_data[user_id]["waiting_for_input"]
                
                logging.info("✅ Переход к следующему узлу выполнен успешно")
            except Exception as e:
                logging.error(f"Ошябка при переходе к следующему узлу: {e}")
            return
        
        # Если узел не найден
        logging.warning(f"Узел для сбора ввода не найден: {waiting_node_id}")
        del user_data[user_id]["waiting_for_input"]
        return
    
    # НОВАЯ ЛОГИКА: Проверяем, включен ли дополнительный сбор ответов для обычных кнопок
    if user_id in user_data and user_data[user_id].get("input_collection_enabled"):
        input_node_id = user_data[user_id].get("input_node_id")
        input_variable = user_data[user_id].get("input_variable", "button_response")
        input_target_node_id = user_data[user_id].get("input_target_node_id")
        user_text = message.text
        
        # Если есть целевой узел для перехода - это основной ввод, а не дополнительный
        if input_target_node_id:
            # Это основной ввод с переходом к следующему узлу
            timestamp = get_moscow_time()
            response_data = user_text
            
            # Сохраняем в пользовательские данные
            user_data[user_id][input_variable] = response_data
            
            # Сохраняем в базу данных
            saved_to_db = await update_user_data_in_db(user_id, input_variable, response_data)
            if saved_to_db:
                logging.info(f"✅ Данные сохранены в БД: {input_variable} = {user_text} (пользователь {user_id})")
            else:
                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            logging.info(f"Получен основной пользовательский ввод: {input_variable} = {user_text}")
            
            # Переходим к целевому узлу
            # Очищаем состояние сбора ввода
            del user_data[user_id]["input_collection_enabled"]
            if "input_node_id" in user_data[user_id]:
                del user_data[user_id]["input_node_id"]
            if "input_variable" in user_data[user_id]:
                del user_data[user_id]["input_variable"]
            if "input_target_node_id" in user_data[user_id]:
                del user_data[user_id]["input_target_node_id"]
            
            # Находим и вызываем обработчик целевого узла
            if input_target_node_id == "start":
                # Обычный узел - отправляем сообщение start
                text = "Сколько тебе лет?"
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
                await message.answer(text)
                logging.info(f"✅ Навигация к обычному узлу start выполнена")
            if input_target_node_id == "f90r9k3FSLu2Tjn74cBn_":
                # Переход к узлу f90r9k3FSLu2Tjn74cBn_
                text = "Теперь определимся с полом"
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
                await message.answer(text)
                logging.info(f"Переход к узлу f90r9k3FSLu2Tjn74cBn_ выполнен")
            if input_target_node_id == "RFTgm4KzC6dI39AMTPcmo":
                # Переход к узлу RFTgm4KzC6dI39AMTPcmo
                text = "Кто тебе интересен?"
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
                await message.answer(text)
                logging.info(f"Переход к узлу RFTgm4KzC6dI39AMTPcmo выполнен")
            if input_target_node_id == "sIh3xXKEtb_TtrhHqZQzX":
                # Переход к узлу sIh3xXKEtb_TtrhHqZQzX
                text = "Из какого ты города?"
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
                await message.answer(text)
                logging.info(f"Переход к узлу sIh3xXKEtb_TtrhHqZQzX выполнен")
            if input_target_node_id == "tS2XGL2Mn4LkE63SnxhPy":
                # Переход к узлу tS2XGL2Mn4LkE63SnxhPy
                text = "Как мне тебя называть?"
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
                await message.answer(text)
                logging.info(f"Переход к узлу tS2XGL2Mn4LkE63SnxhPy выполнен")
            if input_target_node_id == "lBPy3gcGVLla0NGdSYb35":
                # Переход к узлу lBPy3gcGVLla0NGdSYb35
                text = "Расскажи о себе и кого хочешь найти, чем предлагаешь заняться. Это поможет лучше подобрать тебе компанию."
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
                await message.answer(text)
                logging.info(f"Переход к узлу lBPy3gcGVLla0NGdSYb35 выполнен")
            if input_target_node_id == "Y9zLRp1BLpVhm-HcsNkJV":
                # Переход к узлу Y9zLRp1BLpVhm-HcsNkJV
                text = "Теперь пришли фото или запиши видео 👍 (до 15 сек), его будут видеть другие пользователи"
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
                await message.answer(text)
                logging.info(f"Переход к узлу Y9zLRp1BLpVhm-HcsNkJV выполнен")
            if input_target_node_id == "vxPv7G4n0QGyhnv4ucOM5":
                # Переход к узлу vxPv7G4n0QGyhnv4ucOM5
                text = "Так выглядит твоя анкета:"
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
                await message.answer(text)
                logging.info(f"Переход к узлу vxPv7G4n0QGyhnv4ucOM5 выполнен")
            if input_target_node_id == "8xSJaWAJNz7Hz_54mjFTF":
                # Переход к узлу 8xSJaWAJNz7Hz_54mjFTF
                text = """
{name}, {age}, {city} - {info}
"""
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
                await message.answer(text)
                logging.info(f"Переход к узлу 8xSJaWAJNz7Hz_54mjFTF выполнен")
            if input_target_node_id == "KE-8sR9elPEefApjXtBxC":
                # Переход к узлу KE-8sR9elPEefApjXtBxC
                text = "Все верно?"
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
                await message.answer(text)
                logging.info(f"Переход к узлу KE-8sR9elPEefApjXtBxC выполнен")
            if input_target_node_id == "yrsc8v81qQa5oQx538Dzn":
                # Переход к узлу yrsc8v81qQa5oQx538Dzn
                text = """1. Смотреть анкеты.
2. Заполнить анкету заново.
3. Изменить фото/видео.
4. Изменить текст анкеты."""
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
                await message.answer(text)
                logging.info(f"Переход к узлу yrsc8v81qQa5oQx538Dzn выполнен")
            return
        else:
            # Это дополнительный комментарий (нет целевого узла)
            timestamp = get_moscow_time()
            response_data = user_text
            
            # Сохраняем в пользовательские данные
            user_data[user_id][f"{input_variable}_additional"] = response_data
            
            # Уведомляем пользователя
            await message.answer("✅ Дополнительный комментарий сохранен!")
            
            logging.info(f"Дополнительный текстовый ввод: {input_variable}_additional = {user_text} (пользователь {user_id})")
        return
    
    # Если нет активного ожидания ввода, игнорируем сообщение
    return

# Обработчик получения фото от пользователя
@dp.message(F.photo)
async def handle_photo_input(message: types.Message):
    user_id = message.from_user.id
    logging.info(f"📸 Получено фото от пользователя {user_id}")
    
    # Проверяем, ожидаем ли мы ввод фото - проверяем waiting_for_input с типом photo
    if user_id not in user_data or "waiting_for_input" not in user_data[user_id]:
        logging.info(f"Фото от пользователя {user_id} проигнорировано - не ожидается ввод")
        return
    
    # Получаем конфигурацию ожидания
    waiting_config = user_data[user_id]["waiting_for_input"]
    # Проверяем, что тип ожидания - фото
    if not (isinstance(waiting_config, dict) and waiting_config.get("type") == "photo"):
        logging.info(f"Фото от пользователя {user_id} проигнорировано - ожидается другой тип ввода")
        return
    
    photo_config = waiting_config
    photo_variable = photo_config.get("variable", "user_photo")
    node_id = photo_config.get("node_id", "unknown")
    next_node_id = photo_config.get("next_node_id")
    
    # Получаем file_id фото (берем последнее - лучшее качество)
    photo_file_id = message.photo[-1].file_id
    logging.info(f"Получен file_id фото: {photo_file_id}")
    
    # Регистрируем фото через API для получения URL
    photo_url = None
    try:
        if API_BASE_URL.startswith("http://") or API_BASE_URL.startswith("https://"):
            media_api_url = f"{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-photo"
        else:
            media_api_url = f"https://{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-photo"
        
        # Сначала сохраняем сообщение чтобы получить message_id
        saved_msg = await save_message_to_api(
            user_id=str(user_id),
            message_type="user",
            message_text="[Фото ответ]",
            node_id=node_id,
            message_data={"photo": {"file_id": photo_file_id}, "is_photo_answer": True}
        )
        
        if saved_msg and "id" in saved_msg:
            media_payload = {
                "messageId": saved_msg["id"],
                "fileId": photo_file_id,
                "botToken": BOT_TOKEN,
                "mediaType": "photo"
            }
            
            # Определяем, использовать ли SSL для медиа-запросов
            use_ssl_media3 = not (media_api_url.startswith("http://") or "localhost" in media_api_url or "127.0.0.1" in media_api_url or "0.0.0.0" in media_api_url)
            logging.debug(f"🔒 SSL требуется для медиа-запроса {media_api_url}: {use_ssl_media3}")
            # ИСПРАВЛЕНИЕ: Для localhost всегда используем ssl=False, чтобы избежать ошибки SSL WRONG_VERSION_NUMBER
            if "localhost" in media_api_url or "127.0.0.1" in media_api_url or "0.0.0.0" in media_api_url:
                use_ssl_media3 = False
                logging.debug(f"🔓 SSL принудительно отключен для локального медиа-запроса: {media_api_url}")
            
            if use_ssl_media3:
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
                async with session.post(media_api_url, json=media_payload, timeout=aiohttp.ClientTimeout(total=15)) as response:
                    if response.status == 200:
                        result = await response.json()
                        photo_url = result.get("url")
                        logging.info(f"Фото зарегистрировано, URL: {photo_url}")
                    else:
                        error_text = await response.text()
                        logging.warning(f"Не удалось зарегистрировать фото: {response.status} - {error_text}")
    except Exception as reg_error:
        logging.warning(f"Ошибка при регистрации фото: {reg_error}")
    
    # Сохраняем в пользовательские данные как объект с URL
    photo_data = {
        "value": photo_file_id,
        "type": "photo",
        "photoUrl": photo_url,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    user_data[user_id][photo_variable] = photo_data
    
    # Сохраняем в базу данных
    saved_to_db = await update_user_data_in_db(user_id, photo_variable, photo_data)
    if saved_to_db:
        logging.info(f"Фото сохранено в БД: {photo_variable} (пользователь {user_id})")
    else:
        logging.warning(f"Не удалось сохранить фото в БД, данные сохранены локально")
    
    # Очищаем состояние ожидания
    del user_data[user_id]["waiting_for_input"]
    
    logging.info(f"Фото сохранено: {photo_variable} = {photo_file_id}, URL = {photo_url}")
    
    # Переходим к следующему узлу если указан
    if next_node_id:
        logging.info(f"🚀 Переходим к следующему узлу: {next_node_id}")
        try:
            # Получаем данные пользователя для замены переменных
            user_record = await get_user_from_db(user_id)
            if user_record and "user_data" in user_record:
                user_vars = user_record["user_data"]
            else:
                user_vars = user_data.get(user_id, {})
            
            # Генерируем навигацию для каждого узла
            if next_node_id == "start":
                text = "Сколько тебе лет?"
                # Замена переменных
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
                await message.answer(text)
            elif next_node_id == "f90r9k3FSLu2Tjn74cBn_":
                text = "Теперь определимся с полом"
                # Замена переменных
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
                await message.answer(text)
            elif next_node_id == "RFTgm4KzC6dI39AMTPcmo":
                text = "Кто тебе интересен?"
                # Замена переменных
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
                await message.answer(text)
            elif next_node_id == "sIh3xXKEtb_TtrhHqZQzX":
                text = "Из какого ты города?"
                # Замена переменных
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
                await message.answer(text)
            elif next_node_id == "tS2XGL2Mn4LkE63SnxhPy":
                text = "Как мне тебя называть?"
                # Замена переменных
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
                await message.answer(text)
            elif next_node_id == "lBPy3gcGVLla0NGdSYb35":
                text = "Расскажи о себе и кого хочешь найти, чем предлагаешь заняться. Это поможет лучше подобрать тебе компанию."
                # Замена переменных
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
                await message.answer(text)
            elif next_node_id == "Y9zLRp1BLpVhm-HcsNkJV":
                text = "Теперь пришли фото или запиши видео 👍 (до 15 сек), его будут видеть другие пользователи"
                # Замена переменных
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
                await message.answer(text)
            elif next_node_id == "vxPv7G4n0QGyhnv4ucOM5":
                text = "Так выглядит твоя анкета:"
                # Замена переменных
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
                await message.answer(text)
                
                # Автопереход к следующему узлу (только если collectUserInput=true)
                auto_next_node_id = "8xSJaWAJNz7Hz_54mjFTF"
                logging.info(f"⚡ Автопереход от {next_node_id} к {auto_next_node_id}")
                # Создаем искусственный callback для вызова обработчика
                import types as aiogram_types
                fake_callback = aiogram_types.SimpleNamespace(
                    id="auto_transition",
                    from_user=message.from_user,
                    chat_instance="",
                    data=auto_next_node_id,
                    message=message,
                    answer=lambda: None
                )
                await handle_callback_8xSJaWAJNz7Hz_54mjFTF(fake_callback)
                logging.info(f"✅ Автопереход выполнен: {next_node_id} -> {auto_next_node_id}")
            elif next_node_id == "8xSJaWAJNz7Hz_54mjFTF":
                text = """
{name}, {age}, {city} - {info}
"""
                # Замена переменных
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
                # Отправляем сохраненное фото с текстом узла
                if "photo" in user_vars:
                    media_file_id = user_vars["photo"]
                    if isinstance(media_file_id, dict) and "value" in media_file_id:
                        media_file_id = media_file_id["value"]
                    await message.answer_photo(media_file_id, caption=text)
                    logging.info(f"✅ Отправлено фото из переменной photo с текстом узла {next_node_id}")
                else:
                    await message.answer(text)
                    logging.warning(f"⚠️ Переменная photo не найдена, отправлен только текст")
                
                # Автопереход к следующему узлу (только если collectUserInput=true)
                auto_next_node_id = "KE-8sR9elPEefApjXtBxC"
                logging.info(f"⚡ Автопереход от {next_node_id} к {auto_next_node_id}")
                # Создаем искусственный callback для вызова обработчика
                import types as aiogram_types
                fake_callback = aiogram_types.SimpleNamespace(
                    id="auto_transition",
                    from_user=message.from_user,
                    chat_instance="",
                    data=auto_next_node_id,
                    message=message,
                    answer=lambda: None
                )
                await handle_callback_KE_8sR9elPEefApjXtBxC(fake_callback)
                logging.info(f"✅ Автопереход выполнен: {next_node_id} -> {auto_next_node_id}")
            elif next_node_id == "KE-8sR9elPEefApjXtBxC":
                text = "Все верно?"
                # Замена переменных
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
                await message.answer(text)
            elif next_node_id == "yrsc8v81qQa5oQx538Dzn":
                text = """1. Смотреть анкеты.
2. Заполнить анкету заново.
3. Изменить фото/видео.
4. Изменить текст анкеты."""
                # Замена переменных
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
                await message.answer(text)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")

            # Код навигации будет внедряться сюда во время генерации бота
            
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
    
    return
    # Валидация длины тттекста
    min_length = input_config.get("min_length", 0)
    max_length = input_config.get("max_length", 0)
    
    if min_length > 0 and len(user_text) < min_length:
        retry_message = input_config.get("retry_message", "Пожалуйста, яопробуйте еще раз.")
        await message.answer(f"❌ Слишком короткий ответ (минимум {min_length} символов). {retry_message}")
        return
    
    if max_length > 0 and len(user_text) > max_length:
        retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте ещя раз.")
        await message.answer(f"❌ Слишком длинный ответ (максимум {max_length} символов). {retry_message}")
        return
    
    # Валидация типа ввода
    input_type = input_config.get("type", "text")
    
    if input_type == "email":
        import re
        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_pattern, user_text):
            retry_message = input_config.get("retry_message", "Пожалуйсяа, яопрояуйте еще ряз.")
            await message.answer(f"❌ Неверный фярмат email. {retry_message}")
            return
    
    elif input_type == "number":
        try:
            float(user_text)
        except ValueError:
            retry_message = input_config.get("retry_message", "Пожалуйста, пояробуйтя еще раз.")
            await message.answer(f"❌ Введите корректное чясло. {retry_message}")
            return
    
    elif input_type == "phone":
        import re
        phone_pattern = r"^[+]?[0-9\s\-\(\)]{10,}$"
        if not re.match(phone_pattern, user_text):
            retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще ряз.")
            await message.answer(f"❌ Неверный формат телефона. {retry_message}")
            return
    
    # Сохраняея ответ пользователя простым значением
    variable_name = input_config.get("variable", "user_response")
    timestamp = get_moscow_time()
    node_id = input_config.get("node_id", "unknown")
    
    # Простое значение вместо сложного объекта
    response_data = user_text
    
    # Сохраняем в пользовательские данные
    user_data[user_id][variable_name] = response_data
    
    # Сохраняем в базу данных если включено
    if input_config.get("save_to_database"):
        saved_to_db = await update_user_data_in_db(user_id, variable_name, response_data)
        if saved_to_db:
            logging.info(f"✅ Данные сохранены в БД: {variable_name} = {user_text} (пользователь {user_id})")
        else:
            logging.warning(f"⚠️ Не удалось сохранить в яД, данные сохранены ляякально")
    
    # Отправляем сообщение об успехе только если оно задано
    success_message = input_config.get("success_message", "")
    if success_message:
        await message.answer(success_message)
    
    # Очищаем состояние ожидания ввода
    del user_data[user_id]["waiting_for_input"]
    
    logging.info(f"Получея пользовательский ввод: {variable_name} = {user_text}")
    
    # Автоматическая навигация к следующему узлу после успешного ввода
    next_node_id = input_config.get("next_node_id")
    logging.info(f"🔄 Проверяям навияяяяацию: next_node_id = {next_node_id}")
    if next_node_id:
        try:
            logging.info(f"🚀 Переходим к следующему узлу: {next_node_id}")
            
            # Создаем фейковое сообщение для навигации
            fake_message = type("FakeMessage", (), {})()
            fake_message.from_user = message.from_user
            fake_message.answer = message.answer
            fake_message.delete = lambda: None
            
            # Находим узел по ID и выполняем соответствующее действие
            if next_node_id == "start":
                logging.info(f"Переход к узлу start типа start")
            elif next_node_id == "f90r9k3FSLu2Tjn74cBn_":
                text = "Теперь определимся с полом"
                builder = ReplyKeyboardBuilder()
                builder.add(KeyboardButton(text="Я девушка"))
                builder.add(KeyboardButton(text="Я парень"))
                keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
                await fake_message.answer(text, reply_markup=keyboard)
                user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
                user_data[message.from_user.id]["waiting_for_input"] = {
                    "type": "button",
                    "modes": ["button", "text"],
                    "variable": "gender",
                    "save_to_database": True,
                    "node_id": "f90r9k3FSLu2Tjn74cBn_",
                    "next_node_id": "",
                    "min_length": 0,
                    "max_length": 0,
                    "retry_message": "Пожалуйста, попробуйте еще раз.",
                    "success_message": ""
                }
                logging.info(f"✅ Состояние ожидания настроено: modes=['button', 'text'] для переменной gender (узел f90r9k3FSLu2Tjn74cBn_)")
            elif next_node_id == "RFTgm4KzC6dI39AMTPcmo":
                text = "Кто тебе интересен?"
                builder = ReplyKeyboardBuilder()
                builder.add(KeyboardButton(text="Девушки"))
                builder.add(KeyboardButton(text="Парни"))
                builder.add(KeyboardButton(text="Все равно"))
                keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
                await fake_message.answer(text, reply_markup=keyboard)
                user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
                user_data[message.from_user.id]["waiting_for_input"] = {
                    "type": "button",
                    "modes": ["button", "text"],
                    "variable": "sex",
                    "save_to_database": True,
                    "node_id": "RFTgm4KzC6dI39AMTPcmo",
                    "next_node_id": "",
                    "min_length": 0,
                    "max_length": 0,
                    "retry_message": "Пожалуйста, попробуйте еще раз.",
                    "success_message": ""
                }
                logging.info(f"✅ Состояние ожидания настроено: modes=['button', 'text'] для переменной sex (узел RFTgm4KzC6dI39AMTPcmo)")
            elif next_node_id == "sIh3xXKEtb_TtrhHqZQzX":
                # Проверяем усяяяяовные сообщения
                text = None
                
                # Получаем данные пользователя для проверки условий
                user_record = await get_user_from_db(user_id)
                if not user_record:
                    user_record = user_data.get(user_id, {})
                
                # Безопасно извлекаем user_data
                if isinstance(user_record, dict):
                    if "user_data" in user_record and isinstance(user_record["user_data"], dict):
                        user_data_dict = user_record["user_data"]
                    else:
                        user_data_dict = user_record
                else:
                    user_data_dict = {}
                
                # Инициализируем базовые переменные пользователя если их нет
                if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
                    # Получаем объект пользователя из сообщения или callback
                    user_obj = None
                    # Проверяем наличие message (для message handlers)
                    if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
                        user_obj = locals().get('message').from_user
                    # Проверяем наличие callback_query (для callback handlers)
                    elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
                        user_obj = locals().get('callback_query').from_user
                    
                    if user_obj:
                        init_user_variables(user_id, user_obj)
                
                # Подставляем все доступные переменные пользователя в текст кнопок
                user_vars = await get_user_from_db(user_id)
                if not user_vars:
                    user_vars = user_data.get(user_id, {})
                
                # get_user_from_db теперь возвращает уже обработанные user_data
                if not isinstance(user_vars, dict):
                    user_vars = {}
                
                # Заменяем все переменные в тексте
                import re
                def replace_variables_in_text(text_content, variables_dict):
                    if not text_content or not variables_dict:
                        return text_content
                    
                    for var_name, var_data in variables_dict.items():
                        placeholder = "{" + var_name + "}"
                        if placeholder in text_content:
                            if isinstance(var_data, dict) and "value" in var_data:
                                var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                            elif var_data is not None:
                                var_value = str(var_data)
                            else:
                                var_value = var_name  # Показываем имя переменной если значения нет
                            text_content = text_content.replace(placeholder, var_value)
                    return text_content
                
                # Функция для проверки переменных пользователя
                def check_user_variable(var_name, user_data_dict):
                    """Проверяет существование и получает значение переменной пользователя"""
                    # Сначала проверяем в поле user_data (из БД)
                    if "user_data" in user_data_dict and user_data_dict["user_data"]:
                        try:
                            import json
                            parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                            if var_name in parsed_data:
                                raw_value = parsed_data[var_name]
                                if isinstance(raw_value, dict) and "value" in raw_value:
                                    var_value = raw_value["value"]
                                    # Проверяем, что значение действительно существует и не пустое
                                    if var_value is not None and str(var_value).strip() != "":
                                        return True, str(var_value)
                                else:
                                    # Проверяем, что значение действительно существует и не пустое
                                    if raw_value is not None and str(raw_value).strip() != "":
                                        return True, str(raw_value)
                        except (json.JSONDecodeError, TypeError):
                            pass
                    
                    # Проверяем в локальных данных (без вложенности user_data)
                    if var_name in user_data_dict:
                        variable_data = user_data_dict.get(var_name)
                        if isinstance(variable_data, dict) and "value" in variable_data:
                            var_value = variable_data["value"]
                            # Проверяем, что значение действительно существует и не пустое
                            if var_value is not None and str(var_value).strip() != "":
                                return True, str(var_value)
                        elif variable_data is not None and str(variable_data).strip() != "":
                            return True, str(variable_data)
                    
                    # Дополнительная проверка: если переменная не найдена напрямую, проверяем, не является ли она частью user_data в другом формате
                    # Это может случиться, если переменная была сохранена в формате, отличном от ожидаемого
                    if "user_data" in user_data_dict and isinstance(user_data_dict["user_data"], dict):
                        nested_data = user_data_dict["user_data"]
                        if var_name in nested_data:
                            raw_value = nested_data[var_name]
                            if isinstance(raw_value, dict) and "value" in raw_value:
                                var_value = raw_value["value"]
                                # Проверяем, что значение действительно существует и не пустое
                                if var_value is not None and str(var_value).strip() != "":
                                    return True, str(var_value)
                            else:
                                # Проверяем, что значение действительно существует и не пустое
                                if raw_value is not None and str(raw_value).strip() != "":
                                    return True, str(raw_value)
                    
                    return False, None
                
                # Условие 1: user_data_exists для переменных: city
                if (
                    check_user_variable("city", user_data_dict)[0]
                ):
                    # Собираем значения переменных
                    variable_values = {}
                    _, variable_values["city"] = check_user_variable("city", user_data_dict)
                    # Условное сообщение пустое, используем основной текст узла (text уже инициализирован)
                    conditional_parse_mode = None
                    if "{city}" in text and variable_values["city"] is not None:
                        text = text.replace("{city}", variable_values["city"])
                    # Создаем reply клавиатуру для условного сообщения
                    builder = ReplyKeyboardBuilder()
                    builder.add(KeyboardButton(text=replace_variables_in_text("{city}", user_vars)))
                    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
                    conditional_keyboard = keyboard
                    # ВАЖНО: Логируем состояние условной клавиатуры для отладки
                    logging.info(f"🎹 Условная клавиатура для user_data_exists: conditional_keyboard={'установлена' if conditional_keyboard else 'не установлена'}")
                    # Настраиваем ожидание текстового ввода для условного сообщения
                    conditional_message_config = {
                        "condition_id": "cond-city-1",
                        "wait_for_input": True,
                        "input_variable": "city",
                        "next_node_id": "tS2XGL2Mn4LkE63SnxhPy",
                        "source_type": "conditional_message",
                        "skip_buttons": []
                    }
                    # Настраиваем ожидание ввода для условного сообщения с waitForTextInput
                    if conditional_message_config and conditional_message_config.get("wait_for_input"):
                        if user_id not in user_data:
                            user_data[user_id] = {}
                        user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config
                        logging.info(f"Активировано ожидание условного ввода (переменная существует, но ждём новое значение): {conditional_message_config}")
                        # ВАЖНО: Переменная существует, но waitForTextInput=true, поэтому НЕ делаем автопереход
                        # Сбрасываем флаг условия чтобы fallback показал сообщение и дождался ввода
                        # НО мы уже установили waiting_for_conditional_input, так что НЕ нужно делать break
                    logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
                else:
                    text = "Из какого ты города?"
                    logging.info("Используется основное сообщение узла")
                
                # Используем parse_mode условного сообщения если он установлен
                if "conditional_parse_mode" in locals() and conditional_parse_mode is not None:
                    parse_mode = conditional_parse_mode
                else:
                    parse_mode = None
                await message.answer(text, parse_mode=parse_mode)
            elif next_node_id == "tS2XGL2Mn4LkE63SnxhPy":
                # Проверяем усяяяяовные сообщения
                text = None
                
                # Получаем данные пользователя для проверки условий
                user_record = await get_user_from_db(user_id)
                if not user_record:
                    user_record = user_data.get(user_id, {})
                
                # Безопасно извлекаем user_data
                if isinstance(user_record, dict):
                    if "user_data" in user_record and isinstance(user_record["user_data"], dict):
                        user_data_dict = user_record["user_data"]
                    else:
                        user_data_dict = user_record
                else:
                    user_data_dict = {}
                
                # Инициализируем базовые переменные пользователя если их нет
                if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
                    # Получаем объект пользователя из сообщения или callback
                    user_obj = None
                    # Проверяем наличие message (для message handlers)
                    if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
                        user_obj = locals().get('message').from_user
                    # Проверяем наличие callback_query (для callback handlers)
                    elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
                        user_obj = locals().get('callback_query').from_user
                    
                    if user_obj:
                        init_user_variables(user_id, user_obj)
                
                # Подставляем все доступные переменные пользователя в текст кнопок
                user_vars = await get_user_from_db(user_id)
                if not user_vars:
                    user_vars = user_data.get(user_id, {})
                
                # get_user_from_db теперь возвращает уже обработанные user_data
                if not isinstance(user_vars, dict):
                    user_vars = {}
                
                # Заменяем все переменные в тексте
                import re
                def replace_variables_in_text(text_content, variables_dict):
                    if not text_content or not variables_dict:
                        return text_content
                    
                    for var_name, var_data in variables_dict.items():
                        placeholder = "{" + var_name + "}"
                        if placeholder in text_content:
                            if isinstance(var_data, dict) and "value" in var_data:
                                var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                            elif var_data is not None:
                                var_value = str(var_data)
                            else:
                                var_value = var_name  # Показываем имя переменной если значения нет
                            text_content = text_content.replace(placeholder, var_value)
                    return text_content
                
                # Функция для проверки переменных пользователя
                def check_user_variable(var_name, user_data_dict):
                    """Проверяет существование и получает значение переменной пользователя"""
                    # Сначала проверяем в поле user_data (из БД)
                    if "user_data" in user_data_dict and user_data_dict["user_data"]:
                        try:
                            import json
                            parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                            if var_name in parsed_data:
                                raw_value = parsed_data[var_name]
                                if isinstance(raw_value, dict) and "value" in raw_value:
                                    var_value = raw_value["value"]
                                    # Проверяем, что значение действительно существует и не пустое
                                    if var_value is not None and str(var_value).strip() != "":
                                        return True, str(var_value)
                                else:
                                    # Проверяем, что значение действительно существует и не пустое
                                    if raw_value is not None and str(raw_value).strip() != "":
                                        return True, str(raw_value)
                        except (json.JSONDecodeError, TypeError):
                            pass
                    
                    # Проверяем в локальных данных (без вложенности user_data)
                    if var_name in user_data_dict:
                        variable_data = user_data_dict.get(var_name)
                        if isinstance(variable_data, dict) and "value" in variable_data:
                            var_value = variable_data["value"]
                            # Проверяем, что значение действительно существует и не пустое
                            if var_value is not None and str(var_value).strip() != "":
                                return True, str(var_value)
                        elif variable_data is not None and str(variable_data).strip() != "":
                            return True, str(variable_data)
                    
                    # Дополнительная проверка: если переменная не найдена напрямую, проверяем, не является ли она частью user_data в другом формате
                    # Это может случиться, если переменная была сохранена в формате, отличном от ожидаемого
                    if "user_data" in user_data_dict and isinstance(user_data_dict["user_data"], dict):
                        nested_data = user_data_dict["user_data"]
                        if var_name in nested_data:
                            raw_value = nested_data[var_name]
                            if isinstance(raw_value, dict) and "value" in raw_value:
                                var_value = raw_value["value"]
                                # Проверяем, что значение действительно существует и не пустое
                                if var_value is not None and str(var_value).strip() != "":
                                    return True, str(var_value)
                            else:
                                # Проверяем, что значение действительно существует и не пустое
                                if raw_value is not None and str(raw_value).strip() != "":
                                    return True, str(raw_value)
                    
                    return False, None
                
                # Условие 1: user_data_exists для переменных: name
                if (
                    check_user_variable("name", user_data_dict)[0]
                ):
                    # Собираем значения переменных
                    variable_values = {}
                    _, variable_values["name"] = check_user_variable("name", user_data_dict)
                    # Условное сообщение пустое, используем основной текст узла (text уже инициализирован)
                    conditional_parse_mode = None
                    if "{name}" in text and variable_values["name"] is not None:
                        text = text.replace("{name}", variable_values["name"])
                    # Создаем reply клавиатуру для условного сообщения
                    builder = ReplyKeyboardBuilder()
                    builder.add(KeyboardButton(text=replace_variables_in_text("{name}", user_vars)))
                    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
                    conditional_keyboard = keyboard
                    # ВАЖНО: Логируем состояние условной клавиатуры для отладки
                    logging.info(f"🎹 Условная клавиатура для user_data_exists: conditional_keyboard={'установлена' if conditional_keyboard else 'не установлена'}")
                    # Настраиваем ожидание текстового ввода для условного сообщения
                    conditional_message_config = {
                        "condition_id": "cond-name-1",
                        "wait_for_input": True,
                        "input_variable": "name",
                        "next_node_id": "lBPy3gcGVLla0NGdSYb35",
                        "source_type": "conditional_message",
                        "skip_buttons": []
                    }
                    # Настраиваем ожидание ввода для условного сообщения с waitForTextInput
                    if conditional_message_config and conditional_message_config.get("wait_for_input"):
                        if user_id not in user_data:
                            user_data[user_id] = {}
                        user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config
                        logging.info(f"Активировано ожидание условного ввода (переменная существует, но ждём новое значение): {conditional_message_config}")
                        # ВАЖНО: Переменная существует, но waitForTextInput=true, поэтому НЕ делаем автопереход
                        # Сбрасываем флаг условия чтобы fallback показал сообщение и дождался ввода
                        # НО мы уже установили waiting_for_conditional_input, так что НЕ нужно делать break
                    logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
                else:
                    text = "Как мне тебя называть?"
                    logging.info("Используется основное сообщение узла")
                
                # Используем parse_mode условного сообщения если он установлен
                if "conditional_parse_mode" in locals() and conditional_parse_mode is not None:
                    parse_mode = conditional_parse_mode
                else:
                    parse_mode = None
                await message.answer(text, parse_mode=parse_mode)
            elif next_node_id == "lBPy3gcGVLla0NGdSYb35":
                text = "Расскажи о себе и кого хочешь найти, чем предлагаешь заняться. Это поможет лучше подобрать тебе компанию."
                builder = ReplyKeyboardBuilder()
                builder.add(KeyboardButton(text="Пропустить"))
                keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
                await fake_message.answer(text, reply_markup=keyboard)
                user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
                user_data[message.from_user.id]["waiting_for_input"] = {
                    "type": "button",
                    "modes": ["button", "text"],
                    "variable": "info",
                    "save_to_database": True,
                    "node_id": "lBPy3gcGVLla0NGdSYb35",
                    "next_node_id": "Y9zLRp1BLpVhm-HcsNkJV",
                    "min_length": 0,
                    "max_length": 0,
                    "retry_message": "Пожалуйста, попробуйте еще раз.",
                    "success_message": ""
                }
                logging.info(f"✅ Состояние ожидания настроено: modes=['button', 'text'] для переменной info (узел lBPy3gcGVLla0NGdSYb35)")
            elif next_node_id == "Y9zLRp1BLpVhm-HcsNkJV":
                # Проверяем усяяяяовные сообщения
                text = None
                
                # Получаем данные пользователя для проверки условий
                user_record = await get_user_from_db(user_id)
                if not user_record:
                    user_record = user_data.get(user_id, {})
                
                # Безопасно извлекаем user_data
                if isinstance(user_record, dict):
                    if "user_data" in user_record and isinstance(user_record["user_data"], dict):
                        user_data_dict = user_record["user_data"]
                    else:
                        user_data_dict = user_record
                else:
                    user_data_dict = {}
                
                # Инициализируем базовые переменные пользователя если их нет
                if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
                    # Получаем объект пользователя из сообщения или callback
                    user_obj = None
                    # Проверяем наличие message (для message handlers)
                    if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
                        user_obj = locals().get('message').from_user
                    # Проверяем наличие callback_query (для callback handlers)
                    elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
                        user_obj = locals().get('callback_query').from_user
                    
                    if user_obj:
                        init_user_variables(user_id, user_obj)
                
                # Подставляем все доступные переменные пользователя в текст кнопок
                user_vars = await get_user_from_db(user_id)
                if not user_vars:
                    user_vars = user_data.get(user_id, {})
                
                # get_user_from_db теперь возвращает уже обработанные user_data
                if not isinstance(user_vars, dict):
                    user_vars = {}
                
                # Заменяем все переменные в тексте
                import re
                def replace_variables_in_text(text_content, variables_dict):
                    if not text_content or not variables_dict:
                        return text_content
                    
                    for var_name, var_data in variables_dict.items():
                        placeholder = "{" + var_name + "}"
                        if placeholder in text_content:
                            if isinstance(var_data, dict) and "value" in var_data:
                                var_value = str(var_data["value"]) if var_data["value"] is not None else var_name
                            elif var_data is not None:
                                var_value = str(var_data)
                            else:
                                var_value = var_name  # Показываем имя переменной если значения нет
                            text_content = text_content.replace(placeholder, var_value)
                    return text_content
                
                # Функция для проверки переменных пользователя
                def check_user_variable(var_name, user_data_dict):
                    """Проверяет существование и получает значение переменной пользователя"""
                    # Сначала проверяем в поле user_data (из БД)
                    if "user_data" in user_data_dict and user_data_dict["user_data"]:
                        try:
                            import json
                            parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                            if var_name in parsed_data:
                                raw_value = parsed_data[var_name]
                                if isinstance(raw_value, dict) and "value" in raw_value:
                                    var_value = raw_value["value"]
                                    # Проверяем, что значение действительно существует и не пустое
                                    if var_value is not None and str(var_value).strip() != "":
                                        return True, str(var_value)
                                else:
                                    # Проверяем, что значение действительно существует и не пустое
                                    if raw_value is not None and str(raw_value).strip() != "":
                                        return True, str(raw_value)
                        except (json.JSONDecodeError, TypeError):
                            pass
                    
                    # Проверяем в локальных данных (без вложенности user_data)
                    if var_name in user_data_dict:
                        variable_data = user_data_dict.get(var_name)
                        if isinstance(variable_data, dict) and "value" in variable_data:
                            var_value = variable_data["value"]
                            # Проверяем, что значение действительно существует и не пустое
                            if var_value is not None and str(var_value).strip() != "":
                                return True, str(var_value)
                        elif variable_data is not None and str(variable_data).strip() != "":
                            return True, str(variable_data)
                    
                    # Дополнительная проверка: если переменная не найдена напрямую, проверяем, не является ли она частью user_data в другом формате
                    # Это может случиться, если переменная была сохранена в формате, отличном от ожидаемого
                    if "user_data" in user_data_dict and isinstance(user_data_dict["user_data"], dict):
                        nested_data = user_data_dict["user_data"]
                        if var_name in nested_data:
                            raw_value = nested_data[var_name]
                            if isinstance(raw_value, dict) and "value" in raw_value:
                                var_value = raw_value["value"]
                                # Проверяем, что значение действительно существует и не пустое
                                if var_value is not None and str(var_value).strip() != "":
                                    return True, str(var_value)
                            else:
                                # Проверяем, что значение действительно существует и не пустое
                                if raw_value is not None and str(raw_value).strip() != "":
                                    return True, str(raw_value)
                    
                    return False, None
                
                # Условие 1: user_data_exists для переменных: photo
                if (
                    check_user_variable("photo", user_data_dict)[0]
                ):
                    # Собираем значения переменных
                    variable_values = {}
                    _, variable_values["photo"] = check_user_variable("photo", user_data_dict)
                    # Условное сообщение пустое, используем основной текст узла (text уже инициализирован)
                    conditional_parse_mode = None
                    if "{photo}" in text and variable_values["photo"] is not None:
                        text = text.replace("{photo}", variable_values["photo"])
                    # Создаем reply клавиатуру для условного сообщения
                    builder = ReplyKeyboardBuilder()
                    builder.add(KeyboardButton(text="Оставить текущее"))
                    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
                    conditional_keyboard = keyboard
                    # ВАЖНО: Логируем состояние условной клавиатуры для отладки
                    logging.info(f"🎹 Условная клавиатура для user_data_exists: conditional_keyboard={'установлена' if conditional_keyboard else 'не установлена'}")
                    # Настраиваем ожидание текстового ввода для условного сообщения
                    conditional_message_config = {
                        "condition_id": "cond-photo-1",
                        "wait_for_input": False,
                        "input_variable": "photo",
                        "next_node_id": "",
                        "source_type": "conditional_message",
                        "skip_buttons": [{"text":"Оставить текущее","target":"vxPv7G4n0QGyhnv4ucOM5"}]
                    }
                    # Настраиваем ожидание ввода для условного сообщения с waitForTextInput
                    # Сохраняем skip_buttons для проверки в текстовом обработчике (для медиа-узлов)
                    if user_id not in user_data:
                        user_data[user_id] = {}
                    user_data[user_id]["pending_skip_buttons"] = [{"text":"Оставить текущее","target":"vxPv7G4n0QGyhnv4ucOM5"}]
                    logging.info(f"📌 Сохранены pending_skip_buttons для медиа-узла: {user_data[user_id]['pending_skip_buttons']}")
                    logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
                else:
                    text = "Теперь пришли фото или запиши видео 👍 (до 15 сек), его будут видеть другие пользователи"
                    logging.info("Используется основное сообщение узла")
                
                # Используем parse_mode условного сообщения если он установлен
                if "conditional_parse_mode" in locals() and conditional_parse_mode is not None:
                    parse_mode = conditional_parse_mode
                else:
                    parse_mode = None
                await message.answer(text, parse_mode=parse_mode)
            elif next_node_id == "vxPv7G4n0QGyhnv4ucOM5":
                text = "Так выглядит твоя анкета:"
                # Используем parse_mode условного сообщения если он установлен
                if "conditional_parse_mode" in locals() and conditional_parse_mode is not None:
                    parse_mode = conditional_parse_mode
                else:
                    parse_mode = None
                await message.answer(text, parse_mode=parse_mode)
            elif next_node_id == "8xSJaWAJNz7Hz_54mjFTF":
                text = """
{name}, {age}, {city} - {info}
"""
                # Используем parse_mode условного сообщения если он установлен
                if "conditional_parse_mode" in locals() and conditional_parse_mode is not None:
                    parse_mode = conditional_parse_mode
                else:
                    parse_mode = None
                await message.answer(text, parse_mode=parse_mode)
            elif next_node_id == "KE-8sR9elPEefApjXtBxC":
                text = "Все верно?"
                builder = ReplyKeyboardBuilder()
                builder.add(KeyboardButton(text="Да"))
                builder.add(KeyboardButton(text="Изменить анкету"))
                keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
                await fake_message.answer(text, reply_markup=keyboard)
            elif next_node_id == "yrsc8v81qQa5oQx538Dzn":
                text = """1. Смотреть анкеты.
2. Заполнить анкету заново.
3. Изменить фото/видео.
4. Изменить текст анкеты."""
                builder = ReplyKeyboardBuilder()
                builder.add(KeyboardButton(text="1"))
                builder.add(KeyboardButton(text="2"))
                builder.add(KeyboardButton(text="3"))
                builder.add(KeyboardButton(text="4"))
                keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
                await fake_message.answer(text, reply_markup=keyboard)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")



# Обработчики для работы с группами
from datetime import datetime, timezone
import json

# Конфигурация групп из параметров генерации
CONNECTED_GROUPS = {}

@dp.message(F.chat.type.in_(["group", "supergroup"]))
async def handle_group_message(message: types.Message):
    """
    Обработчик сообщений в группах
    """
    chat_id = message.chat.id
    user_id = message.from_user.id
    username = message.from_user.username or "Неизвестный"
    
    # Проверяем, является ли группа подключенной
    group_name = None
    for name, config in CONNECTED_GROUPS.items():
        if config.get("id") and str(config["id"]) == str(chat_id):
            group_name = name
            break
    
    if group_name:
        logging.info(f"📢 Сообщение в подключенной группе {group_name}: {message.text[:50]}... от @{username}")
        
        # Здесь можно добавить логику обработки групповых сообщений
        # Например, модерация, автоответы, статистика и т.д.
        
        # Сохраняем статистику сообщений
        try:
            await save_group_message_stats(chat_id, user_id, message.text, group_name)
        except Exception as e:
            logging.error(f"Ошибка сохранения статистики группы: {e}")
    
# Функция для сохранения статистики групповых сообщений
async def save_group_message_stats(chat_id: int, user_id: int, message_text: str, group_name: str):
    """
    Сохраняет статистику сообщений в группе
    """
    try:
        # Вызываем общую функцию сохранения статистики сообщений пользователя
        await save_user_message_stats(user_id, message_text)

        # Логируем статистику для мониторинга
        logging.info(f"📊 Статистика группы {group_name}: пользователь {user_id}, длина сообщения: {len(message_text or '')}")
        
        # Здесь можно добавить специфичную для групп логику сохранения
        # например, в отдельную таблицу group_activity если она существует
        try:
            # Проверяем существование таблицы group_activity
            # Этот код выполнится только если таблица существует
            if 'db_pool' in globals() and db_pool:
                async with db_pool.acquire() as conn:
                    await conn.execute("""
                        INSERT INTO group_activity (chat_id, user_id, message_length, group_name, created_at) 
                        VALUES ($1, $2, $3, $4, $5)
                        ON CONFLICT DO NOTHING
                    """, chat_id, user_id, len(message_text or ""), group_name, datetime.now(timezone.utc))
        except Exception as table_error:
            # Если таблица не существует, просто логируем и продолжаем
            logging.debug(f"Таблица group_activity не найдена: {table_error}")
            
    except Exception as e:
        logging.error(f"Ошибка при сохранении статистики группы: {e}")
    
# Добавляем обработчик новых участников в группе
@dp.message(F.new_chat_members)
async def handle_new_member(message: types.Message):
    """
    Обработчик новых участников в группе
    """
    chat_id = message.chat.id
    
    # Проверяем, является ли группа подключенной
    group_name = None
    for name, config in CONNECTED_GROUPS.items():
        if config.get("id") and str(config["id"]) == str(chat_id):
            group_name = name
            break
    
    if group_name:
        for new_member in message.new_chat_members:
            username = new_member.username or new_member.first_name or "Новый участник"
            logging.info(f"👋 Новый участник в группе {group_name}: @{username}")
            
            # Приветственное сообщение (опционально)
            # await message.answer(f"Добро пожаловать в группу, @{username}!")
            
            # Здесь можно добавить логику обработки новых участников
            # Например, отправка приветственного сообщения, добавление в базу и т.д.

# Обработчик ухода участников из группы
@dp.message(F.left_chat_member)
async def handle_left_member(message: types.Message):
    """
    Обработчик ухода участников из группы
    """
    chat_id = message.chat.id
    
    # Проверяем, является ли группа подключенной
    group_name = None
    for name, config in CONNECTED_GROUPS.items():
        if config.get("id") and str(config["id"]) == str(chat_id):
            group_name = name
            break
    
    if group_name:
        left_member = message.left_chat_member
        username = left_member.username or left_member.first_name or "Участник"
        logging.info(f"👋 Участник покинул группу {group_name}: @{username}")

# Функция для проверки прав администратора бота в группе
async def check_bot_admin_rights(chat_id: int, group_name: str) -> bool:
    """
    Проверяет, является ли бот администратором группы
    """
    try:
        chat_member = await bot.get_chat_member(chat_id, bot.id)
        return chat_member.status in ['administrator', 'creator']
    except Exception as e:
        logging.error(f"Ошибка при проверке прав бота в группе {group_name}: {e}")
        return False

# Функция для отправки сообщения в группу от имени бота
async def send_group_message(chat_id: int, text: str, group_name: str = None) -> bool:
    """
    Отправляет сообщение в группу
    """
    try:
        if not group_name:
            # Определяем название группы если не передано
            for name, config in CONNECTED_GROUPS.items():
                if config.get("id") and str(config["id"]) == str(chat_id):
                    group_name = name
                    break
        
        # Проверяем права бота
        if not await check_bot_admin_rights(chat_id, group_name):
            logging.warning(f"Бот не имеет прав администратора в группе {group_name}")
            return False
        
        await bot.send_message(chat_id, text)
        logging.info(f"✅ Сообщение отправлено в группу {group_name}")
        return True
        
    except Exception as e:
        logging.error(f"Ошибка при отправке сообщения в группу {group_name}: {e}")
        return False


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
        dp.callback_query.middleware(callback_query_logging_middleware)
        
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
        return
    
if __name__ == "__main__":
    asyncio.run(main())
