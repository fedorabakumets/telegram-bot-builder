"""
Мой первый бот - Telegram Bot
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
import asyncpg
from datetime import datetime
import json

# Токен вашего бота (получите у @BotFather)
BOT_TOKEN = "8082906513:AAEkTEm-HYvpRkI8ZuPuWmx3f25zi5tm1OE"

# Настройка логирования
logging.basicConfig(level=logging.INFO)

# Создание бота и диспетчера
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# Список администраторов (добавьте свой Telegram ID)
ADMIN_IDS = [123456789]  # Замените на реальные ID администраторов

# Настройки базы данных
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/bot_db")

# Пул соединений с базой данных
db_pool = None

# Хранилище пользователей (резервное для случаев без БД)
user_data = {}


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
        logging.info("✅ База данных инициализирована")
    except Exception as e:
        logging.warning(f"⚠️ Не удалось подключиться к БД: {e}. Используем локальное хранилище.")
        db_pool = None

async def save_user_to_db(user_id: int, username: str = None, first_name: str = None, last_name: str = None):
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
                return dict(row)
        return None
    except Exception as e:
        logging.error(f"Ошибка получения пользователя из БД: {e}")
        return None

async def update_user_data_in_db(user_id: int, data_key: str, data_value):
    """Обновляет пользовательские данные в базе данных"""
    if not db_pool:
        return False
    try:
        async with db_pool.acquire() as conn:
            await conn.execute("""
                UPDATE bot_users 
                SET user_data = user_data || $2::jsonb,
                    last_interaction = NOW()
                WHERE user_id = $1
            """, user_id, json.dumps({data_key: data_value}))
        return True
    except Exception as e:
        logging.error(f"Ошибка обновления данных пользователя: {e}")
        return False


# Утилитарные функции
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
    user_id = message.from_user.id
    username = message.from_user.username
    first_name = message.from_user.first_name
    last_name = message.from_user.last_name
    
    # Сохраняем пользователя в базу данных
    saved_to_db = await save_user_to_db(user_id, username, first_name, last_name)
    
    # Резервное сохранение в локальное хранилище
    if not saved_to_db:
        user_data[user_id] = {
            "username": username,
            "first_name": first_name,
            "last_name": last_name,
            "registered_at": message.date
        }
        logging.info(f"Пользователь {user_id} сохранен в локальное хранилище")
    else:
        logging.info(f"Пользователь {user_id} сохранен в базу данных")

    text = f"🎯 **Добро пожаловать в систему сбора данных!**\n\nЭтот бот демонстрирует все возможности сбора пользовательского ввода:\n\n• 📝 Текстовый ввод\n• 🔘 Кнопочные ответы\n• ☑️ Множественный выбор\n• 📱 Медиа файлы\n• 📊 Структурированные данные\n\nНачнем сбор ваших данных?"
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🚀 Начать сбор данных", callback_data="name-input"))
    builder.add(InlineKeyboardButton(text="⏭️ Пропустить все", callback_data="final-results"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "name-input")
async def handle_callback_name_input(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Удаляем старое сообщение
    await callback_query.message.delete()
    
    text = f"👤 **Шаг 1: Персональные данные**\n\n<b>Как вас зовут?</b>\n\nВведите ваше имя (от 2 до 50 символов):"
    placeholder_text = "Введите ваше имя..."
    text += f"\n\n💡 {placeholder_text}"
    await bot.send_message(callback_query.from_user.id, text)
    
    # Инициализируем пользовательские данные если их нет
    if callback_query.from_user.id not in user_data:
        user_data[callback_query.from_user.id] = {}
    
    # Настраиваем ожидание ввода
    user_data[callback_query.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "variable": "user_name",
        "validation": "",
        "min_length": 2,
        "max_length": 50,
        "timeout": 60,
        "required": True,
        "allow_skip": False,
        "save_to_database": True,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": "Спасибо за ваш ответ!",
        "prompt": "👤 **Шаг 1: Персональные данные**\n\n<b>Как вас зовут?</b>\n\nВведите ваше имя (от 2 до 50 символов):",
        "node_id": "name-input",
        "next_node_id": "age-buttons"
    }

@dp.callback_query(lambda c: c.data == "final-results")
async def handle_callback_final_results(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🎉 **Сбор данных завершен!**

<b>Спасибо за участие!</b>

Вы успешно продемонстрировали все типы сбора пользовательского ввода:

✅ <b>Текстовый ввод</b> - имя и комментарии
✅ <b>Одиночный выбор</b> - возраст и рейтинг
✅ <b>Множественный выбор</b> - интересы
✅ <b>Валидация данных</b> - проверка email/телефона
✅ <b>Обработка ошибок</b> - повторы и пропуски

Все данные сохранены в базе данных и готовы к анализу."""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔄 Пройти снова", callback_data="start-1"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "age-buttons")
async def handle_callback_age_buttons(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Удаляем старое сообщение
    await callback_query.message.delete()
    
    text = f"🎂 **Шаг 2: Возрастная группа**\n\n<b>Выберите вашу возрастную группу:</b>\n\nИспользуйте кнопки для выбора:"
    
    # Создаем кнопки для выбора ответа
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="18-25 лет", callback_data="response_age-buttons_0"))
    builder.add(InlineKeyboardButton(text="26-35 лет", callback_data="response_age-buttons_1"))
    builder.add(InlineKeyboardButton(text="36-45 лет", callback_data="response_age-buttons_2"))
    builder.add(InlineKeyboardButton(text="46-55 лет", callback_data="response_age-buttons_3"))
    builder.add(InlineKeyboardButton(text="55+ лет", callback_data="response_age-buttons_4"))
    keyboard = builder.as_markup()
    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)
    
    # Инициализируем пользовательские данные если их нет
    if callback_query.from_user.id not in user_data:
        user_data[callback_query.from_user.id] = {}
    
    # Сохраняем настройки для обработки ответа
    user_data[callback_query.from_user.id]["button_response_config"] = {
        "node_id": "age-buttons",
        "variable": "user_age_group",
        "save_to_database": True,
        "success_message": "Спасибо за ваш ответ!",
        "allow_multiple": False,
        "next_node_id": "interests-multiple",
        "options": [
            {"index": 0, "text": "18-25 лет", "value": "18-25"},
            {"index": 1, "text": "26-35 лет", "value": "26-35"},
            {"index": 2, "text": "36-45 лет", "value": "36-45"},
            {"index": 3, "text": "46-55 лет", "value": "46-55"},
            {"index": 4, "text": "55+ лет", "value": "55+"},
        ],
        "selected": []
    }

@dp.callback_query(lambda c: c.data == "interests-multiple")
async def handle_callback_interests_multiple(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Удаляем старое сообщение
    await callback_query.message.delete()
    
    text = f"🎯 **Шаг 3: Интересы (множественный выбор)**\n\n<b>Выберите ваши интересы (можно несколько):</b>\n\nВыберите все подходящие варианты и нажмите \"Готово\":"
    
    # Создаем кнопки для выбора ответа
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="💻 Технологии", callback_data="response_interests-multiple_0"))
    builder.add(InlineKeyboardButton(text="⚽ Спорт", callback_data="response_interests-multiple_1"))
    builder.add(InlineKeyboardButton(text="🎵 Музыка", callback_data="response_interests-multiple_2"))
    builder.add(InlineKeyboardButton(text="✈️ Путешествия", callback_data="response_interests-multiple_3"))
    builder.add(InlineKeyboardButton(text="👨‍🍳 Кулинария", callback_data="response_interests-multiple_4"))
    builder.add(InlineKeyboardButton(text="📚 Книги", callback_data="response_interests-multiple_5"))
    builder.add(InlineKeyboardButton(text="✅ Готово", callback_data="response_interests-multiple_6"))
    keyboard = builder.as_markup()
    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)
    
    # Инициализируем пользовательские данные если их нет
    if callback_query.from_user.id not in user_data:
        user_data[callback_query.from_user.id] = {}
    
    # Сохраняем настройки для обработки ответа
    user_data[callback_query.from_user.id]["button_response_config"] = {
        "node_id": "interests-multiple",
        "variable": "user_interests",
        "save_to_database": True,
        "success_message": "Спасибо за ваш ответ!",
        "allow_multiple": True,
        "next_node_id": "contact-input",
        "options": [
            {"index": 0, "text": "💻 Технологии", "value": "technology"},
            {"index": 1, "text": "⚽ Спорт", "value": "sport"},
            {"index": 2, "text": "🎵 Музыка", "value": "music"},
            {"index": 3, "text": "✈️ Путешествия", "value": "travel"},
            {"index": 4, "text": "👨‍🍳 Кулинария", "value": "cooking"},
            {"index": 5, "text": "📚 Книги", "value": "books"},
            {"index": 6, "text": "✅ Готово", "value": "done"},
        ],
        "selected": []
    }

