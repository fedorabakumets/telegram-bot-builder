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

    text = f"🏢 <b>ДОБРО ПОЖАЛОВАТЬ В СИСТЕМУ СБОРА КОРПОРАТИВНОЙ ИНФОРМАЦИИ</b>\n\n📋 <b>Этот процесс включает:</b>\n• 👤 Персональные данные сотрудника\n• 🏢 Информация о компании\n• 💼 Профессиональный опыт\n• 📊 Текущие проекты\n• 🎯 Цели и планы\n• 📞 Контактная информация\n• 🔒 Конфиденциальность\n\n⏱️ <b>Время заполнения:</b> 30-45 минут\n🎯 <b>Результат:</b> Полная корпоративная анкета\n\n<b>Начинаем процесс сбора информации?</b>"
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🚀 Начать заполнение", callback_data="personal-info"))
    builder.add(InlineKeyboardButton(text="🔒 Политика конфиденциальности", callback_data="privacy-policy"))
    builder.add(InlineKeyboardButton(text="📖 Инструкции", callback_data="filling-instructions"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "personal-info")
async def handle_callback_personal_info(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Удаляем старое сообщение
    await callback_query.message.delete()
    
    text = f"👤 <b>РАЗДЕЛ 1: ПЕРСОНАЛЬНЫЕ ДАННЫЕ</b>\n\n<b>Введите ваше полное имя:</b>\n\n<i>Пример: Иванов Иван Иванович</i>\n\n📝 Укажите фамилию, имя и отчество полностью"
    placeholder_text = "Фамилия Имя Отчество"
    text += f"\n\n💡 {placeholder_text}"
    await bot.send_message(callback_query.from_user.id, text)
    
    # Инициализируем пользовательские данные если их нет
    if callback_query.from_user.id not in user_data:
        user_data[callback_query.from_user.id] = {}
    
    # Настраиваем ожидание ввода
    user_data[callback_query.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "variable": "full_name",
        "validation": "",
        "min_length": 3,
        "max_length": 100,
        "timeout": 300,
        "required": True,
        "allow_skip": False,
        "save_to_database": True,
        "retry_message": "Пожалуйста, укажите ваше полное имя (минимум 3 символа)",
        "success_message": "✅ Имя сохранено",
        "prompt": "👤 <b>РАЗДЕЛ 1: ПЕРСОНАЛЬНЫЕ ДАННЫЕ</b>\n\n<b>Введите ваше полное имя:</b>\n\n<i>Пример: Иванов Иван Иванович</i>\n\n📝 Укажите фамилию, имя и отчество полностью",
        "node_id": "personal-info",
        "next_node_id": "position-info"
    }

@dp.callback_query(lambda c: c.data == "privacy-policy")
async def handle_callback_privacy_policy(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🔒 <b>ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ</b>

✅ <b>Мы гарантируем:</b>
• Защиту всех персональных данных
• Использование данных только для внутренних целей
• Соблюдение требований GDPR и 152-ФЗ
• Возможность удаления данных по запросу

🛡️ <b>Безопасность:</b>
• Шифрование данных при передаче
• Ограниченный доступ к информации
• Регулярные аудиты безопасности

📧 <b>Контакты:</b> privacy@company.com"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="✅ Принять и продолжить", callback_data="personal-info"))
    builder.add(InlineKeyboardButton(text="◀️ Назад к началу", callback_data="start-welcome"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "filling-instructions")
async def handle_callback_filling_instructions(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📖 <b>ИНСТРУКЦИИ ПО ЗАПОЛНЕНИЮ</b>

🎯 <b>Общие рекомендации:</b>
• Заполняйте все поля максимально точно
• При необходимости используйте кнопку "Пропустить"
• Можете вернуться к предыдущим разделам
• Сохранение происходит автоматически

⚡ <b>Быстрые команды:</b>
• /help - помощь в любое время
• /status - текущий прогресс
• /reset - начать заново

💡 <b>Совет:</b> Подготовьте заранее данные о компании и проектах"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🚀 Начать заполнение", callback_data="personal-info"))
    builder.add(InlineKeyboardButton(text="◀️ Назад к началу", callback_data="start-welcome"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "start-welcome")
async def handle_callback_start_welcome(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🏢 <b>ДОБРО ПОЖАЛОВАТЬ В СИСТЕМУ СБОРА КОРПОРАТИВНОЙ ИНФОРМАЦИИ</b>

📋 <b>Этот процесс включает:</b>
• 👤 Персональные данные сотрудника
• 🏢 Информация о компании
• 💼 Профессиональный опыт
• 📊 Текущие проекты
• 🎯 Цели и планы
• 📞 Контактная информация
• 🔒 Конфиденциальность

⏱️ <b>Время заполнения:</b> 30-45 минут
🎯 <b>Результат:</b> Полная корпоративная анкета

<b>Начинаем процесс сбора информации?</b>"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🚀 Начать заполнение", callback_data="personal-info"))
    builder.add(InlineKeyboardButton(text="🔒 Политика конфиденциальности", callback_data="privacy-policy"))
    builder.add(InlineKeyboardButton(text="📖 Инструкции", callback_data="filling-instructions"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "position-info")
async def handle_callback_position_info(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Удаляем старое сообщение
    await callback_query.message.delete()
    
    text = f"💼 **РАЗДЕЛ 2: ДОЛЖНОСТЬ И ОТДЕЛ**\n\n**Укажите вашу текущую должность:**\n\n*Пример: Ведущий разработчик / Менеджер проектов / Системный аналитик*\n\n📝 Укажите полное название должности"
    placeholder_text = "Название должности"
    text += f"\n\n💡 {placeholder_text}"
    await bot.send_message(callback_query.from_user.id, text)
    
    # Инициализируем пользовательские данные если их нет
    if callback_query.from_user.id not in user_data:
        user_data[callback_query.from_user.id] = {}
    
    # Настраиваем ожидание ввода
    user_data[callback_query.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "variable": "position_title",
        "validation": "",
        "min_length": 3,
        "max_length": 150,
        "timeout": 300,
        "required": True,
        "allow_skip": False,
        "save_to_database": True,
        "retry_message": "Пожалуйста, укажите вашу должность (минимум 3 символа)",
        "success_message": "✅ Должность сохранена",
        "prompt": "💼 **РАЗДЕЛ 2: ДОЛЖНОСТЬ И ОТДЕЛ**\n\n**Укажите вашу текущую должность:**\n\n*Пример: Ведущий разработчик / Менеджер проектов / Системный аналитик*\n\n📝 Укажите полное название должности",
        "node_id": "position-info",
        "next_node_id": "department-choice"
    }

@dp.callback_query(lambda c: c.data == "department-choice")
async def handle_callback_department_choice(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Удаляем старое сообщение
    await callback_query.message.delete()
    
    text = f"🏢 **РАЗДЕЛ 3: ОТДЕЛ/ПОДРАЗДЕЛЕНИЕ**\n\n**Выберите ваш отдел:**\n\nЕсли вашего отдела нет в списке, выберите \"Другое\""
    
    # Создаем кнопки для выбора ответа
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="💻 IT-отдел", callback_data="response_department-choice_0"))
    builder.add(InlineKeyboardButton(text="📈 Отдел продаж", callback_data="response_department-choice_1"))
    builder.add(InlineKeyboardButton(text="📢 Маркетинг", callback_data="response_department-choice_2"))
    builder.add(InlineKeyboardButton(text="👥 HR-отдел", callback_data="response_department-choice_3"))
    builder.add(InlineKeyboardButton(text="💰 Финансы", callback_data="response_department-choice_4"))
    builder.add(InlineKeyboardButton(text="⚙️ Операции", callback_data="response_department-choice_5"))
    builder.add(InlineKeyboardButton(text="👔 Руководство", callback_data="response_department-choice_6"))
    builder.add(InlineKeyboardButton(text="📋 Другое", callback_data="response_department-choice_7"))
    keyboard = builder.as_markup()
    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)
    
    # Инициализируем пользовательские данные если их нет
    if callback_query.from_user.id not in user_data:
        user_data[callback_query.from_user.id] = {}
    
    # Сохраняем настройки для обработки ответа
    user_data[callback_query.from_user.id]["button_response_config"] = {
        "node_id": "department-choice",
        "variable": "department",
        "save_to_database": True,
        "success_message": "Спасибо за ваш ответ!",
        "allow_multiple": False,
        "next_node_id": "experience-level",
        "options": [
            {"index": 0, "text": "💻 IT-отдел", "value": "IT"},
            {"index": 1, "text": "📈 Отдел продаж", "value": "sales"},
            {"index": 2, "text": "📢 Маркетинг", "value": "marketing"},
            {"index": 3, "text": "👥 HR-отдел", "value": "hr"},
            {"index": 4, "text": "💰 Финансы", "value": "finance"},
            {"index": 5, "text": "⚙️ Операции", "value": "operations"},
            {"index": 6, "text": "👔 Руководство", "value": "management"},
            {"index": 7, "text": "📋 Другое", "value": "other"},
        ],
        "selected": []
    }

@dp.callback_query(lambda c: c.data == "experience-level")
async def handle_callback_experience_level(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Удаляем старое сообщение
    await callback_query.message.delete()
    
    text = f"⭐ **РАЗДЕЛ 4: ОПЫТ РАБОТЫ**\n\n**Укажите ваш уровень опыта:**\n\nВыберите наиболее подходящий вариант"
    
    # Создаем кнопки для выбора ответа
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🌱 Начинающий (0-2 года)", callback_data="response_experience-level_0"))
    builder.add(InlineKeyboardButton(text="💼 Средний (2-5 лет)", callback_data="response_experience-level_1"))
    builder.add(InlineKeyboardButton(text="🎯 Старший (5-10 лет)", callback_data="response_experience-level_2"))
    builder.add(InlineKeyboardButton(text="👑 Ведущий (10+ лет)", callback_data="response_experience-level_3"))
    builder.add(InlineKeyboardButton(text="🏆 Руководитель", callback_data="response_experience-level_4"))
    keyboard = builder.as_markup()
    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)
    
    # Инициализируем пользовательские данные если их нет
    if callback_query.from_user.id not in user_data:
        user_data[callback_query.from_user.id] = {}
    
    # Сохраняем настройки для обработки ответа
    user_data[callback_query.from_user.id]["button_response_config"] = {
        "node_id": "experience-level",
        "variable": "experience_level",
        "save_to_database": True,
        "success_message": "Спасибо за ваш ответ!",
        "allow_multiple": False,
        "next_node_id": "company-info",
        "options": [
            {"index": 0, "text": "🌱 Начинающий (0-2 года)", "value": "junior"},
            {"index": 1, "text": "💼 Средний (2-5 лет)", "value": "middle"},
            {"index": 2, "text": "🎯 Старший (5-10 лет)", "value": "senior"},
            {"index": 3, "text": "👑 Ведущий (10+ лет)", "value": "lead"},
            {"index": 4, "text": "🏆 Руководитель", "value": "executive"},
        ],
        "selected": []
    }

@dp.callback_query(lambda c: c.data == "company-info")
async def handle_callback_company_info(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Удаляем старое сообщение
    await callback_query.message.delete()
    
    text = f"🏢 **РАЗДЕЛ 5: ИНФОРМАЦИЯ О КОМПАНИИ**\n\n**Укажите название вашей компании:**\n\n*Пример: ООО \"Технологические решения\" / АО \"Инновации\" / ИП Иванов И.И.*\n\n📝 Полное или сокращенное наименование"
    placeholder_text = "Название компании"
    text += f"\n\n💡 {placeholder_text}"
    await bot.send_message(callback_query.from_user.id, text)
    
    # Инициализируем пользовательские данные если их нет
    if callback_query.from_user.id not in user_data:
        user_data[callback_query.from_user.id] = {}
    
    # Настраиваем ожидание ввода
    user_data[callback_query.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "variable": "company_name",
        "validation": "",
        "min_length": 2,
        "max_length": 200,
        "timeout": 300,
        "required": True,
        "allow_skip": False,
        "save_to_database": True,
        "retry_message": "Пожалуйста, укажите название компании (минимум 2 символа)",
        "success_message": "✅ Название компании сохранено",
        "prompt": "🏢 **РАЗДЕЛ 5: ИНФОРМАЦИЯ О КОМПАНИИ**\n\n**Укажите название вашей компании:**\n\n*Пример: ООО \"Технологические решения\" / АО \"Инновации\" / ИП Иванов И.И.*\n\n📝 Полное или сокращенное наименование",
        "node_id": "company-info",
        "next_node_id": "company-size"
    }

@dp.callback_query(lambda c: c.data == "company-size")
async def handle_callback_company_size(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Удаляем старое сообщение
    await callback_query.message.delete()
    
    text = f"📊 **РАЗДЕЛ 6: РАЗМЕР КОМПАНИИ**\n\n**Выберите размер вашей компании:**\n\nУкажите примерное количество сотрудников"
    
    # Создаем кнопки для выбора ответа
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="👤 Микро (1-10 человек)", callback_data="response_company-size_0"))
    builder.add(InlineKeyboardButton(text="👥 Малая (11-50 человек)", callback_data="response_company-size_1"))
    builder.add(InlineKeyboardButton(text="🏢 Средняя (51-250 человек)", callback_data="response_company-size_2"))
    builder.add(InlineKeyboardButton(text="🏬 Большая (251-1000 человек)", callback_data="response_company-size_3"))
    builder.add(InlineKeyboardButton(text="🏭 Корпорация (1000+ человек)", callback_data="response_company-size_4"))
    keyboard = builder.as_markup()
    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)
    
    # Инициализируем пользовательские данные если их нет
    if callback_query.from_user.id not in user_data:
        user_data[callback_query.from_user.id] = {}
    
    # Сохраняем настройки для обработки ответа
    user_data[callback_query.from_user.id]["button_response_config"] = {
        "node_id": "company-size",
        "variable": "company_size",
        "save_to_database": True,
        "success_message": "Спасибо за ваш ответ!",
        "allow_multiple": False,
        "next_node_id": "project-info",
        "options": [
            {"index": 0, "text": "👤 Микро (1-10 человек)", "value": "micro"},
            {"index": 1, "text": "👥 Малая (11-50 человек)", "value": "small"},
            {"index": 2, "text": "🏢 Средняя (51-250 человек)", "value": "medium"},
            {"index": 3, "text": "🏬 Большая (251-1000 человек)", "value": "large"},
            {"index": 4, "text": "🏭 Корпорация (1000+ человек)", "value": "enterprise"},
        ],
        "selected": []
    }

@dp.callback_query(lambda c: c.data == "project-info")
async def handle_callback_project_info(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Удаляем старое сообщение
    await callback_query.message.delete()
    
    text = f"📋 **РАЗДЕЛ 7: ТЕКУЩИЕ ПРОЕКТЫ**\n\n**Опишите ваши текущие проекты:**\n\n*Пример: Разработка CRM-системы, внедрение системы аналитики, автоматизация бизнес-процессов*\n\n📝 Укажите 2-3 основных проекта"
    placeholder_text = "Описание текущих проектов..."
    text += f"\n\n💡 {placeholder_text}"
    text += "\n\n⏭️ Нажмите /skip чтобы пропустить"
    await bot.send_message(callback_query.from_user.id, text)
    
    # Инициализируем пользовательские данные если их нет
    if callback_query.from_user.id not in user_data:
        user_data[callback_query.from_user.id] = {}
    
    # Настраиваем ожидание ввода
    user_data[callback_query.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "variable": "current_projects",
        "validation": "",
        "min_length": 10,
        "max_length": 1000,
        "timeout": 600,
        "required": True,
        "allow_skip": True,
        "save_to_database": True,
        "retry_message": "Пожалуйста, опишите ваши проекты подробнее (минимум 10 символов)",
        "success_message": "✅ Информация о проектах сохранена",
        "prompt": "📋 **РАЗДЕЛ 7: ТЕКУЩИЕ ПРОЕКТЫ**\n\n**Опишите ваши текущие проекты:**\n\n*Пример: Разработка CRM-системы, внедрение системы аналитики, автоматизация бизнес-процессов*\n\n📝 Укажите 2-3 основных проекта",
        "node_id": "project-info",
        "next_node_id": "goals-objectives"
    }

@dp.callback_query(lambda c: c.data == "goals-objectives")
async def handle_callback_goals_objectives(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Удаляем старое сообщение
    await callback_query.message.delete()
    
    text = f"🎯 **РАЗДЕЛ 8: ЦЕЛИ И ЗАДАЧИ**\n\n**Опишите ваши профессиональные цели:**\n\n*Пример: Развитие в области машинного обучения, получение сертификации, повышение до тимлида*\n\n📝 Укажите краткосрочные и долгосрочные цели"
    placeholder_text = "Профессиональные цели и задачи..."
    text += f"\n\n💡 {placeholder_text}"
    text += "\n\n⏭️ Нажмите /skip чтобы пропустить"
    await bot.send_message(callback_query.from_user.id, text)
    
    # Инициализируем пользовательские данные если их нет
    if callback_query.from_user.id not in user_data:
        user_data[callback_query.from_user.id] = {}
    
    # Настраиваем ожидание ввода
    user_data[callback_query.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "variable": "professional_goals",
        "validation": "",
        "min_length": 10,
        "max_length": 800,
        "timeout": 600,
        "required": True,
        "allow_skip": True,
        "save_to_database": True,
        "retry_message": "Пожалуйста, опишите ваши цели подробнее (минимум 10 символов)",
        "success_message": "✅ Профессиональные цели сохранены",
        "prompt": "🎯 **РАЗДЕЛ 8: ЦЕЛИ И ЗАДАЧИ**\n\n**Опишите ваши профессиональные цели:**\n\n*Пример: Развитие в области машинного обучения, получение сертификации, повышение до тимлида*\n\n📝 Укажите краткосрочные и долгосрочные цели",
        "node_id": "goals-objectives",
        "next_node_id": "contact-info"
    }

@dp.callback_query(lambda c: c.data == "contact-info")
async def handle_callback_contact_info(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Удаляем старое сообщение
    await callback_query.message.delete()
    
    text = f"📞 **РАЗДЕЛ 9: КОНТАКТНАЯ ИНФОРМАЦИЯ**\n\n**Укажите ваш рабочий email:**\n\n*Пример: ivan.ivanov@company.com*\n\n📧 Корпоративный или основной email для связи"
    placeholder_text = "email@company.com"
    text += f"\n\n💡 {placeholder_text}"
    await bot.send_message(callback_query.from_user.id, text)
    
    # Инициализируем пользовательские данные если их нет
    if callback_query.from_user.id not in user_data:
        user_data[callback_query.from_user.id] = {}
    
    # Настраиваем ожидание ввода
    user_data[callback_query.from_user.id]["waiting_for_input"] = {
        "type": "email",
        "variable": "work_email",
        "validation": "",
        "min_length": 5,
        "max_length": 150,
        "timeout": 300,
        "required": True,
        "allow_skip": False,
        "save_to_database": True,
        "retry_message": "Пожалуйста, укажите корректный email адрес",
        "success_message": "✅ Email сохранен",
        "prompt": "📞 **РАЗДЕЛ 9: КОНТАКТНАЯ ИНФОРМАЦИЯ**\n\n**Укажите ваш рабочий email:**\n\n*Пример: ivan.ivanov@company.com*\n\n📧 Корпоративный или основной email для связи",
        "node_id": "contact-info",
        "next_node_id": "phone-info"
    }

@dp.callback_query(lambda c: c.data == "phone-info")
async def handle_callback_phone_info(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Удаляем старое сообщение
    await callback_query.message.delete()
    
    text = f"📱 **РАЗДЕЛ 10: ТЕЛЕФОН**\n\n**Укажите ваш рабочий телефон:**\n\n*Пример: +7 (999) 123-45-67*\n\n📞 Рабочий или мобильный телефон для связи"
    placeholder_text = "+7 (999) 123-45-67"
    text += f"\n\n💡 {placeholder_text}"
    text += "\n\n⏭️ Нажмите /skip чтобы пропустить"
    await bot.send_message(callback_query.from_user.id, text)
    
    # Инициализируем пользовательские данные если их нет
    if callback_query.from_user.id not in user_data:
        user_data[callback_query.from_user.id] = {}
    
    # Настраиваем ожидание ввода
    user_data[callback_query.from_user.id]["waiting_for_input"] = {
        "type": "phone",
        "variable": "work_phone",
        "validation": "",
        "min_length": 10,
        "max_length": 20,
        "timeout": 300,
        "required": True,
        "allow_skip": True,
        "save_to_database": True,
        "retry_message": "Пожалуйста, укажите корректный номер телефона",
        "success_message": "✅ Телефон сохранен",
        "prompt": "📱 **РАЗДЕЛ 10: ТЕЛЕФОН**\n\n**Укажите ваш рабочий телефон:**\n\n*Пример: +7 (999) 123-45-67*\n\n📞 Рабочий или мобильный телефон для связи",
        "node_id": "phone-info",
        "next_node_id": "additional-info"
    }

@dp.callback_query(lambda c: c.data == "additional-info")
async def handle_callback_additional_info(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Удаляем старое сообщение
    await callback_query.message.delete()
    
    text = f"📝 **РАЗДЕЛ 11: ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ**\n\n**Есть ли что-то еще, что вы хотели бы добавить?**\n\n*Пример: Навыки, сертификаты, интересные проекты, предложения по улучшению*\n\n💡 Любая дополнительная информация о вас или вашей работе"
    placeholder_text = "Дополнительная информация (необязательно)..."
    text += f"\n\n💡 {placeholder_text}"
    text += "\n\n⏭️ Нажмите /skip чтобы пропустить"
    await bot.send_message(callback_query.from_user.id, text)
    
    # Инициализируем пользовательские данные если их нет
    if callback_query.from_user.id not in user_data:
        user_data[callback_query.from_user.id] = {}
    
    # Настраиваем ожидание ввода
    user_data[callback_query.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "variable": "additional_notes",
        "validation": "",
        "min_length": 0,
        "max_length": 1000,
        "timeout": 600,
        "required": False,
        "allow_skip": True,
        "save_to_database": True,
        "retry_message": "Слишком много текста, сократите до 1000 символов",
        "success_message": "✅ Дополнительная информация сохранена",
        "prompt": "📝 **РАЗДЕЛ 11: ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ**\n\n**Есть ли что-то еще, что вы хотели бы добавить?**\n\n*Пример: Навыки, сертификаты, интересные проекты, предложения по улучшению*\n\n💡 Любая дополнительная информация о вас или вашей работе",
        "node_id": "additional-info",
        "next_node_id": "final-review"
    }

@dp.callback_query(lambda c: c.data == "final-review")
async def handle_callback_final_review(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🎉 **СБОР ИНФОРМАЦИИ ЗАВЕРШЕН!**

✅ **Собранные данные:**
• 👤 Персональные данные
• 💼 Профессиональная информация
• 🏢 Данные о компании
• 📊 Проекты и цели
• 📞 Контактная информация

🔄 **Что делать дальше:**
• Данные сохранены в системе
• Вы получите подтверждение на email
• Можете обновить данные в любое время

**Спасибо за участие!**"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📄 Скачать PDF", callback_data="download-info"))
    builder.add(InlineKeyboardButton(text="📧 Отправить на email", callback_data="email-confirmation"))
    builder.add(InlineKeyboardButton(text="🔄 Начать заново", callback_data="start-welcome"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "download-info")
async def handle_callback_download_info(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📄 **СКАЧИВАНИЕ PDF ОТЧЕТА**

🔄 **Генерируем отчет...**

📊 **Отчет будет содержать:**
• Все введенные данные
• Структурированный вид
• Timestamp создания
• Подпись системы

⏱️ Готовность через 10-15 секунд"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="✅ PDF готов", callback_data="final-review"))
    builder.add(InlineKeyboardButton(text="◀️ Назад к результатам", callback_data="final-review"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "email-confirmation")
async def handle_callback_email_confirmation(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📧 **ОТПРАВКА НА EMAIL**

✅ **Письмо отправлено на:**
{work_email}

📬 **Содержимое письма:**
• Полный отчет с данными
• Ссылка для редактирования
• Контакты для обратной связи

⏱️ Проверьте почту в течение 5 минут"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="✅ Понятно", callback_data="final-review"))
    builder.add(InlineKeyboardButton(text="🔄 Отправить повторно", callback_data="email-confirmation"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

# Обработчики кнопочных ответов для сбора пользовательского ввода

@dp.callback_query(F.data == "response_department-choice_0")
async def handle_response_department_choice_0(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "IT"
    selected_text = "💻 IT-отдел"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-welcome":
                            await handle_callback_start_welcome(callback_query)
                        elif next_node_id == "privacy-policy":
                            await handle_callback_privacy_policy(callback_query)
                        elif next_node_id == "filling-instructions":
                            await handle_callback_filling_instructions(callback_query)
                        elif next_node_id == "personal-info":
                            await handle_callback_personal_info(callback_query)
                        elif next_node_id == "personal-error":
                            await handle_callback_personal_error(callback_query)
                        elif next_node_id == "position-info":
                            await handle_callback_position_info(callback_query)
                        elif next_node_id == "position-error":
                            await handle_callback_position_error(callback_query)
                        elif next_node_id == "department-choice":
                            await handle_callback_department_choice(callback_query)
                        elif next_node_id == "department-error":
                            await handle_callback_department_error(callback_query)
                        elif next_node_id == "experience-level":
                            await handle_callback_experience_level(callback_query)
                        elif next_node_id == "experience-error":
                            await handle_callback_experience_error(callback_query)
                        elif next_node_id == "company-info":
                            await handle_callback_company_info(callback_query)
                        elif next_node_id == "company-error":
                            await handle_callback_company_error(callback_query)
                        elif next_node_id == "company-size":
                            await handle_callback_company_size(callback_query)
                        elif next_node_id == "size-error":
                            await handle_callback_size_error(callback_query)
                        elif next_node_id == "project-info":
                            await handle_callback_project_info(callback_query)
                        elif next_node_id == "project-error":
                            await handle_callback_project_error(callback_query)
                        elif next_node_id == "goals-objectives":
                            await handle_callback_goals_objectives(callback_query)
                        elif next_node_id == "goals-error":
                            await handle_callback_goals_error(callback_query)
                        elif next_node_id == "contact-info":
                            await handle_callback_contact_info(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "phone-info":
                            await handle_callback_phone_info(callback_query)
                        elif next_node_id == "phone-error":
                            await handle_callback_phone_error(callback_query)
                        elif next_node_id == "additional-info":
                            await handle_callback_additional_info(callback_query)
                        elif next_node_id == "additional-error":
                            await handle_callback_additional_error(callback_query)
                        elif next_node_id == "final-review":
                            await handle_callback_final_review(callback_query)
                        elif next_node_id == "download-info":
                            await handle_callback_download_info(callback_query)
                        elif next_node_id == "email-confirmation":
                            await handle_callback_email_confirmation(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-welcome":
                await handle_callback_start_welcome(callback_query)
            elif next_node_id == "privacy-policy":
                await handle_callback_privacy_policy(callback_query)
            elif next_node_id == "filling-instructions":
                await handle_callback_filling_instructions(callback_query)
            elif next_node_id == "personal-info":
                await handle_callback_personal_info(callback_query)
            elif next_node_id == "personal-error":
                await handle_callback_personal_error(callback_query)
            elif next_node_id == "position-info":
                await handle_callback_position_info(callback_query)
            elif next_node_id == "position-error":
                await handle_callback_position_error(callback_query)
            elif next_node_id == "department-choice":
                await handle_callback_department_choice(callback_query)
            elif next_node_id == "department-error":
                await handle_callback_department_error(callback_query)
            elif next_node_id == "experience-level":
                await handle_callback_experience_level(callback_query)
            elif next_node_id == "experience-error":
                await handle_callback_experience_error(callback_query)
            elif next_node_id == "company-info":
                await handle_callback_company_info(callback_query)
            elif next_node_id == "company-error":
                await handle_callback_company_error(callback_query)
            elif next_node_id == "company-size":
                await handle_callback_company_size(callback_query)
            elif next_node_id == "size-error":
                await handle_callback_size_error(callback_query)
            elif next_node_id == "project-info":
                await handle_callback_project_info(callback_query)
            elif next_node_id == "project-error":
                await handle_callback_project_error(callback_query)
            elif next_node_id == "goals-objectives":
                await handle_callback_goals_objectives(callback_query)
            elif next_node_id == "goals-error":
                await handle_callback_goals_error(callback_query)
            elif next_node_id == "contact-info":
                await handle_callback_contact_info(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "phone-info":
                await handle_callback_phone_info(callback_query)
            elif next_node_id == "phone-error":
                await handle_callback_phone_error(callback_query)
            elif next_node_id == "additional-info":
                await handle_callback_additional_info(callback_query)
            elif next_node_id == "additional-error":
                await handle_callback_additional_error(callback_query)
            elif next_node_id == "final-review":
                await handle_callback_final_review(callback_query)
            elif next_node_id == "download-info":
                await handle_callback_download_info(callback_query)
            elif next_node_id == "email-confirmation":
                await handle_callback_email_confirmation(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_department-choice_1")
async def handle_response_department_choice_1(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "sales"
    selected_text = "📈 Отдел продаж"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-welcome":
                            await handle_callback_start_welcome(callback_query)
                        elif next_node_id == "privacy-policy":
                            await handle_callback_privacy_policy(callback_query)
                        elif next_node_id == "filling-instructions":
                            await handle_callback_filling_instructions(callback_query)
                        elif next_node_id == "personal-info":
                            await handle_callback_personal_info(callback_query)
                        elif next_node_id == "personal-error":
                            await handle_callback_personal_error(callback_query)
                        elif next_node_id == "position-info":
                            await handle_callback_position_info(callback_query)
                        elif next_node_id == "position-error":
                            await handle_callback_position_error(callback_query)
                        elif next_node_id == "department-choice":
                            await handle_callback_department_choice(callback_query)
                        elif next_node_id == "department-error":
                            await handle_callback_department_error(callback_query)
                        elif next_node_id == "experience-level":
                            await handle_callback_experience_level(callback_query)
                        elif next_node_id == "experience-error":
                            await handle_callback_experience_error(callback_query)
                        elif next_node_id == "company-info":
                            await handle_callback_company_info(callback_query)
                        elif next_node_id == "company-error":
                            await handle_callback_company_error(callback_query)
                        elif next_node_id == "company-size":
                            await handle_callback_company_size(callback_query)
                        elif next_node_id == "size-error":
                            await handle_callback_size_error(callback_query)
                        elif next_node_id == "project-info":
                            await handle_callback_project_info(callback_query)
                        elif next_node_id == "project-error":
                            await handle_callback_project_error(callback_query)
                        elif next_node_id == "goals-objectives":
                            await handle_callback_goals_objectives(callback_query)
                        elif next_node_id == "goals-error":
                            await handle_callback_goals_error(callback_query)
                        elif next_node_id == "contact-info":
                            await handle_callback_contact_info(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "phone-info":
                            await handle_callback_phone_info(callback_query)
                        elif next_node_id == "phone-error":
                            await handle_callback_phone_error(callback_query)
                        elif next_node_id == "additional-info":
                            await handle_callback_additional_info(callback_query)
                        elif next_node_id == "additional-error":
                            await handle_callback_additional_error(callback_query)
                        elif next_node_id == "final-review":
                            await handle_callback_final_review(callback_query)
                        elif next_node_id == "download-info":
                            await handle_callback_download_info(callback_query)
                        elif next_node_id == "email-confirmation":
                            await handle_callback_email_confirmation(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-welcome":
                await handle_callback_start_welcome(callback_query)
            elif next_node_id == "privacy-policy":
                await handle_callback_privacy_policy(callback_query)
            elif next_node_id == "filling-instructions":
                await handle_callback_filling_instructions(callback_query)
            elif next_node_id == "personal-info":
                await handle_callback_personal_info(callback_query)
            elif next_node_id == "personal-error":
                await handle_callback_personal_error(callback_query)
            elif next_node_id == "position-info":
                await handle_callback_position_info(callback_query)
            elif next_node_id == "position-error":
                await handle_callback_position_error(callback_query)
            elif next_node_id == "department-choice":
                await handle_callback_department_choice(callback_query)
            elif next_node_id == "department-error":
                await handle_callback_department_error(callback_query)
            elif next_node_id == "experience-level":
                await handle_callback_experience_level(callback_query)
            elif next_node_id == "experience-error":
                await handle_callback_experience_error(callback_query)
            elif next_node_id == "company-info":
                await handle_callback_company_info(callback_query)
            elif next_node_id == "company-error":
                await handle_callback_company_error(callback_query)
            elif next_node_id == "company-size":
                await handle_callback_company_size(callback_query)
            elif next_node_id == "size-error":
                await handle_callback_size_error(callback_query)
            elif next_node_id == "project-info":
                await handle_callback_project_info(callback_query)
            elif next_node_id == "project-error":
                await handle_callback_project_error(callback_query)
            elif next_node_id == "goals-objectives":
                await handle_callback_goals_objectives(callback_query)
            elif next_node_id == "goals-error":
                await handle_callback_goals_error(callback_query)
            elif next_node_id == "contact-info":
                await handle_callback_contact_info(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "phone-info":
                await handle_callback_phone_info(callback_query)
            elif next_node_id == "phone-error":
                await handle_callback_phone_error(callback_query)
            elif next_node_id == "additional-info":
                await handle_callback_additional_info(callback_query)
            elif next_node_id == "additional-error":
                await handle_callback_additional_error(callback_query)
            elif next_node_id == "final-review":
                await handle_callback_final_review(callback_query)
            elif next_node_id == "download-info":
                await handle_callback_download_info(callback_query)
            elif next_node_id == "email-confirmation":
                await handle_callback_email_confirmation(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_department-choice_2")
async def handle_response_department_choice_2(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "marketing"
    selected_text = "📢 Маркетинг"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-welcome":
                            await handle_callback_start_welcome(callback_query)
                        elif next_node_id == "privacy-policy":
                            await handle_callback_privacy_policy(callback_query)
                        elif next_node_id == "filling-instructions":
                            await handle_callback_filling_instructions(callback_query)
                        elif next_node_id == "personal-info":
                            await handle_callback_personal_info(callback_query)
                        elif next_node_id == "personal-error":
                            await handle_callback_personal_error(callback_query)
                        elif next_node_id == "position-info":
                            await handle_callback_position_info(callback_query)
                        elif next_node_id == "position-error":
                            await handle_callback_position_error(callback_query)
                        elif next_node_id == "department-choice":
                            await handle_callback_department_choice(callback_query)
                        elif next_node_id == "department-error":
                            await handle_callback_department_error(callback_query)
                        elif next_node_id == "experience-level":
                            await handle_callback_experience_level(callback_query)
                        elif next_node_id == "experience-error":
                            await handle_callback_experience_error(callback_query)
                        elif next_node_id == "company-info":
                            await handle_callback_company_info(callback_query)
                        elif next_node_id == "company-error":
                            await handle_callback_company_error(callback_query)
                        elif next_node_id == "company-size":
                            await handle_callback_company_size(callback_query)
                        elif next_node_id == "size-error":
                            await handle_callback_size_error(callback_query)
                        elif next_node_id == "project-info":
                            await handle_callback_project_info(callback_query)
                        elif next_node_id == "project-error":
                            await handle_callback_project_error(callback_query)
                        elif next_node_id == "goals-objectives":
                            await handle_callback_goals_objectives(callback_query)
                        elif next_node_id == "goals-error":
                            await handle_callback_goals_error(callback_query)
                        elif next_node_id == "contact-info":
                            await handle_callback_contact_info(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "phone-info":
                            await handle_callback_phone_info(callback_query)
                        elif next_node_id == "phone-error":
                            await handle_callback_phone_error(callback_query)
                        elif next_node_id == "additional-info":
                            await handle_callback_additional_info(callback_query)
                        elif next_node_id == "additional-error":
                            await handle_callback_additional_error(callback_query)
                        elif next_node_id == "final-review":
                            await handle_callback_final_review(callback_query)
                        elif next_node_id == "download-info":
                            await handle_callback_download_info(callback_query)
                        elif next_node_id == "email-confirmation":
                            await handle_callback_email_confirmation(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-welcome":
                await handle_callback_start_welcome(callback_query)
            elif next_node_id == "privacy-policy":
                await handle_callback_privacy_policy(callback_query)
            elif next_node_id == "filling-instructions":
                await handle_callback_filling_instructions(callback_query)
            elif next_node_id == "personal-info":
                await handle_callback_personal_info(callback_query)
            elif next_node_id == "personal-error":
                await handle_callback_personal_error(callback_query)
            elif next_node_id == "position-info":
                await handle_callback_position_info(callback_query)
            elif next_node_id == "position-error":
                await handle_callback_position_error(callback_query)
            elif next_node_id == "department-choice":
                await handle_callback_department_choice(callback_query)
            elif next_node_id == "department-error":
                await handle_callback_department_error(callback_query)
            elif next_node_id == "experience-level":
                await handle_callback_experience_level(callback_query)
            elif next_node_id == "experience-error":
                await handle_callback_experience_error(callback_query)
            elif next_node_id == "company-info":
                await handle_callback_company_info(callback_query)
            elif next_node_id == "company-error":
                await handle_callback_company_error(callback_query)
            elif next_node_id == "company-size":
                await handle_callback_company_size(callback_query)
            elif next_node_id == "size-error":
                await handle_callback_size_error(callback_query)
            elif next_node_id == "project-info":
                await handle_callback_project_info(callback_query)
            elif next_node_id == "project-error":
                await handle_callback_project_error(callback_query)
            elif next_node_id == "goals-objectives":
                await handle_callback_goals_objectives(callback_query)
            elif next_node_id == "goals-error":
                await handle_callback_goals_error(callback_query)
            elif next_node_id == "contact-info":
                await handle_callback_contact_info(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "phone-info":
                await handle_callback_phone_info(callback_query)
            elif next_node_id == "phone-error":
                await handle_callback_phone_error(callback_query)
            elif next_node_id == "additional-info":
                await handle_callback_additional_info(callback_query)
            elif next_node_id == "additional-error":
                await handle_callback_additional_error(callback_query)
            elif next_node_id == "final-review":
                await handle_callback_final_review(callback_query)
            elif next_node_id == "download-info":
                await handle_callback_download_info(callback_query)
            elif next_node_id == "email-confirmation":
                await handle_callback_email_confirmation(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_department-choice_3")
async def handle_response_department_choice_3(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "hr"
    selected_text = "👥 HR-отдел"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-welcome":
                            await handle_callback_start_welcome(callback_query)
                        elif next_node_id == "privacy-policy":
                            await handle_callback_privacy_policy(callback_query)
                        elif next_node_id == "filling-instructions":
                            await handle_callback_filling_instructions(callback_query)
                        elif next_node_id == "personal-info":
                            await handle_callback_personal_info(callback_query)
                        elif next_node_id == "personal-error":
                            await handle_callback_personal_error(callback_query)
                        elif next_node_id == "position-info":
                            await handle_callback_position_info(callback_query)
                        elif next_node_id == "position-error":
                            await handle_callback_position_error(callback_query)
                        elif next_node_id == "department-choice":
                            await handle_callback_department_choice(callback_query)
                        elif next_node_id == "department-error":
                            await handle_callback_department_error(callback_query)
                        elif next_node_id == "experience-level":
                            await handle_callback_experience_level(callback_query)
                        elif next_node_id == "experience-error":
                            await handle_callback_experience_error(callback_query)
                        elif next_node_id == "company-info":
                            await handle_callback_company_info(callback_query)
                        elif next_node_id == "company-error":
                            await handle_callback_company_error(callback_query)
                        elif next_node_id == "company-size":
                            await handle_callback_company_size(callback_query)
                        elif next_node_id == "size-error":
                            await handle_callback_size_error(callback_query)
                        elif next_node_id == "project-info":
                            await handle_callback_project_info(callback_query)
                        elif next_node_id == "project-error":
                            await handle_callback_project_error(callback_query)
                        elif next_node_id == "goals-objectives":
                            await handle_callback_goals_objectives(callback_query)
                        elif next_node_id == "goals-error":
                            await handle_callback_goals_error(callback_query)
                        elif next_node_id == "contact-info":
                            await handle_callback_contact_info(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "phone-info":
                            await handle_callback_phone_info(callback_query)
                        elif next_node_id == "phone-error":
                            await handle_callback_phone_error(callback_query)
                        elif next_node_id == "additional-info":
                            await handle_callback_additional_info(callback_query)
                        elif next_node_id == "additional-error":
                            await handle_callback_additional_error(callback_query)
                        elif next_node_id == "final-review":
                            await handle_callback_final_review(callback_query)
                        elif next_node_id == "download-info":
                            await handle_callback_download_info(callback_query)
                        elif next_node_id == "email-confirmation":
                            await handle_callback_email_confirmation(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-welcome":
                await handle_callback_start_welcome(callback_query)
            elif next_node_id == "privacy-policy":
                await handle_callback_privacy_policy(callback_query)
            elif next_node_id == "filling-instructions":
                await handle_callback_filling_instructions(callback_query)
            elif next_node_id == "personal-info":
                await handle_callback_personal_info(callback_query)
            elif next_node_id == "personal-error":
                await handle_callback_personal_error(callback_query)
            elif next_node_id == "position-info":
                await handle_callback_position_info(callback_query)
            elif next_node_id == "position-error":
                await handle_callback_position_error(callback_query)
            elif next_node_id == "department-choice":
                await handle_callback_department_choice(callback_query)
            elif next_node_id == "department-error":
                await handle_callback_department_error(callback_query)
            elif next_node_id == "experience-level":
                await handle_callback_experience_level(callback_query)
            elif next_node_id == "experience-error":
                await handle_callback_experience_error(callback_query)
            elif next_node_id == "company-info":
                await handle_callback_company_info(callback_query)
            elif next_node_id == "company-error":
                await handle_callback_company_error(callback_query)
            elif next_node_id == "company-size":
                await handle_callback_company_size(callback_query)
            elif next_node_id == "size-error":
                await handle_callback_size_error(callback_query)
            elif next_node_id == "project-info":
                await handle_callback_project_info(callback_query)
            elif next_node_id == "project-error":
                await handle_callback_project_error(callback_query)
            elif next_node_id == "goals-objectives":
                await handle_callback_goals_objectives(callback_query)
            elif next_node_id == "goals-error":
                await handle_callback_goals_error(callback_query)
            elif next_node_id == "contact-info":
                await handle_callback_contact_info(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "phone-info":
                await handle_callback_phone_info(callback_query)
            elif next_node_id == "phone-error":
                await handle_callback_phone_error(callback_query)
            elif next_node_id == "additional-info":
                await handle_callback_additional_info(callback_query)
            elif next_node_id == "additional-error":
                await handle_callback_additional_error(callback_query)
            elif next_node_id == "final-review":
                await handle_callback_final_review(callback_query)
            elif next_node_id == "download-info":
                await handle_callback_download_info(callback_query)
            elif next_node_id == "email-confirmation":
                await handle_callback_email_confirmation(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_department-choice_4")
async def handle_response_department_choice_4(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "finance"
    selected_text = "💰 Финансы"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-welcome":
                            await handle_callback_start_welcome(callback_query)
                        elif next_node_id == "privacy-policy":
                            await handle_callback_privacy_policy(callback_query)
                        elif next_node_id == "filling-instructions":
                            await handle_callback_filling_instructions(callback_query)
                        elif next_node_id == "personal-info":
                            await handle_callback_personal_info(callback_query)
                        elif next_node_id == "personal-error":
                            await handle_callback_personal_error(callback_query)
                        elif next_node_id == "position-info":
                            await handle_callback_position_info(callback_query)
                        elif next_node_id == "position-error":
                            await handle_callback_position_error(callback_query)
                        elif next_node_id == "department-choice":
                            await handle_callback_department_choice(callback_query)
                        elif next_node_id == "department-error":
                            await handle_callback_department_error(callback_query)
                        elif next_node_id == "experience-level":
                            await handle_callback_experience_level(callback_query)
                        elif next_node_id == "experience-error":
                            await handle_callback_experience_error(callback_query)
                        elif next_node_id == "company-info":
                            await handle_callback_company_info(callback_query)
                        elif next_node_id == "company-error":
                            await handle_callback_company_error(callback_query)
                        elif next_node_id == "company-size":
                            await handle_callback_company_size(callback_query)
                        elif next_node_id == "size-error":
                            await handle_callback_size_error(callback_query)
                        elif next_node_id == "project-info":
                            await handle_callback_project_info(callback_query)
                        elif next_node_id == "project-error":
                            await handle_callback_project_error(callback_query)
                        elif next_node_id == "goals-objectives":
                            await handle_callback_goals_objectives(callback_query)
                        elif next_node_id == "goals-error":
                            await handle_callback_goals_error(callback_query)
                        elif next_node_id == "contact-info":
                            await handle_callback_contact_info(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "phone-info":
                            await handle_callback_phone_info(callback_query)
                        elif next_node_id == "phone-error":
                            await handle_callback_phone_error(callback_query)
                        elif next_node_id == "additional-info":
                            await handle_callback_additional_info(callback_query)
                        elif next_node_id == "additional-error":
                            await handle_callback_additional_error(callback_query)
                        elif next_node_id == "final-review":
                            await handle_callback_final_review(callback_query)
                        elif next_node_id == "download-info":
                            await handle_callback_download_info(callback_query)
                        elif next_node_id == "email-confirmation":
                            await handle_callback_email_confirmation(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-welcome":
                await handle_callback_start_welcome(callback_query)
            elif next_node_id == "privacy-policy":
                await handle_callback_privacy_policy(callback_query)
            elif next_node_id == "filling-instructions":
                await handle_callback_filling_instructions(callback_query)
            elif next_node_id == "personal-info":
                await handle_callback_personal_info(callback_query)
            elif next_node_id == "personal-error":
                await handle_callback_personal_error(callback_query)
            elif next_node_id == "position-info":
                await handle_callback_position_info(callback_query)
            elif next_node_id == "position-error":
                await handle_callback_position_error(callback_query)
            elif next_node_id == "department-choice":
                await handle_callback_department_choice(callback_query)
            elif next_node_id == "department-error":
                await handle_callback_department_error(callback_query)
            elif next_node_id == "experience-level":
                await handle_callback_experience_level(callback_query)
            elif next_node_id == "experience-error":
                await handle_callback_experience_error(callback_query)
            elif next_node_id == "company-info":
                await handle_callback_company_info(callback_query)
            elif next_node_id == "company-error":
                await handle_callback_company_error(callback_query)
            elif next_node_id == "company-size":
                await handle_callback_company_size(callback_query)
            elif next_node_id == "size-error":
                await handle_callback_size_error(callback_query)
            elif next_node_id == "project-info":
                await handle_callback_project_info(callback_query)
            elif next_node_id == "project-error":
                await handle_callback_project_error(callback_query)
            elif next_node_id == "goals-objectives":
                await handle_callback_goals_objectives(callback_query)
            elif next_node_id == "goals-error":
                await handle_callback_goals_error(callback_query)
            elif next_node_id == "contact-info":
                await handle_callback_contact_info(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "phone-info":
                await handle_callback_phone_info(callback_query)
            elif next_node_id == "phone-error":
                await handle_callback_phone_error(callback_query)
            elif next_node_id == "additional-info":
                await handle_callback_additional_info(callback_query)
            elif next_node_id == "additional-error":
                await handle_callback_additional_error(callback_query)
            elif next_node_id == "final-review":
                await handle_callback_final_review(callback_query)
            elif next_node_id == "download-info":
                await handle_callback_download_info(callback_query)
            elif next_node_id == "email-confirmation":
                await handle_callback_email_confirmation(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_department-choice_5")
async def handle_response_department_choice_5(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "operations"
    selected_text = "⚙️ Операции"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-welcome":
                            await handle_callback_start_welcome(callback_query)
                        elif next_node_id == "privacy-policy":
                            await handle_callback_privacy_policy(callback_query)
                        elif next_node_id == "filling-instructions":
                            await handle_callback_filling_instructions(callback_query)
                        elif next_node_id == "personal-info":
                            await handle_callback_personal_info(callback_query)
                        elif next_node_id == "personal-error":
                            await handle_callback_personal_error(callback_query)
                        elif next_node_id == "position-info":
                            await handle_callback_position_info(callback_query)
                        elif next_node_id == "position-error":
                            await handle_callback_position_error(callback_query)
                        elif next_node_id == "department-choice":
                            await handle_callback_department_choice(callback_query)
                        elif next_node_id == "department-error":
                            await handle_callback_department_error(callback_query)
                        elif next_node_id == "experience-level":
                            await handle_callback_experience_level(callback_query)
                        elif next_node_id == "experience-error":
                            await handle_callback_experience_error(callback_query)
                        elif next_node_id == "company-info":
                            await handle_callback_company_info(callback_query)
                        elif next_node_id == "company-error":
                            await handle_callback_company_error(callback_query)
                        elif next_node_id == "company-size":
                            await handle_callback_company_size(callback_query)
                        elif next_node_id == "size-error":
                            await handle_callback_size_error(callback_query)
                        elif next_node_id == "project-info":
                            await handle_callback_project_info(callback_query)
                        elif next_node_id == "project-error":
                            await handle_callback_project_error(callback_query)
                        elif next_node_id == "goals-objectives":
                            await handle_callback_goals_objectives(callback_query)
                        elif next_node_id == "goals-error":
                            await handle_callback_goals_error(callback_query)
                        elif next_node_id == "contact-info":
                            await handle_callback_contact_info(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "phone-info":
                            await handle_callback_phone_info(callback_query)
                        elif next_node_id == "phone-error":
                            await handle_callback_phone_error(callback_query)
                        elif next_node_id == "additional-info":
                            await handle_callback_additional_info(callback_query)
                        elif next_node_id == "additional-error":
                            await handle_callback_additional_error(callback_query)
                        elif next_node_id == "final-review":
                            await handle_callback_final_review(callback_query)
                        elif next_node_id == "download-info":
                            await handle_callback_download_info(callback_query)
                        elif next_node_id == "email-confirmation":
                            await handle_callback_email_confirmation(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-welcome":
                await handle_callback_start_welcome(callback_query)
            elif next_node_id == "privacy-policy":
                await handle_callback_privacy_policy(callback_query)
            elif next_node_id == "filling-instructions":
                await handle_callback_filling_instructions(callback_query)
            elif next_node_id == "personal-info":
                await handle_callback_personal_info(callback_query)
            elif next_node_id == "personal-error":
                await handle_callback_personal_error(callback_query)
            elif next_node_id == "position-info":
                await handle_callback_position_info(callback_query)
            elif next_node_id == "position-error":
                await handle_callback_position_error(callback_query)
            elif next_node_id == "department-choice":
                await handle_callback_department_choice(callback_query)
            elif next_node_id == "department-error":
                await handle_callback_department_error(callback_query)
            elif next_node_id == "experience-level":
                await handle_callback_experience_level(callback_query)
            elif next_node_id == "experience-error":
                await handle_callback_experience_error(callback_query)
            elif next_node_id == "company-info":
                await handle_callback_company_info(callback_query)
            elif next_node_id == "company-error":
                await handle_callback_company_error(callback_query)
            elif next_node_id == "company-size":
                await handle_callback_company_size(callback_query)
            elif next_node_id == "size-error":
                await handle_callback_size_error(callback_query)
            elif next_node_id == "project-info":
                await handle_callback_project_info(callback_query)
            elif next_node_id == "project-error":
                await handle_callback_project_error(callback_query)
            elif next_node_id == "goals-objectives":
                await handle_callback_goals_objectives(callback_query)
            elif next_node_id == "goals-error":
                await handle_callback_goals_error(callback_query)
            elif next_node_id == "contact-info":
                await handle_callback_contact_info(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "phone-info":
                await handle_callback_phone_info(callback_query)
            elif next_node_id == "phone-error":
                await handle_callback_phone_error(callback_query)
            elif next_node_id == "additional-info":
                await handle_callback_additional_info(callback_query)
            elif next_node_id == "additional-error":
                await handle_callback_additional_error(callback_query)
            elif next_node_id == "final-review":
                await handle_callback_final_review(callback_query)
            elif next_node_id == "download-info":
                await handle_callback_download_info(callback_query)
            elif next_node_id == "email-confirmation":
                await handle_callback_email_confirmation(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_department-choice_6")
async def handle_response_department_choice_6(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "management"
    selected_text = "👔 Руководство"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-welcome":
                            await handle_callback_start_welcome(callback_query)
                        elif next_node_id == "privacy-policy":
                            await handle_callback_privacy_policy(callback_query)
                        elif next_node_id == "filling-instructions":
                            await handle_callback_filling_instructions(callback_query)
                        elif next_node_id == "personal-info":
                            await handle_callback_personal_info(callback_query)
                        elif next_node_id == "personal-error":
                            await handle_callback_personal_error(callback_query)
                        elif next_node_id == "position-info":
                            await handle_callback_position_info(callback_query)
                        elif next_node_id == "position-error":
                            await handle_callback_position_error(callback_query)
                        elif next_node_id == "department-choice":
                            await handle_callback_department_choice(callback_query)
                        elif next_node_id == "department-error":
                            await handle_callback_department_error(callback_query)
                        elif next_node_id == "experience-level":
                            await handle_callback_experience_level(callback_query)
                        elif next_node_id == "experience-error":
                            await handle_callback_experience_error(callback_query)
                        elif next_node_id == "company-info":
                            await handle_callback_company_info(callback_query)
                        elif next_node_id == "company-error":
                            await handle_callback_company_error(callback_query)
                        elif next_node_id == "company-size":
                            await handle_callback_company_size(callback_query)
                        elif next_node_id == "size-error":
                            await handle_callback_size_error(callback_query)
                        elif next_node_id == "project-info":
                            await handle_callback_project_info(callback_query)
                        elif next_node_id == "project-error":
                            await handle_callback_project_error(callback_query)
                        elif next_node_id == "goals-objectives":
                            await handle_callback_goals_objectives(callback_query)
                        elif next_node_id == "goals-error":
                            await handle_callback_goals_error(callback_query)
                        elif next_node_id == "contact-info":
                            await handle_callback_contact_info(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "phone-info":
                            await handle_callback_phone_info(callback_query)
                        elif next_node_id == "phone-error":
                            await handle_callback_phone_error(callback_query)
                        elif next_node_id == "additional-info":
                            await handle_callback_additional_info(callback_query)
                        elif next_node_id == "additional-error":
                            await handle_callback_additional_error(callback_query)
                        elif next_node_id == "final-review":
                            await handle_callback_final_review(callback_query)
                        elif next_node_id == "download-info":
                            await handle_callback_download_info(callback_query)
                        elif next_node_id == "email-confirmation":
                            await handle_callback_email_confirmation(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-welcome":
                await handle_callback_start_welcome(callback_query)
            elif next_node_id == "privacy-policy":
                await handle_callback_privacy_policy(callback_query)
            elif next_node_id == "filling-instructions":
                await handle_callback_filling_instructions(callback_query)
            elif next_node_id == "personal-info":
                await handle_callback_personal_info(callback_query)
            elif next_node_id == "personal-error":
                await handle_callback_personal_error(callback_query)
            elif next_node_id == "position-info":
                await handle_callback_position_info(callback_query)
            elif next_node_id == "position-error":
                await handle_callback_position_error(callback_query)
            elif next_node_id == "department-choice":
                await handle_callback_department_choice(callback_query)
            elif next_node_id == "department-error":
                await handle_callback_department_error(callback_query)
            elif next_node_id == "experience-level":
                await handle_callback_experience_level(callback_query)
            elif next_node_id == "experience-error":
                await handle_callback_experience_error(callback_query)
            elif next_node_id == "company-info":
                await handle_callback_company_info(callback_query)
            elif next_node_id == "company-error":
                await handle_callback_company_error(callback_query)
            elif next_node_id == "company-size":
                await handle_callback_company_size(callback_query)
            elif next_node_id == "size-error":
                await handle_callback_size_error(callback_query)
            elif next_node_id == "project-info":
                await handle_callback_project_info(callback_query)
            elif next_node_id == "project-error":
                await handle_callback_project_error(callback_query)
            elif next_node_id == "goals-objectives":
                await handle_callback_goals_objectives(callback_query)
            elif next_node_id == "goals-error":
                await handle_callback_goals_error(callback_query)
            elif next_node_id == "contact-info":
                await handle_callback_contact_info(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "phone-info":
                await handle_callback_phone_info(callback_query)
            elif next_node_id == "phone-error":
                await handle_callback_phone_error(callback_query)
            elif next_node_id == "additional-info":
                await handle_callback_additional_info(callback_query)
            elif next_node_id == "additional-error":
                await handle_callback_additional_error(callback_query)
            elif next_node_id == "final-review":
                await handle_callback_final_review(callback_query)
            elif next_node_id == "download-info":
                await handle_callback_download_info(callback_query)
            elif next_node_id == "email-confirmation":
                await handle_callback_email_confirmation(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_department-choice_7")
async def handle_response_department_choice_7(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "other"
    selected_text = "📋 Другое"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-welcome":
                            await handle_callback_start_welcome(callback_query)
                        elif next_node_id == "privacy-policy":
                            await handle_callback_privacy_policy(callback_query)
                        elif next_node_id == "filling-instructions":
                            await handle_callback_filling_instructions(callback_query)
                        elif next_node_id == "personal-info":
                            await handle_callback_personal_info(callback_query)
                        elif next_node_id == "personal-error":
                            await handle_callback_personal_error(callback_query)
                        elif next_node_id == "position-info":
                            await handle_callback_position_info(callback_query)
                        elif next_node_id == "position-error":
                            await handle_callback_position_error(callback_query)
                        elif next_node_id == "department-choice":
                            await handle_callback_department_choice(callback_query)
                        elif next_node_id == "department-error":
                            await handle_callback_department_error(callback_query)
                        elif next_node_id == "experience-level":
                            await handle_callback_experience_level(callback_query)
                        elif next_node_id == "experience-error":
                            await handle_callback_experience_error(callback_query)
                        elif next_node_id == "company-info":
                            await handle_callback_company_info(callback_query)
                        elif next_node_id == "company-error":
                            await handle_callback_company_error(callback_query)
                        elif next_node_id == "company-size":
                            await handle_callback_company_size(callback_query)
                        elif next_node_id == "size-error":
                            await handle_callback_size_error(callback_query)
                        elif next_node_id == "project-info":
                            await handle_callback_project_info(callback_query)
                        elif next_node_id == "project-error":
                            await handle_callback_project_error(callback_query)
                        elif next_node_id == "goals-objectives":
                            await handle_callback_goals_objectives(callback_query)
                        elif next_node_id == "goals-error":
                            await handle_callback_goals_error(callback_query)
                        elif next_node_id == "contact-info":
                            await handle_callback_contact_info(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "phone-info":
                            await handle_callback_phone_info(callback_query)
                        elif next_node_id == "phone-error":
                            await handle_callback_phone_error(callback_query)
                        elif next_node_id == "additional-info":
                            await handle_callback_additional_info(callback_query)
                        elif next_node_id == "additional-error":
                            await handle_callback_additional_error(callback_query)
                        elif next_node_id == "final-review":
                            await handle_callback_final_review(callback_query)
                        elif next_node_id == "download-info":
                            await handle_callback_download_info(callback_query)
                        elif next_node_id == "email-confirmation":
                            await handle_callback_email_confirmation(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-welcome":
                await handle_callback_start_welcome(callback_query)
            elif next_node_id == "privacy-policy":
                await handle_callback_privacy_policy(callback_query)
            elif next_node_id == "filling-instructions":
                await handle_callback_filling_instructions(callback_query)
            elif next_node_id == "personal-info":
                await handle_callback_personal_info(callback_query)
            elif next_node_id == "personal-error":
                await handle_callback_personal_error(callback_query)
            elif next_node_id == "position-info":
                await handle_callback_position_info(callback_query)
            elif next_node_id == "position-error":
                await handle_callback_position_error(callback_query)
            elif next_node_id == "department-choice":
                await handle_callback_department_choice(callback_query)
            elif next_node_id == "department-error":
                await handle_callback_department_error(callback_query)
            elif next_node_id == "experience-level":
                await handle_callback_experience_level(callback_query)
            elif next_node_id == "experience-error":
                await handle_callback_experience_error(callback_query)
            elif next_node_id == "company-info":
                await handle_callback_company_info(callback_query)
            elif next_node_id == "company-error":
                await handle_callback_company_error(callback_query)
            elif next_node_id == "company-size":
                await handle_callback_company_size(callback_query)
            elif next_node_id == "size-error":
                await handle_callback_size_error(callback_query)
            elif next_node_id == "project-info":
                await handle_callback_project_info(callback_query)
            elif next_node_id == "project-error":
                await handle_callback_project_error(callback_query)
            elif next_node_id == "goals-objectives":
                await handle_callback_goals_objectives(callback_query)
            elif next_node_id == "goals-error":
                await handle_callback_goals_error(callback_query)
            elif next_node_id == "contact-info":
                await handle_callback_contact_info(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "phone-info":
                await handle_callback_phone_info(callback_query)
            elif next_node_id == "phone-error":
                await handle_callback_phone_error(callback_query)
            elif next_node_id == "additional-info":
                await handle_callback_additional_info(callback_query)
            elif next_node_id == "additional-error":
                await handle_callback_additional_error(callback_query)
            elif next_node_id == "final-review":
                await handle_callback_final_review(callback_query)
            elif next_node_id == "download-info":
                await handle_callback_download_info(callback_query)
            elif next_node_id == "email-confirmation":
                await handle_callback_email_confirmation(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_experience-level_0")
async def handle_response_experience_level_0(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "junior"
    selected_text = "🌱 Начинающий (0-2 года)"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-welcome":
                            await handle_callback_start_welcome(callback_query)
                        elif next_node_id == "privacy-policy":
                            await handle_callback_privacy_policy(callback_query)
                        elif next_node_id == "filling-instructions":
                            await handle_callback_filling_instructions(callback_query)
                        elif next_node_id == "personal-info":
                            await handle_callback_personal_info(callback_query)
                        elif next_node_id == "personal-error":
                            await handle_callback_personal_error(callback_query)
                        elif next_node_id == "position-info":
                            await handle_callback_position_info(callback_query)
                        elif next_node_id == "position-error":
                            await handle_callback_position_error(callback_query)
                        elif next_node_id == "department-choice":
                            await handle_callback_department_choice(callback_query)
                        elif next_node_id == "department-error":
                            await handle_callback_department_error(callback_query)
                        elif next_node_id == "experience-level":
                            await handle_callback_experience_level(callback_query)
                        elif next_node_id == "experience-error":
                            await handle_callback_experience_error(callback_query)
                        elif next_node_id == "company-info":
                            await handle_callback_company_info(callback_query)
                        elif next_node_id == "company-error":
                            await handle_callback_company_error(callback_query)
                        elif next_node_id == "company-size":
                            await handle_callback_company_size(callback_query)
                        elif next_node_id == "size-error":
                            await handle_callback_size_error(callback_query)
                        elif next_node_id == "project-info":
                            await handle_callback_project_info(callback_query)
                        elif next_node_id == "project-error":
                            await handle_callback_project_error(callback_query)
                        elif next_node_id == "goals-objectives":
                            await handle_callback_goals_objectives(callback_query)
                        elif next_node_id == "goals-error":
                            await handle_callback_goals_error(callback_query)
                        elif next_node_id == "contact-info":
                            await handle_callback_contact_info(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "phone-info":
                            await handle_callback_phone_info(callback_query)
                        elif next_node_id == "phone-error":
                            await handle_callback_phone_error(callback_query)
                        elif next_node_id == "additional-info":
                            await handle_callback_additional_info(callback_query)
                        elif next_node_id == "additional-error":
                            await handle_callback_additional_error(callback_query)
                        elif next_node_id == "final-review":
                            await handle_callback_final_review(callback_query)
                        elif next_node_id == "download-info":
                            await handle_callback_download_info(callback_query)
                        elif next_node_id == "email-confirmation":
                            await handle_callback_email_confirmation(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-welcome":
                await handle_callback_start_welcome(callback_query)
            elif next_node_id == "privacy-policy":
                await handle_callback_privacy_policy(callback_query)
            elif next_node_id == "filling-instructions":
                await handle_callback_filling_instructions(callback_query)
            elif next_node_id == "personal-info":
                await handle_callback_personal_info(callback_query)
            elif next_node_id == "personal-error":
                await handle_callback_personal_error(callback_query)
            elif next_node_id == "position-info":
                await handle_callback_position_info(callback_query)
            elif next_node_id == "position-error":
                await handle_callback_position_error(callback_query)
            elif next_node_id == "department-choice":
                await handle_callback_department_choice(callback_query)
            elif next_node_id == "department-error":
                await handle_callback_department_error(callback_query)
            elif next_node_id == "experience-level":
                await handle_callback_experience_level(callback_query)
            elif next_node_id == "experience-error":
                await handle_callback_experience_error(callback_query)
            elif next_node_id == "company-info":
                await handle_callback_company_info(callback_query)
            elif next_node_id == "company-error":
                await handle_callback_company_error(callback_query)
            elif next_node_id == "company-size":
                await handle_callback_company_size(callback_query)
            elif next_node_id == "size-error":
                await handle_callback_size_error(callback_query)
            elif next_node_id == "project-info":
                await handle_callback_project_info(callback_query)
            elif next_node_id == "project-error":
                await handle_callback_project_error(callback_query)
            elif next_node_id == "goals-objectives":
                await handle_callback_goals_objectives(callback_query)
            elif next_node_id == "goals-error":
                await handle_callback_goals_error(callback_query)
            elif next_node_id == "contact-info":
                await handle_callback_contact_info(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "phone-info":
                await handle_callback_phone_info(callback_query)
            elif next_node_id == "phone-error":
                await handle_callback_phone_error(callback_query)
            elif next_node_id == "additional-info":
                await handle_callback_additional_info(callback_query)
            elif next_node_id == "additional-error":
                await handle_callback_additional_error(callback_query)
            elif next_node_id == "final-review":
                await handle_callback_final_review(callback_query)
            elif next_node_id == "download-info":
                await handle_callback_download_info(callback_query)
            elif next_node_id == "email-confirmation":
                await handle_callback_email_confirmation(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_experience-level_1")
async def handle_response_experience_level_1(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "middle"
    selected_text = "💼 Средний (2-5 лет)"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-welcome":
                            await handle_callback_start_welcome(callback_query)
                        elif next_node_id == "privacy-policy":
                            await handle_callback_privacy_policy(callback_query)
                        elif next_node_id == "filling-instructions":
                            await handle_callback_filling_instructions(callback_query)
                        elif next_node_id == "personal-info":
                            await handle_callback_personal_info(callback_query)
                        elif next_node_id == "personal-error":
                            await handle_callback_personal_error(callback_query)
                        elif next_node_id == "position-info":
                            await handle_callback_position_info(callback_query)
                        elif next_node_id == "position-error":
                            await handle_callback_position_error(callback_query)
                        elif next_node_id == "department-choice":
                            await handle_callback_department_choice(callback_query)
                        elif next_node_id == "department-error":
                            await handle_callback_department_error(callback_query)
                        elif next_node_id == "experience-level":
                            await handle_callback_experience_level(callback_query)
                        elif next_node_id == "experience-error":
                            await handle_callback_experience_error(callback_query)
                        elif next_node_id == "company-info":
                            await handle_callback_company_info(callback_query)
                        elif next_node_id == "company-error":
                            await handle_callback_company_error(callback_query)
                        elif next_node_id == "company-size":
                            await handle_callback_company_size(callback_query)
                        elif next_node_id == "size-error":
                            await handle_callback_size_error(callback_query)
                        elif next_node_id == "project-info":
                            await handle_callback_project_info(callback_query)
                        elif next_node_id == "project-error":
                            await handle_callback_project_error(callback_query)
                        elif next_node_id == "goals-objectives":
                            await handle_callback_goals_objectives(callback_query)
                        elif next_node_id == "goals-error":
                            await handle_callback_goals_error(callback_query)
                        elif next_node_id == "contact-info":
                            await handle_callback_contact_info(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "phone-info":
                            await handle_callback_phone_info(callback_query)
                        elif next_node_id == "phone-error":
                            await handle_callback_phone_error(callback_query)
                        elif next_node_id == "additional-info":
                            await handle_callback_additional_info(callback_query)
                        elif next_node_id == "additional-error":
                            await handle_callback_additional_error(callback_query)
                        elif next_node_id == "final-review":
                            await handle_callback_final_review(callback_query)
                        elif next_node_id == "download-info":
                            await handle_callback_download_info(callback_query)
                        elif next_node_id == "email-confirmation":
                            await handle_callback_email_confirmation(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-welcome":
                await handle_callback_start_welcome(callback_query)
            elif next_node_id == "privacy-policy":
                await handle_callback_privacy_policy(callback_query)
            elif next_node_id == "filling-instructions":
                await handle_callback_filling_instructions(callback_query)
            elif next_node_id == "personal-info":
                await handle_callback_personal_info(callback_query)
            elif next_node_id == "personal-error":
                await handle_callback_personal_error(callback_query)
            elif next_node_id == "position-info":
                await handle_callback_position_info(callback_query)
            elif next_node_id == "position-error":
                await handle_callback_position_error(callback_query)
            elif next_node_id == "department-choice":
                await handle_callback_department_choice(callback_query)
            elif next_node_id == "department-error":
                await handle_callback_department_error(callback_query)
            elif next_node_id == "experience-level":
                await handle_callback_experience_level(callback_query)
            elif next_node_id == "experience-error":
                await handle_callback_experience_error(callback_query)
            elif next_node_id == "company-info":
                await handle_callback_company_info(callback_query)
            elif next_node_id == "company-error":
                await handle_callback_company_error(callback_query)
            elif next_node_id == "company-size":
                await handle_callback_company_size(callback_query)
            elif next_node_id == "size-error":
                await handle_callback_size_error(callback_query)
            elif next_node_id == "project-info":
                await handle_callback_project_info(callback_query)
            elif next_node_id == "project-error":
                await handle_callback_project_error(callback_query)
            elif next_node_id == "goals-objectives":
                await handle_callback_goals_objectives(callback_query)
            elif next_node_id == "goals-error":
                await handle_callback_goals_error(callback_query)
            elif next_node_id == "contact-info":
                await handle_callback_contact_info(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "phone-info":
                await handle_callback_phone_info(callback_query)
            elif next_node_id == "phone-error":
                await handle_callback_phone_error(callback_query)
            elif next_node_id == "additional-info":
                await handle_callback_additional_info(callback_query)
            elif next_node_id == "additional-error":
                await handle_callback_additional_error(callback_query)
            elif next_node_id == "final-review":
                await handle_callback_final_review(callback_query)
            elif next_node_id == "download-info":
                await handle_callback_download_info(callback_query)
            elif next_node_id == "email-confirmation":
                await handle_callback_email_confirmation(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_experience-level_2")
async def handle_response_experience_level_2(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "senior"
    selected_text = "🎯 Старший (5-10 лет)"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-welcome":
                            await handle_callback_start_welcome(callback_query)
                        elif next_node_id == "privacy-policy":
                            await handle_callback_privacy_policy(callback_query)
                        elif next_node_id == "filling-instructions":
                            await handle_callback_filling_instructions(callback_query)
                        elif next_node_id == "personal-info":
                            await handle_callback_personal_info(callback_query)
                        elif next_node_id == "personal-error":
                            await handle_callback_personal_error(callback_query)
                        elif next_node_id == "position-info":
                            await handle_callback_position_info(callback_query)
                        elif next_node_id == "position-error":
                            await handle_callback_position_error(callback_query)
                        elif next_node_id == "department-choice":
                            await handle_callback_department_choice(callback_query)
                        elif next_node_id == "department-error":
                            await handle_callback_department_error(callback_query)
                        elif next_node_id == "experience-level":
                            await handle_callback_experience_level(callback_query)
                        elif next_node_id == "experience-error":
                            await handle_callback_experience_error(callback_query)
                        elif next_node_id == "company-info":
                            await handle_callback_company_info(callback_query)
                        elif next_node_id == "company-error":
                            await handle_callback_company_error(callback_query)
                        elif next_node_id == "company-size":
                            await handle_callback_company_size(callback_query)
                        elif next_node_id == "size-error":
                            await handle_callback_size_error(callback_query)
                        elif next_node_id == "project-info":
                            await handle_callback_project_info(callback_query)
                        elif next_node_id == "project-error":
                            await handle_callback_project_error(callback_query)
                        elif next_node_id == "goals-objectives":
                            await handle_callback_goals_objectives(callback_query)
                        elif next_node_id == "goals-error":
                            await handle_callback_goals_error(callback_query)
                        elif next_node_id == "contact-info":
                            await handle_callback_contact_info(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "phone-info":
                            await handle_callback_phone_info(callback_query)
                        elif next_node_id == "phone-error":
                            await handle_callback_phone_error(callback_query)
                        elif next_node_id == "additional-info":
                            await handle_callback_additional_info(callback_query)
                        elif next_node_id == "additional-error":
                            await handle_callback_additional_error(callback_query)
                        elif next_node_id == "final-review":
                            await handle_callback_final_review(callback_query)
                        elif next_node_id == "download-info":
                            await handle_callback_download_info(callback_query)
                        elif next_node_id == "email-confirmation":
                            await handle_callback_email_confirmation(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-welcome":
                await handle_callback_start_welcome(callback_query)
            elif next_node_id == "privacy-policy":
                await handle_callback_privacy_policy(callback_query)
            elif next_node_id == "filling-instructions":
                await handle_callback_filling_instructions(callback_query)
            elif next_node_id == "personal-info":
                await handle_callback_personal_info(callback_query)
            elif next_node_id == "personal-error":
                await handle_callback_personal_error(callback_query)
            elif next_node_id == "position-info":
                await handle_callback_position_info(callback_query)
            elif next_node_id == "position-error":
                await handle_callback_position_error(callback_query)
            elif next_node_id == "department-choice":
                await handle_callback_department_choice(callback_query)
            elif next_node_id == "department-error":
                await handle_callback_department_error(callback_query)
            elif next_node_id == "experience-level":
                await handle_callback_experience_level(callback_query)
            elif next_node_id == "experience-error":
                await handle_callback_experience_error(callback_query)
            elif next_node_id == "company-info":
                await handle_callback_company_info(callback_query)
            elif next_node_id == "company-error":
                await handle_callback_company_error(callback_query)
            elif next_node_id == "company-size":
                await handle_callback_company_size(callback_query)
            elif next_node_id == "size-error":
                await handle_callback_size_error(callback_query)
            elif next_node_id == "project-info":
                await handle_callback_project_info(callback_query)
            elif next_node_id == "project-error":
                await handle_callback_project_error(callback_query)
            elif next_node_id == "goals-objectives":
                await handle_callback_goals_objectives(callback_query)
            elif next_node_id == "goals-error":
                await handle_callback_goals_error(callback_query)
            elif next_node_id == "contact-info":
                await handle_callback_contact_info(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "phone-info":
                await handle_callback_phone_info(callback_query)
            elif next_node_id == "phone-error":
                await handle_callback_phone_error(callback_query)
            elif next_node_id == "additional-info":
                await handle_callback_additional_info(callback_query)
            elif next_node_id == "additional-error":
                await handle_callback_additional_error(callback_query)
            elif next_node_id == "final-review":
                await handle_callback_final_review(callback_query)
            elif next_node_id == "download-info":
                await handle_callback_download_info(callback_query)
            elif next_node_id == "email-confirmation":
                await handle_callback_email_confirmation(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_experience-level_3")
async def handle_response_experience_level_3(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "lead"
    selected_text = "👑 Ведущий (10+ лет)"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-welcome":
                            await handle_callback_start_welcome(callback_query)
                        elif next_node_id == "privacy-policy":
                            await handle_callback_privacy_policy(callback_query)
                        elif next_node_id == "filling-instructions":
                            await handle_callback_filling_instructions(callback_query)
                        elif next_node_id == "personal-info":
                            await handle_callback_personal_info(callback_query)
                        elif next_node_id == "personal-error":
                            await handle_callback_personal_error(callback_query)
                        elif next_node_id == "position-info":
                            await handle_callback_position_info(callback_query)
                        elif next_node_id == "position-error":
                            await handle_callback_position_error(callback_query)
                        elif next_node_id == "department-choice":
                            await handle_callback_department_choice(callback_query)
                        elif next_node_id == "department-error":
                            await handle_callback_department_error(callback_query)
                        elif next_node_id == "experience-level":
                            await handle_callback_experience_level(callback_query)
                        elif next_node_id == "experience-error":
                            await handle_callback_experience_error(callback_query)
                        elif next_node_id == "company-info":
                            await handle_callback_company_info(callback_query)
                        elif next_node_id == "company-error":
                            await handle_callback_company_error(callback_query)
                        elif next_node_id == "company-size":
                            await handle_callback_company_size(callback_query)
                        elif next_node_id == "size-error":
                            await handle_callback_size_error(callback_query)
                        elif next_node_id == "project-info":
                            await handle_callback_project_info(callback_query)
                        elif next_node_id == "project-error":
                            await handle_callback_project_error(callback_query)
                        elif next_node_id == "goals-objectives":
                            await handle_callback_goals_objectives(callback_query)
                        elif next_node_id == "goals-error":
                            await handle_callback_goals_error(callback_query)
                        elif next_node_id == "contact-info":
                            await handle_callback_contact_info(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "phone-info":
                            await handle_callback_phone_info(callback_query)
                        elif next_node_id == "phone-error":
                            await handle_callback_phone_error(callback_query)
                        elif next_node_id == "additional-info":
                            await handle_callback_additional_info(callback_query)
                        elif next_node_id == "additional-error":
                            await handle_callback_additional_error(callback_query)
                        elif next_node_id == "final-review":
                            await handle_callback_final_review(callback_query)
                        elif next_node_id == "download-info":
                            await handle_callback_download_info(callback_query)
                        elif next_node_id == "email-confirmation":
                            await handle_callback_email_confirmation(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-welcome":
                await handle_callback_start_welcome(callback_query)
            elif next_node_id == "privacy-policy":
                await handle_callback_privacy_policy(callback_query)
            elif next_node_id == "filling-instructions":
                await handle_callback_filling_instructions(callback_query)
            elif next_node_id == "personal-info":
                await handle_callback_personal_info(callback_query)
            elif next_node_id == "personal-error":
                await handle_callback_personal_error(callback_query)
            elif next_node_id == "position-info":
                await handle_callback_position_info(callback_query)
            elif next_node_id == "position-error":
                await handle_callback_position_error(callback_query)
            elif next_node_id == "department-choice":
                await handle_callback_department_choice(callback_query)
            elif next_node_id == "department-error":
                await handle_callback_department_error(callback_query)
            elif next_node_id == "experience-level":
                await handle_callback_experience_level(callback_query)
            elif next_node_id == "experience-error":
                await handle_callback_experience_error(callback_query)
            elif next_node_id == "company-info":
                await handle_callback_company_info(callback_query)
            elif next_node_id == "company-error":
                await handle_callback_company_error(callback_query)
            elif next_node_id == "company-size":
                await handle_callback_company_size(callback_query)
            elif next_node_id == "size-error":
                await handle_callback_size_error(callback_query)
            elif next_node_id == "project-info":
                await handle_callback_project_info(callback_query)
            elif next_node_id == "project-error":
                await handle_callback_project_error(callback_query)
            elif next_node_id == "goals-objectives":
                await handle_callback_goals_objectives(callback_query)
            elif next_node_id == "goals-error":
                await handle_callback_goals_error(callback_query)
            elif next_node_id == "contact-info":
                await handle_callback_contact_info(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "phone-info":
                await handle_callback_phone_info(callback_query)
            elif next_node_id == "phone-error":
                await handle_callback_phone_error(callback_query)
            elif next_node_id == "additional-info":
                await handle_callback_additional_info(callback_query)
            elif next_node_id == "additional-error":
                await handle_callback_additional_error(callback_query)
            elif next_node_id == "final-review":
                await handle_callback_final_review(callback_query)
            elif next_node_id == "download-info":
                await handle_callback_download_info(callback_query)
            elif next_node_id == "email-confirmation":
                await handle_callback_email_confirmation(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_experience-level_4")
async def handle_response_experience_level_4(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "executive"
    selected_text = "🏆 Руководитель"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-welcome":
                            await handle_callback_start_welcome(callback_query)
                        elif next_node_id == "privacy-policy":
                            await handle_callback_privacy_policy(callback_query)
                        elif next_node_id == "filling-instructions":
                            await handle_callback_filling_instructions(callback_query)
                        elif next_node_id == "personal-info":
                            await handle_callback_personal_info(callback_query)
                        elif next_node_id == "personal-error":
                            await handle_callback_personal_error(callback_query)
                        elif next_node_id == "position-info":
                            await handle_callback_position_info(callback_query)
                        elif next_node_id == "position-error":
                            await handle_callback_position_error(callback_query)
                        elif next_node_id == "department-choice":
                            await handle_callback_department_choice(callback_query)
                        elif next_node_id == "department-error":
                            await handle_callback_department_error(callback_query)
                        elif next_node_id == "experience-level":
                            await handle_callback_experience_level(callback_query)
                        elif next_node_id == "experience-error":
                            await handle_callback_experience_error(callback_query)
                        elif next_node_id == "company-info":
                            await handle_callback_company_info(callback_query)
                        elif next_node_id == "company-error":
                            await handle_callback_company_error(callback_query)
                        elif next_node_id == "company-size":
                            await handle_callback_company_size(callback_query)
                        elif next_node_id == "size-error":
                            await handle_callback_size_error(callback_query)
                        elif next_node_id == "project-info":
                            await handle_callback_project_info(callback_query)
                        elif next_node_id == "project-error":
                            await handle_callback_project_error(callback_query)
                        elif next_node_id == "goals-objectives":
                            await handle_callback_goals_objectives(callback_query)
                        elif next_node_id == "goals-error":
                            await handle_callback_goals_error(callback_query)
                        elif next_node_id == "contact-info":
                            await handle_callback_contact_info(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "phone-info":
                            await handle_callback_phone_info(callback_query)
                        elif next_node_id == "phone-error":
                            await handle_callback_phone_error(callback_query)
                        elif next_node_id == "additional-info":
                            await handle_callback_additional_info(callback_query)
                        elif next_node_id == "additional-error":
                            await handle_callback_additional_error(callback_query)
                        elif next_node_id == "final-review":
                            await handle_callback_final_review(callback_query)
                        elif next_node_id == "download-info":
                            await handle_callback_download_info(callback_query)
                        elif next_node_id == "email-confirmation":
                            await handle_callback_email_confirmation(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-welcome":
                await handle_callback_start_welcome(callback_query)
            elif next_node_id == "privacy-policy":
                await handle_callback_privacy_policy(callback_query)
            elif next_node_id == "filling-instructions":
                await handle_callback_filling_instructions(callback_query)
            elif next_node_id == "personal-info":
                await handle_callback_personal_info(callback_query)
            elif next_node_id == "personal-error":
                await handle_callback_personal_error(callback_query)
            elif next_node_id == "position-info":
                await handle_callback_position_info(callback_query)
            elif next_node_id == "position-error":
                await handle_callback_position_error(callback_query)
            elif next_node_id == "department-choice":
                await handle_callback_department_choice(callback_query)
            elif next_node_id == "department-error":
                await handle_callback_department_error(callback_query)
            elif next_node_id == "experience-level":
                await handle_callback_experience_level(callback_query)
            elif next_node_id == "experience-error":
                await handle_callback_experience_error(callback_query)
            elif next_node_id == "company-info":
                await handle_callback_company_info(callback_query)
            elif next_node_id == "company-error":
                await handle_callback_company_error(callback_query)
            elif next_node_id == "company-size":
                await handle_callback_company_size(callback_query)
            elif next_node_id == "size-error":
                await handle_callback_size_error(callback_query)
            elif next_node_id == "project-info":
                await handle_callback_project_info(callback_query)
            elif next_node_id == "project-error":
                await handle_callback_project_error(callback_query)
            elif next_node_id == "goals-objectives":
                await handle_callback_goals_objectives(callback_query)
            elif next_node_id == "goals-error":
                await handle_callback_goals_error(callback_query)
            elif next_node_id == "contact-info":
                await handle_callback_contact_info(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "phone-info":
                await handle_callback_phone_info(callback_query)
            elif next_node_id == "phone-error":
                await handle_callback_phone_error(callback_query)
            elif next_node_id == "additional-info":
                await handle_callback_additional_info(callback_query)
            elif next_node_id == "additional-error":
                await handle_callback_additional_error(callback_query)
            elif next_node_id == "final-review":
                await handle_callback_final_review(callback_query)
            elif next_node_id == "download-info":
                await handle_callback_download_info(callback_query)
            elif next_node_id == "email-confirmation":
                await handle_callback_email_confirmation(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_company-size_0")
async def handle_response_company_size_0(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "micro"
    selected_text = "👤 Микро (1-10 человек)"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-welcome":
                            await handle_callback_start_welcome(callback_query)
                        elif next_node_id == "privacy-policy":
                            await handle_callback_privacy_policy(callback_query)
                        elif next_node_id == "filling-instructions":
                            await handle_callback_filling_instructions(callback_query)
                        elif next_node_id == "personal-info":
                            await handle_callback_personal_info(callback_query)
                        elif next_node_id == "personal-error":
                            await handle_callback_personal_error(callback_query)
                        elif next_node_id == "position-info":
                            await handle_callback_position_info(callback_query)
                        elif next_node_id == "position-error":
                            await handle_callback_position_error(callback_query)
                        elif next_node_id == "department-choice":
                            await handle_callback_department_choice(callback_query)
                        elif next_node_id == "department-error":
                            await handle_callback_department_error(callback_query)
                        elif next_node_id == "experience-level":
                            await handle_callback_experience_level(callback_query)
                        elif next_node_id == "experience-error":
                            await handle_callback_experience_error(callback_query)
                        elif next_node_id == "company-info":
                            await handle_callback_company_info(callback_query)
                        elif next_node_id == "company-error":
                            await handle_callback_company_error(callback_query)
                        elif next_node_id == "company-size":
                            await handle_callback_company_size(callback_query)
                        elif next_node_id == "size-error":
                            await handle_callback_size_error(callback_query)
                        elif next_node_id == "project-info":
                            await handle_callback_project_info(callback_query)
                        elif next_node_id == "project-error":
                            await handle_callback_project_error(callback_query)
                        elif next_node_id == "goals-objectives":
                            await handle_callback_goals_objectives(callback_query)
                        elif next_node_id == "goals-error":
                            await handle_callback_goals_error(callback_query)
                        elif next_node_id == "contact-info":
                            await handle_callback_contact_info(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "phone-info":
                            await handle_callback_phone_info(callback_query)
                        elif next_node_id == "phone-error":
                            await handle_callback_phone_error(callback_query)
                        elif next_node_id == "additional-info":
                            await handle_callback_additional_info(callback_query)
                        elif next_node_id == "additional-error":
                            await handle_callback_additional_error(callback_query)
                        elif next_node_id == "final-review":
                            await handle_callback_final_review(callback_query)
                        elif next_node_id == "download-info":
                            await handle_callback_download_info(callback_query)
                        elif next_node_id == "email-confirmation":
                            await handle_callback_email_confirmation(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-welcome":
                await handle_callback_start_welcome(callback_query)
            elif next_node_id == "privacy-policy":
                await handle_callback_privacy_policy(callback_query)
            elif next_node_id == "filling-instructions":
                await handle_callback_filling_instructions(callback_query)
            elif next_node_id == "personal-info":
                await handle_callback_personal_info(callback_query)
            elif next_node_id == "personal-error":
                await handle_callback_personal_error(callback_query)
            elif next_node_id == "position-info":
                await handle_callback_position_info(callback_query)
            elif next_node_id == "position-error":
                await handle_callback_position_error(callback_query)
            elif next_node_id == "department-choice":
                await handle_callback_department_choice(callback_query)
            elif next_node_id == "department-error":
                await handle_callback_department_error(callback_query)
            elif next_node_id == "experience-level":
                await handle_callback_experience_level(callback_query)
            elif next_node_id == "experience-error":
                await handle_callback_experience_error(callback_query)
            elif next_node_id == "company-info":
                await handle_callback_company_info(callback_query)
            elif next_node_id == "company-error":
                await handle_callback_company_error(callback_query)
            elif next_node_id == "company-size":
                await handle_callback_company_size(callback_query)
            elif next_node_id == "size-error":
                await handle_callback_size_error(callback_query)
            elif next_node_id == "project-info":
                await handle_callback_project_info(callback_query)
            elif next_node_id == "project-error":
                await handle_callback_project_error(callback_query)
            elif next_node_id == "goals-objectives":
                await handle_callback_goals_objectives(callback_query)
            elif next_node_id == "goals-error":
                await handle_callback_goals_error(callback_query)
            elif next_node_id == "contact-info":
                await handle_callback_contact_info(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "phone-info":
                await handle_callback_phone_info(callback_query)
            elif next_node_id == "phone-error":
                await handle_callback_phone_error(callback_query)
            elif next_node_id == "additional-info":
                await handle_callback_additional_info(callback_query)
            elif next_node_id == "additional-error":
                await handle_callback_additional_error(callback_query)
            elif next_node_id == "final-review":
                await handle_callback_final_review(callback_query)
            elif next_node_id == "download-info":
                await handle_callback_download_info(callback_query)
            elif next_node_id == "email-confirmation":
                await handle_callback_email_confirmation(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_company-size_1")
async def handle_response_company_size_1(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "small"
    selected_text = "👥 Малая (11-50 человек)"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-welcome":
                            await handle_callback_start_welcome(callback_query)
                        elif next_node_id == "privacy-policy":
                            await handle_callback_privacy_policy(callback_query)
                        elif next_node_id == "filling-instructions":
                            await handle_callback_filling_instructions(callback_query)
                        elif next_node_id == "personal-info":
                            await handle_callback_personal_info(callback_query)
                        elif next_node_id == "personal-error":
                            await handle_callback_personal_error(callback_query)
                        elif next_node_id == "position-info":
                            await handle_callback_position_info(callback_query)
                        elif next_node_id == "position-error":
                            await handle_callback_position_error(callback_query)
                        elif next_node_id == "department-choice":
                            await handle_callback_department_choice(callback_query)
                        elif next_node_id == "department-error":
                            await handle_callback_department_error(callback_query)
                        elif next_node_id == "experience-level":
                            await handle_callback_experience_level(callback_query)
                        elif next_node_id == "experience-error":
                            await handle_callback_experience_error(callback_query)
                        elif next_node_id == "company-info":
                            await handle_callback_company_info(callback_query)
                        elif next_node_id == "company-error":
                            await handle_callback_company_error(callback_query)
                        elif next_node_id == "company-size":
                            await handle_callback_company_size(callback_query)
                        elif next_node_id == "size-error":
                            await handle_callback_size_error(callback_query)
                        elif next_node_id == "project-info":
                            await handle_callback_project_info(callback_query)
                        elif next_node_id == "project-error":
                            await handle_callback_project_error(callback_query)
                        elif next_node_id == "goals-objectives":
                            await handle_callback_goals_objectives(callback_query)
                        elif next_node_id == "goals-error":
                            await handle_callback_goals_error(callback_query)
                        elif next_node_id == "contact-info":
                            await handle_callback_contact_info(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "phone-info":
                            await handle_callback_phone_info(callback_query)
                        elif next_node_id == "phone-error":
                            await handle_callback_phone_error(callback_query)
                        elif next_node_id == "additional-info":
                            await handle_callback_additional_info(callback_query)
                        elif next_node_id == "additional-error":
                            await handle_callback_additional_error(callback_query)
                        elif next_node_id == "final-review":
                            await handle_callback_final_review(callback_query)
                        elif next_node_id == "download-info":
                            await handle_callback_download_info(callback_query)
                        elif next_node_id == "email-confirmation":
                            await handle_callback_email_confirmation(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-welcome":
                await handle_callback_start_welcome(callback_query)
            elif next_node_id == "privacy-policy":
                await handle_callback_privacy_policy(callback_query)
            elif next_node_id == "filling-instructions":
                await handle_callback_filling_instructions(callback_query)
            elif next_node_id == "personal-info":
                await handle_callback_personal_info(callback_query)
            elif next_node_id == "personal-error":
                await handle_callback_personal_error(callback_query)
            elif next_node_id == "position-info":
                await handle_callback_position_info(callback_query)
            elif next_node_id == "position-error":
                await handle_callback_position_error(callback_query)
            elif next_node_id == "department-choice":
                await handle_callback_department_choice(callback_query)
            elif next_node_id == "department-error":
                await handle_callback_department_error(callback_query)
            elif next_node_id == "experience-level":
                await handle_callback_experience_level(callback_query)
            elif next_node_id == "experience-error":
                await handle_callback_experience_error(callback_query)
            elif next_node_id == "company-info":
                await handle_callback_company_info(callback_query)
            elif next_node_id == "company-error":
                await handle_callback_company_error(callback_query)
            elif next_node_id == "company-size":
                await handle_callback_company_size(callback_query)
            elif next_node_id == "size-error":
                await handle_callback_size_error(callback_query)
            elif next_node_id == "project-info":
                await handle_callback_project_info(callback_query)
            elif next_node_id == "project-error":
                await handle_callback_project_error(callback_query)
            elif next_node_id == "goals-objectives":
                await handle_callback_goals_objectives(callback_query)
            elif next_node_id == "goals-error":
                await handle_callback_goals_error(callback_query)
            elif next_node_id == "contact-info":
                await handle_callback_contact_info(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "phone-info":
                await handle_callback_phone_info(callback_query)
            elif next_node_id == "phone-error":
                await handle_callback_phone_error(callback_query)
            elif next_node_id == "additional-info":
                await handle_callback_additional_info(callback_query)
            elif next_node_id == "additional-error":
                await handle_callback_additional_error(callback_query)
            elif next_node_id == "final-review":
                await handle_callback_final_review(callback_query)
            elif next_node_id == "download-info":
                await handle_callback_download_info(callback_query)
            elif next_node_id == "email-confirmation":
                await handle_callback_email_confirmation(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_company-size_2")
async def handle_response_company_size_2(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "medium"
    selected_text = "🏢 Средняя (51-250 человек)"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-welcome":
                            await handle_callback_start_welcome(callback_query)
                        elif next_node_id == "privacy-policy":
                            await handle_callback_privacy_policy(callback_query)
                        elif next_node_id == "filling-instructions":
                            await handle_callback_filling_instructions(callback_query)
                        elif next_node_id == "personal-info":
                            await handle_callback_personal_info(callback_query)
                        elif next_node_id == "personal-error":
                            await handle_callback_personal_error(callback_query)
                        elif next_node_id == "position-info":
                            await handle_callback_position_info(callback_query)
                        elif next_node_id == "position-error":
                            await handle_callback_position_error(callback_query)
                        elif next_node_id == "department-choice":
                            await handle_callback_department_choice(callback_query)
                        elif next_node_id == "department-error":
                            await handle_callback_department_error(callback_query)
                        elif next_node_id == "experience-level":
                            await handle_callback_experience_level(callback_query)
                        elif next_node_id == "experience-error":
                            await handle_callback_experience_error(callback_query)
                        elif next_node_id == "company-info":
                            await handle_callback_company_info(callback_query)
                        elif next_node_id == "company-error":
                            await handle_callback_company_error(callback_query)
                        elif next_node_id == "company-size":
                            await handle_callback_company_size(callback_query)
                        elif next_node_id == "size-error":
                            await handle_callback_size_error(callback_query)
                        elif next_node_id == "project-info":
                            await handle_callback_project_info(callback_query)
                        elif next_node_id == "project-error":
                            await handle_callback_project_error(callback_query)
                        elif next_node_id == "goals-objectives":
                            await handle_callback_goals_objectives(callback_query)
                        elif next_node_id == "goals-error":
                            await handle_callback_goals_error(callback_query)
                        elif next_node_id == "contact-info":
                            await handle_callback_contact_info(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "phone-info":
                            await handle_callback_phone_info(callback_query)
                        elif next_node_id == "phone-error":
                            await handle_callback_phone_error(callback_query)
                        elif next_node_id == "additional-info":
                            await handle_callback_additional_info(callback_query)
                        elif next_node_id == "additional-error":
                            await handle_callback_additional_error(callback_query)
                        elif next_node_id == "final-review":
                            await handle_callback_final_review(callback_query)
                        elif next_node_id == "download-info":
                            await handle_callback_download_info(callback_query)
                        elif next_node_id == "email-confirmation":
                            await handle_callback_email_confirmation(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-welcome":
                await handle_callback_start_welcome(callback_query)
            elif next_node_id == "privacy-policy":
                await handle_callback_privacy_policy(callback_query)
            elif next_node_id == "filling-instructions":
                await handle_callback_filling_instructions(callback_query)
            elif next_node_id == "personal-info":
                await handle_callback_personal_info(callback_query)
            elif next_node_id == "personal-error":
                await handle_callback_personal_error(callback_query)
            elif next_node_id == "position-info":
                await handle_callback_position_info(callback_query)
            elif next_node_id == "position-error":
                await handle_callback_position_error(callback_query)
            elif next_node_id == "department-choice":
                await handle_callback_department_choice(callback_query)
            elif next_node_id == "department-error":
                await handle_callback_department_error(callback_query)
            elif next_node_id == "experience-level":
                await handle_callback_experience_level(callback_query)
            elif next_node_id == "experience-error":
                await handle_callback_experience_error(callback_query)
            elif next_node_id == "company-info":
                await handle_callback_company_info(callback_query)
            elif next_node_id == "company-error":
                await handle_callback_company_error(callback_query)
            elif next_node_id == "company-size":
                await handle_callback_company_size(callback_query)
            elif next_node_id == "size-error":
                await handle_callback_size_error(callback_query)
            elif next_node_id == "project-info":
                await handle_callback_project_info(callback_query)
            elif next_node_id == "project-error":
                await handle_callback_project_error(callback_query)
            elif next_node_id == "goals-objectives":
                await handle_callback_goals_objectives(callback_query)
            elif next_node_id == "goals-error":
                await handle_callback_goals_error(callback_query)
            elif next_node_id == "contact-info":
                await handle_callback_contact_info(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "phone-info":
                await handle_callback_phone_info(callback_query)
            elif next_node_id == "phone-error":
                await handle_callback_phone_error(callback_query)
            elif next_node_id == "additional-info":
                await handle_callback_additional_info(callback_query)
            elif next_node_id == "additional-error":
                await handle_callback_additional_error(callback_query)
            elif next_node_id == "final-review":
                await handle_callback_final_review(callback_query)
            elif next_node_id == "download-info":
                await handle_callback_download_info(callback_query)
            elif next_node_id == "email-confirmation":
                await handle_callback_email_confirmation(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_company-size_3")
async def handle_response_company_size_3(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "large"
    selected_text = "🏬 Большая (251-1000 человек)"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-welcome":
                            await handle_callback_start_welcome(callback_query)
                        elif next_node_id == "privacy-policy":
                            await handle_callback_privacy_policy(callback_query)
                        elif next_node_id == "filling-instructions":
                            await handle_callback_filling_instructions(callback_query)
                        elif next_node_id == "personal-info":
                            await handle_callback_personal_info(callback_query)
                        elif next_node_id == "personal-error":
                            await handle_callback_personal_error(callback_query)
                        elif next_node_id == "position-info":
                            await handle_callback_position_info(callback_query)
                        elif next_node_id == "position-error":
                            await handle_callback_position_error(callback_query)
                        elif next_node_id == "department-choice":
                            await handle_callback_department_choice(callback_query)
                        elif next_node_id == "department-error":
                            await handle_callback_department_error(callback_query)
                        elif next_node_id == "experience-level":
                            await handle_callback_experience_level(callback_query)
                        elif next_node_id == "experience-error":
                            await handle_callback_experience_error(callback_query)
                        elif next_node_id == "company-info":
                            await handle_callback_company_info(callback_query)
                        elif next_node_id == "company-error":
                            await handle_callback_company_error(callback_query)
                        elif next_node_id == "company-size":
                            await handle_callback_company_size(callback_query)
                        elif next_node_id == "size-error":
                            await handle_callback_size_error(callback_query)
                        elif next_node_id == "project-info":
                            await handle_callback_project_info(callback_query)
                        elif next_node_id == "project-error":
                            await handle_callback_project_error(callback_query)
                        elif next_node_id == "goals-objectives":
                            await handle_callback_goals_objectives(callback_query)
                        elif next_node_id == "goals-error":
                            await handle_callback_goals_error(callback_query)
                        elif next_node_id == "contact-info":
                            await handle_callback_contact_info(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "phone-info":
                            await handle_callback_phone_info(callback_query)
                        elif next_node_id == "phone-error":
                            await handle_callback_phone_error(callback_query)
                        elif next_node_id == "additional-info":
                            await handle_callback_additional_info(callback_query)
                        elif next_node_id == "additional-error":
                            await handle_callback_additional_error(callback_query)
                        elif next_node_id == "final-review":
                            await handle_callback_final_review(callback_query)
                        elif next_node_id == "download-info":
                            await handle_callback_download_info(callback_query)
                        elif next_node_id == "email-confirmation":
                            await handle_callback_email_confirmation(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-welcome":
                await handle_callback_start_welcome(callback_query)
            elif next_node_id == "privacy-policy":
                await handle_callback_privacy_policy(callback_query)
            elif next_node_id == "filling-instructions":
                await handle_callback_filling_instructions(callback_query)
            elif next_node_id == "personal-info":
                await handle_callback_personal_info(callback_query)
            elif next_node_id == "personal-error":
                await handle_callback_personal_error(callback_query)
            elif next_node_id == "position-info":
                await handle_callback_position_info(callback_query)
            elif next_node_id == "position-error":
                await handle_callback_position_error(callback_query)
            elif next_node_id == "department-choice":
                await handle_callback_department_choice(callback_query)
            elif next_node_id == "department-error":
                await handle_callback_department_error(callback_query)
            elif next_node_id == "experience-level":
                await handle_callback_experience_level(callback_query)
            elif next_node_id == "experience-error":
                await handle_callback_experience_error(callback_query)
            elif next_node_id == "company-info":
                await handle_callback_company_info(callback_query)
            elif next_node_id == "company-error":
                await handle_callback_company_error(callback_query)
            elif next_node_id == "company-size":
                await handle_callback_company_size(callback_query)
            elif next_node_id == "size-error":
                await handle_callback_size_error(callback_query)
            elif next_node_id == "project-info":
                await handle_callback_project_info(callback_query)
            elif next_node_id == "project-error":
                await handle_callback_project_error(callback_query)
            elif next_node_id == "goals-objectives":
                await handle_callback_goals_objectives(callback_query)
            elif next_node_id == "goals-error":
                await handle_callback_goals_error(callback_query)
            elif next_node_id == "contact-info":
                await handle_callback_contact_info(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "phone-info":
                await handle_callback_phone_info(callback_query)
            elif next_node_id == "phone-error":
                await handle_callback_phone_error(callback_query)
            elif next_node_id == "additional-info":
                await handle_callback_additional_info(callback_query)
            elif next_node_id == "additional-error":
                await handle_callback_additional_error(callback_query)
            elif next_node_id == "final-review":
                await handle_callback_final_review(callback_query)
            elif next_node_id == "download-info":
                await handle_callback_download_info(callback_query)
            elif next_node_id == "email-confirmation":
                await handle_callback_email_confirmation(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_company-size_4")
async def handle_response_company_size_4(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "enterprise"
    selected_text = "🏭 Корпорация (1000+ человек)"
    
    # Обработка множественного выбора
    if config.get("allow_multiple"):
        # Проверяем, является ли это кнопкой "Готово" для завершения выбора
        if selected_value == "done":
            # Завершаем множественный выбор
            if len(config["selected"]) > 0:
                # Сохраняем все выбранные элементы
                variable_name = config.get("variable", "user_response")
                import datetime
                timestamp = datetime.datetime.now().isoformat()
                node_id = config.get("node_id", "unknown")
                
                # Создаем структурированный ответ для множественного выбора
                response_data = {
                    "value": [item["value"] for item in config["selected"]],
                    "text": [item["text"] for item in config["selected"]],
                    "type": "multiple_choice",
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
                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data['text']} (пользователь {user_id})")
                    else:
                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")
                
                # Отправляем сообщение об успехе
                success_message = config.get("success_message", "Спасибо за ваш выбор!")
                selected_items = ", ".join([item["text"] for item in config["selected"]])
                await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_items}")
                
                logging.info(f"Получен множественный выбор: {variable_name} = {[item['text'] for item in config['selected']]}")
                
                # Очищаем состояние
                del user_data[user_id]["button_response_config"]
                
                # Автоматическая навигация к следующему узлу
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        if next_node_id == "start-welcome":
                            await handle_callback_start_welcome(callback_query)
                        elif next_node_id == "privacy-policy":
                            await handle_callback_privacy_policy(callback_query)
                        elif next_node_id == "filling-instructions":
                            await handle_callback_filling_instructions(callback_query)
                        elif next_node_id == "personal-info":
                            await handle_callback_personal_info(callback_query)
                        elif next_node_id == "personal-error":
                            await handle_callback_personal_error(callback_query)
                        elif next_node_id == "position-info":
                            await handle_callback_position_info(callback_query)
                        elif next_node_id == "position-error":
                            await handle_callback_position_error(callback_query)
                        elif next_node_id == "department-choice":
                            await handle_callback_department_choice(callback_query)
                        elif next_node_id == "department-error":
                            await handle_callback_department_error(callback_query)
                        elif next_node_id == "experience-level":
                            await handle_callback_experience_level(callback_query)
                        elif next_node_id == "experience-error":
                            await handle_callback_experience_error(callback_query)
                        elif next_node_id == "company-info":
                            await handle_callback_company_info(callback_query)
                        elif next_node_id == "company-error":
                            await handle_callback_company_error(callback_query)
                        elif next_node_id == "company-size":
                            await handle_callback_company_size(callback_query)
                        elif next_node_id == "size-error":
                            await handle_callback_size_error(callback_query)
                        elif next_node_id == "project-info":
                            await handle_callback_project_info(callback_query)
                        elif next_node_id == "project-error":
                            await handle_callback_project_error(callback_query)
                        elif next_node_id == "goals-objectives":
                            await handle_callback_goals_objectives(callback_query)
                        elif next_node_id == "goals-error":
                            await handle_callback_goals_error(callback_query)
                        elif next_node_id == "contact-info":
                            await handle_callback_contact_info(callback_query)
                        elif next_node_id == "contact-error":
                            await handle_callback_contact_error(callback_query)
                        elif next_node_id == "phone-info":
                            await handle_callback_phone_info(callback_query)
                        elif next_node_id == "phone-error":
                            await handle_callback_phone_error(callback_query)
                        elif next_node_id == "additional-info":
                            await handle_callback_additional_info(callback_query)
                        elif next_node_id == "additional-error":
                            await handle_callback_additional_error(callback_query)
                        elif next_node_id == "final-review":
                            await handle_callback_final_review(callback_query)
                        elif next_node_id == "download-info":
                            await handle_callback_download_info(callback_query)
                        elif next_node_id == "email-confirmation":
                            await handle_callback_email_confirmation(callback_query)
                        else:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
                return
            else:
                # Если ничего не выбрано, показываем предупреждение
                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)
                return
        else:
            # Обычная логика множественного выбора
            if selected_value not in config["selected"]:
                config["selected"].append({"text": selected_text, "value": selected_value})
                await callback_query.answer(f"✅ Выбрано: {selected_text}")
            else:
                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]
                await callback_query.answer(f"❌ Убрано: {selected_text}")
            return  # Не завершаем сбор, позволяем выбрать еще
    
    # Сохраняем одиночный выбор
    variable_name = config.get("variable", "user_response")
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
    await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}")
    
    # Очищаем состояние
    del user_data[user_id]["button_response_config"]
    
    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")
    
    # Автоматическая навигация к следующему узлу
    next_node_id = config.get("next_node_id")
    if next_node_id:
        try:
            # Вызываем обработчик для следующего узла
            if next_node_id == "start-welcome":
                await handle_callback_start_welcome(callback_query)
            elif next_node_id == "privacy-policy":
                await handle_callback_privacy_policy(callback_query)
            elif next_node_id == "filling-instructions":
                await handle_callback_filling_instructions(callback_query)
            elif next_node_id == "personal-info":
                await handle_callback_personal_info(callback_query)
            elif next_node_id == "personal-error":
                await handle_callback_personal_error(callback_query)
            elif next_node_id == "position-info":
                await handle_callback_position_info(callback_query)
            elif next_node_id == "position-error":
                await handle_callback_position_error(callback_query)
            elif next_node_id == "department-choice":
                await handle_callback_department_choice(callback_query)
            elif next_node_id == "department-error":
                await handle_callback_department_error(callback_query)
            elif next_node_id == "experience-level":
                await handle_callback_experience_level(callback_query)
            elif next_node_id == "experience-error":
                await handle_callback_experience_error(callback_query)
            elif next_node_id == "company-info":
                await handle_callback_company_info(callback_query)
            elif next_node_id == "company-error":
                await handle_callback_company_error(callback_query)
            elif next_node_id == "company-size":
                await handle_callback_company_size(callback_query)
            elif next_node_id == "size-error":
                await handle_callback_size_error(callback_query)
            elif next_node_id == "project-info":
                await handle_callback_project_info(callback_query)
            elif next_node_id == "project-error":
                await handle_callback_project_error(callback_query)
            elif next_node_id == "goals-objectives":
                await handle_callback_goals_objectives(callback_query)
            elif next_node_id == "goals-error":
                await handle_callback_goals_error(callback_query)
            elif next_node_id == "contact-info":
                await handle_callback_contact_info(callback_query)
            elif next_node_id == "contact-error":
                await handle_callback_contact_error(callback_query)
            elif next_node_id == "phone-info":
                await handle_callback_phone_info(callback_query)
            elif next_node_id == "phone-error":
                await handle_callback_phone_error(callback_query)
            elif next_node_id == "additional-info":
                await handle_callback_additional_info(callback_query)
            elif next_node_id == "additional-error":
                await handle_callback_additional_error(callback_query)
            elif next_node_id == "final-review":
                await handle_callback_final_review(callback_query)
            elif next_node_id == "download-info":
                await handle_callback_download_info(callback_query)
            elif next_node_id == "email-confirmation":
                await handle_callback_email_confirmation(callback_query)
            else:
                logging.warning(f"Неизвестный следующий узел: {next_node_id}")
        except Exception as e:
            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")


# Универсальный обработчик пользовательского ввода
@dp.message(F.text)
async def handle_user_input(message: types.Message):
    user_id = message.from_user.id
    
    # Проверяем, ожидаем ли мы ввод от пользователя
    if user_id not in user_data or "waiting_for_input" not in user_data[user_id]:
        return  # Игнорируем сообщение если не ожидаем ввод
    
    input_config = user_data[user_id]["waiting_for_input"]
    user_text = message.text
    
    # Проверяем команду пропуска
    if input_config.get("allow_skip") and user_text == "/skip":
        await message.answer("⏭️ Ввод пропущен")
        del user_data[user_id]["waiting_for_input"]
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
            if next_node_id == "start-welcome":
                logging.info(f"Переход к узлу start-welcome типа start")
            elif next_node_id == "privacy-policy":
                text = f"🔒 <b>ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ</b>\n\n✅ <b>Мы гарантируем:</b>\n• Защиту всех персональных данных\n• Использование данных только для внутренних целей\n• Соблюдение требований GDPR и 152-ФЗ\n• Возможность удаления данных по запросу\n\n🛡️ <b>Безопасность:</b>\n• Шифрование данных при передаче\n• Ограниченный доступ к информации\n• Регулярные аудиты безопасности\n\n📧 <b>Контакты:</b> privacy@company.com"
                parse_mode = ParseMode.MARKDOWN
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="✅ Принять и продолжить", callback_data="personal-info"))
                builder.add(InlineKeyboardButton(text="◀️ Назад к началу", callback_data="start-welcome"))
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "filling-instructions":
                text = f"📖 <b>ИНСТРУКЦИИ ПО ЗАПОЛНЕНИЮ</b>\n\n🎯 <b>Общие рекомендации:</b>\n• Заполняйте все поля максимально точно\n• При необходимости используйте кнопку \"Пропустить\"\n• Можете вернуться к предыдущим разделам\n• Сохранение происходит автоматически\n\n⚡ <b>Быстрые команды:</b>\n• /help - помощь в любое время\n• /status - текущий прогресс\n• /reset - начать заново\n\n💡 <b>Совет:</b> Подготовьте заранее данные о компании и проектах"
                parse_mode = ParseMode.MARKDOWN
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="🚀 Начать заполнение", callback_data="personal-info"))
                builder.add(InlineKeyboardButton(text="◀️ Назад к началу", callback_data="start-welcome"))
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "personal-info":
                prompt_text = f"👤 <b>РАЗДЕЛ 1: ПЕРСОНАЛЬНЫЕ ДАННЫЕ</b>\n\n<b>Введите ваше полное имя:</b>\n\n<i>Пример: Иванов Иван Иванович</i>\n\n📝 Укажите фамилию, имя и отчество полностью"
                placeholder_text = "Фамилия Имя Отчество"
                prompt_text += f"\n\n💡 {placeholder_text}"
                await message.answer(prompt_text)
                
                # Настраиваем ожидание ввода
                user_data[user_id]["waiting_for_input"] = {
                    "type": "text",
                    "variable": "full_name",
                    "validation": "",
                    "min_length": 3,
                    "max_length": 100,
                    "timeout": 300,
                    "required": True,
                    "allow_skip": False,
                    "save_to_database": True,
                    "retry_message": "Пожалуйста, попробуйте еще раз.",
                    "success_message": "Спасибо за ваш ответ!",
                    "prompt": f"👤 <b>РАЗДЕЛ 1: ПЕРСОНАЛЬНЫЕ ДАННЫЕ</b>\n\n<b>Введите ваше полное имя:</b>\n\n<i>Пример: Иванов Иван Иванович</i>\n\n📝 Укажите фамилию, имя и отчество полностью",
                    "node_id": "personal-info",
                    "next_node_id": "position-info"
                }
            elif next_node_id == "personal-error":
                text = f"❌ **ОШИБКА ВВОДА ПЕРСОНАЛЬНЫХ ДАННЫХ**\n\nПожалуйста, укажите корректное полное имя.\n\n**Требования:**\n• Минимум 3 символа\n• Максимум 100 символов\n• Только буквы и пробелы"
                parse_mode = ParseMode.MARKDOWN
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="🔄 Повторить ввод", callback_data="personal-info"))
                builder.add(InlineKeyboardButton(text="⏭️ Пропустить", callback_data="position-info"))
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "position-info":
                prompt_text = f"💼 **РАЗДЕЛ 2: ДОЛЖНОСТЬ И ОТДЕЛ**\n\n**Укажите вашу текущую должность:**\n\n*Пример: Ведущий разработчик / Менеджер проектов / Системный аналитик*\n\n📝 Укажите полное название должности"
                placeholder_text = "Название должности"
                prompt_text += f"\n\n💡 {placeholder_text}"
                await message.answer(prompt_text)
                
                # Настраиваем ожидание ввода
                user_data[user_id]["waiting_for_input"] = {
                    "type": "text",
                    "variable": "position_title",
                    "validation": "",
                    "min_length": 3,
                    "max_length": 150,
                    "timeout": 300,
                    "required": True,
                    "allow_skip": False,
                    "save_to_database": True,
                    "retry_message": "Пожалуйста, попробуйте еще раз.",
                    "success_message": "Спасибо за ваш ответ!",
                    "prompt": f"💼 **РАЗДЕЛ 2: ДОЛЖНОСТЬ И ОТДЕЛ**\n\n**Укажите вашу текущую должность:**\n\n*Пример: Ведущий разработчик / Менеджер проектов / Системный аналитик*\n\n📝 Укажите полное название должности",
                    "node_id": "position-info",
                    "next_node_id": "department-choice"
                }
            elif next_node_id == "position-error":
                text = f"❌ **ОШИБКА ВВОДА ДОЛЖНОСТИ**\n\nПожалуйста, укажите корректное название должности.\n\n**Требования:**\n• Минимум 3 символа\n• Максимум 150 символов"
                parse_mode = ParseMode.MARKDOWN
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="🔄 Повторить ввод", callback_data="position-info"))
                builder.add(InlineKeyboardButton(text="⏭️ Пропустить", callback_data="department-choice"))
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "department-choice":
                prompt_text = f"🏢 **РАЗДЕЛ 3: ОТДЕЛ/ПОДРАЗДЕЛЕНИЕ**\n\n**Выберите ваш отдел:**\n\nЕсли вашего отдела нет в списке, выберите \"Другое\""
                
                # Создаем кнопки для выбора ответа
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="💻 IT-отдел", callback_data="response_department-choice_0"))
                builder.add(InlineKeyboardButton(text="📈 Отдел продаж", callback_data="response_department-choice_1"))
                builder.add(InlineKeyboardButton(text="📢 Маркетинг", callback_data="response_department-choice_2"))
                builder.add(InlineKeyboardButton(text="👥 HR-отдел", callback_data="response_department-choice_3"))
                builder.add(InlineKeyboardButton(text="💰 Финансы", callback_data="response_department-choice_4"))
                builder.add(InlineKeyboardButton(text="⚙️ Операции", callback_data="response_department-choice_5"))
                builder.add(InlineKeyboardButton(text="👔 Руководство", callback_data="response_department-choice_6"))
                builder.add(InlineKeyboardButton(text="📋 Другое", callback_data="response_department-choice_7"))
                keyboard = builder.as_markup()
                await message.answer(prompt_text, reply_markup=keyboard)
                
                # Настраиваем конфигурацию кнопочного ответа
                user_data[user_id]["button_response_config"] = {
                    "variable": "department",
                    "node_id": "department-choice",
                    "timeout": 60,
                    "allow_multiple": False,
                    "save_to_database": True,
                    "selected": [],
                    "success_message": "Спасибо за ваш ответ!",
                    "prompt": f"🏢 **РАЗДЕЛ 3: ОТДЕЛ/ПОДРАЗДЕЛЕНИЕ**\n\n**Выберите ваш отдел:**\n\nЕсли вашего отдела нет в списке, выберите \"Другое\"",
                    "next_node_id": "experience-level"
                }
            elif next_node_id == "department-error":
                text = f"❌ **ОШИБКА ВЫБОРА ОТДЕЛА**\n\nПожалуйста, выберите ваш отдел из предложенных вариантов."
                parse_mode = ParseMode.MARKDOWN
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="🔄 Повторить выбор", callback_data="department-choice"))
                builder.add(InlineKeyboardButton(text="⏭️ Пропустить", callback_data="experience-level"))
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "experience-level":
                prompt_text = f"⭐ **РАЗДЕЛ 4: ОПЫТ РАБОТЫ**\n\n**Укажите ваш уровень опыта:**\n\nВыберите наиболее подходящий вариант"
                
                # Создаем кнопки для выбора ответа
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="🌱 Начинающий (0-2 года)", callback_data="response_experience-level_0"))
                builder.add(InlineKeyboardButton(text="💼 Средний (2-5 лет)", callback_data="response_experience-level_1"))
                builder.add(InlineKeyboardButton(text="🎯 Старший (5-10 лет)", callback_data="response_experience-level_2"))
                builder.add(InlineKeyboardButton(text="👑 Ведущий (10+ лет)", callback_data="response_experience-level_3"))
                builder.add(InlineKeyboardButton(text="🏆 Руководитель", callback_data="response_experience-level_4"))
                keyboard = builder.as_markup()
                await message.answer(prompt_text, reply_markup=keyboard)
                
                # Настраиваем конфигурацию кнопочного ответа
                user_data[user_id]["button_response_config"] = {
                    "variable": "experience_level",
                    "node_id": "experience-level",
                    "timeout": 60,
                    "allow_multiple": False,
                    "save_to_database": True,
                    "selected": [],
                    "success_message": "Спасибо за ваш ответ!",
                    "prompt": f"⭐ **РАЗДЕЛ 4: ОПЫТ РАБОТЫ**\n\n**Укажите ваш уровень опыта:**\n\nВыберите наиболее подходящий вариант",
                    "next_node_id": "company-info"
                }
            elif next_node_id == "experience-error":
                text = f"❌ **ОШИБКА ВЫБОРА ОПЫТА**\n\nПожалуйста, выберите ваш уровень опыта из предложенных вариантов."
                parse_mode = ParseMode.MARKDOWN
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="🔄 Повторить выбор", callback_data="experience-level"))
                builder.add(InlineKeyboardButton(text="⏭️ Пропустить", callback_data="company-info"))
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "company-info":
                prompt_text = f"🏢 **РАЗДЕЛ 5: ИНФОРМАЦИЯ О КОМПАНИИ**\n\n**Укажите название вашей компании:**\n\n*Пример: ООО \"Технологические решения\" / АО \"Инновации\" / ИП Иванов И.И.*\n\n📝 Полное или сокращенное наименование"
                placeholder_text = "Название компании"
                prompt_text += f"\n\n💡 {placeholder_text}"
                await message.answer(prompt_text)
                
                # Настраиваем ожидание ввода
                user_data[user_id]["waiting_for_input"] = {
                    "type": "text",
                    "variable": "company_name",
                    "validation": "",
                    "min_length": 2,
                    "max_length": 200,
                    "timeout": 300,
                    "required": True,
                    "allow_skip": False,
                    "save_to_database": True,
                    "retry_message": "Пожалуйста, попробуйте еще раз.",
                    "success_message": "Спасибо за ваш ответ!",
                    "prompt": f"🏢 **РАЗДЕЛ 5: ИНФОРМАЦИЯ О КОМПАНИИ**\n\n**Укажите название вашей компании:**\n\n*Пример: ООО \"Технологические решения\" / АО \"Инновации\" / ИП Иванов И.И.*\n\n📝 Полное или сокращенное наименование",
                    "node_id": "company-info",
                    "next_node_id": "company-size"
                }
            elif next_node_id == "company-error":
                text = f"❌ **ОШИБКА ВВОДА КОМПАНИИ**\n\nПожалуйста, укажите корректное название компании.\n\n**Требования:**\n• Минимум 2 символа\n• Максимум 200 символов"
                parse_mode = ParseMode.MARKDOWN
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="🔄 Повторить ввод", callback_data="company-info"))
                builder.add(InlineKeyboardButton(text="⏭️ Пропустить", callback_data="company-size"))
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "company-size":
                prompt_text = f"📊 **РАЗДЕЛ 6: РАЗМЕР КОМПАНИИ**\n\n**Выберите размер вашей компании:**\n\nУкажите примерное количество сотрудников"
                
                # Создаем кнопки для выбора ответа
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="👤 Микро (1-10 человек)", callback_data="response_company-size_0"))
                builder.add(InlineKeyboardButton(text="👥 Малая (11-50 человек)", callback_data="response_company-size_1"))
                builder.add(InlineKeyboardButton(text="🏢 Средняя (51-250 человек)", callback_data="response_company-size_2"))
                builder.add(InlineKeyboardButton(text="🏬 Большая (251-1000 человек)", callback_data="response_company-size_3"))
                builder.add(InlineKeyboardButton(text="🏭 Корпорация (1000+ человек)", callback_data="response_company-size_4"))
                keyboard = builder.as_markup()
                await message.answer(prompt_text, reply_markup=keyboard)
                
                # Настраиваем конфигурацию кнопочного ответа
                user_data[user_id]["button_response_config"] = {
                    "variable": "company_size",
                    "node_id": "company-size",
                    "timeout": 60,
                    "allow_multiple": False,
                    "save_to_database": True,
                    "selected": [],
                    "success_message": "Спасибо за ваш ответ!",
                    "prompt": f"📊 **РАЗДЕЛ 6: РАЗМЕР КОМПАНИИ**\n\n**Выберите размер вашей компании:**\n\nУкажите примерное количество сотрудников",
                    "next_node_id": "project-info"
                }
            elif next_node_id == "size-error":
                text = f"❌ **ОШИБКА ВЫБОРА РАЗМЕРА**\n\nПожалуйста, выберите размер компании из предложенных вариантов."
                parse_mode = ParseMode.MARKDOWN
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="🔄 Повторить выбор", callback_data="company-size"))
                builder.add(InlineKeyboardButton(text="⏭️ Пропустить", callback_data="project-info"))
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "project-info":
                prompt_text = f"📋 **РАЗДЕЛ 7: ТЕКУЩИЕ ПРОЕКТЫ**\n\n**Опишите ваши текущие проекты:**\n\n*Пример: Разработка CRM-системы, внедрение системы аналитики, автоматизация бизнес-процессов*\n\n📝 Укажите 2-3 основных проекта"
                placeholder_text = "Описание текущих проектов..."
                prompt_text += f"\n\n💡 {placeholder_text}"
                await message.answer(prompt_text)
                
                # Настраиваем ожидание ввода
                user_data[user_id]["waiting_for_input"] = {
                    "type": "text",
                    "variable": "current_projects",
                    "validation": "",
                    "min_length": 10,
                    "max_length": 1000,
                    "timeout": 600,
                    "required": True,
                    "allow_skip": False,
                    "save_to_database": True,
                    "retry_message": "Пожалуйста, попробуйте еще раз.",
                    "success_message": "Спасибо за ваш ответ!",
                    "prompt": f"📋 **РАЗДЕЛ 7: ТЕКУЩИЕ ПРОЕКТЫ**\n\n**Опишите ваши текущие проекты:**\n\n*Пример: Разработка CRM-системы, внедрение системы аналитики, автоматизация бизнес-процессов*\n\n📝 Укажите 2-3 основных проекта",
                    "node_id": "project-info",
                    "next_node_id": "goals-objectives"
                }
            elif next_node_id == "project-error":
                text = f"❌ **ОШИБКА ВВОДА ПРОЕКТОВ**\n\nПожалуйста, опишите ваши проекты более подробно.\n\n**Требования:**\n• Минимум 10 символов\n• Максимум 1000 символов"
                parse_mode = ParseMode.MARKDOWN
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="🔄 Повторить ввод", callback_data="project-info"))
                builder.add(InlineKeyboardButton(text="⏭️ Пропустить", callback_data="goals-objectives"))
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "goals-objectives":
                prompt_text = f"🎯 **РАЗДЕЛ 8: ЦЕЛИ И ЗАДАЧИ**\n\n**Опишите ваши профессиональные цели:**\n\n*Пример: Развитие в области машинного обучения, получение сертификации, повышение до тимлида*\n\n📝 Укажите краткосрочные и долгосрочные цели"
                placeholder_text = "Профессиональные цели и задачи..."
                prompt_text += f"\n\n💡 {placeholder_text}"
                await message.answer(prompt_text)
                
                # Настраиваем ожидание ввода
                user_data[user_id]["waiting_for_input"] = {
                    "type": "text",
                    "variable": "professional_goals",
                    "validation": "",
                    "min_length": 10,
                    "max_length": 800,
                    "timeout": 600,
                    "required": True,
                    "allow_skip": False,
                    "save_to_database": True,
                    "retry_message": "Пожалуйста, попробуйте еще раз.",
                    "success_message": "Спасибо за ваш ответ!",
                    "prompt": f"🎯 **РАЗДЕЛ 8: ЦЕЛИ И ЗАДАЧИ**\n\n**Опишите ваши профессиональные цели:**\n\n*Пример: Развитие в области машинного обучения, получение сертификации, повышение до тимлида*\n\n📝 Укажите краткосрочные и долгосрочные цели",
                    "node_id": "goals-objectives",
                    "next_node_id": "contact-info"
                }
            elif next_node_id == "goals-error":
                text = f"❌ **ОШИБКА ВВОДА ЦЕЛЕЙ**\n\nПожалуйста, опишите ваши цели более подробно.\n\n**Требования:**\n• Минимум 10 символов\n• Максимум 800 символов"
                parse_mode = ParseMode.MARKDOWN
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="🔄 Повторить ввод", callback_data="goals-objectives"))
                builder.add(InlineKeyboardButton(text="⏭️ Пропустить", callback_data="contact-info"))
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "contact-info":
                prompt_text = f"📞 **РАЗДЕЛ 9: КОНТАКТНАЯ ИНФОРМАЦИЯ**\n\n**Укажите ваш рабочий email:**\n\n*Пример: ivan.ivanov@company.com*\n\n📧 Корпоративный или основной email для связи"
                placeholder_text = "email@company.com"
                prompt_text += f"\n\n💡 {placeholder_text}"
                await message.answer(prompt_text)
                
                # Настраиваем ожидание ввода
                user_data[user_id]["waiting_for_input"] = {
                    "type": "email",
                    "variable": "work_email",
                    "validation": "",
                    "min_length": 5,
                    "max_length": 150,
                    "timeout": 300,
                    "required": True,
                    "allow_skip": False,
                    "save_to_database": True,
                    "retry_message": "Пожалуйста, попробуйте еще раз.",
                    "success_message": "Спасибо за ваш ответ!",
                    "prompt": f"📞 **РАЗДЕЛ 9: КОНТАКТНАЯ ИНФОРМАЦИЯ**\n\n**Укажите ваш рабочий email:**\n\n*Пример: ivan.ivanov@company.com*\n\n📧 Корпоративный или основной email для связи",
                    "node_id": "contact-info",
                    "next_node_id": "phone-info"
                }
            elif next_node_id == "contact-error":
                text = f"❌ **ОШИБКА ВВОДА EMAIL**\n\nПожалуйста, укажите корректный email адрес.\n\n**Требования:**\n• Формат: name@domain.com\n• Минимум 5 символов\n• Максимум 150 символов"
                parse_mode = ParseMode.MARKDOWN
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="🔄 Повторить ввод", callback_data="contact-info"))
                builder.add(InlineKeyboardButton(text="⏭️ Пропустить", callback_data="phone-info"))
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "phone-info":
                prompt_text = f"📱 **РАЗДЕЛ 10: ТЕЛЕФОН**\n\n**Укажите ваш рабочий телефон:**\n\n*Пример: +7 (999) 123-45-67*\n\n📞 Рабочий или мобильный телефон для связи"
                placeholder_text = "+7 (999) 123-45-67"
                prompt_text += f"\n\n💡 {placeholder_text}"
                await message.answer(prompt_text)
                
                # Настраиваем ожидание ввода
                user_data[user_id]["waiting_for_input"] = {
                    "type": "phone",
                    "variable": "work_phone",
                    "validation": "",
                    "min_length": 10,
                    "max_length": 20,
                    "timeout": 300,
                    "required": True,
                    "allow_skip": False,
                    "save_to_database": True,
                    "retry_message": "Пожалуйста, попробуйте еще раз.",
                    "success_message": "Спасибо за ваш ответ!",
                    "prompt": f"📱 **РАЗДЕЛ 10: ТЕЛЕФОН**\n\n**Укажите ваш рабочий телефон:**\n\n*Пример: +7 (999) 123-45-67*\n\n📞 Рабочий или мобильный телефон для связи",
                    "node_id": "phone-info",
                    "next_node_id": "additional-info"
                }
            elif next_node_id == "phone-error":
                text = f"❌ **ОШИБКА ВВОДА ТЕЛЕФОНА**\n\nПожалуйста, укажите корректный номер телефона.\n\n**Требования:**\n• Формат: +7 (999) 123-45-67\n• Минимум 10 символов\n• Максимум 20 символов"
                parse_mode = ParseMode.MARKDOWN
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="🔄 Повторить ввод", callback_data="phone-info"))
                builder.add(InlineKeyboardButton(text="⏭️ Пропустить", callback_data="additional-info"))
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "additional-info":
                prompt_text = f"📝 **РАЗДЕЛ 11: ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ**\n\n**Есть ли что-то еще, что вы хотели бы добавить?**\n\n*Пример: Навыки, сертификаты, интересные проекты, предложения по улучшению*\n\n💡 Любая дополнительная информация о вас или вашей работе"
                placeholder_text = "Дополнительная информация (необязательно)..."
                prompt_text += f"\n\n💡 {placeholder_text}"
                await message.answer(prompt_text)
                
                # Настраиваем ожидание ввода
                user_data[user_id]["waiting_for_input"] = {
                    "type": "text",
                    "variable": "additional_notes",
                    "validation": "",
                    "min_length": 0,
                    "max_length": 1000,
                    "timeout": 600,
                    "required": True,
                    "allow_skip": False,
                    "save_to_database": True,
                    "retry_message": "Пожалуйста, попробуйте еще раз.",
                    "success_message": "Спасибо за ваш ответ!",
                    "prompt": f"📝 **РАЗДЕЛ 11: ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ**\n\n**Есть ли что-то еще, что вы хотели бы добавить?**\n\n*Пример: Навыки, сертификаты, интересные проекты, предложения по улучшению*\n\n💡 Любая дополнительная информация о вас или вашей работе",
                    "node_id": "additional-info",
                    "next_node_id": "final-review"
                }
            elif next_node_id == "additional-error":
                text = f"❌ **ОШИБКА ДОПОЛНИТЕЛЬНОЙ ИНФОРМАЦИИ**\n\nСлишком много текста.\n\n**Требования:**\n• Максимум 1000 символов"
                parse_mode = ParseMode.MARKDOWN
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="🔄 Повторить ввод", callback_data="additional-info"))
                builder.add(InlineKeyboardButton(text="⏭️ Пропустить", callback_data="final-review"))
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "final-review":
                text = f"🎉 **СБОР ИНФОРМАЦИИ ЗАВЕРШЕН!**\n\n✅ **Собранные данные:**\n• 👤 Персональные данные\n• 💼 Профессиональная информация\n• 🏢 Данные о компании\n• 📊 Проекты и цели\n• 📞 Контактная информация\n\n🔄 **Что делать дальше:**\n• Данные сохранены в системе\n• Вы получите подтверждение на email\n• Можете обновить данные в любое время\n\n**Спасибо за участие!**"
                parse_mode = ParseMode.MARKDOWN
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="📄 Скачать PDF", callback_data="download-info"))
                builder.add(InlineKeyboardButton(text="📧 Отправить на email", callback_data="email-confirmation"))
                builder.add(InlineKeyboardButton(text="🔄 Начать заново", callback_data="start-welcome"))
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "download-info":
                text = f"📄 **СКАЧИВАНИЕ PDF ОТЧЕТА**\n\n🔄 **Генерируем отчет...**\n\n📊 **Отчет будет содержать:**\n• Все введенные данные\n• Структурированный вид\n• Timestamp создания\n• Подпись системы\n\n⏱️ Готовность через 10-15 секунд"
                parse_mode = ParseMode.MARKDOWN
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="✅ PDF готов", callback_data="final-review"))
                builder.add(InlineKeyboardButton(text="◀️ Назад к результатам", callback_data="final-review"))
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "email-confirmation":
                text = f"📧 **ОТПРАВКА НА EMAIL**\n\n✅ **Письмо отправлено на:**\n{work_email}\n\n📬 **Содержимое письма:**\n• Полный отчет с данными\n• Ссылка для редактирования\n• Контакты для обратной связи\n\n⏱️ Проверьте почту в течение 5 минут"
                parse_mode = ParseMode.MARKDOWN
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="✅ Понятно", callback_data="final-review"))
                builder.add(InlineKeyboardButton(text="🔄 Отправить повторно", callback_data="email-confirmation"))
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
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
