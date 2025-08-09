"""
Новый бот 3 - Telegram Bot
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
BOT_TOKEN = "7552080497:AAEJFmsxmY8PnDzgoUpM5NDg5E1ehNYAHYU"

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

    # ВАЖНО: ВСЕГДА восстанавливаем состояние множественного выбора из БД
    # Это критически важно для кнопок "Изменить выбор" и "Начать заново"
    user_record = await get_user_from_db(user_id)
    saved_interests = []
    
    if user_record and isinstance(user_record, dict):
        user_data_field = user_record.get("user_data", {})
        if isinstance(user_data_field, str):
            import json
            try:
                user_vars = json.loads(user_data_field)
            except:
                user_vars = {}
        elif isinstance(user_data_field, dict):
            user_vars = user_data_field
        else:
            user_vars = {}
        
        # Ищем сохраненные интересы в любой переменной
        for var_name, var_data in user_vars.items():
            if "интерес" in var_name.lower() or var_name == "user_interests":
                if isinstance(var_data, str) and var_data:
                    saved_interests = [interest.strip() for interest in var_data.split(",")]
                    logging.info(f"Восстановлены интересы из переменной {var_name}: {saved_interests}")
                    break
    
    # ВСЕГДА инициализируем состояние множественного выбора с восстановленными интересами
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["multi_select_start_paste_1754763479408_yxlwvygg3"] = saved_interests.copy()
    user_data[user_id]["multi_select_node"] = "start_paste_1754763479408_yxlwvygg3"
    logging.info(f"Инициализировано состояние множественного выбора с {len(saved_interests)} интересами")
    
    text = """🌟 Привет от ᴠᴨᴩᴏᴦʏᴧᴋᴇ Bot!

Этот бот поможет тебе найти интересных людей в Санкт-Петербурге!

Откуда ты узнал о нашем чате? 😎"""
    # Определяем режим форматирования (приоритет у условного сообщения)
    if "conditional_parse_mode" in locals() and conditional_parse_mode is not None:
        current_parse_mode = conditional_parse_mode
    else:
        current_parse_mode = None
    # Инициализируем переменную для проверки условной клавиатуры
    use_conditional_keyboard = False
    conditional_keyboard = None
    await message.answer(text, parse_mode=current_parse_mode if current_parse_mode else None)
    
    # Устанавливаем состояние ожидания ввода
    user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
    user_data[message.from_user.id]["waiting_for_input"] = "start_paste_1754763479408_yxlwvygg3"

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "gender_selection_paste_1754763546579_7r7nqz000" or c.data.startswith("gender_selection_paste_1754763546579_7r7nqz000_btn_"))
async def handle_callback_gender_selection_paste_1754763546579_7r7nqz000(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "Да 😎"
    
    # Сохраняем правильную переменную в базу данных
    await update_user_data_in_db(user_id, "join_request_response", button_text)
    logging.info(f"Переменная join_request_response сохранена: " + str(button_text) + f" (пользователь {user_id})")
    
    
    # Отправляем сообщение для узла gender_selection_paste_1754763546579_7r7nqz000
    text = "Укажи свой пол: 👨👩"
    
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
    keyboard = None
    # Проверяем, есть ли условная клавиатура
    if keyboard is None:
        # Создаем inline клавиатуру для целевого узла
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="Мужчина 👨", callback_data="age_input_paste_1754763573843_59yyvyhj6_btn_0"))
        builder.add(InlineKeyboardButton(text="Женщина 👩", callback_data="age_input_paste_1754763573843_59yyvyhj6_btn_1"))
        builder.adjust(2)  # Используем 2 колонки для консистентности
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

@dp.callback_query(lambda c: c.data == "decline_response_paste_1754763524270_2oxeuqlbi" or c.data.startswith("decline_response_paste_1754763524270_2oxeuqlbi_btn_"))
async def handle_callback_decline_response_paste_1754763524270_2oxeuqlbi(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "Нет 🙅"
    
    # Сохраняем правильную переменную в базу данных
    await update_user_data_in_db(user_id, "join_request_response", button_text)
    logging.info(f"Переменная join_request_response сохранена: " + str(button_text) + f" (пользователь {user_id})")
    
    
    # Отправляем сообщение для узла decline_response_paste_1754763524270_2oxeuqlbi
    text = "Понятно! Если передумаешь, напиши /start! 😊"
    
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
    keyboard = None
    if keyboard is None:
        keyboard = None
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

@dp.callback_query(lambda c: c.data == "age_input_paste_1754763573843_59yyvyhj6" or c.data.startswith("age_input_paste_1754763573843_59yyvyhj6_btn_"))
async def handle_callback_age_input_paste_1754763573843_59yyvyhj6(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "Мужчина 👨"
    
    # Сохраняем правильную переменную в базу данных
    await update_user_data_in_db(user_id, "gender", button_text)
    logging.info(f"Переменная gender сохранена: " + str(button_text) + f" (пользователь {user_id})")
    
    
    # Отправляем сообщение для узла age_input_paste_1754763573843_59yyvyhj6
    text = """Сколько тебе лет? 🎂

Напиши свой возраст числом (например, 25):"""
    
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
    keyboard = None
    if keyboard is None:
        keyboard = None
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

@dp.callback_query(lambda c: c.data == "age_input_paste_1754763573843_59yyvyhj6" or c.data.startswith("age_input_paste_1754763573843_59yyvyhj6_btn_"))
async def handle_callback_age_input_paste_1754763573843_59yyvyhj6(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "Женщина 👩"
    
    # Сохраняем правильную переменную в базу данных
    await update_user_data_in_db(user_id, "gender", button_text)
    logging.info(f"Переменная gender сохранена: " + str(button_text) + f" (пользователь {user_id})")
    
    
    # Отправляем сообщение для узла age_input_paste_1754763573843_59yyvyhj6
    text = """Сколько тебе лет? 🎂

