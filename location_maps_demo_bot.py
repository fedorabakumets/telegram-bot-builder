"""
Демо картографических сервисов - Telegram Bot
Сгенерировано с помощью TelegramBot Builder
"""

import asyncio
import logging
import os
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, BotCommand, ReplyKeyboardRemove, URLInputFile, FSInputFile
from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder
from aiogram.enums import ParseMode

# Токен вашего бота (получите у @BotFather)
BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"

# Настройка логирования
logging.basicConfig(level=logging.INFO)

# Создание бота и диспетчера
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# Список администраторов (добавьте свой Telegram ID)
ADMIN_IDS = [123456789]  # Замените на реальные ID администраторов

# Хранилище пользователей (в реальном боте используйте базу данных)
user_data = {}


# Утилитарные функции
async def is_admin(user_id: int) -> bool:
    return user_id in ADMIN_IDS

async def is_private_chat(message: types.Message) -> bool:
    return message.chat.type == "private"

async def check_auth(user_id: int) -> bool:
    # Здесь можно добавить логику проверки авторизации
    return user_id in user_data

def is_local_file(url: str) -> bool:
    """Проверяет, является ли URL локальным загруженным файлом"""
    return url.startswith("/uploads/") or url.startswith("uploads/")

def get_local_file_path(url: str) -> str:
    """Получает локальный путь к файлу из URL"""
    if url.startswith("/"):
        return url[1:]  # Убираем ведущий слеш
    return url

def extract_coordinates_from_yandex(url: str) -> tuple:
    """Извлекает координаты из ссылки Яндекс.Карт"""
    import re
    # Ищем координаты в формате ll=longitude,latitude
    match = re.search(r"ll=([\d.-]+),([\d.-]+)", url)
    if match:
        return float(match.group(2)), float(match.group(1))  # lat, lon
    # Ищем координаты в формате /longitude,latitude/
    match = re.search(r"/([\d.-]+),([\d.-]+)/", url)
    if match:
        return float(match.group(2)), float(match.group(1))  # lat, lon
    return None, None

def extract_coordinates_from_google(url: str) -> tuple:
    """Извлекает координаты из ссылки Google Maps"""
    import re
    # Ищем координаты в формате @latitude,longitude
    match = re.search(r"@([\d.-]+),([\d.-]+)", url)
    if match:
        return float(match.group(1)), float(match.group(2))  # lat, lon
    # Ищем координаты в формате /latitude,longitude/
    match = re.search(r"/([\d.-]+),([\d.-]+)/", url)
    if match:
        return float(match.group(1)), float(match.group(2))  # lat, lon
    return None, None

def extract_coordinates_from_2gis(url: str) -> tuple:
    """Извлекает координаты из ссылки 2ГИС"""
    import re
    # Ищем координаты в различных форматах 2ГИС
    # Формат: center/longitude,latitude
    match = re.search(r"center/([\d.-]+),([\d.-]+)", url)
    if match:
        return float(match.group(2)), float(match.group(1))  # lat, lon
    # Формат: /longitude,latitude/
    match = re.search(r"/([\d.-]+),([\d.-]+)/", url)
    if match:
        return float(match.group(2)), float(match.group(1))  # lat, lon
    return None, None

def generate_map_urls(latitude: float, longitude: float, title: str = "") -> dict:
    """Генерирует ссылки на различные картографические сервисы"""
    import urllib.parse
    
    encoded_title = urllib.parse.quote(title) if title else ""
    
    return {
        "yandex": f"https://yandex.ru/maps/?ll={longitude},{latitude}&z=15&l=map&pt={longitude},{latitude}",
        "google": f"https://maps.google.com/?q={latitude},{longitude}",
        "2gis": f"https://2gis.ru/geo/{longitude},{latitude}",
        "openstreetmap": f"https://www.openstreetmap.org/?mlat={latitude}&mlon={longitude}&zoom=15"
    }


