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

    text = """👋 Добро пожаловать!

Расскажите нам о ваших интересах. Выберите все, что вам подходит:"""
    # Определяем режим форматирования (приоритет у условного сообщения)
    if "conditional_parse_mode" in locals() and conditional_parse_mode is not None:
        current_parse_mode = conditional_parse_mode
    else:
        current_parse_mode = None
    # Инициализируем переменную для проверки условной клавиатуры
    use_conditional_keyboard = False
    conditional_keyboard = None
    
    # Проверяем, нужно ли использовать условную клавиатуру
    if use_conditional_keyboard:
        await message.answer(text, reply_markup=conditional_keyboard, parse_mode=current_parse_mode if current_parse_mode else None)
    else:
        # Создаем inline клавиатуру с поддержкой множественного выбора
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="⚽ Спорт", callback_data=f"multi_select_start_btn-sport"))
        builder.add(InlineKeyboardButton(text="🎵 Музыка", callback_data=f"multi_select_start_btn-music"))
        builder.add(InlineKeyboardButton(text="📚 Книги", callback_data=f"multi_select_start_btn-books"))
        builder.add(InlineKeyboardButton(text="✈️ Путешествия", callback_data=f"multi_select_start_btn-travel"))
        builder.add(InlineKeyboardButton(text="💻 Технологии", callback_data=f"multi_select_start_btn-tech"))
        builder.add(InlineKeyboardButton(text="🍳 Кулинария", callback_data=f"multi_select_start_btn-cooking"))
        builder.add(InlineKeyboardButton(text="🎨 Искусство", callback_data=f"multi_select_start_btn-art"))
        builder.add(InlineKeyboardButton(text="🎮 Игры", callback_data=f"multi_select_start_btn-games"))
        builder.add(InlineKeyboardButton(text="Готово", callback_data=f"multi_select_done_start"))
        builder.adjust(2)
        keyboard = builder.as_markup()
        await message.answer(text, reply_markup=keyboard, parse_mode=current_parse_mode if current_parse_mode else None)
        
        # Инициализируем состояние множественного выбора
        user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
        user_data[message.from_user.id]["multi_select_start"] = []
        user_data[message.from_user.id]["multi_select_node"] = "start"

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "final_message" or c.data.startswith("final_message_btn_"))
async def handle_callback_final_message(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "👍 Продолжить"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    # Отправляем сообщение для узла final_message
    text = """✅ Отлично! Ваши предпочтения сохранены.

Теперь вы будете получать персонализированные рекомендации на основе ваших интересов."""
    
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
        builder.add(InlineKeyboardButton(text="🔄 Начать заново", callback_data="start_btn_0"))
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

@dp.callback_query(lambda c: c.data == "start" or c.data.startswith("start_btn_"))
async def handle_callback_start(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "✏️ Изменить выбор"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    # Обрабатываем узел start: start
    text = """👋 Добро пожаловать!

Расскажите нам о ваших интересах. Выберите все, что вам подходит:"""
    
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
    
    # ИСПРАВЛЕНО: Создаем inline клавиатуру с кнопками интересов для множественного выбора
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="⚽ Спорт", callback_data=f"multi_select_start_btn-sport"))
    builder.add(InlineKeyboardButton(text="🎵 Музыка", callback_data=f"multi_select_start_btn-music"))
    builder.add(InlineKeyboardButton(text="📚 Книги", callback_data=f"multi_select_start_btn-books"))
    builder.add(InlineKeyboardButton(text="✈️ Путешествия", callback_data=f"multi_select_start_btn-travel"))
    builder.add(InlineKeyboardButton(text="💻 Технологии", callback_data=f"multi_select_start_btn-tech"))
    builder.add(InlineKeyboardButton(text="🍳 Кулинария", callback_data=f"multi_select_start_btn-cooking"))
    builder.add(InlineKeyboardButton(text="🎨 Искусство", callback_data=f"multi_select_start_btn-art"))
    builder.add(InlineKeyboardButton(text="🎮 Игры", callback_data=f"multi_select_start_btn-games"))
    builder.add(InlineKeyboardButton(text="Готово", callback_data=f"multi_select_done_start"))
    builder.adjust(2)  # Размещаем кнопки в 2 колонки
    keyboard = builder.as_markup()
    
    # Инициализируем состояние множественного выбора
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["multi_select_start"] = []
    user_data[user_id]["multi_select_node"] = "start"
    
    # Отправляем сообщение start узла с кнопками интересов
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard)
    except Exception:
        await callback_query.message.answer(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "start" or c.data.startswith("start_btn_"))
