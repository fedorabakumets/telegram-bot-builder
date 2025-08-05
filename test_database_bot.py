"""
Тестовый бот с поддержкой базы данных - Telegram Bot
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
BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"

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

    text = "Привет! Это тестовый бот с поддержкой базы данных PostgreSQL. Ваши данные сохраняются автоматически!"
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🗃️ Мои данные", callback_data="show_user_data"))
    builder.add(InlineKeyboardButton(text="📊 Статистика", callback_data="show_stats"))
    keyboard = builder.as_markup()
    
    await message.answer(text, reply_markup=keyboard)

@dp.callback_query(F.data == "show_user_data")
async def show_user_data_handler(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Получаем данные пользователя из БД
    user_data_from_db = await get_user_from_db(user_id)
    
    if user_data_from_db:
        text = f"""
🗃️ Ваши данные в базе данных:

👤 ID: {user_data_from_db['user_id']}
📝 Имя: {user_data_from_db['first_name']}
📧 Username: @{user_data_from_db['username'] or 'не указан'}
📅 Зарегистрирован: {user_data_from_db['registered_at']}
🔄 Последнее взаимодействие: {user_data_from_db['last_interaction']}
📈 Количество взаимодействий: {user_data_from_db['interaction_count']}
✅ Статус: {'Активен' if user_data_from_db['is_active'] else 'Неактивен'}
"""
        
        if user_data_from_db.get('user_data'):
            text += f"\n📋 Дополнительные данные: {user_data_from_db['user_data']}"
    else:
        text = "❌ Данные не найдены в базе данных. Возможно, используется локальное хранилище."
    
    await callback_query.message.edit_text(text)

@dp.callback_query(F.data == "show_stats")
async def show_stats_handler(callback_query: types.CallbackQuery):
    if not db_pool:
        await callback_query.message.edit_text("❌ База данных недоступна. Статистика не может быть получена.")
        return
    
    try:
        async with db_pool.acquire() as conn:
            # Получаем общую статистику
            total_users = await conn.fetchval("SELECT COUNT(*) FROM bot_users")
            active_users = await conn.fetchval("SELECT COUNT(*) FROM bot_users WHERE is_active = true")
            total_interactions = await conn.fetchval("SELECT COALESCE(SUM(interaction_count), 0) FROM bot_users")
            
            text = f"""
📊 Статистика бота:

👥 Всего пользователей: {total_users}
✅ Активных пользователей: {active_users}
🔄 Всего взаимодействий: {total_interactions}
💾 База данных: PostgreSQL (подключена)
"""
            
    except Exception as e:
        text = f"❌ Ошибка получения статистики: {e}"
    
    await callback_query.message.edit_text(text)


# Запуск бота
async def main():
    # Инициализируем базу данных
    await init_database()
    print("🤖 Тестовый бот с БД запущен и готов к работе!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())