@dp.message(CommandStart())
async def start_handler(message: types.Message):

    # Регистрируем пользователя в системе
    user_data[message.from_user.id] = {
        "username": message.from_user.username,
        "first_name": message.from_user.first_name,
        "last_name": message.from_user.last_name,
        "registered_at": message.date
    }

    text = """🗺️ Демонстрация геолокации с картографическими сервисами

Выберите тип геолокации:"""
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🟡 Яндекс Карты", callback_data="yandex-location"))
    builder.add(InlineKeyboardButton(text="🔴 Google Maps", callback_data="google-location"))
    builder.add(InlineKeyboardButton(text="🟢 2ГИС", callback_data="gis-location"))
    builder.add(InlineKeyboardButton(text="📍 Пользовательские координаты", callback_data="custom-location"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

# Обработчик геолокации для узла yandex-location

# Обработчик геолокации для узла google-location

# Обработчик геолокации для узла gis-location

# Обработчик геолокации для узла custom-location

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "yandex-location")
async def handle_callback_yandex_location(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Определяем координаты на основе выбранного сервиса карт
    yandex_url = "https://yandex.ru/maps/?ll=37.617644,55.755826&z=17&l=map"
    extracted_lat, extracted_lon = extract_coordinates_from_yandex(yandex_url)
    if extracted_lat and extracted_lon:
        latitude, longitude = extracted_lat, extracted_lon
    else:
        latitude, longitude = 55.7558, 37.6176  # Fallback координаты
    title = "Красная площадь"
    address = "Красная площадь, Москва, Россия"
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
        
        # Генерируем ссылки на картографические сервисы
        map_urls = generate_map_urls(latitude, longitude, title)
        
        # Создаем кнопки для различных карт
        map_builder = InlineKeyboardBuilder()
        map_builder.add(InlineKeyboardButton(text="🗺️ Яндекс Карты", url=map_urls["yandex"]))
        map_builder.add(InlineKeyboardButton(text="🌍 Google Maps", url=map_urls["google"]))
        map_builder.add(InlineKeyboardButton(text="📍 2ГИС", url=map_urls["2gis"]))
        map_builder.add(InlineKeyboardButton(text="🌐 OpenStreetMap", url=map_urls["openstreetmap"]))
        # Добавляем кнопки для построения маршрута
        map_builder.add(InlineKeyboardButton(text="🧭 Маршрут (Яндекс)", url=f"https://yandex.ru/maps/?rtext=~{latitude},{longitude}"))
        map_builder.add(InlineKeyboardButton(text="🚗 Маршрут (Google)", url=f"https://maps.google.com/maps/dir//{latitude},{longitude}"))
        map_builder.adjust(2)  # Размещаем кнопки в 2 столбца
        map_keyboard = map_builder.as_markup()
        
        await bot.send_message(
            callback_query.from_user.id,
            "🗺️ Откройте местоположение в удобном картографическом сервисе или постройте маршрут:",
            reply_markup=map_keyboard
        )
        
        # Отправляем дополнительные кнопки
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="🔙 Назад в меню", callback_data="start-1"))
        keyboard = builder.as_markup()
        await bot.send_message(callback_query.from_user.id, "Выберите действие:", reply_markup=keyboard)
    except Exception as e:
        logging.error(f"Ошибка отправки местоположения: {e}")
        await bot.send_message(callback_query.from_user.id, f"❌ Не удалось отправить местоположение")

@dp.callback_query(lambda c: c.data == "google-location")
async def handle_callback_google_location(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Определяем координаты на основе выбранного сервиса карт
    google_url = "https://maps.google.com/?q=48.8584,2.2945"
    extracted_lat, extracted_lon = extract_coordinates_from_google(google_url)
    if extracted_lat and extracted_lon:
        latitude, longitude = extracted_lat, extracted_lon
    else:
        latitude, longitude = 48.8584, 2.2945  # Fallback координаты
    title = "Эйфелева башня"
    address = "Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France"
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
        
        # Генерируем ссылки на картографические сервисы
        map_urls = generate_map_urls(latitude, longitude, title)
        
        # Создаем кнопки для различных карт
        map_builder = InlineKeyboardBuilder()
        map_builder.add(InlineKeyboardButton(text="🗺️ Яндекс Карты", url=map_urls["yandex"]))
        map_builder.add(InlineKeyboardButton(text="🌍 Google Maps", url=map_urls["google"]))
        map_builder.add(InlineKeyboardButton(text="📍 2ГИС", url=map_urls["2gis"]))
        map_builder.add(InlineKeyboardButton(text="🌐 OpenStreetMap", url=map_urls["openstreetmap"]))
        # Добавляем кнопки для построения маршрута
        map_builder.add(InlineKeyboardButton(text="🧭 Маршрут (Яндекс)", url=f"https://yandex.ru/maps/?rtext=~{latitude},{longitude}"))
        map_builder.add(InlineKeyboardButton(text="🚗 Маршрут (Google)", url=f"https://maps.google.com/maps/dir//{latitude},{longitude}"))
        map_builder.adjust(2)  # Размещаем кнопки в 2 столбца
        map_keyboard = map_builder.as_markup()
        
        await bot.send_message(
            callback_query.from_user.id,
            "🗺️ Откройте местоположение в удобном картографическом сервисе или постройте маршрут:",
            reply_markup=map_keyboard
        )
        
        # Отправляем дополнительные кнопки
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="🔙 Назад в меню", callback_data="start-1"))
        keyboard = builder.as_markup()
        await bot.send_message(callback_query.from_user.id, "Выберите действие:", reply_markup=keyboard)
    except Exception as e:
        logging.error(f"Ошибка отправки местоположения: {e}")
        await bot.send_message(callback_query.from_user.id, f"❌ Не удалось отправить местоположение")