@dp.callback_query(lambda c: c.data == "contact-input")
async def handle_callback_contact_input(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Удаляем старое сообщение
    await callback_query.message.delete()
    
    text = f"📱 **Шаг 4: Контактная информация**\n\n<b>Введите ваш email или телефон:</b>\n\nМы используем эти данные для связи с вами:"
    placeholder_text = "example@email.com или +7-999-123-45-67"
    text += f"\n\n💡 {placeholder_text}"
    await bot.send_message(callback_query.from_user.id, text)
    
    # Инициализируем пользовательские данные если их нет
    if callback_query.from_user.id not in user_data:
        user_data[callback_query.from_user.id] = {}
    
    # Настраиваем ожидание ввода
    user_data[callback_query.from_user.id]["waiting_for_input"] = {
        "type": "email",
        "variable": "user_contact",
        "validation": "",
        "min_length": 5,
        "max_length": 100,
        "timeout": 60,
        "required": True,
        "allow_skip": False,
        "save_to_database": True,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": "Спасибо за ваш ответ!",
        "prompt": "📱 **Шаг 4: Контактная информация**\n\n<b>Введите ваш email или телефон:</b>\n\nМы используем эти данные для связи с вами:",
        "node_id": "contact-input",
        "next_node_id": "experience-rating"
    }

@dp.callback_query(lambda c: c.data == "experience-rating")
async def handle_callback_experience_rating(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Удаляем старое сообщение
    await callback_query.message.delete()
    
    text = f"⭐ **Шаг 5: Оценка опыта**\n\n<b>Как вы оцениваете опыт использования этого бота?</b>\n\nВыберите количество звезд:"
    
    # Создаем кнопки для выбора ответа
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="⭐ 1 звезда", callback_data="response_experience-rating_0"))
    builder.add(InlineKeyboardButton(text="⭐⭐ 2 звезды", callback_data="response_experience-rating_1"))
    builder.add(InlineKeyboardButton(text="⭐⭐⭐ 3 звезды", callback_data="response_experience-rating_2"))
    builder.add(InlineKeyboardButton(text="⭐⭐⭐⭐ 4 звезды", callback_data="response_experience-rating_3"))
    builder.add(InlineKeyboardButton(text="⭐⭐⭐⭐⭐ 5 звезд", callback_data="response_experience-rating_4"))
    keyboard = builder.as_markup()
    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)
    
    # Инициализируем пользовательские данные если их нет
    if callback_query.from_user.id not in user_data:
        user_data[callback_query.from_user.id] = {}
    
    # Сохраняем настройки для обработки ответа
    user_data[callback_query.from_user.id]["button_response_config"] = {
        "node_id": "experience-rating",
        "variable": "user_rating",
        "save_to_database": True,
        "success_message": "Спасибо за ваш ответ!",
        "allow_multiple": False,
        "next_node_id": "final-comment",
        "options": [
            {"index": 0, "text": "⭐ 1 звезда", "value": "1"},
            {"index": 1, "text": "⭐⭐ 2 звезды", "value": "2"},
            {"index": 2, "text": "⭐⭐⭐ 3 звезды", "value": "3"},
            {"index": 3, "text": "⭐⭐⭐⭐ 4 звезды", "value": "4"},
            {"index": 4, "text": "⭐⭐⭐⭐⭐ 5 звезд", "value": "5"},
        ],
        "selected": []
    }

