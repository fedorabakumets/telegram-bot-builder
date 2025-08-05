"""
ТЕСТ ИСПРАВЛЕНИЯ ДУБЛИРОВАНИЯ КЛАВИАТУР
Проверяем, что при включенном сборе пользовательского ввода не создается дублирования клавиатур
"""

import os
import logging
import asyncio
from datetime import datetime, timezone
import json
import asyncpg
from aiogram import Bot, Dispatcher, types
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import Command
from aiogram.types import (
    InlineKeyboardButton, 
    InlineKeyboardMarkup, 
    ReplyKeyboardMarkup, 
    KeyboardButton,
    ReplyKeyboardRemove,
    URLInputFile,
    FSInputFile,
    Location
)
from aiogram.utils.keyboard import InlineKeyboardBuilder, ReplyKeyboardBuilder

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Инициализация бота
bot_token = input("🤖 Введите токен вашего бота: ").strip()
if not bot_token:
    print("❌ Токен не может быть пустым!")
    exit(1)

bot = Bot(token=bot_token, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
dp = Dispatcher()

# Глобальные переменные для хранения данных пользователей
user_data = {}
db_pool = None

async def init_database():
    """Инициализация подключения к базе данных и создание таблиц"""
    global db_pool
    try:
        database_url = os.getenv('DATABASE_URL')
        if database_url:
            db_pool = await asyncpg.create_pool(database_url)
            async with db_pool.acquire() as conn:
                await conn.execute('''
                    CREATE TABLE IF NOT EXISTS bot_users (
                        user_id BIGINT PRIMARY KEY,
                        username VARCHAR(255),
                        first_name VARCHAR(255),
                        last_name VARCHAR(255),
                        registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        user_data JSONB DEFAULT '{}'::jsonb
                    )
                ''')
            logger.info("Подключение к базе данных успешно установлено")
        else:
            logger.warning("DATABASE_URL не найден, используется локальное хранилище")
    except Exception as e:
        logger.error(f"Ошибка подключения к базе данных: {e}")

async def save_user_to_db(user_id: int, username: str = None, first_name: str = None, last_name: str = None):
    """Сохраняет пользователя в базу данных"""
    if not db_pool:
        return
    try:
        async with db_pool.acquire() as conn:
            await conn.execute('''
                INSERT INTO bot_users (user_id, username, first_name, last_name, registration_date, last_activity)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (user_id) DO UPDATE SET
                    username = EXCLUDED.username,
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    last_activity = EXCLUDED.last_activity
            ''', user_id, username, first_name, last_name, datetime.now(timezone.utc), datetime.now(timezone.utc))
    except Exception as e:
        logger.error(f"Ошибка сохранения пользователя: {e}")

async def get_user_from_db(user_id: int):
    """Получает данные пользователя из базы данных"""
    if not db_pool:
        return None
    try:
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow('SELECT * FROM bot_users WHERE user_id = $1', user_id)
            return dict(row) if row else None
    except Exception as e:
        logger.error(f"Ошибка получения пользователя: {e}")
        return None

async def update_user_data_in_db(user_id: int, data_key: str, data_value):
    """Обновляет пользовательские данные в базе данных"""
    if not db_pool:
        return
    try:
        async with db_pool.acquire() as conn:
            # Получаем текущие данные
            current_data = await conn.fetchval('SELECT user_data FROM bot_users WHERE user_id = $1', user_id)
            if current_data is None:
                current_data = {}
            
            # Обновляем данные
            current_data[data_key] = data_value
            
            # Сохраняем обратно
            await conn.execute('UPDATE bot_users SET user_data = $1 WHERE user_id = $2', json.dumps(current_data), user_id)
    except Exception as e:
        logger.error(f"Ошибка обновления данных пользователя: {e}")

async def is_admin(user_id: int) -> bool:
    return user_id in []

async def is_private_chat(message: types.Message) -> bool:
    return message.chat.type == 'private'

async def check_auth(user_id: int) -> bool:
    return True

@dp.message(Command("start"))
async def start_handler(message: types.Message):
    """
    ТЕСТ: Команда /start с включенным сбором пользовательского ввода (кнопочный)
    Должна показать ТОЛЬКО кнопки из системы сбора ввода, без дублирования
    """
    
    # Сохраняем пользователя в базу данных
    await save_user_to_db(
        user_id=message.from_user.id,
        username=message.from_user.username,
        first_name=message.from_user.first_name,
        last_name=message.from_user.last_name
    )
    
    text = "👋 Добро пожаловать! Это тест исправления дублирования клавиатур.\n\nВыберите ваш возраст:"
    
    # СИСТЕМА СБОРА ВВОДА: Кнопочный тип (должна быть ЕДИНСТВЕННАЯ клавиатура)
    
    # Создаем inline клавиатуру для сбора ответов (система сбора ввода)
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="18-25", callback_data="input_start-1_age_18_25"))
    builder.add(InlineKeyboardButton(text="26-35", callback_data="input_start-1_age_26_35"))
    builder.add(InlineKeyboardButton(text="36-45", callback_data="input_start-1_age_36_45"))
    builder.add(InlineKeyboardButton(text="46+", callback_data="input_start-1_age_46_plus"))
    keyboard = builder.as_markup()
    await message.answer(text, reply_markup=keyboard, parse_mode=ParseMode.HTML)
    
    # Выбор будет сохранен через callback обработчики