@dp.callback_query(lambda c: c.data == "gis-location")
async def handle_callback_gis_location(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Определяем координаты на основе выбранного сервиса карт
    gis_url = "https://2gis.ru/novosibirsk/firm/1267342919"
    extracted_lat, extracted_lon = extract_coordinates_from_2gis(gis_url)
    if extracted_lat and extracted_lon:
        latitude, longitude = extracted_lat, extracted_lon
    else:
        latitude, longitude = 55.0415, 82.9346  # Fallback координаты
    title = "Новосибирский оперный театр"
    address = "Красный проспект, 36, Новосибирск, Россия"
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
        
        # Генерируем ссылки на картографические сервисы
        map_urls = generate_map_urls(latitude, longitude, title)
        
        # Создаем кнопки для различных карт
        map_builder = InlineKeyboardBuilder()
        map_builder.add(InlineKeyboardButton(text="🗺️ Яндекс Карты", url=map_urls["yandex"]))
        map_builder.add(InlineKeyboardButton(text="🌍 Google Maps", url=map_urls["google"]))
        map_builder.add(InlineKeyboardButton(text="📍 2ГИС", url=map_urls["2gis"]))
        map_builder.add(InlineKeyboardButton(text="🌐 OpenStreetMap", url=map_urls["openstreetmap"]))
        map_builder.adjust(2)  # Размещаем кнопки в 2 столбца
        map_keyboard = map_builder.as_markup()
        
        await bot.send_message(
            callback_query.from_user.id,
            "🗺️ Откройте местоположение в удобном картографическом сервисе:",
            reply_markup=map_keyboard
        )
        
        # Отправляем дополнительные кнопки
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="🔙 Назад в меню", callback_data="start-1"))
        keyboard = builder.as_markup()
        await bot.send_message(callback_query.from_user.id, "Выберите действие:", reply_markup=keyboard)
    except Exception as e:
        logging.error(f"Ошибка отправки местоположения: {e}")
        await bot.send_message(callback_query.from_user.id, f"❌ Не удалось отправить местоположение")

@dp.callback_query(lambda c: c.data == "custom-location")
async def handle_callback_custom_location(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Определяем координаты на основе выбранного сервиса карт
    latitude, longitude = 40.6892, -74.0445
    title = "Статуя Свободы"
    address = "Liberty Island, New York, NY 10004, USA"
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
        
        # Генерируем ссылки на картографические сервисы
        map_urls = generate_map_urls(latitude, longitude, title)
        
        # Создаем кнопки для различных карт
        map_builder = InlineKeyboardBuilder()
        map_builder.add(InlineKeyboardButton(text="🗺️ Яндекс Карты", url=map_urls["yandex"]))
        map_builder.add(InlineKeyboardButton(text="🌍 Google Maps", url=map_urls["google"]))
        map_builder.add(InlineKeyboardButton(text="📍 2ГИС", url=map_urls["2gis"]))
        map_builder.add(InlineKeyboardButton(text="🌐 OpenStreetMap", url=map_urls["openstreetmap"]))
        # Добавляем кнопки для построения маршрута
        map_builder.add(InlineKeyboardButton(text="🧭 Маршрут (Яндекс)", url=f"https://yandex.ru/maps/?rtext=~{latitude},{longitude}"))
        map_builder.add(InlineKeyboardButton(text="🚗 Маршрут (Google)", url=f"https://maps.google.com/maps/dir//{latitude},{longitude}"))
        map_builder.adjust(2)  # Размещаем кнопки в 2 столбца
        map_keyboard = map_builder.as_markup()
        
        await bot.send_message(
            callback_query.from_user.id,
            "🗺️ Откройте местоположение в удобном картографическом сервисе или постройте маршрут:",
            reply_markup=map_keyboard
        )
        
        # Отправляем дополнительные кнопки
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="🔙 Назад в меню", callback_data="start-1"))
        keyboard = builder.as_markup()
        await bot.send_message(callback_query.from_user.id, "Выберите действие:", reply_markup=keyboard)
    except Exception as e:
        logging.error(f"Ошибка отправки местоположения: {e}")
        await bot.send_message(callback_query.from_user.id, f"❌ Не удалось отправить местоположение")

@dp.callback_query(lambda c: c.data == "start-1")
async def handle_callback_start_1(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🗺️ Демонстрация геолокации с картографическими сервисами

Выберите тип геолокации:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🟡 Яндекс Карты", callback_data="yandex-location"))
    builder.add(InlineKeyboardButton(text="🔴 Google Maps", callback_data="google-location"))
    builder.add(InlineKeyboardButton(text="🟢 2ГИС", callback_data="gis-location"))
    builder.add(InlineKeyboardButton(text="📍 Пользовательские координаты", callback_data="custom-location"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)


# Запуск бота
async def main():
    print("Бот запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
