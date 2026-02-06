"""
Новый бот 2 - Telegram Bot
Сгенерировано с помощью TelegramBot Builder

Команды для @BotFather:
start - Приветствие и источник
profile - Показать и редактировать профиль пользователя
link - Получить ссылку на чат сообщества
help - Полная справка по всем командам бота и модерации"""

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

async def handle_command_profile(message):
    """Алиас для profile_handler, используется в callback обработчиках"""
    await profile_handler(message)

async def handle_command_link(message):
    """Алиас для link_handler, используется в callback обработчиках"""
    await link_handler(message)

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
        # Команда profile - Показать и редактировать профиль пользователя
        BotCommand(command="profile", description="Показать и редактировать профиль пользователя"),
        # Команда link - Получить ссылку на чат сообщества
        BotCommand(command="link", description="Получить ссылку на чат сообщества"),
        # Команда help - Полная справка по всем командам бота и модерации
        BotCommand(command="help", description="Полная справка по всем командам бота и модерации"),
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

# @@NODE_START:gender_selection@@

    # Обработчик для узла gender_selection типа message будет сгенерирован отдельно
# @@NODE_END:gender_selection@@

# @@NODE_START:name_input@@

    # Обработчик для узла name_input типа message будет сгенерирован отдельно
# @@NODE_END:name_input@@

# @@NODE_START:age_input@@

    # Обработчик для узла age_input типа message будет сгенерирован отдельно
# @@NODE_END:age_input@@

# @@NODE_START:metro_selection@@

    # Обработчик для узла metro_selection типа message будет сгенерирован отдельно
# @@NODE_END:metro_selection@@

# @@NODE_START:red_line_stations@@

    # Обработчик для узла red_line_stations типа message будет сгенерирован отдельно
# @@NODE_END:red_line_stations@@

# @@NODE_START:blue_line_stations@@

    # Обработчик для узла blue_line_stations типа message будет сгенерирован отдельно
# @@NODE_END:blue_line_stations@@

# @@NODE_START:green_line_stations@@

    # Обработчик для узла green_line_stations типа message будет сгенерирован отдельно
# @@NODE_END:green_line_stations@@

# @@NODE_START:purple_line_stations@@

    # Обработчик для узла purple_line_stations типа message будет сгенерирован отдельно
# @@NODE_END:purple_line_stations@@

# @@NODE_START:profile_complete@@

    # Обработчик для узла profile_complete типа message будет сгенерирован отдельно
# @@NODE_END:profile_complete@@

# @@NODE_START:show_profile@@

# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
@dp.message(Command("profile"))
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
async def profile_handler(message: types.Message):
    logging.info(f"Команда /profile вызвана пользователем {message.from_user.id}")
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
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if saved_to_db:
        await update_user_data_in_db(user_id, "command_profile", datetime.now().isoformat())

    # Сохранение в локальное хранилище
    # Инициализируем базовые переменные пользователя в локальном хранилище
    user_name = init_user_variables(user_id, message.from_user)

# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if "commands_used" not in user_data[user_id]:
        user_data[user_id]["commands_used"] = {}
    user_data[user_id]["commands_used"]["/profile"] = user_data[user_id]["commands_used"].get("/profile", 0) + 1

    text = """👤 Твой профиль:

Пол: {gender} 👤
Имя: {user_name} ✏️
Возраст: {user_age} 🎂
Метро: {metro_stations} 🚇
Интересы: {user_interests} 🎯
Семейное положение: {marital_status} 💍
Ориентация: {sexual_orientation} 🌈

💬 Источник: {user_source}

✏️ Выберите действие:"""

    # Универсальная замена переменных
    # Инициализируем базовые переменные пользователя если их нет
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Безопасно проверяем наличие message (для message handlers)
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Безопасно проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
        if user_obj:
            init_user_variables(user_id, user_obj)
    # Подставляем все доступные переменные пользователя в текст
    user_vars = await get_user_from_db(user_id)
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    # get_user_from_db теперь возвращает уже обработанные user_data
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if not isinstance(user_vars, dict):
        user_vars = user_data.get(user_id, {})
    # Инициализируем базовые переменные пользователя если их нет
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Безопасно проверяем наличие message (для message handlers)
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Безопасно проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
        if user_obj:
            init_user_variables(user_id, user_obj)
    # Подставляем все доступные переменные пользователя в текст
    user_vars = await get_user_from_db(user_id)
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    # get_user_from_db теперь возвращает уже обработанные user_data
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if not isinstance(user_vars, dict):
        user_vars = user_data.get(user_id, {})
    text = replace_variables_in_text(text, user_vars)
    has_regular_buttons = True
    has_input_collection = False
    # DEBUG: Узел show_profile - hasRegularButtons=True, hasInputCollection=False
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="👤 Изменить пол", callback_data="gender_selection"))
    builder.add(InlineKeyboardButton(text="✏️ Изменить имя", callback_data="name_input"))
    builder.add(InlineKeyboardButton(text="🎂 Изменить возраст", callback_data="age_input"))
    builder.add(InlineKeyboardButton(text="🚇 Изменить метро", callback_data="metro_selection"))
    builder.add(InlineKeyboardButton(text="🎯 Изменить интересы", callback_data="interests_categories"))
    builder.add(InlineKeyboardButton(text="💍 Изменить семейное положение", callback_data="marital_status"))
    builder.add(InlineKeyboardButton(text="🌈 Изменить ориентацию", callback_data="sexual_orientation"))
    builder.add(InlineKeyboardButton(text="📢 Указать ТГК", callback_data="channel_choice"))
    builder.add(InlineKeyboardButton(text="📝 Добавить о себе", callback_data="extra_info"))
    builder.add(InlineKeyboardButton(text="🔄 Начать заново", callback_data="cmd_start"))
    builder.adjust(2)
    keyboard = builder.as_markup()
    await message.answer(text, reply_markup=keyboard, node_id="show_profile")
# @@NODE_END:show_profile@@

# @@NODE_START:chat_link@@

# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
@dp.message(Command("link"))
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
async def link_handler(message: types.Message):
    logging.info(f"Команда /link вызвана пользователем {message.from_user.id}")
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
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if saved_to_db:
        await update_user_data_in_db(user_id, "command_link", datetime.now().isoformat())

    # Сохранение в локальное хранилище
    # Инициализируем базовые переменные пользователя в локальном хранилище
    user_name = init_user_variables(user_id, message.from_user)

# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if "commands_used" not in user_data[user_id]:
        user_data[user_id]["commands_used"] = {}
    user_data[user_id]["commands_used"]["/link"] = user_data[user_id]["commands_used"].get("/link", 0) + 1

    text = """🔗 Актуальная ссылка на чат:

https://t.me/+agkIVgCzHtY2ZTA6

Добро пожаловать в сообщество ᴠᴨᴩᴏᴦʏᴧᴋᴇ! 🎉"""

    # Универсальная замена переменных
    # Инициализируем базовые переменные пользователя если их нет
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Безопасно проверяем наличие message (для message handlers)
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Безопасно проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
        if user_obj:
            init_user_variables(user_id, user_obj)
    # Подставляем все доступные переменные пользователя в текст
    user_vars = await get_user_from_db(user_id)
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    # get_user_from_db теперь возвращает уже обработанные user_data
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if not isinstance(user_vars, dict):
        user_vars = user_data.get(user_id, {})
    # Инициализируем базовые переменные пользователя если их нет
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Безопасно проверяем наличие message (для message handlers)
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Безопасно проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
        if user_obj:
            init_user_variables(user_id, user_obj)
    # Подставляем все доступные переменные пользователя в текст
    user_vars = await get_user_from_db(user_id)
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    # get_user_from_db теперь возвращает уже обработанные user_data
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if not isinstance(user_vars, dict):
        user_vars = user_data.get(user_id, {})
    text = replace_variables_in_text(text, user_vars)
    has_regular_buttons = False
    has_input_collection = False
    # DEBUG: Узел chat_link - hasRegularButtons=False, hasInputCollection=False
    await message.answer(text, node_id="chat_link")
# @@NODE_END:chat_link@@

# @@NODE_START:help_command@@

# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
@dp.message(Command("help"))
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
async def help_handler(message: types.Message):
    logging.info(f"Команда /help вызвана пользователем {message.from_user.id}")
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
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if saved_to_db:
        await update_user_data_in_db(user_id, "command_help", datetime.now().isoformat())

    # Сохранение в локальное хранилище
    # Инициализируем базовые переменные пользователя в локальном хранилище
    user_name = init_user_variables(user_id, message.from_user)

# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if "commands_used" not in user_data[user_id]:
        user_data[user_id]["commands_used"] = {}
    user_data[user_id]["commands_used"]["/help"] = user_data[user_id]["commands_used"].get("/help", 0) + 1

    text = """🤖 **Добро пожаловать в справочный центр!**

🌟 **ᴠᴨᴩᴏᴦʏᴧᴋᴇ Bot**
*Твой помощник в знакомствах*

🎯 **ОСНОВНЫЕ КОМАНДЫ:**

🚀 `/start` — *Начать заново*
   📝 Синонимы: `старт`, `начать`, `привет`, `начало`, `начинаем`

👤 `/profile` — *Мой профиль*
   📝 Синонимы: `профиль`, `анкета`, `мой профиль`, `посмотреть профиль`, `редактировать профиль`

🔗 `/link` — *Ссылка на чат*
   📝 Синонимы: `ссылка`, `чат`, `сообщество`, `впрогулке`, `линк`

🆘 `/help` — *Эта справка*
   📝 Синонимы: `помощь`, `справка`, `команды`, `что писать`, `как пользоваться`

📋 **РАЗДЕЛЫ АНКЕТЫ И ИХ СИНОНИМЫ:**

👫 **Пол:** мужской, женский
   📝 Синонимы: `пол`, `gender`

🏷️ **Имя:** любое имя
   📝 Синонимы: `имя`, `как зовут`, `назовись`

🎂 **Возраст:** число от 18 до 99
   📝 Синонимы: `возраст`, `лет`, `сколько лет`

🚇 **Метро:** выбор линии и станции
   📝 Синонимы: `метро`, `станция`
   🟥 Красная линия: `красная линия`, `кировско-выборгская`, `красная ветка`
   🟦 Синяя линия: `синяя линия`, `московско-петроградская`, `синяя ветка`
   🟩 Зеленая линия: `зеленая линия`, `невско-василеостровская`, `зеленая ветка`
   🟧 Оранжевая линия: `оранжевая линия`, `правобережная`, `оранжевая ветка`
   🟪 Фиолетовая линия: `фиолетовая линия`, `фрунзенско-приморская`, `фиолетовая ветка`

🎨 **Интересы и их синонимы:**
   🎮 Хобби: `хобби`, `увлечения`, `занятия`, `игры`
   🤝 Социальная жизнь: `общение`, `социальное`, `люди`, `тусовки`
   🎭 Творчество: `творчество`, `искусство`, `рисование`, `музыка`
   💪 Активный образ жизни: `активность`, `активный`, `движение`, `здоровье`
   🍕 Еда и напитки: `еда`, `напитки`, `кухня`, `рестораны`
   ⚽ Спорт: `спорт`, `фитнес`, `тренировки`, `футбол`

💑 **Семейное положение:** поиск, отношения, женат/замужем, сложно
   📝 Синонимы: `семейное положение`, `статус`, `отношения`, `семья`

🌈 **Ориентация:** гетеро, гей, лесби, би, другое
   📝 Синонимы: `ориентация`, `предпочтения`

📺 **Телеграм-канал:** опционально
   📝 Синонимы: `тгк`, `телеграм`, `канал`, `тг канал`

📖 **О себе:** дополнительная информация
   📝 Синонимы: `о себе`, `описание`, `расскажи`, `инфо`

👮‍♂️ **КОМАНДЫ МОДЕРАЦИИ:**

**Управление контентом:**
📌 `/pin_message` - Закрепить сообщение
   📝 Синонимы: `закрепить`, `прикрепить`, `зафиксировать`

📌❌ `/unpin_message` - Открепить сообщение
   📝 Синонимы: `открепить`, `отцепить`, `убрать закрепление`

🗑️ `/delete_message` - Удалить сообщение
   📝 Синонимы: `удалить`, `стереть`, `убрать сообщение`

**Управление пользователями:**
🚫 `/ban_user` - Заблокировать пользователя
   📝 Синонимы: `забанить`, `заблокировать`, `бан`

✅ `/unban_user` - Разблокировать пользователя
   📝 Синонимы: `разбанить`, `разблокировать`, `unbán`

🔇 `/mute_user` - Ограничить пользователя
   📝 Синонимы: `замутить`, `заглушить`, `мут`

🔊 `/unmute_user` - Снять ограничения
   📝 Синонимы: `размутить`, `разглушить`, `анмут`

👢 `/kick_user` - Исключить пользователя
   📝 Синонимы: `кикнуть`, `исключить`, `выгнать`

👑 `/promote_user` - Назначить администратором
   📝 Синонимы: `повысить`, `назначить админом`, `промоут`

👤 `/demote_user` - Снять с администратора
   📝 Синонимы: `понизить`, `снять с админа`, `демоут`

⚙️ `/admin_rights` - Настроить права администратора
   📝 Синонимы: `права админа`, `настроить права`, `тг права`
   ⚠️ Только для администраторов группы!
   💡 Ответьте на сообщение пользователя командой

**Примеры использования:**
• Ответьте на сообщение командой для его обработки
• Используйте команды в ответ на сообщения нарушителей
• Команды с правами работают только в группах/супергруппах
• Все действия логируются для отчетности

💡 **ПОЛЕЗНЫЕ СОВЕТЫ:**

✨ Можешь писать команды или синонимы в любом месте разговора
✨ Бот поймет твои сообщения даже без команд
✨ В любой момент можешь написать /start для начала заново
✨ Используй /profile для изменения любых данных
✨ Нажми на любое выделенное слово чтобы скопировать его!

🎉 **Удачных знакомств в Питере!** 🎉"""

    # Универсальная замена переменных
    # Инициализируем базовые переменные пользователя если их нет
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Безопасно проверяем наличие message (для message handlers)
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Безопасно проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
        if user_obj:
            init_user_variables(user_id, user_obj)
    # Подставляем все доступные переменные пользователя в текст
    user_vars = await get_user_from_db(user_id)
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    # get_user_from_db теперь возвращает уже обработанные user_data
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if not isinstance(user_vars, dict):
        user_vars = user_data.get(user_id, {})
    # Инициализируем базовые переменные пользователя если их нет
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if user_id not in user_data or "user_name" not in user_data.get(user_id, {}):
        # Получаем объект пользователя из сообщения или callback
        user_obj = None
        # Безопасно проверяем наличие message (для message handlers)
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
        if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):
            user_obj = locals().get('message').from_user
        # Безопасно проверяем наличие callback_query (для callback handlers)
        elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):
            user_obj = locals().get('callback_query').from_user
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
        if user_obj:
            init_user_variables(user_id, user_obj)
    # Подставляем все доступные переменные пользователя в текст
    user_vars = await get_user_from_db(user_id)
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if not user_vars:
        user_vars = user_data.get(user_id, {})
    # get_user_from_db теперь возвращает уже обработанные user_data
# Код сгенерирован в generateCommandHandler.ts
# Код сгенерирован в generate-node-handlers.ts
    if not isinstance(user_vars, dict):
        user_vars = user_data.get(user_id, {})
    text = replace_variables_in_text(text, user_vars)
    has_regular_buttons = True
    has_input_collection = False
    # DEBUG: Узел help_command - hasRegularButtons=True, hasInputCollection=False
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🚀 Начать заполнение", callback_data="cmd_start"))
    builder.add(InlineKeyboardButton(text="👤 Мой профиль", callback_data="cmd_profile"))
    builder.add(InlineKeyboardButton(text="🔗 Ссылка на чат", callback_data="cmd_link"))
    builder.adjust(1)
    keyboard = builder.as_markup()
    await message.answer(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN, node_id="help_command")
# @@NODE_END:help_command@@
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
# @@NODE_START:gender_selection@@

@dp.message(lambda message: message.text and message.text.lower() == "пол")
async def message_gender_selection_synonym_пол_handler(message: types.Message):
    # Синоним для сообщения gender_selection
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'пол' для узла gender_selection")
    
    # Обрабатываем синоним как переход к узлу gender_selection
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
    
    mock_callback = MockCallback("gender_selection", message.from_user, message)
    await handle_callback_gender_selection(mock_callback)
# @@NODE_END:gender_selection@@
# @@NODE_START:gender_selection@@

@dp.message(lambda message: message.text and message.text.lower() == "гендер")
async def message_gender_selection_synonym_гендер_handler(message: types.Message):
    # Синоним для сообщения gender_selection
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'гендер' для узла gender_selection")
    
    # Обрабатываем синоним как переход к узлу gender_selection
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
    
    mock_callback = MockCallback("gender_selection", message.from_user, message)
    await handle_callback_gender_selection(mock_callback)
# @@NODE_END:gender_selection@@
# @@NODE_START:gender_selection@@

@dp.message(lambda message: message.text and message.text.lower() == "мужчина")
async def message_gender_selection_synonym_мужчина_handler(message: types.Message):
    # Синоним для сообщения gender_selection
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'мужчина' для узла gender_selection")
    
    # Обрабатываем синоним как переход к узлу gender_selection
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
    
    mock_callback = MockCallback("gender_selection", message.from_user, message)
    await handle_callback_gender_selection(mock_callback)
# @@NODE_END:gender_selection@@
# @@NODE_START:gender_selection@@

@dp.message(lambda message: message.text and message.text.lower() == "женщина")
async def message_gender_selection_synonym_женщина_handler(message: types.Message):
    # Синоним для сообщения gender_selection
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'женщина' для узла gender_selection")
    
    # Обрабатываем синоним как переход к узлу gender_selection
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
    
    mock_callback = MockCallback("gender_selection", message.from_user, message)
    await handle_callback_gender_selection(mock_callback)
# @@NODE_END:gender_selection@@
# @@NODE_START:name_input@@

@dp.message(lambda message: message.text and message.text.lower() == "имя")
async def message_name_input_synonym_имя_handler(message: types.Message):
    # Синоним для сообщения name_input
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'имя' для узла name_input")
    
    # Обрабатываем синоним как переход к узлу name_input
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
    
    mock_callback = MockCallback("name_input", message.from_user, message)
    await handle_callback_name_input(mock_callback)
# @@NODE_END:name_input@@
# @@NODE_START:name_input@@

@dp.message(lambda message: message.text and message.text.lower() == "зовут")
async def message_name_input_synonym_зовут_handler(message: types.Message):
    # Синоним для сообщения name_input
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'зовут' для узла name_input")
    
    # Обрабатываем синоним как переход к узлу name_input
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
    
    mock_callback = MockCallback("name_input", message.from_user, message)
    await handle_callback_name_input(mock_callback)
# @@NODE_END:name_input@@
# @@NODE_START:name_input@@

@dp.message(lambda message: message.text and message.text.lower() == "называют")
async def message_name_input_synonym_называют_handler(message: types.Message):
    # Синоним для сообщения name_input
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'называют' для узла name_input")
    
    # Обрабатываем синоним как переход к узлу name_input
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
    
    mock_callback = MockCallback("name_input", message.from_user, message)
    await handle_callback_name_input(mock_callback)
# @@NODE_END:name_input@@
# @@NODE_START:name_input@@

@dp.message(lambda message: message.text and message.text.lower() == "как зовут")
async def message_name_input_synonym_как_зовут_handler(message: types.Message):
    # Синоним для сообщения name_input
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'как зовут' для узла name_input")
    
    # Обрабатываем синоним как переход к узлу name_input
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
    
    mock_callback = MockCallback("name_input", message.from_user, message)
    await handle_callback_name_input(mock_callback)
# @@NODE_END:name_input@@
# @@NODE_START:age_input@@

@dp.message(lambda message: message.text and message.text.lower() == "возраст")
async def message_age_input_synonym_возраст_handler(message: types.Message):
    # Синоним для сообщения age_input
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'возраст' для узла age_input")
    
    # Обрабатываем синоним как переход к узлу age_input
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
    
    mock_callback = MockCallback("age_input", message.from_user, message)
    await handle_callback_age_input(mock_callback)
# @@NODE_END:age_input@@
# @@NODE_START:age_input@@

@dp.message(lambda message: message.text and message.text.lower() == "лет")
async def message_age_input_synonym_лет_handler(message: types.Message):
    # Синоним для сообщения age_input
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'лет' для узла age_input")
    
    # Обрабатываем синоним как переход к узлу age_input
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
    
    mock_callback = MockCallback("age_input", message.from_user, message)
    await handle_callback_age_input(mock_callback)
# @@NODE_END:age_input@@
# @@NODE_START:age_input@@

@dp.message(lambda message: message.text and message.text.lower() == "годы")
async def message_age_input_synonym_годы_handler(message: types.Message):
    # Синоним для сообщения age_input
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'годы' для узла age_input")
    
    # Обрабатываем синоним как переход к узлу age_input
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
    
    mock_callback = MockCallback("age_input", message.from_user, message)
    await handle_callback_age_input(mock_callback)
# @@NODE_END:age_input@@
# @@NODE_START:age_input@@

@dp.message(lambda message: message.text and message.text.lower() == "сколько лет")
async def message_age_input_synonym_сколько_лет_handler(message: types.Message):
    # Синоним для сообщения age_input
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'сколько лет' для узла age_input")
    
    # Обрабатываем синоним как переход к узлу age_input
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
    
    mock_callback = MockCallback("age_input", message.from_user, message)
    await handle_callback_age_input(mock_callback)
# @@NODE_END:age_input@@
# @@NODE_START:metro_selection@@

@dp.message(lambda message: message.text and message.text.lower() == "метро")
async def message_metro_selection_synonym_метро_handler(message: types.Message):
    # Синоним для сообщения metro_selection
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'метро' для узла metro_selection")
    
    # Обрабатываем синоним как переход к узлу metro_selection
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
    
    mock_callback = MockCallback("metro_selection", message.from_user, message)
    await handle_callback_metro_selection(mock_callback)
# @@NODE_END:metro_selection@@
# @@NODE_START:metro_selection@@

@dp.message(lambda message: message.text and message.text.lower() == "станция")
async def message_metro_selection_synonym_станция_handler(message: types.Message):
    # Синоним для сообщения metro_selection
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'станция' для узла metro_selection")
    
    # Обрабатываем синоним как переход к узлу metro_selection
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
    
    mock_callback = MockCallback("metro_selection", message.from_user, message)
    await handle_callback_metro_selection(mock_callback)
# @@NODE_END:metro_selection@@
# @@NODE_START:metro_selection@@

@dp.message(lambda message: message.text and message.text.lower() == "где живу")
async def message_metro_selection_synonym_где_живу_handler(message: types.Message):
    # Синоним для сообщения metro_selection
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'где живу' для узла metro_selection")
    
    # Обрабатываем синоним как переход к узлу metro_selection
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
    
    mock_callback = MockCallback("metro_selection", message.from_user, message)
    await handle_callback_metro_selection(mock_callback)
# @@NODE_END:metro_selection@@
# @@NODE_START:metro_selection@@

@dp.message(lambda message: message.text and message.text.lower() == "район")
async def message_metro_selection_synonym_район_handler(message: types.Message):
    # Синоним для сообщения metro_selection
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'район' для узла metro_selection")
    
    # Обрабатываем синоним как переход к узлу metro_selection
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
    
    mock_callback = MockCallback("metro_selection", message.from_user, message)
    await handle_callback_metro_selection(mock_callback)
# @@NODE_END:metro_selection@@
# @@NODE_START:red_line_stations@@

@dp.message(lambda message: message.text and message.text.lower() == "красная линия")
async def message_red_line_stations_synonym_красная_линия_handler(message: types.Message):
    # Синоним для сообщения red_line_stations
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'красная линия' для узла red_line_stations")
    
    # Обрабатываем синоним как переход к узлу red_line_stations
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
    
    mock_callback = MockCallback("red_line_stations", message.from_user, message)
    await handle_callback_red_line_stations(mock_callback)
# @@NODE_END:red_line_stations@@
# @@NODE_START:red_line_stations@@

@dp.message(lambda message: message.text and message.text.lower() == "кировско-выборгская")
async def message_red_line_stations_synonym_кировско_выборгская_handler(message: types.Message):
    # Синоним для сообщения red_line_stations
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'кировско-выборгская' для узла red_line_stations")
    
    # Обрабатываем синоним как переход к узлу red_line_stations
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
    
    mock_callback = MockCallback("red_line_stations", message.from_user, message)
    await handle_callback_red_line_stations(mock_callback)
# @@NODE_END:red_line_stations@@
# @@NODE_START:red_line_stations@@

@dp.message(lambda message: message.text and message.text.lower() == "красная ветка")
async def message_red_line_stations_synonym_красная_ветка_handler(message: types.Message):
    # Синоним для сообщения red_line_stations
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'красная ветка' для узла red_line_stations")
    
    # Обрабатываем синоним как переход к узлу red_line_stations
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
    
    mock_callback = MockCallback("red_line_stations", message.from_user, message)
    await handle_callback_red_line_stations(mock_callback)
# @@NODE_END:red_line_stations@@
# @@NODE_START:blue_line_stations@@

@dp.message(lambda message: message.text and message.text.lower() == "синяя линия")
async def message_blue_line_stations_synonym_синяя_линия_handler(message: types.Message):
    # Синоним для сообщения blue_line_stations
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'синяя линия' для узла blue_line_stations")
    
    # Обрабатываем синоним как переход к узлу blue_line_stations
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
    
    mock_callback = MockCallback("blue_line_stations", message.from_user, message)
    await handle_callback_blue_line_stations(mock_callback)
# @@NODE_END:blue_line_stations@@
# @@NODE_START:blue_line_stations@@

@dp.message(lambda message: message.text and message.text.lower() == "московско-петроградская")
async def message_blue_line_stations_synonym_московско_петроградская_handler(message: types.Message):
    # Синоним для сообщения blue_line_stations
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'московско-петроградская' для узла blue_line_stations")
    
    # Обрабатываем синоним как переход к узлу blue_line_stations
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
    
    mock_callback = MockCallback("blue_line_stations", message.from_user, message)
    await handle_callback_blue_line_stations(mock_callback)
# @@NODE_END:blue_line_stations@@
# @@NODE_START:blue_line_stations@@

@dp.message(lambda message: message.text and message.text.lower() == "синяя ветка")
async def message_blue_line_stations_synonym_синяя_ветка_handler(message: types.Message):
    # Синоним для сообщения blue_line_stations
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'синяя ветка' для узла blue_line_stations")
    
    # Обрабатываем синоним как переход к узлу blue_line_stations
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
    
    mock_callback = MockCallback("blue_line_stations", message.from_user, message)
    await handle_callback_blue_line_stations(mock_callback)
# @@NODE_END:blue_line_stations@@
# @@NODE_START:green_line_stations@@

@dp.message(lambda message: message.text and message.text.lower() == "зеленая линия")
async def message_green_line_stations_synonym_зеленая_линия_handler(message: types.Message):
    # Синоним для сообщения green_line_stations
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'зеленая линия' для узла green_line_stations")
    
    # Обрабатываем синоним как переход к узлу green_line_stations
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
    
    mock_callback = MockCallback("green_line_stations", message.from_user, message)
    await handle_callback_green_line_stations(mock_callback)