Напиши свой возраст числом (например, 25):"""
    
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
    keyboard = None
    if keyboard is None:
        keyboard = None
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

@dp.callback_query(lambda c: c.data == "join_request_paste_1754763509326_6tfusxc82" or c.data.startswith("join_request_paste_1754763509326_6tfusxc82_btn_"))
async def handle_callback_join_request_paste_1754763509326_6tfusxc82(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    # Сохраняем правильную переменную в базу данных
    await update_user_data_in_db(user_id, "join_request_response", callback_query.data)
    logging.info(f"Переменная join_request_response сохранена: " + str(callback_query.data) + f" (пользователь {user_id})")
    
    # Обрабатываем узел join_request_paste_1754763509326_6tfusxc82: join_request_paste_1754763509326_6tfusxc82
    text = "Хочешь присоединиться к нашему чату? 🚀"
    
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
    # Create inline keyboard
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="Да 😎", callback_data="gender_selection_paste_1754763546579_7r7nqz000_btn_0"))
    builder.add(InlineKeyboardButton(text="Нет 🙅", callback_data="decline_response_paste_1754763524270_2oxeuqlbi_btn_1"))
    keyboard = builder.as_markup()
    # Отправляем сообщение
    try:
        if keyboard:
            await callback_query.message.edit_text(text, reply_markup=keyboard)
        else:
            await callback_query.message.edit_text(text)
    except Exception:
        if keyboard:
            await callback_query.message.answer(text, reply_markup=keyboard)
        else:
            await callback_query.message.answer(text)
    # Сохраняем нажатие кнопки в базу данных
    user_id = callback_query.from_user.id
    
    # Ищем текст кнопки по callback_data
    button_display_text = "Кнопка join_request_paste_1754763509326_6tfusxc82"
    
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
    
    # Показываем сообщение об обработке
    await callback_query.answer("✅ Спасибо за ваш ответ! Обрабатываю...")
    
    # ПЕРЕАДРЕСАЦИЯ: Переходим к следующему узлу после сохранения данных
    next_node_id = "join_request_paste_1754763509326_6tfusxc82"
    try:
        logging.info(f"🚀 Переходим к следующему узлу после выбора кнопки: {next_node_id}")
        if next_node_id == "start_paste_1754763479408_yxlwvygg3":
            logging.info("Переход к узлу start_paste_1754763479408_yxlwvygg3")
        elif next_node_id == "join_request_paste_1754763509326_6tfusxc82":
            nav_text = "Хочешь присоединиться к нашему чату? 🚀"
            await callback_query.message.edit_text(nav_text)
            # Настраиваем ожидание ввода для message узла в навигации
            user_id = callback_query.from_user.id
            if user_id not in user_data:
                user_data[user_id] = {}
            user_data[user_id]["waiting_for_input"] = {
                "type": "text",
                "variable": "join_request_response",
                "save_to_database": True,
                "node_id": "join_request_paste_1754763509326_6tfusxc82",
                "next_node_id": "",
                "min_length": 0,
                "max_length": 0,
                "retry_message": "Пожалуйста, попробуйте еще раз.",
                "success_message": "Спасибо за ваш ответ!"
            }
        elif next_node_id == "decline_response_paste_1754763524270_2oxeuqlbi":
            nav_text = "Понятно! Если передумаешь, напиши /start! 😊"
            await callback_query.message.edit_text(nav_text)
        elif next_node_id == "gender_selection_paste_1754763546579_7r7nqz000":
            nav_text = "Укажи свой пол: 👨👩"
            await callback_query.message.edit_text(nav_text)
            # Настраиваем ожидание ввода для message узла в навигации
            user_id = callback_query.from_user.id
            if user_id not in user_data:
                user_data[user_id] = {}
            user_data[user_id]["waiting_for_input"] = {
                "type": "text",
                "variable": "gender",
                "save_to_database": True,
                "node_id": "gender_selection_paste_1754763546579_7r7nqz000",
                "next_node_id": "",
                "min_length": 0,
                "max_length": 0,
                "retry_message": "Пожалуйста, попробуйте еще раз.",
                "success_message": "Спасибо за ваш ответ!"
            }
        elif next_node_id == "age_input_paste_1754763573843_59yyvyhj6":
            nav_text = """Сколько тебе лет? 🎂

Напиши свой возраст числом (например, 25):"""
            await callback_query.message.edit_text(nav_text)
            # Настраиваем ожидание ввода для message узла в навигации
            user_id = callback_query.from_user.id
            if user_id not in user_data:
                user_data[user_id] = {}
            user_data[user_id]["waiting_for_input"] = {
                "type": "text",
                "variable": "user_age",
                "save_to_database": True,
                "node_id": "age_input_paste_1754763573843_59yyvyhj6",
                "next_node_id": "metro_selection_paste_1754763624467_b9hmrnf0x",
                "min_length": 0,
                "max_length": 0,
                "retry_message": "Пожалуйста, попробуйте еще раз.",
                "success_message": "Спасибо за ваш ответ!"
            }
        elif next_node_id == "metro_selection_paste_1754763624467_b9hmrnf0x":
            nav_text = """На какой станции метро ты обычно бываешь? 🚇

Можешь выбрать несколько веток:"""
            await callback_query.message.edit_text(nav_text)
        else:
            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
    except Exception as e:
        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
    
    return  # Завершаем обработку после переадресации
    
    text = "Хочешь присоединиться к нашему чату? 🚀"
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
    
    user_data[callback_query.from_user.id]["waiting_for_input"] = "join_request_paste_1754763509326_6tfusxc82"
    user_data[callback_query.from_user.id]["input_type"] = "text"
    user_data[callback_query.from_user.id]["input_variable"] = "join_request_response"
    user_data[callback_query.from_user.id]["save_to_database"] = True
    user_data[callback_query.from_user.id]["input_target_node_id"] = ""
    
    # Проверяем, есть ли условная клавиатура
    if "keyboard" not in locals() or keyboard is None:
        # Создаем inline клавиатуру с кнопками (+ сбор ввода включен)
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="Да 😎", callback_data="btn-yes"))
        builder.add(InlineKeyboardButton(text="Нет 🙅", callback_data="btn-no"))
        keyboard = builder.as_markup()
    # Пытаемся редактировать сообщение, если не получается - отправляем новое
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard)
    

@dp.callback_query(lambda c: c.data == "metro_selection_paste_1754763624467_b9hmrnf0x" or c.data.startswith("metro_selection_paste_1754763624467_b9hmrnf0x_btn_"))
async def handle_callback_metro_selection_paste_1754763624467_b9hmrnf0x(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    # Обрабатываем узел metro_selection_paste_1754763624467_b9hmrnf0x: metro_selection_paste_1754763624467_b9hmrnf0x
    text = """На какой станции метро ты обычно бываешь? 🚇