@dp.callback_query(lambda c: c.data == "final-comment")
async def handle_callback_final_comment(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Удаляем старое сообщение
    await callback_query.message.delete()
    
    text = f"💭 **Шаг 6: Заключительный комментарий**\n\n<b>Есть ли у вас дополнительные комментарии или предложения?</b>\n\nНапишите ваше мнение (необязательно):"
    placeholder_text = "Ваши комментарии и предложения..."
    text += f"\n\n💡 {placeholder_text}"
    await bot.send_message(callback_query.from_user.id, text)
    
    # Инициализируем пользовательские данные если их нет
    if callback_query.from_user.id not in user_data:
        user_data[callback_query.from_user.id] = {}
    
    # Настраиваем ожидание ввода
    user_data[callback_query.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "variable": "user_comment",
        "validation": "",
        "min_length": 0,
        "max_length": 1000,
        "timeout": 60,
        "required": True,
        "allow_skip": False,
        "save_to_database": True,
        "retry_message": "Пожалуйста, попробуйте еще раз.",
        "success_message": "Спасибо за ваш ответ!",
        "prompt": "💭 **Шаг 6: Заключительный комментарий**\n\n<b>Есть ли у вас дополнительные комментарии или предложения?</b>\n\nНапишите ваше мнение (необязательно):",
        "node_id": "final-comment",
        "next_node_id": "final-results"
    }

@dp.callback_query(lambda c: c.data == "start-1")
async def handle_callback_start_1(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🎯 **Добро пожаловать в систему сбора данных!**

Этот бот демонстрирует все возможности сбора пользовательского ввода:

• 📝 Текстовый ввод
• 🔘 Кнопочные ответы
• ☑️ Множественный выбор
• 📱 Медиа файлы
• 📊 Структурированные данные

Начнем сбор ваших данных?"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🚀 Начать сбор данных", callback_data="name-input"))
    builder.add(InlineKeyboardButton(text="⏭️ Пропустить все", callback_data="final-results"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

# Обработчики кнопочных ответов для сбора пользовательского ввода

@dp.callback_query(F.data == "response_age-buttons_0")
async def handle_response_age_buttons_0(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "18-25"
    selected_text = "18-25 лет"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-1":
                            await handle_callback_start_1(callback_query)
                        elif next_node_id == "name-input":
                            await handle_callback_name_input(callback_query)
                        elif next_node_id == "name-error":
                            await handle_callback_name_error(callback_query)
                        elif next_node_id == "age-buttons":
                            await handle_callback_age_buttons(callback_query)
                        elif next_node_id == "age-error":
                            await handle_callback_age_error(callback_query)
                        elif next_node_id == "interests-multiple":
                            await handle_callback_interests_multiple(callback_query)
                        elif next_node_id == "interests-error":
                            await handle_callback_interests_error(callback_query)
                        elif next_node_id == "contact-input":
                            await handle_callback_contact_input(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "experience-rating":
                            await handle_callback_experience_rating(callback_query)
                        elif next_node_id == "rating-error":
                            await handle_callback_rating_error(callback_query)
                        elif next_node_id == "final-comment":
                            await handle_callback_final_comment(callback_query)
                        elif next_node_id == "comment-error":
                            await handle_callback_comment_error(callback_query)
                        elif next_node_id == "final-results":
                            await handle_callback_final_results(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
    import datetime
    timestamp = datetime.datetime.now().isoformat()
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-1":
                await handle_callback_start_1(callback_query)
            elif next_node_id == "name-input":
                await handle_callback_name_input(callback_query)
            elif next_node_id == "name-error":
                await handle_callback_name_error(callback_query)
            elif next_node_id == "age-buttons":
                await handle_callback_age_buttons(callback_query)
            elif next_node_id == "age-error":
                await handle_callback_age_error(callback_query)
            elif next_node_id == "interests-multiple":
                await handle_callback_interests_multiple(callback_query)
            elif next_node_id == "interests-error":
                await handle_callback_interests_error(callback_query)
            elif next_node_id == "contact-input":
                await handle_callback_contact_input(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "experience-rating":
                await handle_callback_experience_rating(callback_query)
            elif next_node_id == "rating-error":
                await handle_callback_rating_error(callback_query)
            elif next_node_id == "final-comment":
                await handle_callback_final_comment(callback_query)
            elif next_node_id == "comment-error":
                await handle_callback_comment_error(callback_query)
            elif next_node_id == "final-results":
                await handle_callback_final_results(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_age-buttons_1")
async def handle_response_age_buttons_1(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "26-35"
    selected_text = "26-35 лет"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-1":
                            await handle_callback_start_1(callback_query)
                        elif next_node_id == "name-input":
                            await handle_callback_name_input(callback_query)
                        elif next_node_id == "name-error":
                            await handle_callback_name_error(callback_query)
                        elif next_node_id == "age-buttons":
                            await handle_callback_age_buttons(callback_query)
                        elif next_node_id == "age-error":
                            await handle_callback_age_error(callback_query)
                        elif next_node_id == "interests-multiple":
                            await handle_callback_interests_multiple(callback_query)
                        elif next_node_id == "interests-error":
                            await handle_callback_interests_error(callback_query)
                        elif next_node_id == "contact-input":
                            await handle_callback_contact_input(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "experience-rating":
                            await handle_callback_experience_rating(callback_query)
                        elif next_node_id == "rating-error":
                            await handle_callback_rating_error(callback_query)
                        elif next_node_id == "final-comment":
                            await handle_callback_final_comment(callback_query)
                        elif next_node_id == "comment-error":
                            await handle_callback_comment_error(callback_query)
                        elif next_node_id == "final-results":
                            await handle_callback_final_results(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
    import datetime
    timestamp = datetime.datetime.now().isoformat()
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-1":
                await handle_callback_start_1(callback_query)
            elif next_node_id == "name-input":
                await handle_callback_name_input(callback_query)
            elif next_node_id == "name-error":
                await handle_callback_name_error(callback_query)
            elif next_node_id == "age-buttons":
                await handle_callback_age_buttons(callback_query)
            elif next_node_id == "age-error":
                await handle_callback_age_error(callback_query)
            elif next_node_id == "interests-multiple":
                await handle_callback_interests_multiple(callback_query)
            elif next_node_id == "interests-error":
                await handle_callback_interests_error(callback_query)
            elif next_node_id == "contact-input":
                await handle_callback_contact_input(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "experience-rating":
                await handle_callback_experience_rating(callback_query)
            elif next_node_id == "rating-error":
                await handle_callback_rating_error(callback_query)
            elif next_node_id == "final-comment":
                await handle_callback_final_comment(callback_query)
            elif next_node_id == "comment-error":
                await handle_callback_comment_error(callback_query)
            elif next_node_id == "final-results":
                await handle_callback_final_results(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_age-buttons_2")
async def handle_response_age_buttons_2(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "36-45"
    selected_text = "36-45 лет"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-1":
                            await handle_callback_start_1(callback_query)
                        elif next_node_id == "name-input":
                            await handle_callback_name_input(callback_query)
                        elif next_node_id == "name-error":
                            await handle_callback_name_error(callback_query)
                        elif next_node_id == "age-buttons":
                            await handle_callback_age_buttons(callback_query)
                        elif next_node_id == "age-error":
                            await handle_callback_age_error(callback_query)
                        elif next_node_id == "interests-multiple":
                            await handle_callback_interests_multiple(callback_query)
                        elif next_node_id == "interests-error":
                            await handle_callback_interests_error(callback_query)
                        elif next_node_id == "contact-input":
                            await handle_callback_contact_input(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "experience-rating":
                            await handle_callback_experience_rating(callback_query)
                        elif next_node_id == "rating-error":
                            await handle_callback_rating_error(callback_query)
                        elif next_node_id == "final-comment":
                            await handle_callback_final_comment(callback_query)
                        elif next_node_id == "comment-error":
                            await handle_callback_comment_error(callback_query)
                        elif next_node_id == "final-results":
                            await handle_callback_final_results(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
    import datetime
    timestamp = datetime.datetime.now().isoformat()
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-1":
                await handle_callback_start_1(callback_query)
            elif next_node_id == "name-input":
                await handle_callback_name_input(callback_query)
            elif next_node_id == "name-error":
                await handle_callback_name_error(callback_query)
            elif next_node_id == "age-buttons":
                await handle_callback_age_buttons(callback_query)
            elif next_node_id == "age-error":
                await handle_callback_age_error(callback_query)
            elif next_node_id == "interests-multiple":
                await handle_callback_interests_multiple(callback_query)
            elif next_node_id == "interests-error":
                await handle_callback_interests_error(callback_query)
            elif next_node_id == "contact-input":
                await handle_callback_contact_input(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "experience-rating":
                await handle_callback_experience_rating(callback_query)
            elif next_node_id == "rating-error":
                await handle_callback_rating_error(callback_query)
            elif next_node_id == "final-comment":
                await handle_callback_final_comment(callback_query)
            elif next_node_id == "comment-error":
                await handle_callback_comment_error(callback_query)
            elif next_node_id == "final-results":
                await handle_callback_final_results(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_age-buttons_3")
async def handle_response_age_buttons_3(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "46-55"
    selected_text = "46-55 лет"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-1":
                            await handle_callback_start_1(callback_query)
                        elif next_node_id == "name-input":
                            await handle_callback_name_input(callback_query)
                        elif next_node_id == "name-error":
                            await handle_callback_name_error(callback_query)
                        elif next_node_id == "age-buttons":
                            await handle_callback_age_buttons(callback_query)
                        elif next_node_id == "age-error":
                            await handle_callback_age_error(callback_query)
                        elif next_node_id == "interests-multiple":
                            await handle_callback_interests_multiple(callback_query)
                        elif next_node_id == "interests-error":
                            await handle_callback_interests_error(callback_query)
                        elif next_node_id == "contact-input":
                            await handle_callback_contact_input(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "experience-rating":
                            await handle_callback_experience_rating(callback_query)
                        elif next_node_id == "rating-error":
                            await handle_callback_rating_error(callback_query)
                        elif next_node_id == "final-comment":
                            await handle_callback_final_comment(callback_query)
                        elif next_node_id == "comment-error":
                            await handle_callback_comment_error(callback_query)
                        elif next_node_id == "final-results":
                            await handle_callback_final_results(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
    import datetime
    timestamp = datetime.datetime.now().isoformat()
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-1":
                await handle_callback_start_1(callback_query)
            elif next_node_id == "name-input":
                await handle_callback_name_input(callback_query)
            elif next_node_id == "name-error":
                await handle_callback_name_error(callback_query)
            elif next_node_id == "age-buttons":
                await handle_callback_age_buttons(callback_query)
            elif next_node_id == "age-error":
                await handle_callback_age_error(callback_query)
            elif next_node_id == "interests-multiple":
                await handle_callback_interests_multiple(callback_query)
            elif next_node_id == "interests-error":
                await handle_callback_interests_error(callback_query)
            elif next_node_id == "contact-input":
                await handle_callback_contact_input(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "experience-rating":
                await handle_callback_experience_rating(callback_query)
            elif next_node_id == "rating-error":
                await handle_callback_rating_error(callback_query)
            elif next_node_id == "final-comment":
                await handle_callback_final_comment(callback_query)
            elif next_node_id == "comment-error":
                await handle_callback_comment_error(callback_query)
            elif next_node_id == "final-results":
                await handle_callback_final_results(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_age-buttons_4")
async def handle_response_age_buttons_4(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "55+"
    selected_text = "55+ лет"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-1":
                            await handle_callback_start_1(callback_query)
                        elif next_node_id == "name-input":
                            await handle_callback_name_input(callback_query)
                        elif next_node_id == "name-error":
                            await handle_callback_name_error(callback_query)
                        elif next_node_id == "age-buttons":
                            await handle_callback_age_buttons(callback_query)
                        elif next_node_id == "age-error":
                            await handle_callback_age_error(callback_query)
                        elif next_node_id == "interests-multiple":
                            await handle_callback_interests_multiple(callback_query)
                        elif next_node_id == "interests-error":
                            await handle_callback_interests_error(callback_query)
                        elif next_node_id == "contact-input":
                            await handle_callback_contact_input(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "experience-rating":
                            await handle_callback_experience_rating(callback_query)
                        elif next_node_id == "rating-error":
                            await handle_callback_rating_error(callback_query)
                        elif next_node_id == "final-comment":
                            await handle_callback_final_comment(callback_query)
                        elif next_node_id == "comment-error":
                            await handle_callback_comment_error(callback_query)
                        elif next_node_id == "final-results":
                            await handle_callback_final_results(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
    import datetime
    timestamp = datetime.datetime.now().isoformat()
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-1":
                await handle_callback_start_1(callback_query)
            elif next_node_id == "name-input":
                await handle_callback_name_input(callback_query)
            elif next_node_id == "name-error":
                await handle_callback_name_error(callback_query)
            elif next_node_id == "age-buttons":
                await handle_callback_age_buttons(callback_query)
            elif next_node_id == "age-error":
                await handle_callback_age_error(callback_query)
            elif next_node_id == "interests-multiple":
                await handle_callback_interests_multiple(callback_query)
            elif next_node_id == "interests-error":
                await handle_callback_interests_error(callback_query)
            elif next_node_id == "contact-input":
                await handle_callback_contact_input(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "experience-rating":
                await handle_callback_experience_rating(callback_query)
            elif next_node_id == "rating-error":
                await handle_callback_rating_error(callback_query)
            elif next_node_id == "final-comment":
                await handle_callback_final_comment(callback_query)
            elif next_node_id == "comment-error":
                await handle_callback_comment_error(callback_query)
            elif next_node_id == "final-results":
                await handle_callback_final_results(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_interests-multiple_0")
async def handle_response_interests_multiple_0(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "technology"
    selected_text = "💻 Технологии"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-1":
                            await handle_callback_start_1(callback_query)
                        elif next_node_id == "name-input":
                            await handle_callback_name_input(callback_query)
                        elif next_node_id == "name-error":
                            await handle_callback_name_error(callback_query)
                        elif next_node_id == "age-buttons":
                            await handle_callback_age_buttons(callback_query)
                        elif next_node_id == "age-error":
                            await handle_callback_age_error(callback_query)
                        elif next_node_id == "interests-multiple":
                            await handle_callback_interests_multiple(callback_query)
                        elif next_node_id == "interests-error":
                            await handle_callback_interests_error(callback_query)
                        elif next_node_id == "contact-input":
                            await handle_callback_contact_input(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "experience-rating":
                            await handle_callback_experience_rating(callback_query)
                        elif next_node_id == "rating-error":
                            await handle_callback_rating_error(callback_query)
                        elif next_node_id == "final-comment":
                            await handle_callback_final_comment(callback_query)
                        elif next_node_id == "comment-error":
                            await handle_callback_comment_error(callback_query)
                        elif next_node_id == "final-results":
                            await handle_callback_final_results(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
    import datetime
    timestamp = datetime.datetime.now().isoformat()
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-1":
                await handle_callback_start_1(callback_query)
            elif next_node_id == "name-input":
                await handle_callback_name_input(callback_query)
            elif next_node_id == "name-error":
                await handle_callback_name_error(callback_query)
            elif next_node_id == "age-buttons":
                await handle_callback_age_buttons(callback_query)
            elif next_node_id == "age-error":
                await handle_callback_age_error(callback_query)
            elif next_node_id == "interests-multiple":
                await handle_callback_interests_multiple(callback_query)
            elif next_node_id == "interests-error":
                await handle_callback_interests_error(callback_query)
            elif next_node_id == "contact-input":
                await handle_callback_contact_input(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "experience-rating":
                await handle_callback_experience_rating(callback_query)
            elif next_node_id == "rating-error":
                await handle_callback_rating_error(callback_query)
            elif next_node_id == "final-comment":
                await handle_callback_final_comment(callback_query)
            elif next_node_id == "comment-error":
                await handle_callback_comment_error(callback_query)
            elif next_node_id == "final-results":
                await handle_callback_final_results(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_interests-multiple_1")
async def handle_response_interests_multiple_1(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "sport"
    selected_text = "⚽ Спорт"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-1":
                            await handle_callback_start_1(callback_query)
                        elif next_node_id == "name-input":
                            await handle_callback_name_input(callback_query)
                        elif next_node_id == "name-error":
                            await handle_callback_name_error(callback_query)
                        elif next_node_id == "age-buttons":
                            await handle_callback_age_buttons(callback_query)
                        elif next_node_id == "age-error":
                            await handle_callback_age_error(callback_query)
                        elif next_node_id == "interests-multiple":
                            await handle_callback_interests_multiple(callback_query)
                        elif next_node_id == "interests-error":
                            await handle_callback_interests_error(callback_query)
                        elif next_node_id == "contact-input":
                            await handle_callback_contact_input(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "experience-rating":
                            await handle_callback_experience_rating(callback_query)
                        elif next_node_id == "rating-error":
                            await handle_callback_rating_error(callback_query)
                        elif next_node_id == "final-comment":
                            await handle_callback_final_comment(callback_query)
                        elif next_node_id == "comment-error":
                            await handle_callback_comment_error(callback_query)
                        elif next_node_id == "final-results":
                            await handle_callback_final_results(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
    import datetime
    timestamp = datetime.datetime.now().isoformat()
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-1":
                await handle_callback_start_1(callback_query)
            elif next_node_id == "name-input":
                await handle_callback_name_input(callback_query)
            elif next_node_id == "name-error":
                await handle_callback_name_error(callback_query)
            elif next_node_id == "age-buttons":
                await handle_callback_age_buttons(callback_query)
            elif next_node_id == "age-error":
                await handle_callback_age_error(callback_query)
            elif next_node_id == "interests-multiple":
                await handle_callback_interests_multiple(callback_query)
            elif next_node_id == "interests-error":
                await handle_callback_interests_error(callback_query)
            elif next_node_id == "contact-input":
                await handle_callback_contact_input(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "experience-rating":
                await handle_callback_experience_rating(callback_query)
            elif next_node_id == "rating-error":
                await handle_callback_rating_error(callback_query)
            elif next_node_id == "final-comment":
                await handle_callback_final_comment(callback_query)
            elif next_node_id == "comment-error":
                await handle_callback_comment_error(callback_query)
            elif next_node_id == "final-results":
                await handle_callback_final_results(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_interests-multiple_2")
async def handle_response_interests_multiple_2(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "music"
    selected_text = "🎵 Музыка"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-1":
                            await handle_callback_start_1(callback_query)
                        elif next_node_id == "name-input":
                            await handle_callback_name_input(callback_query)
                        elif next_node_id == "name-error":
                            await handle_callback_name_error(callback_query)
                        elif next_node_id == "age-buttons":
                            await handle_callback_age_buttons(callback_query)
                        elif next_node_id == "age-error":
                            await handle_callback_age_error(callback_query)
                        elif next_node_id == "interests-multiple":
                            await handle_callback_interests_multiple(callback_query)
                        elif next_node_id == "interests-error":
                            await handle_callback_interests_error(callback_query)
                        elif next_node_id == "contact-input":
                            await handle_callback_contact_input(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "experience-rating":
                            await handle_callback_experience_rating(callback_query)
                        elif next_node_id == "rating-error":
                            await handle_callback_rating_error(callback_query)
                        elif next_node_id == "final-comment":
                            await handle_callback_final_comment(callback_query)
                        elif next_node_id == "comment-error":
                            await handle_callback_comment_error(callback_query)
                        elif next_node_id == "final-results":
                            await handle_callback_final_results(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
    import datetime
    timestamp = datetime.datetime.now().isoformat()
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-1":
                await handle_callback_start_1(callback_query)
            elif next_node_id == "name-input":
                await handle_callback_name_input(callback_query)
            elif next_node_id == "name-error":
                await handle_callback_name_error(callback_query)
            elif next_node_id == "age-buttons":
                await handle_callback_age_buttons(callback_query)
            elif next_node_id == "age-error":
                await handle_callback_age_error(callback_query)
            elif next_node_id == "interests-multiple":
                await handle_callback_interests_multiple(callback_query)
            elif next_node_id == "interests-error":
                await handle_callback_interests_error(callback_query)
            elif next_node_id == "contact-input":
                await handle_callback_contact_input(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "experience-rating":
                await handle_callback_experience_rating(callback_query)
            elif next_node_id == "rating-error":
                await handle_callback_rating_error(callback_query)
            elif next_node_id == "final-comment":
                await handle_callback_final_comment(callback_query)
            elif next_node_id == "comment-error":
                await handle_callback_comment_error(callback_query)
            elif next_node_id == "final-results":
                await handle_callback_final_results(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_interests-multiple_3")
async def handle_response_interests_multiple_3(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "travel"
    selected_text = "✈️ Путешествия"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-1":
                            await handle_callback_start_1(callback_query)
                        elif next_node_id == "name-input":
                            await handle_callback_name_input(callback_query)
                        elif next_node_id == "name-error":
                            await handle_callback_name_error(callback_query)
                        elif next_node_id == "age-buttons":
                            await handle_callback_age_buttons(callback_query)
                        elif next_node_id == "age-error":
                            await handle_callback_age_error(callback_query)
                        elif next_node_id == "interests-multiple":
                            await handle_callback_interests_multiple(callback_query)
                        elif next_node_id == "interests-error":
                            await handle_callback_interests_error(callback_query)
                        elif next_node_id == "contact-input":
                            await handle_callback_contact_input(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "experience-rating":
                            await handle_callback_experience_rating(callback_query)
                        elif next_node_id == "rating-error":
                            await handle_callback_rating_error(callback_query)
                        elif next_node_id == "final-comment":
                            await handle_callback_final_comment(callback_query)
                        elif next_node_id == "comment-error":
                            await handle_callback_comment_error(callback_query)
                        elif next_node_id == "final-results":
                            await handle_callback_final_results(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
    import datetime
    timestamp = datetime.datetime.now().isoformat()
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-1":
                await handle_callback_start_1(callback_query)
            elif next_node_id == "name-input":
                await handle_callback_name_input(callback_query)
            elif next_node_id == "name-error":
                await handle_callback_name_error(callback_query)
            elif next_node_id == "age-buttons":
                await handle_callback_age_buttons(callback_query)
            elif next_node_id == "age-error":
                await handle_callback_age_error(callback_query)
            elif next_node_id == "interests-multiple":
                await handle_callback_interests_multiple(callback_query)
            elif next_node_id == "interests-error":
                await handle_callback_interests_error(callback_query)
            elif next_node_id == "contact-input":
                await handle_callback_contact_input(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "experience-rating":
                await handle_callback_experience_rating(callback_query)
            elif next_node_id == "rating-error":
                await handle_callback_rating_error(callback_query)
            elif next_node_id == "final-comment":
                await handle_callback_final_comment(callback_query)
            elif next_node_id == "comment-error":
                await handle_callback_comment_error(callback_query)
            elif next_node_id == "final-results":
                await handle_callback_final_results(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_interests-multiple_4")
async def handle_response_interests_multiple_4(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "cooking"
    selected_text = "👨‍🍳 Кулинария"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-1":
                            await handle_callback_start_1(callback_query)
                        elif next_node_id == "name-input":
                            await handle_callback_name_input(callback_query)
                        elif next_node_id == "name-error":
                            await handle_callback_name_error(callback_query)
                        elif next_node_id == "age-buttons":
                            await handle_callback_age_buttons(callback_query)
                        elif next_node_id == "age-error":
                            await handle_callback_age_error(callback_query)
                        elif next_node_id == "interests-multiple":
                            await handle_callback_interests_multiple(callback_query)
                        elif next_node_id == "interests-error":
                            await handle_callback_interests_error(callback_query)
                        elif next_node_id == "contact-input":
                            await handle_callback_contact_input(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "experience-rating":
                            await handle_callback_experience_rating(callback_query)
                        elif next_node_id == "rating-error":
                            await handle_callback_rating_error(callback_query)
                        elif next_node_id == "final-comment":
                            await handle_callback_final_comment(callback_query)
                        elif next_node_id == "comment-error":
                            await handle_callback_comment_error(callback_query)
                        elif next_node_id == "final-results":
                            await handle_callback_final_results(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
    import datetime
    timestamp = datetime.datetime.now().isoformat()
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-1":
                await handle_callback_start_1(callback_query)
            elif next_node_id == "name-input":
                await handle_callback_name_input(callback_query)
            elif next_node_id == "name-error":
                await handle_callback_name_error(callback_query)
            elif next_node_id == "age-buttons":
                await handle_callback_age_buttons(callback_query)
            elif next_node_id == "age-error":
                await handle_callback_age_error(callback_query)
            elif next_node_id == "interests-multiple":
                await handle_callback_interests_multiple(callback_query)
            elif next_node_id == "interests-error":
                await handle_callback_interests_error(callback_query)
            elif next_node_id == "contact-input":
                await handle_callback_contact_input(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "experience-rating":
                await handle_callback_experience_rating(callback_query)
            elif next_node_id == "rating-error":
                await handle_callback_rating_error(callback_query)
            elif next_node_id == "final-comment":
                await handle_callback_final_comment(callback_query)
            elif next_node_id == "comment-error":
                await handle_callback_comment_error(callback_query)
            elif next_node_id == "final-results":
                await handle_callback_final_results(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_interests-multiple_5")
async def handle_response_interests_multiple_5(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "books"
    selected_text = "📚 Книги"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-1":
                            await handle_callback_start_1(callback_query)
                        elif next_node_id == "name-input":
                            await handle_callback_name_input(callback_query)
                        elif next_node_id == "name-error":
                            await handle_callback_name_error(callback_query)
                        elif next_node_id == "age-buttons":
                            await handle_callback_age_buttons(callback_query)
                        elif next_node_id == "age-error":
                            await handle_callback_age_error(callback_query)
                        elif next_node_id == "interests-multiple":
                            await handle_callback_interests_multiple(callback_query)
                        elif next_node_id == "interests-error":
                            await handle_callback_interests_error(callback_query)
                        elif next_node_id == "contact-input":
                            await handle_callback_contact_input(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "experience-rating":
                            await handle_callback_experience_rating(callback_query)
                        elif next_node_id == "rating-error":
                            await handle_callback_rating_error(callback_query)
                        elif next_node_id == "final-comment":
                            await handle_callback_final_comment(callback_query)
                        elif next_node_id == "comment-error":
                            await handle_callback_comment_error(callback_query)
                        elif next_node_id == "final-results":
                            await handle_callback_final_results(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
    import datetime
    timestamp = datetime.datetime.now().isoformat()
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-1":
                await handle_callback_start_1(callback_query)
            elif next_node_id == "name-input":
                await handle_callback_name_input(callback_query)
            elif next_node_id == "name-error":
                await handle_callback_name_error(callback_query)
            elif next_node_id == "age-buttons":
                await handle_callback_age_buttons(callback_query)
            elif next_node_id == "age-error":
                await handle_callback_age_error(callback_query)
            elif next_node_id == "interests-multiple":
                await handle_callback_interests_multiple(callback_query)
            elif next_node_id == "interests-error":
                await handle_callback_interests_error(callback_query)
            elif next_node_id == "contact-input":
                await handle_callback_contact_input(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "experience-rating":
                await handle_callback_experience_rating(callback_query)
            elif next_node_id == "rating-error":
                await handle_callback_rating_error(callback_query)
            elif next_node_id == "final-comment":
                await handle_callback_final_comment(callback_query)
            elif next_node_id == "comment-error":
                await handle_callback_comment_error(callback_query)
            elif next_node_id == "final-results":
                await handle_callback_final_results(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_interests-multiple_6")
async def handle_response_interests_multiple_6(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "done"
    selected_text = "✅ Готово"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-1":
                            await handle_callback_start_1(callback_query)
                        elif next_node_id == "name-input":
                            await handle_callback_name_input(callback_query)
                        elif next_node_id == "name-error":
                            await handle_callback_name_error(callback_query)
                        elif next_node_id == "age-buttons":
                            await handle_callback_age_buttons(callback_query)
                        elif next_node_id == "age-error":
                            await handle_callback_age_error(callback_query)
                        elif next_node_id == "interests-multiple":
                            await handle_callback_interests_multiple(callback_query)
                        elif next_node_id == "interests-error":
                            await handle_callback_interests_error(callback_query)
                        elif next_node_id == "contact-input":
                            await handle_callback_contact_input(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "experience-rating":
                            await handle_callback_experience_rating(callback_query)
                        elif next_node_id == "rating-error":
                            await handle_callback_rating_error(callback_query)
                        elif next_node_id == "final-comment":
                            await handle_callback_final_comment(callback_query)
                        elif next_node_id == "comment-error":
                            await handle_callback_comment_error(callback_query)
                        elif next_node_id == "final-results":
                            await handle_callback_final_results(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
    import datetime
    timestamp = datetime.datetime.now().isoformat()
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-1":
                await handle_callback_start_1(callback_query)
            elif next_node_id == "name-input":
                await handle_callback_name_input(callback_query)
            elif next_node_id == "name-error":
                await handle_callback_name_error(callback_query)
            elif next_node_id == "age-buttons":
                await handle_callback_age_buttons(callback_query)
            elif next_node_id == "age-error":
                await handle_callback_age_error(callback_query)
            elif next_node_id == "interests-multiple":
                await handle_callback_interests_multiple(callback_query)
            elif next_node_id == "interests-error":
                await handle_callback_interests_error(callback_query)
            elif next_node_id == "contact-input":
                await handle_callback_contact_input(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "experience-rating":
                await handle_callback_experience_rating(callback_query)
            elif next_node_id == "rating-error":
                await handle_callback_rating_error(callback_query)
            elif next_node_id == "final-comment":
                await handle_callback_final_comment(callback_query)
            elif next_node_id == "comment-error":
                await handle_callback_comment_error(callback_query)
            elif next_node_id == "final-results":
                await handle_callback_final_results(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_experience-rating_0")
async def handle_response_experience_rating_0(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "1"
    selected_text = "⭐ 1 звезда"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-1":
                            await handle_callback_start_1(callback_query)
                        elif next_node_id == "name-input":
                            await handle_callback_name_input(callback_query)
                        elif next_node_id == "name-error":
                            await handle_callback_name_error(callback_query)
                        elif next_node_id == "age-buttons":
                            await handle_callback_age_buttons(callback_query)
                        elif next_node_id == "age-error":
                            await handle_callback_age_error(callback_query)
                        elif next_node_id == "interests-multiple":
                            await handle_callback_interests_multiple(callback_query)
                        elif next_node_id == "interests-error":
                            await handle_callback_interests_error(callback_query)
                        elif next_node_id == "contact-input":
                            await handle_callback_contact_input(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "experience-rating":
                            await handle_callback_experience_rating(callback_query)
                        elif next_node_id == "rating-error":
                            await handle_callback_rating_error(callback_query)
                        elif next_node_id == "final-comment":
                            await handle_callback_final_comment(callback_query)
                        elif next_node_id == "comment-error":
                            await handle_callback_comment_error(callback_query)
                        elif next_node_id == "final-results":
                            await handle_callback_final_results(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
    import datetime
    timestamp = datetime.datetime.now().isoformat()
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-1":
                await handle_callback_start_1(callback_query)
            elif next_node_id == "name-input":
                await handle_callback_name_input(callback_query)
            elif next_node_id == "name-error":
                await handle_callback_name_error(callback_query)
            elif next_node_id == "age-buttons":
                await handle_callback_age_buttons(callback_query)
            elif next_node_id == "age-error":
                await handle_callback_age_error(callback_query)
            elif next_node_id == "interests-multiple":
                await handle_callback_interests_multiple(callback_query)
            elif next_node_id == "interests-error":
                await handle_callback_interests_error(callback_query)
            elif next_node_id == "contact-input":
                await handle_callback_contact_input(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "experience-rating":
                await handle_callback_experience_rating(callback_query)
            elif next_node_id == "rating-error":
                await handle_callback_rating_error(callback_query)
            elif next_node_id == "final-comment":
                await handle_callback_final_comment(callback_query)
            elif next_node_id == "comment-error":
                await handle_callback_comment_error(callback_query)
            elif next_node_id == "final-results":
                await handle_callback_final_results(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_experience-rating_1")
async def handle_response_experience_rating_1(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "2"
    selected_text = "⭐⭐ 2 звезды"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-1":
                            await handle_callback_start_1(callback_query)
                        elif next_node_id == "name-input":
                            await handle_callback_name_input(callback_query)
                        elif next_node_id == "name-error":
                            await handle_callback_name_error(callback_query)
                        elif next_node_id == "age-buttons":
                            await handle_callback_age_buttons(callback_query)
                        elif next_node_id == "age-error":
                            await handle_callback_age_error(callback_query)
                        elif next_node_id == "interests-multiple":
                            await handle_callback_interests_multiple(callback_query)
                        elif next_node_id == "interests-error":
                            await handle_callback_interests_error(callback_query)
                        elif next_node_id == "contact-input":
                            await handle_callback_contact_input(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "experience-rating":
                            await handle_callback_experience_rating(callback_query)
                        elif next_node_id == "rating-error":
                            await handle_callback_rating_error(callback_query)
                        elif next_node_id == "final-comment":
                            await handle_callback_final_comment(callback_query)
                        elif next_node_id == "comment-error":
                            await handle_callback_comment_error(callback_query)
                        elif next_node_id == "final-results":
                            await handle_callback_final_results(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
    import datetime
    timestamp = datetime.datetime.now().isoformat()
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-1":
                await handle_callback_start_1(callback_query)
            elif next_node_id == "name-input":
                await handle_callback_name_input(callback_query)
            elif next_node_id == "name-error":
                await handle_callback_name_error(callback_query)
            elif next_node_id == "age-buttons":
                await handle_callback_age_buttons(callback_query)
            elif next_node_id == "age-error":
                await handle_callback_age_error(callback_query)
            elif next_node_id == "interests-multiple":
                await handle_callback_interests_multiple(callback_query)
            elif next_node_id == "interests-error":
                await handle_callback_interests_error(callback_query)
            elif next_node_id == "contact-input":
                await handle_callback_contact_input(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "experience-rating":
                await handle_callback_experience_rating(callback_query)
            elif next_node_id == "rating-error":
                await handle_callback_rating_error(callback_query)
            elif next_node_id == "final-comment":
                await handle_callback_final_comment(callback_query)
            elif next_node_id == "comment-error":
                await handle_callback_comment_error(callback_query)
            elif next_node_id == "final-results":
                await handle_callback_final_results(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_experience-rating_2")
async def handle_response_experience_rating_2(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "3"
    selected_text = "⭐⭐⭐ 3 звезды"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-1":
                            await handle_callback_start_1(callback_query)
                        elif next_node_id == "name-input":
                            await handle_callback_name_input(callback_query)
                        elif next_node_id == "name-error":
                            await handle_callback_name_error(callback_query)
                        elif next_node_id == "age-buttons":
                            await handle_callback_age_buttons(callback_query)
                        elif next_node_id == "age-error":
                            await handle_callback_age_error(callback_query)
                        elif next_node_id == "interests-multiple":
                            await handle_callback_interests_multiple(callback_query)
                        elif next_node_id == "interests-error":
                            await handle_callback_interests_error(callback_query)
                        elif next_node_id == "contact-input":
                            await handle_callback_contact_input(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "experience-rating":
                            await handle_callback_experience_rating(callback_query)
                        elif next_node_id == "rating-error":
                            await handle_callback_rating_error(callback_query)
                        elif next_node_id == "final-comment":
                            await handle_callback_final_comment(callback_query)
                        elif next_node_id == "comment-error":
                            await handle_callback_comment_error(callback_query)
                        elif next_node_id == "final-results":
                            await handle_callback_final_results(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
    import datetime
    timestamp = datetime.datetime.now().isoformat()
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-1":
                await handle_callback_start_1(callback_query)
            elif next_node_id == "name-input":
                await handle_callback_name_input(callback_query)
            elif next_node_id == "name-error":
                await handle_callback_name_error(callback_query)
            elif next_node_id == "age-buttons":
                await handle_callback_age_buttons(callback_query)
            elif next_node_id == "age-error":
                await handle_callback_age_error(callback_query)
            elif next_node_id == "interests-multiple":
                await handle_callback_interests_multiple(callback_query)
            elif next_node_id == "interests-error":
                await handle_callback_interests_error(callback_query)
            elif next_node_id == "contact-input":
                await handle_callback_contact_input(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "experience-rating":
                await handle_callback_experience_rating(callback_query)
            elif next_node_id == "rating-error":
                await handle_callback_rating_error(callback_query)
            elif next_node_id == "final-comment":
                await handle_callback_final_comment(callback_query)
            elif next_node_id == "comment-error":
                await handle_callback_comment_error(callback_query)
            elif next_node_id == "final-results":
                await handle_callback_final_results(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_experience-rating_3")
async def handle_response_experience_rating_3(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "4"
    selected_text = "⭐⭐⭐⭐ 4 звезды"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-1":
                            await handle_callback_start_1(callback_query)
                        elif next_node_id == "name-input":
                            await handle_callback_name_input(callback_query)
                        elif next_node_id == "name-error":
                            await handle_callback_name_error(callback_query)
                        elif next_node_id == "age-buttons":
                            await handle_callback_age_buttons(callback_query)
                        elif next_node_id == "age-error":
                            await handle_callback_age_error(callback_query)
                        elif next_node_id == "interests-multiple":
                            await handle_callback_interests_multiple(callback_query)
                        elif next_node_id == "interests-error":
                            await handle_callback_interests_error(callback_query)
                        elif next_node_id == "contact-input":
                            await handle_callback_contact_input(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "experience-rating":
                            await handle_callback_experience_rating(callback_query)
                        elif next_node_id == "rating-error":
                            await handle_callback_rating_error(callback_query)
                        elif next_node_id == "final-comment":
                            await handle_callback_final_comment(callback_query)
                        elif next_node_id == "comment-error":
                            await handle_callback_comment_error(callback_query)
                        elif next_node_id == "final-results":
                            await handle_callback_final_results(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
    import datetime
    timestamp = datetime.datetime.now().isoformat()
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-1":
                await handle_callback_start_1(callback_query)
            elif next_node_id == "name-input":
                await handle_callback_name_input(callback_query)
            elif next_node_id == "name-error":
                await handle_callback_name_error(callback_query)
            elif next_node_id == "age-buttons":
                await handle_callback_age_buttons(callback_query)
            elif next_node_id == "age-error":
                await handle_callback_age_error(callback_query)
            elif next_node_id == "interests-multiple":
                await handle_callback_interests_multiple(callback_query)
            elif next_node_id == "interests-error":
                await handle_callback_interests_error(callback_query)
            elif next_node_id == "contact-input":
                await handle_callback_contact_input(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "experience-rating":
                await handle_callback_experience_rating(callback_query)
            elif next_node_id == "rating-error":
                await handle_callback_rating_error(callback_query)
            elif next_node_id == "final-comment":
                await handle_callback_final_comment(callback_query)
            elif next_node_id == "comment-error":
                await handle_callback_comment_error(callback_query)
            elif next_node_id == "final-results":
                await handle_callback_final_results(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_experience-rating_4")
async def handle_response_experience_rating_4(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "5"
    selected_text = "⭐⭐⭐⭐⭐ 5 звезд"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-1":
                            await handle_callback_start_1(callback_query)
                        elif next_node_id == "name-input":
                            await handle_callback_name_input(callback_query)
                        elif next_node_id == "name-error":
                            await handle_callback_name_error(callback_query)
                        elif next_node_id == "age-buttons":
                            await handle_callback_age_buttons(callback_query)
                        elif next_node_id == "age-error":
                            await handle_callback_age_error(callback_query)
                        elif next_node_id == "interests-multiple":
                            await handle_callback_interests_multiple(callback_query)
                        elif next_node_id == "interests-error":
                            await handle_callback_interests_error(callback_query)
                        elif next_node_id == "contact-input":
                            await handle_callback_contact_input(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "experience-rating":
                            await handle_callback_experience_rating(callback_query)
                        elif next_node_id == "rating-error":
                            await handle_callback_rating_error(callback_query)
                        elif next_node_id == "final-comment":
                            await handle_callback_final_comment(callback_query)
                        elif next_node_id == "comment-error":
                            await handle_callback_comment_error(callback_query)
                        elif next_node_id == "final-results":
                            await handle_callback_final_results(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
    import datetime
    timestamp = datetime.datetime.now().isoformat()
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-1":
                await handle_callback_start_1(callback_query)
            elif next_node_id == "name-input":
                await handle_callback_name_input(callback_query)
            elif next_node_id == "name-error":
                await handle_callback_name_error(callback_query)
            elif next_node_id == "age-buttons":
                await handle_callback_age_buttons(callback_query)
            elif next_node_id == "age-error":
                await handle_callback_age_error(callback_query)
            elif next_node_id == "interests-multiple":
                await handle_callback_interests_multiple(callback_query)
            elif next_node_id == "interests-error":
                await handle_callback_interests_error(callback_query)
            elif next_node_id == "contact-input":
                await handle_callback_contact_input(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "experience-rating":
                await handle_callback_experience_rating(callback_query)
            elif next_node_id == "rating-error":
                await handle_callback_rating_error(callback_query)
            elif next_node_id == "final-comment":
                await handle_callback_final_comment(callback_query)
            elif next_node_id == "comment-error":
                await handle_callback_comment_error(callback_query)
            elif next_node_id == "final-results":
                await handle_callback_final_results(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")


# Универсальный обработчик пользовательского ввода
@dp.message(F.text)
async def handle_user_input(message: types.Message):
    user_id = message.from_user.id
    
    # Проверяем, ожидаем ли мы ввод от пользователя
    if user_id not in user_data or "waiting_for_input" not in user_data[user_id]:
        return  # Игнорируем сообщение если не ожидаем ввод
    
    input_config = user_data[user_id]["waiting_for_input"]
    user_text = message.text
    
    # Проверяем команду пропуска
    if input_config.get("allow_skip") and user_text == "/skip":
        await message.answer("⏭️ Ввод пропущен")
        del user_data[user_id]["waiting_for_input"]
        return
    
    # Валидация длины текста
    min_length = input_config.get("min_length", 0)
    max_length = input_config.get("max_length", 0)
    
    if min_length > 0 and len(user_text) < min_length:
        retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")
        await message.answer(f"❌ Слишком короткий ответ (минимум {min_length} символов). {retry_message}")
        return
    
    if max_length > 0 and len(user_text) > max_length:
        retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")
        await message.answer(f"❌ Слишком длинный ответ (максимум {max_length} символов). {retry_message}")
        return
    
    # Валидация типа ввода
    input_type = input_config.get("type", "text")
    
    if input_type == "email":
        import re
        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_pattern, user_text):
            retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")
            await message.answer(f"❌ Неверный формат email. {retry_message}")
            return
    
    elif input_type == "number":
        try:
            float(user_text)
        except ValueError:
            retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")
            await message.answer(f"❌ Введите корректное число. {retry_message}")
            return
    
    elif input_type == "phone":
        import re
        phone_pattern = r"^[+]?[0-9\s\-\(\)]{10,}$"
        if not re.match(phone_pattern, user_text):
            retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")
            await message.answer(f"❌ Неверный формат телефона. {retry_message}")
            return
    
    # Сохраняем ответ пользователя в структурированном формате
    variable_name = input_config.get("variable", "user_response")
    import datetime
    timestamp = datetime.datetime.now().isoformat()
    node_id = input_config.get("node_id", "unknown")
    
    # Создаем структурированный ответ
    response_data = {
        "value": user_text,
        "type": input_type,
        "timestamp": timestamp,
        "nodeId": node_id,
        "prompt": input_config.get("prompt", ""),
        "variable": variable_name
    }
    
    # Сохраняем в пользовательские данные
    user_data[user_id][variable_name] = response_data
    
    # Сохраняем в базу данных если включено
    if input_config.get("save_to_database"):
        saved_to_db = await update_user_data_in_db(user_id, variable_name, response_data)
        if saved_to_db:
            logging.info(f"✅ Данные сохранены в БД: {variable_name} = {user_text} (пользователь {user_id})")
        else:
            logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
    
    # Отправляем сообщение об успехе
    success_message = input_config.get("success_message", "Спасибо за ваш ответ!")
    await message.answer(success_message)
    
    # Очищаем состояние ожидания ввода
    del user_data[user_id]["waiting_for_input"]
    
    logging.info(f"Получен пользовательский ввод: {variable_name} = {user_text}")
    
    # Автоматическая навигация к следующему узлу после успешного ввода
    next_node_id = input_config.get("next_node_id")
    logging.info(f"🔄 Проверяем навигацию: next_node_id = {next_node_id}")
    if next_node_id:
        try:
            logging.info(f"🚀 Переходим к следующему узлу: {next_node_id}")
            
            # Находим узел по ID и выполняем соответствующее действие
            if next_node_id == "start-1":
                logging.info(f"Переход к узлу start-1 типа start")
            elif next_node_id == "name-input":
                prompt_text = f"👤 **Шаг 1: Персональные данные**\n\n<b>Как вас зовут?</b>\n\nВведите ваше имя (от 2 до 50 символов):"
                placeholder_text = "Введите ваше имя..."
                prompt_text += f"\n\n💡 {placeholder_text}"
                await message.answer(prompt_text)
                
                # Настраиваем ожидание ввода
                user_data[user_id]["waiting_for_input"] = {
                    "type": "text",
                    "variable": "user_name",
                    "validation": "",
                    "min_length": 2,
                    "max_length": 50,
                    "timeout": 60,
                    "required": True,
                    "allow_skip": False,
                    "save_to_database": True,
                    "retry_message": "Пожалуйста, попробуйте еще раз.",
                    "success_message": "Спасибо за ваш ответ!",
                    "prompt": f"👤 **Шаг 1: Персональные данные**\n\n<b>Как вас зовут?</b>\n\nВведите ваше имя (от 2 до 50 символов):",
                    "node_id": "name-input",
                    "next_node_id": "age-buttons"
                }
            elif next_node_id == "name-error":
                text = f"❌ **Ошибка ввода имени**\n\nПожалуйста, введите корректное имя (от 2 до 50 символов).\n\nПопробуйте ещё раз:"
                parse_mode = ParseMode.MARKDOWN
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="🔄 Повторить ввод", callback_data="name-input"))
                builder.add(InlineKeyboardButton(text="⏭️ Пропустить", callback_data="age-buttons"))
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "age-buttons":
                prompt_text = f"🎂 **Шаг 2: Возрастная группа**\n\n<b>Выберите вашу возрастную группу:</b>\n\nИспользуйте кнопки для выбора:"
                
                # Создаем кнопки для выбора ответа
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="18-25 лет", callback_data="response_age-buttons_0"))
                builder.add(InlineKeyboardButton(text="26-35 лет", callback_data="response_age-buttons_1"))
                builder.add(InlineKeyboardButton(text="36-45 лет", callback_data="response_age-buttons_2"))
                builder.add(InlineKeyboardButton(text="46-55 лет", callback_data="response_age-buttons_3"))
                builder.add(InlineKeyboardButton(text="55+ лет", callback_data="response_age-buttons_4"))
                keyboard = builder.as_markup()
                await message.answer(prompt_text, reply_markup=keyboard)
                
                # Настраиваем конфигурацию кнопочного ответа
                user_data[user_id]["button_response_config"] = {
                    "variable": "user_age_group",
                    "node_id": "age-buttons",
                    "timeout": 60,
                    "allow_multiple": False,
                    "save_to_database": True,
                    "selected": [],
                    "success_message": "Спасибо за ваш ответ!",
                    "prompt": f"🎂 **Шаг 2: Возрастная группа**\n\n<b>Выберите вашу возрастную группу:</b>\n\nИспользуйте кнопки для выбора:",
                    "next_node_id": "interests-multiple"
                }
            elif next_node_id == "age-error":
                text = f"❌ **Ошибка выбора возраста**\n\nПожалуйста, выберите одну из предложенных возрастных групп."
                parse_mode = ParseMode.MARKDOWN
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="🔄 Повторить выбор", callback_data="age-buttons"))
                builder.add(InlineKeyboardButton(text="⏭️ Пропустить", callback_data="interests-multiple"))
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "interests-multiple":
                prompt_text = f"🎯 **Шаг 3: Интересы (множественный выбор)**\n\n<b>Выберите ваши интересы (можно несколько):</b>\n\nВыберите все подходящие варианты и нажмите \"Готово\":"
                
                # Создаем кнопки для выбора ответа
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="💻 Технологии", callback_data="response_interests-multiple_0"))
                builder.add(InlineKeyboardButton(text="⚽ Спорт", callback_data="response_interests-multiple_1"))
                builder.add(InlineKeyboardButton(text="🎵 Музыка", callback_data="response_interests-multiple_2"))
                builder.add(InlineKeyboardButton(text="✈️ Путешествия", callback_data="response_interests-multiple_3"))
                builder.add(InlineKeyboardButton(text="👨‍🍳 Кулинария", callback_data="response_interests-multiple_4"))
                builder.add(InlineKeyboardButton(text="📚 Книги", callback_data="response_interests-multiple_5"))
                builder.add(InlineKeyboardButton(text="✅ Готово", callback_data="response_interests-multiple_6"))
                keyboard = builder.as_markup()
                await message.answer(prompt_text, reply_markup=keyboard)
                
                # Настраиваем конфигурацию кнопочного ответа
                user_data[user_id]["button_response_config"] = {
                    "variable": "user_interests",
                    "node_id": "interests-multiple",
                    "timeout": 60,
                    "allow_multiple": True,
                    "save_to_database": True,
                    "selected": [],
                    "success_message": "Спасибо за ваш ответ!",
                    "prompt": f"🎯 **Шаг 3: Интересы (множественный выбор)**\n\n<b>Выберите ваши интересы (можно несколько):</b>\n\nВыберите все подходящие варианты и нажмите \"Готово\":",
                    "next_node_id": "contact-input"
                }
            elif next_node_id == "interests-error":
                text = f"❌ **Ошибка выбора интересов**\n\nПожалуйста, выберите хотя бы один интерес и нажмите \"Готово\"."
                parse_mode = ParseMode.MARKDOWN
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="🔄 Повторить выбор", callback_data="interests-multiple"))
                builder.add(InlineKeyboardButton(text="⏭️ Пропустить", callback_data="contact-input"))
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "contact-input":
                prompt_text = f"📱 **Шаг 4: Контактная информация**\n\n<b>Введите ваш email или телефон:</b>\n\nМы используем эти данные для связи с вами:"
                placeholder_text = "example@email.com или +7-999-123-45-67"
                prompt_text += f"\n\n💡 {placeholder_text}"
                await message.answer(prompt_text)
                
                # Настраиваем ожидание ввода
                user_data[user_id]["waiting_for_input"] = {
                    "type": "email",
                    "variable": "user_contact",
                    "validation": "",
                    "min_length": 5,
                    "max_length": 100,
                    "timeout": 60,
                    "required": True,
                    "allow_skip": False,
                    "save_to_database": True,
                    "retry_message": "Пожалуйста, попробуйте еще раз.",
                    "success_message": "Спасибо за ваш ответ!",
                    "prompt": f"📱 **Шаг 4: Контактная информация**\n\n<b>Введите ваш email или телефон:</b>\n\nМы используем эти данные для связи с вами:",
                    "node_id": "contact-input",
                    "next_node_id": "experience-rating"
                }
            elif next_node_id == "contact-error":
                text = f"❌ **Ошибка ввода контактов**\n\nПожалуйста, введите корректный email или номер телефона."
                parse_mode = ParseMode.MARKDOWN
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="🔄 Повторить ввод", callback_data="contact-input"))
                builder.add(InlineKeyboardButton(text="⏭️ Пропустить", callback_data="experience-rating"))
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "experience-rating":
                prompt_text = f"⭐ **Шаг 5: Оценка опыта**\n\n<b>Как вы оцениваете опыт использования этого бота?</b>\n\nВыберите количество звезд:"
                
                # Создаем кнопки для выбора ответа
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="⭐ 1 звезда", callback_data="response_experience-rating_0"))
                builder.add(InlineKeyboardButton(text="⭐⭐ 2 звезды", callback_data="response_experience-rating_1"))
                builder.add(InlineKeyboardButton(text="⭐⭐⭐ 3 звезды", callback_data="response_experience-rating_2"))
                builder.add(InlineKeyboardButton(text="⭐⭐⭐⭐ 4 звезды", callback_data="response_experience-rating_3"))
                builder.add(InlineKeyboardButton(text="⭐⭐⭐⭐⭐ 5 звезд", callback_data="response_experience-rating_4"))
                keyboard = builder.as_markup()
                await message.answer(prompt_text, reply_markup=keyboard)
                
                # Настраиваем конфигурацию кнопочного ответа
                user_data[user_id]["button_response_config"] = {
                    "variable": "user_rating",
                    "node_id": "experience-rating",
                    "timeout": 60,
                    "allow_multiple": False,
                    "save_to_database": True,
                    "selected": [],
                    "success_message": "Спасибо за ваш ответ!",
                    "prompt": f"⭐ **Шаг 5: Оценка опыта**\n\n<b>Как вы оцениваете опыт использования этого бота?</b>\n\nВыберите количество звезд:",
                    "next_node_id": "final-comment"
                }
            elif next_node_id == "rating-error":
                text = f"❌ **Ошибка оценки**\n\nПожалуйста, выберите оценку от 1 до 5 звезд."
                parse_mode = ParseMode.MARKDOWN
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="🔄 Повторить оценку", callback_data="experience-rating"))
                builder.add(InlineKeyboardButton(text="⏭️ Пропустить", callback_data="final-comment"))
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "final-comment":
                prompt_text = f"💭 **Шаг 6: Заключительный комментарий**\n\n<b>Есть ли у вас дополнительные комментарии или предложения?</b>\n\nНапишите ваше мнение (необязательно):"
                placeholder_text = "Ваши комментарии и предложения..."
                prompt_text += f"\n\n💡 {placeholder_text}"
                await message.answer(prompt_text)
                
                # Настраиваем ожидание ввода
                user_data[user_id]["waiting_for_input"] = {
                    "type": "text",
                    "variable": "user_comment",
                    "validation": "",
                    "min_length": 0,
                    "max_length": 1000,
                    "timeout": 60,
                    "required": True,
                    "allow_skip": False,
                    "save_to_database": True,
                    "retry_message": "Пожалуйста, попробуйте еще раз.",
                    "success_message": "Спасибо за ваш ответ!",
                    "prompt": f"💭 **Шаг 6: Заключительный комментарий**\n\n<b>Есть ли у вас дополнительные комментарии или предложения?</b>\n\nНапишите ваше мнение (необязательно):",
                    "node_id": "final-comment",
                    "next_node_id": "final-results"
                }
            elif next_node_id == "comment-error":
                text = f"❌ **Ошибка комментария**\n\nКомментарий слишком длинный. Максимум 1000 символов."
                parse_mode = ParseMode.MARKDOWN
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="🔄 Повторить ввод", callback_data="final-comment"))
                builder.add(InlineKeyboardButton(text="⏭️ Пропустить", callback_data="final-results"))
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "final-results":
                text = f"🎉 **Сбор данных завершен!**\n\n<b>Спасибо за участие!</b>\n\nВы успешно продемонстрировали все типы сбора пользовательского ввода:\n\n✅ <b>Текстовый ввод</b> - имя и комментарии\n✅ <b>Одиночный выбор</b> - возраст и рейтинг\n✅ <b>Множественный выбор</b> - интересы\n✅ <b>Валидация данных</b> - проверка email/телефона\n✅ <b>Обработка ошибок</b> - повторы и пропуски\n\nВсе данные сохранены в базе данных и готовы к анализу."
                parse_mode = ParseMode.MARKDOWN
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="🔄 Пройти снова", callback_data="start-1"))
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")



# Запуск бота
async def main():
    global db_pool
    try:
        # Инициализируем базу данных
        await init_database()
        print("🤖 Бот запущен и готов к работе!")
        await dp.start_polling(bot)
    except KeyboardInterrupt:
        print("🛑 Получен сигнал остановки, завершаем работу...")
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

if __name__ == "__main__":
    asyncio.run(main())