# @@NODE_END:green_line_stations@@
# @@NODE_START:green_line_stations@@

@dp.message(lambda message: message.text and message.text.lower() == "невско-василеостровская")
async def message_green_line_stations_synonym_невско_василеостровская_handler(message: types.Message):
    # Синоним для сообщения green_line_stations
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'невско-василеостровская' для узла green_line_stations")
    
    # Обрабатываем синоним как переход к узлу green_line_stations
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
    
    mock_callback = MockCallback("green_line_stations", message.from_user, message)
    await handle_callback_green_line_stations(mock_callback)
# @@NODE_END:green_line_stations@@
# @@NODE_START:green_line_stations@@

@dp.message(lambda message: message.text and message.text.lower() == "зеленая ветка")
async def message_green_line_stations_synonym_зеленая_ветка_handler(message: types.Message):
    # Синоним для сообщения green_line_stations
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'зеленая ветка' для узла green_line_stations")
    
    # Обрабатываем синоним как переход к узлу green_line_stations
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
    
    mock_callback = MockCallback("green_line_stations", message.from_user, message)
    await handle_callback_green_line_stations(mock_callback)
# @@NODE_END:green_line_stations@@
# @@NODE_START:purple_line_stations@@

@dp.message(lambda message: message.text and message.text.lower() == "фиолетовая линия")
async def message_purple_line_stations_synonym_фиолетовая_линия_handler(message: types.Message):
    # Синоним для сообщения purple_line_stations
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'фиолетовая линия' для узла purple_line_stations")
    
    # Обрабатываем синоним как переход к узлу purple_line_stations
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
    
    mock_callback = MockCallback("purple_line_stations", message.from_user, message)
    await handle_callback_purple_line_stations(mock_callback)
# @@NODE_END:purple_line_stations@@
# @@NODE_START:purple_line_stations@@

@dp.message(lambda message: message.text and message.text.lower() == "фрунзенско-приморская")
async def message_purple_line_stations_synonym_фрунзенско_приморская_handler(message: types.Message):
    # Синоним для сообщения purple_line_stations
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'фрунзенско-приморская' для узла purple_line_stations")
    
    # Обрабатываем синоним как переход к узлу purple_line_stations
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
    
    mock_callback = MockCallback("purple_line_stations", message.from_user, message)
    await handle_callback_purple_line_stations(mock_callback)
# @@NODE_END:purple_line_stations@@
# @@NODE_START:purple_line_stations@@

@dp.message(lambda message: message.text and message.text.lower() == "фиолетовая ветка")
async def message_purple_line_stations_synonym_фиолетовая_ветка_handler(message: types.Message):
    # Синоним для сообщения purple_line_stations
    user_id = message.from_user.id
    logging.info(f"Пользователь {user_id} написал синоним 'фиолетовая ветка' для узла purple_line_stations")
    
    # Обрабатываем синоним как переход к узлу purple_line_stations
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
    
    mock_callback = MockCallback("purple_line_stations", message.from_user, message)
    await handle_callback_purple_line_stations(mock_callback)
# @@NODE_END:purple_line_stations@@
# @@NODE_START:show_profile@@

@dp.message(lambda message: message.text and message.text.lower() == "профиль")
async def profile_synonym_профиль_handler(message: types.Message):
    # Синоним для команды /profile
    await profile_handler(message)
# @@NODE_END:show_profile@@
# @@NODE_START:show_profile@@

@dp.message(lambda message: message.text and message.text.lower() == "анкета")
async def profile_synonym_анкета_handler(message: types.Message):
    # Синоним для команды /profile
    await profile_handler(message)
# @@NODE_END:show_profile@@
# @@NODE_START:show_profile@@

@dp.message(lambda message: message.text and message.text.lower() == "мои данные")
async def profile_synonym_мои_данные_handler(message: types.Message):
    # Синоним для команды /profile
    await profile_handler(message)
# @@NODE_END:show_profile@@
# @@NODE_START:show_profile@@

@dp.message(lambda message: message.text and message.text.lower() == "редактировать")
async def profile_synonym_редактировать_handler(message: types.Message):
    # Синоним для команды /profile
    await profile_handler(message)
# @@NODE_END:show_profile@@
# @@NODE_START:chat_link@@

@dp.message(lambda message: message.text and message.text.lower() == "ссылка")
async def link_synonym_ссылка_handler(message: types.Message):
    # Синоним для команды /link
    await link_handler(message)
# @@NODE_END:chat_link@@
# @@NODE_START:chat_link@@

@dp.message(lambda message: message.text and message.text.lower() == "чат")
async def link_synonym_чат_handler(message: types.Message):
    # Синоним для команды /link
    await link_handler(message)
# @@NODE_END:chat_link@@
# @@NODE_START:chat_link@@

@dp.message(lambda message: message.text and message.text.lower() == "сообщество")
async def link_synonym_сообщество_handler(message: types.Message):
    # Синоним для команды /link
    await link_handler(message)
# @@NODE_END:chat_link@@
# @@NODE_START:chat_link@@

@dp.message(lambda message: message.text and message.text.lower() == "впрогулке")
async def link_synonym_впрогулке_handler(message: types.Message):
    # Синоним для команды /link
    await link_handler(message)
# @@NODE_END:chat_link@@
# @@NODE_START:chat_link@@

@dp.message(lambda message: message.text and message.text.lower() == "линк")
async def link_synonym_линк_handler(message: types.Message):
    # Синоним для команды /link
    await link_handler(message)
# @@NODE_END:chat_link@@
# @@NODE_START:help_command@@

@dp.message(lambda message: message.text and message.text.lower() == "помощь")
async def help_synonym_помощь_handler(message: types.Message):
    # Синоним для команды /help
    await help_handler(message)
# @@NODE_END:help_command@@
# @@NODE_START:help_command@@

@dp.message(lambda message: message.text and message.text.lower() == "справка")
async def help_synonym_справка_handler(message: types.Message):
    # Синоним для команды /help
    await help_handler(message)
# @@NODE_END:help_command@@
# @@NODE_START:help_command@@

@dp.message(lambda message: message.text and message.text.lower() == "команды")
async def help_synonym_команды_handler(message: types.Message):
    # Синоним для команды /help
    await help_handler(message)
# @@NODE_END:help_command@@
# @@NODE_START:help_command@@

@dp.message(lambda message: message.text and message.text.lower() == "что писать")
async def help_synonym_что_писать_handler(message: types.Message):
    # Синоним для команды /help
    await help_handler(message)
# @@NODE_END:help_command@@
# @@NODE_START:help_command@@

@dp.message(lambda message: message.text and message.text.lower() == "как пользоваться")
async def help_synonym_как_пользоваться_handler(message: types.Message):
    # Синоним для команды /help
    await help_handler(message)
# @@NODE_END:help_command@@
# @@NODE_START:help_command@@

@dp.message(lambda message: message.text and message.text.lower() == "админ справка")
async def help_synonym_админ_справка_handler(message: types.Message):
    # Синоним для команды /help
    await help_handler(message)
# @@NODE_END:help_command@@
# @@NODE_START:help_command@@

@dp.message(lambda message: message.text and message.text.lower() == "админ помощь")
async def help_synonym_админ_помощь_handler(message: types.Message):
    # Синоним для команды /help
    await help_handler(message)
# @@NODE_END:help_command@@
# @@NODE_START:help_command@@

@dp.message(lambda message: message.text and message.text.lower() == "админ команды")
async def help_synonym_админ_команды_handler(message: types.Message):
    # Синоним для команды /help
    await help_handler(message)
# @@NODE_END:help_command@@

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "gender_selection" or c.data.startswith("gender_selection_btn_") or c.data == "done_selection")
async def handle_callback_gender_selection(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_gender_selection для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_gender_selection: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла gender_selection
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_gender_selection"] = True
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла gender_selection: true")
    
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
    
    # Обрабатываем узел gender_selection: gender_selection
    text = "Укажи свой пол: 👨👩"
    
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
    builder.add(InlineKeyboardButton(text="Мужчина 👨", callback_data="name_input_btn_0"))
    builder.add(InlineKeyboardButton(text="Женщина 👩", callback_data="name_input_btn_1"))
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
        "variable": "gender",
        "save_to_database": True,
        "node_id": "gender_selection",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной gender (узел gender_selection)")
    user_id = callback_query.from_user.id
    
    # Сохраняем нажатие кнопки в базу данных
    # Ищем текят кнопки по callback_data
    button_display_text = "Да 😎"
    
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
    
    
    # Удаляем старое сообщение
    
    text = "Укажи свой пол: 👨👩"
    # ИСПРАВЛЕНИЕ: Не отправляем сообщение второй раз, если оно уже было отправлено ранее в обработчике
    # Вместо этого, просто настраиваем ожидание ввода
    # Настраиваем ожидание ввода (collectUserInput=true)
    user_data[callback_query.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "variable": "gender",
        "save_to_database": False,
        "node_id": "gender_selection",
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

@dp.callback_query(lambda c: c.data == "name_input" or c.data.startswith("name_input_btn_") or c.data == "done_name_input")
async def handle_callback_name_input(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_name_input для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_name_input: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла name_input
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_name_input"] = True
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла name_input: true")
    
    # Проверяем, был ли переход через кнопку с skipDataCollection
    skip_transition_flag = user_data.get(user_id, {}).get("skipDataCollectionTransition", False)
    if not skip_transition_flag:
        await update_user_data_in_db(user_id, "user_name", callback_query.data)
        logging.info(f"Переменная user_name сохранена: " + str(callback_query.data) + f" (пользователь {user_id})")
    else:
        # Сбрасываем флаг
        if user_id in user_data and "skipDataCollectionTransition" in user_data[user_id]:
            del user_data[user_id]["skipDataCollectionTransition"]
        logging.info(f"Переход через skipDataCollection, переменная user_name не сохраняется (пользователь {user_id})")
    
    # Обрабатываем узел name_input: name_input
    text = """Как тебя зовут? ✏️

Напиши своё имя в сообщении:"""
    
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
        "variable": "user_name",
        "save_to_database": True,
        "node_id": "name_input",
        "next_node_id": "age_input",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной user_name (узел name_input)")
    user_id = callback_query.from_user.id
    
    # Сохраняем нажатие кнопки в базу данных
    # Ищем текят кнопки по callback_data
    # Определяем тякст кнопки по callback_data
    button_display_text = "Неизвестная кнопка"
    if callback_query.data.endswith("_btn_0"):
        button_display_text = "Мужчина 👨"
    if callback_query.data.endswith("_btn_1"):
        button_display_text = "Женщина 👩"
    # Дополнительная проверка по точному соответствию callback_data
    if callback_query.data == "name_input":
        button_display_text = "Мужчина 👨"
    if callback_query.data == "name_input":
        button_display_text = "Женщина 👩"
    
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
    
    
    # Удаляем старое сообщение
    
    text = """Как тебя зовут? ✏️

Напиши своё имя в сообщении:"""
    # ИСПРАВЛЕНИЕ: Не отправляем сообщение второй раз, если оно уже было отправлено ранее в обработчике
    # Вместо этого, просто настраиваем ожидание ввода
    # Настраиваем ожидание ввода (collectUserInput=true)
    user_data[callback_query.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "variable": "user_name",
        "save_to_database": False,
        "node_id": "name_input",
        "next_node_id": "age_input"
    }
    return

@dp.callback_query(lambda c: c.data == "red_line_stations" or c.data.startswith("red_line_stations_btn_") or c.data == "done_e_stations")
async def handle_callback_red_line_stations(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_red_line_stations для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_red_line_stations: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла red_line_stations
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_red_line_stations"] = False
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла red_line_stations: false")
    
    # Проверяем, является ли это кнопкой "Готово"
    if callback_data == "done_e_stations":
        logging.info(f"🏁 Обработка кнопки Готово для множественного выбора: {callback_data}")
        
        # Сохраняем выбранные значения в базу данных
        selected_options = user_data.get(user_id, {}).get("multi_select_red_line_stations", [])
        if selected_options:
            selected_text = ", ".join(selected_options)
            
            # Универсальная логика аккумуляции для всех множественных выборов
            # Загружаем существующие значения
            existing_data = await get_user_data_from_db(user_id, "metro_stations")
            existing_selections = []
            if existing_data and existing_data.strip():
                existing_selections = [s.strip() for s in existing_data.split(",") if s.strip()]
            
            # Объединяем существующие и новые выборы (убираем дубли)
            all_selections = list(set(existing_selections + selected_options))
            final_text = ", ".join(all_selections)
            await update_user_data_in_db(user_id, "metro_stations", final_text)
            logging.info(f"✅ Аккумялировано в переменную metro_stations: {final_text}")
        
        # Очищаем состояние множественного выбора
        if user_id in user_data:
            user_data[user_id].pop("multi_select_red_line_stations", None)
            user_data[user_id].pop("multi_select_node", None)
            user_data[user_id].pop("multi_select_type", None)
            user_data[user_id].pop("multi_select_variable", None)
        
        # Переход к следующему узлу
        next_node_id = "interests_categories"
        try:
            logging.warning(f"⚠️ Целевой узел не найден: {next_node_id}, завершаем переход")
            await callback_query.message.edit_text("Переход завершен")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
            await callback_query.message.edit_text("Переход завершен")
        return
    
    # Обрабатываем узел red_line_stations: red_line_stations
    text = """🟥 Кировско-Выборгская линия

Выбери свою станцию:"""
    
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
    
    # Инициализация состояния множественного выбора
    if user_id not in user_data:
        user_data[user_id] = {}
    
    # Загружаем ранее выбранные варианты
    saved_selections = []
    if user_vars:
        for var_name, var_data in user_vars.items():
            if var_name == "metro_stations":
                if isinstance(var_data, dict) and "value" in var_data:
                    selections_str = var_data["value"]
                elif isinstance(var_data, str):
                    selections_str = var_data
                else:
                    continue
                if selections_str and selections_str.strip():
                    saved_selections = [sel.strip() for sel in selections_str.split(",") if sel.strip()]
                    break
    
    # Инициализируем состояние если его нет
    if "multi_select_red_line_stations" not in user_data[user_id]:
        user_data[user_id]["multi_select_red_line_stations"] = saved_selections.copy()
    user_data[user_id]["multi_select_node"] = "red_line_stations"
    user_data[user_id]["multi_select_type"] = "inline"
    user_data[user_id]["multi_select_variable"] = "metro_stations"
    logging.info(f"Инициализировано состояние множественного выбора с {len(saved_selections)} элементами")
    
    # Создаем inline клавиатуру с поддержкой множественного выбора
    builder = InlineKeyboardBuilder()
    # Кнопка выбора 1: 🟥 Девяткино
    logging.info(f"🔘 Создаем кнопку: 🟥 Девяткино -> ms_stations_vyatkino")
    selected_mark = "✅ " if "🟥 Девяткино" in user_data[user_id]["multi_select_red_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Девяткино", callback_data="ms_stations_vyatkino"))
    # Кнопка выбора 2: 🟥 Гражданский проспект
    logging.info(f"🔘 Создаем кнопку: 🟥 Гражданский проспект -> ms_stations_zhdansky")
    selected_mark = "✅ " if "🟥 Гражданский проспект" in user_data[user_id]["multi_select_red_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Гражданский проспект", callback_data="ms_stations_zhdansky"))
    # Кнопка выбора 3: 🟥 Академическая
    logging.info(f"🔘 Создаем кнопку: 🟥 Академическая -> ms_stations_cheskaya")
    selected_mark = "✅ " if "🟥 Академическая" in user_data[user_id]["multi_select_red_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Академическая", callback_data="ms_stations_cheskaya"))
    # Кнопка выбора 4: 🟥 Политехническая
    logging.info(f"🔘 Создаем кнопку: 🟥 Политехническая -> ms_stations_cheskaya")
    selected_mark = "✅ " if "🟥 Политехническая" in user_data[user_id]["multi_select_red_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Политехническая", callback_data="ms_stations_cheskaya"))
    # Кнопка выбора 5: 🟥 Площадь Мужества
    logging.info(f"🔘 Создаем кнопку: 🟥 Площадь Мужества -> ms_stations_uzhestva")
    selected_mark = "✅ " if "🟥 Площадь Мужества" in user_data[user_id]["multi_select_red_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Площадь Мужества", callback_data="ms_stations_uzhestva"))
    # Кнопка выбора 6: 🟥 Лесная
    logging.info(f"🔘 Создаем кнопку: 🟥 Лесная -> ms_stations_lesnaya")
    selected_mark = "✅ " if "🟥 Лесная" in user_data[user_id]["multi_select_red_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Лесная", callback_data="ms_stations_lesnaya"))
    # Кнопка выбора 7: 🟥 Выборгская
    logging.info(f"🔘 Создаем кнопку: 🟥 Выборгская -> ms_stations_orgskaya")
    selected_mark = "✅ " if "🟥 Выборгская" in user_data[user_id]["multi_select_red_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Выборгская", callback_data="ms_stations_orgskaya"))
    # Кнопка выбора 8: 🟥 Площадь Ленина
    logging.info(f"🔘 Создаем кнопку: 🟥 Площадь Ленина -> ms_stations_l_lenina")
    selected_mark = "✅ " if "🟥 Площадь Ленина" in user_data[user_id]["multi_select_red_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Площадь Ленина", callback_data="ms_stations_l_lenina"))
    # Кнопка выбора 9: 🟥 Чернышевская
    logging.info(f"🔘 Создаем кнопку: 🟥 Чернышевская -> ms_stations_hevskaya")
    selected_mark = "✅ " if "🟥 Чернышевская" in user_data[user_id]["multi_select_red_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Чернышевская", callback_data="ms_stations_hevskaya"))
    # Кнопка выбора 10: 🟥 Площадь Восстания
    logging.info(f"🔘 Создаем кнопку: 🟥 Площадь Восстания -> ms_stations_sstaniya")
    selected_mark = "✅ " if "🟥 Площадь Восстания" in user_data[user_id]["multi_select_red_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Площадь Восстания", callback_data="ms_stations_sstaniya"))
    # Кнопка выбора 11: 🟥 Владимирская
    logging.info(f"🔘 Создаем кнопку: 🟥 Владимирская -> ms_stations_mirskaya")
    selected_mark = "✅ " if "🟥 Владимирская" in user_data[user_id]["multi_select_red_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Владимирская", callback_data="ms_stations_mirskaya"))
    # Кнопка выбора 12: 🟥 Пушкинская
    logging.info(f"🔘 Создаем кнопку: 🟥 Пушкинская -> ms_stations_kinskaya")
    selected_mark = "✅ " if "🟥 Пушкинская" in user_data[user_id]["multi_select_red_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Пушкинская", callback_data="ms_stations_kinskaya"))
    # Кнопка выбора 13: 🟥 Технологический институт-1
    logging.info(f"🔘 Создаем кнопку: 🟥 Технологический институт-1 -> ms_stations_nstitut1")
    selected_mark = "✅ " if "🟥 Технологический институт-1" in user_data[user_id]["multi_select_red_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Технологический институт-1", callback_data="ms_stations_nstitut1"))
    # Кнопка выбора 14: 🟥 Балтийская
    logging.info(f"🔘 Создаем кнопку: 🟥 Балтийская -> ms_stations_tiyskaya")
    selected_mark = "✅ " if "🟥 Балтийская" in user_data[user_id]["multi_select_red_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Балтийская", callback_data="ms_stations_tiyskaya"))
    # Кнопка выбора 15: 🟥 Нарвская
    logging.info(f"🔘 Создаем кнопку: 🟥 Нарвская -> ms_stations_arvskaya")
    selected_mark = "✅ " if "🟥 Нарвская" in user_data[user_id]["multi_select_red_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Нарвская", callback_data="ms_stations_arvskaya"))
    # Кнопка выбора 16: 🟥 Кировский завод
    logging.info(f"🔘 Создаем кнопку: 🟥 Кировский завод -> ms_stations_kirovsky")
    selected_mark = "✅ " if "🟥 Кировский завод" in user_data[user_id]["multi_select_red_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Кировский завод", callback_data="ms_stations_kirovsky"))
    # Кнопка выбора 17: 🟥 Автово
    logging.info(f"🔘 Создаем кнопку: 🟥 Автово -> ms_stations_avtovo")
    selected_mark = "✅ " if "🟥 Автово" in user_data[user_id]["multi_select_red_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Автово", callback_data="ms_stations_avtovo"))
    # Кнопка выбора 18: 🟥 Ленинский проспект
    logging.info(f"🔘 Создаем кнопку: 🟥 Ленинский проспект -> ms_stations_leninsky")
    selected_mark = "✅ " if "🟥 Ленинский проспект" in user_data[user_id]["multi_select_red_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Ленинский проспект", callback_data="ms_stations_leninsky"))
    # Кнопка выбора 19: 🟥 Проспект Ветеранов
    logging.info(f"🔘 Создаем кнопку: 🟥 Проспект Ветеранов -> ms_stations_eteranov")
    selected_mark = "✅ " if "🟥 Проспект Ветеранов" in user_data[user_id]["multi_select_red_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Проспект Ветеранов", callback_data="ms_stations_eteranov"))
    # Кнопка "Готово" для множественного выбора
    logging.info(f"🔘 Создаем кнопку Готово -> done_e_stations")
    builder.add(InlineKeyboardButton(text="Готово", callback_data="done_e_stations"))
    builder.add(InlineKeyboardButton(text="⬅️ Назад к веткам", callback_data="metro_selection_btn_0"))
    builder.adjust(2)
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
        "variable": "response_red_line_stations",
        "save_to_database": True,
        "node_id": "red_line_stations",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной response_red_line_stations (узел red_line_stations)")
    user_id = callback_query.from_user.id
    
    # Сохраняем нажатие кнопки в базу данных
    # Ищем текят кнопки по callback_data
    button_display_text = "Красная ветка 🟥"
    
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
        await update_user_data_in_db(user_id, "metro_stations", button_display_text)
        logging.info(f"Переменная metro_stations сохранена: " + str(button_display_text) + f" (пользователь {user_id})")
    else:
        logging.info("⏸️ Пропускаем сохранение переменной: показана условная клавиатура, ждём выбор пользователя")
    
    
    return

