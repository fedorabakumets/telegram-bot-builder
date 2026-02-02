"""
Новый бот 2 - Telegram Bot
Сгенерировано с помощью TelegramBot Builder

Команды для @BotFather:
start - Приветствие и источник
help - Справка по боту"""

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

async def handle_command_help(message):
    """Алиас для help_handler, используется в callback обработчиках"""
    await help_handler(message)

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
        # Команда help - Справка по боту
        BotCommand(command="help", description="Справка по боту"),
    ]
# Устанавливаем команды для бота
    await bot.set_my_commands(commands)


# Обработчики узлов с медиа-контентом

@dp.callback_query(lambda c: c.data == "join_request" or c.data.startswith("join_request_btn_"))
async def handle_callback_join_request(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
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
    user_vars = await get_user_from_db(user_id)
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="Да 😎", callback_data="IJy7vodBCGvM6sa2ykkf8"))
    builder.adjust(1)
    keyboard = builder.as_markup()
    # Сохраняем imageUrl в переменную image_url_join_request
    user_id = callback_query.from_user.id
    user_data[user_id] = user_data.get(user_id, {})
    user_data[user_id]["image_url_join_request"] = "https://img.freepik.com/free-photo/cartoon-style-hugging-day-celebration_23-2151033271.jpg"
    await update_user_data_in_db(user_id, "image_url_join_request", "https://img.freepik.com/free-photo/cartoon-style-hugging-day-celebration_23-2151033271.jpg")
    # Отправляем изображение с текстом
    try:
        processed_caption = replace_variables_in_text(text, user_vars)
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="Да 😎", callback_data="IJy7vodBCGvM6sa2ykkf8"))
        builder.adjust(1)
        keyboard = builder.as_markup()
        await bot.send_photo(callback_query.from_user.id, "https://img.freepik.com/free-photo/cartoon-style-hugging-day-celebration_23-2151033271.jpg", caption=processed_caption, reply_markup=keyboard)
    except Exception as e:
        logging.error(f"Ошибка отправки изображения: {e}")
        logging.error(f"URL изображения: https://img.freepik.com/free-photo/cartoon-style-hugging-day-celebration_23-2151033271.jpg")
        logging.error(f"Тип ошибки: {type(e).__name__}")
        # Fallback на обычное сообщение
        await safe_edit_or_send(callback_query, processed_caption)


@dp.message(Command("/help"))
async def help_handler(message: types.Message):
    user_id = message.from_user.id
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, message.from_user)
    
    text = """🤖 Доступные команды:

/start - Начать работу
/help - Эта справка

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
    user_vars = await get_user_from_db(user_id)
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    
    keyboard = None
    # Сохраняем imageUrl в переменную image_url_IJy7vodBCGvM6sa2ykkf8
    user_id = message.from_user.id
    user_data[user_id] = user_data.get(user_id, {})
    user_data[user_id]["image_url_IJy7vodBCGvM6sa2ykkf8"] = "https://img.freepik.com/free-photo/cartoon-style-hugging-day-celebration_23-2151033271.jpg"
    await update_user_data_in_db(user_id, "image_url_IJy7vodBCGvM6sa2ykkf8", "https://img.freepik.com/free-photo/cartoon-style-hugging-day-celebration_23-2151033271.jpg")
    # Отправляем изображение с текстом
    try:
        processed_caption = replace_variables_in_text(text, user_vars)
        await bot.send_photo(message.chat.id, "https://img.freepik.com/free-photo/cartoon-style-hugging-day-celebration_23-2151033271.jpg", caption=processed_caption)
    except Exception as e:
        logging.error(f"Ошибка отправки изображения: {e}")
        logging.error(f"URL изображения: https://img.freepik.com/free-photo/cartoon-style-hugging-day-celebration_23-2151033271.jpg")
        logging.error(f"Тип ошибки: {type(e).__name__}")
        # Fallback на обычное сообщение
        await message.answer(processed_caption)


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
    text = """🌟 Привет от ᴠᴨᴩᴏᴦʏᴧᴋᴇ Bot!

Этот бот поможет тебе найти интересных людей в Санкт-Петербурге!

