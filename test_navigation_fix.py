"""
Тест исправления навигации после текстового ввода - Telegram Bot
Этот бот тестирует исправленную функциональность перехода между узлами после ввода пользователя
"""

import logging
import asyncio
import asyncpg
import json
from datetime import datetime
from aiogram import Bot, Dispatcher, types, F
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardMarkup, KeyboardButton, ParseMode
from aiogram.utils.keyboard import InlineKeyboardBuilder, ReplyKeyboardBuilder
from aiogram.filters import Command
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.fsm.storage.memory import MemoryStorage

# Настройка логирования
logging.basicConfig(level=logging.INFO)

# Токен бота (будет заменен при запуске)
BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"

# Инициализация бота и диспетчера
session = AiohttpSession()
bot = Bot(token=BOT_TOKEN, session=session)
dp = Dispatcher(storage=MemoryStorage())

# Хранилище данных пользователей
user_data = {}

async def init_database():
    """Инициализация подключения к базе данных и создание таблиц"""
    try:
        # Подключение к PostgreSQL
        conn = await asyncpg.connect("postgresql://user:password@localhost/botdb")
        
        # Создание таблицы пользователей бота
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS bot_users (
                user_id BIGINT PRIMARY KEY,
                username TEXT,
                first_name TEXT,
                last_name TEXT,
                registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_data JSONB DEFAULT '{}'::jsonb,
                command_count INTEGER DEFAULT 0
            )
        ''')
        
        await conn.close()
        logging.info("База данных инициализирована успешно")
    except Exception as e:
        logging.warning(f"Не удалось подключиться к базе данных: {e}")

async def save_user_to_db(user_id: int, username: str = None, first_name: str = None, last_name: str = None):
    """Сохраняет пользователя в базу данных"""
    try:
        conn = await asyncpg.connect("postgresql://user:password@localhost/botdb")
        
        await conn.execute('''
            INSERT INTO bot_users (user_id, username, first_name, last_name)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id) DO UPDATE SET
                username = EXCLUDED.username,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                last_activity = CURRENT_TIMESTAMP
        ''', user_id, username, first_name, last_name)
        
        await conn.close()
        logging.info(f"Пользователь {user_id} сохранен в базу данных")
    except Exception as e:
        logging.warning(f"Ошибка сохранения пользователя в БД: {e}")

async def update_user_data_in_db(user_id: int, data_key: str, data_value):
    """Обновляет пользовательские данные в базе данных"""
    try:
        conn = await asyncpg.connect("postgresql://user:password@localhost/botdb")
        
        # Получаем текущие данные
        row = await conn.fetchrow('SELECT user_data FROM bot_users WHERE user_id = $1', user_id)
        current_data = dict(row['user_data']) if row and row['user_data'] else {}
        
        # Обновляем данные
        current_data[data_key] = {
            'value': data_value,
            'timestamp': datetime.now().isoformat(),
            'type': 'text_input'
        }
        
        # Сохраняем обновленные данные
        await conn.execute(
            'UPDATE bot_users SET user_data = $1 WHERE user_id = $2',
            json.dumps(current_data), user_id
        )
        
        await conn.close()
        logging.info(f"Данные пользователя {user_id} обновлены: {data_key} = {data_value}")
    except Exception as e:
        logging.warning(f"Ошибка обновления данных пользователя в БД: {e}")
        # Резервное хранение в памяти
        if user_id not in user_data:
            user_data[user_id] = {}
        user_data[user_id][data_key] = data_value

@dp.message(Command("start"))
async def start_handler(message: types.Message):
    await save_user_to_db(message.from_user.id, message.from_user.username, message.from_user.first_name, message.from_user.last_name)
    
    text = """🤖 Добро пожаловать в тест-бот!

Этот бот тестирует исправленную функциональность навигации после текстового ввода.

Выберите действие:"""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📝 Ввести имя", callback_data="name_input"))
    builder.add(InlineKeyboardButton(text="🎂 Ввести возраст", callback_data="age_input"))
    builder.add(InlineKeyboardButton(text="📍 Показать результаты", callback_data="show_results"))
    keyboard = builder.as_markup()
    await message.answer(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "name_input")
async def handle_callback_name_input(callback_query: types.CallbackQuery):
    await callback_query.answer()
    
    text = """📝 Введите ваше имя:

Пожалуйста, напишите ваше имя в следующем сообщении."""
    
    # Активируем сбор пользовательского ввода
    if callback_query.from_user.id not in user_data:
        user_data[callback_query.from_user.id] = {}
    
    user_data[callback_query.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "variable": "user_name",
        "save_to_database": True,
        "node_id": "name_input",
        "next_node_id": "show_name_result"
    }
    
    # Пытаемся редактировать сообщение, если не получается - отправляем новое
    try:
        await callback_query.message.edit_text(text)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text)

@dp.callback_query(lambda c: c.data == "age_input")
async def handle_callback_age_input(callback_query: types.CallbackQuery):
    await callback_query.answer()
    
    text = """🎂 Введите ваш возраст:

Пожалуйста, напишите ваш возраст числом в следующем сообщении."""
    
    # Активируем сбор пользовательского ввода
    if callback_query.from_user.id not in user_data:
        user_data[callback_query.from_user.id] = {}
    
    user_data[callback_query.from_user.id]["waiting_for_input"] = {
        "type": "number",
        "variable": "user_age",
        "save_to_database": True,
        "node_id": "age_input",
        "next_node_id": "show_age_result"
    }
    
    # Пытаемся редактировать сообщение, если не получается - отправляем новое
    try:
        await callback_query.message.edit_text(text)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text)

@dp.callback_query(lambda c: c.data == "show_name_result")
async def handle_callback_show_name_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    
    user_name = user_data.get(callback_query.from_user.id, {}).get("user_name", "Неизвестно")
    
    text = f"""✅ Спасибо за ввод имени!

Ваше имя: {user_name}

Хотите ввести что-то еще?"""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🎂 Ввести возраст", callback_data="age_input"))
    builder.add(InlineKeyboardButton(text="🏠 В главное меню", callback_data="start_1"))
    keyboard = builder.as_markup()
    
    # Пытаемся редактировать сообщение, если не получается - отправляем новое
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "show_age_result")
async def handle_callback_show_age_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    
    user_age = user_data.get(callback_query.from_user.id, {}).get("user_age", "Неизвестно")
    
    text = f"""✅ Спасибо за ввод возраста!

Ваш возраст: {user_age}

Хотите ввести что-то еще?"""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📝 Ввести имя", callback_data="name_input"))
    builder.add(InlineKeyboardButton(text="🏠 В главное меню", callback_data="start_1"))
    keyboard = builder.as_markup()
    
    # Пытаемся редактировать сообщение, если не получается - отправляем новое
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "show_results")
async def handle_callback_show_results(callback_query: types.CallbackQuery):
    await callback_query.answer()
    
    user_name = user_data.get(callback_query.from_user.id, {}).get("user_name", "Не указано")
    user_age = user_data.get(callback_query.from_user.id, {}).get("user_age", "Не указано")
    
    text = f"""📊 Ваши данные:

👤 Имя: {user_name}
🎂 Возраст: {user_age}

Хотите изменить данные?"""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📝 Изменить имя", callback_data="name_input"))
    builder.add(InlineKeyboardButton(text="🎂 Изменить возраст", callback_data="age_input"))
    builder.add(InlineKeyboardButton(text="🏠 В главное меню", callback_data="start_1"))
    keyboard = builder.as_markup()
    
    # Пытаемся редактировать сообщение, если не получается - отправляем новое
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "start_1")
async def handle_callback_start_1(callback_query: types.CallbackQuery):
    await callback_query.answer()
    
    text = """🤖 Главное меню

Выберите действие:"""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📝 Ввести имя", callback_data="name_input"))
    builder.add(InlineKeyboardButton(text="🎂 Ввести возраст", callback_data="age_input"))
    builder.add(InlineKeyboardButton(text="📍 Показать результаты", callback_data="show_results"))
    keyboard = builder.as_markup()
    
    # Пытаемся редактировать сообщение, если не получается - отправляем новое
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard)

# Универсальный обработчик пользовательского ввода
@dp.message()
async def handle_user_input(message: types.Message):
    user_id = message.from_user.id
    
    # Проверяем, ожидается ли ввод от пользователя
    if user_id not in user_data or "waiting_for_input" not in user_data[user_id]:
        await message.answer("🤷‍♂️ Я не понимаю. Используйте /start для начала работы.")
        return
    
    input_config = user_data[user_id]["waiting_for_input"]
    input_type = input_config.get("type", "text")
    variable_name = input_config.get("variable", "response")
    save_to_db = input_config.get("save_to_database", False)
    next_node_id = input_config.get("next_node_id", "")
    
    user_input = message.text.strip()
    
    # Валидация ввода
    if input_type == "number":
        try:
            user_input = int(user_input)
        except ValueError:
            await message.answer("❌ Пожалуйста, введите корректное число.")
            return
    
    # Сохраняем введенные данные
    if user_id not in user_data:
        user_data[user_id] = {}
    
    user_data[user_id][variable_name] = user_input
    
    # Сохранение в базу данных
    if save_to_db:
        await update_user_data_in_db(user_id, variable_name, user_input)
    
    # Убираем флаг ожидания ввода
    del user_data[user_id]["waiting_for_input"]
    
    # Переходим к следующему узлу
    if next_node_id:
        # Имитируем callback_query для перехода к следующему узлу
        fake_callback = types.CallbackQuery(
            id="fake_" + str(message.message_id),
            from_user=message.from_user,
            chat_instance="fake_chat",
            data=next_node_id,
            message=message
        )
        
        if next_node_id == "show_name_result":
            await handle_callback_show_name_result(fake_callback)
        elif next_node_id == "show_age_result":
            await handle_callback_show_age_result(fake_callback)
    else:
        await message.answer("✅ Данные сохранены! Используйте /start для продолжения.")

async def main():
    await init_database()
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())