#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
import logging
import asyncpg
import json
import os
from datetime import datetime
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart, Command
from aiogram.utils.keyboard import InlineKeyboardBuilder, ReplyKeyboardBuilder
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardRemove, KeyboardButton

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('../bot.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)

# Инициализация бота
BOT_TOKEN = os.getenv('BOT_TOKEN', '7552080497:AAGVlzwUJHNO8vfF2vU4-2wXpUzxU5Nz88c')
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# Глобальные переменные
user_data = {}
db_pool = None

# Получение URL базы данных
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://replit:replit@localhost:5432/replit')

async def init_database():
    """Инициализация соединения с базой данных"""
    global db_pool
    try:
        db_pool = await asyncpg.create_pool(DATABASE_URL)
        logging.info("Database connection established and tables created")
        return True
    except Exception as e:
        logging.error(f"Database connection failed: {e}")
        db_pool = None
        return False

async def save_user_to_db(user_id: int, username: str, first_name: str, last_name: str):
    """Сохранение пользователя в базу данных"""
    if not db_pool:
        return False
    
    try:
        async with db_pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO bot_users (user_id, username, first_name, last_name, registered_at)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (user_id) DO UPDATE SET
                    username = EXCLUDED.username,
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name
            """, user_id, username, first_name, last_name, datetime.now())
        return True
    except Exception as e:
        logging.error(f"Failed to save user to database: {e}")
        return False

async def get_user_from_db(user_id: int):
    """Получение пользователя из базы данных"""
    if not db_pool:
        return None
    
    try:
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM bot_users WHERE user_id = $1", user_id)
            if row:
                user_data_json = row['user_data'] if row['user_data'] else '{}'
                user_data_dict = json.loads(user_data_json) if isinstance(user_data_json, str) else user_data_json
                return {
                    'user_id': row['user_id'],
                    'username': row['username'],
                    'first_name': row['first_name'],
                    'last_name': row['last_name'],
                    'registered_at': row['registered_at'],
                    'user_data': user_data_dict
                }
    except Exception as e:
        logging.error(f"Failed to get user from database: {e}")
    return None

async def update_user_data_in_db(user_id: int, key: str, value):
    """Обновление данных пользователя в базе данных"""
    if not db_pool:
        return False
    
    try:
        async with db_pool.acquire() as conn:
            # Получаем текущие данные
            row = await conn.fetchrow("SELECT user_data FROM bot_users WHERE user_id = $1", user_id)
            current_data = {}
            if row and row['user_data']:
                current_data = json.loads(row['user_data']) if isinstance(row['user_data'], str) else row['user_data']
            
            # Обновляем данные
            current_data[key] = value
            
            # Сохраняем обратно
            await conn.execute("""
                UPDATE bot_users SET user_data = $1 WHERE user_id = $2
            """, json.dumps(current_data), user_id)
        return True
    except Exception as e:
        logging.error(f"Failed to update user data in database: {e}")
        return False

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
    
    user_data_dict = user_record.get("user_data", {}) if isinstance(user_record, dict) and "user_data" in user_record else {}
    
    # Проверяем условие: user_data_exists
    if "источник" in user_data_dict and user_data_dict.get("источник") is not None:
        text = """С возвращением! 👋
Вы пришли к нам из источника: {источник}

Рады видеть вас снова!"""
        # Заменяем переменную на реальное значение
        source_value = user_data_dict.get("источник", "")
        if isinstance(source_value, dict):
            source_value = source_value.get("value", source_value.get("text", str(source_value)))
        text = text.replace("{источник}", str(source_value))
        logging.info(f"Условие выполнено: переменная источник существует")
    else:
        text = """Привет! 🌟
Добро пожаловать в наш бот!
Откуда вы узнали о нас?"""
        logging.info("Используется основное сообщение узла")
    
    # Создаем inline клавиатуру
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔍 Поиск в интернете", callback_data="source_search"))
    builder.add(InlineKeyboardButton(text="👥 Друзья", callback_data="source_friends"))
    builder.add(InlineKeyboardButton(text="📱 Реклама", callback_data="source_ads"))
    keyboard = builder.as_markup()
    await message.answer(text, reply_markup=keyboard)
    
    # Настраиваем сбор пользовательских ответов
    user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
    user_data[message.from_user.id]["input_collection_enabled"] = True
    user_data[message.from_user.id]["input_node_id"] = "start_node"
    user_data[message.from_user.id]["input_variable"] = "источник"

@dp.message(Command("help"))
async def help_handler(message: types.Message):
    logging.info(f"Команда /help вызвана пользователем {message.from_user.id}")
    user_id = message.from_user.id
    username = message.from_user.username
    first_name = message.from_user.first_name
    last_name = message.from_user.last_name
    
    # Сохраняем пользователя в базу данных
    saved_to_db = await save_user_to_db(user_id, username, first_name, last_name)
    
    # Получаем данные пользователя для проверки условий
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    
    user_data_dict = user_record.get("user_data", {}) if isinstance(user_record, dict) and "user_data" in user_record else {}
    
    # Проверяем условие: user_data_exists
    if "источник" in user_data_dict and user_data_dict.get("источник") is not None:
        text = """📖 Расширенная справка

Вы уже знакомы с ботом! Вот дополнительные возможности:

🔄 /start - персональное приветствие
📊 /stats - ваша статистика"""
        logging.info(f"Условие выполнено: переменная источник существует")
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
    
    await message.answer(text, reply_markup=ReplyKeyboardRemove())

@dp.message(Command("stats"))
async def stats_handler(message: types.Message):
    logging.info(f"Команда /stats вызвана пользователем {message.from_user.id}")
    user_id = message.from_user.id
    username = message.from_user.username
    first_name = message.from_user.first_name
    last_name = message.from_user.last_name
    
    # Сохраняем пользователя в базу данных
    saved_to_db = await save_user_to_db(user_id, username, first_name, last_name)
    
    # Получаем данные пользователя для проверки условий
    user_record = await get_user_from_db(user_id)
    if not user_record:
        user_record = user_data.get(user_id, {})
    
    user_data_dict = user_record.get("user_data", {}) if isinstance(user_record, dict) and "user_data" in user_record else {}
    
    # Проверяем условие: user_data_exists
    if "источник" in user_data_dict and user_data_dict.get("источник") is not None:
        source_value = user_data_dict.get("источник", "")
        if isinstance(source_value, dict):
            source_value = source_value.get("value", source_value.get("text", str(source_value)))
        text = f"""📊 Ваша статистика:

🔍 Источник: {source_value}
👤 Статус: Постоянный пользователь
🎯 Персонализация: Включена"""
        logging.info(f"Условие выполнено: переменная источник существует")
    else:
        text = """📊 Статистика

👤 Статус: Новый пользователь
🔍 Источник: Не указан
🎯 Персонализация: Отключена

Выберите источник в /start для активации персонализации!"""
        logging.info("Используется запасное сообщение")
    
    await message.answer(text, reply_markup=ReplyKeyboardRemove())

# Обработчики inline кнопок
@dp.callback_query(lambda c: c.data == "source_search")
async def handle_callback_source_search(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "🔍 Поиск в интернете"
    
    # ИСПРАВЛЕННАЯ ЛОГИКА: Сохраняем переменную для условных сообщений
    if user_id in user_data and user_data[user_id].get("input_variable"):
        variable_name = user_data[user_id]["input_variable"]
        await update_user_data_in_db(user_id, variable_name, button_text)
        logging.info(f"Переменная {variable_name} сохранена: {button_text} (пользователь {user_id})")
    
    text = """Отлично! 🎯
Теперь мы знаем, что вы нашли нас через поиск.

Попробуйте снова написать /start чтобы увидеть персонализированное приветствие!"""
    try:
        await callback_query.message.edit_text(text)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text)

@dp.callback_query(lambda c: c.data == "source_friends")
async def handle_callback_source_friends(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "👥 Друзья"
    
    # ИСПРАВЛЕННАЯ ЛОГИКА: Сохраняем переменную для условных сообщений
    if user_id in user_data and user_data[user_id].get("input_variable"):
        variable_name = user_data[user_id]["input_variable"]
        await update_user_data_in_db(user_id, variable_name, button_text)
        logging.info(f"Переменная {variable_name} сохранена: {button_text} (пользователь {user_id})")
    
    text = """Замечательно! 👥
Значит, вас порекомендовали друзья!

Теперь попробуйте /start еще раз - увидите, как изменится приветствие!"""
    try:
        await callback_query.message.edit_text(text)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text)

@dp.callback_query(lambda c: c.data == "source_ads")
async def handle_callback_source_ads(callback_query: types.CallbackQuery):
    await callback_query.answer()
    user_id = callback_query.from_user.id
    button_text = "📱 Реклама"
    
    # ИСПРАВЛЕННАЯ ЛОГИКА: Сохраняем переменную для условных сообщений
    if user_id in user_data and user_data[user_id].get("input_variable"):
        variable_name = user_data[user_id]["input_variable"]
        await update_user_data_in_db(user_id, variable_name, button_text)
        logging.info(f"Переменная {variable_name} сохранена: {button_text} (пользователь {user_id})")
    
    text = """Понятно! 📱
Вы пришли из рекламы.

Введите /start снова, чтобы увидеть персональное сообщение!"""
    try:
        await callback_query.message.edit_text(text)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text)

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