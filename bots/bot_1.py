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

async def update_user_variable_in_db(user_id: int, variable_name: str, variable_value: str):
    """Сохраняет переменную пользователя в базу данных"""
    if not db_pool:
        return False
    try:
        async with db_pool.acquire() as conn:
            await conn.execute("""
                UPDATE bot_users 
                SET user_data = user_data || $2::jsonb,
                    last_interaction = NOW()
                WHERE user_id = $1
            """, user_id, json.dumps({variable_name: variable_value}))
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
    
    # Проверяем условие: user_data_exists
    # Проверяем существование переменной с учетом структуры данных
    variable_exists = False
    variable_value = None
    logging.info(f"Проверяем переменную 'источник' в user_data_dict: {user_data_dict}")
    if "источник" in user_data_dict:
        variable_data = user_data_dict.get("источник")
        logging.info(f"Найдена переменная 'источник': {variable_data}")
        if isinstance(variable_data, dict) and "value" in variable_data:
            variable_value = variable_data["value"]
            variable_exists = variable_value is not None
            logging.info(f"Структура dict с value: {variable_value}")
        elif variable_data is not None:
            variable_value = str(variable_data)
            variable_exists = True
            logging.info(f"Простое значение: {variable_value}")
    else:
        logging.info(f"Переменная 'источник' не найдена в user_data_dict")
    if variable_exists:
        text = """С возвращением! 👋
Вы пришли к нам из источника: {источник}

Рады видеть вас снова!"""
        text = replace_variables_in_text(text, user_data_dict)
        logging.info(f"Условие выполнено: переменная источник = {variable_value}")
    else:
        text = """Привет! 🌟
Добро пожаловать в наш бот!
Откуда вы узнали о нас?"""
        logging.info("Используется основное сообщение узла")
    
    
    # Создаем inline клавиатуру (+ дополнительный сбор ответов включен)
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔍 Поиск в интернете", callback_data="source_search"))
    builder.add(InlineKeyboardButton(text="👥 Друзья", callback_data="source_friends"))
    builder.add(InlineKeyboardButton(text="📱 Реклама", callback_data="source_ads"))
    keyboard = builder.as_markup()
    await message.answer(text, reply_markup=keyboard)
    
    # Дополнительно: настраиваем сбор пользовательских ответов
    user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
    user_data[message.from_user.id]["input_collection_enabled"] = True
    user_data[message.from_user.id]["input_node_id"] = "start_node"
    user_data[message.from_user.id]["input_variable"] = "источник"

@dp.message(Command("help"))
async def help_handler(message: types.Message):
    logging.info(f"Команда /help вызвана пользователем {message.from_user.id}")
    # Сохраняем пользователя и статистику использования команд
    user_id = message.from_user.id
    username = message.from_user.username
    first_name = message.from_user.first_name
    last_name = message.from_user.last_name
    
    # Сохраняем пользователя в базу данных
    saved_to_db = await save_user_to_db(user_id, username, first_name, last_name)
    
    # Обновляем статистику команд в БД
    if saved_to_db:
        await update_user_data_in_db(user_id, "command_help", datetime.now().isoformat())
    
    # Резервное сохранение в локальное хранилище
    if user_id not in user_data:
        user_data[user_id] = {}
    if "commands_used" not in user_data[user_id]:
        user_data[user_id]["commands_used"] = {}
    user_data[user_id]["commands_used"]["/help"] = user_data[user_id]["commands_used"].get("/help", 0) + 1

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
    
    # Проверяем условие: user_data_exists
    # Проверяем существование переменной с учетом структуры данных
    variable_exists = False
    variable_value = None
    logging.info(f"Проверяем переменную 'источник' в user_data_dict: {user_data_dict}")
    if "источник" in user_data_dict:
        variable_data = user_data_dict.get("источник")
        logging.info(f"Найдена переменная 'источник': {variable_data}")
        if isinstance(variable_data, dict) and "value" in variable_data:
            variable_value = variable_data["value"]
            variable_exists = variable_value is not None
            logging.info(f"Структура dict с value: {variable_value}")
        elif variable_data is not None:
            variable_value = str(variable_data)
            variable_exists = True
            logging.info(f"Простое значение: {variable_value}")
    else:
        logging.info(f"Переменная 'источник' не найдена в user_data_dict")
    if variable_exists:
        text = """📖 Расширенная справка

Вы уже знакомы с ботом! Вот дополнительные возможности:

🔄 /start - персональное приветствие
📊 /stats - ваша статистика"""
        text = replace_variables_in_text(text, user_data_dict)
        logging.info(f"Условие выполнено: переменная источник = {variable_value}")
    else:
        text = """📖 Базовая справка

Этот бот показывает, как работают условные сообщения:

1. При первом /start вы увидите обычное приветствие
2. Выберите источник
3. При повторном /start - персональное сообщение

Команды:
🔄 /start - запуск
❓ /help - эта справка
📊 /stats - статистика"""
        logging.info("Используется запасное сообщение")
    
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