Можешь выбрать несколько веток:"""
    
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
    # Create inline keyboard
    builder = InlineKeyboardBuilder()
    keyboard = builder.as_markup()
    # Отправляем сообщение
    try:
        if keyboard:
            await callback_query.message.edit_text(text, reply_markup=keyboard)
        else:
            await callback_query.message.edit_text(text)
    except Exception:
        if keyboard:
            await callback_query.message.answer(text, reply_markup=keyboard)
        else:
            await callback_query.message.answer(text)
    # Сохраняем нажатие кнопки в базу данных
    user_id = callback_query.from_user.id
    
    # Ищем текст кнопки по callback_data
    button_display_text = "Кнопка metro_selection_paste_1754763624467_b9hmrnf0x"
    
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
    
    # Показываем сообщение об обработке
    await callback_query.answer("✅ Спасибо за ваш ответ! Обрабатываю...")
    
    # ПЕРЕАДРЕСАЦИЯ: Переходим к следующему узлу после сохранения данных
    next_node_id = "metro_selection_paste_1754763624467_b9hmrnf0x"
    try:
        logging.info(f"🚀 Переходим к следующему узлу после выбора кнопки: {next_node_id}")
        if next_node_id == "start_paste_1754763479408_yxlwvygg3":
            logging.info("Переход к узлу start_paste_1754763479408_yxlwvygg3")
        elif next_node_id == "join_request_paste_1754763509326_6tfusxc82":
            nav_text = "Хочешь присоединиться к нашему чату? 🚀"
            await callback_query.message.edit_text(nav_text)
            # Настраиваем ожидание ввода для message узла в навигации
            user_id = callback_query.from_user.id
            if user_id not in user_data:
                user_data[user_id] = {}
            user_data[user_id]["waiting_for_input"] = {
                "type": "text",
                "variable": "join_request_response",
                "save_to_database": True,
                "node_id": "join_request_paste_1754763509326_6tfusxc82",
                "next_node_id": "",
                "min_length": 0,
                "max_length": 0,
                "retry_message": "Пожалуйста, попробуйте еще раз.",
                "success_message": "Спасибо за ваш ответ!"
            }
        elif next_node_id == "decline_response_paste_1754763524270_2oxeuqlbi":
            nav_text = "Понятно! Если передумаешь, напиши /start! 😊"
            await callback_query.message.edit_text(nav_text)
        elif next_node_id == "gender_selection_paste_1754763546579_7r7nqz000":
            nav_text = "Укажи свой пол: 👨👩"
            await callback_query.message.edit_text(nav_text)
            # Настраиваем ожидание ввода для message узла в навигации
            user_id = callback_query.from_user.id
            if user_id not in user_data:
                user_data[user_id] = {}
            user_data[user_id]["waiting_for_input"] = {
                "type": "text",
                "variable": "gender",
                "save_to_database": True,
                "node_id": "gender_selection_paste_1754763546579_7r7nqz000",
                "next_node_id": "",
                "min_length": 0,
                "max_length": 0,
                "retry_message": "Пожалуйста, попробуйте еще раз.",
                "success_message": "Спасибо за ваш ответ!"
            }
        elif next_node_id == "age_input_paste_1754763573843_59yyvyhj6":
            nav_text = """Сколько тебе лет? 🎂

Напиши свой возраст числом (например, 25):"""
            await callback_query.message.edit_text(nav_text)
            # Настраиваем ожидание ввода для message узла в навигации
            user_id = callback_query.from_user.id
            if user_id not in user_data:
                user_data[user_id] = {}
            user_data[user_id]["waiting_for_input"] = {
                "type": "text",
                "variable": "user_age",
                "save_to_database": True,
                "node_id": "age_input_paste_1754763573843_59yyvyhj6",
                "next_node_id": "metro_selection_paste_1754763624467_b9hmrnf0x",
                "min_length": 0,
                "max_length": 0,
                "retry_message": "Пожалуйста, попробуйте еще раз.",
                "success_message": "Спасибо за ваш ответ!"
            }
        elif next_node_id == "metro_selection_paste_1754763624467_b9hmrnf0x":
            nav_text = """На какой станции метро ты обычно бываешь? 🚇

Можешь выбрать несколько веток:"""
            await callback_query.message.edit_text(nav_text)
        else:
            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
    except Exception as e:
        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
    
    return  # Завершаем обработку после переадресации
    
    text = """На какой станции метро ты обычно бываешь? 🚇

