/**
 * PythonTemplates - Система переиспользуемых шаблонов Python кода
 * 
 * Содержит все базовые шаблоны для генерации Python кода Telegram ботов.
 * Шаблоны кэшируются для повышения производительности.
 */

/**
 * Интерфейс для системы шаблонов Python
 */
export interface IPythonTemplates {
  /**
   * Получить шаблон настройки кодировки UTF-8
   */
  getEncodingTemplate(): string;
  
  /**
   * Получить шаблон базовых импортов
   */
  getImportsTemplate(): string;
  
  /**
   * Получить шаблон инициализации бота
   */
  getBotInitTemplate(): string;
  
  /**
   * Получить шаблон основной функции main()
   */
  getMainFunctionTemplate(): string;
  
  /**
   * Получить шаблон обработчика по типу
   */
  getHandlerTemplate(handlerType: string): string;
  
  /**
   * Получить шаблон функции сохранения сообщений
   */
  getSaveMessageTemplate(): string;
  
  /**
   * Получить шаблон middleware для логирования
   */
  getMiddlewareTemplate(): string;
  
  /**
   * Получить шаблон safe_edit_or_send функции
   */
  getSafeEditOrSendTemplate(): string;
  
  /**
   * Получить шаблон утилитарных функций
   */
  getUtilityFunctionsTemplate(): string;
}

/**
 * Реализация системы шаблонов Python с кэшированием
 */
export class PythonTemplates implements IPythonTemplates {
  private templateCache = new Map<string, string>();
  
  /**
   * Получить шаблон с кэшированием
   */
  private getCachedTemplate(key: string, generator: () => string): string {
    if (!this.templateCache.has(key)) {
      this.templateCache.set(key, generator());
    }
    return this.templateCache.get(key)!;
  }
  
  /**
   * Очистить кэш шаблонов
   */
  clearCache(): void {
    this.templateCache.clear();
  }
  
  /**
   * Получить размер кэша
   */
  getCacheSize(): number {
    return this.templateCache.size;
  }

  /**
   * Шаблон настройки UTF-8 кодировки
   */
  getEncodingTemplate(): string {
    return this.getCachedTemplate('encoding', () => `# -*- coding: utf-8 -*-
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

`);
  }

  /**
   * Шаблон базовых импортов
   */
  getImportsTemplate(): string {
    return this.getCachedTemplate('imports', () => `import asyncio
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
from datetime import datetime, timezone, timedelta
import json
import aiohttp
from aiohttp import TCPConnector

`);
  }

  /**
   * Шаблон инициализации бота
   */
  getBotInitTemplate(): string {
    return this.getCachedTemplate('bot_init', () => `# Токен вашего бота (получите у @BotFather)
BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"

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

`);
  }

  /**
   * Шаблон основной функции main()
   */
  getMainFunctionTemplate(): string {
    return this.getCachedTemplate('main_function', () => `async def main():
    """Основная функция запуска бота"""
    try:
        # Устанавливаем команды бота
        commands = [
            BotCommand(command="start", description="Запустить бота"),
        ]
        await bot.set_my_commands(commands)
        
        logging.info("🚀 Бот запущен и готов к работе!")
        
        # Запускаем polling
        await dp.start_polling(bot)
        
    except Exception as e:
        logging.error(f"❌ Критическая ошибка при запуске бота: {e}")
    finally:
        # Закрываем сессию бота
        await bot.session.close()
        logging.info("🛑 Бот остановлен")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("🛑 Получен сигнал остановки")
    except Exception as e:
        logging.error(f"❌ Неожиданная ошибка: {e}")
`);
  }