@dp.message(Command("stats"))
async def stats_handler(message: types.Message):
    logging.info(f"Команда /stats вызвана пользователем {message.from_user.id}")
    # Сохраняем пользователя и статистику использования команд
    user_id = message.from_user.id
    username = message.from_user.username
    first_name = message.from_user.first_name
    last_name = message.from_user.last_name
    
    # Сохраняем пользователя в базу данных
    saved_to_db = await save_user_to_db(user_id, username, first_name, last_name)
    
    # Обновляем статистику команд в БД
    if saved_to_db:
        await update_user_data_in_db(user_id, "command_stats", datetime.now().isoformat())
    
    # Резервное сохранение в локальное хранилище
    if user_id not in user_data:
        user_data[user_id] = {}
    if "commands_used" not in user_data[user_id]:
        user_data[user_id]["commands_used"] = {}
    user_data[user_id]["commands_used"]["/stats"] = user_data[user_id]["commands_used"].get("/stats", 0) + 1

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
    
    # Проверяем условие: user_data_exists
    # Проверяем существование переменной с учетом структуры данных
    variable_exists = False
    variable_value = None
    logging.info(f"Проверяем переменную 'источник' в user_data_dict: {user_data_dict}")
    if "источник" in user_data_dict:
        variable_data = user_data_dict.get("источник")
        logging.info(f"Найдена переменная 'источник': {variable_data}")
        if isinstance(variable_data, dict) and "value" in variable_data:
            variable_value = variable_data["value"]
            variable_exists = variable_value is not None
            logging.info(f"Структура dict с value: {variable_value}")
        elif variable_data is not None:
            variable_value = str(variable_data)
            variable_exists = True
            logging.info(f"Простое значение: {variable_value}")
    else:
        logging.info(f"Переменная 'источник' не найдена в user_data_dict")
    if variable_exists:
        text = """📊 Ваша статистика:

🔍 Источник: {источник}
👤 Статус: Постоянный пользователь
🎯 Персонализация: Включена"""
        text = replace_variables_in_text(text, user_data_dict)
        logging.info(f"Условие выполнено: переменная источник = {variable_value}")
    else:
        text = """📊 Статистика

👤 Статус: Новый пользователь
🔍 Источник: Не указан
🎯 Персонализация: Отключена

Выберите источник в /start для активации персонализации!"""
        logging.info("Используется запасное сообщение")
    
    # Отправляем сообщение без клавиатуры (удаляем reply клавиатуру если была)
    await message.answer(text, reply_markup=ReplyKeyboardRemove())

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "source_search")
async def handle_callback_source_search(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "🔍 Поиск в интернете"
    
    # Сохраняем правильную переменную в базу данных
    await update_user_data_in_db(user_id, "источник", "из инета")
    logging.info(f"Переменная источник сохранена: " + str("из инета") + f" (пользователь {user_id})")
    
    text = """Отлично! 🎯
Теперь мы знаем, что вы нашли нас через поиск.

Попробуйте снова написать /start чтобы увидеть персонализированное приветствие!"""
    # Подставляем все доступные переменные пользователя в текст
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    
    # Безопасно извлекаем user_data
    if isinstance(user_record, dict):
        if "user_data" in user_record and isinstance(user_record["user_data"], dict):
            user_vars = user_record["user_data"]
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

@dp.callback_query(lambda c: c.data == "source_friends")
async def handle_callback_source_friends(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "👥 Друзья"
    
    # Сохраняем правильную переменную в базу данных
    await update_user_data_in_db(user_id, "источник", "friends")
    logging.info(f"Переменная источник сохранена: " + str("friends") + f" (пользователь {user_id})")
    
    text = """Замечательно! 👥
Значит, вас порекомендовали друзья!

Теперь попробуйте /start еще раз - увидите, как изменится приветствие!"""
    # Подставляем все доступные переменные пользователя в текст
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    
    # Безопасно извлекаем user_data
    if isinstance(user_record, dict):
        if "user_data" in user_record and isinstance(user_record["user_data"], dict):
            user_vars = user_record["user_data"]
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

@dp.callback_query(lambda c: c.data == "source_ads")
async def handle_callback_source_ads(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "📱 Реклама"
    
    # Сохраняем правильную переменную в базу данных
    await update_user_data_in_db(user_id, "источник", "ads")
    logging.info(f"Переменная источник сохранена: " + str("ads") + f" (пользователь {user_id})")
    
    text = """Понятно! 📱
Вы пришли из рекламы.

Введите /start снова, чтобы увидеть персональное сообщение!"""
    # Подставляем все доступные переменные пользователя в текст
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    
    # Безопасно извлекаем user_data
    if isinstance(user_record, dict):
        if "user_data" in user_record and isinstance(user_record["user_data"], dict):
            user_vars = user_record["user_data"]
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
                elif command == "/stats":
                    try:
                        await _stats_handler(fake_message)
                    except Exception as e:
                        logging.error(f"Ошибка выполнения команды /stats: {e}")
                else:
                    logging.warning(f"Неизвестная команда: {command}")
            elif option_action == "goto" and option_target:
                # Переход к узлу
                target_node_id = option_target
                try:
                    # Вызываем обработчик для целевого узла
                    if target_node_id == "start_node":
                        await handle_callback_start_node(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "source_search":
                        await handle_callback_source_search(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "source_friends":
                        await handle_callback_source_friends(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "source_ads":
                        await handle_callback_source_ads(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "help_command":
                        await handle_callback_help_command(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "stats_command":
                        await handle_callback_stats_command(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
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
                        elif next_node_id == "source_search":
                            await handle_callback_source_search(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "source_friends":
                            await handle_callback_source_friends(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "source_ads":
                            await handle_callback_source_ads(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "help_command":
                            await handle_callback_help_command(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "stats_command":
                            await handle_callback_stats_command(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
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
        waiting_node_id = user_data[user_id]["waiting_for_input"]
        input_type = user_data[user_id].get("input_type", "text")
        user_text = message.text
        
        # Находим узел для получения настроек
        if waiting_node_id == "start_node":
            
            # Сохраняем ответ пользователя
            import datetime
            timestamp = datetime.datetime.now().isoformat()
            
            # Создаем структурированный ответ
            response_data = {
                "value": user_text,
                "type": "text",
                "timestamp": timestamp,
                "nodeId": "start_node",
                "variable": "источник"
            }
            
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
        import datetime
        timestamp = datetime.datetime.now().isoformat()
        
        response_data = {
            "value": user_text,
            "type": "text_addition",
            "timestamp": timestamp,
            "nodeId": input_node_id,
            "variable": input_variable,
            "source": "additional_text_input"
        }
        
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
            if next_node_id == "start_node":
                logging.info(f"Переход к узлу start_node типа start")
            elif next_node_id == "source_search":
                text = """Отлично! 🎯
Теперь мы знаем, что вы нашли нас через поиск.

Попробуйте снова написать /start чтобы увидеть персонализированное приветствие!"""
                parse_mode = None
                builder = InlineKeyboardBuilder()
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "source_friends":
                text = """Замечательно! 👥
Значит, вас порекомендовали друзья!

Теперь попробуйте /start еще раз - увидите, как изменится приветствие!"""
                parse_mode = None
                builder = InlineKeyboardBuilder()
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "source_ads":
                text = """Понятно! 📱
Вы пришли из рекламы.

Введите /start снова, чтобы увидеть персональное сообщение!"""
                parse_mode = None
                builder = InlineKeyboardBuilder()
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "help_command":
                logging.info(f"Переход к узлу help_command типа command")
            elif next_node_id == "stats_command":
                logging.info(f"Переход к узлу stats_command типа command")
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