Можешь выбрать несколько веток:"""
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
                    
                    if next_node_id == "start_paste_1754763479408_yxlwvygg3":
                        await handle_callback_start_paste_1754763479408_yxlwvygg3(fake_callback)
                    elif next_node_id == "join_request_paste_1754763509326_6tfusxc82":
                        await handle_callback_join_request_paste_1754763509326_6tfusxc82(fake_callback)
                    elif next_node_id == "decline_response_paste_1754763524270_2oxeuqlbi":
                        await handle_callback_decline_response_paste_1754763524270_2oxeuqlbi(fake_callback)
                    elif next_node_id == "gender_selection_paste_1754763546579_7r7nqz000":
                        await handle_callback_gender_selection_paste_1754763546579_7r7nqz000(fake_callback)
                    elif next_node_id == "age_input_paste_1754763573843_59yyvyhj6":
                        await handle_callback_age_input_paste_1754763573843_59yyvyhj6(fake_callback)
                    elif next_node_id == "metro_selection_paste_1754763624467_b9hmrnf0x":
                        await handle_callback_metro_selection_paste_1754763624467_b9hmrnf0x(fake_callback)
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
                else:
                    logging.warning(f"Неизвестная команда: {command}")
            elif option_action == "goto" and option_target:
                # Переход к узлу
                target_node_id = option_target
                try:
                    # Вызываем обработчик для целевого узла
                    if target_node_id == "start_paste_1754763479408_yxlwvygg3":
                        await handle_callback_start_paste_1754763479408_yxlwvygg3(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "join_request_paste_1754763509326_6tfusxc82":
                        await handle_callback_join_request_paste_1754763509326_6tfusxc82(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "decline_response_paste_1754763524270_2oxeuqlbi":
                        await handle_callback_decline_response_paste_1754763524270_2oxeuqlbi(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "gender_selection_paste_1754763546579_7r7nqz000":
                        await handle_callback_gender_selection_paste_1754763546579_7r7nqz000(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "age_input_paste_1754763573843_59yyvyhj6":
                        await handle_callback_age_input_paste_1754763573843_59yyvyhj6(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "metro_selection_paste_1754763624467_b9hmrnf0x":
                        await handle_callback_metro_selection_paste_1754763624467_b9hmrnf0x(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
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
                        if next_node_id == "start_paste_1754763479408_yxlwvygg3":
                            await handle_callback_start_paste_1754763479408_yxlwvygg3(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "join_request_paste_1754763509326_6tfusxc82":
                            await handle_callback_join_request_paste_1754763509326_6tfusxc82(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "decline_response_paste_1754763524270_2oxeuqlbi":
                            await handle_callback_decline_response_paste_1754763524270_2oxeuqlbi(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "gender_selection_paste_1754763546579_7r7nqz000":
                            await handle_callback_gender_selection_paste_1754763546579_7r7nqz000(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "age_input_paste_1754763573843_59yyvyhj6":
                            await handle_callback_age_input_paste_1754763573843_59yyvyhj6(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "metro_selection_paste_1754763624467_b9hmrnf0x":
                            await handle_callback_metro_selection_paste_1754763624467_b9hmrnf0x(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
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
                    if next_node_id == "start_paste_1754763479408_yxlwvygg3":
                        logging.info(f"Переход к узлу start_paste_1754763479408_yxlwvygg3 типа start")
                    elif next_node_id == "join_request_paste_1754763509326_6tfusxc82":
                        text = "Хочешь присоединиться к нашему чату? 🚀"
                        # Замена переменных в тексте
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
                        await message.answer(text)
                        # Настраиваем ожидание ввода для message узла
                        user_data[user_id]["waiting_for_input"] = {
                            "type": "text",
                            "variable": "join_request_response",
                            "save_to_database": True,
                            "node_id": "join_request_paste_1754763509326_6tfusxc82",
                            "next_node_id": "",
                            "min_length": 0,
                            "max_length": 0,
                            "retry_message": "Пожалуйста, попробуйте еще раз.",
                            "success_message": "Спасибо за ваш ответ!"
                        }
                    elif next_node_id == "decline_response_paste_1754763524270_2oxeuqlbi":
                        text = "Понятно! Если передумаешь, напиши /start! 😊"
                        # Замена переменных в тексте
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
                        await message.answer(text)
                    elif next_node_id == "gender_selection_paste_1754763546579_7r7nqz000":
                        text = "Укажи свой пол: 👨👩"
                        # Замена переменных в тексте
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
                        await message.answer(text)
                        # Настраиваем ожидание ввода для message узла
                        user_data[user_id]["waiting_for_input"] = {
                            "type": "text",
                            "variable": "gender",
                            "save_to_database": True,
                            "node_id": "gender_selection_paste_1754763546579_7r7nqz000",
                            "next_node_id": "",
                            "min_length": 0,
                            "max_length": 0,
                            "retry_message": "Пожалуйста, попробуйте еще раз.",
                            "success_message": "Спасибо за ваш ответ!"
                        }
                    elif next_node_id == "age_input_paste_1754763573843_59yyvyhj6":
                        text = """Сколько тебе лет? 🎂

Напиши свой возраст числом (например, 25):"""
                        # Замена переменных в тексте
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
                        await message.answer(text)
                        # Настраиваем ожидание ввода для message узла
                        user_data[user_id]["waiting_for_input"] = {
                            "type": "text",
                            "variable": "user_age",
                            "save_to_database": True,
                            "node_id": "age_input_paste_1754763573843_59yyvyhj6",
                            "next_node_id": "metro_selection_paste_1754763624467_b9hmrnf0x",
                            "min_length": 0,
                            "max_length": 0,
                            "retry_message": "Пожалуйста, попробуйте еще раз.",
                            "success_message": "Спасибо за ваш ответ!"
                        }
                    elif next_node_id == "metro_selection_paste_1754763624467_b9hmrnf0x":
                        text = """На какой станции метро ты обычно бываешь? 🚇