  /**
   * Шаблон обработчика по типу
   */
  getHandlerTemplate(handlerType: string): string {
    const cacheKey = `handler_${handlerType}`;
    
    return this.getCachedTemplate(cacheKey, () => {
      switch (handlerType) {
        case 'command':
          return `@dp.message(Command("{command}"))
async def handle_{command}_command(message: types.Message):
    """Обработчик команды /{command}"""
    try:
        user_id = message.from_user.id
        logging.info(f"🔵 Команда /{command} от пользователя {user_id}")
        
        # Логика обработки команды
        await message.answer("{response_text}")
        
    except Exception as e:
        logging.error(f"❌ Ошибка в обработчике команды /{command}: {e}")
        await message.answer("Произошла ошибка при обработке команды")

`;

        case 'callback':
          return `@dp.callback_query(lambda c: c.data == "{callback_data}")
async def handle_callback_{callback_name}(callback_query: types.CallbackQuery):
    """Обработчик callback кнопки"""
    try:
        await callback_query.answer()
        user_id = callback_query.from_user.id
        logging.info(f"🔵 Callback {callback_data} от пользователя {user_id}")
        
        # Логика обработки callback
        await callback_query.message.edit_text("{response_text}")
        
    except Exception as e:
        logging.error(f"❌ Ошибка в callback обработчике: {e}")

`;

        case 'message':
          return `@dp.message(F.text == "{trigger_text}")
async def handle_message_{message_name}(message: types.Message):
    """Обработчик текстового сообщения"""
    try:
        user_id = message.from_user.id
        logging.info(f"🔵 Сообщение '{trigger_text}' от пользователя {user_id}")
        
        # Логика обработки сообщения
        await message.answer("{response_text}")
        
    except Exception as e:
        logging.error(f"❌ Ошибка в обработчике сообщения: {e}")

`;

        case 'media':
          return `@dp.message(F.{media_type})
async def handle_{media_type}_message(message: types.Message):
    """Обработчик {media_type} сообщений"""
    try:
        user_id = message.from_user.id
        logging.info(f"🔵 {media_type} от пользователя {user_id}")
        
        # Логика обработки медиа
        await message.answer("{response_text}")
        
    except Exception as e:
        logging.error(f"❌ Ошибка в обработчике {media_type}: {e}")

`;

        default:
          return `# Неизвестный тип обработчика: ${handlerType}
`;
      }
    });
  }

  /**
   * Шаблон функции сохранения сообщений в API
   */
  getSaveMessageTemplate(): string {
    return this.getCachedTemplate('save_message', () => `async def save_message_to_api(user_id: str, message_type: str, message_text: str = None, node_id: str = None, message_data: dict = None):
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
        
        # Настройка SSL для локальных подключений
        import ssl
        ssl_context = None
        if "localhost" in api_url or "127.0.0.1" in api_url:
            # Для локальных подключений отключаем проверку SSL
            ssl_context = False
        
        connector = aiohttp.TCPConnector(ssl=ssl_context)
        async with aiohttp.ClientSession(connector=connector) as session:
            async with session.post(api_url, json=payload, timeout=aiohttp.ClientTimeout(total=5)) as response:
                if response.status == 200:
                    logging.info(f"✅ Сообщение сохранено: {message_type} от {user_id}")
                    response_data = await response.json()
                    return response_data.get("data")  # Возвращаем сохраненное сообщение с id
                else:
                    error_text = await response.text()
                    logging.error(f"❌ Не удалось сохранить сообщение: {response.status} - {error_text}")
                    logging.error(f"Отправленный payload: {payload}")
                    return None
    except Exception as e:
        logging.error(f"Ошибка при сохранении сообщения: {e}")
        return None

`);
  }

  /**
   * Шаблон middleware для логирования сообщений
   */
  getMiddlewareTemplate(): string {
    return this.getCachedTemplate('middleware', () => `async def message_logging_middleware(handler, event: types.Message, data: dict):
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
                
                async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=False if "localhost" in media_api_url or "127.0.0.1" in media_api_url else None)) as session:
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

`);
  }

  /**
   * Шаблон safe_edit_or_send функции
   */
  getSafeEditOrSendTemplate(): string {
    return this.getCachedTemplate('safe_edit_or_send', () => `async def safe_edit_or_send(cbq, text, node_id=None, is_auto_transition=False, **kwargs):
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
    
    return result

`);
  }

  /**
   * Шаблон утилитарных функций
   */
  getUtilityFunctionsTemplate(): string {
    return this.getCachedTemplate('utility_functions', () => `async def is_admin(user_id: int) -> bool:
    """Проверяет, является ли пользователь администратором"""
    return user_id in ADMIN_IDS

async def is_private_chat(message: types.Message) -> bool:
    """Проверяет, является ли чат приватным"""
    return message.chat.type == "private"

def format_user_info(user: types.User) -> str:
    """Форматирует информацию о пользователе"""
    name = user.full_name or user.username or f"ID: {user.id}"
    return f"{name} (@{user.username})" if user.username else name

def escape_markdown(text: str) -> str:
    """Экранирует специальные символы для Markdown"""
    escape_chars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!']
    for char in escape_chars:
        text = text.replace(char, f'\\{char}')
    return text

`);
  }
}

/**
 * Глобальный экземпляр шаблонов Python
 */
export const pythonTemplates = new PythonTemplates();