@dp.callback_query(lambda c: c.data == "blue_line_stations" or c.data.startswith("blue_line_stations_btn_") or c.data == "done_e_stations")
async def handle_callback_blue_line_stations(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_blue_line_stations для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_blue_line_stations: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла blue_line_stations
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_blue_line_stations"] = False
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла blue_line_stations: false")
    
    # Проверяем, является ли это кнопкой "Готово"
    if callback_data == "done_e_stations":
        logging.info(f"🏁 Обработка кнопки Готово для множественного выбора: {callback_data}")
        
        # Сохраняем выбранные значения в базу данных
        selected_options = user_data.get(user_id, {}).get("multi_select_blue_line_stations", [])
        if selected_options:
            selected_text = ", ".join(selected_options)
            
            # Универсальная логика аккумуляции для всех множественных выборов
            # Загружаем существующие значения
            existing_data = await get_user_data_from_db(user_id, "metro_stations")
            existing_selections = []
            if existing_data and existing_data.strip():
                existing_selections = [s.strip() for s in existing_data.split(",") if s.strip()]
            
            # Объединяем существующие и новые выборы (убираем дубли)
            all_selections = list(set(existing_selections + selected_options))
            final_text = ", ".join(all_selections)
            await update_user_data_in_db(user_id, "metro_stations", final_text)
            logging.info(f"✅ Аккумялировано в переменную metro_stations: {final_text}")
        
        # Очищаем состояние множественного выбора
        if user_id in user_data:
            user_data[user_id].pop("multi_select_blue_line_stations", None)
            user_data[user_id].pop("multi_select_node", None)
            user_data[user_id].pop("multi_select_type", None)
            user_data[user_id].pop("multi_select_variable", None)
        
        # Переход к следующему узлу
        next_node_id = "interests_categories"
        try:
            logging.warning(f"⚠️ Целевой узел не найден: {next_node_id}, завершаем переход")
            await callback_query.message.edit_text("Переход завершен")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
            await callback_query.message.edit_text("Переход завершен")
        return
    
    # Обрабатываем узел blue_line_stations: blue_line_stations
    text = """🟦 Московско-Петроградская линия

Выбери свою станцию:"""
    
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
    
    # Инициализация состояния множественного выбора
    if user_id not in user_data:
        user_data[user_id] = {}
    
    # Загружаем ранее выбранные варианты
    saved_selections = []
    if user_vars:
        for var_name, var_data in user_vars.items():
            if var_name == "metro_stations":
                if isinstance(var_data, dict) and "value" in var_data:
                    selections_str = var_data["value"]
                elif isinstance(var_data, str):
                    selections_str = var_data
                else:
                    continue
                if selections_str and selections_str.strip():
                    saved_selections = [sel.strip() for sel in selections_str.split(",") if sel.strip()]
                    break
    
    # Инициализируем состояние если его нет
    if "multi_select_blue_line_stations" not in user_data[user_id]:
        user_data[user_id]["multi_select_blue_line_stations"] = saved_selections.copy()
    user_data[user_id]["multi_select_node"] = "blue_line_stations"
    user_data[user_id]["multi_select_type"] = "inline"
    user_data[user_id]["multi_select_variable"] = "metro_stations"
    logging.info(f"Инициализировано состояние множественного выбора с {len(saved_selections)} элементами")
    
    # Создаем inline клавиатуру с поддержкой множественного выбора
    builder = InlineKeyboardBuilder()
    # Кнопка выбора 1: 🟦 Парнас
    logging.info(f"🔘 Создаем кнопку: 🟦 Парнас -> ms_stations_parnas")
    selected_mark = "✅ " if "🟦 Парнас" in user_data[user_id]["multi_select_blue_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Парнас", callback_data="ms_stations_parnas"))
    # Кнопка выбора 2: 🟦 Проспект Просвещения
    logging.info(f"🔘 Создаем кнопку: 🟦 Проспект Просвещения -> ms_stations_prosvesh")
    selected_mark = "✅ " if "🟦 Проспект Просвещения" in user_data[user_id]["multi_select_blue_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Проспект Просвещения", callback_data="ms_stations_prosvesh"))
    # Кнопка выбора 3: 🟦 Озерки
    logging.info(f"🔘 Создаем кнопку: 🟦 Озерки -> ms_stations_ozerki")
    selected_mark = "✅ " if "🟦 Озерки" in user_data[user_id]["multi_select_blue_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Озерки", callback_data="ms_stations_ozerki"))
    # Кнопка выбора 4: 🟦 Удельная
    logging.info(f"🔘 Создаем кнопку: 🟦 Удельная -> ms_stations_udelnaya")
    selected_mark = "✅ " if "🟦 Удельная" in user_data[user_id]["multi_select_blue_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Удельная", callback_data="ms_stations_udelnaya"))
    # Кнопка выбора 5: 🟦 Пионерская
    logging.info(f"🔘 Создаем кнопку: 🟦 Пионерская -> ms_stations_nerskaya")
    selected_mark = "✅ " if "🟦 Пионерская" in user_data[user_id]["multi_select_blue_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Пионерская", callback_data="ms_stations_nerskaya"))
    # Кнопка выбора 6: 🟦 Черная речка
    logging.info(f"🔘 Создаем кнопку: 🟦 Черная речка -> ms_stations_chernaya")
    selected_mark = "✅ " if "🟦 Черная речка" in user_data[user_id]["multi_select_blue_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Черная речка", callback_data="ms_stations_chernaya"))
    # Кнопка выбора 7: 🟦 Петроградская
    logging.info(f"🔘 Создаем кнопку: 🟦 Петроградская -> ms_stations_radskaya")
    selected_mark = "✅ " if "🟦 Петроградская" in user_data[user_id]["multi_select_blue_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Петроградская", callback_data="ms_stations_radskaya"))
    # Кнопка выбора 8: 🟦 Горьковская
    logging.info(f"🔘 Создаем кнопку: 🟦 Горьковская -> ms_stations_kovskaya")
    selected_mark = "✅ " if "🟦 Горьковская" in user_data[user_id]["multi_select_blue_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Горьковская", callback_data="ms_stations_kovskaya"))
    # Кнопка выбора 9: 🟦 Невский проспект
    logging.info(f"🔘 Создаем кнопку: 🟦 Невский проспект -> ms_stations_nevsky")
    selected_mark = "✅ " if "🟦 Невский проспект" in user_data[user_id]["multi_select_blue_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Невский проспект", callback_data="ms_stations_nevsky"))
    # Кнопка выбора 10: 🟦 Сенная площадь
    logging.info(f"🔘 Создаем кнопку: 🟦 Сенная площадь -> ms_stations_sennaya")
    selected_mark = "✅ " if "🟦 Сенная площадь" in user_data[user_id]["multi_select_blue_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Сенная площадь", callback_data="ms_stations_sennaya"))
    # Кнопка выбора 11: 🟦 Технологический институт-2
    logging.info(f"🔘 Создаем кнопку: 🟦 Технологический институт-2 -> ms_stations_nstitut2")
    selected_mark = "✅ " if "🟦 Технологический институт-2" in user_data[user_id]["multi_select_blue_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Технологический институт-2", callback_data="ms_stations_nstitut2"))
    # Кнопка выбора 12: 🟦 Фрунзенская
    logging.info(f"🔘 Создаем кнопку: 🟦 Фрунзенская -> ms_stations_zenskaya")
    selected_mark = "✅ " if "🟦 Фрунзенская" in user_data[user_id]["multi_select_blue_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Фрунзенская", callback_data="ms_stations_zenskaya"))
    # Кнопка выбора 13: 🟦 Московские ворота
    logging.info(f"🔘 Создаем кнопку: 🟦 Московские ворота -> ms_stations_k_vorota")
    selected_mark = "✅ " if "🟦 Московские ворота" in user_data[user_id]["multi_select_blue_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Московские ворота", callback_data="ms_stations_k_vorota"))
    # Кнопка выбора 14: 🟦 Электросила
    logging.info(f"🔘 Создаем кнопку: 🟦 Электросила -> ms_stations_ktrosila")
    selected_mark = "✅ " if "🟦 Электросила" in user_data[user_id]["multi_select_blue_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Электросила", callback_data="ms_stations_ktrosila"))
    # Кнопка выбора 15: 🟦 Парк Победы
    logging.info(f"🔘 Создаем кнопку: 🟦 Парк Победы -> ms_stations_k_pobedy")
    selected_mark = "✅ " if "🟦 Парк Победы" in user_data[user_id]["multi_select_blue_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Парк Победы", callback_data="ms_stations_k_pobedy"))
    # Кнопка выбора 16: 🟦 Московская
    logging.info(f"🔘 Создаем кнопку: 🟦 Московская -> ms_stations_kovskaya")
    selected_mark = "✅ " if "🟦 Московская" in user_data[user_id]["multi_select_blue_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Московская", callback_data="ms_stations_kovskaya"))
    # Кнопка выбора 17: 🟦 Звездная
    logging.info(f"🔘 Создаем кнопку: 🟦 Звездная -> ms_stations_vezdnaya")
    selected_mark = "✅ " if "🟦 Звездная" in user_data[user_id]["multi_select_blue_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Звездная", callback_data="ms_stations_vezdnaya"))
    # Кнопка выбора 18: 🟦 Купчино
    logging.info(f"🔘 Создаем кнопку: 🟦 Купчино -> ms_stations_kupchino")
    selected_mark = "✅ " if "🟦 Купчино" in user_data[user_id]["multi_select_blue_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Купчино", callback_data="ms_stations_kupchino"))
    # Кнопка "Готово" для множественного выбора
    logging.info(f"🔘 Создаем кнопку Готово -> done_e_stations")
    builder.add(InlineKeyboardButton(text="Готово", callback_data="done_e_stations"))
    builder.add(InlineKeyboardButton(text="⬅️ Назад к веткам", callback_data="metro_selection_btn_0"))
    builder.adjust(2)
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
        "variable": "response_blue_line_stations",
        "save_to_database": True,
        "node_id": "blue_line_stations",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной response_blue_line_stations (узел blue_line_stations)")
    user_id = callback_query.from_user.id
    
    # Сохраняем нажатие кнопки в базу данных
    # Ищем текят кнопки по callback_data
    button_display_text = "Синяя ветка 🟦"
    
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
        await update_user_data_in_db(user_id, "metro_stations", button_display_text)
        logging.info(f"Переменная metro_stations сохранена: " + str(button_display_text) + f" (пользователь {user_id})")
    else:
        logging.info("⏸️ Пропускаем сохранение переменной: показана условная клавиатура, ждём выбор пользователя")
    
    
    return

@dp.callback_query(lambda c: c.data == "green_line_stations" or c.data.startswith("green_line_stations_btn_") or c.data == "done_e_stations")
async def handle_callback_green_line_stations(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_green_line_stations для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_green_line_stations: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла green_line_stations
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_green_line_stations"] = False
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла green_line_stations: false")
    
    # Проверяем, является ли это кнопкой "Готово"
    if callback_data == "done_e_stations":
        logging.info(f"🏁 Обработка кнопки Готово для множественного выбора: {callback_data}")
        
        # Сохраняем выбранные значения в базу данных
        selected_options = user_data.get(user_id, {}).get("multi_select_green_line_stations", [])
        if selected_options:
            selected_text = ", ".join(selected_options)
            
            # Универсальная логика аккумуляции для всех множественных выборов
            # Загружаем существующие значения
            existing_data = await get_user_data_from_db(user_id, "metro_stations")
            existing_selections = []
            if existing_data and existing_data.strip():
                existing_selections = [s.strip() for s in existing_data.split(",") if s.strip()]
            
            # Объединяем существующие и новые выборы (убираем дубли)
            all_selections = list(set(existing_selections + selected_options))
            final_text = ", ".join(all_selections)
            await update_user_data_in_db(user_id, "metro_stations", final_text)
            logging.info(f"✅ Аккумялировано в переменную metro_stations: {final_text}")
        
        # Очищаем состояние множественного выбора
        if user_id in user_data:
            user_data[user_id].pop("multi_select_green_line_stations", None)
            user_data[user_id].pop("multi_select_node", None)
            user_data[user_id].pop("multi_select_type", None)
            user_data[user_id].pop("multi_select_variable", None)
        
        # Переход к следующему узлу
        next_node_id = "interests_categories"
        try:
            logging.warning(f"⚠️ Целевой узел не найден: {next_node_id}, завершаем переход")
            await callback_query.message.edit_text("Переход завершен")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
            await callback_query.message.edit_text("Переход завершен")
        return
    
    # Обрабатываем узел green_line_stations: green_line_stations
    text = """🟩 Невско-Василеостровская линия

Выбери свою станцию:"""
    
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
    
    # Инициализация состояния множественного выбора
    if user_id not in user_data:
        user_data[user_id] = {}
    
    # Загружаем ранее выбранные варианты
    saved_selections = []
    if user_vars:
        for var_name, var_data in user_vars.items():
            if var_name == "metro_stations":
                if isinstance(var_data, dict) and "value" in var_data:
                    selections_str = var_data["value"]
                elif isinstance(var_data, str):
                    selections_str = var_data
                else:
                    continue
                if selections_str and selections_str.strip():
                    saved_selections = [sel.strip() for sel in selections_str.split(",") if sel.strip()]
                    break
    
    # Инициализируем состояние если его нет
    if "multi_select_green_line_stations" not in user_data[user_id]:
        user_data[user_id]["multi_select_green_line_stations"] = saved_selections.copy()
    user_data[user_id]["multi_select_node"] = "green_line_stations"
    user_data[user_id]["multi_select_type"] = "inline"
    user_data[user_id]["multi_select_variable"] = "metro_stations"
    logging.info(f"Инициализировано состояние множественного выбора с {len(saved_selections)} элементами")
    
    # Создаем inline клавиатуру с поддержкой множественного выбора
    builder = InlineKeyboardBuilder()
    # Кнопка выбора 1: 🟩 Приморская
    logging.info(f"🔘 Создаем кнопку: 🟩 Приморская -> ms_stations_morskaya")
    selected_mark = "✅ " if "🟩 Приморская" in user_data[user_id]["multi_select_green_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟩 Приморская", callback_data="ms_stations_morskaya"))
    # Кнопка выбора 2: 🟩 Василеостровская
    logging.info(f"🔘 Создаем кнопку: 🟩 Василеостровская -> ms_stations_sileostr")
    selected_mark = "✅ " if "🟩 Василеостровская" in user_data[user_id]["multi_select_green_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟩 Василеостровская", callback_data="ms_stations_sileostr"))
    # Кнопка выбора 3: 🟩 Гостиный двор
    logging.info(f"🔘 Создаем кнопку: 🟩 Гостиный двор -> ms_stations_gostiny")
    selected_mark = "✅ " if "🟩 Гостиный двор" in user_data[user_id]["multi_select_green_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟩 Гостиный двор", callback_data="ms_stations_gostiny"))
    # Кнопка выбора 4: 🟩 Маяковская
    logging.info(f"🔘 Создаем кнопку: 🟩 Маяковская -> ms_stations_kovskaya")
    selected_mark = "✅ " if "🟩 Маяковская" in user_data[user_id]["multi_select_green_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟩 Маяковская", callback_data="ms_stations_kovskaya"))
    # Кнопка выбора 5: 🟩 Площадь Александра Невского-1
    logging.info(f"🔘 Создаем кнопку: 🟩 Площадь Александра Невского-1 -> ms_stations_pl_nevsk")
    selected_mark = "✅ " if "🟩 Площадь Александра Невского-1" in user_data[user_id]["multi_select_green_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟩 Площадь Александра Невского-1", callback_data="ms_stations_pl_nevsk"))
    # Кнопка выбора 6: 🟩 Елизаровская
    logging.info(f"🔘 Создаем кнопку: 🟩 Елизаровская -> ms_stations_rovskaya")
    selected_mark = "✅ " if "🟩 Елизаровская" in user_data[user_id]["multi_select_green_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟩 Елизаровская", callback_data="ms_stations_rovskaya"))
    # Кнопка выбора 7: 🟩 Ломоносовская
    logging.info(f"🔘 Создаем кнопку: 🟩 Ломоносовская -> ms_stations_sovskaya")
    selected_mark = "✅ " if "🟩 Ломоносовская" in user_data[user_id]["multi_select_green_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟩 Ломоносовская", callback_data="ms_stations_sovskaya"))
    # Кнопка выбора 8: 🟩 Пролетарская
    logging.info(f"🔘 Создаем кнопку: 🟩 Пролетарская -> ms_stations_tarskaya")
    selected_mark = "✅ " if "🟩 Пролетарская" in user_data[user_id]["multi_select_green_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟩 Пролетарская", callback_data="ms_stations_tarskaya"))
    # Кнопка выбора 9: 🟩 Обухово
    logging.info(f"🔘 Создаем кнопку: 🟩 Обухово -> ms_stations_obuhovo")
    selected_mark = "✅ " if "🟩 Обухово" in user_data[user_id]["multi_select_green_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟩 Обухово", callback_data="ms_stations_obuhovo"))
    # Кнопка выбора 10: 🟩 Рыбацкое
    logging.info(f"🔘 Создаем кнопку: 🟩 Рыбацкое -> ms_stations_rybackoe")
    selected_mark = "✅ " if "🟩 Рыбацкое" in user_data[user_id]["multi_select_green_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟩 Рыбацкое", callback_data="ms_stations_rybackoe"))
    # Кнопка выбора 11: 🟩 Новокрестовская
    logging.info(f"🔘 Создаем кнопку: 🟩 Новокрестовская -> ms_stations_restovsk")
    selected_mark = "✅ " if "🟩 Новокрестовская" in user_data[user_id]["multi_select_green_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟩 Новокрестовская", callback_data="ms_stations_restovsk"))
    # Кнопка выбора 12: 🟩 Беговая
    logging.info(f"🔘 Создаем кнопку: 🟩 Беговая -> ms_stations_begovaya")
    selected_mark = "✅ " if "🟩 Беговая" in user_data[user_id]["multi_select_green_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟩 Беговая", callback_data="ms_stations_begovaya"))
    # Кнопка "Готово" для множественного выбора
    logging.info(f"🔘 Создаем кнопку Готово -> done_e_stations")
    builder.add(InlineKeyboardButton(text="Готово", callback_data="done_e_stations"))
    builder.add(InlineKeyboardButton(text="⬅️ Назад к веткам", callback_data="metro_selection_btn_0"))
    builder.adjust(2)
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
        "variable": "response_green_line_stations",
        "save_to_database": True,
        "node_id": "green_line_stations",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной response_green_line_stations (узел green_line_stations)")
    user_id = callback_query.from_user.id
    
    # Сохраняем нажатие кнопки в базу данных
    # Ищем текят кнопки по callback_data
    button_display_text = "Зелёная ветка 🟩"
    
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
        await update_user_data_in_db(user_id, "metro_stations", button_display_text)
        logging.info(f"Переменная metro_stations сохранена: " + str(button_display_text) + f" (пользователь {user_id})")
    else:
        logging.info("⏸️ Пропускаем сохранение переменной: показана условная клавиатура, ждём выбор пользователя")
    
    
    return

@dp.callback_query(lambda c: c.data == "purple_line_stations" or c.data.startswith("purple_line_stations_btn_") or c.data == "done_e_stations")
async def handle_callback_purple_line_stations(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_purple_line_stations для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_purple_line_stations: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла purple_line_stations
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_purple_line_stations"] = False
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла purple_line_stations: false")
    
    # Проверяем, является ли это кнопкой "Готово"
    if callback_data == "done_e_stations":
        logging.info(f"🏁 Обработка кнопки Готово для множественного выбора: {callback_data}")
        
        # Сохраняем выбранные значения в базу данных
        selected_options = user_data.get(user_id, {}).get("multi_select_purple_line_stations", [])
        if selected_options:
            selected_text = ", ".join(selected_options)
            
            # Универсальная логика аккумуляции для всех множественных выборов
            # Загружаем существующие значения
            existing_data = await get_user_data_from_db(user_id, "metro_stations")
            existing_selections = []
            if existing_data and existing_data.strip():
                existing_selections = [s.strip() for s in existing_data.split(",") if s.strip()]
            
            # Объединяем существующие и новые выборы (убираем дубли)
            all_selections = list(set(existing_selections + selected_options))
            final_text = ", ".join(all_selections)
            await update_user_data_in_db(user_id, "metro_stations", final_text)
            logging.info(f"✅ Аккумялировано в переменную metro_stations: {final_text}")
        
        # Очищаем состояние множественного выбора
        if user_id in user_data:
            user_data[user_id].pop("multi_select_purple_line_stations", None)
            user_data[user_id].pop("multi_select_node", None)
            user_data[user_id].pop("multi_select_type", None)
            user_data[user_id].pop("multi_select_variable", None)
        
        # Переход к следующему узлу
        next_node_id = "interests_categories"
        try:
            logging.warning(f"⚠️ Целевой узел не найден: {next_node_id}, завершаем переход")
            await callback_query.message.edit_text("Переход завершен")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
            await callback_query.message.edit_text("Переход завершен")
        return
    
    # Обрабатываем узел purple_line_stations: purple_line_stations
    text = """🟪 Фрунзенско-Приморская линия

Выбери свою станцию:"""
    
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
    
    # Инициализация состояния множественного выбора
    if user_id not in user_data:
        user_data[user_id] = {}
    
    # Загружаем ранее выбранные варианты
    saved_selections = []
    if user_vars:
        for var_name, var_data in user_vars.items():
            if var_name == "metro_stations":
                if isinstance(var_data, dict) and "value" in var_data:
                    selections_str = var_data["value"]
                elif isinstance(var_data, str):
                    selections_str = var_data
                else:
                    continue
                if selections_str and selections_str.strip():
                    saved_selections = [sel.strip() for sel in selections_str.split(",") if sel.strip()]
                    break
    
    # Инициализируем состояние если его нет
    if "multi_select_purple_line_stations" not in user_data[user_id]:
        user_data[user_id]["multi_select_purple_line_stations"] = saved_selections.copy()
    user_data[user_id]["multi_select_node"] = "purple_line_stations"
    user_data[user_id]["multi_select_type"] = "inline"
    user_data[user_id]["multi_select_variable"] = "metro_stations"
    logging.info(f"Инициализировано состояние множественного выбора с {len(saved_selections)} элементами")
    
    # Создаем inline клавиатуру с поддержкой множественного выбора
    builder = InlineKeyboardBuilder()
    # Кнопка выбора 1: 🟪 Комендантский проспект
    logging.info(f"🔘 Создаем кнопку: 🟪 Комендантский проспект -> ms_stations_ndantsky")
    selected_mark = "✅ " if "🟪 Комендантский проспект" in user_data[user_id]["multi_select_purple_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟪 Комендантский проспект", callback_data="ms_stations_ndantsky"))
    # Кнопка выбора 2: 🟪 Старая Деревня
    logging.info(f"🔘 Создаем кнопку: 🟪 Старая Деревня -> ms_stations_staraya")
    selected_mark = "✅ " if "🟪 Старая Деревня" in user_data[user_id]["multi_select_purple_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟪 Старая Деревня", callback_data="ms_stations_staraya"))
    # Кнопка выбора 3: 🟪 Крестовский остров
    logging.info(f"🔘 Создаем кнопку: 🟪 Крестовский остров -> ms_stations_estovsky")
    selected_mark = "✅ " if "🟪 Крестовский остров" in user_data[user_id]["multi_select_purple_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟪 Крестовский остров", callback_data="ms_stations_estovsky"))
    # Кнопка выбора 4: 🟪 Чкаловская
    logging.info(f"🔘 Создаем кнопку: 🟪 Чкаловская -> ms_stations_lovskaya")
    selected_mark = "✅ " if "🟪 Чкаловская" in user_data[user_id]["multi_select_purple_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟪 Чкаловская", callback_data="ms_stations_lovskaya"))
    # Кнопка выбора 5: 🟪 Спортивная
    logging.info(f"🔘 Создаем кнопку: 🟪 Спортивная -> ms_stations_rtivnaya")
    selected_mark = "✅ " if "🟪 Спортивная" in user_data[user_id]["multi_select_purple_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟪 Спортивная", callback_data="ms_stations_rtivnaya"))
    # Кнопка выбора 6: 🟪 Адмиралтейская
    logging.info(f"🔘 Создаем кнопку: 🟪 Адмиралтейская -> ms_stations_teyskaya")
    selected_mark = "✅ " if "🟪 Адмиралтейская" in user_data[user_id]["multi_select_purple_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟪 Адмиралтейская", callback_data="ms_stations_teyskaya"))
    # Кнопка выбора 7: 🟪 Садовая
    logging.info(f"🔘 Создаем кнопку: 🟪 Садовая -> ms_stations_sadovaya")
    selected_mark = "✅ " if "🟪 Садовая" in user_data[user_id]["multi_select_purple_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟪 Садовая", callback_data="ms_stations_sadovaya"))
    # Кнопка выбора 8: 🟪 Звенигородская
    logging.info(f"🔘 Создаем кнопку: 🟪 Звенигородская -> ms_stations_rodskaya")
    selected_mark = "✅ " if "🟪 Звенигородская" in user_data[user_id]["multi_select_purple_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟪 Звенигородская", callback_data="ms_stations_rodskaya"))
    # Кнопка выбора 9: 🟪 Обводный канал
    logging.info(f"🔘 Создаем кнопку: 🟪 Обводный канал -> ms_stations_obvodniy")
    selected_mark = "✅ " if "🟪 Обводный канал" in user_data[user_id]["multi_select_purple_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟪 Обводный канал", callback_data="ms_stations_obvodniy"))
    # Кнопка выбора 10: 🟪 Волковская
    logging.info(f"🔘 Создаем кнопку: 🟪 Волковская -> ms_stations_kovskaya")
    selected_mark = "✅ " if "🟪 Волковская" in user_data[user_id]["multi_select_purple_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟪 Волковская", callback_data="ms_stations_kovskaya"))
    # Кнопка выбора 11: 🟪 Бухарестская
    logging.info(f"🔘 Создаем кнопку: 🟪 Бухарестская -> ms_stations_estskaya")
    selected_mark = "✅ " if "🟪 Бухарестская" in user_data[user_id]["multi_select_purple_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟪 Бухарестская", callback_data="ms_stations_estskaya"))
    # Кнопка выбора 12: 🟪 Международная
    logging.info(f"🔘 Создаем кнопку: 🟪 Международная -> ms_stations_ezhdunar")
    selected_mark = "✅ " if "🟪 Международная" in user_data[user_id]["multi_select_purple_line_stations"] else ""
    builder.add(InlineKeyboardButton(text=f"{selected_mark}🟪 Международная", callback_data="ms_stations_ezhdunar"))
    # Кнопка "Готово" для множественного выбора
    logging.info(f"🔘 Создаем кнопку Готово -> done_e_stations")
    builder.add(InlineKeyboardButton(text="Готово", callback_data="done_e_stations"))
    builder.add(InlineKeyboardButton(text="⬅️ Назад к веткам", callback_data="metro_selection_btn_0"))
    builder.adjust(2)
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
        "variable": "response_purple_line_stations",
        "save_to_database": True,
        "node_id": "purple_line_stations",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной response_purple_line_stations (узел purple_line_stations)")
    user_id = callback_query.from_user.id
    
    # Сохраняем нажатие кнопки в базу данных
    # Ищем текят кнопки по callback_data
    button_display_text = "Фиолетовая ветка 🟪"
    
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
        await update_user_data_in_db(user_id, "metro_stations", button_display_text)
        logging.info(f"Переменная metro_stations сохранена: " + str(button_display_text) + f" (пользователь {user_id})")
    else:
        logging.info("⏸️ Пропускаем сохранение переменной: показана условная клавиатура, ждём выбор пользователя")
    
    
    return