Можешь выбрать несколько веток:"""
                        # Замена переменных в тексте
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
                        # Создаем inline клавиатуру
                        builder = InlineKeyboardBuilder()
                        keyboard = builder.as_markup()
                        await message.answer(text, reply_markup=keyboard)
                    else:
                        logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                except Exception as e:
                    logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
            
            return  # Завершаем обработку для нового формата
        
        # Обработка старого формата (для совместимости)
        # Находим узел для получения настроек
        if waiting_node_id == "start_paste_1754763479408_yxlwvygg3":
            
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
            
            await message.answer("✅ Спасибо за ваш ответ!")
            
            # Очищаем состояние ожидания ввода
            del user_data[user_id]["waiting_for_input"]
            
            logging.info(f"Получен пользовательский ввод: user_source = {user_text}")
            
            # Переходим к следующему узлу
            try:
                # Отправляем сообщение для узла join_request_paste_1754763509326_6tfusxc82
                text = "Хочешь присоединиться к нашему чату? 🚀"
                # Настраиваем новое ожидание ввода для узла join_request_paste_1754763509326_6tfusxc82
                user_data[user_id]["waiting_for_input"] = {
                    "type": "text",
                    "variable": "join_request_response",
                    "save_to_database": True,
                    "node_id": "join_request_paste_1754763509326_6tfusxc82",
                    "next_node_id": "",
                    "min_length": 0,
                    "max_length": 0,
                    "retry_message": "Пожалуйста, попробуйте еще раз.",
                    "success_message": "Спасибо за ваш ответ!"
                }
                
                builder = InlineKeyboardBuilder()
                # Функция для определения количества колонок на основе текста кнопок
                def calculate_keyboard_width(buttons_data):
                    max_text_length = max([len(btn_text) for btn_text in buttons_data] + [0])
                    if max_text_length <= 6:  # Короткие тексты
                        return 3  # 3 колонки
                    elif max_text_length <= 12:  # Средние тексты
                        return 2  # 2 колонки
                    else:  # Длинные тексты
                        return 1  # 1 колонка
                
                button_texts = ["Да 😎", "Нет 🙅"]
                keyboard_width = calculate_keyboard_width(button_texts)
                
                builder.add(InlineKeyboardButton(text="Да 😎", callback_data="gender_selection_paste_1754763546579_7r7nqz000"))
                builder.add(InlineKeyboardButton(text="Нет 🙅", callback_data="decline_response_paste_1754763524270_2oxeuqlbi"))
                builder.adjust(keyboard_width)  # Умное расположение кнопок
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard)
                logging.info("✅ Переход к следующему узлу выполнен успешно")
            except Exception as e:
                logging.error(f"Ошибка при переходе к следующему узлу: {e}")
            return
        elif waiting_node_id == "join_request_paste_1754763509326_6tfusxc82":
            
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
            
            await message.answer("✅ Спасибо за ваш ответ!")
            
            # Очищаем состояние ожидания ввода
            del user_data[user_id]["waiting_for_input"]
            
            logging.info(f"Получен пользовательский ввод: join_request_response = {user_text}")
            
            return
        elif waiting_node_id == "gender_selection_paste_1754763546579_7r7nqz000":
            
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
            
            await message.answer("✅ Спасибо за ваш ответ!")
            
            # Очищаем состояние ожидания ввода
            del user_data[user_id]["waiting_for_input"]
            
            logging.info(f"Получен пользовательский ввод: gender = {user_text}")
            
            return
        elif waiting_node_id == "age_input_paste_1754763573843_59yyvyhj6":
            
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
            
            await message.answer("✅ Спасибо за ваш ответ!")
            
            # Очищаем состояние ожидания ввода
            del user_data[user_id]["waiting_for_input"]
            
            logging.info(f"Получен пользовательский ввод: user_age = {user_text}")
            
            # Переходим к следующему узлу
            try:
                # Отправляем сообщение для узла metro_selection_paste_1754763624467_b9hmrnf0x
                text = """На какой станции метро ты обычно бываешь? 🚇

Можешь выбрать несколько веток:"""
                builder = InlineKeyboardBuilder()
                # Функция для определения количества колонок на основе текста кнопок
                def calculate_keyboard_width(buttons_data):
                    max_text_length = max([len(btn_text) for btn_text in buttons_data] + [0])
                    if max_text_length <= 6:  # Короткие тексты
                        return 3  # 3 колонки
                    elif max_text_length <= 12:  # Средние тексты
                        return 2  # 2 колонки
                    else:  # Длинные тексты
                        return 1  # 1 колонка
                
                button_texts = ["Красная ветка 🟥", "Синяя ветка 🟦", "Зелёная ветка 🟩", "Оранжевая ветка 🟧", "Фиолетовая ветка 🟪", "Я из ЛО 🏡", "Я не в Питере 🌍"]
                keyboard_width = calculate_keyboard_width(button_texts)
                
                builder.add(InlineKeyboardButton(text="Красная ветка 🟥", callback_data="red_line"))
                builder.add(InlineKeyboardButton(text="Синяя ветка 🟦", callback_data="blue_line"))
                builder.add(InlineKeyboardButton(text="Зелёная ветка 🟩", callback_data="green_line"))
                builder.add(InlineKeyboardButton(text="Оранжевая ветка 🟧", callback_data="orange_line"))
                builder.add(InlineKeyboardButton(text="Фиолетовая ветка 🟪", callback_data="purple_line"))
                builder.add(InlineKeyboardButton(text="Я из ЛО 🏡", callback_data="lo_cities"))
                builder.add(InlineKeyboardButton(text="Я не в Питере 🌍", callback_data="not_in_spb"))
                builder.adjust(keyboard_width)  # Умное расположение кнопок
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard)
                logging.info("✅ Переход к следующему узлу выполнен успешно")
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
            
            # Создаем фейковое сообщение для навигации
            fake_message = type("FakeMessage", (), {})()
            fake_message.from_user = message.from_user
            fake_message.answer = message.answer
            fake_message.delete = lambda: None
            
            # Находим узел по ID и выполняем соответствующее действие
            if next_node_id == "start_paste_1754763479408_yxlwvygg3":
                logging.info(f"Переход к узлу start_paste_1754763479408_yxlwvygg3 типа start")
            elif next_node_id == "join_request_paste_1754763509326_6tfusxc82":
                text = "Хочешь присоединиться к нашему чату? 🚀"
                # Используем parse_mode условного сообщения если он установлен
                if "conditional_parse_mode" in locals() and conditional_parse_mode is not None:
                    parse_mode = conditional_parse_mode
                else:
                    parse_mode = None
                builder = InlineKeyboardBuilder()
                # Функция для определения количества колонок на основе текста кнопок
                def calculate_keyboard_width(buttons_data):
                    max_text_length = max([len(btn_text) for btn_text in buttons_data] + [0])
                    if max_text_length <= 6:  # Короткие тексты
                        return 3  # 3 колонки
                    elif max_text_length <= 12:  # Средние тексты
                        return 2  # 2 колонки
                    else:  # Длинные тексты
                        return 1  # 1 колонка
                
                button_texts = ["Да 😎", "Нет 🙅"]
                keyboard_width = calculate_keyboard_width(button_texts)
                
                builder.add(InlineKeyboardButton(text="Да 😎", callback_data="gender_selection_paste_1754763546579_7r7nqz000"))
                builder.add(InlineKeyboardButton(text="Нет 🙅", callback_data="decline_response_paste_1754763524270_2oxeuqlbi"))
                builder.adjust(keyboard_width)  # Умное расположение кнопок
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "decline_response_paste_1754763524270_2oxeuqlbi":
                text = "Понятно! Если передумаешь, напиши /start! 😊"
                # Используем parse_mode условного сообщения если он установлен
                if "conditional_parse_mode" in locals() and conditional_parse_mode is not None:
                    parse_mode = conditional_parse_mode
                else:
                    parse_mode = None
                await message.answer(text, parse_mode=parse_mode)
            elif next_node_id == "gender_selection_paste_1754763546579_7r7nqz000":
                text = "Укажи свой пол: 👨👩"
                # Используем parse_mode условного сообщения если он установлен
                if "conditional_parse_mode" in locals() and conditional_parse_mode is not None:
                    parse_mode = conditional_parse_mode
                else:
                    parse_mode = None
                builder = InlineKeyboardBuilder()
                # Функция для определения количества колонок на основе текста кнопок
                def calculate_keyboard_width(buttons_data):
                    max_text_length = max([len(btn_text) for btn_text in buttons_data] + [0])
                    if max_text_length <= 6:  # Короткие тексты
                        return 3  # 3 колонки
                    elif max_text_length <= 12:  # Средние тексты
                        return 2  # 2 колонки
                    else:  # Длинные тексты
                        return 1  # 1 колонка
                
                button_texts = ["Мужчина 👨", "Женщина 👩"]
                keyboard_width = calculate_keyboard_width(button_texts)
                
                builder.add(InlineKeyboardButton(text="Мужчина 👨", callback_data="age_input_paste_1754763573843_59yyvyhj6"))
                builder.add(InlineKeyboardButton(text="Женщина 👩", callback_data="age_input_paste_1754763573843_59yyvyhj6"))
                builder.adjust(keyboard_width)  # Умное расположение кнопок
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "age_input_paste_1754763573843_59yyvyhj6":
                text = """Сколько тебе лет? 🎂

