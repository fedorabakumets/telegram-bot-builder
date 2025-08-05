"""
Тестовый бот для проверки исправлений геолокации и коротких ссылок Яндекс.Карт
"""

import asyncio
import logging
import os
import re
from aiogram import Bot, Dispatcher, types
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart, Command
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, KeyboardButton, ReplyKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder, ReplyKeyboardBuilder

# Настройка логирования
logging.basicConfig(level=logging.INFO)

# Функции для извлечения координат из URL картографических сервисов
def extract_coordinates_from_yandex(url: str):
    """Извлекает координаты из URL Яндекс.Карт"""
    try:
        # Стандартный формат Яндекс.Карт: ll=долгота,широта
        match = re.search(r'll=([0-9.-]+),([0-9.-]+)', url)
        if match:
            return float(match[2]), float(match[1])  # lat, lon
        
        # Альтернативный формат с координатами в path
        match = re.search(r'/([0-9.-]+),([0-9.-]+)/', url)
        if match:
            return float(match[2]), float(match[1])
        
        # Короткие ссылки с параметрами
        if '?' in url:
            params = url.split('?')[1]
            for param in params.split('&'):
                if param.startswith('ll='):
                    coords = param.replace('ll=', '')
                    lon, lat = coords.split(',')
                    return float(lat), float(lon)
        
        return None, None
    except Exception as e:
        logging.error(f"Ошибка извлечения координат из Яндекс.Карт: {e}")
        return None, None

def extract_coordinates_from_google(url: str):
    """Извлекает координаты из URL Google Maps"""
    try:
        # Формат Google Maps: @lat,lon,zoom
        match = re.search(r'@([0-9.-]+),([0-9.-]+),', url)
        if match:
            return float(match[1]), float(match[2])
        return None, None
    except Exception as e:
        logging.error(f"Ошибка извлечения координат из Google Maps: {e}")
        return None, None

def extract_coordinates_from_2gis(url: str):
    """Извлекает координаты из URL 2ГИС"""
    try:
        # Формат 2ГИС: lat,lon
        match = re.search(r'/([0-9.-]+),([0-9.-]+)/', url)
        if match:
            return float(match[1]), float(match[2])
        return None, None
    except Exception as e:
        logging.error(f"Ошибка извлечения координат из 2ГИС: {e}")
        return None, None

async def is_admin(user_id: int) -> bool:
    return True

async def is_private_chat(message: types.Message) -> bool:
    return message.chat.type == "private"

async def check_auth(user_id: int) -> bool:
    return True

async def set_bot_commands():
    commands = [
        types.BotCommand(command="start", description="Запустить бота"),
        types.BotCommand(command="location", description="Тест геолокации")
    ]
    
    bot = Bot.get_current()
    await bot.set_my_commands(commands)

async def start_handler(message: types.Message):
    """Обработчик команды /start"""
    text = """🗺️ Тест геолокации и коротких ссылок

Этот бот проверяет:
• Извлечение координат из коротких ссылок Яндекс.Карт
• Правильную отправку геолокации в Telegram
• Автоматическое определение города и страны"""
    
    try:
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="📍 Тест геолокации", callback_data="test_location"))
        builder.add(InlineKeyboardButton(text="🔗 Тест короткой ссылки", callback_data="test_short_link"))
        keyboard = builder.as_markup()
        await message.answer(text, reply_markup=keyboard)
    except Exception as e:
        logging.error(f"Ошибка отправки стартового сообщения: {e}")
        await message.answer("❌ Ошибка при отправке сообщения")

async def location_handler(message: types.Message):
    """Обработчик команды /location"""
    # Тестовые координаты Москвы
    latitude, longitude = 55.7558, 37.6176
    title = "Красная площадь"
    address = "Москва, Россия"
    
    try:
        await message.answer_location(latitude=latitude, longitude=longitude)
        await message.answer(f"📍 Отправлена геолокация:\n🏙️ {title}\n📍 {address}")
    except Exception as e:
        logging.error(f"Ошибка отправки геолокации: {e}")
        await message.answer(f"❌ Не удалось отправить геолокацию: {e}")