@dp.message(Command("help"))
async def help_handler(message: types.Message):
    """
    ТЕСТ: Команда /help с включенным сбором пользовательского ввода (текстовый)
    Должна показать только текст без клавиатур (избегаем дублирования)
    """
    text = "❓ Помощь по боту. Введите ваш вопрос текстом:"
    
    # СИСТЕМА СБОРА ВВОДА: Текстовый тип (без дублирования клавиатур)
    await message.answer(text, parse_mode=ParseMode.HTML)
    
    # Устанавливаем состояние ожидания текстового ввода (без дублирования клавиатур)
    user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
    user_data[message.from_user.id]["waiting_for_input"] = "help-1"
    user_data[message.from_user.id]["input_type"] = "text"

@dp.message(Command("menu"))
async def menu_handler(message: types.Message):
    """
    ТЕСТ: Команда /menu БЕЗ сбора пользовательского ввода
    Должна показать обычную inline клавиатуру (это нормально)
    """
    text = "📋 Главное меню (без сбора ввода):"
    
    # Создаем inline клавиатуру с кнопками навигации
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="Настройки", callback_data="settings"))
    builder.add(InlineKeyboardButton(text="О боте", callback_data="about"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard, parse_mode=ParseMode.HTML)

# CALLBACK ОБРАБОТЧИКИ для сбора ввода

@dp.callback_query(lambda query: query.data.startswith("input_start-1_age_"))
async def handle_age_response(callback_query: types.CallbackQuery):
    """Обработчик ответов на вопрос о возрасте"""
    await callback_query.answer()
    
    # Извлекаем выбранный возраст
    age_choice = callback_query.data.replace("input_start-1_age_", "").replace("_", "-")
    
    # Сохраняем выбор пользователя
    user_data[callback_query.from_user.id] = user_data.get(callback_query.from_user.id, {})
    user_data[callback_query.from_user.id]["age"] = age_choice
    
    # Сохраняем в базу данных
    await update_user_data_in_db(callback_query.from_user.id, "age", age_choice)
    
    await callback_query.message.edit_text(
        f"✅ Отлично! Ваш возраст: {age_choice}\n\n🎯 ТЕСТ ПРОЙДЕН: Нет дублирования клавиатур!",
        parse_mode=ParseMode.HTML
    )

# Обработчики обычных кнопок (без сбора ввода)

@dp.callback_query(lambda query: query.data == "settings")
async def handle_settings(callback_query: types.CallbackQuery):
    """Обработчик кнопки настроек"""
    await callback_query.answer()
    await callback_query.message.edit_text("⚙️ Настройки бота", parse_mode=ParseMode.HTML)

@dp.callback_query(lambda query: query.data == "about")
async def handle_about(callback_query: types.CallbackQuery):
    """Обработчик кнопки о боте"""
    await callback_query.answer()
    await callback_query.message.edit_text("ℹ️ Тестовый бот для проверки исправления дублирования клавиатур", parse_mode=ParseMode.HTML)

# Универсальный обработчик пользовательского ввода

@dp.message()
async def handle_user_input(message: types.Message):
    """Универсальный обработчик пользовательского ввода"""
    user_id = message.from_user.id
    
    # Проверяем, ожидается ли ввод от пользователя
    if user_id in user_data and "waiting_for_input" in user_data[user_id]:
        node_id = user_data[user_id]["waiting_for_input"]
        input_type = user_data[user_id].get("input_type", "text")
        
        if node_id == "help-1":
            # Обрабатываем текстовый ввод для help
            question = message.text
            
            # Сохраняем ответ
            user_data[user_id]["question"] = question
            await update_user_data_in_db(user_id, "question", question)
            
            # Очищаем состояние ожидания
            del user_data[user_id]["waiting_for_input"]
            
            await message.answer(f"✅ Ваш вопрос получен: {question}\n\n🎯 ТЕСТ ПРОЙДЕН: Текстовый ввод работает без дублирования!", parse_mode=ParseMode.HTML)
        else:
            await message.answer("❓ Не понимаю, что вы хотите сделать")
    else:
        await message.answer("👋 Привет! Используйте команды /start, /help или /menu для тестирования")

async def main():
    """Основная функция запуска бота"""
    
    # Инициализация базы данных
    await init_database()
    
    print("🔧 ТЕСТ ИСПРАВЛЕНИЯ ДУБЛИРОВАНИЯ КЛАВИАТУР")
    print("==========================================")
    print("1. /start - тест кнопочного сбора ввода")
    print("2. /help - тест текстового сбора ввода") 
    print("3. /menu - тест обычных клавиатур")
    print("==========================================")
    print("🚀 Бот запущен и готов к тестированию!")
    
    try:
        await dp.start_polling(bot)
    finally:
        await bot.session.close()

if __name__ == "__main__":
    asyncio.run(main())