Напиши свой возраст числом (например, 25):"""
                # Используем parse_mode условного сообщения если он установлен
                if "conditional_parse_mode" in locals() and conditional_parse_mode is not None:
                    parse_mode = conditional_parse_mode
                else:
                    parse_mode = None
                await message.answer(text, parse_mode=parse_mode)
            elif next_node_id == "metro_selection_paste_1754763624467_b9hmrnf0x":
                text = """На какой станции метро ты обычно бываешь? 🚇

Можешь выбрать несколько веток:"""
                # Используем parse_mode условного сообщения если он установлен
                if "conditional_parse_mode" in locals() and conditional_parse_mode is not None:
                    parse_mode = conditional_parse_mode
                else:
                    parse_mode = None
                builder = InlineKeyboardBuilder()
                # Функция для определения количества колонок на основе текста кнопок
                def calculate_keyboard_width(buttons_data):
                    max_text_length = max([len(btn_text) for btn_text in buttons_data] + [0])
                    if max_text_length <= 6:  # Короткие тексты
                        return 3  # 3 колонки
                    elif max_text_length <= 12:  # Средние тексты
                        return 2  # 2 колонки
                    else:  # Длинные тексты
                        return 1  # 1 колонка
                
                button_texts = ["Красная ветка 🟥", "Синяя ветка 🟦", "Зелёная ветка 🟩", "Оранжевая ветка 🟧", "Фиолетовая ветка 🟪", "Я из ЛО 🏡", "Я не в Питере 🌍"]
                keyboard_width = calculate_keyboard_width(button_texts)
                
                builder.adjust(keyboard_width)  # Умное расположение кнопок
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")


# Обработчик для условных кнопок
@dp.callback_query(lambda c: c.data.startswith("conditional_"))
async def handle_conditional_button(callback_query: types.CallbackQuery):
    await callback_query.answer()
    
    # Парсим callback_data: conditional_variableName_value
    callback_parts = callback_query.data.split("_", 2)
    if len(callback_parts) >= 3:
        variable_name = callback_parts[1]
        variable_value = callback_parts[2]
        
        user_id = callback_query.from_user.id
        
        # Сохраняем значение в базу данных
        await update_user_data_in_db(user_id, variable_name, variable_value)
        
        # Сохраняем в локальные данные
        if user_id not in user_data:
            user_data[user_id] = {}
        user_data[user_id][variable_name] = variable_value
        
        logging.info(f"Условная кнопка: {variable_name} = {variable_value} (пользователь {user_id})")
        
        # После обновления значения автоматически вызываем профиль
        await callback_query.answer(f"✅ {variable_name} обновлено")
        
        # Создаем имитацию сообщения для вызова команды профиль
        class FakeMessage:
            def __init__(self, callback_query):
                self.from_user = callback_query.from_user
                self.chat = callback_query.message.chat
                self.date = callback_query.message.date
                self.message_id = callback_query.message.message_id
            
            async def answer(self, text, parse_mode=None, reply_markup=None):
                if reply_markup:
                    await bot.send_message(self.chat.id, text, parse_mode=parse_mode, reply_markup=reply_markup)
                else:
                    await bot.send_message(self.chat.id, text, parse_mode=parse_mode)
            
            async def edit_text(self, text, parse_mode=None, reply_markup=None):
                try:
                    await bot.edit_message_text(text, self.chat.id, self.message_id, parse_mode=parse_mode, reply_markup=reply_markup)
                except Exception:
                    await self.answer(text, parse_mode, reply_markup)
        
        fake_message = FakeMessage(callback_query)
        
        # Вызываем обработчик профиля
        try:
            await profile_handler(fake_message)
        except Exception as e:
            logging.error(f"Ошибка вызова profile_handler: {e}")
            await callback_query.message.answer(f"✅ Значение {variable_name} обновлено на: {variable_value}")
    else:
        logging.warning(f"Неверный формат условной кнопки: {callback_query.data}")
        await callback_query.answer("❌ Ошибка обработки кнопки", show_alert=True)



# Обработчик команды профиля с поддержкой variableLabel
@dp.message(Command("profile"))
async def profile_handler(message: types.Message):
    user_id = message.from_user.id
    
    # Получаем данные пользователя из базы данных
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    
    # Извлекаем пользовательские данные
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
    
    if not user_vars:
        await message.answer("👤 Профиль недоступен\n\nПохоже, вы еще не прошли опрос. Пожалуйста, введите /start чтобы заполнить профиль.")
        return
    
    # Формируем сообщение профиля с поддержкой variableLabel
    profile_text = "👤 Ваш профиль:\n\n"
    
    # Отображаем все доступные переменные
    for var_name, var_data in user_vars.items():
        if isinstance(var_data, dict) and "value" in var_data:
            value = var_data["value"]
        else:
            value = var_data
        profile_text += f"{var_name}: {value}\n"
    
    await message.answer(profile_text)
    logging.info(f"Профиль отображен для пользователя {user_id}")



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


# Обработчики для множественного выбора
@dp.callback_query(lambda c: c.data.startswith("multi_select_"))
async def handle_multi_select_callback(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    callback_data = callback_query.data
    
    if callback_data.startswith("multi_select_done_"):
        # Завершение множественного выбора
        node_id = callback_data.replace("multi_select_done_", "")
        selected_options = user_data.get(user_id, {}).get(f"multi_select_{node_id}", [])
        
        # Сохраняем выбранные опции в базу данных
        if selected_options:
            selected_text = ", ".join(selected_options)
            if node_id == "metro_selection_paste_1754763624467_b9hmrnf0x":
                await save_user_data_to_db(user_id, "metro_lines", selected_text)
            # Резервное сохранение если узел не найден
            if not any(node_id == node for node in ["metro_selection_paste_1754763624467_b9hmrnf0x"]):
                await save_user_data_to_db(user_id, f"multi_select_{node_id}", selected_text)
        
        # Очищаем состояние множественного выбора
        if user_id in user_data:
            user_data[user_id].pop(f"multi_select_{node_id}", None)
            user_data[user_id].pop("multi_select_node", None)
        
        # Переходим к следующему узлу, если указан
        # Определяем следующий узел для каждого node_id
        if node_id == "metro_selection_paste_1754763624467_b9hmrnf0x":
        return
    
    # Обработка выбора опции
    parts = callback_data.split("_")
    if len(parts) >= 3:
        node_id = parts[2]
        button_id = "_".join(parts[3:]) if len(parts) > 3 else parts[2]
        
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
        if node_id == "metro_selection_paste_1754763624467_b9hmrnf0x":
            if button_id == "red_line":
                button_text = "Красная ветка 🟥"
            if button_id == "blue_line":
                button_text = "Синяя ветка 🟦"
            if button_id == "green_line":
                button_text = "Зелёная ветка 🟩"
            if button_id == "orange_line":
                button_text = "Оранжевая ветка 🟧"
            if button_id == "purple_line":
                button_text = "Фиолетовая ветка 🟪"
            if button_id == "lo_cities":
                button_text = "Я из ЛО 🏡"
            if button_id == "not_in_spb":
                button_text = "Я не в Питере 🌍"
        
        if button_text:
            selected_list = user_data[user_id][f"multi_select_{node_id}"]
            if button_text in selected_list:
                # Убираем из выбранных
                selected_list.remove(button_text)
            else:
                # Добавляем к выбранным
                selected_list.append(button_text)
            
            # Обновляем клавиатуру с галочками
            builder = InlineKeyboardBuilder()
            if node_id == "metro_selection_paste_1754763624467_b9hmrnf0x":
                # Оптимальное количество колонок для кнопок интересов
                keyboard_width = 2  # Консистентное количество колонок для множественного выбора
                
                # Добавляем кнопки выбора с умным расположением
                # Проверяем каждый интерес и добавляем галочку если он выбран
                red_line_selected = any("Красная ветка 🟥" in interest or "red_line" in interest.lower() for interest in selected_list)
                red_line_text = "✅ Красная ветка 🟥" if red_line_selected else "Красная ветка 🟥"
                builder.add(InlineKeyboardButton(text=red_line_text, callback_data="multi_select_metro_selection_paste_1754763624467_b9hmrnf0x_red_line"))
                # Проверяем каждый интерес и добавляем галочку если он выбран
                blue_line_selected = any("Синяя ветка 🟦" in interest or "blue_line" in interest.lower() for interest in selected_list)
                blue_line_text = "✅ Синяя ветка 🟦" if blue_line_selected else "Синяя ветка 🟦"
                builder.add(InlineKeyboardButton(text=blue_line_text, callback_data="multi_select_metro_selection_paste_1754763624467_b9hmrnf0x_blue_line"))
                # Проверяем каждый интерес и добавляем галочку если он выбран
                green_line_selected = any("Зелёная ветка 🟩" in interest or "green_line" in interest.lower() for interest in selected_list)
                green_line_text = "✅ Зелёная ветка 🟩" if green_line_selected else "Зелёная ветка 🟩"
                builder.add(InlineKeyboardButton(text=green_line_text, callback_data="multi_select_metro_selection_paste_1754763624467_b9hmrnf0x_green_line"))
                # Проверяем каждый интерес и добавляем галочку если он выбран
                orange_line_selected = any("Оранжевая ветка 🟧" in interest or "orange_line" in interest.lower() for interest in selected_list)
                orange_line_text = "✅ Оранжевая ветка 🟧" if orange_line_selected else "Оранжевая ветка 🟧"
                builder.add(InlineKeyboardButton(text=orange_line_text, callback_data="multi_select_metro_selection_paste_1754763624467_b9hmrnf0x_orange_line"))
                # Проверяем каждый интерес и добавляем галочку если он выбран
                purple_line_selected = any("Фиолетовая ветка 🟪" in interest or "purple_line" in interest.lower() for interest in selected_list)
                purple_line_text = "✅ Фиолетовая ветка 🟪" if purple_line_selected else "Фиолетовая ветка 🟪"
                builder.add(InlineKeyboardButton(text=purple_line_text, callback_data="multi_select_metro_selection_paste_1754763624467_b9hmrnf0x_purple_line"))
                # Проверяем каждый интерес и добавляем галочку если он выбран
                lo_cities_selected = any("Я из ЛО 🏡" in interest or "lo_cities" in interest.lower() for interest in selected_list)
                lo_cities_text = "✅ Я из ЛО 🏡" if lo_cities_selected else "Я из ЛО 🏡"
                builder.add(InlineKeyboardButton(text=lo_cities_text, callback_data="multi_select_metro_selection_paste_1754763624467_b9hmrnf0x_lo_cities"))
                # Проверяем каждый интерес и добавляем галочку если он выбран
                not_in_spb_selected = any("Я не в Питере 🌍" in interest or "not_in_spb" in interest.lower() for interest in selected_list)
                not_in_spb_text = "✅ Я не в Питере 🌍" if not_in_spb_selected else "Я не в Питере 🌍"
                builder.add(InlineKeyboardButton(text=not_in_spb_text, callback_data="multi_select_metro_selection_paste_1754763624467_b9hmrnf0x_not_in_spb"))
                builder.add(InlineKeyboardButton(text="Готово", callback_data="multi_select_done_metro_selection_paste_1754763624467_b9hmrnf0x"))
                builder.adjust(keyboard_width)
            
            keyboard = builder.as_markup()
            await callback_query.message.edit_reply_markup(reply_markup=keyboard)

# Обработчик для reply кнопок множественного выбора
@dp.message()
async def handle_multi_select_reply(message: types.Message):
    user_id = message.from_user.id
    user_input = message.text
    
    # Проверяем, находится ли пользователь в режиме множественного выбора reply
    if user_id in user_data and "multi_select_node" in user_data[user_id] and user_data[user_id].get("multi_select_type") == "reply":
        node_id = user_data[user_id]["multi_select_node"]
        
        if node_id == "metro_selection_paste_1754763624467_b9hmrnf0x" and user_input == "Готово":
            # Завершение множественного выбора для узла metro_selection_paste_1754763624467_b9hmrnf0x
            selected_options = user_data.get(user_id, {}).get("multi_select_{node_id}", [])
            if selected_options:
                selected_text = ", ".join(selected_options)
                await save_user_data_to_db(user_id, "metro_lines", selected_text)
            
            # Очищаем состояние
            user_data[user_id].pop("multi_select_{node_id}", None)
            user_data[user_id].pop("multi_select_node", None)
            user_data[user_id].pop("multi_select_type", None)
            
            return
        
        # Обработка выбора опции
        if node_id == "metro_selection_paste_1754763624467_b9hmrnf0x":
            if user_input == "Красная ветка 🟥":
                if "multi_select_{node_id}" not in user_data[user_id]:
                    user_data[user_id]["multi_select_{node_id}"] = []
                
                selected_list = user_data[user_id]["multi_select_{node_id}"]
                if "Красная ветка 🟥" in selected_list:
                    selected_list.remove("Красная ветка 🟥")
                    await message.answer("❌ Убрано: Красная ветка 🟥")
                else:
                    selected_list.append("Красная ветка 🟥")
                    await message.answer("✅ Выбрано: Красная ветка 🟥")
                return
            
            if user_input == "Синяя ветка 🟦":
                if "multi_select_{node_id}" not in user_data[user_id]:
                    user_data[user_id]["multi_select_{node_id}"] = []
                
                selected_list = user_data[user_id]["multi_select_{node_id}"]
                if "Синяя ветка 🟦" in selected_list:
                    selected_list.remove("Синяя ветка 🟦")
                    await message.answer("❌ Убрано: Синяя ветка 🟦")
                else:
                    selected_list.append("Синяя ветка 🟦")
                    await message.answer("✅ Выбрано: Синяя ветка 🟦")
                return
            
            if user_input == "Зелёная ветка 🟩":
                if "multi_select_{node_id}" not in user_data[user_id]:
                    user_data[user_id]["multi_select_{node_id}"] = []
                
                selected_list = user_data[user_id]["multi_select_{node_id}"]
                if "Зелёная ветка 🟩" in selected_list:
                    selected_list.remove("Зелёная ветка 🟩")
                    await message.answer("❌ Убрано: Зелёная ветка 🟩")
                else:
                    selected_list.append("Зелёная ветка 🟩")
                    await message.answer("✅ Выбрано: Зелёная ветка 🟩")
                return
            
            if user_input == "Оранжевая ветка 🟧":
                if "multi_select_{node_id}" not in user_data[user_id]:
                    user_data[user_id]["multi_select_{node_id}"] = []
                
                selected_list = user_data[user_id]["multi_select_{node_id}"]
                if "Оранжевая ветка 🟧" in selected_list:
                    selected_list.remove("Оранжевая ветка 🟧")
                    await message.answer("❌ Убрано: Оранжевая ветка 🟧")
                else:
                    selected_list.append("Оранжевая ветка 🟧")
                    await message.answer("✅ Выбрано: Оранжевая ветка 🟧")
                return
            
            if user_input == "Фиолетовая ветка 🟪":
                if "multi_select_{node_id}" not in user_data[user_id]:
                    user_data[user_id]["multi_select_{node_id}"] = []
                
                selected_list = user_data[user_id]["multi_select_{node_id}"]
                if "Фиолетовая ветка 🟪" in selected_list:
                    selected_list.remove("Фиолетовая ветка 🟪")
                    await message.answer("❌ Убрано: Фиолетовая ветка 🟪")
                else:
                    selected_list.append("Фиолетовая ветка 🟪")
                    await message.answer("✅ Выбрано: Фиолетовая ветка 🟪")
                return
            
            if user_input == "Я из ЛО 🏡":
                if "multi_select_{node_id}" not in user_data[user_id]:
                    user_data[user_id]["multi_select_{node_id}"] = []
                
                selected_list = user_data[user_id]["multi_select_{node_id}"]
                if "Я из ЛО 🏡" in selected_list:
                    selected_list.remove("Я из ЛО 🏡")
                    await message.answer("❌ Убрано: Я из ЛО 🏡")
                else:
                    selected_list.append("Я из ЛО 🏡")
                    await message.answer("✅ Выбрано: Я из ЛО 🏡")
                return
            
            if user_input == "Я не в Питере 🌍":
                if "multi_select_{node_id}" not in user_data[user_id]:
                    user_data[user_id]["multi_select_{node_id}"] = []
                
                selected_list = user_data[user_id]["multi_select_{node_id}"]
                if "Я не в Питере 🌍" in selected_list:
                    selected_list.remove("Я не в Питере 🌍")
                    await message.answer("❌ Убрано: Я не в Питере 🌍")
                else:
                    selected_list.append("Я не в Питере 🌍")
                    await message.answer("✅ Выбрано: Я не в Питере 🌍")
                return
            
    
    # Если не множественный выбор, передаем дальше по цепочке обработчиков
    pass

if __name__ == "__main__":
    asyncio.run(main())
