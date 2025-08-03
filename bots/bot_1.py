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
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: статус
    if (
        check_user_variable("статус", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["статус"] = check_user_variable("статус", user_data_dict)
        text = """👑 Добро пожаловать, VIP-клиент {имя}!

У вас есть эксклюзивные предложения!"""
        conditional_parse_mode = None
        if "{статус}" in text and variable_values["статус"] is not None:
            text = text.replace("{статус}", variable_values["статус"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="⭐ VIP предложения", callback_data="vip_offers"))
        builder.add(InlineKeyboardButton(text="👨‍💼 Личный менеджер", callback_data="personal_manager"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "welcome_vip_customer",
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
        text = """🎉 С возвращением, {имя}!

Ваш последний заказ: {последний_заказ}
Бонусных баллов: {бонусы}"""
        conditional_parse_mode = None
        if "{имя}" in text and variable_values["имя"] is not None:
            text = text.replace("{имя}", variable_values["имя"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="📦 Повторить заказ", callback_data="repeat_order"))
        builder.add(InlineKeyboardButton(text="🆕 Новинки каталога", callback_data="new_products"))
        builder.add(InlineKeyboardButton(text="🎁 Магазин бонусов", callback_data="bonus_shop"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "welcome_returning_customer",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    else:
        text = "🛍️ Добро пожаловать в наш интернет-магазин!"
        logging.info("Используется основное сообщение узла")
    
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
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: статус
    if (
        check_user_variable("статус", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["статус"] = check_user_variable("статус", user_data_dict)
        text = """👑 Добро пожаловать, VIP-клиент {имя}!

У вас есть эксклюзивные предложения!"""
        conditional_parse_mode = None
        if "{статус}" in text and variable_values["статус"] is not None:
            text = text.replace("{статус}", variable_values["статус"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="⭐ VIP предложения", callback_data="vip_offers"))
        builder.add(InlineKeyboardButton(text="👨‍💼 Личный менеджер", callback_data="personal_manager"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "welcome_vip_customer",
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
        text = """🎉 С возвращением, {имя}!

Ваш последний заказ: {последний_заказ}
Бонусных баллов: {бонусы}"""
        conditional_parse_mode = None
        if "{имя}" in text and variable_values["имя"] is not None:
            text = text.replace("{имя}", variable_values["имя"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="📦 Повторить заказ", callback_data="repeat_order"))
        builder.add(InlineKeyboardButton(text="🆕 Новинки каталога", callback_data="new_products"))
        builder.add(InlineKeyboardButton(text="🎁 Магазин бонусов", callback_data="bonus_shop"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "welcome_returning_customer",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
    # Используем условное сообщение если есть подходящее условие
    if "text" not in locals():
        # Используем исходный текст клавиатуры если условие не сработало
        pass  # text уже установлен выше
    
    # Проверяем, нужно ли использовать условную клавиатуру
    use_conditional_keyboard = conditional_keyboard is not None
    # Определяем режим форматирования (приоритет у условного сообщения)
    if "conditional_parse_mode" in locals() and conditional_parse_mode is not None:
        current_parse_mode = conditional_parse_mode
    else:
        current_parse_mode = None
    
    # Проверяем, нужно ли использовать условную клавиатуру
    if use_conditional_keyboard:
        await message.answer(text, reply_markup=conditional_keyboard, parse_mode=current_parse_mode if current_parse_mode else None)
    else:
        # Создаем inline клавиатуру с кнопками
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="📱 Каталог товаров", callback_data="catalog_main"))
        builder.add(InlineKeyboardButton(text="👤 Мой профиль", callback_data="user_profile"))
        builder.add(InlineKeyboardButton(text="🛒 Корзина", callback_data="shopping_cart"))
        builder.add(InlineKeyboardButton(text="💬 Поддержка", callback_data="support_center"))
        keyboard = builder.as_markup()
        await message.answer(text, reply_markup=keyboard, parse_mode=current_parse_mode if current_parse_mode else None)

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "vip_offers")
async def handle_conditional_vip_offers(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: vip_offers by user {user_id}")

@dp.callback_query(lambda c: c.data == "personal_manager")
async def handle_conditional_personal_manager(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: personal_manager by user {user_id}")

@dp.callback_query(lambda c: c.data == "repeat_order")
async def handle_conditional_repeat_order(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: repeat_order by user {user_id}")

@dp.callback_query(lambda c: c.data == "new_products")
async def handle_conditional_new_products(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: new_products by user {user_id}")
    
    # Отправляем содержимое целевого узла
    text = "🆕 Новинки нашего магазина:"
    await callback_query.message.edit_text(text)

@dp.callback_query(lambda c: c.data == "bonus_shop")
async def handle_conditional_bonus_shop(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: bonus_shop by user {user_id}")
    
    # Отправляем содержимое целевого узла

@dp.callback_query(lambda c: c.data == "recommendations")
async def handle_conditional_recommendations(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: recommendations by user {user_id}")

@dp.callback_query(lambda c: c.data == "favorites")
async def handle_conditional_favorites(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: favorites by user {user_id}")

@dp.callback_query(lambda c: c.data == "catalog_main")
async def handle_conditional_catalog_main(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: catalog_main by user {user_id}")
    
    # Отправляем содержимое целевого узла

@dp.callback_query(lambda c: c.data == "premium_electronics")
async def handle_conditional_premium_electronics(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: premium_electronics by user {user_id}")

@dp.callback_query(lambda c: c.data == "preorders")
async def handle_conditional_preorders(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: preorders by user {user_id}")

@dp.callback_query(lambda c: c.data == "compatible_accessories")
async def handle_conditional_compatible_accessories(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: compatible_accessories by user {user_id}")

@dp.callback_query(lambda c: c.data == "trade_in")
async def handle_conditional_trade_in(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: trade_in by user {user_id}")

@dp.callback_query(lambda c: c.data == "vip_support")
async def handle_conditional_vip_support(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: vip_support by user {user_id}")

@dp.callback_query(lambda c: c.data == "exclusive_catalog")
async def handle_conditional_exclusive_catalog(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: exclusive_catalog by user {user_id}")

@dp.callback_query(lambda c: c.data == "achievements")
async def handle_conditional_achievements(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: achievements by user {user_id}")

@dp.callback_query(lambda c: c.data == "referral_program")
async def handle_conditional_referral_program(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: referral_program by user {user_id}")

@dp.callback_query(lambda c: c.data == "registration")
async def handle_conditional_registration(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: registration by user {user_id}")

@dp.callback_query(lambda c: c.data == "start_store")
async def handle_conditional_start_store(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: start_store by user {user_id}")
    
    # Отправляем содержимое целевого узла

@dp.callback_query(lambda c: c.data == "apply_discount")
async def handle_conditional_apply_discount(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: apply_discount by user {user_id}")

@dp.callback_query(lambda c: c.data == "save_discount")
async def handle_conditional_save_discount(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: save_discount by user {user_id}")

@dp.callback_query(lambda c: c.data == "checkout")
async def handle_conditional_checkout(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: checkout by user {user_id}")

@dp.callback_query(lambda c: c.data == "edit_cart")
async def handle_conditional_edit_cart(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: edit_cart by user {user_id}")

@dp.callback_query(lambda c: c.data == "save_cart")
async def handle_conditional_save_cart(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: save_cart by user {user_id}")

@dp.callback_query(lambda c: c.data == "personal_manager_contact")
async def handle_conditional_personal_manager_contact(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: personal_manager_contact by user {user_id}")

@dp.callback_query(lambda c: c.data == "priority_support")
async def handle_conditional_priority_support(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: priority_support by user {user_id}")

@dp.callback_query(lambda c: c.data == "order_status")
async def handle_conditional_order_status(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: order_status by user {user_id}")

@dp.callback_query(lambda c: c.data == "change_order")
async def handle_conditional_change_order(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: change_order by user {user_id}")

# Placeholder handler removed - using real handler below

@dp.callback_query(lambda c: c.data == "special_bonus_offers")
async def handle_conditional_special_bonus_offers(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: special_bonus_offers by user {user_id}")

@dp.callback_query(lambda c: c.data == "bonus_history")
async def handle_conditional_bonus_history(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: bonus_history by user {user_id}")

@dp.callback_query(lambda c: c.data == "earn_bonuses")
async def handle_conditional_earn_bonuses(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: earn_bonuses by user {user_id}")

@dp.callback_query(lambda c: c.data == "personal_new_products")
async def handle_conditional_personal_new_products(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: personal_new_products by user {user_id}")

@dp.callback_query(lambda c: c.data == "preference_notifications")
async def handle_conditional_preference_notifications(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    logging.info(f"Conditional button pressed: preference_notifications by user {user_id}")

@dp.callback_query(lambda c: c.data == "catalog_main")
async def handle_callback_catalog_main(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "📱 Каталог товаров"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    text = "📱 Выберите категорию товаров:"
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
    
    # Проверка условных сообщений для keyboard узла
    user_data_dict = user_record if user_record else user_data.get(callback_query.from_user.id, {})
    conditional_parse_mode = None
    conditional_keyboard = None
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: предпочтения
    if (
        check_user_variable("предпочтения", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["предпочтения"] = check_user_variable("предпочтения", user_data_dict)
        text = """📱 Персональные рекомендации для вас:

Основано на ваших предпочтениях: {предпочтения}"""
        conditional_parse_mode = None
        if "{предпочтения}" in text and variable_values["предпочтения"] is not None:
            text = text.replace("{предпочтения}", variable_values["предпочтения"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="⭐ Рекомендованное", callback_data="recommendations"))
        builder.add(InlineKeyboardButton(text="❤️ Избранное", callback_data="favorites"))
        builder.add(InlineKeyboardButton(text="📋 Все категории", callback_data="catalog_main"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "personalized_catalog",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
    # Используем условное сообщение если есть подходящее условие
    if "text" not in locals():
        text = "📱 Выберите категорию товаров:"
    
    # Используем условную клавиатуру если есть
    if conditional_keyboard is not None:
        keyboard = conditional_keyboard
    
    builder.add(InlineKeyboardButton(text="📱 Электроника", callback_data="electronics_category_btn_0"))
    builder.add(InlineKeyboardButton(text="👕 Одежда", callback_data="clothing_category_btn_1"))
    builder.add(InlineKeyboardButton(text="🏠 Дом и сад", callback_data="home_category_btn_2"))
    builder.add(InlineKeyboardButton(text="◀️ Главная", callback_data="start_store_btn_3"))
    keyboard = builder.as_markup()
    # Пытаемся редактировать сообщение, если не получается - отправляем новое
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "user_profile")
async def handle_callback_user_profile(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "👤 Мой профиль"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    text = "👤 Профиль пользователя"
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
    
    # Проверка условных сообщений для keyboard узла
    user_data_dict = user_record if user_record else user_data.get(callback_query.from_user.id, {})
    conditional_parse_mode = None
    conditional_keyboard = None
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: статус
    if (
        check_user_variable("статус", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["статус"] = check_user_variable("статус", user_data_dict)
        text = """👑 VIP-профиль: {имя}

⭐ Персональный менеджер
🚚 Бесплатная доставка
🎯 Эксклюзивные предложения"""
        conditional_parse_mode = None
        if "{статус}" in text and variable_values["статус"] is not None:
            text = text.replace("{статус}", variable_values["статус"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="💎 VIP поддержка", callback_data="vip_support"))
        builder.add(InlineKeyboardButton(text="🔒 Закрытый каталог", callback_data="exclusive_catalog"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "profile_vip",
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
        text = """👤 Профиль: {имя}
📧 Email: {email}
🎁 Бонусы: {бонусы}
📊 Статус: {статус}"""
        conditional_parse_mode = None
        if "{имя}" in text and variable_values["имя"] is not None:
            text = text.replace("{имя}", variable_values["имя"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="🏆 Достижения", callback_data="achievements"))
        builder.add(InlineKeyboardButton(text="👥 Пригласить друзей", callback_data="referral_program"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "profile_registered",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    # Условие 3: user_data_not_exists для переменных: имя
    elif (
        not check_user_variable("имя", user_data_dict)[0]
    ):
        text = """👤 Гостевой профиль

Создайте аккаунт для персональных рекомендаций и скидок!"""
        conditional_parse_mode = None
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="📝 Зарегистрироваться", callback_data="registration"))
        builder.add(InlineKeyboardButton(text="👀 Продолжить как гость", callback_data="start_store"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "profile_guest",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные имя не существуют (AND)")
    
    # Используем условное сообщение если есть подходящее условие
    if "text" not in locals():
        text = "👤 Профиль пользователя"
    
    # Используем условную клавиатуру если есть
    if conditional_keyboard is not None:
        keyboard = conditional_keyboard
    
    builder.add(InlineKeyboardButton(text="✏️ Редактировать", callback_data="edit_profile_btn_0"))
    builder.add(InlineKeyboardButton(text="📦 История заказов", callback_data="orders_history_btn_1"))
    builder.add(InlineKeyboardButton(text="🎁 Бонусы", callback_data="bonus_info_btn_2"))
    builder.add(InlineKeyboardButton(text="◀️ Главная", callback_data="start_store_btn_3"))
    keyboard = builder.as_markup()
    # Пытаемся редактировать сообщение, если не получается - отправляем новое
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "shopping_cart")
async def handle_callback_shopping_cart(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "🛒 Корзина"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    text = "🛒 Ваша корзина пуста"
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
    
    # Проверка условных сообщений для keyboard узла
    user_data_dict = user_record if user_record else user_data.get(callback_query.from_user.id, {})
    conditional_parse_mode = None
    conditional_keyboard = None
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: скидка_доступна
    if (
        check_user_variable("скидка_доступна", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["скидка_доступна"] = check_user_variable("скидка_доступна", user_data_dict)
        text = """🎉 У вас есть скидка {размер_скидки}%!

Применить к текущей корзине?"""
        conditional_parse_mode = None
        if "{скидка_доступна}" in text and variable_values["скидка_доступна"] is not None:
            text = text.replace("{скидка_доступна}", variable_values["скидка_доступна"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="✅ Применить скидку", callback_data="apply_discount"))
        builder.add(InlineKeyboardButton(text="💾 Сохранить на потом", callback_data="save_discount"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "cart_discount_available",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    # Условие 2: user_data_exists для переменных: корзина_товары
    elif (
        check_user_variable("корзина_товары", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["корзина_товары"] = check_user_variable("корзина_товары", user_data_dict)
        text = """🛒 В корзине: {количество_товаров} товаров
Сумма: {сумма_корзины} ₽

{список_товаров}"""
        conditional_parse_mode = None
        if "{корзина_товары}" in text and variable_values["корзина_товары"] is not None:
            text = text.replace("{корзина_товары}", variable_values["корзина_товары"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="💳 Оформить заказ", callback_data="checkout"))
        builder.add(InlineKeyboardButton(text="✏️ Изменить корзину", callback_data="edit_cart"))
        builder.add(InlineKeyboardButton(text="💾 Сохранить на потом", callback_data="save_cart"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "cart_has_items",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
    # Используем условное сообщение если есть подходящее условие
    if "text" not in locals():
        text = "🛒 Ваша корзина пуста"
    
    # Используем условную клавиатуру если есть
    if conditional_keyboard is not None:
        keyboard = conditional_keyboard
    
    builder.add(InlineKeyboardButton(text="🛍️ Продолжить покупки", callback_data="catalog_main_btn_0"))
    builder.add(InlineKeyboardButton(text="❤️ Список желаний", callback_data="wishlist_btn_1"))
    builder.add(InlineKeyboardButton(text="◀️ Главная", callback_data="start_store_btn_2"))
    keyboard = builder.as_markup()
    # Пытаемся редактировать сообщение, если не получается - отправляем новое
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "support_center")
async def handle_callback_support_center(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "💬 Поддержка"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    text = """💬 Центр поддержки

Выберите способ получения помощи:"""
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
    
    # Проверка условных сообщений для keyboard узла
    user_data_dict = user_record if user_record else user_data.get(callback_query.from_user.id, {})
    conditional_parse_mode = None
    conditional_keyboard = None
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: статус
    if (
        check_user_variable("статус", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["статус"] = check_user_variable("статус", user_data_dict)
        text = """👑 VIP поддержка

Приоритетное обслуживание и персональный менеджер"""
        conditional_parse_mode = None
        if "{статус}" in text and variable_values["статус"] is not None:
            text = text.replace("{статус}", variable_values["статус"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="👨‍💼 Связаться с менеджером", callback_data="personal_manager_contact"))
        builder.add(InlineKeyboardButton(text="⚡ Приоритетная поддержка", callback_data="priority_support"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "support_vip",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    # Условие 2: user_data_exists для переменных: активный_заказ
    elif (
        check_user_variable("активный_заказ", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["активный_заказ"] = check_user_variable("активный_заказ", user_data_dict)
        text = """📦 У вас есть активный заказ #{номер_заказа}

Вопрос касается этого заказа?"""
        conditional_parse_mode = None
        if "{активный_заказ}" in text and variable_values["активный_заказ"] is not None:
            text = text.replace("{активный_заказ}", variable_values["активный_заказ"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="📍 Статус заказа", callback_data="order_status"))
        builder.add(InlineKeyboardButton(text="✏️ Изменить заказ", callback_data="change_order"))
        builder.add(InlineKeyboardButton(text="❓ Другой вопрос", callback_data="support_center"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "support_order_issue",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
    # Используем условное сообщение если есть подходящее условие
    if "text" not in locals():
        text = """💬 Центр поддержки

Выберите способ получения помощи:"""
    
    # Используем условную клавиатуру если есть
    if conditional_keyboard is not None:
        keyboard = conditional_keyboard
    
    builder.add(InlineKeyboardButton(text="❓ Частые вопросы", callback_data="faq_btn_0"))
    builder.add(InlineKeyboardButton(text="💬 Чат с оператором", callback_data="chat_support_btn_1"))
    builder.add(InlineKeyboardButton(text="📞 Обратный звонок", callback_data="callback_request_btn_2"))
    builder.add(InlineKeyboardButton(text="◀️ Главная", callback_data="start_store_btn_3"))
    keyboard = builder.as_markup()
    # Пытаемся редактировать сообщение, если не получается - отправляем новое
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "electronics_category")
async def handle_callback_electronics_category(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "📱 Электроника"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    text = "📱 Электроника - выберите подкатегорию:"
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
    
    # Проверка условных сообщений для keyboard узла
    user_data_dict = user_record if user_record else user_data.get(callback_query.from_user.id, {})
    conditional_parse_mode = None
    conditional_keyboard = None
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: статус
    if (
        check_user_variable("статус", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["статус"] = check_user_variable("статус", user_data_dict)
        text = """👑 VIP-раздел электроники:

Доступны эксклюзивные модели и предзаказы!"""
        conditional_parse_mode = None
        if "{статус}" in text and variable_values["статус"] is not None:
            text = text.replace("{статус}", variable_values["статус"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="⭐ Премиум модели", callback_data="premium_electronics"))
        builder.add(InlineKeyboardButton(text="🚀 Предзаказы", callback_data="preorders"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "electronics_premium",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    # Условие 2: user_data_exists для переменных: последняя_покупка_электроника
    elif (
        check_user_variable("последняя_покупка_электроника", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["последняя_покупка_электроника"] = check_user_variable("последняя_покупка_электроника", user_data_dict)
        text = """📱 В электронике:

Ваша последняя покупка: {последняя_покупка_электроника}
Рекомендуем дополнительные аксессуары!"""
        conditional_parse_mode = None
        if "{последняя_покупка_электроника}" in text and variable_values["последняя_покупка_электроника"] is not None:
            text = text.replace("{последняя_покупка_электроника}", variable_values["последняя_покупка_электроника"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="🔌 Совместимые аксессуары", callback_data="compatible_accessories"))
        builder.add(InlineKeyboardButton(text="🔄 Trade-in", callback_data="trade_in"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "electronics_history",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
    # Используем условное сообщение если есть подходящее условие
    if "text" not in locals():
        text = "📱 Электроника - выберите подкатегорию:"
    
    # Используем условную клавиатуру если есть
    if conditional_keyboard is not None:
        keyboard = conditional_keyboard
    
    builder.add(InlineKeyboardButton(text="📱 Смартфоны", callback_data="smartphones_list_btn_0"))
    builder.add(InlineKeyboardButton(text="💻 Ноутбуки", callback_data="laptops_list_btn_1"))
    builder.add(InlineKeyboardButton(text="🎧 Аксессуары", callback_data="accessories_list_btn_2"))
    builder.add(InlineKeyboardButton(text="◀️ К каталогу", callback_data="catalog_main_btn_3"))
    keyboard = builder.as_markup()
    # Пытаемся редактировать сообщение, если не получается - отправляем новое
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "clothing_category")
async def handle_callback_clothing_category(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "👕 Одежда"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    # Кнопка пока никуда не ведет
    await callback_query.answer("⚠️ Эта кнопка пока не настроена", show_alert=True)

@dp.callback_query(lambda c: c.data == "home_category")
async def handle_callback_home_category(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "🏠 Дом и сад"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    # Кнопка пока никуда не ведет
    await callback_query.answer("⚠️ Эта кнопка пока не настроена", show_alert=True)

@dp.callback_query(lambda c: c.data == "start_store")
async def handle_callback_start_store(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "◀️ Главная"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    text = "🛍️ Добро пожаловать в наш интернет-магазин!"
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
    
    # Проверка условных сообщений для keyboard узла
    user_data_dict = user_record if user_record else user_data.get(callback_query.from_user.id, {})
    conditional_parse_mode = None
    conditional_keyboard = None
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: статус
    if (
        check_user_variable("статус", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["статус"] = check_user_variable("статус", user_data_dict)
        text = """👑 Добро пожаловать, VIP-клиент {имя}!

У вас есть эксклюзивные предложения!"""
        conditional_parse_mode = None
        if "{статус}" in text and variable_values["статус"] is not None:
            text = text.replace("{статус}", variable_values["статус"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="⭐ VIP предложения", callback_data="vip_offers"))
        builder.add(InlineKeyboardButton(text="👨‍💼 Личный менеджер", callback_data="personal_manager"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "welcome_vip_customer",
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
        text = """🎉 С возвращением, {имя}!

Ваш последний заказ: {последний_заказ}
Бонусных баллов: {бонусы}"""
        conditional_parse_mode = None
        if "{имя}" in text and variable_values["имя"] is not None:
            text = text.replace("{имя}", variable_values["имя"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="📦 Повторить заказ", callback_data="repeat_order"))
        builder.add(InlineKeyboardButton(text="🆕 Новинки каталога", callback_data="new_products"))
        builder.add(InlineKeyboardButton(text="🎁 Магазин бонусов", callback_data="bonus_shop"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "welcome_returning_customer",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
    # Используем условное сообщение если есть подходящее условие
    if "text" not in locals():
        text = "🛍️ Добро пожаловать в наш интернет-магазин!"
    
    # Используем условную клавиатуру если есть
    if conditional_keyboard is not None:
        keyboard = conditional_keyboard
    
    builder.add(InlineKeyboardButton(text="📱 Каталог товаров", callback_data="catalog_main_btn_0"))
    builder.add(InlineKeyboardButton(text="👤 Мой профиль", callback_data="user_profile_btn_1"))
    builder.add(InlineKeyboardButton(text="🛒 Корзина", callback_data="shopping_cart_btn_2"))
    builder.add(InlineKeyboardButton(text="💬 Поддержка", callback_data="support_center_btn_3"))
    keyboard = builder.as_markup()
    # Пытаемся редактировать сообщение, если не получается - отправляем новое
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "smartphones_list")
async def handle_callback_smartphones_list(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "📱 Смартфоны"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    # Кнопка пока никуда не ведет
    await callback_query.answer("⚠️ Эта кнопка пока не настроена", show_alert=True)

@dp.callback_query(lambda c: c.data == "laptops_list")
async def handle_callback_laptops_list(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "💻 Ноутбуки"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    # Кнопка пока никуда не ведет
    await callback_query.answer("⚠️ Эта кнопка пока не настроена", show_alert=True)

@dp.callback_query(lambda c: c.data == "accessories_list")
async def handle_callback_accessories_list(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "🎧 Аксессуары"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    # Кнопка пока никуда не ведет
    await callback_query.answer("⚠️ Эта кнопка пока не настроена", show_alert=True)

@dp.callback_query(lambda c: c.data == "catalog_main")
async def handle_callback_catalog_main(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "◀️ К каталогу"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    text = "📱 Выберите категорию товаров:"
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
    
    # Проверка условных сообщений для keyboard узла
    user_data_dict = user_record if user_record else user_data.get(callback_query.from_user.id, {})
    conditional_parse_mode = None
    conditional_keyboard = None
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: предпочтения
    if (
        check_user_variable("предпочтения", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["предпочтения"] = check_user_variable("предпочтения", user_data_dict)
        text = """📱 Персональные рекомендации для вас:

Основано на ваших предпочтениях: {предпочтения}"""
        conditional_parse_mode = None
        if "{предпочтения}" in text and variable_values["предпочтения"] is not None:
            text = text.replace("{предпочтения}", variable_values["предпочтения"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="⭐ Рекомендованное", callback_data="recommendations"))
        builder.add(InlineKeyboardButton(text="❤️ Избранное", callback_data="favorites"))
        builder.add(InlineKeyboardButton(text="📋 Все категории", callback_data="catalog_main"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "personalized_catalog",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
    # Используем условное сообщение если есть подходящее условие
    if "text" not in locals():
        text = "📱 Выберите категорию товаров:"
    
    # Используем условную клавиатуру если есть
    if conditional_keyboard is not None:
        keyboard = conditional_keyboard
    
    builder.add(InlineKeyboardButton(text="📱 Электроника", callback_data="electronics_category_btn_0"))
    builder.add(InlineKeyboardButton(text="👕 Одежда", callback_data="clothing_category_btn_1"))
    builder.add(InlineKeyboardButton(text="🏠 Дом и сад", callback_data="home_category_btn_2"))
    builder.add(InlineKeyboardButton(text="◀️ Главная", callback_data="start_store_btn_3"))
    keyboard = builder.as_markup()
    # Пытаемся редактировать сообщение, если не получается - отправляем новое
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "edit_profile")
async def handle_callback_edit_profile(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "✏️ Редактировать"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    # Кнопка пока никуда не ведет
    await callback_query.answer("⚠️ Эта кнопка пока не настроена", show_alert=True)

@dp.callback_query(lambda c: c.data == "orders_history")
async def handle_callback_orders_history(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "📦 История заказов"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    # Кнопка пока никуда не ведет
    await callback_query.answer("⚠️ Эта кнопка пока не настроена", show_alert=True)

@dp.callback_query(lambda c: c.data == "bonus_info")
async def handle_callback_bonus_info(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "🎁 Бонусы"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    # Кнопка пока никуда не ведет
    await callback_query.answer("⚠️ Эта кнопка пока не настроена", show_alert=True)

@dp.callback_query(lambda c: c.data == "start_store")
async def handle_callback_start_store(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "◀️ Главная"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    text = "🛍️ Добро пожаловать в наш интернет-магазин!"
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
    
    # Проверка условных сообщений для keyboard узла
    user_data_dict = user_record if user_record else user_data.get(callback_query.from_user.id, {})
    conditional_parse_mode = None
    conditional_keyboard = None
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: статус
    if (
        check_user_variable("статус", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["статус"] = check_user_variable("статус", user_data_dict)
        text = """👑 Добро пожаловать, VIP-клиент {имя}!

У вас есть эксклюзивные предложения!"""
        conditional_parse_mode = None
        if "{статус}" in text and variable_values["статус"] is not None:
            text = text.replace("{статус}", variable_values["статус"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="⭐ VIP предложения", callback_data="vip_offers"))
        builder.add(InlineKeyboardButton(text="👨‍💼 Личный менеджер", callback_data="personal_manager"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "welcome_vip_customer",
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
        text = """🎉 С возвращением, {имя}!

Ваш последний заказ: {последний_заказ}
Бонусных баллов: {бонусы}"""
        conditional_parse_mode = None
        if "{имя}" in text and variable_values["имя"] is not None:
            text = text.replace("{имя}", variable_values["имя"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="📦 Повторить заказ", callback_data="repeat_order"))
        builder.add(InlineKeyboardButton(text="🆕 Новинки каталога", callback_data="new_products"))
        builder.add(InlineKeyboardButton(text="🎁 Магазин бонусов", callback_data="bonus_shop"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "welcome_returning_customer",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
    # Используем условное сообщение если есть подходящее условие
    if "text" not in locals():
        text = "🛍️ Добро пожаловать в наш интернет-магазин!"
    
    # Используем условную клавиатуру если есть
    if conditional_keyboard is not None:
        keyboard = conditional_keyboard
    
    builder.add(InlineKeyboardButton(text="📱 Каталог товаров", callback_data="catalog_main_btn_0"))
    builder.add(InlineKeyboardButton(text="👤 Мой профиль", callback_data="user_profile_btn_1"))
    builder.add(InlineKeyboardButton(text="🛒 Корзина", callback_data="shopping_cart_btn_2"))
    builder.add(InlineKeyboardButton(text="💬 Поддержка", callback_data="support_center_btn_3"))
    keyboard = builder.as_markup()
    # Пытаемся редактировать сообщение, если не получается - отправляем новое
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "catalog_main")
async def handle_callback_catalog_main(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "🛍️ Продолжить покупки"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    text = "📱 Выберите категорию товаров:"
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
    
    # Проверка условных сообщений для keyboard узла
    user_data_dict = user_record if user_record else user_data.get(callback_query.from_user.id, {})
    conditional_parse_mode = None
    conditional_keyboard = None
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: предпочтения
    if (
        check_user_variable("предпочтения", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["предпочтения"] = check_user_variable("предпочтения", user_data_dict)
        text = """📱 Персональные рекомендации для вас:

Основано на ваших предпочтениях: {предпочтения}"""
        conditional_parse_mode = None
        if "{предпочтения}" in text and variable_values["предпочтения"] is not None:
            text = text.replace("{предпочтения}", variable_values["предпочтения"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="⭐ Рекомендованное", callback_data="recommendations"))
        builder.add(InlineKeyboardButton(text="❤️ Избранное", callback_data="favorites"))
        builder.add(InlineKeyboardButton(text="📋 Все категории", callback_data="catalog_main"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "personalized_catalog",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
    # Используем условное сообщение если есть подходящее условие
    if "text" not in locals():
        text = "📱 Выберите категорию товаров:"
    
    # Используем условную клавиатуру если есть
    if conditional_keyboard is not None:
        keyboard = conditional_keyboard
    
    builder.add(InlineKeyboardButton(text="📱 Электроника", callback_data="electronics_category_btn_0"))
    builder.add(InlineKeyboardButton(text="👕 Одежда", callback_data="clothing_category_btn_1"))
    builder.add(InlineKeyboardButton(text="🏠 Дом и сад", callback_data="home_category_btn_2"))
    builder.add(InlineKeyboardButton(text="◀️ Главная", callback_data="start_store_btn_3"))
    keyboard = builder.as_markup()
    # Пытаемся редактировать сообщение, если не получается - отправляем новое
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "wishlist")
async def handle_callback_wishlist(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "❤️ Список желаний"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    # Кнопка пока никуда не ведет
    await callback_query.answer("⚠️ Эта кнопка пока не настроена", show_alert=True)

@dp.callback_query(lambda c: c.data == "start_store")
async def handle_callback_start_store(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "◀️ Главная"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    text = "🛍️ Добро пожаловать в наш интернет-магазин!"
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
    
    # Проверка условных сообщений для keyboard узла
    user_data_dict = user_record if user_record else user_data.get(callback_query.from_user.id, {})
    conditional_parse_mode = None
    conditional_keyboard = None
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: статус
    if (
        check_user_variable("статус", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["статус"] = check_user_variable("статус", user_data_dict)
        text = """👑 Добро пожаловать, VIP-клиент {имя}!

У вас есть эксклюзивные предложения!"""
        conditional_parse_mode = None
        if "{статус}" in text and variable_values["статус"] is not None:
            text = text.replace("{статус}", variable_values["статус"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="⭐ VIP предложения", callback_data="vip_offers"))
        builder.add(InlineKeyboardButton(text="👨‍💼 Личный менеджер", callback_data="personal_manager"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "welcome_vip_customer",
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
        text = """🎉 С возвращением, {имя}!

Ваш последний заказ: {последний_заказ}
Бонусных баллов: {бонусы}"""
        conditional_parse_mode = None
        if "{имя}" in text and variable_values["имя"] is not None:
            text = text.replace("{имя}", variable_values["имя"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="📦 Повторить заказ", callback_data="repeat_order"))
        builder.add(InlineKeyboardButton(text="🆕 Новинки каталога", callback_data="new_products"))
        builder.add(InlineKeyboardButton(text="🎁 Магазин бонусов", callback_data="bonus_shop"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "welcome_returning_customer",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
    # Используем условное сообщение если есть подходящее условие
    if "text" not in locals():
        text = "🛍️ Добро пожаловать в наш интернет-магазин!"
    
    # Используем условную клавиатуру если есть
    if conditional_keyboard is not None:
        keyboard = conditional_keyboard
    
    builder.add(InlineKeyboardButton(text="📱 Каталог товаров", callback_data="catalog_main_btn_0"))
    builder.add(InlineKeyboardButton(text="👤 Мой профиль", callback_data="user_profile_btn_1"))
    builder.add(InlineKeyboardButton(text="🛒 Корзина", callback_data="shopping_cart_btn_2"))
    builder.add(InlineKeyboardButton(text="💬 Поддержка", callback_data="support_center_btn_3"))
    keyboard = builder.as_markup()
    # Пытаемся редактировать сообщение, если не получается - отправляем новое
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "faq")
async def handle_callback_faq(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "❓ Частые вопросы"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    # Кнопка пока никуда не ведет
    await callback_query.answer("⚠️ Эта кнопка пока не настроена", show_alert=True)

@dp.callback_query(lambda c: c.data == "chat_support")
async def handle_callback_chat_support(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "💬 Чат с оператором"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    # Кнопка пока никуда не ведет
    await callback_query.answer("⚠️ Эта кнопка пока не настроена", show_alert=True)

@dp.callback_query(lambda c: c.data == "callback_request")
async def handle_callback_callback_request(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "📞 Обратный звонок"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    # Кнопка пока никуда не ведет
    await callback_query.answer("⚠️ Эта кнопка пока не настроена", show_alert=True)

@dp.callback_query(lambda c: c.data == "start_store")
async def handle_callback_start_store(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "◀️ Главная"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    text = "🛍️ Добро пожаловать в наш интернет-магазин!"
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
    
    # Проверка условных сообщений для keyboard узла
    user_data_dict = user_record if user_record else user_data.get(callback_query.from_user.id, {})
    conditional_parse_mode = None
    conditional_keyboard = None
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: статус
    if (
        check_user_variable("статус", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["статус"] = check_user_variable("статус", user_data_dict)
        text = """👑 Добро пожаловать, VIP-клиент {имя}!

У вас есть эксклюзивные предложения!"""
        conditional_parse_mode = None
        if "{статус}" in text and variable_values["статус"] is not None:
            text = text.replace("{статус}", variable_values["статус"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="⭐ VIP предложения", callback_data="vip_offers"))
        builder.add(InlineKeyboardButton(text="👨‍💼 Личный менеджер", callback_data="personal_manager"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "welcome_vip_customer",
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
        text = """🎉 С возвращением, {имя}!

Ваш последний заказ: {последний_заказ}
Бонусных баллов: {бонусы}"""
        conditional_parse_mode = None
        if "{имя}" in text and variable_values["имя"] is not None:
            text = text.replace("{имя}", variable_values["имя"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="📦 Повторить заказ", callback_data="repeat_order"))
        builder.add(InlineKeyboardButton(text="🆕 Новинки каталога", callback_data="new_products"))
        builder.add(InlineKeyboardButton(text="🎁 Магазин бонусов", callback_data="bonus_shop"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "welcome_returning_customer",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
    # Используем условное сообщение если есть подходящее условие
    if "text" not in locals():
        text = "🛍️ Добро пожаловать в наш интернет-магазин!"
    
    # Используем условную клавиатуру если есть
    if conditional_keyboard is not None:
        keyboard = conditional_keyboard
    
    builder.add(InlineKeyboardButton(text="📱 Каталог товаров", callback_data="catalog_main_btn_0"))
    builder.add(InlineKeyboardButton(text="👤 Мой профиль", callback_data="user_profile_btn_1"))
    builder.add(InlineKeyboardButton(text="🛒 Корзина", callback_data="shopping_cart_btn_2"))
    builder.add(InlineKeyboardButton(text="💬 Поддержка", callback_data="support_center_btn_3"))
    keyboard = builder.as_markup()
    # Пытаемся редактировать сообщение, если не получается - отправляем новое
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "bonus_products")
async def handle_callback_bonus_products(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "🛍️ Товары за бонусы"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    # Кнопка пока никуда не ведет
    await callback_query.answer("⚠️ Эта кнопка пока не настроена", show_alert=True)

@dp.callback_query(lambda c: c.data == "bonus_discounts")
async def handle_callback_bonus_discounts(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "💰 Скидки за бонусы"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    # Кнопка пока никуда не ведет
    await callback_query.answer("⚠️ Эта кнопка пока не настроена", show_alert=True)

@dp.callback_query(lambda c: c.data == "bonus_rules")
async def handle_callback_bonus_rules(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "📋 Правила программы"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    # Кнопка пока никуда не ведет
    await callback_query.answer("⚠️ Эта кнопка пока не настроена", show_alert=True)

@dp.callback_query(lambda c: c.data == "start_store")
async def handle_callback_start_store(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "◀️ Главная"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    text = "🛍️ Добро пожаловать в наш интернет-магазин!"
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
    
    # Проверка условных сообщений для keyboard узла
    user_data_dict = user_record if user_record else user_data.get(callback_query.from_user.id, {})
    conditional_parse_mode = None
    conditional_keyboard = None
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: статус
    if (
        check_user_variable("статус", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["статус"] = check_user_variable("статус", user_data_dict)
        text = """👑 Добро пожаловать, VIP-клиент {имя}!

У вас есть эксклюзивные предложения!"""
        conditional_parse_mode = None
        if "{статус}" in text and variable_values["статус"] is not None:
            text = text.replace("{статус}", variable_values["статус"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="⭐ VIP предложения", callback_data="vip_offers"))
        builder.add(InlineKeyboardButton(text="👨‍💼 Личный менеджер", callback_data="personal_manager"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "welcome_vip_customer",
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
        text = """🎉 С возвращением, {имя}!

Ваш последний заказ: {последний_заказ}
Бонусных баллов: {бонусы}"""
        conditional_parse_mode = None
        if "{имя}" in text and variable_values["имя"] is not None:
            text = text.replace("{имя}", variable_values["имя"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="📦 Повторить заказ", callback_data="repeat_order"))
        builder.add(InlineKeyboardButton(text="🆕 Новинки каталога", callback_data="new_products"))
        builder.add(InlineKeyboardButton(text="🎁 Магазин бонусов", callback_data="bonus_shop"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "welcome_returning_customer",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
    # Используем условное сообщение если есть подходящее условие
    if "text" not in locals():
        text = "🛍️ Добро пожаловать в наш интернет-магазин!"
    
    # Используем условную клавиатуру если есть
    if conditional_keyboard is not None:
        keyboard = conditional_keyboard
    
    builder.add(InlineKeyboardButton(text="📱 Каталог товаров", callback_data="catalog_main_btn_0"))
    builder.add(InlineKeyboardButton(text="👤 Мой профиль", callback_data="user_profile_btn_1"))
    builder.add(InlineKeyboardButton(text="🛒 Корзина", callback_data="shopping_cart_btn_2"))
    builder.add(InlineKeyboardButton(text="💬 Поддержка", callback_data="support_center_btn_3"))
    keyboard = builder.as_markup()
    # Пытаемся редактировать сообщение, если не получается - отправляем новое
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "weekly_new")
async def handle_callback_weekly_new(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "📅 Новинки недели"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    # Кнопка пока никуда не ведет
    await callback_query.answer("⚠️ Эта кнопка пока не настроена", show_alert=True)

@dp.callback_query(lambda c: c.data == "monthly_new")
async def handle_callback_monthly_new(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "📆 Новинки месяца"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    # Кнопка пока никуда не ведет
    await callback_query.answer("⚠️ Эта кнопка пока не настроена", show_alert=True)

@dp.callback_query(lambda c: c.data == "subscribe_notifications")
async def handle_callback_subscribe_notifications(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "🔔 Подписаться на новинки"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    # Кнопка пока никуда не ведет
    await callback_query.answer("⚠️ Эта кнопка пока не настроена", show_alert=True)

@dp.callback_query(lambda c: c.data == "start_store")
async def handle_callback_start_store(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "◀️ Главная"
    
    # Сохраняем кнопку в базу данных
    timestamp = get_moscow_time()
    response_data = button_text  # Простое значение
    await update_user_data_in_db(user_id, button_text, response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    text = "🛍️ Добро пожаловать в наш интернет-магазин!"
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
    
    # Проверка условных сообщений для keyboard узла
    user_data_dict = user_record if user_record else user_data.get(callback_query.from_user.id, {})
    conditional_parse_mode = None
    conditional_keyboard = None
    # Функция для проверки переменных пользователя
    def check_user_variable(var_name, user_data_dict):
        """Проверяет существование и получает значение переменной пользователя"""
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: статус
    if (
        check_user_variable("статус", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["статус"] = check_user_variable("статус", user_data_dict)
        text = """👑 Добро пожаловать, VIP-клиент {имя}!

У вас есть эксклюзивные предложения!"""
        conditional_parse_mode = None
        if "{статус}" in text and variable_values["статус"] is not None:
            text = text.replace("{статус}", variable_values["статус"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="⭐ VIP предложения", callback_data="vip_offers"))
        builder.add(InlineKeyboardButton(text="👨‍💼 Личный менеджер", callback_data="personal_manager"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "welcome_vip_customer",
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
        text = """🎉 С возвращением, {имя}!

Ваш последний заказ: {последний_заказ}
Бонусных баллов: {бонусы}"""
        conditional_parse_mode = None
        if "{имя}" in text and variable_values["имя"] is not None:
            text = text.replace("{имя}", variable_values["имя"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="📦 Повторить заказ", callback_data="repeat_order"))
        builder.add(InlineKeyboardButton(text="🆕 Новинки каталога", callback_data="new_products"))
        builder.add(InlineKeyboardButton(text="🎁 Магазин бонусов", callback_data="bonus_shop"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "welcome_returning_customer",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    
    # Используем условное сообщение если есть подходящее условие
    if "text" not in locals():
        text = "🛍️ Добро пожаловать в наш интернет-магазин!"
    
    # Используем условную клавиатуру если есть
    if conditional_keyboard is not None:
        keyboard = conditional_keyboard
    
    builder.add(InlineKeyboardButton(text="📱 Каталог товаров", callback_data="catalog_main_btn_0"))
    builder.add(InlineKeyboardButton(text="👤 Мой профиль", callback_data="user_profile_btn_1"))
    builder.add(InlineKeyboardButton(text="🛒 Корзина", callback_data="shopping_cart_btn_2"))
    builder.add(InlineKeyboardButton(text="💬 Поддержка", callback_data="support_center_btn_3"))
    keyboard = builder.as_markup()
    # Пытаемся редактировать сообщение, если не получается - отправляем новое
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "user_profile" or c.data.startswith("user_profile_btn_"))
async def handle_callback_user_profile(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Сохраняем нажатие кнопки в базу данных
    user_id = callback_query.from_user.id
    
    # Ищем текст кнопки по callback_data
    button_display_text = "👤 Мой профиль"
    
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
    next_node_id = "user_profile"
    try:
        logging.info(f"🚀 Переходим к следующему узлу после выбора кнопки: {next_node_id}")
        if next_node_id == "start_store":
            logging.info("Переход к узлу start_store")
        elif next_node_id == "catalog_main":
            logging.info("Переход к узлу catalog_main")
        elif next_node_id == "electronics_category":
            logging.info("Переход к узлу electronics_category")
        elif next_node_id == "user_profile":
            logging.info("Переход к узлу user_profile")
        elif next_node_id == "shopping_cart":
            logging.info("Переход к узлу shopping_cart")
        elif next_node_id == "support_center":
            logging.info("Переход к узлу support_center")
        elif next_node_id == "bonus_shop":
            logging.info("Переход к узлу bonus_shop")
        elif next_node_id == "new_products":
            nav_text = "🆕 Новинки нашего магазина:"
            await callback_query.message.edit_text(nav_text)
        else:
            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
    except Exception as e:
        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
    
    return  # Завершаем обработку после переадресации
    
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
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: статус
    if (
        check_user_variable("статус", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["статус"] = check_user_variable("статус", user_data_dict)
        text = """👑 VIP-профиль: {имя}

⭐ Персональный менеджер
🚚 Бесплатная доставка
🎯 Эксклюзивные предложения"""
        conditional_parse_mode = None
        if "{статус}" in text and variable_values["статус"] is not None:
            text = text.replace("{статус}", variable_values["статус"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="💎 VIP поддержка", callback_data="vip_support"))
        builder.add(InlineKeyboardButton(text="🔒 Закрытый каталог", callback_data="exclusive_catalog"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "profile_vip",
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
        text = """👤 Профиль: {имя}
📧 Email: {email}
🎁 Бонусы: {бонусы}
📊 Статус: {статус}"""
        conditional_parse_mode = None
        if "{имя}" in text and variable_values["имя"] is not None:
            text = text.replace("{имя}", variable_values["имя"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="🏆 Достижения", callback_data="achievements"))
        builder.add(InlineKeyboardButton(text="👥 Пригласить друзей", callback_data="referral_program"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "profile_registered",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    # Условие 3: user_data_not_exists для переменных: имя
    elif (
        not check_user_variable("имя", user_data_dict)[0]
    ):
        text = """👤 Гостевой профиль

Создайте аккаунт для персональных рекомендаций и скидок!"""
        conditional_parse_mode = None
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="📝 Зарегистрироваться", callback_data="registration"))
        builder.add(InlineKeyboardButton(text="👀 Продолжить как гость", callback_data="start_store"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "profile_guest",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные имя не существуют (AND)")
    else:
        text = "👤 Профиль пользователя"
        text = replace_variables_in_text(text, user_data_dict)
        logging.info("Используется основное сообщение узла")
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="✏️ Редактировать", callback_data="btn_edit_profile"))
    builder.add(InlineKeyboardButton(text="📦 История заказов", callback_data="btn_orders_history"))
    builder.add(InlineKeyboardButton(text="🎁 Бонусы", callback_data="btn_bonus_info"))
    builder.add(InlineKeyboardButton(text="◀️ Главная", callback_data="btn_back_main_profile"))
    keyboard = builder.as_markup()
    # Пытаемся редактировать сообщение, если не получается - отправляем новое
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "shopping_cart" or c.data.startswith("shopping_cart_btn_"))
async def handle_callback_shopping_cart(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Сохраняем нажатие кнопки в базу данных
    user_id = callback_query.from_user.id
    
    # Ищем текст кнопки по callback_data
    button_display_text = "🛒 Корзина"
    
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
    next_node_id = "shopping_cart"
    try:
        logging.info(f"🚀 Переходим к следующему узлу после выбора кнопки: {next_node_id}")
        if next_node_id == "start_store":
            logging.info("Переход к узлу start_store")
        elif next_node_id == "catalog_main":
            logging.info("Переход к узлу catalog_main")
        elif next_node_id == "electronics_category":
            logging.info("Переход к узлу electronics_category")
        elif next_node_id == "user_profile":
            logging.info("Переход к узлу user_profile")
        elif next_node_id == "shopping_cart":
            logging.info("Переход к узлу shopping_cart")
        elif next_node_id == "support_center":
            logging.info("Переход к узлу support_center")
        elif next_node_id == "bonus_shop":
            logging.info("Переход к узлу bonus_shop")
        elif next_node_id == "new_products":
            nav_text = "🆕 Новинки нашего магазина:"
            await callback_query.message.edit_text(nav_text)
        else:
            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
    except Exception as e:
        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
    
    return  # Завершаем обработку после переадресации
    
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
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: скидка_доступна
    if (
        check_user_variable("скидка_доступна", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["скидка_доступна"] = check_user_variable("скидка_доступна", user_data_dict)
        text = """🎉 У вас есть скидка {размер_скидки}%!

Применить к текущей корзине?"""
        conditional_parse_mode = None
        if "{скидка_доступна}" in text and variable_values["скидка_доступна"] is not None:
            text = text.replace("{скидка_доступна}", variable_values["скидка_доступна"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="✅ Применить скидку", callback_data="apply_discount"))
        builder.add(InlineKeyboardButton(text="💾 Сохранить на потом", callback_data="save_discount"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "cart_discount_available",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    # Условие 2: user_data_exists для переменных: корзина_товары
    elif (
        check_user_variable("корзина_товары", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["корзина_товары"] = check_user_variable("корзина_товары", user_data_dict)
        text = """🛒 В корзине: {количество_товаров} товаров
Сумма: {сумма_корзины} ₽

{список_товаров}"""
        conditional_parse_mode = None
        if "{корзина_товары}" in text and variable_values["корзина_товары"] is not None:
            text = text.replace("{корзина_товары}", variable_values["корзина_товары"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="💳 Оформить заказ", callback_data="checkout"))
        builder.add(InlineKeyboardButton(text="✏️ Изменить корзину", callback_data="edit_cart"))
        builder.add(InlineKeyboardButton(text="💾 Сохранить на потом", callback_data="save_cart"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "cart_has_items",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    else:
        text = "🛒 Ваша корзина пуста"
        text = replace_variables_in_text(text, user_data_dict)
        logging.info("Используется основное сообщение узла")
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🛍️ Продолжить покупки", callback_data="btn_continue_shopping"))
    builder.add(InlineKeyboardButton(text="❤️ Список желаний", callback_data="btn_wishlist"))
    builder.add(InlineKeyboardButton(text="◀️ Главная", callback_data="btn_back_main_cart"))
    keyboard = builder.as_markup()
    # Пытаемся редактировать сообщение, если не получается - отправляем новое
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "electronics_category" or c.data.startswith("electronics_category_btn_"))
async def handle_callback_electronics_category(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Сохраняем нажатие кнопки в базу данных
    user_id = callback_query.from_user.id
    
    # Ищем текст кнопки по callback_data
    button_display_text = "📱 Электроника"
    
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
    next_node_id = "electronics_category"
    try:
        logging.info(f"🚀 Переходим к следующему узлу после выбора кнопки: {next_node_id}")
        if next_node_id == "start_store":
            logging.info("Переход к узлу start_store")
        elif next_node_id == "catalog_main":
            logging.info("Переход к узлу catalog_main")
        elif next_node_id == "electronics_category":
            logging.info("Переход к узлу electronics_category")
        elif next_node_id == "user_profile":
            logging.info("Переход к узлу user_profile")
        elif next_node_id == "shopping_cart":
            logging.info("Переход к узлу shopping_cart")
        elif next_node_id == "support_center":
            logging.info("Переход к узлу support_center")
        elif next_node_id == "bonus_shop":
            logging.info("Переход к узлу bonus_shop")
        elif next_node_id == "new_products":
            nav_text = "🆕 Новинки нашего магазина:"
            await callback_query.message.edit_text(nav_text)
        else:
            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
    except Exception as e:
        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
    
    return  # Завершаем обработку после переадресации
    
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
        # Сначала проверяем в поле user_data (из БД)
        if "user_data" in user_data_dict and user_data_dict["user_data"]:
            try:
                import json
                parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                if var_name in parsed_data:
                    raw_value = parsed_data[var_name]
                    if isinstance(raw_value, dict) and "value" in raw_value:
                        var_value = raw_value["value"]
                        # Проверяем, что значение действительно существует и не пустое
                        if var_value is not None and str(var_value).strip() != "":
                            return True, str(var_value)
                    else:
                        # Проверяем, что значение действительно существует и не пустое
                        if raw_value is not None and str(raw_value).strip() != "":
                            return True, str(raw_value)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Проверяем в локальных данных (без вложенности user_data)
        if var_name in user_data_dict:
            variable_data = user_data_dict.get(var_name)
            if isinstance(variable_data, dict) and "value" in variable_data:
                var_value = variable_data["value"]
                # Проверяем, что значение действительно существует и не пустое
                if var_value is not None and str(var_value).strip() != "":
                    return True, str(var_value)
            elif variable_data is not None and str(variable_data).strip() != "":
                return True, str(variable_data)
        
        return False, None
    
    # Условие 1: user_data_exists для переменных: статус
    if (
        check_user_variable("статус", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["статус"] = check_user_variable("статус", user_data_dict)
        text = """👑 VIP-раздел электроники:

Доступны эксклюзивные модели и предзаказы!"""
        conditional_parse_mode = None
        if "{статус}" in text and variable_values["статус"] is not None:
            text = text.replace("{статус}", variable_values["статус"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="⭐ Премиум модели", callback_data="premium_electronics"))
        builder.add(InlineKeyboardButton(text="🚀 Предзаказы", callback_data="preorders"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "electronics_premium",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    # Условие 2: user_data_exists для переменных: последняя_покупка_электроника
    elif (
        check_user_variable("последняя_покупка_электроника", user_data_dict)[0]
    ):
        # Собираем значения переменных
        variable_values = {}
        _, variable_values["последняя_покупка_электроника"] = check_user_variable("последняя_покупка_электроника", user_data_dict)
        text = """📱 В электронике:

Ваша последняя покупка: {последняя_покупка_электроника}
Рекомендуем дополнительные аксессуары!"""
        conditional_parse_mode = None
        if "{последняя_покупка_электроника}" in text and variable_values["последняя_покупка_электроника"] is not None:
            text = text.replace("{последняя_покупка_электроника}", variable_values["последняя_покупка_электроника"])
        # Создаем inline клавиатуру для условного сообщения
        builder = InlineKeyboardBuilder()
        builder.add(InlineKeyboardButton(text="🔌 Совместимые аксессуары", callback_data="compatible_accessories"))
        builder.add(InlineKeyboardButton(text="🔄 Trade-in", callback_data="trade_in"))
        keyboard = builder.as_markup()
        conditional_keyboard = keyboard
        # Настраиваем ожидание текстового ввода для условного сообщения
        conditional_message_config = {
            "condition_id": "electronics_history",
            "wait_for_input": False,
            "input_variable": "",
            "next_node_id": "",
            "source_type": "conditional_message"
        }
        logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
    else:
        text = "📱 Электроника - выберите подкатегорию:"
        text = replace_variables_in_text(text, user_data_dict)
        logging.info("Используется основное сообщение узла")
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📱 Смартфоны", callback_data="btn_smartphones"))
    builder.add(InlineKeyboardButton(text="💻 Ноутбуки", callback_data="btn_laptops"))
    builder.add(InlineKeyboardButton(text="🎧 Аксессуары", callback_data="btn_accessories"))
    builder.add(InlineKeyboardButton(text="◀️ К каталогу", callback_data="btn_back_catalog"))
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
                    
                    if next_node_id == "start_store":
                        await handle_callback_start_store(fake_callback)
                    elif next_node_id == "catalog_main":
                        await handle_callback_catalog_main(fake_callback)
                    elif next_node_id == "electronics_category":
                        await handle_callback_electronics_category(fake_callback)
                    elif next_node_id == "user_profile":
                        await handle_callback_user_profile(fake_callback)
                    elif next_node_id == "shopping_cart":
                        await handle_callback_shopping_cart(fake_callback)
                    elif next_node_id == "support_center":
                        await handle_callback_support_center(fake_callback)
                    elif next_node_id == "bonus_shop":
                        await handle_callback_bonus_shop(fake_callback)
                    elif next_node_id == "new_products":
                        await handle_callback_new_products(fake_callback)
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
                    if target_node_id == "start_store":
                        await handle_callback_start_store(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "catalog_main":
                        await handle_callback_catalog_main(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "electronics_category":
                        await handle_callback_electronics_category(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "user_profile":
                        await handle_callback_user_profile(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "shopping_cart":
                        await handle_callback_shopping_cart(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "support_center":
                        await handle_callback_support_center(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "bonus_shop":
                        await handle_callback_bonus_shop(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "new_products":
                        await handle_callback_new_products(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
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
                        if next_node_id == "start_store":
                            await handle_callback_start_store(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "catalog_main":
                            await handle_callback_catalog_main(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "electronics_category":
                            await handle_callback_electronics_category(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "user_profile":
                            await handle_callback_user_profile(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "shopping_cart":
                            await handle_callback_shopping_cart(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "support_center":
                            await handle_callback_support_center(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "bonus_shop":
                            await handle_callback_bonus_shop(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "new_products":
                            await handle_callback_new_products(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
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
                    if next_node_id == "start_store":
                        logging.info(f"Переход к узлу start_store типа start")
                    elif next_node_id == "catalog_main":
                        logging.info(f"Переход к узлу catalog_main типа keyboard")
                    elif next_node_id == "electronics_category":
                        logging.info(f"Переход к узлу electronics_category типа keyboard")
                    elif next_node_id == "user_profile":
                        logging.info(f"Переход к узлу user_profile типа keyboard")
                    elif next_node_id == "shopping_cart":
                        logging.info(f"Переход к узлу shopping_cart типа keyboard")
                    elif next_node_id == "support_center":
                        logging.info(f"Переход к узлу support_center типа keyboard")
                    elif next_node_id == "bonus_shop":
                        logging.info(f"Переход к узлу bonus_shop типа keyboard")
                    elif next_node_id == "new_products":
                        text = "🆕 Новинки нашего магазина:"
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
            
            # Находим узел по ID и выполняем соответствующее действие
            if next_node_id == "start_store":
                logging.info(f"Переход к узлу start_store типа start")
            elif next_node_id == "catalog_main":
                logging.info(f"Переход к узлу catalog_main типа keyboard")
            elif next_node_id == "electronics_category":
                logging.info(f"Переход к узлу electronics_category типа keyboard")
            elif next_node_id == "user_profile":
                logging.info(f"Переход к узлу user_profile типа keyboard")
            elif next_node_id == "shopping_cart":
                logging.info(f"Переход к узлу shopping_cart типа keyboard")
            elif next_node_id == "support_center":
                logging.info(f"Переход к узлу support_center типа keyboard")
            elif next_node_id == "bonus_shop":
                logging.info(f"Переход к узлу bonus_shop типа keyboard")
            elif next_node_id == "new_products":
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
                    # Сначала проверяем в поле user_data (из БД)
                    if "user_data" in user_data_dict and user_data_dict["user_data"]:
                        try:
                            import json
                            parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]
                            if var_name in parsed_data:
                                raw_value = parsed_data[var_name]
                                if isinstance(raw_value, dict) and "value" in raw_value:
                                    var_value = raw_value["value"]
                                    # Проверяем, что значение действительно существует и не пустое
                                    if var_value is not None and str(var_value).strip() != "":
                                        return True, str(var_value)
                                else:
                                    # Проверяем, что значение действительно существует и не пустое
                                    if raw_value is not None and str(raw_value).strip() != "":
                                        return True, str(raw_value)
                        except (json.JSONDecodeError, TypeError):
                            pass
                    
                    # Проверяем в локальных данных (без вложенности user_data)
                    if var_name in user_data_dict:
                        variable_data = user_data_dict.get(var_name)
                        if isinstance(variable_data, dict) and "value" in variable_data:
                            var_value = variable_data["value"]
                            # Проверяем, что значение действительно существует и не пустое
                            if var_value is not None and str(var_value).strip() != "":
                                return True, str(var_value)
                        elif variable_data is not None and str(variable_data).strip() != "":
                            return True, str(variable_data)
                    
                    return False, None
                
                # Условие 1: user_data_exists для переменных: предпочтения
                if (
                    check_user_variable("предпочтения", user_data_dict)[0]
                ):
                    # Собираем значения переменных
                    variable_values = {}
                    _, variable_values["предпочтения"] = check_user_variable("предпочтения", user_data_dict)
                    text = """🎯 Новинки в ваших любимых категориях:

{персональные_новинки}

Основано на предпочтениях: {предпочтения}"""
                    conditional_parse_mode = None
                    if "{предпочтения}" in text and variable_values["предпочтения"] is not None:
                        text = text.replace("{предпочтения}", variable_values["предпочтения"])
                    # Создаем inline клавиатуру для условного сообщения
                    builder = InlineKeyboardBuilder()
                    builder.add(InlineKeyboardButton(text="⭐ Персональные новинки", callback_data="personal_new_products"))
                    builder.add(InlineKeyboardButton(text="🔔 Уведомления по интересам", callback_data="preference_notifications"))
                    keyboard = builder.as_markup()
                    conditional_keyboard = keyboard
                    # Настраиваем ожидание текстового ввода для условного сообщения
                    conditional_message_config = {
                        "condition_id": "personalized_new_products",
                        "wait_for_input": False,
                        "input_variable": "",
                        "next_node_id": "",
                        "source_type": "conditional_message"
                    }
                    logging.info(f"Условие выполнено: переменные {variable_values} (AND)")
                else:
                    text = "🆕 Новинки нашего магазина:"
                    logging.info("Используется основное сообщение узла")
                
                # Используем parse_mode условного сообщения если он установлен
                if "conditional_parse_mode" in locals() and conditional_parse_mode is not None:
                    parse_mode = conditional_parse_mode
                else:
                    parse_mode = None
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="📅 Новинки недели", callback_data="weekly_new"))
                builder.add(InlineKeyboardButton(text="📆 Новинки месяца", callback_data="monthly_new"))
                builder.add(InlineKeyboardButton(text="🔔 Подписаться на новинки", callback_data="subscribe_notifications"))
                builder.add(InlineKeyboardButton(text="◀️ Главная", callback_data="start_store"))
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
