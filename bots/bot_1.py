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
        return
    
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
    except Exception as e:
        logging.error(f"Ошибка сохранения пользователя {user_id}: {e}")

async def update_user_data(user_id: int, data: dict):
    """Обновляет пользовательские данные в базе"""
    if not db_pool:
        return
    
    try:
        async with db_pool.acquire() as conn:
            await conn.execute("""
                UPDATE bot_users 
                SET user_data = user_data || $2,
                    last_interaction = NOW()
                WHERE user_id = $1
            """, user_id, json.dumps(data))
    except Exception as e:
        logging.error(f"Ошибка обновления данных пользователя {user_id}: {e}")

async def get_user_data_from_db(user_id: int) -> dict:
    """Получает данные пользователя из базы"""
    if not db_pool:
        return {}
    
    try:
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow("SELECT user_data FROM bot_users WHERE user_id = $1", user_id)
            if row and row['user_data']:
                return row['user_data']
    except Exception as e:
        logging.error(f"Ошибка получения данных пользователя {user_id}: {e}")
    
    return {}

def check_user_variable(variable_name: str, user_data_dict: dict) -> (bool, str):
    """Проверяет наличие переменной в данных пользователя"""
    value = user_data_dict.get(variable_name)
    if value is not None and value != "":
        return True, str(value)
    return False, ""

@dp.message(CommandStart())
async def start_handler(message: types.Message):
    """Обработчик команды /start"""
    user_id = message.from_user.id
    username = message.from_user.username
    first_name = message.from_user.first_name
    last_name = message.from_user.last_name
    
    # Сохраняем пользователя в БД
    await save_user_to_db(user_id, username, first_name, last_name)
    
    # Инициализируем пользователя в локальном хранилище
    if user_id not in user_data:
        user_data[user_id] = await get_user_data_from_db(user_id)
    
    # Логирование
    logging.info(f"Пользователь {user_id} ({username}) запустил бота")
    
    text = """Привет! 🌟
Добро пожаловать в наш бот!
Откуда вы узнали о нас?"""
    
    # Настраиваем ожидание текстового ввода
    user_data[user_id]["waiting_for_input"] = {
        "node_id": "start_node",
        "next_node_id": "--2N9FeeykMHVVlsVnSQW",
        "input_variable": "источник"
    }
    
    await message.answer(text)

@dp.message(Command("profile"))
async def profile_handler(message: types.Message):
    """Обработчик команды /profile"""
    user_id = message.from_user.id
    
    # Инициализируем пользователя если его нет
    if user_id not in user_data:
        user_data[user_id] = await get_user_data_from_db(user_id)
    
    user_data_dict = user_data[user_id]
    
    # Проверяем условные сообщения по приоритету
    conditions = [
        {
            "id": "profile_with_all_data",
            "priority": 50,
            "variables": ["желание", "имя", "источник", "пол"],
            "operator": "AND",
            "text": """👤 Ваш профиль:

🔍 Источник: {источник}
💭 Желание продолжить: {желание}
⚧️ Пол: {пол}
👋 Имя: {имя}

Профиль полностью заполнен! ✅"""
        },
        {
            "id": "profile_basic_info",
            "priority": 40,
            "variables": ["имя"],
            "operator": "AND",
            "text": """👤 Ваш профиль:

👋 Имя: {имя}

Основная информация заполнена. Хотите пройти полный опрос?"""
        },
        {
            "id": "profile_partial",
            "priority": 30,
            "variables": ["источник"],
            "operator": "OR",
            "text": """👤 Частичный профиль:

🔍 Источник: {источник}

Профиль заполнен частично. Пройдите полный опрос для получения более детальной информации."""
        },
        {
            "id": "profile_any_data",
            "priority": 10,
            "variables": ["желание", "имя", "источник", "пол"],
            "operator": "OR",
            "text": """👤 Ваш профиль:

У нас есть некоторая информация о вас. Пройдите полный опрос чтобы заполнить профиль полностью.

Имеющиеся данные:
🔍 Источник: {источник}
💭 Желание: {желание}
⚧️ Пол: {пол}
👋 Имя: {имя}"""
        }
    ]
    
    # Проверяем условия по приоритету
    selected_condition = None
    for condition in sorted(conditions, key=lambda x: x["priority"], reverse=True):
        if condition["operator"] == "AND":
            # Все переменные должны существовать
            if all(check_user_variable(var, user_data_dict)[0] for var in condition["variables"]):
                selected_condition = condition
                break
        else:  # OR
            # Хотя бы одна переменная должна существовать
            if any(check_user_variable(var, user_data_dict)[0] for var in condition["variables"]):
                selected_condition = condition
                break
    
    # Формируем текст сообщения
    if selected_condition:
        text = selected_condition["text"]
        # Заменяем переменные
        for var in ["желание", "имя", "источник", "пол"]:
            placeholder = "{" + var + "}"
            if placeholder in text:
                exists, value = check_user_variable(var, user_data_dict)
                if exists:
                    text = text.replace(placeholder, value)
                else:
                    text = text.replace(placeholder, "не указано")
    else:
        # Fallback сообщение
        text = """👤 Профиль недоступен

Похоже, вы еще не прошли опрос. Пожалуйста, введите /start чтобы заполнить профиль."""
    
    # Создаем клавиатуру
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📝 Пройти опрос", callback_data="/start"))
    builder.add(InlineKeyboardButton(text="Редактировать имя", callback_data="H7Sfc4w0d6izui3NABl6m"))
    keyboard = builder.as_markup()
    
    await message.answer(text, reply_markup=keyboard)