Откуда ты узнал о нашем чате? 😎"""
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
    has_input_collection = True
    logging.info(f"DEBUG: generateKeyboard для узла start - hasRegularButtons={has_regular_buttons}, hasInputCollection={has_input_collection}, collectUserInput=true, enableTextInput=true, enablePhotoInput=undefined, enableVideoInput=undefined, enableAudioInput=undefined, enableDocumentInput=undefined")
    
    await message.answer(text)
    
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
    # Обработчик для узла join_request с медиа-контентом уже сгенерирован
# @@NODE_END:join_request@@

# @@NODE_START:IJy7vodBCGvM6sa2ykkf8@@
    # Обработчик для узла IJy7vodBCGvM6sa2ykkf8 с медиа-контентом уже сгенерирован
# @@NODE_END:IJy7vodBCGvM6sa2ykkf8@@

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

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "IJy7vodBCGvM6sa2ykkf8" or c.data.startswith("IJy7vodBCGvM6sa2ykkf8_btn_"))
async def handle_callback_IJy7vodBCGvM6sa2ykkf8(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_IJy7vodBCGvM6sa2ykkf8 для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_IJy7vodBCGvM6sa2ykkf8: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    # Обработка hideAfterClick не применяется в этом обработчике, так как он используется для специальных кнопок
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    button_text = "Да 😎"
    
    await update_user_data_in_db(user_id, "join_request_response", button_text)
    logging.info(f"Переменная join_request_response сохранена: " + str(button_text) + f" (пользователь {user_id})")
    
    # Очищаем состояние ожидания ввода для этой переменной
    if user_id in user_data:
        # Удаляем waiting_for_input чтобы текстовый обработчик не перезаписал данные
        if "waiting_for_input" in user_data[user_id]:
            if user_data[user_id]["waiting_for_input"] == "join_request":
                del user_data[user_id]["waiting_for_input"]
                logging.info(f"Состояние ожидания ввода очищено для переменной join_request_response (пользователь {user_id})")
    
    
    # Обрабатываем узел command: IJy7vodBCGvM6sa2ykkf8
    text = """🤖 Доступные команды:

