"""
Тест шаблона #3 - Telegram Bot
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

    text = """👋 Добро пожаловать в опрос с кнопочными ответами!

Этот бот демонстрирует новую функцию - сбор ответов пользователей через кнопки выбора вместо текстового ввода."""
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📝 Начать опрос", callback_data="question-1"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "question-1")
async def handle_callback_question_1(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Удаляем старое сообщение
    await callback_query.message.delete()
    
    text = "🎯 Какой у вас уровень опыта в программировании?"
    
    # Создаем кнопки для выбора ответа
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🌱 Новичок", callback_data="response_question-1_0"))
    builder.add(InlineKeyboardButton(text="⚡ Средний", callback_data="response_question-1_1"))
    builder.add(InlineKeyboardButton(text="🚀 Продвинутый", callback_data="response_question-1_2"))
    builder.add(InlineKeyboardButton(text="🎓 Эксперт", callback_data="response_question-1_3"))
    keyboard = builder.as_markup()
    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)
    
    # Инициализируем пользовательские данные если их нет
    if callback_query.from_user.id not in user_data:
        user_data[callback_query.from_user.id] = {}
    
    # Сохраняем настройки для обработки ответа
    user_data[callback_query.from_user.id]["button_response_config"] = {
        "node_id": "question-1",
        "variable": "programming_level",
        "save_to_database": True,
        "success_message": "Отлично! Ваш уровень записан.",
        "allow_multiple": False,
        "options": [
            {"index": 0, "text": "🌱 Новичок", "value": "beginner"},
            {"index": 1, "text": "⚡ Средний", "value": "intermediate"},
            {"index": 2, "text": "🚀 Продвинутый", "value": "advanced"},
            {"index": 3, "text": "🎓 Эксперт", "value": "expert"},
        ],
        "selected": []
    }

@dp.callback_query(lambda c: c.data == "start-1")
async def handle_callback_start_1(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """👋 Добро пожаловать в опрос с кнопочными ответами!

Этот бот демонстрирует новую функцию - сбор ответов пользователей через кнопки выбора вместо текстового ввода."""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📝 Начать опрос", callback_data="question-1"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

# Обработчики кнопочных ответов для сбора пользовательского ввода

@dp.callback_query(F.data == "response_question-1_0")
async def handle_response_question-1_0(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "beginner"
    selected_text = "🌱 Новичок"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
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

@dp.callback_query(F.data == "response_question-1_1")
async def handle_response_question-1_1(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "intermediate"
    selected_text = "⚡ Средний"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
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

@dp.callback_query(F.data == "response_question-1_2")
async def handle_response_question-1_2(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "advanced"
    selected_text = "🚀 Продвинутый"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
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

@dp.callback_query(F.data == "response_question-1_3")
async def handle_response_question-1_3(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "expert"
    selected_text = "🎓 Эксперт"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
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

@dp.callback_query(F.data == "response_question-2_0")
async def handle_response_question-2_0(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "python"
    selected_text = "🐍 Python"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
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

@dp.callback_query(F.data == "response_question-2_1")
async def handle_response_question-2_1(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "javascript"
    selected_text = "⚡ JavaScript"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
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

@dp.callback_query(F.data == "response_question-2_2")
async def handle_response_question-2_2(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "java"
    selected_text = "☕ Java"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
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

@dp.callback_query(F.data == "response_question-2_3")
async def handle_response_question-2_3(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "typescript"
    selected_text = "🔷 TypeScript"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
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

@dp.callback_query(F.data == "response_question-2_4")
async def handle_response_question-2_4(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "rust"
    selected_text = "🦀 Rust"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
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

@dp.callback_query(F.data == "response_question-2_5")
async def handle_response_question-2_5(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "cpp"
    selected_text = "⚙️ C++"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
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

@dp.callback_query(F.data == "skip_question-2")
async def handle_skip_question-2(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла", show_alert=True)
        return
    
    await callback_query.message.edit_text("⏭️ Ответ пропущен")
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Пользователь {user_id} пропустил кнопочный ответ")


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