@dp.callback_query(lambda c: c.data == "metro_selection" or c.data.startswith("metro_selection_btn_") or c.data == "done_selection")
async def handle_callback_metro_selection(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_metro_selection для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_metro_selection: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла metro_selection
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_metro_selection"] = True
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла metro_selection: true")
    
    # Проверяем, был ли переход через кнопку с skipDataCollection
    skip_transition_flag = user_data.get(user_id, {}).get("skipDataCollectionTransition", False)
    if not skip_transition_flag:
        await update_user_data_in_db(user_id, "metro_stations", callback_query.data)
        logging.info(f"Переменная metro_stations сохранена: " + str(callback_query.data) + f" (пользователь {user_id})")
    else:
        # Сбрасываем флаг
        if user_id in user_data and "skipDataCollectionTransition" in user_data[user_id]:
            del user_data[user_id]["skipDataCollectionTransition"]
        logging.info(f"Переход через skipDataCollection, переменная metro_stations не сохраняется (пользователь {user_id})")
    
    # Обрабатываем узел metro_selection: metro_selection
    text = """На какой станции метро ты обычно бываешь? 🚇

Выбери свою ветку:"""
    
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
    builder.add(InlineKeyboardButton(text="Красная ветка 🟥", callback_data="red_line_stations_btn_0"))
    builder.add(InlineKeyboardButton(text="Синяя ветка 🟦", callback_data="blue_line_stations_btn_1"))
    builder.add(InlineKeyboardButton(text="Зелёная ветка 🟩", callback_data="green_line_stations_btn_2"))
    builder.add(InlineKeyboardButton(text="Фиолетовая ветка 🟪", callback_data="purple_line_stations_btn_3"))
    builder.add(InlineKeyboardButton(text="Я из ЛО 🏡", callback_data="interests_categories_btn_4"))
    builder.add(InlineKeyboardButton(text="Я не в Питере 🌍", callback_data="interests_categories_btn_5"))
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
        "variable": "metro_stations",
        "save_to_database": True,
        "node_id": "metro_selection",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной metro_stations (узел metro_selection)")
    user_id = callback_query.from_user.id
    
    # Сохраняем нажатие кнопки в базу данных
    # Ищем текят кнопки по callback_data
    button_display_text = "⬅️ Назад к веткам"
    
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
    
    
    # Удаляем старое сообщение
    
    text = """На какой станции метро ты обычно бываешь? 🚇

Выбери свою ветку:"""
    # ИСПРАВЛЕНИЕ: Не отправляем сообщение второй раз, если оно уже было отправлено ранее в обработчике
    # Вместо этого, просто настраиваем ожидание ввода
    # Настраиваем ожидание ввода (collectUserInput=true)
    user_data[callback_query.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "variable": "metro_stations",
        "save_to_database": False,
        "node_id": "metro_selection",
        "next_node_id": ""
    }
    return

@dp.callback_query(lambda c: c.data == "age_input" or c.data.startswith("age_input_btn_") or c.data == "done_age_input")
async def handle_callback_age_input(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_age_input для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_age_input: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла age_input
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_age_input"] = True
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла age_input: true")
    
    # Проверяем, был ли переход через кнопку с skipDataCollection
    skip_transition_flag = user_data.get(user_id, {}).get("skipDataCollectionTransition", False)
    if not skip_transition_flag:
        await update_user_data_in_db(user_id, "user_age", callback_query.data)
        logging.info(f"Переменная user_age сохранена: " + str(callback_query.data) + f" (пользователь {user_id})")
    else:
        # Сбрасываем флаг
        if user_id in user_data and "skipDataCollectionTransition" in user_data[user_id]:
            del user_data[user_id]["skipDataCollectionTransition"]
        logging.info(f"Переход через skipDataCollection, переменная user_age не сохраняется (пользователь {user_id})")
    
    # Обрабатываем узел age_input: age_input
    text = """Сколько тебе лет? 🎂

Напиши свой возраст числом (например, 25):"""
    
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
        "variable": "user_age",
        "save_to_database": True,
        "node_id": "age_input",
        "next_node_id": "metro_selection",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной user_age (узел age_input)")
    user_id = callback_query.from_user.id
    
    # Сохраняем нажатие кнопки в базу данных
    # Ищем текят кнопки по callback_data
    button_display_text = "🎂 Изменить возраст"
    
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
    
    
    # Удаляем старое сообщение
    
    text = """Сколько тебе лет? 🎂

Напиши свой возраст числом (например, 25):"""
    # ИСПРАВЛЕНИЕ: Не отправляем сообщение второй раз, если оно уже было отправлено ранее в обработчике
    # Вместо этого, просто настраиваем ожидание ввода
    # Настраиваем ожидание ввода (collectUserInput=true)
    user_data[callback_query.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "variable": "user_age",
        "save_to_database": False,
        "node_id": "age_input",
        "next_node_id": "metro_selection"
    }
    return

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
    builder.add(InlineKeyboardButton(text="Да 😎", callback_data="gender_selection_btn_0"))
    builder.add(InlineKeyboardButton(text="Нет 🙅", callback_data="decline_response_btn_1"))
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

@dp.callback_query(lambda c: c.data == "profile_complete" or c.data.startswith("profile_complete_btn_") or c.data == "done_e_complete")
async def handle_callback_profile_complete(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_profile_complete для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_profile_complete: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла profile_complete
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_profile_complete"] = False
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла profile_complete: false")
    
    # Обрабатываем узел profile_complete: profile_complete
    text = """🎉 Отлично! Твой профиль заполнен!

👤 Твоя анкета:
Пол: {gender}
Имя: {user_name}
Возраст: {user_age}
Метро: {metro_stations}
Интересы: {user_interests}
Семейное положение: {marital_status}
Ориентация: {sexual_orientation}

💬 Источник: {user_source}

Можешь посмотреть полную анкету или сразу получить ссылку на чат!"""
    
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
    # Кнопка команды: Ссылка на чат 🔗 -> /link
    builder.add(InlineKeyboardButton(text="Ссылка на чат 🔗", callback_data="cmd_link"))
    # Кнопка команды: Редактировать профиль ✏️ -> /profile
    builder.add(InlineKeyboardButton(text="Редактировать профиль ✏️", callback_data="cmd_profile"))
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
        "variable": "response_profile_complete",
        "save_to_database": True,
        "node_id": "profile_complete",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной response_profile_complete (узел profile_complete)")
    user_id = callback_query.from_user.id
    
    
    return

@dp.callback_query(lambda c: c.data == "show_profile" or c.data.startswith("show_profile_btn_") or c.data == "done_ow_profile")
async def handle_callback_show_profile(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_show_profile для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_show_profile: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла show_profile
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_show_profile"] = False
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла show_profile: false")
    
    # Обрабатываем узел show_profile: show_profile
    text = """👤 Твой профиль:

Пол: {gender} 👤
Имя: {user_name} ✏️
Возраст: {user_age} 🎂
Метро: {metro_stations} 🚇
Интересы: {user_interests} 🎯
Семейное положение: {marital_status} 💍
Ориентация: {sexual_orientation} 🌈

💬 Источник: {user_source}

✏️ Выберите действие:"""
    
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
    builder.add(InlineKeyboardButton(text="👤 Изменить пол", callback_data="gender_selection_btn_0"))
    builder.add(InlineKeyboardButton(text="✏️ Изменить имя", callback_data="name_input_btn_1"))
    builder.add(InlineKeyboardButton(text="🎂 Изменить возраст", callback_data="age_input_btn_2"))
    builder.add(InlineKeyboardButton(text="🚇 Изменить метро", callback_data="metro_selection_btn_3"))
    builder.add(InlineKeyboardButton(text="🎯 Изменить интересы", callback_data="interests_categories_btn_4"))
    builder.add(InlineKeyboardButton(text="💍 Изменить семейное положение", callback_data="marital_status_btn_5"))
    builder.add(InlineKeyboardButton(text="🌈 Изменить ориентацию", callback_data="sexual_orientation_btn_6"))
    builder.add(InlineKeyboardButton(text="📢 Указать ТГК", callback_data="channel_choice_btn_7"))
    builder.add(InlineKeyboardButton(text="📝 Добавить о себе", callback_data="extra_info_btn_8"))
    # Кнопка команды: 🔄 Начать заново -> /start
    builder.add(InlineKeyboardButton(text="🔄 Начать заново", callback_data="cmd_start"))
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
        "variable": "response_show_profile",
        "save_to_database": True,
        "node_id": "show_profile",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной response_show_profile (узел show_profile)")
    user_id = callback_query.from_user.id
    
    
    return

@dp.callback_query(lambda c: c.data == "chat_link" or c.data.startswith("chat_link_btn_") or c.data == "done_chat_link")
async def handle_callback_chat_link(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_chat_link для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_chat_link: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла chat_link
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_chat_link"] = False
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла chat_link: false")
    
    # Обрабатываем узел chat_link: chat_link
    text = """🔗 Актуальная ссылка на чат:

https://t.me/+agkIVgCzHtY2ZTA6

Добро пожаловать в сообщество ᴠᴨᴩᴏᴦʏᴧᴋᴇ! 🎉"""
    
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
        "variable": "response_chat_link",
        "save_to_database": True,
        "node_id": "chat_link",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной response_chat_link (узел chat_link)")
    user_id = callback_query.from_user.id
    
    
    return

@dp.callback_query(lambda c: c.data == "help_command" or c.data.startswith("help_command_btn_") or c.data == "done_lp_command")
async def handle_callback_help_command(callback_query: types.CallbackQuery):
    # Безопасное получение данных из callback_query
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Вызван callback handler: handle_callback_help_command для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка доступа к callback_query в handle_callback_help_command: {e}")
        return
    
    # Проверяем флаг hideAfterClick для кнопок
    
    
    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)
    
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    # Устанавливаем флаг collectUserInput для узла help_command
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["collectUserInput_help_command"] = False
    logging.info(f"ℹ️ Установлен флаг collectUserInput для узла help_command: false")
    
    # Обрабатываем узел help_command: help_command
    text = """🤖 **Добро пожаловать в справочный центр!**

🌟 **ᴠᴨᴩᴏᴦʏᴧᴋᴇ Bot**
*Твой помощник в знакомствах*

🎯 **ОСНОВНЫЕ КОМАНДЫ:**

🚀 `/start` — *Начать заново*
   📝 Синонимы: `старт`, `начать`, `привет`, `начало`, `начинаем`

👤 `/profile` — *Мой профиль*
   📝 Синонимы: `профиль`, `анкета`, `мой профиль`, `посмотреть профиль`, `редактировать профиль`

🔗 `/link` — *Ссылка на чат*
   📝 Синонимы: `ссылка`, `чат`, `сообщество`, `впрогулке`, `линк`

🆘 `/help` — *Эта справка*
   📝 Синонимы: `помощь`, `справка`, `команды`, `что писать`, `как пользоваться`

📋 **РАЗДЕЛЫ АНКЕТЫ И ИХ СИНОНИМЫ:**

👫 **Пол:** мужской, женский
   📝 Синонимы: `пол`, `gender`

🏷️ **Имя:** любое имя
   📝 Синонимы: `имя`, `как зовут`, `назовись`

🎂 **Возраст:** число от 18 до 99
   📝 Синонимы: `возраст`, `лет`, `сколько лет`

🚇 **Метро:** выбор линии и станции
   📝 Синонимы: `метро`, `станция`
   🟥 Красная линия: `красная линия`, `кировско-выборгская`, `красная ветка`
   🟦 Синяя линия: `синяя линия`, `московско-петроградская`, `синяя ветка`
   🟩 Зеленая линия: `зеленая линия`, `невско-василеостровская`, `зеленая ветка`
   🟧 Оранжевая линия: `оранжевая линия`, `правобережная`, `оранжевая ветка`
   🟪 Фиолетовая линия: `фиолетовая линия`, `фрунзенско-приморская`, `фиолетовая ветка`

🎨 **Интересы и их синонимы:**
   🎮 Хобби: `хобби`, `увлечения`, `занятия`, `игры`
   🤝 Социальная жизнь: `общение`, `социальное`, `люди`, `тусовки`
   🎭 Творчество: `творчество`, `искусство`, `рисование`, `музыка`
   💪 Активный образ жизни: `активность`, `активный`, `движение`, `здоровье`
   🍕 Еда и напитки: `еда`, `напитки`, `кухня`, `рестораны`
   ⚽ Спорт: `спорт`, `фитнес`, `тренировки`, `футбол`

💑 **Семейное положение:** поиск, отношения, женат/замужем, сложно
   📝 Синонимы: `семейное положение`, `статус`, `отношения`, `семья`

🌈 **Ориентация:** гетеро, гей, лесби, би, другое
   📝 Синонимы: `ориентация`, `предпочтения`

📺 **Телеграм-канал:** опционально
   📝 Синонимы: `тгк`, `телеграм`, `канал`, `тг канал`

📖 **О себе:** дополнительная информация
   📝 Синонимы: `о себе`, `описание`, `расскажи`, `инфо`

👮‍♂️ **КОМАНДЫ МОДЕРАЦИИ:**

**Управление контентом:**
📌 `/pin_message` - Закрепить сообщение
   📝 Синонимы: `закрепить`, `прикрепить`, `зафиксировать`

📌❌ `/unpin_message` - Открепить сообщение
   📝 Синонимы: `открепить`, `отцепить`, `убрать закрепление`

🗑️ `/delete_message` - Удалить сообщение
   📝 Синонимы: `удалить`, `стереть`, `убрать сообщение`

**Управление пользователями:**
🚫 `/ban_user` - Заблокировать пользователя
   📝 Синонимы: `забанить`, `заблокировать`, `бан`

✅ `/unban_user` - Разблокировать пользователя
   📝 Синонимы: `разбанить`, `разблокировать`, `unbán`

🔇 `/mute_user` - Ограничить пользователя
   📝 Синонимы: `замутить`, `заглушить`, `мут`

🔊 `/unmute_user` - Снять ограничения
   📝 Синонимы: `размутить`, `разглушить`, `анмут`

👢 `/kick_user` - Исключить пользователя
   📝 Синонимы: `кикнуть`, `исключить`, `выгнать`

👑 `/promote_user` - Назначить администратором
   📝 Синонимы: `повысить`, `назначить админом`, `промоут`

👤 `/demote_user` - Снять с администратора
   📝 Синонимы: `понизить`, `снять с админа`, `демоут`

⚙️ `/admin_rights` - Настроить права администратора
   📝 Синонимы: `права админа`, `настроить права`, `тг права`
   ⚠️ Только для администраторов группы!
   💡 Ответьте на сообщение пользователя командой

**Примеры использования:**
• Ответьте на сообщение командой для его обработки
• Используйте команды в ответ на сообщения нарушителей
• Команды с правами работают только в группах/супергруппах
• Все действия логируются для отчетности

💡 **ПОЛЕЗНЫЕ СОВЕТЫ:**

✨ Можешь писать команды или синонимы в любом месте разговора
✨ Бот поймет твои сообщения даже без команд
✨ В любой момент можешь написать /start для начала заново
✨ Используй /profile для изменения любых данных
✨ Нажми на любое выделенное слово чтобы скопировать его!

🎉 **Удачных знакомств в Питере!** 🎉"""
    
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
    # Кнопка команды: 🚀 Начать заполнение -> /start
    builder.add(InlineKeyboardButton(text="🚀 Начать заполнение", callback_data="cmd_start"))
    # Кнопка команды: 👤 Мой профиль -> /profile
    builder.add(InlineKeyboardButton(text="👤 Мой профиль", callback_data="cmd_profile"))
    # Кнопка команды: 🔗 Ссылка на чат -> /link
    builder.add(InlineKeyboardButton(text="🔗 Ссылка на чат", callback_data="cmd_link"))
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
        "variable": "response_help_command",
        "save_to_database": True,
        "node_id": "help_command",
        "next_node_id": "",
        "min_length": 0,
        "max_length": 0,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": ""
    }
    logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной response_help_command (узел help_command)")
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
                elif skip_button_target == "gender_selection":
                    await handle_callback_gender_selection(fake_callback)
                elif skip_button_target == "name_input":
                    await handle_callback_name_input(fake_callback)
                elif skip_button_target == "age_input":
                    await handle_callback_age_input(fake_callback)
                elif skip_button_target == "metro_selection":
                    await handle_callback_metro_selection(fake_callback)
                elif skip_button_target == "red_line_stations":
                    await handle_callback_red_line_stations(fake_callback)
                elif skip_button_target == "blue_line_stations":
                    await handle_callback_blue_line_stations(fake_callback)
                elif skip_button_target == "green_line_stations":
                    await handle_callback_green_line_stations(fake_callback)
                elif skip_button_target == "purple_line_stations":
                    await handle_callback_purple_line_stations(fake_callback)
                elif skip_button_target == "profile_complete":
                    await handle_callback_profile_complete(fake_callback)
                elif skip_button_target == "show_profile":
                    await handle_callback_show_profile(fake_callback)
                elif skip_button_target == "chat_link":
                    await handle_callback_chat_link(fake_callback)
                elif skip_button_target == "help_command":
                    await handle_callback_help_command(fake_callback)
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
                    elif next_node_id == "gender_selection":
                        # ИСПРАВЛЕНИЕ: У узла есть кнопки - показываем их И настраиваем ожидание для сохранения ответа
                        logging.info(f"✅ Показаны кнопки для узла gender_selection с collectUserInput=true")
                        text = "Укажи свой пол: 👨👩"
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
                        builder.add(InlineKeyboardButton(text="Мужчина 👨", callback_data="name_input"))
                        builder.add(InlineKeyboardButton(text="Женщина 👩", callback_data="name_input"))
                        builder.adjust(1)
                        keyboard = builder.as_markup()
                        await message.answer(text, reply_markup=keyboard)
                        # Настраиваем ожидание ввода для сохранения ответа кнопки
                        user_data[user_id]["waiting_for_input"] = {
                            "type": "button",
                            "modes": ['button'],
                            "variable": "gender",
                            "save_to_database": True,
                            "node_id": "gender_selection",
                            "next_node_id": "",
                            "skip_buttons": []
                        }
                        logging.info(f"✅ Сояяяятояние ожид����ия настроено: modes=['button'] для пер��менной gender (узел gender_selection)")
                    elif next_node_id == "name_input":
                        # Узел собирает пользовательский ввод
                        logging.info(f"🔧 Условная навигация к узлу с вводом: name_input")
                        text = """Как тебя зовут? ✏️

Напиши своё имя в сообщении:"""
                        await message.answer(text)
                        # Настраиваем ожидание ввода
                        user_data[user_id]["waiting_for_input"] = {
                            "type": "text",
                            "modes": ["text"],
                            "variable": "user_name",
                            "save_to_database": True,
                            "node_id": "name_input",
                            "next_node_id": "age_input"
                        }
                        logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной user_name (узел name_input)")
                    elif next_node_id == "age_input":
                        # Узел собирает пользовательский ввод
                        logging.info(f"🔧 Условная навигация к узлу с вводом: age_input")
                        text = """Сколько тебе лет? 🎂

Напиши свой возраст числом (например, 25):"""
                        await message.answer(text)
                        # Настраиваем ожидание ввода
                        user_data[user_id]["waiting_for_input"] = {
                            "type": "text",
                            "modes": ["text"],
                            "variable": "user_age",
                            "save_to_database": True,
                            "node_id": "age_input",
                            "next_node_id": "metro_selection"
                        }
                        logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной user_age (узел age_input)")
                    elif next_node_id == "metro_selection":
                        # ИСПРАВЛЕНИЕ: У узла есть кнопки - показываем их И настраиваем ожидание для сохранения ответа
                        logging.info(f"✅ Показаны кнопки для узла metro_selection с collectUserInput=true")
                        text = """На какой станции метро ты обычно бываешь? 🚇

Выбери свою ветку:"""
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
                        builder.add(InlineKeyboardButton(text="Красная ветка 🟥", callback_data="red_line_stations"))
                        builder.add(InlineKeyboardButton(text="Синяя ветка 🟦", callback_data="blue_line_stations"))
                        builder.add(InlineKeyboardButton(text="Зелёная ветка 🟩", callback_data="green_line_stations"))
                        builder.add(InlineKeyboardButton(text="Фиолетовая ветка 🟪", callback_data="purple_line_stations"))
                        builder.add(InlineKeyboardButton(text="Я из ЛО 🏡", callback_data="interests_categories"))
                        builder.add(InlineKeyboardButton(text="Я не в Питере 🌍", callback_data="interests_categories"))
                        builder.adjust(2)
                        keyboard = builder.as_markup()
                        await message.answer(text, reply_markup=keyboard)
                        # Настраиваем ожидание ввода для сохранения ответа кнопки
                        user_data[user_id]["waiting_for_input"] = {
                            "type": "button",
                            "modes": ['button'],
                            "variable": "metro_stations",
                            "save_to_database": True,
                            "node_id": "metro_selection",
                            "next_node_id": "",
                            "skip_buttons": [{"text":"Красная ветка 🟥","target":"red_line_stations"},{"text":"Синяя ветка 🟦","target":"blue_line_stations"},{"text":"Зелёная ветка 🟩","target":"green_line_stations"},{"text":"Фиолетовая ветка 🟪","target":"purple_line_stations"}]
                        }
                        logging.info(f"✅ Сояяяятояние ожид����ия настроено: modes=['button'] для пер��менной metro_stations (узел metro_selection)")
                    elif next_node_id == "red_line_stations":
                        # Прямая навигация к узлу с множественным выбором red_line_stations
                        logging.info(f"🔧 Условная навигация к узлу с множественным выбором: red_line_stations")
                        text = """🟥 Кировско-Выборгская линия

Выбери свою станцию:"""
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
                        
                        # Инициализируем состояние множественного выбора
                        user_data[user_id]["multi_select_red_line_stations"] = []
                        user_data[user_id]["multi_select_node"] = "red_line_stations"
                        user_data[user_id]["multi_select_type"] = "selection"
                        user_data[user_id]["multi_select_variable"] = "metro_stations"
                        # Инициализация состояния множественного выбора
                        if user_id not in user_data:
                            user_data[user_id] = {}
                        
                        # Загружаем ранее выбранные варианты
                        saved_selections = []
                        if user_vars:
                            for var_name, var_data in user_vars.items():
                                if var_name == "metro_stations":
                                    if isinstance(var_data, dict) and "value" in var_data:
                                        selections_str = var_data["value"]
                                    elif isinstance(var_data, str):
                                        selections_str = var_data
                                    else:
                                        continue
                                    if selections_str and selections_str.strip():
                                        saved_selections = [sel.strip() for sel in selections_str.split(",") if sel.strip()]
                                        break
                        
                        # Инициализируем состояние если его нет
                        if "multi_select_red_line_stations" not in user_data[user_id]:
                            user_data[user_id]["multi_select_red_line_stations"] = saved_selections.copy()
                        user_data[user_id]["multi_select_node"] = "red_line_stations"
                        user_data[user_id]["multi_select_type"] = "inline"
                        user_data[user_id]["multi_select_variable"] = "metro_stations"
                        logging.info(f"Инициализировано состояние множественного выбора с {len(saved_selections)} элементами")
                        
                        builder = InlineKeyboardBuilder()
                        # Кнопка выбора с галочками: 🟥 Девяткино
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Девяткино' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                        selected_mark = "✅ " if "🟥 Девяткино" in user_data[user_id]["multi_select_red_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Девяткино': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟥 Девяткино"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_devyatkino'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_devyatkino"))
                        # Кнопка выбора с галочками: 🟥 Гражданский проспект
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Гражданский проспект' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                        selected_mark = "✅ " if "🟥 Гражданский проспект" in user_data[user_id]["multi_select_red_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Гражданский проспект': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟥 Гражданский проспект"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_grazhdansky'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_grazhdansky"))
                        # Кнопка выбора с галочками: 🟥 Академическая
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Академическая' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                        selected_mark = "✅ " if "🟥 Академическая" in user_data[user_id]["multi_select_red_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Академическая': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟥 Академическая"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_akademicheskaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_akademicheskaya"))
                        # Кнопка выбора с галочками: 🟥 Политехническая
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Политехническая' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                        selected_mark = "✅ " if "🟥 Политехническая" in user_data[user_id]["multi_select_red_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Политехническая': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟥 Политехническая"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_politehnicheskaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_politehnicheskaya"))
                        # Кнопка выбора с галочками: 🟥 Площадь Мужества
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Площадь Мужества' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                        selected_mark = "✅ " if "🟥 Площадь Мужества" in user_data[user_id]["multi_select_red_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Площадь Мужества': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟥 Площадь Мужества"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_pl_muzhestva'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_pl_muzhestva"))
                        # Кнопка выбора с галочками: 🟥 Лесная
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Лесная' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                        selected_mark = "✅ " if "🟥 Лесная" in user_data[user_id]["multi_select_red_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Лесная': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟥 Лесная"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_lesnaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_lesnaya"))
                        # Кнопка выбора с галочками: 🟥 Выборгская
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Выборгская' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                        selected_mark = "✅ " if "🟥 Выборгская" in user_data[user_id]["multi_select_red_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Выборгская': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟥 Выборгская"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_vyborgskaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_vyborgskaya"))
                        # Кнопка выбора с галочками: 🟥 Площадь Ленина
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Площадь Ленина' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                        selected_mark = "✅ " if "🟥 Площадь Ленина" in user_data[user_id]["multi_select_red_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Площадь Ленина': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟥 Площадь Ленина"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_pl_lenina'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_pl_lenina"))
                        # Кнопка выбора с галочками: 🟥 Чернышевская
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Чернышевская' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                        selected_mark = "✅ " if "🟥 Чернышевская" in user_data[user_id]["multi_select_red_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Чернышевская': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟥 Чернышевская"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_chernyshevskaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_chernyshevskaya"))
                        # Кнопка выбора с галочками: 🟥 Площадь Восстания
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Площадь Восстания' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                        selected_mark = "✅ " if "🟥 Площадь Восстания" in user_data[user_id]["multi_select_red_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Площадь Восстания': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟥 Площадь Восстания"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_pl_vosstaniya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_pl_vosstaniya"))
                        # Кнопка выбора с галочками: 🟥 Владимирская
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Владимирская' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                        selected_mark = "✅ " if "🟥 Владимирская" in user_data[user_id]["multi_select_red_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Владимирская': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟥 Владимирская"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_vladimirskaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_vladimirskaya"))
                        # Кнопка выбора с галочками: 🟥 Пушкинская
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Пушкинская' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                        selected_mark = "✅ " if "🟥 Пушкинская" in user_data[user_id]["multi_select_red_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Пушкинская': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟥 Пушкинская"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_pushkinskaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_pushkinskaya"))
                        # Кнопка выбора с галочками: 🟥 Технологический институт-1
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Технологический институт-1' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                        selected_mark = "✅ " if "🟥 Технологический институт-1" in user_data[user_id]["multi_select_red_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Технологический институт-1': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟥 Технологический институт-1"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_tehinstitut1'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_tehinstitut1"))
                        # Кнопка выбора с галочками: 🟥 Балтийская
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Балтийская' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                        selected_mark = "✅ " if "🟥 Балтийская" in user_data[user_id]["multi_select_red_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Балтийская': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟥 Балтийская"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_baltiyskaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_baltiyskaya"))
                        # Кнопка выбора с галочками: 🟥 Нарвская
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Нарвская' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                        selected_mark = "✅ " if "🟥 Нарвская" in user_data[user_id]["multi_select_red_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Нарвская': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟥 Нарвская"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_narvskaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_narvskaya"))
                        # Кнопка выбора с галочками: 🟥 Кировский завод
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Кировский завод' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                        selected_mark = "✅ " if "🟥 Кировский завод" in user_data[user_id]["multi_select_red_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Кировский завод': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟥 Кировский завод"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_kirovsky'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_kirovsky"))
                        # Кнопка выбора с галочками: 🟥 Автово
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Автово' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                        selected_mark = "✅ " if "🟥 Автово" in user_data[user_id]["multi_select_red_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Автово': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟥 Автово"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_avtovo'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_avtovo"))
                        # Кнопка выбора с галочками: 🟥 Ленинский проспект
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Ленинский проспект' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                        selected_mark = "✅ " if "🟥 Ленинский проспект" in user_data[user_id]["multi_select_red_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Ленинский проспект': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟥 Ленинский проспект"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_leninsky'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_leninsky"))
                        # Кнопка выбора с галочками: 🟥 Проспект Ветеранов
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Проспект Ветеранов' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                        selected_mark = "✅ " if "🟥 Проспект Ветеранов" in user_data[user_id]["multi_select_red_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Проспект Ветеранов': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟥 Проспект Ветеранов"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_veteranov'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_veteranov"))
                        builder.add(InlineKeyboardButton(text="⬅️ Назад к веткам", callback_data="metro_selection"))
                        # Добавляем кнопку "Готово" для множественного выбора
                        builder.add(InlineKeyboardButton(text="Готово", callback_data="multi_select_done_red_line_stations"))
                        builder.adjust(2)
                        keyboard = builder.as_markup()
                        # Заменяем все переменные в тексте
                        text = replace_variables_in_text(text, user_vars)
                        await message.answer(text, reply_markup=keyboard)
                        logging.info(f"✅ Прямая навигация к узлу множественного выбора red_line_stations выполнена")
                    elif next_node_id == "blue_line_stations":
                        # Прямая навигация к узлу с множественным выбором blue_line_stations
                        logging.info(f"🔧 Условная навигация к узлу с множественным выбором: blue_line_stations")
                        text = """🟦 Московско-Петроградская линия

Выбери свою станцию:"""
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
                        
                        # Инициализируем состояние множественного выбора
                        user_data[user_id]["multi_select_blue_line_stations"] = []
                        user_data[user_id]["multi_select_node"] = "blue_line_stations"
                        user_data[user_id]["multi_select_type"] = "selection"
                        user_data[user_id]["multi_select_variable"] = "metro_stations"
                        # Инициализация состояния множественного выбора
                        if user_id not in user_data:
                            user_data[user_id] = {}
                        
                        # Загружаем ранее выбранные варианты
                        saved_selections = []
                        if user_vars:
                            for var_name, var_data in user_vars.items():
                                if var_name == "metro_stations":
                                    if isinstance(var_data, dict) and "value" in var_data:
                                        selections_str = var_data["value"]
                                    elif isinstance(var_data, str):
                                        selections_str = var_data
                                    else:
                                        continue
                                    if selections_str and selections_str.strip():
                                        saved_selections = [sel.strip() for sel in selections_str.split(",") if sel.strip()]
                                        break
                        
                        # Инициализируем состояние если его нет
                        if "multi_select_blue_line_stations" not in user_data[user_id]:
                            user_data[user_id]["multi_select_blue_line_stations"] = saved_selections.copy()
                        user_data[user_id]["multi_select_node"] = "blue_line_stations"
                        user_data[user_id]["multi_select_type"] = "inline"
                        user_data[user_id]["multi_select_variable"] = "metro_stations"
                        logging.info(f"Инициализировано состояние множественного выбора с {len(saved_selections)} элементами")
                        
                        builder = InlineKeyboardBuilder()
                        # Кнопка выбора с галочками: 🟦 Парнас
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Парнас' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                        selected_mark = "✅ " if "🟦 Парнас" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Парнас': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟦 Парнас"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_parnas'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_parnas"))
                        # Кнопка выбора с галочками: 🟦 Проспект Просвещения
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Проспект Просвещения' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                        selected_mark = "✅ " if "🟦 Проспект Просвещения" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Проспект Просвещения': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟦 Проспект Просвещения"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_prosp_prosvesh'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_prosp_prosvesh"))
                        # Кнопка выбора с галочками: 🟦 Озерки
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Озерки' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                        selected_mark = "✅ " if "🟦 Озерки" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Озерки': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟦 Озерки"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_ozerki'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_ozerki"))
                        # Кнопка выбора с галочками: 🟦 Удельная
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Удельная' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                        selected_mark = "✅ " if "🟦 Удельная" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Удельная': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟦 Удельная"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_udelnaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_udelnaya"))
                        # Кнопка выбора с галочками: 🟦 Пионерская
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Пионерская' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                        selected_mark = "✅ " if "🟦 Пионерская" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Пионерская': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟦 Пионерская"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_pionerskaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_pionerskaya"))
                        # Кнопка выбора с галочками: 🟦 Черная речка
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Черная речка' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                        selected_mark = "✅ " if "🟦 Черная речка" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Черная речка': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟦 Черная речка"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_chernaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_chernaya"))
                        # Кнопка выбора с галочками: 🟦 Петроградская
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Петроградская' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                        selected_mark = "✅ " if "🟦 Петроградская" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Петроградская': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟦 Петроградская"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_petrogradskaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_petrogradskaya"))
                        # Кнопка выбора с галочками: 🟦 Горьковская
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Горьковская' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                        selected_mark = "✅ " if "🟦 Горьковская" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Горьковская': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟦 Горьковская"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_gorkovskaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_gorkovskaya"))
                        # Кнопка выбора с галочками: 🟦 Невский проспект
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Невский проспект' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                        selected_mark = "✅ " if "🟦 Невский проспект" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Невский проспект': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟦 Невский проспект"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_nevsky'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_nevsky"))
                        # Кнопка выбора с галочками: 🟦 Сенная площадь
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Сенная площадь' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                        selected_mark = "✅ " if "🟦 Сенная площадь" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Сенная площадь': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟦 Сенная площадь"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_sennaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_sennaya"))
                        # Кнопка выбора с галочками: 🟦 Технологический институт-2
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Технологический институт-2' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                        selected_mark = "✅ " if "🟦 Технологический институт-2" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Технологический институт-2': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟦 Технологический институт-2"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_tehinstitut2'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_tehinstitut2"))
                        # Кнопка выбора с галочками: 🟦 Фрунзенская
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Фрунзенская' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                        selected_mark = "✅ " if "🟦 Фрунзенская" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Фрунзенская': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟦 Фрунзенская"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_frunzenskaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_frunzenskaya"))
                        # Кнопка выбора с галочками: 🟦 Московские ворота
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Московские ворота' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                        selected_mark = "✅ " if "🟦 Московские ворота" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Московские ворота': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟦 Московские ворота"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_mosk_vorota'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_mosk_vorota"))
                        # Кнопка выбора с галочками: 🟦 Электросила
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Электросила' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                        selected_mark = "✅ " if "🟦 Электросила" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Электросила': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟦 Электросила"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_elektrosila'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_elektrosila"))
                        # Кнопка выбора с галочками: 🟦 Парк Победы
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Парк Победы' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                        selected_mark = "✅ " if "🟦 Парк Победы" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Парк Победы': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟦 Парк Победы"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_park_pobedy'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_park_pobedy"))
                        # Кнопка выбора с галочками: 🟦 Московская
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Московская' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                        selected_mark = "✅ " if "🟦 Московская" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Московская': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟦 Московская"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_moskovskaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_moskovskaya"))
                        # Кнопка выбора с галочками: 🟦 Звездная
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Звездная' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                        selected_mark = "✅ " if "🟦 Звездная" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Звездная': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟦 Звездная"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_zvezdnaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_zvezdnaya"))
                        # Кнопка выбора с галочками: 🟦 Купчино
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Купчино' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                        selected_mark = "✅ " if "🟦 Купчино" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Купчино': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟦 Купчино"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_kupchino'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_kupchino"))
                        builder.add(InlineKeyboardButton(text="⬅️ Назад к веткам", callback_data="metro_selection"))
                        # Добавляем кнопку "Готово" для множественного выбора
                        builder.add(InlineKeyboardButton(text="Готово", callback_data="multi_select_done_blue_line_stations"))
                        builder.adjust(2)
                        keyboard = builder.as_markup()
                        # Заменяем все переменные в тексте
                        text = replace_variables_in_text(text, user_vars)
                        await message.answer(text, reply_markup=keyboard)
                        logging.info(f"✅ Прямая навигация к узлу множественного выбора blue_line_stations выполнена")
                    elif next_node_id == "green_line_stations":
                        # Прямая навигация к узлу с множественным выбором green_line_stations
                        logging.info(f"🔧 Условная навигация к узлу с множественным выбором: green_line_stations")
                        text = """🟩 Невско-Василеостровская линия

Выбери свою станцию:"""
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
                        
                        # Инициализируем состояние множественного выбора
                        user_data[user_id]["multi_select_green_line_stations"] = []
                        user_data[user_id]["multi_select_node"] = "green_line_stations"
                        user_data[user_id]["multi_select_type"] = "selection"
                        user_data[user_id]["multi_select_variable"] = "metro_stations"
                        # Инициализация состояния множественного выбора
                        if user_id not in user_data:
                            user_data[user_id] = {}
                        
                        # Загружаем ранее выбранные варианты
                        saved_selections = []
                        if user_vars:
                            for var_name, var_data in user_vars.items():
                                if var_name == "metro_stations":
                                    if isinstance(var_data, dict) and "value" in var_data:
                                        selections_str = var_data["value"]
                                    elif isinstance(var_data, str):
                                        selections_str = var_data
                                    else:
                                        continue
                                    if selections_str and selections_str.strip():
                                        saved_selections = [sel.strip() for sel in selections_str.split(",") if sel.strip()]
                                        break
                        
                        # Инициализируем состояние если его нет
                        if "multi_select_green_line_stations" not in user_data[user_id]:
                            user_data[user_id]["multi_select_green_line_stations"] = saved_selections.copy()
                        user_data[user_id]["multi_select_node"] = "green_line_stations"
                        user_data[user_id]["multi_select_type"] = "inline"
                        user_data[user_id]["multi_select_variable"] = "metro_stations"
                        logging.info(f"Инициализировано состояние множественного выбора с {len(saved_selections)} элементами")
                        
                        builder = InlineKeyboardBuilder()
                        # Кнопка выбора с галочками: 🟩 Приморская
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟩 Приморская' в списке: {user_data[user_id]['multi_select_green_line_stations']}")
                        selected_mark = "✅ " if "🟩 Приморская" in user_data[user_id]["multi_select_green_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟩 Приморская': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟩 Приморская"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_primorskaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_primorskaya"))
                        # Кнопка выбора с галочками: 🟩 Василеостровская
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟩 Василеостровская' в списке: {user_data[user_id]['multi_select_green_line_stations']}")
                        selected_mark = "✅ " if "🟩 Василеостровская" in user_data[user_id]["multi_select_green_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟩 Василеостровская': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟩 Василеостровская"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_vasileostr'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_vasileostr"))
                        # Кнопка выбора с галочками: 🟩 Гостиный двор
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟩 Гостиный двор' в списке: {user_data[user_id]['multi_select_green_line_stations']}")
                        selected_mark = "✅ " if "🟩 Гостиный двор" in user_data[user_id]["multi_select_green_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟩 Гостиный двор': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟩 Гостиный двор"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_gostiny'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_gostiny"))
                        # Кнопка выбора с галочками: 🟩 Маяковская
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟩 Маяковская' в списке: {user_data[user_id]['multi_select_green_line_stations']}")
                        selected_mark = "✅ " if "🟩 Маяковская" in user_data[user_id]["multi_select_green_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟩 Маяковская': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟩 Маяковская"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_mayakovskaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_mayakovskaya"))
                        # Кнопка выбора с галочками: 🟩 Площадь Александра Невского-1
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟩 Площадь Александра Невского-1' в списке: {user_data[user_id]['multi_select_green_line_stations']}")
                        selected_mark = "✅ " if "🟩 Площадь Александра Невского-1" in user_data[user_id]["multi_select_green_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟩 Площадь Александра Невского-1': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟩 Площадь Александра Невского-1"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_pl_nevsk'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_pl_nevsk"))
                        # Кнопка выбора с галочками: 🟩 Елизаровская
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟩 Елизаровская' в списке: {user_data[user_id]['multi_select_green_line_stations']}")
                        selected_mark = "✅ " if "🟩 Елизаровская" in user_data[user_id]["multi_select_green_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟩 Елизаровская': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟩 Елизаровская"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_elizarovskaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_elizarovskaya"))
                        # Кнопка выбора с галочками: 🟩 Ломоносовская
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟩 Ломоносовская' в списке: {user_data[user_id]['multi_select_green_line_stations']}")
                        selected_mark = "✅ " if "🟩 Ломоносовская" in user_data[user_id]["multi_select_green_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟩 Ломоносовская': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟩 Ломоносовская"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_lomonosovskaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_lomonosovskaya"))
                        # Кнопка выбора с галочками: 🟩 Пролетарская
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟩 Пролетарская' в списке: {user_data[user_id]['multi_select_green_line_stations']}")
                        selected_mark = "✅ " if "🟩 Пролетарская" in user_data[user_id]["multi_select_green_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟩 Пролетарская': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟩 Пролетарская"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_proletarskaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_proletarskaya"))
                        # Кнопка выбора с галочками: 🟩 Обухово
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟩 Обухово' в списке: {user_data[user_id]['multi_select_green_line_stations']}")
                        selected_mark = "✅ " if "🟩 Обухово" in user_data[user_id]["multi_select_green_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟩 Обухово': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟩 Обухово"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_obuhovo'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_obuhovo"))
                        # Кнопка выбора с галочками: 🟩 Рыбацкое
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟩 Рыбацкое' в списке: {user_data[user_id]['multi_select_green_line_stations']}")
                        selected_mark = "✅ " if "🟩 Рыбацкое" in user_data[user_id]["multi_select_green_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟩 Рыбацкое': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟩 Рыбацкое"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_rybackoe'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_rybackoe"))
                        # Кнопка выбора с галочками: 🟩 Новокрестовская
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟩 Новокрестовская' в списке: {user_data[user_id]['multi_select_green_line_stations']}")
                        selected_mark = "✅ " if "🟩 Новокрестовская" in user_data[user_id]["multi_select_green_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟩 Новокрестовская': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟩 Новокрестовская"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_novokrestovsk'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_novokrestovsk"))
                        # Кнопка выбора с галочками: 🟩 Беговая
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟩 Беговая' в списке: {user_data[user_id]['multi_select_green_line_stations']}")
                        selected_mark = "✅ " if "🟩 Беговая" in user_data[user_id]["multi_select_green_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟩 Беговая': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟩 Беговая"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_begovaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_begovaya"))
                        builder.add(InlineKeyboardButton(text="⬅️ Назад к веткам", callback_data="metro_selection"))
                        # Добавляем кнопку "Готово" для множественного выбора
                        builder.add(InlineKeyboardButton(text="Готово", callback_data="multi_select_done_green_line_stations"))
                        builder.adjust(2)
                        keyboard = builder.as_markup()
                        # Заменяем все переменные в тексте
                        text = replace_variables_in_text(text, user_vars)
                        await message.answer(text, reply_markup=keyboard)
                        logging.info(f"✅ Прямая навигация к узлу множественного выбора green_line_stations выполнена")
                    elif next_node_id == "purple_line_stations":
                        # Прямая навигация к узлу с множественным выбором purple_line_stations
                        logging.info(f"🔧 Условная навигация к узлу с множественным выбором: purple_line_stations")
                        text = """🟪 Фрунзенско-Приморская линия

Выбери свою станцию:"""
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
                        
                        # Инициализируем состояние множественного выбора
                        user_data[user_id]["multi_select_purple_line_stations"] = []
                        user_data[user_id]["multi_select_node"] = "purple_line_stations"
                        user_data[user_id]["multi_select_type"] = "selection"
                        user_data[user_id]["multi_select_variable"] = "metro_stations"
                        # Инициализация состояния множественного выбора
                        if user_id not in user_data:
                            user_data[user_id] = {}
                        
                        # Загружаем ранее выбранные варианты
                        saved_selections = []
                        if user_vars:
                            for var_name, var_data in user_vars.items():
                                if var_name == "metro_stations":
                                    if isinstance(var_data, dict) and "value" in var_data:
                                        selections_str = var_data["value"]
                                    elif isinstance(var_data, str):
                                        selections_str = var_data
                                    else:
                                        continue
                                    if selections_str and selections_str.strip():
                                        saved_selections = [sel.strip() for sel in selections_str.split(",") if sel.strip()]
                                        break
                        
                        # Инициализируем состояние если его нет
                        if "multi_select_purple_line_stations" not in user_data[user_id]:
                            user_data[user_id]["multi_select_purple_line_stations"] = saved_selections.copy()
                        user_data[user_id]["multi_select_node"] = "purple_line_stations"
                        user_data[user_id]["multi_select_type"] = "inline"
                        user_data[user_id]["multi_select_variable"] = "metro_stations"
                        logging.info(f"Инициализировано состояние множественного выбора с {len(saved_selections)} элементами")
                        
                        builder = InlineKeyboardBuilder()
                        # Кнопка выбора с галочками: 🟪 Комендантский проспект
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟪 Комендантский проспект' в списке: {user_data[user_id]['multi_select_purple_line_stations']}")
                        selected_mark = "✅ " if "🟪 Комендантский проспект" in user_data[user_id]["multi_select_purple_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟪 Комендантский проспект': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟪 Комендантский проспект"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_komendantsky'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_komendantsky"))
                        # Кнопка выбора с галочками: 🟪 Старая Деревня
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟪 Старая Деревня' в списке: {user_data[user_id]['multi_select_purple_line_stations']}")
                        selected_mark = "✅ " if "🟪 Старая Деревня" in user_data[user_id]["multi_select_purple_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟪 Старая Деревня': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟪 Старая Деревня"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_staraya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_staraya"))
                        # Кнопка выбора с галочками: 🟪 Крестовский остров
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟪 Крестовский остров' в списке: {user_data[user_id]['multi_select_purple_line_stations']}")
                        selected_mark = "✅ " if "🟪 Крестовский остров" in user_data[user_id]["multi_select_purple_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟪 Крестовский остров': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟪 Крестовский остров"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_krestovsky'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_krestovsky"))
                        # Кнопка выбора с галочками: 🟪 Чкаловская
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟪 Чкаловская' в списке: {user_data[user_id]['multi_select_purple_line_stations']}")
                        selected_mark = "✅ " if "🟪 Чкаловская" in user_data[user_id]["multi_select_purple_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟪 Чкаловская': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟪 Чкаловская"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_chkalovskaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_chkalovskaya"))
                        # Кнопка выбора с галочками: 🟪 Спортивная
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟪 Спортивная' в списке: {user_data[user_id]['multi_select_purple_line_stations']}")
                        selected_mark = "✅ " if "🟪 Спортивная" in user_data[user_id]["multi_select_purple_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟪 Спортивная': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟪 Спортивная"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_sportivnaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_sportivnaya"))
                        # Кнопка выбора с галочками: 🟪 Адмиралтейская
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟪 Адмиралтейская' в списке: {user_data[user_id]['multi_select_purple_line_stations']}")
                        selected_mark = "✅ " if "🟪 Адмиралтейская" in user_data[user_id]["multi_select_purple_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟪 Адмиралтейская': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟪 Адмиралтейская"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_admiralteyskaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_admiralteyskaya"))
                        # Кнопка выбора с галочками: 🟪 Садовая
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟪 Садовая' в списке: {user_data[user_id]['multi_select_purple_line_stations']}")
                        selected_mark = "✅ " if "🟪 Садовая" in user_data[user_id]["multi_select_purple_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟪 Садовая': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟪 Садовая"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_sadovaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_sadovaya"))
                        # Кнопка выбора с галочками: 🟪 Звенигородская
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟪 Звенигородская' в списке: {user_data[user_id]['multi_select_purple_line_stations']}")
                        selected_mark = "✅ " if "🟪 Звенигородская" in user_data[user_id]["multi_select_purple_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟪 Звенигородская': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟪 Звенигородская"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_zvenigorodskaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_zvenigorodskaya"))
                        # Кнопка выбора с галочками: 🟪 Обводный канал
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟪 Обводный канал' в списке: {user_data[user_id]['multi_select_purple_line_stations']}")
                        selected_mark = "✅ " if "🟪 Обводный канал" in user_data[user_id]["multi_select_purple_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟪 Обводный канал': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟪 Обводный канал"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_obvodniy'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_obvodniy"))
                        # Кнопка выбора с галочками: 🟪 Волковская
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟪 Волковская' в списке: {user_data[user_id]['multi_select_purple_line_stations']}")
                        selected_mark = "✅ " if "🟪 Волковская" in user_data[user_id]["multi_select_purple_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟪 Волковская': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟪 Волковская"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_volkovskaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_volkovskaya"))
                        # Кнопка выбора с галочками: 🟪 Бухарестская
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟪 Бухарестская' в списке: {user_data[user_id]['multi_select_purple_line_stations']}")
                        selected_mark = "✅ " if "🟪 Бухарестская" in user_data[user_id]["multi_select_purple_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟪 Бухарестская': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟪 Бухарестская"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_buharestskaya'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_buharestskaya"))
                        # Кнопка выбора с галочками: 🟪 Международная
                        logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟪 Международная' в списке: {user_data[user_id]['multi_select_purple_line_stations']}")
                        selected_mark = "✅ " if "🟪 Международная" in user_data[user_id]["multi_select_purple_line_stations"] else ""
                        logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟪 Международная': selected_mark='{selected_mark}'")
                        final_text = f"{selected_mark}🟪 Международная"
                        logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_mezhdunar'")
                        builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_mezhdunar"))
                        builder.add(InlineKeyboardButton(text="⬅️ Назад к веткам", callback_data="metro_selection"))
                        # Добавляем кнопку "Готово" для множественного выбора
                        builder.add(InlineKeyboardButton(text="Готово", callback_data="multi_select_done_purple_line_stations"))
                        builder.adjust(2)
                        keyboard = builder.as_markup()
                        # Заменяем все переменные в тексте
                        text = replace_variables_in_text(text, user_vars)
                        await message.answer(text, reply_markup=keyboard)
                        logging.info(f"✅ Прямая навигация к узлу множественного выбора purple_line_stations выполнена")
                    elif next_node_id == "profile_complete":
                        # Обычный узел - отправляем сообщение
                        text = """🎉 Отлично! Твой профиль заполнен!

👤 Твоя анкета:
Пол: {gender}
Имя: {user_name}
Возраст: {user_age}
Метро: {metro_stations}
Интересы: {user_interests}
Семейное положение: {marital_status}
Ориентация: {sexual_orientation}

💬 Источник: {user_source}

Можешь посмотреть полную анкету или сразу получить ссылку на чат!"""
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
                        
                        # Создаем inline клавиатуру
                        builder = InlineKeyboardBuilder()
                        logging.info(f"Создана кнопка команды: Ссылка на чат 🔗 -> cmd_link")
                        builder.add(InlineKeyboardButton(text="Ссылка на чат 🔗", callback_data="cmd_link"))
                        logging.info(f"Создана кнопка команды: Редактировать профиль ✏️ -> cmd_profile")
                        builder.add(InlineKeyboardButton(text="Редактировать профиль ✏️", callback_data="cmd_profile"))
                        builder.adjust(1)
                        keyboard = builder.as_markup()
                        logging.info(f"Условная навигация к обычному узлу: profile_complete")
                        await message.answer(text, reply_markup=keyboard)
                    elif next_node_id == "show_profile":
                        # Обычный узел - отправляем сообщение
                        text = """👤 Твой профиль:

Пол: {gender} 👤
Имя: {user_name} ✏️
Возраст: {user_age} 🎂
Метро: {metro_stations} 🚇
Интересы: {user_interests} 🎯
Семейное положение: {marital_status} 💍
Ориентация: {sexual_orientation} 🌈

💬 Источник: {user_source}

✏️ Выберите действие:"""
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
                        
                        # Создаем inline клавиатуру
                        builder = InlineKeyboardBuilder()
                        builder.add(InlineKeyboardButton(text="👤 Изменить пол", callback_data="gender_selection"))
                        builder.add(InlineKeyboardButton(text="✏️ Изменить имя", callback_data="name_input"))
                        builder.add(InlineKeyboardButton(text="🎂 Изменить возраст", callback_data="age_input"))
                        builder.add(InlineKeyboardButton(text="🚇 Изменить метро", callback_data="metro_selection"))
                        builder.add(InlineKeyboardButton(text="🎯 Изменить интересы", callback_data="interests_categories"))
                        builder.add(InlineKeyboardButton(text="💍 Изменить семейное положение", callback_data="marital_status"))
                        builder.add(InlineKeyboardButton(text="🌈 Изменить ориентацию", callback_data="sexual_orientation"))
                        builder.add(InlineKeyboardButton(text="📢 Указать ТГК", callback_data="channel_choice"))
                        builder.add(InlineKeyboardButton(text="📝 Добавить о себе", callback_data="extra_info"))
                        logging.info(f"Создана кнопка команды: 🔄 Начать заново -> cmd_start")
                        builder.add(InlineKeyboardButton(text="🔄 Начать заново", callback_data="cmd_start"))
                        builder.adjust(2)
                        keyboard = builder.as_markup()
                        logging.info(f"Условная навигация к обычному узлу: show_profile")
                        await message.answer(text, reply_markup=keyboard)
                    elif next_node_id == "chat_link":
                        # Обычный узел - отправляем сообщение
                        text = """🔗 Актуальная ссылка на чат:

https://t.me/+agkIVgCzHtY2ZTA6

Добро пожаловать в сообщество ᴠᴨᴩᴏᴦʏᴧᴋᴇ! 🎉"""
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
                        
                        logging.info(f"Условная навигация к обычному узлу: chat_link")
                        await message.answer(text)
                    elif next_node_id == "help_command":
                        # Обычный узел - отправляем сообщение
                        text = """🤖 **Добро пожаловать в справочный центр!**

🌟 **ᴠᴨᴩᴏᴦʏᴧᴋᴇ Bot**
*Твой помощник в знакомствах*

🎯 **ОСНОВНЫЕ КОМАНДЫ:**

🚀 `/start` — *Начать заново*
   📝 Синонимы: `старт`, `начать`, `привет`, `начало`, `начинаем`

👤 `/profile` — *Мой профиль*
   📝 Синонимы: `профиль`, `анкета`, `мой профиль`, `посмотреть профиль`, `редактировать профиль`

🔗 `/link` — *Ссылка на чат*
   📝 Синонимы: `ссылка`, `чат`, `сообщество`, `впрогулке`, `линк`

🆘 `/help` — *Эта справка*
   📝 Синонимы: `помощь`, `справка`, `команды`, `что писать`, `как пользоваться`

📋 **РАЗДЕЛЫ АНКЕТЫ И ИХ СИНОНИМЫ:**

👫 **Пол:** мужской, женский
   📝 Синонимы: `пол`, `gender`

🏷️ **Имя:** любое имя
   📝 Синонимы: `имя`, `как зовут`, `назовись`

🎂 **Возраст:** число от 18 до 99
   📝 Синонимы: `возраст`, `лет`, `сколько лет`

🚇 **Метро:** выбор линии и станции
   📝 Синонимы: `метро`, `станция`
   🟥 Красная линия: `красная линия`, `кировско-выборгская`, `красная ветка`
   🟦 Синяя линия: `синяя линия`, `московско-петроградская`, `синяя ветка`
   🟩 Зеленая линия: `зеленая линия`, `невско-василеостровская`, `зеленая ветка`
   🟧 Оранжевая линия: `оранжевая линия`, `правобережная`, `оранжевая ветка`
   🟪 Фиолетовая линия: `фиолетовая линия`, `фрунзенско-приморская`, `фиолетовая ветка`

🎨 **Интересы и их синонимы:**
   🎮 Хобби: `хобби`, `увлечения`, `занятия`, `игры`
   🤝 Социальная жизнь: `общение`, `социальное`, `люди`, `тусовки`
   🎭 Творчество: `творчество`, `искусство`, `рисование`, `музыка`
   💪 Активный образ жизни: `активность`, `активный`, `движение`, `здоровье`
   🍕 Еда и напитки: `еда`, `напитки`, `кухня`, `рестораны`
   ⚽ Спорт: `спорт`, `фитнес`, `тренировки`, `футбол`

💑 **Семейное положение:** поиск, отношения, женат/замужем, сложно
   📝 Синонимы: `семейное положение`, `статус`, `отношения`, `семья`

🌈 **Ориентация:** гетеро, гей, лесби, би, другое
   📝 Синонимы: `ориентация`, `предпочтения`

📺 **Телеграм-канал:** опционально
   📝 Синонимы: `тгк`, `телеграм`, `канал`, `тг канал`

📖 **О себе:** дополнительная информация
   📝 Синонимы: `о себе`, `описание`, `расскажи`, `инфо`

👮‍♂️ **КОМАНДЫ МОДЕРАЦИИ:**

**Управление контентом:**
📌 `/pin_message` - Закрепить сообщение
   📝 Синонимы: `закрепить`, `прикрепить`, `зафиксировать`

📌❌ `/unpin_message` - Открепить сообщение
   📝 Синонимы: `открепить`, `отцепить`, `убрать закрепление`

🗑️ `/delete_message` - Удалить сообщение
   📝 Синонимы: `удалить`, `стереть`, `убрать сообщение`

**Управление пользователями:**
🚫 `/ban_user` - Заблокировать пользователя
   📝 Синонимы: `забанить`, `заблокировать`, `бан`

✅ `/unban_user` - Разблокировать пользователя
   📝 Синонимы: `разбанить`, `разблокировать`, `unbán`

🔇 `/mute_user` - Ограничить пользователя
   📝 Синонимы: `замутить`, `заглушить`, `мут`

🔊 `/unmute_user` - Снять ограничения
   📝 Синонимы: `размутить`, `разглушить`, `анмут`

👢 `/kick_user` - Исключить пользователя
   📝 Синонимы: `кикнуть`, `исключить`, `выгнать`

👑 `/promote_user` - Назначить администратором
   📝 Синонимы: `повысить`, `назначить админом`, `промоут`

👤 `/demote_user` - Снять с администратора
   📝 Синонимы: `понизить`, `снять с админа`, `демоут`

⚙️ `/admin_rights` - Настроить права администратора
   📝 Синонимы: `права админа`, `настроить права`, `тг права`
   ⚠️ Только для администраторов группы!
   💡 Ответьте на сообщение пользователя командой

**Примеры использования:**
• Ответьте на сообщение командой для его обработки
• Используйте команды в ответ на сообщения нарушителей
• Команды с правами работают только в группах/супергруппах
• Все действия логируются для отчетности

💡 **ПОЛЕЗНЫЕ СОВЕТЫ:**

✨ Можешь писать команды или синонимы в любом месте разговора
✨ Бот поймет твои сообщения даже без команд
✨ В любой момент можешь написать /start для начала заново
✨ Используй /profile для изменения любых данных
✨ Нажми на любое выделенное слово чтобы скопировать его!

🎉 **Удачных знакомств в Питере!** 🎉"""
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
                        
                        # Создаем inline клавиатуру
                        builder = InlineKeyboardBuilder()
                        logging.info(f"Создана кнопка команды: 🚀 Начать заполнение -> cmd_start")
                        builder.add(InlineKeyboardButton(text="🚀 Начать заполнение", callback_data="cmd_start"))
                        logging.info(f"Создана кнопка команды: 👤 Мой профиль -> cmd_profile")
                        builder.add(InlineKeyboardButton(text="👤 Мой профиль", callback_data="cmd_profile"))
                        logging.info(f"Создана кнопка команды: 🔗 Ссылка на чат -> cmd_link")
                        builder.add(InlineKeyboardButton(text="🔗 Ссылка на чат", callback_data="cmd_link"))
                        builder.adjust(1)
                        keyboard = builder.as_markup()
                        logging.info(f"Условная навигация к обычному узлу: help_command")
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
                elif command == "/profile":
                    try:
                        await _profile_handler(fake_message)
                    except Exception as e:
                        logging.error(f"Ошибка выполнения команды /profile: {e}")
                elif command == "/link":
                    try:
                        await _link_handler(fake_message)
                    except Exception as e:
                        logging.error(f"Ошибка выполнения команды /link: {e}")
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
                    elif target_node_id == "decline_response":
                        await handle_callback_decline_response(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "gender_selection":
                        await handle_callback_gender_selection(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "name_input":
                        await handle_callback_name_input(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "age_input":
                        await handle_callback_age_input(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "metro_selection":
                        await handle_callback_metro_selection(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "red_line_stations":
                        await handle_callback_red_line_stations(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "blue_line_stations":
                        await handle_callback_blue_line_stations(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "green_line_stations":
                        await handle_callback_green_line_stations(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "purple_line_stations":
                        await handle_callback_purple_line_stations(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "profile_complete":
                        await handle_callback_profile_complete(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "show_profile":
                        await handle_callback_show_profile(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "chat_link":
                        await handle_callback_chat_link(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "help_command":
                        await handle_callback_help_command(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
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
                        elif next_node_id == "gender_selection":
                            await handle_callback_gender_selection(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "name_input":
                            await handle_callback_name_input(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "age_input":
                            await handle_callback_age_input(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "metro_selection":
                            await handle_callback_metro_selection(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "red_line_stations":
                            await handle_callback_red_line_stations(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "blue_line_stations":
                            await handle_callback_blue_line_stations(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "green_line_stations":
                            await handle_callback_green_line_stations(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "purple_line_stations":
                            await handle_callback_purple_line_stations(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "profile_complete":
                            await handle_callback_profile_complete(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "show_profile":
                            await handle_callback_show_profile(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "chat_link":
                            await handle_callback_chat_link(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "help_command":
                            await handle_callback_help_command(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
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
                        elif skip_target == "gender_selection":
                            await handle_callback_gender_selection(fake_callback)
                        elif skip_target == "name_input":
                            await handle_callback_name_input(fake_callback)
                        elif skip_target == "age_input":
                            await handle_callback_age_input(fake_callback)
                        elif skip_target == "metro_selection":
                            await handle_callback_metro_selection(fake_callback)
                        elif skip_target == "red_line_stations":
                            await handle_callback_red_line_stations(fake_callback)
                        elif skip_target == "blue_line_stations":
                            await handle_callback_blue_line_stations(fake_callback)
                        elif skip_target == "green_line_stations":
                            await handle_callback_green_line_stations(fake_callback)
                        elif skip_target == "purple_line_stations":
                            await handle_callback_purple_line_stations(fake_callback)
                        elif skip_target == "profile_complete":
                            await handle_callback_profile_complete(fake_callback)
                        elif skip_target == "show_profile":
                            await handle_callback_show_profile(fake_callback)
                        elif skip_target == "chat_link":
                            await handle_callback_chat_link(fake_callback)
                        elif skip_target == "help_command":
                            await handle_callback_help_command(fake_callback)
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
                            elif skip_target == "gender_selection":
                                await handle_callback_gender_selection(fake_callback)
                            elif skip_target == "name_input":
                                await handle_callback_name_input(fake_callback)
                            elif skip_target == "age_input":
                                await handle_callback_age_input(fake_callback)
                            elif skip_target == "metro_selection":
                                await handle_callback_metro_selection(fake_callback)
                            elif skip_target == "red_line_stations":
                                await handle_callback_red_line_stations(fake_callback)
                            elif skip_target == "blue_line_stations":
                                await handle_callback_blue_line_stations(fake_callback)
                            elif skip_target == "green_line_stations":
                                await handle_callback_green_line_stations(fake_callback)
                            elif skip_target == "purple_line_stations":
                                await handle_callback_purple_line_stations(fake_callback)
                            elif skip_target == "profile_complete":
                                await handle_callback_profile_complete(fake_callback)
                            elif skip_target == "show_profile":
                                await handle_callback_show_profile(fake_callback)
                            elif skip_target == "chat_link":
                                await handle_callback_chat_link(fake_callback)
                            elif skip_target == "help_command":
                                await handle_callback_help_command(fake_callback)
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
                            # У узла есть inline кнопки - показываем их вместе с ожиданием ввода
                            builder = InlineKeyboardBuilder()
                            builder.add(InlineKeyboardButton(text="Да 😎", callback_data="gender_selection"))
                            builder.add(InlineKeyboardButton(text="Нет 🙅", callback_data="decline_response"))
                            builder.adjust(1)
                            keyboard = builder.as_markup()
                            await message.answer(text, reply_markup=keyboard)
                            logging.info(f"✅ Показаны inline кнопки для узла join_request с collectUserInput (ожидание ввода активно)")
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
                        elif current_node_id == "gender_selection":
                            text = "Укажи свой пол: 👨👩"
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
                            # Устанавливаем состояние ожидания ввода для узла gender_selection
                            user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
                            user_data[message.from_user.id]["waiting_for_input"] = {
                                "type": "text",
                                "modes": ["text"],
                                "variable": "gender",
                                "save_to_database": True,
                                "node_id": "gender_selection",
                                "next_node_id": "",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной gender (узел gender_selection)")
                            logging.info(f"✅ Узел gender_selection настроен для сбора ввода (collectUserInput=true)")
                            # У узла есть inline кнопки - показываем их вместе с ожиданием ввода
                            builder = InlineKeyboardBuilder()
                            builder.add(InlineKeyboardButton(text="Мужчина 👨", callback_data="name_input"))
                            builder.add(InlineKeyboardButton(text="Женщина 👩", callback_data="name_input"))
                            builder.adjust(1)
                            keyboard = builder.as_markup()
                            await message.answer(text, reply_markup=keyboard)
                            logging.info(f"✅ Показаны inline кнопки для узла gender_selection с collectUserInput (ожидание ввода активно)")
                        elif current_node_id == "name_input":
                            text = """Как тебя зовут? ✏️

Напиши своё имя в сообщении:"""
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
                            # Устанавливаем состояние ожидания ввода для узла name_input
                            user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
                            user_data[message.from_user.id]["waiting_for_input"] = {
                                "type": "text",
                                "modes": ["text"],
                                "variable": "user_name",
                                "save_to_database": True,
                                "node_id": "name_input",
                                "next_node_id": "age_input",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной user_name (узел name_input)")
                            logging.info(f"✅ Узел name_input настроен для сбора ввода (collectUserInput=true)")
                            # Заменяем все переменные в тексте
                            text = replace_variables_in_text(text, user_vars)
                            await message.answer(text)
                            # Настраиваем ожидание ввода для message узла (универсальная функция опяяяяеделит тип: text/photo/video/audio/document)
                            user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
                            user_data[message.from_user.id]["waiting_for_input"] = {
                                "type": "text",
                                "modes": ["text"],
                                "variable": "user_name",
                                "save_to_database": True,
                                "node_id": "name_input",
                                "next_node_id": "age_input",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной user_name (узел name_input)")
                        elif current_node_id == "age_input":
                            text = """Сколько тебе лет? 🎂

Напиши свой возраст числом (например, 25):"""
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
                            # Устанавливаем состояние ожидания ввода для узла age_input
                            user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
                            user_data[message.from_user.id]["waiting_for_input"] = {
                                "type": "text",
                                "modes": ["text"],
                                "variable": "user_age",
                                "save_to_database": True,
                                "node_id": "age_input",
                                "next_node_id": "metro_selection",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной user_age (узел age_input)")
                            logging.info(f"✅ Узел age_input настроен для сбора ввода (collectUserInput=true)")
                            # Заменяем все переменные в тексте
                            text = replace_variables_in_text(text, user_vars)
                            await message.answer(text)
                            # Настраиваем ожидание ввода для message узла (универсальная функция опяяяяеделит тип: text/photo/video/audio/document)
                            user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
                            user_data[message.from_user.id]["waiting_for_input"] = {
                                "type": "text",
                                "modes": ["text"],
                                "variable": "user_age",
                                "save_to_database": True,
                                "node_id": "age_input",
                                "next_node_id": "metro_selection",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной user_age (узел age_input)")
                        elif current_node_id == "metro_selection":
                            text = """На какой станции метро ты обычно бываешь? 🚇

Выбери свою ветку:"""
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
                            # Устанавливаем состояние ожидания ввода для узла metro_selection
                            user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
                            user_data[message.from_user.id]["waiting_for_input"] = {
                                "type": "text",
                                "modes": ["text"],
                                "variable": "metro_stations",
                                "save_to_database": True,
                                "node_id": "metro_selection",
                                "next_node_id": "",
                                "min_length": 0,
                                "max_length": 0,
                                "retry_message": "Пожалуйста, попробуйте еще раз.",
                                "success_message": ""
                            }
                            logging.info(f"✅ Состояние ожидания настроено: modes=['text'] для переменной metro_stations (узел metro_selection)")
                            logging.info(f"✅ Узел metro_selection настроен для сбора ввода (collectUserInput=true)")
                            # У узла есть inline кнопки - показываем их вместе с ожиданием ввода
                            builder = InlineKeyboardBuilder()
                            builder.add(InlineKeyboardButton(text="Красная ветка 🟥", callback_data="red_line_stations"))
                            builder.add(InlineKeyboardButton(text="Синяя ветка 🟦", callback_data="blue_line_stations"))
                            builder.add(InlineKeyboardButton(text="Зелёная ветка 🟩", callback_data="green_line_stations"))
                            builder.add(InlineKeyboardButton(text="Фиолетовая ветка 🟪", callback_data="purple_line_stations"))
                            builder.add(InlineKeyboardButton(text="Я из ЛО 🏡", callback_data="interests_categories"))
                            builder.add(InlineKeyboardButton(text="Я не в Питере 🌍", callback_data="interests_categories"))
                            builder.adjust(2)
                            keyboard = builder.as_markup()
                            await message.answer(text, reply_markup=keyboard)
                            logging.info(f"✅ Показаны inline кнопки для узла metro_selection с collectUserInput (ожидание ввода активно)")
                        elif current_node_id == "red_line_stations":
                            # Прямая навигация к узлу с множественным выбором red_line_stations
                            logging.info(f"🔧 Переходим к узлу с множественным выбором: red_line_stations")
                            text = """🟥 Кировско-Выборгская линия

Выбери свою станцию:"""
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
                            
                            # Инициализируем состояние множественного выбора
                            user_data[user_id]["multi_select_red_line_stations"] = []
                            user_data[user_id]["multi_select_node"] = "red_line_stations"
                            user_data[user_id]["multi_select_type"] = "selection"
                            user_data[user_id]["multi_select_variable"] = "metro_stations"
                            # Инициализация состояния множественного выбора
                            if user_id not in user_data:
                                user_data[user_id] = {}
                            
                            # Загружаем ранее выбранные варианты
                            saved_selections = []
                            if user_vars:
                                for var_name, var_data in user_vars.items():
                                    if var_name == "metro_stations":
                                        if isinstance(var_data, dict) and "value" in var_data:
                                            selections_str = var_data["value"]
                                        elif isinstance(var_data, str):
                                            selections_str = var_data
                                        else:
                                            continue
                                        if selections_str and selections_str.strip():
                                            saved_selections = [sel.strip() for sel in selections_str.split(",") if sel.strip()]
                                            break
                            
                            # Инициализируем состояние если его нет
                            if "multi_select_red_line_stations" not in user_data[user_id]:
                                user_data[user_id]["multi_select_red_line_stations"] = saved_selections.copy()
                            user_data[user_id]["multi_select_node"] = "red_line_stations"
                            user_data[user_id]["multi_select_type"] = "inline"
                            user_data[user_id]["multi_select_variable"] = "metro_stations"
                            logging.info(f"Инициализировано состояние множественного выбора с {len(saved_selections)} элементами")
                            
                            builder = InlineKeyboardBuilder()
                            # Кнопка выбора с галочками: 🟥 Девяткино
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Девяткино' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                            selected_mark = "✅ " if "🟥 Девяткино" in user_data[user_id]["multi_select_red_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Девяткино': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟥 Девяткино"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_devyatkino'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_devyatkino"))
                            # Кнопка выбора с галочками: 🟥 Гражданский проспект
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Гражданский проспект' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                            selected_mark = "✅ " if "🟥 Гражданский проспект" in user_data[user_id]["multi_select_red_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Гражданский проспект': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟥 Гражданский проспект"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_grazhdansky'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_grazhdansky"))
                            # Кнопка выбора с галочками: 🟥 Академическая
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Академическая' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                            selected_mark = "✅ " if "🟥 Академическая" in user_data[user_id]["multi_select_red_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Академическая': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟥 Академическая"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_akademicheskaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_akademicheskaya"))
                            # Кнопка выбора с галочками: 🟥 Политехническая
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Политехническая' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                            selected_mark = "✅ " if "🟥 Политехническая" in user_data[user_id]["multi_select_red_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Политехническая': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟥 Политехническая"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_politehnicheskaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_politehnicheskaya"))
                            # Кнопка выбора с галочками: 🟥 Площадь Мужества
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Площадь Мужества' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                            selected_mark = "✅ " if "🟥 Площадь Мужества" in user_data[user_id]["multi_select_red_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Площадь Мужества': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟥 Площадь Мужества"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_pl_muzhestva'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_pl_muzhestva"))
                            # Кнопка выбора с галочками: 🟥 Лесная
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Лесная' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                            selected_mark = "✅ " if "🟥 Лесная" in user_data[user_id]["multi_select_red_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Лесная': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟥 Лесная"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_lesnaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_lesnaya"))
                            # Кнопка выбора с галочками: 🟥 Выборгская
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Выборгская' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                            selected_mark = "✅ " if "🟥 Выборгская" in user_data[user_id]["multi_select_red_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Выборгская': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟥 Выборгская"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_vyborgskaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_vyborgskaya"))
                            # Кнопка выбора с галочками: 🟥 Площадь Ленина
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Площадь Ленина' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                            selected_mark = "✅ " if "🟥 Площадь Ленина" in user_data[user_id]["multi_select_red_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Площадь Ленина': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟥 Площадь Ленина"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_pl_lenina'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_pl_lenina"))
                            # Кнопка выбора с галочками: 🟥 Чернышевская
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Чернышевская' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                            selected_mark = "✅ " if "🟥 Чернышевская" in user_data[user_id]["multi_select_red_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Чернышевская': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟥 Чернышевская"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_chernyshevskaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_chernyshevskaya"))
                            # Кнопка выбора с галочками: 🟥 Площадь Восстания
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Площадь Восстания' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                            selected_mark = "✅ " if "🟥 Площадь Восстания" in user_data[user_id]["multi_select_red_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Площадь Восстания': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟥 Площадь Восстания"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_pl_vosstaniya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_pl_vosstaniya"))
                            # Кнопка выбора с галочками: 🟥 Владимирская
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Владимирская' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                            selected_mark = "✅ " if "🟥 Владимирская" in user_data[user_id]["multi_select_red_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Владимирская': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟥 Владимирская"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_vladimirskaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_vladimirskaya"))
                            # Кнопка выбора с галочками: 🟥 Пушкинская
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Пушкинская' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                            selected_mark = "✅ " if "🟥 Пушкинская" in user_data[user_id]["multi_select_red_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Пушкинская': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟥 Пушкинская"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_pushkinskaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_pushkinskaya"))
                            # Кнопка выбора с галочками: 🟥 Технологический институт-1
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Технологический институт-1' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                            selected_mark = "✅ " if "🟥 Технологический институт-1" in user_data[user_id]["multi_select_red_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Технологический институт-1': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟥 Технологический институт-1"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_tehinstitut1'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_tehinstitut1"))
                            # Кнопка выбора с галочками: 🟥 Балтийская
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Балтийская' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                            selected_mark = "✅ " if "🟥 Балтийская" in user_data[user_id]["multi_select_red_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Балтийская': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟥 Балтийская"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_baltiyskaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_baltiyskaya"))
                            # Кнопка выбора с галочками: 🟥 Нарвская
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Нарвская' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                            selected_mark = "✅ " if "🟥 Нарвская" in user_data[user_id]["multi_select_red_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Нарвская': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟥 Нарвская"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_narvskaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_narvskaya"))
                            # Кнопка выбора с галочками: 🟥 Кировский завод
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Кировский завод' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                            selected_mark = "✅ " if "🟥 Кировский завод" in user_data[user_id]["multi_select_red_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Кировский завод': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟥 Кировский завод"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_kirovsky'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_kirovsky"))
                            # Кнопка выбора с галочками: 🟥 Автово
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Автово' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                            selected_mark = "✅ " if "🟥 Автово" in user_data[user_id]["multi_select_red_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Автово': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟥 Автово"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_avtovo'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_avtovo"))
                            # Кнопка выбора с галочками: 🟥 Ленинский проспект
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Ленинский проспект' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                            selected_mark = "✅ " if "🟥 Ленинский проспект" in user_data[user_id]["multi_select_red_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Ленинский проспект': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟥 Ленинский проспект"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_leninsky'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_leninsky"))
                            # Кнопка выбора с галочками: 🟥 Проспект Ветеранов
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟥 Проспект Ветеранов' в списке: {user_data[user_id]['multi_select_red_line_stations']}")
                            selected_mark = "✅ " if "🟥 Проспект Ветеранов" in user_data[user_id]["multi_select_red_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟥 Проспект Ветеранов': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟥 Проспект Ветеранов"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_veteranov'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_veteranov"))
                            builder.add(InlineKeyboardButton(text="⬅️ Назад к веткам", callback_data="metro_selection"))
                            # Добавляем кнопку "Готово" для множественного выбора
                            builder.add(InlineKeyboardButton(text="Готово", callback_data="multi_select_done_red_line_stations"))
                            builder.adjust(2)
                            keyboard = builder.as_markup()
                            await message.answer(text, reply_markup=keyboard)
                            logging.info(f"✅ Прямая навигация к узлу множественного выбора red_line_stations выполнена")
                        elif current_node_id == "blue_line_stations":
                            # Прямая навигация к узлу с множественным выбором blue_line_stations
                            logging.info(f"🔧 Переходим к узлу с множественным выбором: blue_line_stations")
                            text = """🟦 Московско-Петроградская линия

Выбери свою станцию:"""
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
                            
                            # Инициализируем состояние множественного выбора
                            user_data[user_id]["multi_select_blue_line_stations"] = []
                            user_data[user_id]["multi_select_node"] = "blue_line_stations"
                            user_data[user_id]["multi_select_type"] = "selection"
                            user_data[user_id]["multi_select_variable"] = "metro_stations"
                            # Инициализация состояния множественного выбора
                            if user_id not in user_data:
                                user_data[user_id] = {}
                            
                            # Загружаем ранее выбранные варианты
                            saved_selections = []
                            if user_vars:
                                for var_name, var_data in user_vars.items():
                                    if var_name == "metro_stations":
                                        if isinstance(var_data, dict) and "value" in var_data:
                                            selections_str = var_data["value"]
                                        elif isinstance(var_data, str):
                                            selections_str = var_data
                                        else:
                                            continue
                                        if selections_str and selections_str.strip():
                                            saved_selections = [sel.strip() for sel in selections_str.split(",") if sel.strip()]
                                            break
                            
                            # Инициализируем состояние если его нет
                            if "multi_select_blue_line_stations" not in user_data[user_id]:
                                user_data[user_id]["multi_select_blue_line_stations"] = saved_selections.copy()
                            user_data[user_id]["multi_select_node"] = "blue_line_stations"
                            user_data[user_id]["multi_select_type"] = "inline"
                            user_data[user_id]["multi_select_variable"] = "metro_stations"
                            logging.info(f"Инициализировано состояние множественного выбора с {len(saved_selections)} элементами")
                            
                            builder = InlineKeyboardBuilder()
                            # Кнопка выбора с галочками: 🟦 Парнас
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Парнас' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                            selected_mark = "✅ " if "🟦 Парнас" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Парнас': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟦 Парнас"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_parnas'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_parnas"))
                            # Кнопка выбора с галочками: 🟦 Проспект Просвещения
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Проспект Просвещения' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                            selected_mark = "✅ " if "🟦 Проспект Просвещения" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Проспект Просвещения': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟦 Проспект Просвещения"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_prosp_prosvesh'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_prosp_prosvesh"))
                            # Кнопка выбора с галочками: 🟦 Озерки
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Озерки' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                            selected_mark = "✅ " if "🟦 Озерки" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Озерки': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟦 Озерки"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_ozerki'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_ozerki"))
                            # Кнопка выбора с галочками: 🟦 Удельная
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Удельная' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                            selected_mark = "✅ " if "🟦 Удельная" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Удельная': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟦 Удельная"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_udelnaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_udelnaya"))
                            # Кнопка выбора с галочками: 🟦 Пионерская
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Пионерская' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                            selected_mark = "✅ " if "🟦 Пионерская" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Пионерская': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟦 Пионерская"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_pionerskaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_pionerskaya"))
                            # Кнопка выбора с галочками: 🟦 Черная речка
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Черная речка' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                            selected_mark = "✅ " if "🟦 Черная речка" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Черная речка': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟦 Черная речка"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_chernaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_chernaya"))
                            # Кнопка выбора с галочками: 🟦 Петроградская
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Петроградская' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                            selected_mark = "✅ " if "🟦 Петроградская" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Петроградская': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟦 Петроградская"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_petrogradskaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_petrogradskaya"))
                            # Кнопка выбора с галочками: 🟦 Горьковская
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Горьковская' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                            selected_mark = "✅ " if "🟦 Горьковская" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Горьковская': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟦 Горьковская"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_gorkovskaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_gorkovskaya"))
                            # Кнопка выбора с галочками: 🟦 Невский проспект
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Невский проспект' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                            selected_mark = "✅ " if "🟦 Невский проспект" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Невский проспект': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟦 Невский проспект"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_nevsky'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_nevsky"))
                            # Кнопка выбора с галочками: 🟦 Сенная площадь
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Сенная площадь' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                            selected_mark = "✅ " if "🟦 Сенная площадь" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Сенная площадь': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟦 Сенная площадь"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_sennaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_sennaya"))
                            # Кнопка выбора с галочками: 🟦 Технологический институт-2
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Технологический институт-2' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                            selected_mark = "✅ " if "🟦 Технологический институт-2" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Технологический институт-2': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟦 Технологический институт-2"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_tehinstitut2'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_tehinstitut2"))
                            # Кнопка выбора с галочками: 🟦 Фрунзенская
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Фрунзенская' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                            selected_mark = "✅ " if "🟦 Фрунзенская" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Фрунзенская': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟦 Фрунзенская"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_frunzenskaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_frunzenskaya"))
                            # Кнопка выбора с галочками: 🟦 Московские ворота
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Московские ворота' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                            selected_mark = "✅ " if "🟦 Московские ворота" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Московские ворота': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟦 Московские ворота"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_mosk_vorota'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_mosk_vorota"))
                            # Кнопка выбора с галочками: 🟦 Электросила
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Электросила' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                            selected_mark = "✅ " if "🟦 Электросила" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Электросила': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟦 Электросила"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_elektrosila'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_elektrosila"))
                            # Кнопка выбора с галочками: 🟦 Парк Победы
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Парк Победы' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                            selected_mark = "✅ " if "🟦 Парк Победы" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Парк Победы': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟦 Парк Победы"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_park_pobedy'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_park_pobedy"))
                            # Кнопка выбора с галочками: 🟦 Московская
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Московская' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                            selected_mark = "✅ " if "🟦 Московская" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Московская': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟦 Московская"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_moskovskaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_moskovskaya"))
                            # Кнопка выбора с галочками: 🟦 Звездная
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Звездная' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                            selected_mark = "✅ " if "🟦 Звездная" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Звездная': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟦 Звездная"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_zvezdnaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_zvezdnaya"))
                            # Кнопка выбора с галочками: 🟦 Купчино
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟦 Купчино' в списке: {user_data[user_id]['multi_select_blue_line_stations']}")
                            selected_mark = "✅ " if "🟦 Купчино" in user_data[user_id]["multi_select_blue_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟦 Купчино': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟦 Купчино"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_kupchino'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_kupchino"))
                            builder.add(InlineKeyboardButton(text="⬅️ Назад к веткам", callback_data="metro_selection"))
                            # Добавляем кнопку "Готово" для множественного выбора
                            builder.add(InlineKeyboardButton(text="Готово", callback_data="multi_select_done_blue_line_stations"))
                            builder.adjust(2)
                            keyboard = builder.as_markup()
                            await message.answer(text, reply_markup=keyboard)
                            logging.info(f"✅ Прямая навигация к узлу множественного выбора blue_line_stations выполнена")
                        elif current_node_id == "green_line_stations":
                            # Прямая навигация к узлу с множественным выбором green_line_stations
                            logging.info(f"🔧 Переходим к узлу с множественным выбором: green_line_stations")
                            text = """🟩 Невско-Василеостровская линия

Выбери свою станцию:"""
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
                            
                            # Инициализируем состояние множественного выбора
                            user_data[user_id]["multi_select_green_line_stations"] = []
                            user_data[user_id]["multi_select_node"] = "green_line_stations"
                            user_data[user_id]["multi_select_type"] = "selection"
                            user_data[user_id]["multi_select_variable"] = "metro_stations"
                            # Инициализация состояния множественного выбора
                            if user_id not in user_data:
                                user_data[user_id] = {}
                            
                            # Загружаем ранее выбранные варианты
                            saved_selections = []
                            if user_vars:
                                for var_name, var_data in user_vars.items():
                                    if var_name == "metro_stations":
                                        if isinstance(var_data, dict) and "value" in var_data:
                                            selections_str = var_data["value"]
                                        elif isinstance(var_data, str):
                                            selections_str = var_data
                                        else:
                                            continue
                                        if selections_str and selections_str.strip():
                                            saved_selections = [sel.strip() for sel in selections_str.split(",") if sel.strip()]
                                            break
                            
                            # Инициализируем состояние если его нет
                            if "multi_select_green_line_stations" not in user_data[user_id]:
                                user_data[user_id]["multi_select_green_line_stations"] = saved_selections.copy()
                            user_data[user_id]["multi_select_node"] = "green_line_stations"
                            user_data[user_id]["multi_select_type"] = "inline"
                            user_data[user_id]["multi_select_variable"] = "metro_stations"
                            logging.info(f"Инициализировано состояние множественного выбора с {len(saved_selections)} элементами")
                            
                            builder = InlineKeyboardBuilder()
                            # Кнопка выбора с галочками: 🟩 Приморская
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟩 Приморская' в списке: {user_data[user_id]['multi_select_green_line_stations']}")
                            selected_mark = "✅ " if "🟩 Приморская" in user_data[user_id]["multi_select_green_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟩 Приморская': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟩 Приморская"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_primorskaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_primorskaya"))
                            # Кнопка выбора с галочками: 🟩 Василеостровская
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟩 Василеостровская' в списке: {user_data[user_id]['multi_select_green_line_stations']}")
                            selected_mark = "✅ " if "🟩 Василеостровская" in user_data[user_id]["multi_select_green_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟩 Василеостровская': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟩 Василеостровская"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_vasileostr'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_vasileostr"))
                            # Кнопка выбора с галочками: 🟩 Гостиный двор
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟩 Гостиный двор' в списке: {user_data[user_id]['multi_select_green_line_stations']}")
                            selected_mark = "✅ " if "🟩 Гостиный двор" in user_data[user_id]["multi_select_green_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟩 Гостиный двор': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟩 Гостиный двор"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_gostiny'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_gostiny"))
                            # Кнопка выбора с галочками: 🟩 Маяковская
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟩 Маяковская' в списке: {user_data[user_id]['multi_select_green_line_stations']}")
                            selected_mark = "✅ " if "🟩 Маяковская" in user_data[user_id]["multi_select_green_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟩 Маяковская': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟩 Маяковская"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_mayakovskaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_mayakovskaya"))
                            # Кнопка выбора с галочками: 🟩 Площадь Александра Невского-1
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟩 Площадь Александра Невского-1' в списке: {user_data[user_id]['multi_select_green_line_stations']}")
                            selected_mark = "✅ " if "🟩 Площадь Александра Невского-1" in user_data[user_id]["multi_select_green_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟩 Площадь Александра Невского-1': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟩 Площадь Александра Невского-1"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_pl_nevsk'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_pl_nevsk"))
                            # Кнопка выбора с галочками: 🟩 Елизаровская
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟩 Елизаровская' в списке: {user_data[user_id]['multi_select_green_line_stations']}")
                            selected_mark = "✅ " if "🟩 Елизаровская" in user_data[user_id]["multi_select_green_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟩 Елизаровская': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟩 Елизаровская"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_elizarovskaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_elizarovskaya"))
                            # Кнопка выбора с галочками: 🟩 Ломоносовская
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟩 Ломоносовская' в списке: {user_data[user_id]['multi_select_green_line_stations']}")
                            selected_mark = "✅ " if "🟩 Ломоносовская" in user_data[user_id]["multi_select_green_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟩 Ломоносовская': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟩 Ломоносовская"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_lomonosovskaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_lomonosovskaya"))
                            # Кнопка выбора с галочками: 🟩 Пролетарская
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟩 Пролетарская' в списке: {user_data[user_id]['multi_select_green_line_stations']}")
                            selected_mark = "✅ " if "🟩 Пролетарская" in user_data[user_id]["multi_select_green_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟩 Пролетарская': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟩 Пролетарская"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_proletarskaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_proletarskaya"))
                            # Кнопка выбора с галочками: 🟩 Обухово
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟩 Обухово' в списке: {user_data[user_id]['multi_select_green_line_stations']}")
                            selected_mark = "✅ " if "🟩 Обухово" in user_data[user_id]["multi_select_green_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟩 Обухово': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟩 Обухово"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_obuhovo'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_obuhovo"))
                            # Кнопка выбора с галочками: 🟩 Рыбацкое
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟩 Рыбацкое' в списке: {user_data[user_id]['multi_select_green_line_stations']}")
                            selected_mark = "✅ " if "🟩 Рыбацкое" in user_data[user_id]["multi_select_green_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟩 Рыбацкое': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟩 Рыбацкое"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_rybackoe'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_rybackoe"))
                            # Кнопка выбора с галочками: 🟩 Новокрестовская
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟩 Новокрестовская' в списке: {user_data[user_id]['multi_select_green_line_stations']}")
                            selected_mark = "✅ " if "🟩 Новокрестовская" in user_data[user_id]["multi_select_green_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟩 Новокрестовская': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟩 Новокрестовская"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_novokrestovsk'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_novokrestovsk"))
                            # Кнопка выбора с галочками: 🟩 Беговая
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟩 Беговая' в списке: {user_data[user_id]['multi_select_green_line_stations']}")
                            selected_mark = "✅ " if "🟩 Беговая" in user_data[user_id]["multi_select_green_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟩 Беговая': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟩 Беговая"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_begovaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_begovaya"))
                            builder.add(InlineKeyboardButton(text="⬅️ Назад к веткам", callback_data="metro_selection"))
                            # Добавляем кнопку "Готово" для множественного выбора
                            builder.add(InlineKeyboardButton(text="Готово", callback_data="multi_select_done_green_line_stations"))
                            builder.adjust(2)
                            keyboard = builder.as_markup()
                            await message.answer(text, reply_markup=keyboard)
                            logging.info(f"✅ Прямая навигация к узлу множественного выбора green_line_stations выполнена")
                        elif current_node_id == "purple_line_stations":
                            # Прямая навигация к узлу с множественным выбором purple_line_stations
                            logging.info(f"🔧 Переходим к узлу с множественным выбором: purple_line_stations")
                            text = """🟪 Фрунзенско-Приморская линия

Выбери свою станцию:"""
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
                            
                            # Инициализируем состояние множественного выбора
                            user_data[user_id]["multi_select_purple_line_stations"] = []
                            user_data[user_id]["multi_select_node"] = "purple_line_stations"
                            user_data[user_id]["multi_select_type"] = "selection"
                            user_data[user_id]["multi_select_variable"] = "metro_stations"
                            # Инициализация состояния множественного выбора
                            if user_id not in user_data:
                                user_data[user_id] = {}
                            
                            # Загружаем ранее выбранные варианты
                            saved_selections = []
                            if user_vars:
                                for var_name, var_data in user_vars.items():
                                    if var_name == "metro_stations":
                                        if isinstance(var_data, dict) and "value" in var_data:
                                            selections_str = var_data["value"]
                                        elif isinstance(var_data, str):
                                            selections_str = var_data
                                        else:
                                            continue
                                        if selections_str and selections_str.strip():
                                            saved_selections = [sel.strip() for sel in selections_str.split(",") if sel.strip()]
                                            break
                            
                            # Инициализируем состояние если его нет
                            if "multi_select_purple_line_stations" not in user_data[user_id]:
                                user_data[user_id]["multi_select_purple_line_stations"] = saved_selections.copy()
                            user_data[user_id]["multi_select_node"] = "purple_line_stations"
                            user_data[user_id]["multi_select_type"] = "inline"
                            user_data[user_id]["multi_select_variable"] = "metro_stations"
                            logging.info(f"Инициализировано состояние множественного выбора с {len(saved_selections)} элементами")
                            
                            builder = InlineKeyboardBuilder()
                            # Кнопка выбора с галочками: 🟪 Комендантский проспект
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟪 Комендантский проспект' в списке: {user_data[user_id]['multi_select_purple_line_stations']}")
                            selected_mark = "✅ " if "🟪 Комендантский проспект" in user_data[user_id]["multi_select_purple_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟪 Комендантский проспект': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟪 Комендантский проспект"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_komendantsky'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_komendantsky"))
                            # Кнопка выбора с галочками: 🟪 Старая Деревня
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟪 Старая Деревня' в списке: {user_data[user_id]['multi_select_purple_line_stations']}")
                            selected_mark = "✅ " if "🟪 Старая Деревня" in user_data[user_id]["multi_select_purple_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟪 Старая Деревня': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟪 Старая Деревня"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_staraya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_staraya"))
                            # Кнопка выбора с галочками: 🟪 Крестовский остров
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟪 Крестовский остров' в списке: {user_data[user_id]['multi_select_purple_line_stations']}")
                            selected_mark = "✅ " if "🟪 Крестовский остров" in user_data[user_id]["multi_select_purple_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟪 Крестовский остров': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟪 Крестовский остров"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_krestovsky'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_krestovsky"))
                            # Кнопка выбора с галочками: 🟪 Чкаловская
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟪 Чкаловская' в списке: {user_data[user_id]['multi_select_purple_line_stations']}")
                            selected_mark = "✅ " if "🟪 Чкаловская" in user_data[user_id]["multi_select_purple_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟪 Чкаловская': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟪 Чкаловская"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_chkalovskaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_chkalovskaya"))
                            # Кнопка выбора с галочками: 🟪 Спортивная
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟪 Спортивная' в списке: {user_data[user_id]['multi_select_purple_line_stations']}")
                            selected_mark = "✅ " if "🟪 Спортивная" in user_data[user_id]["multi_select_purple_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟪 Спортивная': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟪 Спортивная"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_sportivnaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_sportivnaya"))
                            # Кнопка выбора с галочками: 🟪 Адмиралтейская
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟪 Адмиралтейская' в списке: {user_data[user_id]['multi_select_purple_line_stations']}")
                            selected_mark = "✅ " if "🟪 Адмиралтейская" in user_data[user_id]["multi_select_purple_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟪 Адмиралтейская': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟪 Адмиралтейская"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_admiralteyskaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_admiralteyskaya"))
                            # Кнопка выбора с галочками: 🟪 Садовая
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟪 Садовая' в списке: {user_data[user_id]['multi_select_purple_line_stations']}")
                            selected_mark = "✅ " if "🟪 Садовая" in user_data[user_id]["multi_select_purple_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟪 Садовая': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟪 Садовая"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_sadovaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_sadovaya"))
                            # Кнопка выбора с галочками: 🟪 Звенигородская
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟪 Звенигородская' в списке: {user_data[user_id]['multi_select_purple_line_stations']}")
                            selected_mark = "✅ " if "🟪 Звенигородская" in user_data[user_id]["multi_select_purple_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟪 Звенигородская': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟪 Звенигородская"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_zvenigorodskaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_zvenigorodskaya"))
                            # Кнопка выбора с галочками: 🟪 Обводный канал
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟪 Обводный канал' в списке: {user_data[user_id]['multi_select_purple_line_stations']}")
                            selected_mark = "✅ " if "🟪 Обводный канал" in user_data[user_id]["multi_select_purple_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟪 Обводный канал': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟪 Обводный канал"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_obvodniy'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_obvodniy"))
                            # Кнопка выбора с галочками: 🟪 Волковская
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟪 Волковская' в списке: {user_data[user_id]['multi_select_purple_line_stations']}")
                            selected_mark = "✅ " if "🟪 Волковская" in user_data[user_id]["multi_select_purple_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟪 Волковская': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟪 Волковская"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_volkovskaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_volkovskaya"))
                            # Кнопка выбора с галочками: 🟪 Бухарестская
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟪 Бухарестская' в списке: {user_data[user_id]['multi_select_purple_line_stations']}")
                            selected_mark = "✅ " if "🟪 Бухарестская" in user_data[user_id]["multi_select_purple_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟪 Бухарестская': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟪 Бухарестская"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_buharestskaya'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_buharestskaya"))
                            # Кнопка выбора с галочками: 🟪 Международная
                            logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '🟪 Международная' в списке: {user_data[user_id]['multi_select_purple_line_stations']}")
                            selected_mark = "✅ " if "🟪 Международная" in user_data[user_id]["multi_select_purple_line_stations"] else ""
                            logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '🟪 Международная': selected_mark='{selected_mark}'")
                            final_text = f"{selected_mark}🟪 Международная"
                            logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='ms_stations_mezhdunar'")
                            builder.add(InlineKeyboardButton(text=final_text, callback_data="ms_stations_mezhdunar"))
                            builder.add(InlineKeyboardButton(text="⬅️ Назад к веткам", callback_data="metro_selection"))
                            # Добавляем кнопку "Готово" для множественного выбора
                            builder.add(InlineKeyboardButton(text="Готово", callback_data="multi_select_done_purple_line_stations"))
                            builder.adjust(2)
                            keyboard = builder.as_markup()
                            await message.answer(text, reply_markup=keyboard)
                            logging.info(f"✅ Прямая навигация к узлу множественного выбора purple_line_stations выполнена")
                        elif current_node_id == "profile_complete":
                            text = """🎉 Отлично! Твой профиль заполнен!

👤 Твоя анкета:
Пол: {gender}
Имя: {user_name}
Возраст: {user_age}
Метро: {metro_stations}
Интересы: {user_interests}
Семейное положение: {marital_status}
Ориентация: {sexual_orientation}

💬 Источник: {user_source}

Можешь посмотреть полную анкету или сразу получить ссылку на чат!"""
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
                            # Создаем inline клавиатуру
                            builder = InlineKeyboardBuilder()
                            logging.info(f"Создана кнопка команды: Ссылка на чат 🔗 -> cmd_link")
                            builder.add(InlineKeyboardButton(text="Ссылка на чат 🔗", callback_data="cmd_link"))
                            logging.info(f"Создана кнопка команды: Редактировать профиль ✏️ -> cmd_profile")
                            builder.add(InlineKeyboardButton(text="Редактировать профиль ✏️", callback_data="cmd_profile"))
                            builder.adjust(1)
                            keyboard = builder.as_markup()
                            await message.answer(text, reply_markup=keyboard)
                            # НЕ отправляем сообщение об успехе здесь - это делается в старом формате
                            # Очищаем сястояние ожидания ввода после уяпеянояо перехода
                            if "waiting_for_input" in user_data[user_id]:
                                del user_data[user_id]["waiting_for_input"]
                            
                            logging.info("✅ Переход к следующему уялу выполнен успешно")
                            break  # Нет автоперехода, завершаем цикл
                        elif current_node_id == "show_profile":
                            # Выполняяем команду /profile
                            from types import SimpleNamespace
                            fake_message = SimpleNamespace()
                            fake_message.from_user = message.from_user
                            fake_message.chat = message.chat
                            fake_message.date = message.date
                            fake_message.answer = message.answer
                            await profile_handler(fake_message)
                            break  # Выходим из цикла после вяполяеняя команды
                        elif current_node_id == "chat_link":
                            # Выполняяем команду /link
                            from types import SimpleNamespace
                            fake_message = SimpleNamespace()
                            fake_message.from_user = message.from_user
                            fake_message.chat = message.chat
                            fake_message.date = message.date
                            fake_message.answer = message.answer
                            await link_handler(fake_message)
                            break  # Выходим из цикла после вяполяеняя команды
                        elif current_node_id == "help_command":
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
        logging.info(f"DEBUG old format: checking inputNodes: start, join_request, gender_selection, name_input, age_input, metro_selection")
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
                builder.add(InlineKeyboardButton(text="Да 😎", callback_data="gender_selection"))
                builder.add(InlineKeyboardButton(text="Нет 🙅", callback_data="decline_response"))
                builder.adjust(1)
                keyboard = builder.as_markup()
                # Заменяем все переменные в тексте
                text = replace_variables_in_text(text, user_vars)
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
        elif waiting_node_id == "gender_selection":
            
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
        elif waiting_node_id == "name_input":
            
            # Сохраняем ответ пользователя
            import datetime
            timestamp = get_moscow_time()
            
            # Сохраняем простое значение для совместимости с логикой профиля
            response_data = user_text  # Простое значение вместо сложного объекта
            
            # Сохраняем в пользовательские данные
            user_data[user_id]["user_name"] = response_data
            
            # Сохраняем в базу данных
            saved_to_db = await update_user_data_in_db(user_id, "user_name", response_data)
            if saved_to_db:
                logging.info(f"✅ Данные сохранены в БД: user_name = {user_text} (пользователь {user_id})")
            else:
                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            
            logging.info(f"Получен пользовательский ввод: user_name = {user_text}")
            
            # Переходим к следующему узлу
            try:
                # Отправляем сообщение для узла age_input
                text = """Сколько тебе лет? 🎂

Напиши свой возраст числом (например, 25):"""
                # Настраиваем новое ожидание ввода для узла age_input
                user_data[user_id]["waiting_for_input"] = {
                    "type": "text",
                    "variable": "user_age",
                    "save_to_database": True,
                    "node_id": "age_input",
                    "next_node_id": "metro_selection",
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
        elif waiting_node_id == "age_input":
            
            # Сохраняем ответ пользователя
            import datetime
            timestamp = get_moscow_time()
            
            # Сохраняем простое значение для совместимости с логикой профиля
            response_data = user_text  # Простое значение вместо сложного объекта
            
            # Сохраняем в пользовательские данные
            user_data[user_id]["user_age"] = response_data
            
            # Сохраняем в базу данных
            saved_to_db = await update_user_data_in_db(user_id, "user_age", response_data)
            if saved_to_db:
                logging.info(f"✅ Данные сохранены в БД: user_age = {user_text} (пользователь {user_id})")
            else:
                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            
            logging.info(f"Получен пользовательский ввод: user_age = {user_text}")
            
            # Переходим к следующему узлу
            try:
                # Отправляем сообщение для узла metro_selection
                text = """На какой станции метро ты обычно бываешь? 🚇

Выбери свою ветку:"""
                # Настраиваем новое ожидание ввода для узла metro_selection
                user_data[user_id]["waiting_for_input"] = {
                    "type": "text",
                    "variable": "metro_stations",
                    "save_to_database": True,
                    "node_id": "metro_selection",
                    "next_node_id": "",
                    "min_length": 0,
                    "max_length": 0,
                    "retry_message": "Пожалуйста, попробуйте еще раз.",
                    "success_message": ""
                }
                
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="Красная ветка 🟥", callback_data="red_line_stations"))
                builder.add(InlineKeyboardButton(text="Синяя ветка 🟦", callback_data="blue_line_stations"))
                builder.add(InlineKeyboardButton(text="Зелёная ветка 🟩", callback_data="green_line_stations"))
                builder.add(InlineKeyboardButton(text="Фиолетовая ветка 🟪", callback_data="purple_line_stations"))
                builder.add(InlineKeyboardButton(text="Я из ЛО 🏡", callback_data="interests_categories"))
                builder.add(InlineKeyboardButton(text="Я не в Питере 🌍", callback_data="interests_categories"))
                builder.adjust(2)
                keyboard = builder.as_markup()
                # Заменяем все переменные в тексте
                text = replace_variables_in_text(text, user_vars)
                await message.answer(text, reply_markup=keyboard)
                
                logging.info("✅ Переход к следующему узлу выполнен успешно")
            except Exception as e:
                logging.error(f"Ошябка при переходе к следующему узлу: {e}")
            return
        elif waiting_node_id == "metro_selection":
            
            # Сохраняем ответ пользователя
            import datetime
            timestamp = get_moscow_time()
            
            # Сохраняем простое значение для совместимости с логикой профиля
            response_data = user_text  # Простое значение вместо сложного объекта
            
            # Сохраняем в пользовательские данные
            user_data[user_id]["metro_stations"] = response_data
            
            # Сохраняем в базу данных
            saved_to_db = await update_user_data_in_db(user_id, "metro_stations", response_data)
            if saved_to_db:
                logging.info(f"✅ Данные сохранены в БД: metro_stations = {user_text} (пользователь {user_id})")
            else:
                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            
            logging.info(f"Получен пользовательский ввод: metro_stations = {user_text}")
            
            # Конец цепочки ввода - завершаем обработку
            logging.info("Завершена цепочка сбора пользовательских данных")
            return

# Обработчики для кнопок команд
# Найдено 3 кнопок команд: cmd_link, cmd_profile, cmd_start

@dp.callback_query(lambda c: c.data == "cmd_link")
async def handle_cmd_link(callback_query: types.CallbackQuery):
    await callback_query.answer()
    logging.info(f"Обработка кнопки команды: cmd_link -> /link (пользователь {callback_query.from_user.id})")
    # Симулияуем выполнение команды /link
    
    # Создаем fake message object для команды
    from types import SimpleNamespace
    fake_message = SimpleNamespace()
    fake_message.from_user = callback_query.from_user
    fake_message.chat = callback_query.message.chat
    fake_message.date = callback_query.message.date
    fake_message.answer = callback_query.message.answer
    fake_message.edit_text = callback_query.message.edit_text
    
    # Вызываем link handler
    await link_handler(fake_message)
    logging.info(f"Команда /link выполнена через callback кнопку (пользователь {callback_query.from_user.id})")

@dp.callback_query(lambda c: c.data == "cmd_profile")
async def handle_cmd_profile(callback_query: types.CallbackQuery):
    await callback_query.answer()
    logging.info(f"Обработка кнопки команды: cmd_profile -> /profile (пользователь {callback_query.from_user.id})")
    # Симулияуем выполнение команды /profile
    
    # Создаем fake message object для команды
    from types import SimpleNamespace
    fake_message = SimpleNamespace()
    fake_message.from_user = callback_query.from_user
    fake_message.chat = callback_query.message.chat
    fake_message.date = callback_query.message.date
    fake_message.answer = callback_query.message.answer
    fake_message.edit_text = callback_query.message.edit_text
    
    # Вызываем profile handler
    await profile_handler(fake_message)
    logging.info(f"Команда /profile выполнена через callback кнопку (пользователь {callback_query.from_user.id})")

@dp.callback_query(lambda c: c.data == "cmd_start")
async def handle_cmd_start(callback_query: types.CallbackQuery):
    await callback_query.answer()
    logging.info(f"Обработка кнопки команды: cmd_start -> /start (пользователь {callback_query.from_user.id})")
    # Симулияуем выполнение команды /start
    
    # Создаем fake message object для команды
    from types import SimpleNamespace
    fake_message = SimpleNamespace()
    fake_message.from_user = callback_query.from_user
    fake_message.chat = callback_query.message.chat
    fake_message.date = callback_query.message.date
    fake_message.answer = callback_query.message.answer
    fake_message.edit_text = callback_query.message.edit_text
    
    # Вызываем start handler через edit_text
    # Создаем специальный объект для редактирования сообщения
    class FakeMessageEdit:
        def __init__(self, callback_query):
            self.from_user = callback_query.from_user
            self.chat = callback_query.message.chat
            self.date = callback_query.message.date
            self.message_id = callback_query.message.message_id
            self._callback_query = callback_query
        
        async def answer(self, text, parse_mode=None, reply_markup=None):
            await self._callback_query.message.edit_text(text, parse_mode=parse_mode, reply_markup=reply_markup)
        
        async def edit_text(self, text, parse_mode=None, reply_markup=None):
            await self._callback_query.message.edit_text(text, parse_mode=parse_mode, reply_markup=reply_markup)
    
    fake_edit_message = FakeMessageEdit(callback_query)
    await start_handler(fake_edit_message)
    logging.info(f"Команда /start выполнена через callback кнопку (пользователь {callback_query.from_user.id})")

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

# Обработчики для множественного выбора
@dp.callback_query(lambda c: c.data.startswith("ms_") or c.data.startswith("multi_select_"))
async def handle_multi_select_callback(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    # Инициализируем базовые переменные пользователя
    user_name = init_user_variables(user_id, callback_query.from_user)
    
    callback_data = callback_query.data
    
    # Обработка кнопки "Готово"
    if callback_data.startswith("done_"):
        # Завершение множественного выбора (новый формат)
        logging.info(f"🏁 Обработка кнопки Готово: {callback_data}")
        short_node_id = callback_data.replace("done_", "")
        # Находим полный node_id по короткому суффиксу
        node_id = None
        if short_node_id == "e_stations":
            node_id = "red_line_stations"
            logging.info(f"✅ Найден узел: red_line_stations")
        if short_node_id == "e_stations":
            node_id = "blue_line_stations"
            logging.info(f"✅ Найден узел: blue_line_stations")
        if short_node_id == "e_stations":
            node_id = "green_line_stations"
            logging.info(f"✅ Найден узел: green_line_stations")
        if short_node_id == "e_stations":
            node_id = "purple_line_stations"
            logging.info(f"✅ Найден узел: purple_line_stations")
    elif callback_data.startswith("multi_select_done_"):
        # Завершение множественного выбора (старый формат)
        node_id = callback_data.replace("multi_select_done_", "")
        selected_options = user_data.get(user_id, {}).get(f"multi_select_{node_id}", [])
        
        # Сохраняем выбранные опции в базу данных
        if selected_options:
            selected_text = ", ".join(selected_options)
            if node_id == "red_line_stations":
                await save_user_data_to_db(user_id, "metro_stations", selected_text)
            if node_id == "blue_line_stations":
                await save_user_data_to_db(user_id, "metro_stations", selected_text)
            if node_id == "green_line_stations":
                await save_user_data_to_db(user_id, "metro_stations", selected_text)
            if node_id == "purple_line_stations":
                await save_user_data_to_db(user_id, "metro_stations", selected_text)
            # Резервное сохранение если узел не найден
            if not any(node_id == node for node in ["red_line_stations", "blue_line_stations", "green_line_stations", "purple_line_stations"]):
                await save_user_data_to_db(user_id, f"multi_select_{node_id}", selected_text)
        
        # Очищаем состояние множественного выбора
        if user_id in user_data:
            user_data[user_id].pop(f"multi_select_{node_id}", None)
            user_data[user_id].pop("multi_select_node", None)
        
        # Переходим к следующему узлу, если указан
        # Определяем следующий узел для каждого node_id
        if node_id == "red_line_stations":
            # Целевой узел не найден, завершаем выбор
            logging.warning(f"⚠️ Целевой узел не найден: interests_categories")
            await safe_edit_or_send(callback_query, "✅ Выбор завершен!", is_auto_transition=True)
        if node_id == "blue_line_stations":
            # Целевой узел не найден, завершаем выбор
            logging.warning(f"⚠️ Целевой узел не найден: interests_categories")
            await safe_edit_or_send(callback_query, "✅ Выбор завершен!", is_auto_transition=True)
        if node_id == "green_line_stations":
            # Целевой узел не найден, завершаем выбор
            logging.warning(f"⚠️ Целевой узел не найден: interests_categories")
            await safe_edit_or_send(callback_query, "✅ Выбор завершен!", is_auto_transition=True)
        if node_id == "purple_line_stations":
            # Целевой узел не найден, завершаем выбор
            logging.warning(f"⚠️ Целевой узел не найден: interests_categories")
            await safe_edit_or_send(callback_query, "✅ Выбор завершен!", is_auto_transition=True)
        return
    
    # Обработка выбора опции
    logging.info(f"📱 Обрабатываем callback_data: {callback_data}")
    
    # Поддерживаем и новый формат ms_ и старый multi_select_
    if callback_data.startswith("ms_"):
        # Новый короткий формат: ms_shortNodeId_shortTarget
        parts = callback_data.split("_")
        if len(parts) >= 3:
            short_node_id = parts[1]
            button_id = "_".join(parts[2:])
            # Находим полный node_id по короткому суффиксу
            node_id = None
            logging.info(f"🔍 Ищем узел по короткому ID: {short_node_id}")
            
            # Для станций метро ищем по содержимому кнопки, а не по короткому ID
            if short_node_id == "stations":
                # Проверяем каждый узел станций на наличие нужной кнопки
                # Проверяем узел red_line_stations
                if button_id == "devyatkino":
                    node_id = "red_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "grazhdansky":
                    node_id = "red_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "akademicheskaya":
                    node_id = "red_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "politehnicheskaya":
                    node_id = "red_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "pl_muzhestva":
                    node_id = "red_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "lesnaya":
                    node_id = "red_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "vyborgskaya":
                    node_id = "red_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "pl_lenina":
                    node_id = "red_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "chernyshevskaya":
                    node_id = "red_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "pl_vosstaniya":
                    node_id = "red_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "vladimirskaya":
                    node_id = "red_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "pushkinskaya":
                    node_id = "red_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "tehinstitut1":
                    node_id = "red_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "baltiyskaya":
                    node_id = "red_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "narvskaya":
                    node_id = "red_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "kirovsky":
                    node_id = "red_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "avtovo":
                    node_id = "red_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "leninsky":
                    node_id = "red_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "veteranov":
                    node_id = "red_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                # Проверяем узел blue_line_stations
                if button_id == "parnas":
                    node_id = "blue_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "prosp_prosvesh":
                    node_id = "blue_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "ozerki":
                    node_id = "blue_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "udelnaya":
                    node_id = "blue_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "pionerskaya":
                    node_id = "blue_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "chernaya":
                    node_id = "blue_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "petrogradskaya":
                    node_id = "blue_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "gorkovskaya":
                    node_id = "blue_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "nevsky":
                    node_id = "blue_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "sennaya":
                    node_id = "blue_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "tehinstitut2":
                    node_id = "blue_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "frunzenskaya":
                    node_id = "blue_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "mosk_vorota":
                    node_id = "blue_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "elektrosila":
                    node_id = "blue_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "park_pobedy":
                    node_id = "blue_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "moskovskaya":
                    node_id = "blue_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "zvezdnaya":
                    node_id = "blue_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "kupchino":
                    node_id = "blue_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                # Проверяем узел green_line_stations
                if button_id == "primorskaya":
                    node_id = "green_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "vasileostr":
                    node_id = "green_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "gostiny":
                    node_id = "green_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "mayakovskaya":
                    node_id = "green_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "pl_nevsk":
                    node_id = "green_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "elizarovskaya":
                    node_id = "green_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "lomonosovskaya":
                    node_id = "green_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "proletarskaya":
                    node_id = "green_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "obuhovo":
                    node_id = "green_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "rybackoe":
                    node_id = "green_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "novokrestovsk":
                    node_id = "green_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "begovaya":
                    node_id = "green_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                # Проверяем узел purple_line_stations
                if button_id == "komendantsky":
                    node_id = "purple_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "staraya":
                    node_id = "purple_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "krestovsky":
                    node_id = "purple_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "chkalovskaya":
                    node_id = "purple_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "sportivnaya":
                    node_id = "purple_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "admiralteyskaya":
                    node_id = "purple_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "sadovaya":
                    node_id = "purple_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "zvenigorodskaya":
                    node_id = "purple_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "obvodniy":
                    node_id = "purple_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "volkovskaya":
                    node_id = "purple_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "buharestskaya":
                    node_id = "purple_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
                if button_id == "mezhdunar":
                    node_id = "purple_line_stations"
                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
            else:
                # Обычная логика для других узлов
                pass
    elif callback_data.startswith("multi_select_"):
        # Старый формат для обратной совместимости
        parts = callback_data.split("_")
        if len(parts) >= 3:
            node_id = parts[2]
            button_id = "_".join(parts[3:]) if len(parts) > 3 else parts[2]
    else:
        logging.warning(f"⚠️ Неизвестный формат callback_data: {callback_data}")
        return
    
    if not node_id:
        # Резервный поиск: ищем узел, который содержит кнопку с target, совпадающим с button_id
        logging.info(f"🔍 Резервный поиск узла по button_id: {button_id}")

        if not node_id and button_id == "devyatkino":
            node_id = "red_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "grazhdansky":
            node_id = "red_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "akademicheskaya":
            node_id = "red_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "politehnicheskaya":
            node_id = "red_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "pl_muzhestva":
            node_id = "red_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "lesnaya":
            node_id = "red_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "vyborgskaya":
            node_id = "red_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "pl_lenina":
            node_id = "red_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "chernyshevskaya":
            node_id = "red_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "pl_vosstaniya":
            node_id = "red_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "vladimirskaya":
            node_id = "red_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "pushkinskaya":
            node_id = "red_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "tehinstitut1":
            node_id = "red_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "baltiyskaya":
            node_id = "red_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "narvskaya":
            node_id = "red_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "kirovsky":
            node_id = "red_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "avtovo":
            node_id = "red_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "leninsky":
            node_id = "red_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "veteranov":
            node_id = "red_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "parnas":
            node_id = "blue_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "prosp_prosvesh":
            node_id = "blue_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "ozerki":
            node_id = "blue_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "udelnaya":
            node_id = "blue_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "pionerskaya":
            node_id = "blue_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "chernaya":
            node_id = "blue_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "petrogradskaya":
            node_id = "blue_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "gorkovskaya":
            node_id = "blue_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "nevsky":
            node_id = "blue_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "sennaya":
            node_id = "blue_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "tehinstitut2":
            node_id = "blue_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "frunzenskaya":
            node_id = "blue_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "mosk_vorota":
            node_id = "blue_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "elektrosila":
            node_id = "blue_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "park_pobedy":
            node_id = "blue_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "moskovskaya":
            node_id = "blue_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "zvezdnaya":
            node_id = "blue_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "kupchino":
            node_id = "blue_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "primorskaya":
            node_id = "green_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "vasileostr":
            node_id = "green_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "gostiny":
            node_id = "green_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "mayakovskaya":
            node_id = "green_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "pl_nevsk":
            node_id = "green_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "elizarovskaya":
            node_id = "green_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "lomonosovskaya":
            node_id = "green_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "proletarskaya":
            node_id = "green_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "obuhovo":
            node_id = "green_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "rybackoe":
            node_id = "green_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "novokrestovsk":
            node_id = "green_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "begovaya":
            node_id = "green_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "komendantsky":
            node_id = "purple_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "staraya":
            node_id = "purple_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "krestovsky":
            node_id = "purple_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "chkalovskaya":
            node_id = "purple_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "sportivnaya":
            node_id = "purple_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "admiralteyskaya":
            node_id = "purple_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "sadovaya":
            node_id = "purple_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "zvenigorodskaya":
            node_id = "purple_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "obvodniy":
            node_id = "purple_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "volkovskaya":
            node_id = "purple_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "buharestskaya":
            node_id = "purple_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
        if not node_id and button_id == "mezhdunar":
            node_id = "purple_line_stations"
            logging.info(f"✅ Найден узел по target кнопки: {node_id}")

    if not node_id:
        logging.warning(f"⚠️ Не удалось найти node_id для callback_data: {callback_data}")
        return
    
    logging.info(f"📱 Определили node_id: {node_id}, button_id: {button_id}")
    
    # Инициализируем список выбранных опций с восстановлением из БД
    if user_id not in user_data:
        user_data[user_id] = {}
    
    # Восстанавливаем ранее выбранные опции из базы данных
    if f"multi_select_{node_id}" not in user_data[user_id]:
        # Загружаем сохраненные данные из базы
        user_vars = await get_user_from_db(user_id)
        saved_selections = []
        
        if user_vars:
            # Ищем переменную с интересами
            for var_name, var_data in user_vars.items():
                if "интерес" in var_name.lower() or var_name == "interests" or var_name.startswith("multi_select_"):
                    if isinstance(var_data, dict) and "value" in var_data:
                        saved_str = var_data["value"]
                    elif isinstance(var_data, str):
                        saved_str = var_data
                    else:
                        saved_str = str(var_data) if var_data else ""
                    
                    if saved_str:
                        saved_selections = [item.strip() for item in saved_str.split(",")]
                        break
        
        user_data[user_id][f"multi_select_{node_id}"] = saved_selections
    
    # Находим текст кнопки по button_id
    button_text = None
    if node_id == "red_line_stations":
        if button_id == "devyatkino":
            button_text = "🟥 Девяткино"
        if button_id == "grazhdansky":
            button_text = "🟥 Гражданский проспект"
        if button_id == "akademicheskaya":
            button_text = "🟥 Академическая"
        if button_id == "politehnicheskaya":
            button_text = "🟥 Политехническая"
        if button_id == "pl_muzhestva":
            button_text = "🟥 Площадь Мужества"
        if button_id == "lesnaya":
            button_text = "🟥 Лесная"
        if button_id == "vyborgskaya":
            button_text = "🟥 Выборгская"
        if button_id == "pl_lenina":
            button_text = "🟥 Площадь Ленина"
        if button_id == "chernyshevskaya":
            button_text = "🟥 Чернышевская"
        if button_id == "pl_vosstaniya":
            button_text = "🟥 Площадь Восстания"
        if button_id == "vladimirskaya":
            button_text = "🟥 Владимирская"
        if button_id == "pushkinskaya":
            button_text = "🟥 Пушкинская"
        if button_id == "tehinstitut1":
            button_text = "🟥 Технологический институт-1"
        if button_id == "baltiyskaya":
            button_text = "🟥 Балтийская"
        if button_id == "narvskaya":
            button_text = "🟥 Нарвская"
        if button_id == "kirovsky":
            button_text = "🟥 Кировский завод"
        if button_id == "avtovo":
            button_text = "🟥 Автово"
        if button_id == "leninsky":
            button_text = "🟥 Ленинский проспект"
        if button_id == "veteranov":
            button_text = "🟥 Проспект Ветеранов"
    if node_id == "blue_line_stations":
        if button_id == "parnas":
            button_text = "🟦 Парнас"
        if button_id == "prosp_prosvesh":
            button_text = "🟦 Проспект Просвещения"
        if button_id == "ozerki":
            button_text = "🟦 Озерки"
        if button_id == "udelnaya":
            button_text = "🟦 Удельная"
        if button_id == "pionerskaya":
            button_text = "🟦 Пионерская"
        if button_id == "chernaya":
            button_text = "🟦 Черная речка"
        if button_id == "petrogradskaya":
            button_text = "🟦 Петроградская"
        if button_id == "gorkovskaya":
            button_text = "🟦 Горьковская"
        if button_id == "nevsky":
            button_text = "🟦 Невский проспект"
        if button_id == "sennaya":
            button_text = "🟦 Сенная площадь"
        if button_id == "tehinstitut2":
            button_text = "🟦 Технологический институт-2"
        if button_id == "frunzenskaya":
            button_text = "🟦 Фрунзенская"
        if button_id == "mosk_vorota":
            button_text = "🟦 Московские ворота"
        if button_id == "elektrosila":
            button_text = "🟦 Электросила"
        if button_id == "park_pobedy":
            button_text = "🟦 Парк Победы"
        if button_id == "moskovskaya":
            button_text = "🟦 Московская"
        if button_id == "zvezdnaya":
            button_text = "🟦 Звездная"
        if button_id == "kupchino":
            button_text = "🟦 Купчино"
    if node_id == "green_line_stations":
        if button_id == "primorskaya":
            button_text = "🟩 Приморская"
        if button_id == "vasileostr":
            button_text = "🟩 Василеостровская"
        if button_id == "gostiny":
            button_text = "🟩 Гостиный двор"
        if button_id == "mayakovskaya":
            button_text = "🟩 Маяковская"
        if button_id == "pl_nevsk":
            button_text = "🟩 Площадь Александра Невского-1"
        if button_id == "elizarovskaya":
            button_text = "🟩 Елизаровская"
        if button_id == "lomonosovskaya":
            button_text = "🟩 Ломоносовская"
        if button_id == "proletarskaya":
            button_text = "🟩 Пролетарская"
        if button_id == "obuhovo":
            button_text = "🟩 Обухово"
        if button_id == "rybackoe":
            button_text = "🟩 Рыбацкое"
        if button_id == "novokrestovsk":
            button_text = "🟩 Новокрестовская"
        if button_id == "begovaya":
            button_text = "🟩 Беговая"
    if node_id == "purple_line_stations":
        if button_id == "komendantsky":
            button_text = "🟪 Комендантский проспект"
        if button_id == "staraya":
            button_text = "🟪 Старая Деревня"
        if button_id == "krestovsky":
            button_text = "🟪 Крестовский остров"
        if button_id == "chkalovskaya":
            button_text = "🟪 Чкаловская"
        if button_id == "sportivnaya":
            button_text = "🟪 Спортивная"
        if button_id == "admiralteyskaya":
            button_text = "🟪 Адмиралтейская"
        if button_id == "sadovaya":
            button_text = "🟪 Садовая"
        if button_id == "zvenigorodskaya":
            button_text = "🟪 Звенигородская"
        if button_id == "obvodniy":
            button_text = "🟪 Обводный канал"
        if button_id == "volkovskaya":
            button_text = "🟪 Волковская"
        if button_id == "buharestskaya":
            button_text = "🟪 Бухарестская"
        if button_id == "mezhdunar":
            button_text = "🟪 Международная"
    
    if button_text:
        logging.info(f"🔘 Обрабатываем кнопку: {button_text}")
        selected_list = user_data[user_id][f"multi_select_{node_id}"]
        if button_text in selected_list:
            selected_list.remove(button_text)
            logging.info(f"➖ Убрали выбор: {button_text}")
        else:
            selected_list.append(button_text)
            logging.info(f"➕ Добавили выбор: {button_text}")
        
        logging.info(f"📋 Текущие выборы: {selected_list}")
        
        # Обновляем клавиатуру с галочками
        builder = InlineKeyboardBuilder()
        if node_id == "red_line_stations":
            selected_mark = "✅ " if "🟥 Девяткино" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Девяткино", callback_data="ms_stations_devyatkino"))
            selected_mark = "✅ " if "🟥 Гражданский проспект" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Гражданский проспект", callback_data="ms_stations_grazhdansky"))
            selected_mark = "✅ " if "🟥 Академическая" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Академическая", callback_data="ms_stations_akademicheskaya"))
            selected_mark = "✅ " if "🟥 Политехническая" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Политехническая", callback_data="ms_stations_politehnicheskaya"))
            selected_mark = "✅ " if "🟥 Площадь Мужества" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Площадь Мужества", callback_data="ms_stations_pl_muzhestva"))
            selected_mark = "✅ " if "🟥 Лесная" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Лесная", callback_data="ms_stations_lesnaya"))
            selected_mark = "✅ " if "🟥 Выборгская" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Выборгская", callback_data="ms_stations_vyborgskaya"))
            selected_mark = "✅ " if "🟥 Площадь Ленина" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Площадь Ленина", callback_data="ms_stations_pl_lenina"))
            selected_mark = "✅ " if "🟥 Чернышевская" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Чернышевская", callback_data="ms_stations_chernyshevskaya"))
            selected_mark = "✅ " if "🟥 Площадь Восстания" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Площадь Восстания", callback_data="ms_stations_pl_vosstaniya"))
            selected_mark = "✅ " if "🟥 Владимирская" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Владимирская", callback_data="ms_stations_vladimirskaya"))
            selected_mark = "✅ " if "🟥 Пушкинская" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Пушкинская", callback_data="ms_stations_pushkinskaya"))
            selected_mark = "✅ " if "🟥 Технологический институт-1" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Технологический институт-1", callback_data="ms_stations_tehinstitut1"))
            selected_mark = "✅ " if "🟥 Балтийская" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Балтийская", callback_data="ms_stations_baltiyskaya"))
            selected_mark = "✅ " if "🟥 Нарвская" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Нарвская", callback_data="ms_stations_narvskaya"))
            selected_mark = "✅ " if "🟥 Кировский завод" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Кировский завод", callback_data="ms_stations_kirovsky"))
            selected_mark = "✅ " if "🟥 Автово" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Автово", callback_data="ms_stations_avtovo"))
            selected_mark = "✅ " if "🟥 Ленинский проспект" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Ленинский проспект", callback_data="ms_stations_leninsky"))
            selected_mark = "✅ " if "🟥 Проспект Ветеранов" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟥 Проспект Ветеранов", callback_data="ms_stations_veteranov"))
            builder.add(InlineKeyboardButton(text="⬅️ Назад к веткам", callback_data="metro_selection"))
            builder.add(InlineKeyboardButton(text="Готово", callback_data="multi_select_done_red_line_stations"))
            logging.info(f"🔧 ГЕНЕРАТОР: Применяем adjust(2) для узла red_line_stations (multi-select)")
            builder.adjust(2)
        if node_id == "blue_line_stations":
            selected_mark = "✅ " if "🟦 Парнас" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Парнас", callback_data="ms_stations_parnas"))
            selected_mark = "✅ " if "🟦 Проспект Просвещения" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Проспект Просвещения", callback_data="ms_stations_prosp_prosvesh"))
            selected_mark = "✅ " if "🟦 Озерки" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Озерки", callback_data="ms_stations_ozerki"))
            selected_mark = "✅ " if "🟦 Удельная" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Удельная", callback_data="ms_stations_udelnaya"))
            selected_mark = "✅ " if "🟦 Пионерская" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Пионерская", callback_data="ms_stations_pionerskaya"))
            selected_mark = "✅ " if "🟦 Черная речка" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Черная речка", callback_data="ms_stations_chernaya"))
            selected_mark = "✅ " if "🟦 Петроградская" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Петроградская", callback_data="ms_stations_petrogradskaya"))
            selected_mark = "✅ " if "🟦 Горьковская" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Горьковская", callback_data="ms_stations_gorkovskaya"))
            selected_mark = "✅ " if "🟦 Невский проспект" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Невский проспект", callback_data="ms_stations_nevsky"))
            selected_mark = "✅ " if "🟦 Сенная площадь" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Сенная площадь", callback_data="ms_stations_sennaya"))
            selected_mark = "✅ " if "🟦 Технологический институт-2" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Технологический институт-2", callback_data="ms_stations_tehinstitut2"))
            selected_mark = "✅ " if "🟦 Фрунзенская" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Фрунзенская", callback_data="ms_stations_frunzenskaya"))
            selected_mark = "✅ " if "🟦 Московские ворота" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Московские ворота", callback_data="ms_stations_mosk_vorota"))
            selected_mark = "✅ " if "🟦 Электросила" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Электросила", callback_data="ms_stations_elektrosila"))
            selected_mark = "✅ " if "🟦 Парк Победы" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Парк Победы", callback_data="ms_stations_park_pobedy"))
            selected_mark = "✅ " if "🟦 Московская" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Московская", callback_data="ms_stations_moskovskaya"))
            selected_mark = "✅ " if "🟦 Звездная" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Звездная", callback_data="ms_stations_zvezdnaya"))
            selected_mark = "✅ " if "🟦 Купчино" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟦 Купчино", callback_data="ms_stations_kupchino"))
            builder.add(InlineKeyboardButton(text="⬅️ Назад к веткам", callback_data="metro_selection"))
            builder.add(InlineKeyboardButton(text="Готово", callback_data="multi_select_done_blue_line_stations"))
            logging.info(f"🔧 ГЕНЕРАТОР: Применяем adjust(2) для узла blue_line_stations (multi-select)")
            builder.adjust(2)
        if node_id == "green_line_stations":
            selected_mark = "✅ " if "🟩 Приморская" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟩 Приморская", callback_data="ms_stations_primorskaya"))
            selected_mark = "✅ " if "🟩 Василеостровская" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟩 Василеостровская", callback_data="ms_stations_vasileostr"))
            selected_mark = "✅ " if "🟩 Гостиный двор" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟩 Гостиный двор", callback_data="ms_stations_gostiny"))
            selected_mark = "✅ " if "🟩 Маяковская" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟩 Маяковская", callback_data="ms_stations_mayakovskaya"))
            selected_mark = "✅ " if "🟩 Площадь Александра Невского-1" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟩 Площадь Александра Невского-1", callback_data="ms_stations_pl_nevsk"))
            selected_mark = "✅ " if "🟩 Елизаровская" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟩 Елизаровская", callback_data="ms_stations_elizarovskaya"))
            selected_mark = "✅ " if "🟩 Ломоносовская" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟩 Ломоносовская", callback_data="ms_stations_lomonosovskaya"))
            selected_mark = "✅ " if "🟩 Пролетарская" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟩 Пролетарская", callback_data="ms_stations_proletarskaya"))
            selected_mark = "✅ " if "🟩 Обухово" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟩 Обухово", callback_data="ms_stations_obuhovo"))
            selected_mark = "✅ " if "🟩 Рыбацкое" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟩 Рыбацкое", callback_data="ms_stations_rybackoe"))
            selected_mark = "✅ " if "🟩 Новокрестовская" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟩 Новокрестовская", callback_data="ms_stations_novokrestovsk"))
            selected_mark = "✅ " if "🟩 Беговая" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟩 Беговая", callback_data="ms_stations_begovaya"))
            builder.add(InlineKeyboardButton(text="⬅️ Назад к веткам", callback_data="metro_selection"))
            builder.add(InlineKeyboardButton(text="Готово", callback_data="multi_select_done_green_line_stations"))
            logging.info(f"🔧 ГЕНЕРАТОР: Применяем adjust(2) для узла green_line_stations (multi-select)")
            builder.adjust(2)
        if node_id == "purple_line_stations":
            selected_mark = "✅ " if "🟪 Комендантский проспект" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟪 Комендантский проспект", callback_data="ms_stations_komendantsky"))
            selected_mark = "✅ " if "🟪 Старая Деревня" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟪 Старая Деревня", callback_data="ms_stations_staraya"))
            selected_mark = "✅ " if "🟪 Крестовский остров" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟪 Крестовский остров", callback_data="ms_stations_krestovsky"))
            selected_mark = "✅ " if "🟪 Чкаловская" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟪 Чкаловская", callback_data="ms_stations_chkalovskaya"))
            selected_mark = "✅ " if "🟪 Спортивная" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟪 Спортивная", callback_data="ms_stations_sportivnaya"))
            selected_mark = "✅ " if "🟪 Адмиралтейская" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟪 Адмиралтейская", callback_data="ms_stations_admiralteyskaya"))
            selected_mark = "✅ " if "🟪 Садовая" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟪 Садовая", callback_data="ms_stations_sadovaya"))
            selected_mark = "✅ " if "🟪 Звенигородская" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟪 Звенигородская", callback_data="ms_stations_zvenigorodskaya"))
            selected_mark = "✅ " if "🟪 Обводный канал" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟪 Обводный канал", callback_data="ms_stations_obvodniy"))
            selected_mark = "✅ " if "🟪 Волковская" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟪 Волковская", callback_data="ms_stations_volkovskaya"))
            selected_mark = "✅ " if "🟪 Бухарестская" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟪 Бухарестская", callback_data="ms_stations_buharestskaya"))
            selected_mark = "✅ " if "🟪 Международная" in selected_list else ""
            builder.add(InlineKeyboardButton(text=f"{selected_mark}🟪 Международная", callback_data="ms_stations_mezhdunar"))
            builder.add(InlineKeyboardButton(text="⬅️ Назад к веткам", callback_data="metro_selection"))
            builder.add(InlineKeyboardButton(text="Готово", callback_data="multi_select_done_purple_line_stations"))
            logging.info(f"🔧 ГЕНЕРАТОР: Применяем adjust(2) для узла purple_line_stations (multi-select)")
            builder.adjust(2)
        
        keyboard = builder.as_markup()
        logging.info(f"🔄 ОБНОВЛЯЕМ клавиатуру для узла {node_id} с галочками")
        await callback_query.message.edit_reply_markup(reply_markup=keyboard)

# Обработчик для кнопок завершения множественного выбора
@dp.callback_query(lambda callback_query: callback_query.data and callback_query.data.startswith("multi_select_done_"))
async def handle_multi_select_done(callback_query: types.CallbackQuery):
    logging.info(f"🏁 ОБРАБОТЧИК ГОТОВО АКТИВИРОВАН! callback_data: {callback_query.data}")
    await callback_query.answer()
    user_id = callback_query.from_user.id
    callback_data = callback_query.data
    
    logging.info(f"🏁 Завершение множественного выбора: {callback_data}")
    logging.info(f"🔍 ГЕНЕРАТОР DEBUG: Текущее сообщение ID: {callback_query.message.message_id}")
    logging.info(f"🔍 ГЕНЕРАТОР DEBUG: Текущий текст сообщения: {callback_query.message.text}")
    logging.info(f"🔍 ГЕНЕРАТОР DEBUG: Есть ли клавиатура: {bool(callback_query.message.reply_markup)}")
    
    # Извлекаем node_id из callback_data
    node_id = callback_data.replace("multi_select_done_", "")
    logging.info(f"🎯 Node ID для завершения: {node_id}")
    
    if node_id == "red_line_stations":
        logging.info(f"🔍 ГЕНЕРАТОР DEBUG: Обрабатываем завершение для узла red_line_stations")
        logging.info(f"🔍 ГЕНЕРАТОР DEBUG: continueButtonTarget = interests_categories")
        # Получаем выбранные опции для узла red_line_stations
        selected_options = user_data.get(user_id, {}).get("multi_select_red_line_stations", [])
        logging.info(f"📋 ГЕНЕРАТОР DEBUG: Выбранные опции для red_line_stations: {selected_options}")
        
        if selected_options:
            selected_text = ", ".join(selected_options)
            await save_user_data_to_db(user_id, "metro_stations", selected_text)
            logging.info(f"💾 ГЕНЕРАТОР DEBUG: Сохранили в БД: metro_stations = {selected_text}")
        else:
            logging.info(f"⚠️ ГЕНЕРАТОР DEBUG: Нет выбранных опций для сохранения")
        
        return
    
    if node_id == "blue_line_stations":
        logging.info(f"🔍 ГЕНЕРАТОР DEBUG: Обрабатываем завершение для узла blue_line_stations")
        logging.info(f"🔍 ГЕНЕРАТОР DEBUG: continueButtonTarget = interests_categories")
        # Получаем выбранные опции для узла blue_line_stations
        selected_options = user_data.get(user_id, {}).get("multi_select_blue_line_stations", [])
        logging.info(f"📋 ГЕНЕРАТОР DEBUG: Выбранные опции для blue_line_stations: {selected_options}")
        
        if selected_options:
            selected_text = ", ".join(selected_options)
            await save_user_data_to_db(user_id, "metro_stations", selected_text)
            logging.info(f"💾 ГЕНЕРАТОР DEBUG: Сохранили в БД: metro_stations = {selected_text}")
        else:
            logging.info(f"⚠️ ГЕНЕРАТОР DEBUG: Нет выбранных опций для сохранения")
        
        return
    
    if node_id == "green_line_stations":
        logging.info(f"🔍 ГЕНЕРАТОР DEBUG: Обрабатываем завершение для узла green_line_stations")
        logging.info(f"🔍 ГЕНЕРАТОР DEBUG: continueButtonTarget = interests_categories")
        # Получаем выбранные опции для узла green_line_stations
        selected_options = user_data.get(user_id, {}).get("multi_select_green_line_stations", [])
        logging.info(f"📋 ГЕНЕРАТОР DEBUG: Выбранные опции для green_line_stations: {selected_options}")
        
        if selected_options:
            selected_text = ", ".join(selected_options)
            await save_user_data_to_db(user_id, "metro_stations", selected_text)
            logging.info(f"💾 ГЕНЕРАТОР DEBUG: Сохранили в БД: metro_stations = {selected_text}")
        else:
            logging.info(f"⚠️ ГЕНЕРАТОР DEBUG: Нет выбранных опций для сохранения")
        
        return
    
    if node_id == "purple_line_stations":
        logging.info(f"🔍 ГЕНЕРАТОР DEBUG: Обрабатываем завершение для узла purple_line_stations")
        logging.info(f"🔍 ГЕНЕРАТОР DEBUG: continueButtonTarget = interests_categories")
        # Получаем выбранные опции для узла purple_line_stations
        selected_options = user_data.get(user_id, {}).get("multi_select_purple_line_stations", [])
        logging.info(f"📋 ГЕНЕРАТОР DEBUG: Выбранные опции для purple_line_stations: {selected_options}")
        
        if selected_options:
            selected_text = ", ".join(selected_options)
            await save_user_data_to_db(user_id, "metro_stations", selected_text)
            logging.info(f"💾 ГЕНЕРАТОР DEBUG: Сохранили в БД: metro_stations = {selected_text}")
        else:
            logging.info(f"⚠️ ГЕНЕРАТОР DEBUG: Нет выбранных опций для сохранения")
        
        return
    

if __name__ == "__main__":
    asyncio.run(main())