/start - Начать работу
/help - Эта справка

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
    # Отправляем сообщение command узла без клавиатуры
    try:
        await safe_edit_or_send(callback_query, text, is_auto_transition=True)
    except Exception:
        await callback_query.message.answer(text)

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
    # Create inline keyboard
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="Да 😎", callback_data="IJy7vodBCGvM6sa2ykkf8_btn_0"))
    keyboard = builder.as_markup()
    
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
    # Проверяем наличие прикрепленного медиа из переменной image_url_join_request
    attached_media = None
    if user_vars and "image_url_join_request" in user_vars:
        media_data = user_vars["image_url_join_request"]
        if isinstance(media_data, dict) and "value" in media_data:
            attached_media = media_data["value"]
        elif isinstance(media_data, str):
            attached_media = media_data
    else:
        # Проверяем, есть ли медиа в переменных пользователя
        user_id = callback_query.from_user.id
        user_node_vars = user_data.get(user_id, {})
        if "image_url_join_request" in user_node_vars:
            attached_media = user_node_vars["image_url_join_request"]
    
    # Если медиа найдено, отправляем с медиа, иначе обычное сообщение
    if attached_media and str(attached_media).strip():
        logging.info(f"📎 Отправка photo медиа из переменной image_url_join_request: {attached_media}")
        try:
            # Заменяем переменные в тексте перед отправкой медиа
            processed_caption = replace_variables_in_text(text, user_vars)
            await bot.send_photo(callback_query.from_user.id, attached_media, caption=processed_caption, reply_markup=keyboard)
        except Exception as e:
            logging.error(f"Ошибка отправки photo: {e}")
            # Fallback на обычное сообщение при ошибке
            await safe_edit_or_send(callback_query, text, node_id="join_request", reply_markup=keyboard if keyboard is not None else None)
    else:
        # Медиа не найдено, отправляем обычное текстовое сообщение
        logging.info(f"📝 Медиа image_url_join_request не найдено, отправка текстового сообщения")
        # Заменяем переменные в тексте перед отправкой
        processed_text = replace_variables_in_text(text, user_vars)
        if True:
            # Узел ожидает ввод, не отправляем сообщение
            logging.info(f"ℹ️ Узел join_request ожидает ввод, пропускаем отправку сообщения")
        else:
            await safe_edit_or_send(callback_query, processed_text, node_id="join_request", reply_markup=keyboard if keyboard is not None else None)
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
    
    # ПЕРЕАДРЕСАЦИЯ: Переходим к следующему узлу после сояранения данных
    next_node_id = "IJy7vodBCGvM6sa2ykkf8"
    try:
        logging.info(f"🚀 Переходим к следующему узлу после выбора кнопки: {next_node_id}")
        if next_node_id == "start":
            logging.info("Переход к узлу start")
        elif next_node_id == "join_request":
            nav_text = "Хочешь присоединиться к нашему чату? 🚀"
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
            if nav_user_vars and "image_url_join_request" in nav_user_vars:
                media_data = nav_user_vars["image_url_join_request"]
                if isinstance(media_data, dict) and "value" in media_data:
                    nav_attached_media = media_data["value"]
                elif isinstance(media_data, str):
                    nav_attached_media = media_data
            if nav_attached_media and str(nav_attached_media).strip():
                logging.info(f"📎 Отправка фото из переменной image_url_join_request: {nav_attached_media}")
                await bot.send_photo(callback_query.from_user.id, nav_attached_media, caption=nav_text)
            else:
                logging.info("📝 Медиа не найдено, отправка текстового сообщения")
                await callback_query.message.edit_text(nav_text)
            # ИСПРАВЛЕНИЕ: Проверяем, не была ли переменная уже сохранена inline кнопкой
            user_id = callback_query.from_user.id
            if user_id not in user_data:
                user_data[user_id] = {}
            # Проверяем, не была ли переменная join_request_response уже сохранена
            if "join_request_response" not in user_data[user_id] or not user_data[user_id]["join_request_response"]:
                # Переменная не сохранена - используем универсальную функцию для настройки ожидания ввода
                # Тип ввода: text
                            user_data[callback_query.from_user.id] = user_data.get(callback_query.from_user.id, {})
                            user_data[callback_query.from_user.id]["waiting_for_input"] = {
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
            else:
                logging.info(f"⏭️ Переменная join_request_response уже сохранена, пропускаем ожидание ввода")
        elif next_node_id == "IJy7vodBCGvM6sa2ykkf8":
            # Выполняем команду /help
            from types import SimpleNamespace
            fake_message = SimpleNamespace()
            fake_message.from_user = callback_query.from_user
            fake_message.chat = callback_query.message.chat
            fake_message.date = callback_query.message.date
            fake_message.answer = callback_query.message.answer
            await help_handler(fake_message)
        else:
            logging.warning(f"Неизяяестный следующий узел: {next_node_id}")
    except Exception as e:
        logging.error(f"Ошибка при пяяяяреходе к следующему узлу {next_node_id}: {e}")
    
    return  # Завершаем обработку после переадресации
    
    # Удаляем старое сообщение
    
    text = "Хочешь присоединиться к нашему чату? 🚀"
    await bot.send_message(callback_query.from_user.id, text)
    # Настраиваем ожидание ввода (collectUserInput=true)
    user_data[callback_query.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "variable": "join_request_response",
        "save_to_database": False,
        "node_id": "join_request",
        "next_node_id": "IJy7vodBCGvM6sa2ykkf8"
    }
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
                elif skip_button_target == "IJy7vodBCGvM6sa2ykkf8":
                    await handle_callback_IJy7vodBCGvM6sa2ykkf8(fake_callback)
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
                        builder.add(InlineKeyboardButton(text="Да 😎", callback_data="IJy7vodBCGvM6sa2ykkf8"))
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
                        logging.info(f"✅ Сояяяятояние ожид��ния настроено: modes=['button'] для переменной join_request_response (узел join_request)")
                    elif next_node_id == "IJy7vodBCGvM6sa2ykkf8":
                        # Обычный узел - отправляем сообщение
                        text = """🤖 Доступные команды:

/start - Начать работу
/help - Эта справка

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
                        logging.info(f"Условная навигация к обычному узлу: IJy7vodBCGvM6sa2ykkf8")
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
                elif command == "/help":
                    try:
                        await _help_handler(fake_message)
                    except Exception as e:
                        logging.error(f"Ошибка выполнения команды /help: {e}")
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
                    elif target_node_id == "IJy7vodBCGvM6sa2ykkf8":
                        await handle_callback_IJy7vodBCGvM6sa2ykkf8(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
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
                        elif next_node_id == "IJy7vodBCGvM6sa2ykkf8":
                            await handle_callback_IJy7vodBCGvM6sa2ykkf8(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
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
                        elif skip_target == "IJy7vodBCGvM6sa2ykkf8":
                            await handle_callback_IJy7vodBCGvM6sa2ykkf8(fake_callback)
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
                            elif skip_target == "IJy7vodBCGvM6sa2ykkf8":
                                await handle_callback_IJy7vodBCGvM6sa2ykkf8(fake_callback)
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
                            # У узла есть inline кнопки - показываем их вместе с ожиданием ввода
                            builder = InlineKeyboardBuilder()
                            builder.add(InlineKeyboardButton(text="Да 😎", callback_data="IJy7vodBCGvM6sa2ykkf8"))
                            builder.adjust(1)
                            keyboard = builder.as_markup()
                            await message.answer(text, reply_markup=keyboard)
                            logging.info(f"✅ Показаны inline кнопки для узла join_request с collectUserInput (ожидание ввода активно)")
                        elif current_node_id == "IJy7vodBCGvM6sa2ykkf8":
                            # Выполняяем команду /help
                            from types import SimpleNamespace
                            fake_message = SimpleNamespace()
                            fake_message.from_user = message.from_user
                            fake_message.chat = message.chat
                            fake_message.date = message.date
                            fake_message.answer = message.answer
                            await help_handler(fake_message)
                            break  # Выходим из цикла после вяполяеняя команды
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
                
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="Да 😎", callback_data="IJy7vodBCGvM6sa2ykkf8"))
                builder.adjust(1)
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard)
                
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
                text = """🌟 Привет от ᴠᴨᴩᴏᴦʏᴧᴋᴇ Bot!

Этот бот поможет тебе найти интересных людей в Санкт-Петербурге!

Откуда ты узнал о нашем чате? 😎"""
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
            if input_target_node_id == "join_request":
                # Переход к узлу join_request
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
                builder.add(InlineKeyboardButton(text="Да 😎", callback_data="IJy7vodBCGvM6sa2ykkf8"))
                builder.adjust(1)
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard)
                logging.info(f"Переход к узлу join_request выполнен")
            if input_target_node_id == "IJy7vodBCGvM6sa2ykkf8":
                # Обычный узел - отправляем сообщение IJy7vodBCGvM6sa2ykkf8
                text = """🤖 Доступные команды:

/start - Начать работу
/help - Эта справка

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
                logging.info(f"✅ Навигация к обычному узлу IJy7vodBCGvM6sa2ykkf8 выполнена")
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
            elif next_node_id == "join_request":
                text = "Хочешь присоединиться к нашему чату? 🚀"
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="Да 😎", callback_data="IJy7vodBCGvM6sa2ykkf8"))
                keyboard = builder.as_markup()
                await fake_message.answer(text, reply_markup=keyboard)
            elif next_node_id == "IJy7vodBCGvM6sa2ykkf8":
                logging.info(f"Переход к узлу IJy7vodBCGvM6sa2ykkf8 типа command")
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
        # Проверяем существование функции сохранения статистики
        if 'save_user_message_stats' in globals():
            # Если функция существует, используем её для общей статистики
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
            print("🔌 Соединение с базой данных закрыто")
        
        # Закрываем сессию бота
        await bot.session.close()
        print("🔌 Сессия бота закрыта")
        print("✅ Бот корректно завершил работу")

        return
    
if __name__ == "__main__":
    asyncio.run(main())
