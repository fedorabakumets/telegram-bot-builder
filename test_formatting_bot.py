"""
Тестовый бот для проверки форматирования текста - Telegram Bot
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
    logging.info(f"Команда /start вызвана пользователем {message.from_user.id}")

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

    text = """🔧 Тест форматирования текста

<b>Жирный текст</b>
<i>Курсивный текст</i>
<u>Подчеркнутый текст</u>
<s>Зачеркнутый текст</s>
<code>Код</code>
<pre>Блок кода</pre>

<blockquote>Цитата</blockquote>
<blockquote expandable>Раскрывающаяся цитата</blockquote>

<tg-spoiler>Скрытый текст</tg-spoiler>

<a href="https://example.com">Ссылка</a>"""
    
    # Создаем inline клавиатуру
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔤 Markdown тест", callback_data="markdown_test"))
    builder.add(InlineKeyboardButton(text="🎨 HTML тест", callback_data="html_test"))
    builder.add(InlineKeyboardButton(text="📄 Обычный текст", callback_data="plain_test"))
    keyboard = builder.as_markup()
    await message.answer(text, reply_markup=keyboard, parse_mode=ParseMode.HTML)

@dp.callback_query(F.data == "markdown_test")
async def handle_callback_markdown_test(callback_query: types.CallbackQuery):
    text = """🔧 Тест Markdown форматирования

**Жирный текст**
*Курсивный текст*
__Подчеркнутый текст__
~~Зачеркнутый текст~~
`Код`
```
Блок кода
```

> Цитата
>> Вложенная цитата

||Спойлер||

[Ссылка](https://example.com)"""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_start"))
    keyboard = builder.as_markup()
    
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(F.data == "html_test")
async def handle_callback_html_test(callback_query: types.CallbackQuery):
    text = """🔧 Тест HTML форматирования

<b>Жирный текст</b>
<i>Курсивный текст</i>
<u>Подчеркнутый текст</u>
<s>Зачеркнутый текст</s>
<code>Код</code>
<pre>Блок кода</pre>

<blockquote>Цитата</blockquote>
<blockquote expandable>Раскрывающаяся цитата</blockquote>

<tg-spoiler>Скрытый текст</tg-spoiler>

<a href="https://example.com">Ссылка</a>"""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_start"))
    keyboard = builder.as_markup()
    
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.HTML)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard, parse_mode=ParseMode.HTML)

@dp.callback_query(F.data == "plain_test")
async def handle_callback_plain_test(callback_query: types.CallbackQuery):
    text = """🔧 Тест обычного текста

**Жирный текст** - не работает
*Курсивный текст* - не работает
__Подчеркнутый текст__ - не работает
<b>HTML теги</b> - не работают
<i>Курсив HTML</i> - не работает

Обычный текст без форматирования отображается как есть."""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_start"))
    keyboard = builder.as_markup()
    
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard)

@dp.callback_query(F.data == "back_to_start")
async def handle_callback_back_to_start(callback_query: types.CallbackQuery):
    text = """🔧 Тест форматирования текста

<b>Жирный текст</b>
<i>Курсивный текст</i>
<u>Подчеркнутый текст</u>
<s>Зачеркнутый текст</s>
<code>Код</code>
<pre>Блок кода</pre>

<blockquote>Цитата</blockquote>
<blockquote expandable>Раскрывающаяся цитата</blockquote>

<tg-spoiler>Скрытый текст</tg-spoiler>

<a href="https://example.com">Ссылка</a>"""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔤 Markdown тест", callback_data="markdown_test"))
    builder.add(InlineKeyboardButton(text="🎨 HTML тест", callback_data="html_test"))
    builder.add(InlineKeyboardButton(text="📄 Обычный текст", callback_data="plain_test"))
    keyboard = builder.as_markup()
    
    try:
        await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.HTML)
    except Exception as e:
        logging.warning(f"Не удалось редактировать сообщение: {e}. Отправляем новое.")
        await callback_query.message.answer(text, reply_markup=keyboard, parse_mode=ParseMode.HTML)

async def main():
    await init_database()
    
    # Настраиваем команды для меню
    commands = [
        BotCommand(command="start", description="Запустить бота"),
    ]
    await bot.set_my_commands(commands)
    
    logging.info("✅ Бот запущен")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())