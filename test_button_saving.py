"""
Тест сохранения нажатий кнопок в базу данных - Telegram Bot
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
                )
            """)
        logging.info("База данных инициализирована")
        return True
    except Exception as e:
        logging.error(f"Ошибка инициализации БД: {e}")
        return False

async def save_user_to_db(user_id: int, username: str = None, first_name: str = None, last_name: str = None):
    """Сохраняет пользователя в базу данных"""
    try:
        if db_pool:
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
                logging.info(f"Пользователь {user_id} сохранен в базу данных")
                return True
    except Exception as e:
        logging.error(f"Ошибка сохранения пользователя: {e}")
    return False

async def get_user_from_db(user_id: int):
    """Получает данные пользователя из базы данных"""
    try:
        if db_pool:
            async with db_pool.acquire() as conn:
                result = await conn.fetchrow("""
                    SELECT * FROM bot_users WHERE user_id = $1
                """, user_id)
                return dict(result) if result else None
    except Exception as e:
        logging.error(f"Ошибка получения пользователя: {e}")
    return None

async def update_user_data_in_db(user_id: int, data_key: str, data_value):
    """Обновляет пользовательские данные в базе данных"""
    try:
        if db_pool:
            async with db_pool.acquire() as conn:
                # Сначала убедимся, что пользователь существует
                user = await conn.fetchrow("SELECT user_data FROM bot_users WHERE user_id = $1", user_id)
                if user:
                    current_data = user['user_data'] if user['user_data'] else {}
                    current_data[data_key] = data_value
                    
                    await conn.execute("""
                        UPDATE bot_users 
                        SET user_data = $1, last_interaction = NOW()
                        WHERE user_id = $2
                    """, json.dumps(current_data), user_id)
                    logging.info(f"✅ Данные сохранены в БД: {data_key} = {data_value} (пользователь {user_id})")
                    return True
    except Exception as e:
        logging.error(f"Ошибка обновления данных пользователя: {e}")
    return False

async def is_admin(user_id: int) -> bool:
    return user_id in ADMIN_IDS

async def is_private_chat(message: types.Message) -> bool:
    return message.chat.type == "private"

async def check_auth(user_id: int) -> bool:
    # Добавьте здесь свою логику проверки авторизации
    return True

@dp.message(CommandStart())
async def start_handler(message: types.Message):
    # Сохраняем пользователя в базу данных
    await save_user_to_db(
        message.from_user.id,
        message.from_user.username,
        message.from_user.first_name,
        message.from_user.last_name
    )
    
    text = """Добро пожаловать! Нажмите кнопки ниже для тестирования сохранения в базу данных."""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="Кнопка 1", callback_data="button_1"))
    builder.add(InlineKeyboardButton(text="Кнопка 2", callback_data="button_2"))
    builder.add(InlineKeyboardButton(text="Кнопка 3", callback_data="button_3"))
    keyboard = builder.as_markup()
    await message.answer(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "button_1")
async def handle_callback_button_1(callback_query: types.CallbackQuery):
    await callback_query.answer()
    
    # Сохраняем нажатие кнопки в базу данных
    user_id = callback_query.from_user.id
    button_text = "Кнопка 1"
    
    # Сохраняем ответ в базу данных
    import datetime
    timestamp = datetime.datetime.now().isoformat()
    
    response_data = {
        "value": button_text,
        "type": "inline_button",
        "timestamp": timestamp,
        "nodeId": "button_1",
        "variable": "button_click",
        "source": "inline_button_click"
    }
    
    # Сохраняем в пользовательские данные
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["last_button_click"] = response_data
    
    # Сохраняем в базу данных
    await update_user_data_in_db(user_id, "button_click", response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    await callback_query.message.edit_text(f"✅ Вы нажали: {button_text}\nДанные сохранены в базу данных!")

@dp.callback_query(lambda c: c.data == "button_2")
async def handle_callback_button_2(callback_query: types.CallbackQuery):
    await callback_query.answer()
    
    # Сохраняем нажатие кнопки в базу данных
    user_id = callback_query.from_user.id
    button_text = "Кнопка 2"
    
    # Сохраняем ответ в базу данных
    import datetime
    timestamp = datetime.datetime.now().isoformat()
    
    response_data = {
        "value": button_text,
        "type": "inline_button",
        "timestamp": timestamp,
        "nodeId": "button_2",
        "variable": "button_click",
        "source": "inline_button_click"
    }
    
    # Сохраняем в пользовательские данные
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["last_button_click"] = response_data
    
    # Сохраняем в базу данных
    await update_user_data_in_db(user_id, "button_click", response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    await callback_query.message.edit_text(f"✅ Вы нажали: {button_text}\nДанные сохранены в базу данных!")

@dp.callback_query(lambda c: c.data == "button_3")
async def handle_callback_button_3(callback_query: types.CallbackQuery):
    await callback_query.answer()
    
    # Сохраняем нажатие кнопки в базу данных
    user_id = callback_query.from_user.id
    button_text = "Кнопка 3"
    
    # Сохраняем ответ в базу данных
    import datetime
    timestamp = datetime.datetime.now().isoformat()
    
    response_data = {
        "value": button_text,
        "type": "inline_button",
        "timestamp": timestamp,
        "nodeId": "button_3",
        "variable": "button_click",
        "source": "inline_button_click"
    }
    
    # Сохраняем в пользовательские данные
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["last_button_click"] = response_data
    
    # Сохраняем в базу данных
    await update_user_data_in_db(user_id, "button_click", response_data)
    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")
    
    await callback_query.message.edit_text(f"✅ Вы нажали: {button_text}\nДанные сохранены в базу данных!")

async def main():
    # Инициализируем базу данных
    await init_database()
    
    # Устанавливаем команды бота
    await bot.set_my_commands([
        BotCommand(command="start", description="Запустить бота"),
    ])
    
    # Запускаем бота
    try:
        await dp.start_polling(bot)
    except Exception as e:
        logging.error(f"Ошибка при запуске бота: {e}")
    finally:
        if db_pool:
            await db_pool.close()

if __name__ == "__main__":
    asyncio.run(main())