@dp.callback_query(F.data == "--2N9FeeykMHVVlsVnSQW")
async def handle_keyboard_2N9FeeykMHVVlsVnSQW(callback_query: types.CallbackQuery):
    """Обработчик клавиатуры --2N9FeeykMHVVlsVnSQW"""
    user_id = callback_query.from_user.id
    
    if user_id not in user_data:
        user_data[user_id] = {}
    
    text = "Ты хочешься продолжить свою жизнь с чатом?"
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="Да", callback_data="nr3wIiTfBYYmpkkXMNH7n"))
    builder.add(InlineKeyboardButton(text="Нет", callback_data="1BHSLWPMao9qQvSAzuzRl"))
    keyboard = builder.as_markup()
    
    await callback_query.message.answer(text, reply_markup=keyboard)
    await callback_query.answer()

@dp.callback_query(F.data == "nr3wIiTfBYYmpkkXMNH7n")
async def handle_keyboard_nr3wIiTfBYYmpkkXMNH7n(callback_query: types.CallbackQuery):
    """Обработчик клавиатуры nr3wIiTfBYYmpkkXMNH7n"""
    user_id = callback_query.from_user.id
    
    if user_id not in user_data:
        user_data[user_id] = {}
    
    # Сохраняем ответ пользователя
    user_data[user_id]["желание"] = "Да"
    await update_user_data(user_id, {"желание": "Да"})
    
    text = "Какой твой пол?"
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="Женщина", callback_data="H7Sfc4w0d6izui3NABl6m"))
    builder.add(InlineKeyboardButton(text="Мужчина", callback_data="H7Sfc4w0d6izui3NABl6m"))
    keyboard = builder.as_markup()
    
    await callback_query.message.answer(text, reply_markup=keyboard)
    await callback_query.answer()

@dp.callback_query(F.data == "1BHSLWPMao9qQvSAzuzRl")
async def handle_message_1BHSLWPMao9qQvSAzuzRl(callback_query: types.CallbackQuery):
    """Обработчик сообщения 1BHSLWPMao9qQvSAzuzRl"""
    user_id = callback_query.from_user.id
    
    if user_id not in user_data:
        user_data[user_id] = {}
    
    # Сохраняем ответ пользователя
    user_data[user_id]["желание"] = "Нет"
    await update_user_data(user_id, {"желание": "Нет"})
    
    text = "Печально, если что напиши /start или /profile для просмотра профиля"
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔄 Начать заново", callback_data="/start"))
    builder.add(InlineKeyboardButton(text="👤 Профиль", callback_data="/profile"))
    keyboard = builder.as_markup()
    
    await callback_query.message.answer(text, reply_markup=keyboard)
    await callback_query.answer()

@dp.callback_query(F.data == "H7Sfc4w0d6izui3NABl6m")
async def handle_message_H7Sfc4w0d6izui3NABl6m(callback_query: types.CallbackQuery):
    """Обработчик сообщения H7Sfc4w0d6izui3NABl6m"""
    user_id = callback_query.from_user.id
    
    if user_id not in user_data:
        user_data[user_id] = {}
    
    user_data_dict = user_data[user_id]
    
    # Сохраняем ответ если пришли от выбора пола
    if callback_query.message.text and "пол" in callback_query.message.text.lower():
        button_text = None
        # Определяем какая кнопка была нажата по предыдущему сообщению
        if "Женщина" in str(callback_query.message.reply_markup):
            button_text = "Женщина"
        elif "Мужчина" in str(callback_query.message.reply_markup):
            button_text = "Мужчина"
        
        if button_text:
            user_data[user_id]["пол"] = button_text
            await update_user_data(user_id, {"пол": button_text})
    
    # Проверяем условие для изменения текста
    text = "Как тебя зовут?"
    has_name, name_value = check_user_variable("имя", user_data_dict)
    if has_name:
        text = "Введите новое имя"
        # Настраиваем ожидание ввода для перехода к профилю
        user_data[user_id]["waiting_for_input"] = {
            "node_id": "H7Sfc4w0d6izui3NABl6m",
            "next_node_id": "profile_command",
            "input_variable": "имя"
        }
    else:
        # Настраиваем ожидание ввода для перехода к финальному сообщению
        user_data[user_id]["waiting_for_input"] = {
            "node_id": "H7Sfc4w0d6izui3NABl6m",
            "next_node_id": "final-message-node",
            "input_variable": "имя"
        }
    
    await callback_query.message.answer(text)
    await callback_query.answer()