async def handle_callback_start(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "🔄 Начать заново"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    # Обрабатываем узел start: start
    text = """👋 Добро пожаловать!

Расскажите нам о ваших интересах. Выберите все, что вам подходит:"""
    
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
        # Создаем inline клавиатуру для start узла
        builder = InlineKeyboardBuilder()
        keyboard = builder.as_markup()
    # Отправляем сообщение start узла
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

@dp.callback_query(lambda c: c.data == "interests_result" or c.data.startswith("interests_result_btn_"))
async def handle_callback_interests_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Handle interests_result node
    user_id = callback_query.from_user.id
    text = """🎯 Ваши интересы:

{user_interests}

Спасибо за информацию! Теперь мы сможем предложить вам более подходящий контент."""
    
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
    builder.add(InlineKeyboardButton(text="👍 Продолжить", callback_data="final_message_btn_0"))
    builder.add(InlineKeyboardButton(text="✏️ Изменить выбор", callback_data="start_btn_1"))
    keyboard = builder.as_markup()
    await bot.send_message(user_id, text, reply_markup=keyboard)



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
                    
                    if next_node_id == "start":
                        await handle_callback_start(fake_callback)
                    elif next_node_id == "interests_result":
                        await handle_callback_interests_result(fake_callback)
                    elif next_node_id == "final_message":
                        await handle_callback_final_message(fake_callback)
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
                    if target_node_id == "start":
                        await handle_callback_start(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "interests_result":
                        await handle_callback_interests_result(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "final_message":
                        await handle_callback_final_message(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
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
                        elif next_node_id == "interests_result":
                            await handle_callback_interests_result(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "final_message":
                            await handle_callback_final_message(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
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
                    if next_node_id == "start":
                        logging.info(f"Переход к узлу start типа start")
                    elif next_node_id == "interests_result":
                        text = """🎯 Ваши интересы:

{user_interests}

Спасибо за информацию! Теперь мы сможем предложить вам более подходящий контент."""
                        await message.answer(text)
                    elif next_node_id == "final_message":
                        text = """✅ Отлично! Ваши предпочтения сохранены.

Теперь вы будете получать персонализированные рекомендации на основе ваших интересов."""
                        await message.answer(text)
                    else:
                        logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                except Exception as e:
                    logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
            
            return  # Завершаем обработку для нового формата
        
        # Обработка старого формата (для совместимости)
        # Находим узел для получения настроек
        
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
            if next_node_id == "start":
                logging.info(f"Переход к узлу start типа start")
            elif next_node_id == "interests_result":
                text = """🎯 Ваши интересы:

{user_interests}

Спасибо за информацию! Теперь мы сможем предложить вам более подходящий контент."""
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
                
                button_texts = ["👍 Продолжить", "✏️ Изменить выбор"]
                keyboard_width = calculate_keyboard_width(button_texts)
                
                builder.add(InlineKeyboardButton(text="👍 Продолжить", callback_data="final_message"))
                builder.add(InlineKeyboardButton(text="✏️ Изменить выбор", callback_data="start"))
                builder.adjust(keyboard_width)  # Умное расположение кнопок
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "final_message":
                text = """✅ Отлично! Ваши предпочтения сохранены.

Теперь вы будете получать персонализированные рекомендации на основе ваших интересов."""
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
                
                button_texts = ["🔄 Начать заново"]
                keyboard_width = calculate_keyboard_width(button_texts)
                
                builder.add(InlineKeyboardButton(text="🔄 Начать заново", callback_data="start"))
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
            if node_id == "start":
                await save_user_data_to_db(user_id, "user_interests", selected_text)
            # Резервное сохранение если узел не найден
            if not any(node_id == node for node in ["start"]):
                await save_user_data_to_db(user_id, f"multi_select_{node_id}", selected_text)
        
        # Очищаем состояние множественного выбора
        if user_id in user_data:
            user_data[user_id].pop(f"multi_select_{node_id}", None)
            user_data[user_id].pop("multi_select_node", None)
        
        # Переходим к следующему узлу, если указан
        # Определяем следующий узел для каждого node_id
        if node_id == "start":
            # Переход к узлу interests_result
            await handle_callback_interests_result(callback_query)
        return
    
    # Обработка выбора опции
    parts = callback_data.split("_")
    if len(parts) >= 4:
        node_id = parts[2]
        button_id = "_".join(parts[3:])
        
        # Инициализируем список выбранных опций
        if user_id not in user_data:
            user_data[user_id] = {}
        if f"multi_select_{node_id}" not in user_data[user_id]:
            user_data[user_id][f"multi_select_{node_id}"] = []
        
        # Находим текст кнопки по button_id
        button_text = None
        if node_id == "start":
            if button_id == "btn-sport":
                button_text = "⚽ Спорт"
            if button_id == "btn-music":
                button_text = "🎵 Музыка"
            if button_id == "btn-books":
                button_text = "📚 Книги"
            if button_id == "btn-travel":
                button_text = "✈️ Путешествия"
            if button_id == "btn-tech":
                button_text = "💻 Технологии"
            if button_id == "btn-cooking":
                button_text = "🍳 Кулинария"
            if button_id == "btn-art":
                button_text = "🎨 Искусство"
            if button_id == "btn-games":
                button_text = "🎮 Игры"
        
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
            if node_id == "start":
                # Оптимальное количество колонок для кнопок интересов
                keyboard_width = 2  # Консистентное количество колонок для множественного выбора
                
                # Добавляем кнопки выбора с умным расположением
                selected_mark = "✅ " if "⚽ Спорт" in selected_list else ""
                builder.add(InlineKeyboardButton(text=f"{selected_mark}⚽ Спорт", callback_data=f"multi_select_{node_id}_btn-sport"))
                selected_mark = "✅ " if "🎵 Музыка" in selected_list else ""
                builder.add(InlineKeyboardButton(text=f"{selected_mark}🎵 Музыка", callback_data=f"multi_select_{node_id}_btn-music"))
                selected_mark = "✅ " if "📚 Книги" in selected_list else ""
                builder.add(InlineKeyboardButton(text=f"{selected_mark}📚 Книги", callback_data=f"multi_select_{node_id}_btn-books"))
                selected_mark = "✅ " if "✈️ Путешествия" in selected_list else ""
                builder.add(InlineKeyboardButton(text=f"{selected_mark}✈️ Путешествия", callback_data=f"multi_select_{node_id}_btn-travel"))
                selected_mark = "✅ " if "💻 Технологии" in selected_list else ""
                builder.add(InlineKeyboardButton(text=f"{selected_mark}💻 Технологии", callback_data=f"multi_select_{node_id}_btn-tech"))
                selected_mark = "✅ " if "🍳 Кулинария" in selected_list else ""
                builder.add(InlineKeyboardButton(text=f"{selected_mark}🍳 Кулинария", callback_data=f"multi_select_{node_id}_btn-cooking"))
                selected_mark = "✅ " if "🎨 Искусство" in selected_list else ""
                builder.add(InlineKeyboardButton(text=f"{selected_mark}🎨 Искусство", callback_data=f"multi_select_{node_id}_btn-art"))
                selected_mark = "✅ " if "🎮 Игры" in selected_list else ""
                builder.add(InlineKeyboardButton(text=f"{selected_mark}🎮 Игры", callback_data=f"multi_select_{node_id}_btn-games"))
                builder.add(InlineKeyboardButton(text="Готово", callback_data=f"multi_select_done_start"))
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
        
        if node_id == "start" and user_input == "Готово":
            # Завершение множественного выбора для узла start
            selected_options = user_data.get(user_id, {}).get("multi_select_{node_id}", [])
            if selected_options:
                selected_text = ", ".join(selected_options)
                await save_user_data_to_db(user_id, "user_interests", selected_text)
            
            # Очищаем состояние
            user_data[user_id].pop("multi_select_{node_id}", None)
            user_data[user_id].pop("multi_select_node", None)
            user_data[user_id].pop("multi_select_type", None)
            
            # Переход к следующему узлу
            await handle_callback_interests_result(types.CallbackQuery(id="multi_select", from_user=message.from_user, chat_instance="", data="interests_result", message=message))
            return
        
        # Обработка выбора опции
        if node_id == "start":
            if user_input == "⚽ Спорт":
                if "multi_select_{node_id}" not in user_data[user_id]:
                    user_data[user_id]["multi_select_{node_id}"] = []
                
                selected_list = user_data[user_id]["multi_select_{node_id}"]
                if "⚽ Спорт" in selected_list:
                    selected_list.remove("⚽ Спорт")
                    await message.answer("❌ Убрано: ⚽ Спорт")
                else:
                    selected_list.append("⚽ Спорт")
                    await message.answer("✅ Выбрано: ⚽ Спорт")
                return
            
            if user_input == "🎵 Музыка":
                if "multi_select_{node_id}" not in user_data[user_id]:
                    user_data[user_id]["multi_select_{node_id}"] = []
                
                selected_list = user_data[user_id]["multi_select_{node_id}"]
                if "🎵 Музыка" in selected_list:
                    selected_list.remove("🎵 Музыка")
                    await message.answer("❌ Убрано: 🎵 Музыка")
                else:
                    selected_list.append("🎵 Музыка")
                    await message.answer("✅ Выбрано: 🎵 Музыка")
                return
            
            if user_input == "📚 Книги":
                if "multi_select_{node_id}" not in user_data[user_id]:
                    user_data[user_id]["multi_select_{node_id}"] = []
                
                selected_list = user_data[user_id]["multi_select_{node_id}"]
                if "📚 Книги" in selected_list:
                    selected_list.remove("📚 Книги")
                    await message.answer("❌ Убрано: 📚 Книги")
                else:
                    selected_list.append("📚 Книги")
                    await message.answer("✅ Выбрано: 📚 Книги")
                return
            
            if user_input == "✈️ Путешествия":
                if "multi_select_{node_id}" not in user_data[user_id]:
                    user_data[user_id]["multi_select_{node_id}"] = []
                
                selected_list = user_data[user_id]["multi_select_{node_id}"]
                if "✈️ Путешествия" in selected_list:
                    selected_list.remove("✈️ Путешествия")
                    await message.answer("❌ Убрано: ✈️ Путешествия")
                else:
                    selected_list.append("✈️ Путешествия")
                    await message.answer("✅ Выбрано: ✈️ Путешествия")
                return
            
            if user_input == "💻 Технологии":
                if "multi_select_{node_id}" not in user_data[user_id]:
                    user_data[user_id]["multi_select_{node_id}"] = []
                
                selected_list = user_data[user_id]["multi_select_{node_id}"]
                if "💻 Технологии" in selected_list:
                    selected_list.remove("💻 Технологии")
                    await message.answer("❌ Убрано: 💻 Технологии")
                else:
                    selected_list.append("💻 Технологии")
                    await message.answer("✅ Выбрано: 💻 Технологии")
                return
            
            if user_input == "🍳 Кулинария":
                if "multi_select_{node_id}" not in user_data[user_id]:
                    user_data[user_id]["multi_select_{node_id}"] = []
                
                selected_list = user_data[user_id]["multi_select_{node_id}"]
                if "🍳 Кулинария" in selected_list:
                    selected_list.remove("🍳 Кулинария")
                    await message.answer("❌ Убрано: 🍳 Кулинария")
                else:
                    selected_list.append("🍳 Кулинария")
                    await message.answer("✅ Выбрано: 🍳 Кулинария")
                return
            
            if user_input == "🎨 Искусство":
                if "multi_select_{node_id}" not in user_data[user_id]:
                    user_data[user_id]["multi_select_{node_id}"] = []
                
                selected_list = user_data[user_id]["multi_select_{node_id}"]
                if "🎨 Искусство" in selected_list:
                    selected_list.remove("🎨 Искусство")
                    await message.answer("❌ Убрано: 🎨 Искусство")
                else:
                    selected_list.append("🎨 Искусство")
                    await message.answer("✅ Выбрано: 🎨 Искусство")
                return
            
            if user_input == "🎮 Игры":
                if "multi_select_{node_id}" not in user_data[user_id]:
                    user_data[user_id]["multi_select_{node_id}"] = []
                
                selected_list = user_data[user_id]["multi_select_{node_id}"]
                if "🎮 Игры" in selected_list:
                    selected_list.remove("🎮 Игры")
                    await message.answer("❌ Убрано: 🎮 Игры")
                else:
                    selected_list.append("🎮 Игры")
                    await message.answer("✅ Выбрано: 🎮 Игры")
                return
            
    
    # Если не множественный выбор, передаем дальше по цепочке обработчиков
    pass

if __name__ == "__main__":
    asyncio.run(main())