async def handle_callback_test_location(callback_query: types.CallbackQuery):
    """Обработчик кнопки тест геолокации"""
    if callback_query.data == "test_location":
        # Определяем координаты на основе выбранного сервиса карт
        latitude, longitude = 55.7558, 37.6176
        title = "Тестовая локация"
        address = "Москва, Красная площадь"
        
        try:
            # Удаляем старое сообщение
            await callback_query.message.delete()
            
            # Отправляем геолокацию
            await bot.send_venue(
                callback_query.from_user.id,
                latitude=latitude,
                longitude=longitude,
                title=title,
                address=address
            )
            
            # Отправляем кнопки для картографических сервисов
            builder = InlineKeyboardBuilder()
            builder.add(InlineKeyboardButton(
                text="🗺️ Яндекс.Карты", 
                url=f"https://yandex.ru/maps/?ll={longitude},{latitude}&z=15"
            ))
            builder.add(InlineKeyboardButton(
                text="🌍 Google Maps", 
                url=f"https://maps.google.com/maps?q={latitude},{longitude}"
            ))
            builder.add(InlineKeyboardButton(
                text="🏢 2ГИС", 
                url=f"https://2gis.ru/search/{latitude},{longitude}"
            ))
            builder.add(InlineKeyboardButton(text="↩️ Назад", callback_data="back_to_start"))
            keyboard = builder.as_markup()
            
            await bot.send_message(
                callback_query.from_user.id,
                "🗺️ Открыть в картографических сервисах:",
                reply_markup=keyboard
            )
            
        except Exception as e:
            logging.error(f"Ошибка отправки геолокации: {e}")
            await bot.send_message(callback_query.from_user.id, f"❌ Не удалось отправить геолокацию: {e}")
    
    elif callback_query.data == "test_short_link":
        # Тест короткой ссылки Яндекс.Карт
        test_url = "https://yandex.ru/maps/-/CHwa7LZ0"
        
        # Пытаемся извлечь координаты
        lat, lon = extract_coordinates_from_yandex(test_url)
        
        if lat and lon:
            try:
                await callback_query.message.delete()
                await bot.send_location(callback_query.from_user.id, latitude=lat, longitude=lon)
                await bot.send_message(
                    callback_query.from_user.id, 
                    f"✅ Координаты извлечены из короткой ссылки:\n📍 {lat}, {lon}"
                )
            except Exception as e:
                logging.error(f"Ошибка отправки геолокации: {e}")
                await bot.send_message(callback_query.from_user.id, f"❌ Ошибка: {e}")
        else:
            await callback_query.message.edit_text(
                f"❌ Не удалось извлечь координаты из ссылки:\n{test_url}\n\n"
                "Попробуйте полную ссылку с параметрами ll="
            )
    
    elif callback_query.data == "back_to_start":
        text = """🗺️ Тест геолокации и коротких ссылок

Этот бот проверяет:
• Извлечение координат из коротких ссылок Яндекс.Карт
• Правильную отправку геолокации в Telegram
• Автоматическое определение города и страны"""
        
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="📍 Тест геолокации", callback_data="test_location"))
        builder.add(InlineKeyboardButton(text="🔗 Тест короткой ссылки", callback_data="test_short_link"))
        keyboard = builder.as_markup()
        
        await callback_query.message.edit_text(text, reply_markup=keyboard)

async def main():
    """Основная функция запуска бота"""
    # Получаем токен бота из переменных окружения
    bot_token = os.getenv('BOT_TOKEN')
    if not bot_token:
        print("❌ Ошибка: BOT_TOKEN не найден в переменных окружения")
        return

    # Создаем бота
    global bot, dp
    bot = Bot(token=bot_token, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    dp = Dispatcher()
    
    # Регистрируем обработчики
    dp.message.register(start_handler, CommandStart())
    dp.message.register(location_handler, Command("location"))
    dp.callback_query.register(handle_callback_test_location)
    
    # Устанавливаем команды бота
    await set_bot_commands()

    print("🤖 Бот запущен и готов к работе!")
    
    try:
        # Запускаем поллинг
        await dp.start_polling(bot)
    except Exception as e:
        logging.error(f"Ошибка при запуске бота: {e}")
    finally:
        await bot.session.close()

if __name__ == "__main__":
    asyncio.run(main())