@dp.callback_query(F.data == "final-message-node")
async def handle_message_final_message_node(callback_query: types.CallbackQuery):
    """Обработчик финального сообщения"""
    text = """Спасибо за предоставленную информацию! 🎉

Ваш профиль сохранен. Теперь вы можете воспользоваться командой /profile чтобы посмотреть свой профиль."""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="👤 Посмотреть профиль", callback_data="/profile"))
    builder.add(InlineKeyboardButton(text="🔄 Начать заново", callback_data="/start"))
    keyboard = builder.as_markup()
    
    await callback_query.message.answer(text, reply_markup=keyboard)
    await callback_query.answer()

# Обработчик команд через callback
@dp.callback_query(F.data.in_(["/start", "/profile"]))
async def handle_command_callbacks(callback_query: types.CallbackQuery):
    """Обработчик команд через callback кнопки"""
    if callback_query.data == "/start":
        await start_handler(callback_query.message)
    elif callback_query.data == "/profile":
        await profile_handler(callback_query.message)
    
    await callback_query.answer()

@dp.message()
async def handle_text_input(message: types.Message):
    """Обработчик текстовых сообщений и пользовательского ввода"""
    user_id = message.from_user.id
    user_text = message.text
    
    # Инициализируем пользователя если его нет
    if user_id not in user_data:
        user_data[user_id] = await get_user_data_from_db(user_id)
    
    # Проверяем, ожидается ли текстовый ввод
    if "waiting_for_input" in user_data[user_id]:
        input_config = user_data[user_id]["waiting_for_input"]
        
        # Сохраняем введенные данные
        input_variable = input_config["input_variable"]
        user_data[user_id][input_variable] = user_text
        await update_user_data(user_id, {input_variable: user_text})
        
        # Удаляем состояние ожидания
        del user_data[user_id]["waiting_for_input"]
        
        logging.info(f"Сохранен ввод: {input_variable} = {user_text} (пользователь {user_id})")
        
        # Переходим к следующему узлу
        next_node_id = input_config.get("next_node_id")
        if next_node_id == "final-message-node":
            text = """Спасибо за предоставленную информацию! 🎉

Ваш профиль сохранен. Теперь вы можете воспользоваться командой /profile чтобы посмотреть свой профиль."""
            
            builder = InlineKeyboardBuilder()
            builder.add(InlineKeyboardButton(text="👤 Посмотреть профиль", callback_data="/profile"))
            builder.add(InlineKeyboardButton(text="🔄 Начать заново", callback_data="/start"))
            keyboard = builder.as_markup()
            
            await message.answer(text, reply_markup=keyboard)
        elif next_node_id == "profile_command":
            # Перенаправляем к обработчику профиля
            await profile_handler(message)
        elif next_node_id == "--2N9FeeykMHVVlsVnSQW":
            # Переходим к следующему вопросу
            text = "Ты хочешься продолжить свою жизнь с чатом?"
            
            builder = InlineKeyboardBuilder()
            builder.add(InlineKeyboardButton(text="Да", callback_data="nr3wIiTfBYYmpkkXMNH7n"))
            builder.add(InlineKeyboardButton(text="Нет", callback_data="1BHSLWPMao9qQvSAzuzRl"))
            keyboard = builder.as_markup()
            
            await message.answer(text, reply_markup=keyboard)
        
        return
    
    # Если нет активного ожидания ввода, показываем помощь
    await message.answer("Напишите /start чтобы начать опрос или /profile чтобы посмотреть свой профиль.")

# Запуск бота
async def main():
    try:
        # Инициализируем базу данных
        await init_database()
        
        print("Запускаем бота...")
        await dp.start_polling(bot)
    except Exception as e:
        print(f"Ошибка запуска бота: {e}")
        raise

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Бот остановлен")
    except Exception as e:
        print(f"Критическая ошибка: {e}")
        exit(1)