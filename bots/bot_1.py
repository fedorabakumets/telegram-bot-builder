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
from typing import Optional
import asyncpg
from datetime import datetime, timezone, timedelta
import json

# Функция для получения московского времени
def get_moscow_time():
    """Возвращает текущее время в московском часовом поясе"""
    moscow_tz = timezone(timedelta(hours=3))  # UTC+3 для Москвы
    return datetime.now(moscow_tz).isoformat()

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
DATABASE_URL = os.getenv("DATABASE_URL")

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

    text = """Привет! 🌟
Добро пожаловать в наш бот!
Откуда вы узнали о нас?"""
    # Определяем режим форматирования (приоритет у условного сообщения)
    if "conditional_parse_mode" in locals() and conditional_parse_mode is not None:
        current_parse_mode = conditional_parse_mode
    else:
        current_parse_mode = None
    await message.answer(text, parse_mode=current_parse_mode if current_parse_mode else None)
    
    # Устанавливаем состояние ожидания ввода
    user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
    user_data[message.from_user.id]["waiting_for_input"] = "start_node"

@dp.message(Command("profile"))
async def profile_handler(message: types.Message):
    logging.info(f"Команда /profile вызвана пользователем {message.from_user.id}")
    # Сохраняем пользователя и статистику использования команд
    user_id = message.from_user.id
    username = message.from_user.username
    first_name = message.from_user.first_name
    last_name = message.from_user.last_name
    
    # Сохраняем пользователя в базу данных
    saved_to_db = await save_user_to_db(user_id, username, first_name, last_name)
    
    # Обновляем статистику команд в БД
    if saved_to_db:
        await update_user_data_in_db(user_id, "command_profile", datetime.now().isoformat())
    
    # Резервное сохранение в локальное хранилище
    if user_id not in user_data:
        user_data[user_id] = {}
    if "commands_used" not in user_data[user_id]:
        user_data[user_id]["commands_used"] = {}
    user_data[user_id]["commands_used"]["/profile"] = user_data[user_id]["commands_used"].get("/profile", 0) + 1

    # Проверяем условные сообщения
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
    
    conditional_parse_mode = None
    conditional_keyboard = None
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        return True, str(raw_value["value"]) if raw_value["value"] is not None else None
                    else:
                        return True, str(raw_value) if raw_value is not None else None
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                return True, str(variable_data["value"]) if variable_data["value"] is not None else None
            elif variable_data is not None:
                return True, str(variable_data)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: желание, имя, источник, пол
    if (
        check_user_variable("желание", user_data_dict)[0] and
        check_user_variable("имя", user_data_dict)[0] and
        check_user_variable("источник", user_data_dict)[0] and
        check_user_variable("пол", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["желание"] = check_user_variable("желание", user_data_dict)
        _, variable_values["имя"] = check_user_variable("имя", user_data_dict)
        _, variable_values["источник"] = check_user_variable("источник", user_data_dict)
        _, variable_values["пол"] = check_user_variable("пол", user_data_dict)
        text = """👤 Ваш профиль:

🔍 Источник: {источник}
💭 Желание продолжить: {желание}
⚧️ Пол: {пол}
👋 Имя: {имя}

Профиль полностью заполнен! ✅"""
        conditional_parse_mode = None
        if "{желание}" in text and variable_values["желание"] is not None:
            text = text.replace("{желание}", variable_values["желание"])
        if "{имя}" in text and variable_values["имя"] is not None:
            text = text.replace("{имя}", variable_values["имя"])
        if "{источник}" in text and variable_values["источник"] is not None:
            text = text.replace("{источник}", variable_values["источник"])
        if "{пол}" in text and variable_values["пол"] is not None:
            text = text.replace("{пол}", variable_values["пол"])
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "profile_with_all_data",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    # Условие 2: user_data_exists для переменных: имя
    elif (
        check_user_variable("имя", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["имя"] = check_user_variable("имя", user_data_dict)
        text = """👤 Ваш профиль:

👋 Имя: {имя}

Основная информация заполнена. Хотите пройти полный опрос?"""
        conditional_parse_mode = None
        if "{имя}" in text and variable_values["имя"] is not None:
            text = text.replace("{имя}", variable_values["имя"])
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "profile_basic_info",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    # Условие 3: user_data_exists для переменных: источник
    elif (
        check_user_variable("источник", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["источник"] = check_user_variable("источник", user_data_dict)
        text = """👤 Частичный профиль:

🔍 Источник: {источник}

Профиль заполнен частично. Пройдите полный опрос для получения более детальной информации."""
        conditional_parse_mode = None
        if "{источник}" in text and variable_values["источник"] is not None:
            text = text.replace("{источник}", variable_values["источник"])
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "profile_partial",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (OR)")
    # Условие 4: user_data_exists для переменных: желание, имя, источник, пол
    elif (
        check_user_variable("желание", user_data_dict)[0] or
        check_user_variable("имя", user_data_dict)[0] or
        check_user_variable("источник", user_data_dict)[0] or
        check_user_variable("пол", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["желание"] = check_user_variable("желание", user_data_dict)
        _, variable_values["имя"] = check_user_variable("имя", user_data_dict)
        _, variable_values["источник"] = check_user_variable("источник", user_data_dict)
        _, variable_values["пол"] = check_user_variable("пол", user_data_dict)
        text = """👤 Ваш профиль:

У нас есть некоторая информация о вас. Пройдите полный опрос чтобы заполнить профиль полностью.

Имеющиеся данные:
🔍 Источник: {источник}
💭 Желание: {желание}
⚧️ Пол: {пол}
👋 Имя: {имя}"""
        conditional_parse_mode = None
        if "{желание}" in text and variable_values["желание"] is not None:
            text = text.replace("{желание}", variable_values["желание"])
        if "{имя}" in text and variable_values["имя"] is not None:
            text = text.replace("{имя}", variable_values["имя"])
        if "{источник}" in text and variable_values["источник"] is not None:
            text = text.replace("{источник}", variable_values["источник"])
        if "{пол}" in text and variable_values["пол"] is not None:
            text = text.replace("{пол}", variable_values["пол"])
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "profile_any_data",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (OR)")
    else:
        text = """👤 Профиль недоступен

Похоже, вы еще не прошли опрос. Пожалуйста, введите /start чтобы заполнить профиль."""
        logging.info("Используется запасное сообщение")
    
    # Подставляем все доступные переменные пользователя в текст
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    
    # Безопасно извлекаем user_data
    if isinstance(user_record, dict):
        if "user_data" in user_record:
            if isinstance(user_record["user_data"], str):
                try:
                    import json
                    user_vars = json.loads(user_record["user_data"])
                except (json.JSONDecodeError, TypeError):
                    user_vars = {}
            elif isinstance(user_record["user_data"], dict):
                user_vars = user_record["user_data"]
            else:
                user_vars = {}
        else:
            user_vars = user_record
    else:
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
    
    text = replace_variables_in_text(text, user_vars)
    text = replace_variables_in_text(text, user_vars)
    
    # Проверка условных сообщений для клавиатуры
    user_data_dict = user_record if user_record else user_data.get(user_id, {})
    conditional_parse_mode = None
    conditional_keyboard = None
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        return True, str(raw_value["value"]) if raw_value["value"] is not None else None
                    else:
                        return True, str(raw_value) if raw_value is not None else None
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                return True, str(variable_data["value"]) if variable_data["value"] is not None else None
            elif variable_data is not None:
                return True, str(variable_data)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: желание, имя, источник, пол
    if (
        check_user_variable("желание", user_data_dict)[0] and
        check_user_variable("имя", user_data_dict)[0] and
        check_user_variable("источник", user_data_dict)[0] and
        check_user_variable("пол", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["желание"] = check_user_variable("желание", user_data_dict)
        _, variable_values["имя"] = check_user_variable("имя", user_data_dict)
        _, variable_values["источник"] = check_user_variable("источник", user_data_dict)
        _, variable_values["пол"] = check_user_variable("пол", user_data_dict)
        text = """👤 Ваш профиль:

🔍 Источник: {источник}
💭 Желание продолжить: {желание}
⚧️ Пол: {пол}
👋 Имя: {имя}

Профиль полностью заполнен! ✅"""
        conditional_parse_mode = None
        if "{желание}" in text and variable_values["желание"] is not None:
            text = text.replace("{желание}", variable_values["желание"])
        if "{имя}" in text and variable_values["имя"] is not None:
            text = text.replace("{имя}", variable_values["имя"])
        if "{источник}" in text and variable_values["источник"] is not None:
            text = text.replace("{источник}", variable_values["источник"])
        if "{пол}" in text and variable_values["пол"] is not None:
            text = text.replace("{пол}", variable_values["пол"])
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "profile_with_all_data",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    # Условие 2: user_data_exists для переменных: имя
    elif (
        check_user_variable("имя", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["имя"] = check_user_variable("имя", user_data_dict)
        text = """👤 Ваш профиль:

👋 Имя: {имя}

Основная информация заполнена. Хотите пройти полный опрос?"""
        conditional_parse_mode = None
        if "{имя}" in text and variable_values["имя"] is not None:
            text = text.replace("{имя}", variable_values["имя"])
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "profile_basic_info",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    # Условие 3: user_data_exists для переменных: источник
    elif (
        check_user_variable("источник", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["источник"] = check_user_variable("источник", user_data_dict)
        text = """👤 Частичный профиль:

🔍 Источник: {источник}

Профиль заполнен частично. Пройдите полный опрос для получения более детальной информации."""
        conditional_parse_mode = None
        if "{источник}" in text and variable_values["источник"] is not None:
            text = text.replace("{источник}", variable_values["источник"])
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "profile_partial",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (OR)")
    # Условие 4: user_data_exists для переменных: желание, имя, источник, пол
    elif (
        check_user_variable("желание", user_data_dict)[0] or
        check_user_variable("имя", user_data_dict)[0] or
        check_user_variable("источник", user_data_dict)[0] or
        check_user_variable("пол", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["желание"] = check_user_variable("желание", user_data_dict)
        _, variable_values["имя"] = check_user_variable("имя", user_data_dict)
        _, variable_values["источник"] = check_user_variable("источник", user_data_dict)
        _, variable_values["пол"] = check_user_variable("пол", user_data_dict)
        text = """👤 Ваш профиль:

У нас есть некоторая информация о вас. Пройдите полный опрос чтобы заполнить профиль полностью.

Имеющиеся данные:
🔍 Источник: {источник}
💭 Желание: {желание}
⚧️ Пол: {пол}
👋 Имя: {имя}"""
        conditional_parse_mode = None
        if "{желание}" in text and variable_values["желание"] is not None:
            text = text.replace("{желание}", variable_values["желание"])
        if "{имя}" in text and variable_values["имя"] is not None:
            text = text.replace("{имя}", variable_values["имя"])
        if "{источник}" in text and variable_values["источник"] is not None:
            text = text.replace("{источник}", variable_values["источник"])
        if "{пол}" in text and variable_values["пол"] is not None:
            text = text.replace("{пол}", variable_values["пол"])
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "profile_any_data",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (OR)")
    
    # Используем условное сообщение если есть подходящее условие
    if "text" not in locals():
        # Используем исходный текст клавиатуры если условие не сработало
        pass  # text уже установлен выше
    
    # Используем условную клавиатуру если есть
    conditional_keyboard_for_element = conditional_keyboard
    # Определяем режим форматирования (приоритет у условного сообщения)
    if "conditional_parse_mode" in locals() and conditional_parse_mode is not None:
        current_parse_mode = conditional_parse_mode
    else:
        current_parse_mode = None
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📝 Пройти опрос", callback_data="cmd_start"))
    builder.add(InlineKeyboardButton(text="Редактировать имя", callback_data="H7Sfc4w0d6izui3NABl6m"))
    keyboard = builder.as_markup()
    
    # Отправляем сообщение с клавиатурой (приоритет у условной клавиатуры)
    if conditional_keyboard_for_element is not None:
        # Используем условную клавиатуру для элемента клавиатуры
        await message.answer(text, reply_markup=conditional_keyboard_for_element, parse_mode=current_parse_mode if current_parse_mode else None)
    elif "conditional_keyboard" in locals() and conditional_keyboard is not None:
        # Используем общую условную клавиатуру
        await message.answer(text, reply_markup=conditional_keyboard, parse_mode=current_parse_mode if current_parse_mode else None)
    elif keyboard is not None:
        # Используем обычную клавиатуру
        await message.answer(text, reply_markup=keyboard, parse_mode=current_parse_mode if current_parse_mode else None)
    else:
        # Отправляем сообщение без клавиатуры
        await message.answer(text, parse_mode=current_parse_mode if current_parse_mode else None)

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "btn-1")
async def handle_callback_btn_1(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "Да"
    
    # Сохраняем правильную переменную в базу данных
    await update_user_data_in_db(user_id, "желание", button_text)
    logging.info(f"Переменная желание сохранена: " + str(button_text) + f" (пользователь {user_id})")
    
    
    text = "Какой твой пол?"
    # Подставляем все доступные переменные пользователя в текст
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    
    # Безопасно извлекаем user_data
    if isinstance(user_record, dict):
        if "user_data" in user_record:
            if isinstance(user_record["user_data"], str):
                try:
                    import json
                    user_vars = json.loads(user_record["user_data"])
                except (json.JSONDecodeError, TypeError):
                    user_vars = {}
            elif isinstance(user_record["user_data"], dict):
                user_vars = user_record["user_data"]
            else:
                user_vars = {}
        else:
            user_vars = user_record
    else:
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
    
    text = replace_variables_in_text(text, user_vars)
    # Активируем сбор пользовательского ввода (основной цикл)
    if callback_query.from_user.id not in user_data:
        user_data[callback_query.from_user.id] = {}
    
    user_data[callback_query.from_user.id]["waiting_for_input"] = "nr3wIiTfBYYmpkkXMNH7n"
    user_data[callback_query.from_user.id]["input_type"] = "text"
    user_data[callback_query.from_user.id]["input_variable"] = "пол"
    user_data[callback_query.from_user.id]["save_to_database"] = True
    user_data[callback_query.from_user.id]["input_target_node_id"] = ""
    
    # Создаем inline клавиатуру с кнопками (+ сбор ввода включен)
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="Женщина", callback_data="H7Sfc4w0d6izui3NABl6m_btn_0_btn_0"))
    builder.add(InlineKeyboardButton(text="Мужчина", callback_data="H7Sfc4w0d6izui3NABl6m_btn_1_btn_1"))
    keyboard = builder.as_markup()
    # Пытаемся редактировать сообщение, если не получается - отправляем новое
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard)
    

@dp.callback_query(lambda c: c.data == "btn-2")
async def handle_callback_btn_2(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "Нет"
    
    # Сохраняем правильную переменную в базу данных
    await update_user_data_in_db(user_id, "желание", button_text)
    logging.info(f"Переменная желание сохранена: " + str(button_text) + f" (пользователь {user_id})")
    
    
    # Отправляем сообщение для узла 1BHSLWPMao9qQvSAzuzRl
    text = "Печально, если что напиши /start или /profile для просмотра профиля"
    
    # Подставляем все доступные переменные пользователя в текст
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    
    # Безопасно извлекаем user_data
    if isinstance(user_record, dict):
        if "user_data" in user_record:
            if isinstance(user_record["user_data"], str):
                try:
                    import json
                    user_vars = json.loads(user_record["user_data"])
                except (json.JSONDecodeError, TypeError):
                    user_vars = {}
            elif isinstance(user_record["user_data"], dict):
                user_vars = user_record["user_data"]
            else:
                user_vars = {}
        else:
            user_vars = user_record
    else:
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
    
    text = replace_variables_in_text(text, user_vars)
    
    # Без условных сообщений - используем обычную клавиатуру
    # Создаем inline клавиатуру для целевого узла
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔄 Начать заново", callback_data="cmd_start"))
    builder.add(InlineKeyboardButton(text="👤 Профиль", callback_data="cmd_profile"))
    keyboard = builder.as_markup()
    # Отправляем сообщение
    try:
        if keyboard is not None:
            await callback_query.message.edit_text(text, reply_markup=keyboard)
        else:
            await callback_query.message.edit_text(text)
    except Exception:
        if keyboard is not None:
            await callback_query.message.answer(text, reply_markup=keyboard)
        else:
            await callback_query.message.answer(text)

@dp.callback_query(lambda c: c.data == "btn-female")
async def handle_callback_btn_female(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "Женщина"
    
    # Сохраняем правильную переменную в базу данных
    await update_user_data_in_db(user_id, "пол", button_text)
    logging.info(f"Переменная пол сохранена: " + str(button_text) + f" (пользователь {user_id})")
    
    
    # Отправляем сообщение для узла H7Sfc4w0d6izui3NABl6m
    text = "Как тебя зовут?"
    
    # Подставляем все доступные переменные пользователя в текст
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    
    # Безопасно извлекаем user_data
    if isinstance(user_record, dict):
        if "user_data" in user_record:
            if isinstance(user_record["user_data"], str):
                try:
                    import json
                    user_vars = json.loads(user_record["user_data"])
                except (json.JSONDecodeError, TypeError):
                    user_vars = {}
            elif isinstance(user_record["user_data"], dict):
                user_vars = user_record["user_data"]
            else:
                user_vars = {}
        else:
            user_vars = user_record
    else:
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
    
    text = replace_variables_in_text(text, user_vars)
    
    # Проверка условных сообщений
    user_data_dict = user_record if user_record else user_data.get(user_id, {})
    conditional_parse_mode = None
    conditional_keyboard = None
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        return True, str(raw_value["value"]) if raw_value["value"] is not None else None
                    else:
                        return True, str(raw_value) if raw_value is not None else None
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                return True, str(variable_data["value"]) if variable_data["value"] is not None else None
            elif variable_data is not None:
                return True, str(variable_data)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: имя
    if (
        check_user_variable("имя", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["имя"] = check_user_variable("имя", user_data_dict)
        text = "Введите новое имя"
        conditional_parse_mode = None
        if "{имя}" in text and variable_values["имя"] is not None:
            text = text.replace("{имя}", variable_values["имя"])
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "condition-1753979634576",
            "wait_for_input": True,
            "input_variable": "имя",
            "next_node_id": "profile_command",
            "source_type": "conditional_message"
        }
        
        # Если есть условное сообщение с ожиданием ввода
        if conditional_message_config and conditional_message_config.get("wait_for_input"):
            user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config
            logging.info(f"Активировано ожидание условного ввода: {conditional_message_config}")
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
    # Используем условное сообщение если есть подходящее условие
    if "text" not in locals():
        text = "Как тебя зовут?"
    
    # Используем условную клавиатуру если есть
    if conditional_keyboard is not None:
        keyboard = conditional_keyboard
    else:
    keyboard = None
    # Настраиваем ожидание текстового ввода для условных сообщений
    if "conditional_message_config" in locals():
        # Проверяем, включено ли ожидание текстового ввода
        wait_for_input = conditional_message_config.get("wait_for_input", False)
        if wait_for_input:
            # Получаем следующий узел из условного сообщения или подключений
            conditional_next_node = conditional_message_config.get("next_node_id")
            if conditional_next_node:
                next_node_id = conditional_next_node
            else:
                next_node_id = None
            
            # Получаем переменную для сохранения ввода
            input_variable = conditional_message_config.get("input_variable")
            if not input_variable:
                input_variable = f"conditional_response_{conditional_message_config["condition_id"]}"
            
            # Устанавливаем состояние ожидания текстового ввода
            user_data[user_id]["waiting_for_conditional_input"] = {
                "node_id": callback_query.data,
                "condition_id": conditional_message_config["condition_id"],
                "next_node_id": next_node_id,
                "input_variable": input_variable,
                "source_type": "conditional_message"
            }
            logging.info(f"Установлено ожидание ввода для условного сообщения: {conditional_message_config}")
    
    # Отправляем сообщение
    try:
        if keyboard is not None:
            await callback_query.message.edit_text(text, reply_markup=keyboard)
        else:
            await callback_query.message.edit_text(text)
    except Exception:
        if keyboard is not None:
            await callback_query.message.answer(text, reply_markup=keyboard)
        else:
            await callback_query.message.answer(text)

@dp.callback_query(lambda c: c.data == "btn-male")
async def handle_callback_btn_male(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "Мужчина"
    
    # Сохраняем правильную переменную в базу данных
    await update_user_data_in_db(user_id, "пол", button_text)
    logging.info(f"Переменная пол сохранена: " + str(button_text) + f" (пользователь {user_id})")
    
    
    # Отправляем сообщение для узла H7Sfc4w0d6izui3NABl6m
    text = "Как тебя зовут?"
    
    # Подставляем все доступные переменные пользователя в текст
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    
    # Безопасно извлекаем user_data
    if isinstance(user_record, dict):
        if "user_data" in user_record:
            if isinstance(user_record["user_data"], str):
                try:
                    import json
                    user_vars = json.loads(user_record["user_data"])
                except (json.JSONDecodeError, TypeError):
                    user_vars = {}
            elif isinstance(user_record["user_data"], dict):
                user_vars = user_record["user_data"]
            else:
                user_vars = {}
        else:
            user_vars = user_record
    else:
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
    
    text = replace_variables_in_text(text, user_vars)
    
    # Проверка условных сообщений
    user_data_dict = user_record if user_record else user_data.get(user_id, {})
    conditional_parse_mode = None
    conditional_keyboard = None
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        return True, str(raw_value["value"]) if raw_value["value"] is not None else None
                    else:
                        return True, str(raw_value) if raw_value is not None else None
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                return True, str(variable_data["value"]) if variable_data["value"] is not None else None
            elif variable_data is not None:
                return True, str(variable_data)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: имя
    if (
        check_user_variable("имя", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["имя"] = check_user_variable("имя", user_data_dict)
        text = "Введите новое имя"
        conditional_parse_mode = None
        if "{имя}" in text and variable_values["имя"] is not None:
            text = text.replace("{имя}", variable_values["имя"])
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "condition-1753979634576",
            "wait_for_input": True,
            "input_variable": "имя",
            "next_node_id": "profile_command",
            "source_type": "conditional_message"
        }
        
        # Если есть условное сообщение с ожиданием ввода
        if conditional_message_config and conditional_message_config.get("wait_for_input"):
            user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config
            logging.info(f"Активировано ожидание условного ввода: {conditional_message_config}")
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
    # Используем условное сообщение если есть подходящее условие
    if "text" not in locals():
        text = "Как тебя зовут?"
    
    # Используем условную клавиатуру если есть
    if conditional_keyboard is not None:
        keyboard = conditional_keyboard
    else:
    keyboard = None
    # Настраиваем ожидание текстового ввода для условных сообщений
    if "conditional_message_config" in locals():
        # Проверяем, включено ли ожидание текстового ввода
        wait_for_input = conditional_message_config.get("wait_for_input", False)
        if wait_for_input:
            # Получаем следующий узел из условного сообщения или подключений
            conditional_next_node = conditional_message_config.get("next_node_id")
            if conditional_next_node:
                next_node_id = conditional_next_node
            else:
                next_node_id = None
            
            # Получаем переменную для сохранения ввода
            input_variable = conditional_message_config.get("input_variable")
            if not input_variable:
                input_variable = f"conditional_response_{conditional_message_config["condition_id"]}"
            
            # Устанавливаем состояние ожидания текстового ввода
            user_data[user_id]["waiting_for_conditional_input"] = {
                "node_id": callback_query.data,
                "condition_id": conditional_message_config["condition_id"],
                "next_node_id": next_node_id,
                "input_variable": input_variable,
                "source_type": "conditional_message"
            }
            logging.info(f"Установлено ожидание ввода для условного сообщения: {conditional_message_config}")
    
    # Отправляем сообщение
    try:
        if keyboard is not None:
            await callback_query.message.edit_text(text, reply_markup=keyboard)
        else:
            await callback_query.message.edit_text(text)
    except Exception:
        if keyboard is not None:
            await callback_query.message.answer(text, reply_markup=keyboard)
        else:
            await callback_query.message.answer(text)

@dp.callback_query(lambda c: c.data == "jOgdJhBUBFASDWSVb8LTI")
async def handle_callback_jOgdJhBUBFASDWSVb8LTI(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "Редактировать имя"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    # Отправляем сообщение для узла H7Sfc4w0d6izui3NABl6m
    text = "Как тебя зовут?"
    
    # Подставляем все доступные переменные пользователя в текст
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    
    # Безопасно извлекаем user_data
    if isinstance(user_record, dict):
        if "user_data" in user_record:
            if isinstance(user_record["user_data"], str):
                try:
                    import json
                    user_vars = json.loads(user_record["user_data"])
                except (json.JSONDecodeError, TypeError):
                    user_vars = {}
            elif isinstance(user_record["user_data"], dict):
                user_vars = user_record["user_data"]
            else:
                user_vars = {}
        else:
            user_vars = user_record
    else:
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
    
    text = replace_variables_in_text(text, user_vars)
    
    # Проверка условных сообщений
    user_data_dict = user_record if user_record else user_data.get(user_id, {})
    conditional_parse_mode = None
    conditional_keyboard = None
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        return True, str(raw_value["value"]) if raw_value["value"] is not None else None
                    else:
                        return True, str(raw_value) if raw_value is not None else None
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                return True, str(variable_data["value"]) if variable_data["value"] is not None else None
            elif variable_data is not None:
                return True, str(variable_data)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: имя
    if (
        check_user_variable("имя", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["имя"] = check_user_variable("имя", user_data_dict)
        text = "Введите новое имя"
        conditional_parse_mode = None
        if "{имя}" in text and variable_values["имя"] is not None:
            text = text.replace("{имя}", variable_values["имя"])
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "condition-1753979634576",
            "wait_for_input": True,
            "input_variable": "имя",
            "next_node_id": "profile_command",
            "source_type": "conditional_message"
        }
        
        # Если есть условное сообщение с ожиданием ввода
        if conditional_message_config and conditional_message_config.get("wait_for_input"):
            user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config
            logging.info(f"Активировано ожидание условного ввода: {conditional_message_config}")
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
    # Используем условное сообщение если есть подходящее условие
    if "text" not in locals():
        text = "Как тебя зовут?"
    
    # Используем условную клавиатуру если есть
    if conditional_keyboard is not None:
        keyboard = conditional_keyboard
    else:
    keyboard = None
    # Настраиваем ожидание текстового ввода для условных сообщений
    if "conditional_message_config" in locals():
        # Проверяем, включено ли ожидание текстового ввода
        wait_for_input = conditional_message_config.get("wait_for_input", False)
        if wait_for_input:
            # Получаем следующий узел из условного сообщения или подключений
            conditional_next_node = conditional_message_config.get("next_node_id")
            if conditional_next_node:
                next_node_id = conditional_next_node
            else:
                next_node_id = None
            
            # Получаем переменную для сохранения ввода
            input_variable = conditional_message_config.get("input_variable")
            if not input_variable:
                input_variable = f"conditional_response_{conditional_message_config["condition_id"]}"
            
            # Устанавливаем состояние ожидания текстового ввода
            user_data[user_id]["waiting_for_conditional_input"] = {
                "node_id": callback_query.data,
                "condition_id": conditional_message_config["condition_id"],
                "next_node_id": next_node_id,
                "input_variable": input_variable,
                "source_type": "conditional_message"
            }
            logging.info(f"Установлено ожидание ввода для условного сообщения: {conditional_message_config}")
    
    # Отправляем сообщение
    try:
        if keyboard is not None:
            await callback_query.message.edit_text(text, reply_markup=keyboard)
        else:
            await callback_query.message.edit_text(text)
    except Exception:
        if keyboard is not None:
            await callback_query.message.answer(text, reply_markup=keyboard)
        else:
            await callback_query.message.answer(text)

@dp.callback_query(lambda c: c.data == "nr3wIiTfBYYmpkkXMNH7n" or c.data.startswith("nr3wIiTfBYYmpkkXMNH7n_btn_"))
async def handle_callback_nr3wIiTfBYYmpkkXMNH7n(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Сохраняем нажатие кнопки в базу данных
    user_id = callback_query.from_user.id
    
    # Ищем текст кнопки по callback_data
    button_display_text = "Да"
    
    # Сохраняем ответ в базу данных
    timestamp = get_moscow_time()
    
    response_data = button_display_text  # Простое значение
    
    # Сохраняем в пользовательские данные
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["button_click"] = button_display_text
    
    # Сохраняем в базу данных с правильным именем переменной
    await update_user_data_in_db(user_id, "желание", button_display_text)
    logging.info(f"Переменная желание сохранена: " + str(button_display_text) + f" (пользователь {user_id})")
    
    text = "Какой твой пол?"
    # Подставляем все доступные переменные пользователя в текст
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    
    # Безопасно извлекаем user_data
    if isinstance(user_record, dict):
        if "user_data" in user_record:
            if isinstance(user_record["user_data"], str):
                try:
                    import json
                    user_vars = json.loads(user_record["user_data"])
                except (json.JSONDecodeError, TypeError):
                    user_vars = {}
            elif isinstance(user_record["user_data"], dict):
                user_vars = user_record["user_data"]
            else:
                user_vars = {}
        else:
            user_vars = user_record
    else:
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
    
    text = replace_variables_in_text(text, user_vars)
    # Активируем сбор пользовательского ввода
    if callback_query.from_user.id not in user_data:
        user_data[callback_query.from_user.id] = {}
    
    user_data[callback_query.from_user.id]["waiting_for_input"] = "nr3wIiTfBYYmpkkXMNH7n"
    user_data[callback_query.from_user.id]["input_type"] = "text"
    user_data[callback_query.from_user.id]["input_variable"] = "пол"
    user_data[callback_query.from_user.id]["save_to_database"] = True
    user_data[callback_query.from_user.id]["input_target_node_id"] = ""
    
    # Создаем inline клавиатуру с кнопками (+ сбор ввода включен)
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="Женщина", callback_data="btn-female"))
    builder.add(InlineKeyboardButton(text="Мужчина", callback_data="btn-male"))
    keyboard = builder.as_markup()
    # Пытаемся редактировать сообщение, если не получается - отправляем новое
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard)
    

@dp.callback_query(lambda c: c.data == "1BHSLWPMao9qQvSAzuzRl" or c.data.startswith("1BHSLWPMao9qQvSAzuzRl_btn_"))
async def handle_callback_1BHSLWPMao9qQvSAzuzRl(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Сохраняем нажатие кнопки в базу данных
    user_id = callback_query.from_user.id
    
    # Ищем текст кнопки по callback_data
    button_display_text = "Нет"
    
    # Сохраняем ответ в базу данных
    timestamp = get_moscow_time()
    
    response_data = button_display_text  # Простое значение
    
    # Сохраняем в пользовательские данные
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["button_click"] = button_display_text
    
    # Сохраняем в базу данных с правильным именем переменной
    await update_user_data_in_db(user_id, "желание", button_display_text)
    logging.info(f"Переменная желание сохранена: " + str(button_display_text) + f" (пользователь {user_id})")
    
    text = "Печально, если что напиши /start или /profile для просмотра профиля"
    # Подставляем все доступные переменные пользователя в текст
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    
    # Безопасно извлекаем user_data
    if isinstance(user_record, dict):
        if "user_data" in user_record:
            if isinstance(user_record["user_data"], str):
                try:
                    import json
                    user_vars = json.loads(user_record["user_data"])
                except (json.JSONDecodeError, TypeError):
                    user_vars = {}
            elif isinstance(user_record["user_data"], dict):
                user_vars = user_record["user_data"]
            else:
                user_vars = {}
        else:
            user_vars = user_record
    else:
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
    
    text = replace_variables_in_text(text, user_vars)
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔄 Начать заново", callback_data="cmd_start"))
    builder.add(InlineKeyboardButton(text="👤 Профиль", callback_data="cmd_profile"))
    keyboard = builder.as_markup()
    # Пытаемся редактировать сообщение, если не получается - отправляем новое
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "H7Sfc4w0d6izui3NABl6m" or c.data.startswith("H7Sfc4w0d6izui3NABl6m_btn_"))
async def handle_callback_H7Sfc4w0d6izui3NABl6m(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Сохраняем нажатие кнопки в базу данных
    user_id = callback_query.from_user.id
    
    # Ищем текст кнопки по callback_data
    # Определяем текст кнопки по callback_data
    button_display_text = "Неизвестная кнопка"
    if callback_query.data.endswith("_btn_0"):
        button_display_text = "Женщина"
    if callback_query.data.endswith("_btn_1"):
        button_display_text = "Мужчина"
    
    # Сохраняем ответ в базу данных
    timestamp = get_moscow_time()
    
    response_data = button_display_text  # Простое значение
    
    # Сохраняем в пользовательские данные
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["button_click"] = button_display_text
    
    # Сохраняем в базу данных с правильным именем переменной
    await update_user_data_in_db(user_id, "пол", button_display_text)
    logging.info(f"Переменная пол сохранена: " + str(button_display_text) + f" (пользователь {user_id})")
    
    # Проверяем условные сообщения
    text = None
    
    # Получаем данные пользователя для проверки условий
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    
    # Безопасно извлекаем user_data
    if isinstance(user_record, dict):
        if "user_data" in user_record:
            if isinstance(user_record["user_data"], str):
                try:
                    import json
                    user_data_dict = json.loads(user_record["user_data"])
                except (json.JSONDecodeError, TypeError):
                    user_data_dict = {}
            elif isinstance(user_record["user_data"], dict):
                user_data_dict = user_record["user_data"]
            else:
                user_data_dict = {}
        else:
            user_data_dict = user_record
    else:
        user_data_dict = {}
    
    # Функция для замены переменных в тексте
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
    
    conditional_parse_mode = None
    conditional_keyboard = None
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        return True, str(raw_value["value"]) if raw_value["value"] is not None else None
                    else:
                        return True, str(raw_value) if raw_value is not None else None
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                return True, str(variable_data["value"]) if variable_data["value"] is not None else None
            elif variable_data is not None:
                return True, str(variable_data)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: имя
    if (
        check_user_variable("имя", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["имя"] = check_user_variable("имя", user_data_dict)
        text = "Введите новое имя"
        conditional_parse_mode = None
        if "{имя}" in text and variable_values["имя"] is not None:
            text = text.replace("{имя}", variable_values["имя"])
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "condition-1753979634576",
            "wait_for_input": True,
            "input_variable": "имя",
            "next_node_id": "profile_command",
            "source_type": "conditional_message"
        }
        
        # Если есть условное сообщение с ожиданием ввода
        if conditional_message_config and conditional_message_config.get("wait_for_input"):
            user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config
            logging.info(f"Активировано ожидание условного ввода: {conditional_message_config}")
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    else:
        text = "Как тебя зовут?"
        text = replace_variables_in_text(text, user_data_dict)
        logging.info("Используется основное сообщение узла")
    
    # Активируем сбор пользовательского ввода
    if callback_query.from_user.id not in user_data:
        user_data[callback_query.from_user.id] = {}
    
    user_data[callback_query.from_user.id]["waiting_for_input"] = "H7Sfc4w0d6izui3NABl6m"
    user_data[callback_query.from_user.id]["input_type"] = "text"
    user_data[callback_query.from_user.id]["input_variable"] = "имя"
    user_data[callback_query.from_user.id]["save_to_database"] = True
    user_data[callback_query.from_user.id]["input_target_node_id"] = "final-message-node"
    
    # Пытаемся редактировать сообщение, если не получается - отправляем новое
    try:
        await callback_query.message.edit_text(text)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text)
    

@dp.callback_query(lambda c: c.data == "--2N9FeeykMHVVlsVnSQW" or c.data.startswith("--2N9FeeykMHVVlsVnSQW_btn_"))
async def handle_callback___2N9FeeykMHVVlsVnSQW(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Сохраняем нажатие кнопки в базу данных
    user_id = callback_query.from_user.id
    
    # Ищем текст кнопки по callback_data
    button_display_text = "Кнопка --2N9FeeykMHVVlsVnSQW"
    
    # Сохраняем ответ в базу данных
    timestamp = get_moscow_time()
    
    response_data = button_display_text  # Простое значение
    
    # Сохраняем в пользовательские данные
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["button_click"] = button_display_text
    
    # Сохраняем в базу данных с правильным именем переменной
    await update_user_data_in_db(user_id, "button_click", button_display_text)
    logging.info(f"Переменная button_click сохранена: " + str(button_display_text) + f" (пользователь {user_id})")
    
    text = "Ты хочешься продолжить свою жизнь с чатом?"
    # Подставляем все доступные переменные пользователя в текст
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    
    # Безопасно извлекаем user_data
    if isinstance(user_record, dict):
        if "user_data" in user_record:
            if isinstance(user_record["user_data"], str):
                try:
                    import json
                    user_vars = json.loads(user_record["user_data"])
                except (json.JSONDecodeError, TypeError):
                    user_vars = {}
            elif isinstance(user_record["user_data"], dict):
                user_vars = user_record["user_data"]
            else:
                user_vars = {}
        else:
            user_vars = user_record
    else:
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
    
    text = replace_variables_in_text(text, user_vars)
    # Активируем сбор пользовательского ввода
    if callback_query.from_user.id not in user_data:
        user_data[callback_query.from_user.id] = {}
    
    user_data[callback_query.from_user.id]["waiting_for_input"] = "--2N9FeeykMHVVlsVnSQW"
    user_data[callback_query.from_user.id]["input_type"] = "text"
    user_data[callback_query.from_user.id]["input_variable"] = "желание"
    user_data[callback_query.from_user.id]["save_to_database"] = True
    user_data[callback_query.from_user.id]["input_target_node_id"] = ""
    
    # Создаем inline клавиатуру с кнопками (+ сбор ввода включен)
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="Да", callback_data="btn-1"))
    builder.add(InlineKeyboardButton(text="Нет", callback_data="btn-2"))
    keyboard = builder.as_markup()
    # Пытаемся редактировать сообщение, если не получается - отправляем новое
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard)
    

@dp.callback_query(lambda c: c.data == "final-message-node" or c.data.startswith("final-message-node_btn_"))
async def handle_callback_final_message_node(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Сохраняем нажатие кнопки в базу данных
    user_id = callback_query.from_user.id
    
    # Ищем текст кнопки по callback_data
    button_display_text = "Кнопка final-message-node"
    
    # Сохраняем ответ в базу данных
    timestamp = get_moscow_time()
    
    response_data = button_display_text  # Простое значение
    
    # Сохраняем в пользовательские данные
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["button_click"] = button_display_text
    
    # Сохраняем в базу данных с правильным именем переменной
    await update_user_data_in_db(user_id, "button_click", button_display_text)
    logging.info(f"Переменная button_click сохранена: " + str(button_display_text) + f" (пользователь {user_id})")
    
    text = """Спасибо за предоставленную информацию! 🎉

Ваш профиль сохранен. Теперь вы можете воспользоваться командой /profile чтобы посмотреть свой профиль."""
    # Подставляем все доступные переменные пользователя в текст
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    
    # Безопасно извлекаем user_data
    if isinstance(user_record, dict):
        if "user_data" in user_record:
            if isinstance(user_record["user_data"], str):
                try:
                    import json
                    user_vars = json.loads(user_record["user_data"])
                except (json.JSONDecodeError, TypeError):
                    user_vars = {}
            elif isinstance(user_record["user_data"], dict):
                user_vars = user_record["user_data"]
            else:
                user_vars = {}
        else:
            user_vars = user_record
    else:
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
    
    text = replace_variables_in_text(text, user_vars)
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="👤 Посмотреть профиль", callback_data="cmd_profile"))
    builder.add(InlineKeyboardButton(text="🔄 Начать заново", callback_data="cmd_start"))
    keyboard = builder.as_markup()
    # Пытаемся редактировать сообщение, если не получается - отправляем новое
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard)


# Универсальный обработчик пользовательского ввода
@dp.message(F.text)
async def handle_user_input(message: types.Message):
    user_id = message.from_user.id
    
    # Проверяем, ожидаем ли мы ввод для условного сообщения
    if user_id in user_data and "waiting_for_conditional_input" in user_data[user_id]:
        config = user_data[user_id]["waiting_for_conditional_input"]
        user_text = message.text
        
        # Сохраняем текстовый ввод для условного сообщения
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
        
        # Отправляем подтверждение
        await message.answer("✅ Спасибо за ваш ответ! Обрабатываю...")
        
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
                    await handle_profile_command(message)
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
                    
                    if next_node_id == "start_node":
                        await handle_callback_start_node(fake_callback)
                    elif next_node_id == "--2N9FeeykMHVVlsVnSQW":
                        await handle_callback___2N9FeeykMHVVlsVnSQW(fake_callback)
                    elif next_node_id == "nr3wIiTfBYYmpkkXMNH7n":
                        await handle_callback_nr3wIiTfBYYmpkkXMNH7n(fake_callback)
                    elif next_node_id == "1BHSLWPMao9qQvSAzuzRl":
                        await handle_callback_1BHSLWPMao9qQvSAzuzRl(fake_callback)
                    elif next_node_id == "final-message-node":
                        await handle_callback_final_message_node(fake_callback)
                    elif next_node_id == "profile_command":
                        await handle_callback_profile_command(fake_callback)
                    elif next_node_id == "H7Sfc4w0d6izui3NABl6m":
                        await handle_callback_H7Sfc4w0d6izui3NABl6m(fake_callback)
                    else:
                        logging.warning(f"Неизвестный следующий узел: {next_node_id}")
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
                else:
                    logging.warning(f"Неизвестная команда: {command}")
            elif option_action == "goto" and option_target:
                # Переход к узлу
                target_node_id = option_target
                try:
                    # Вызываем обработчик для целевого узла
                    if target_node_id == "start_node":
                        await handle_callback_start_node(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "--2N9FeeykMHVVlsVnSQW":
                        await handle_callback___2N9FeeykMHVVlsVnSQW(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "nr3wIiTfBYYmpkkXMNH7n":
                        await handle_callback_nr3wIiTfBYYmpkkXMNH7n(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "1BHSLWPMao9qQvSAzuzRl":
                        await handle_callback_1BHSLWPMao9qQvSAzuzRl(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "final-message-node":
                        await handle_callback_final_message_node(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "profile_command":
                        await handle_callback_profile_command(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "H7Sfc4w0d6izui3NABl6m":
                        await handle_callback_H7Sfc4w0d6izui3NABl6m(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
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
                        if next_node_id == "start_node":
                            await handle_callback_start_node(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "--2N9FeeykMHVVlsVnSQW":
                            await handle_callback___2N9FeeykMHVVlsVnSQW(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "nr3wIiTfBYYmpkkXMNH7n":
                            await handle_callback_nr3wIiTfBYYmpkkXMNH7n(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "1BHSLWPMao9qQvSAzuzRl":
                            await handle_callback_1BHSLWPMao9qQvSAzuzRl(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "final-message-node":
                            await handle_callback_final_message_node(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "profile_command":
                            await handle_callback_profile_command(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "H7Sfc4w0d6izui3NABl6m":
                            await handle_callback_H7Sfc4w0d6izui3NABl6m(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
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
    
    # Проверяем, ожидаем ли мы текстовый ввод от пользователя (универсальная система)
    if user_id in user_data and "waiting_for_input" in user_data[user_id]:
        # Обрабатываем ввод через универсальную систему
        waiting_config = user_data[user_id]["waiting_for_input"]
        
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
        else:
            # Старый формат - waiting_config это строка с node_id
            waiting_node_id = waiting_config
            input_type = user_data[user_id].get("input_type", "text")
            variable_name = user_data[user_id].get("input_variable", "user_response")
            save_to_database = user_data[user_id].get("save_to_database", False)
            min_length = 0
            max_length = 0
            next_node_id = user_data[user_id].get("input_target_node_id")
        
        user_text = message.text
        
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
            
            # Отправляем сообщение об успехе
            success_message = waiting_config.get("success_message", "Спасибо за ваш ответ!")
            await message.answer(success_message)
            
            # Очищаем состояние ожидания ввода
            del user_data[user_id]["waiting_for_input"]
            
            logging.info(f"Получен пользовательский ввод: {variable_name} = {user_text}")
            
            # Навигация к следующему узлу для нового формата
            if next_node_id:
                try:
                    logging.info(f"🚀 Переходим к следующему узлу: {next_node_id}")
                    if next_node_id == "start_node":
                        logging.info(f"Переход к узлу start_node типа start")
                    elif next_node_id == "--2N9FeeykMHVVlsVnSQW":
                        logging.info(f"Переход к узлу --2N9FeeykMHVVlsVnSQW типа keyboard")
                    elif next_node_id == "nr3wIiTfBYYmpkkXMNH7n":
                        logging.info(f"Переход к узлу nr3wIiTfBYYmpkkXMNH7n типа keyboard")
                    elif next_node_id == "1BHSLWPMao9qQvSAzuzRl":
                        text = "Печально, если что напиши /start или /profile для просмотра профиля"
                        await message.answer(text)
                    elif next_node_id == "final-message-node":
                        text = """Спасибо за предоставленную информацию! 🎉

Ваш профиль сохранен. Теперь вы можете воспользоваться командой /profile чтобы посмотреть свой профиль."""
                        await message.answer(text)
                    elif next_node_id == "profile_command":
                        # Выполняем команду /profile
                        from types import SimpleNamespace
                        fake_message = SimpleNamespace()
                        fake_message.from_user = message.from_user
                        fake_message.chat = message.chat
                        fake_message.date = message.date
                        fake_message.answer = message.answer
                        await profile_handler(fake_message)
                    elif next_node_id == "H7Sfc4w0d6izui3NABl6m":
                        text = "Как тебя зовут?"
                        await message.answer(text)
                    else:
                        logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                except Exception as e:
                    logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
            
            return  # Завершаем обработку для нового формата
        
        # Обработка старого формата (для совместимости)
        # Находим узел для получения настроек
        if waiting_node_id == "start_node":
            
            # Сохраняем ответ пользователя
            import datetime
            timestamp = get_moscow_time()
            
            # Сохраняем простое значение для совместимости с логикой профиля
            response_data = user_text  # Простое значение вместо сложного объекта
            
            # Сохраняем в пользовательские данные
            user_data[user_id]["источник"] = response_data
            
            # Сохраняем в базу данных
            saved_to_db = await update_user_data_in_db(user_id, "источник", response_data)
            if saved_to_db:
                logging.info(f"✅ Данные сохранены в БД: источник = {user_text} (пользователь {user_id})")
            else:
                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            await message.answer("✅ Спасибо за ваш ответ!")
            
            # Очищаем состояние ожидания ввода
            del user_data[user_id]["waiting_for_input"]
            
            logging.info(f"Получен пользовательский ввод: источник = {user_text}")
            
            # Переходим к следующему узлу
            try:
                # Создаем фиктивный callback_query для навигации
                import types as aiogram_types
                import asyncio
                fake_callback = aiogram_types.SimpleNamespace(
                    id="input_nav",
                    from_user=message.from_user,
                    chat_instance="",
                    data="--2N9FeeykMHVVlsVnSQW",
                    message=message,
                    answer=lambda text="", show_alert=False: asyncio.sleep(0)
                )
                await handle_callback___2N9FeeykMHVVlsVnSQW(fake_callback)
            except Exception as e:
                logging.error(f"Ошибка при переходе к следующему узлу: {e}")
            return
        elif waiting_node_id == "--2N9FeeykMHVVlsVnSQW":
            
            # Сохраняем ответ пользователя
            import datetime
            timestamp = get_moscow_time()
            
            # Сохраняем простое значение для совместимости с логикой профиля
            response_data = user_text  # Простое значение вместо сложного объекта
            
            # Сохраняем в пользовательские данные
            user_data[user_id]["желание"] = response_data
            
            # Сохраняем в базу данных
            saved_to_db = await update_user_data_in_db(user_id, "желание", response_data)
            if saved_to_db:
                logging.info(f"✅ Данные сохранены в БД: желание = {user_text} (пользователь {user_id})")
            else:
                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            await message.answer("✅ Спасибо за ваш ответ!")
            
            # Очищаем состояние ожидания ввода
            del user_data[user_id]["waiting_for_input"]
            
            logging.info(f"Получен пользовательский ввод: желание = {user_text}")
            
            return
        elif waiting_node_id == "nr3wIiTfBYYmpkkXMNH7n":
            
            # Сохраняем ответ пользователя
            import datetime
            timestamp = get_moscow_time()
            
            # Сохраняем простое значение для совместимости с логикой профиля
            response_data = user_text  # Простое значение вместо сложного объекта
            
            # Сохраняем в пользовательские данные
            user_data[user_id]["пол"] = response_data
            
            # Сохраняем в базу данных
            saved_to_db = await update_user_data_in_db(user_id, "пол", response_data)
            if saved_to_db:
                logging.info(f"✅ Данные сохранены в БД: пол = {user_text} (пользователь {user_id})")
            else:
                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            await message.answer("✅ Спасибо за ваш ответ!")
            
            # Очищаем состояние ожидания ввода
            del user_data[user_id]["waiting_for_input"]
            
            logging.info(f"Получен пользовательский ввод: пол = {user_text}")
            
            return
        elif waiting_node_id == "H7Sfc4w0d6izui3NABl6m":
            
            # Сохраняем ответ пользователя
            import datetime
            timestamp = get_moscow_time()
            
            # Сохраняем простое значение для совместимости с логикой профиля
            response_data = user_text  # Простое значение вместо сложного объекта
            
            # Сохраняем в пользовательские данные
            user_data[user_id]["имя"] = response_data
            
            # Сохраняем в базу данных
            saved_to_db = await update_user_data_in_db(user_id, "имя", response_data)
            if saved_to_db:
                logging.info(f"✅ Данные сохранены в БД: имя = {user_text} (пользователь {user_id})")
            else:
                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
            
            await message.answer("✅ Спасибо за ваш ответ!")
            
            # Очищаем состояние ожидания ввода
            del user_data[user_id]["waiting_for_input"]
            
            logging.info(f"Получен пользовательский ввод: имя = {user_text}")
            
            # Переходим к следующему узлу
            try:
                # Создаем фиктивный callback_query для навигации
                import types as aiogram_types
                import asyncio
                fake_callback = aiogram_types.SimpleNamespace(
                    id="input_nav",
                    from_user=message.from_user,
                    chat_instance="",
                    data="final-message-node",
                    message=message,
                    answer=lambda text="", show_alert=False: asyncio.sleep(0)
                )
                await handle_callback_final_message_node(fake_callback)
            except Exception as e:
                logging.error(f"Ошибка при переходе к следующему узлу: {e}")
            return
        
        # Если узел не найден
        logging.warning(f"Узел для сбора ввода не найден: {waiting_node_id}")
        del user_data[user_id]["waiting_for_input"]
        return
    
    # НОВАЯ ЛОГИКА: Проверяем, включен ли дополнительный сбор ответов для обычных кнопок
    if user_id in user_data and user_data[user_id].get("input_collection_enabled"):
        input_node_id = user_data[user_id].get("input_node_id")
        input_variable = user_data[user_id].get("input_variable", "button_response")
        user_text = message.text
        
        # Сохраняем любой текст как дополнительный ответ
        timestamp = get_moscow_time()
        
        response_data = user_text  # Простое значение
        
        # Сохраняем в пользовательские данные
        user_data[user_id][f"{input_variable}_additional"] = response_data
        
        # Уведомляем пользователя
        await message.answer("✅ Дополнительный комментарий сохранен!")
        
        logging.info(f"Дополнительный текстовый ввод: {input_variable}_additional = {user_text} (пользователь {user_id})")
        return
    
    # Если нет активного ожидания ввода, игнорируем сообщение
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
    
    # Сохраняем ответ пользователя простым значением
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
            if next_node_id == "start_node":
                logging.info(f"Переход к узлу start_node типа start")
            elif next_node_id == "--2N9FeeykMHVVlsVnSQW":
                logging.info(f"Переход к узлу --2N9FeeykMHVVlsVnSQW типа keyboard")
            elif next_node_id == "nr3wIiTfBYYmpkkXMNH7n":
                logging.info(f"Переход к узлу nr3wIiTfBYYmpkkXMNH7n типа keyboard")
            elif next_node_id == "1BHSLWPMao9qQvSAzuzRl":
                text = "Печально, если что напиши /start или /profile для просмотра профиля"
                # Используем parse_mode условного сообщения если он установлен
                if "conditional_parse_mode" in locals() and conditional_parse_mode is not None:
                    parse_mode = conditional_parse_mode
                else:
                    parse_mode = None
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="🔄 Начать заново", callback_data="cmd_start"))
                builder.add(InlineKeyboardButton(text="👤 Профиль", callback_data="cmd_profile"))
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "final-message-node":
                text = """Спасибо за предоставленную информацию! 🎉

Ваш профиль сохранен. Теперь вы можете воспользоваться командой /profile чтобы посмотреть свой профиль."""
                # Используем parse_mode условного сообщения если он установлен
                if "conditional_parse_mode" in locals() and conditional_parse_mode is not None:
                    parse_mode = conditional_parse_mode
                else:
                    parse_mode = None
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="👤 Посмотреть профиль", callback_data="cmd_profile"))
                builder.add(InlineKeyboardButton(text="🔄 Начать заново", callback_data="cmd_start"))
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "profile_command":
                logging.info(f"Переход к узлу profile_command типа command")
            elif next_node_id == "H7Sfc4w0d6izui3NABl6m":
                # Проверяем условные сообщения
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
                
                conditional_parse_mode = None
                conditional_keyboard = None
                # Функция для проверки переменных пользователя
                def check_user_variable(var_name, user_data_dict):
                    """Проверяет существование и получает значение переменной пользователя"""
                    if "user_data" in user_data_dict and user_data_dict["user_data"]:
                        try:
                            import json
                            parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                            if var_name in parsed_data:
                                raw_value = parsed_data[var_name]
                                if isinstance(raw_value, dict) and "value" in raw_value:
                                    return True, str(raw_value["value"]) if raw_value["value"] is not None else None
                                else:
                                    return True, str(raw_value) if raw_value is not None else None
                        except (json.JSONDecodeError, TypeError):
                            pass
                    
                    # Проверяем в локальных данных
                    if var_name in user_data_dict:
                        variable_data = user_data_dict.get(var_name)
                        if isinstance(variable_data, dict) and "value" in variable_data:
                            return True, str(variable_data["value"]) if variable_data["value"] is not None else None
                        elif variable_data is not None:
                            return True, str(variable_data)
                    
                    return False, None
                
                # Условие 1: user_data_exists для переменных: имя
                if (
                    check_user_variable("имя", user_data_dict)[0]
                ):
                    # Собираем значения переменных
                    variable_values = {}
                    _, variable_values["имя"] = check_user_variable("имя", user_data_dict)
                    text = "Введите новое имя"
                    conditional_parse_mode = None
                    if "{имя}" in text and variable_values["имя"] is not None:
                        text = text.replace("{имя}", variable_values["имя"])
                    # Настраиваем ожидание текстового ввода для условного сообщения
                    conditional_message_config = {
                        "condition_id": "condition-1753979634576",
                        "wait_for_input": True,
                        "input_variable": "имя",
                        "next_node_id": "profile_command",
                        "source_type": "conditional_message"
                    }
                    
                    # Если есть условное сообщение с ожиданием ввода
                    if conditional_message_config and conditional_message_config.get("wait_for_input"):
                        user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config
                        logging.info(f"Активировано ожидание условного ввода: {conditional_message_config}")
                    logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
                else:
                    text = "Как тебя зовут?"
                    logging.info("Используется основное сообщение узла")
                
                # Используем parse_mode условного сообщения если он установлен
                if "conditional_parse_mode" in locals() and conditional_parse_mode is not None:
                    parse_mode = conditional_parse_mode
                else:
                    parse_mode = None
                await message.answer(text, parse_mode=parse_mode)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")


# Обработчики для кнопок команд

@dp.callback_query(lambda c: c.data == "cmd_start")
async def handle_cmd_start(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Симулируем выполнение команды /start
    
    # Создаем fake message object для команды
    from types import SimpleNamespace
    fake_message = SimpleNamespace()
    fake_message.from_user = callback_query.from_user
    fake_message.chat = callback_query.message.chat
    fake_message.date = callback_query.message.date
    fake_message.answer = callback_query.message.answer
    fake_message.edit_text = callback_query.message.edit_text
    
    # Вызываем start handler
    await start_handler(fake_message)
    logging.info(f"Команда /start выполнена через callback кнопку (пользователь {callback_query.from_user.id})")

@dp.callback_query(lambda c: c.data == "cmd_profile")
async def handle_cmd_profile(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Симулируем выполнение команды /profile
    
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
