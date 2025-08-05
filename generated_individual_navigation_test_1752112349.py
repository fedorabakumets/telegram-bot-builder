"""
Тест индивидуальной навигации кнопок - Telegram Bot
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

    text = f"Добро пожаловать! Выберите тип действия:"
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="Начать опрос", callback_data="survey-1"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

@dp.message(Command("music"))
async def music_handler(message: types.Message):
    logging.info(f"Команда /music вызвана пользователем {message.from_user.id}")
    # Сохраняем пользователя и статистику использования команд
    user_id = message.from_user.id
    username = message.from_user.username
    first_name = message.from_user.first_name
    last_name = message.from_user.last_name
    
    # Сохраняем пользователя в базу данных
    saved_to_db = await save_user_to_db(user_id, username, first_name, last_name)
    
    # Обновляем статистику команд в БД
    if saved_to_db:
        await update_user_data_in_db(user_id, "command_music", datetime.now().isoformat())
    
    # Резервное сохранение в локальное хранилище
    if user_id not in user_data:
        user_data[user_id] = {}
    if "commands_used" not in user_data[user_id]:
        user_data[user_id]["commands_used"] = {}
    user_data[user_id]["commands_used"]["/music"] = user_data[user_id]["commands_used"].get("/music", 0) + 1

    text = f"🎵 Музыка - язык души! Какой жанр предпочитаете?"
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🎸 Рок", callback_data="start-1"))
    builder.add(InlineKeyboardButton(text="🎤 Поп", callback_data="start-1"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "survey-1")
async def handle_callback_survey_1(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Удаляем старое сообщение
    await callback_query.message.delete()
    
    text = f"Что вас интересует?"
    
    # Создаем кнопки для выбора ответа
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📱 Технологии", callback_data="response_survey-1_0"))
    builder.add(InlineKeyboardButton(text="🎵 Музыка", callback_data="response_survey-1_1"))
    builder.add(InlineKeyboardButton(text="🌐 Сайт", callback_data="response_survey-1_2"))
    builder.add(InlineKeyboardButton(text="🔄 Главное меню", callback_data="response_survey-1_3"))
    keyboard = builder.as_markup()
    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)
    
    # Инициализируем пользовательские данные если их нет
    if callback_query.from_user.id not in user_data:
        user_data[callback_query.from_user.id] = {}
    
    # Сохраняем настройки для обработки ответа
    user_data[callback_query.from_user.id]["button_response_config"] = {
        "node_id": "survey-1",
        "variable": "user_interest",
        "save_to_database": True,
        "success_message": "Спасибо за ваш ответ!",
        "allow_multiple": False,
        "next_node_id": "tech-info",
        "options": [
            {"index": 0, "text": "📱 Технологии", "value": "tech", "action": "goto", "target": "tech-info", "url": ""},
            {"index": 1, "text": "🎵 Музыка", "value": "music", "action": "command", "target": "/music", "url": ""},
            {"index": 2, "text": "🌐 Сайт", "value": "website", "action": "url", "target": "", "url": "https://example.com"},
            {"index": 3, "text": "🔄 Главное меню", "value": "menu", "action": "goto", "target": "start-1", "url": ""},
        ],
        "selected": []
    }

@dp.callback_query(lambda c: c.data == "start-1")
async def handle_callback_start_1(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "Добро пожаловать! Выберите тип действия:"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="Начать опрос", callback_data="survey-1"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

# Обработчики кнопочных ответов для сбора пользовательского ввода

@dp.callback_query(F.data == "response_survey-1_0")
async def handle_response_survey_1_0(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "tech"
    selected_text = "📱 Технологии"
    
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
                        if next_node_id == "start-1":
                            await handle_callback_start_1(callback_query)
                        elif next_node_id == "survey-1":
                            await handle_callback_survey_1(callback_query)
                        elif next_node_id == "tech-info":
                            await handle_callback_tech_info(callback_query)
                        elif next_node_id == "music-cmd":
                            await handle_callback_music_cmd(callback_query)
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
    
    # Навигация на основе индивидуальных настроек кнопки
    # Находим настройки для этого конкретного варианта ответа
    options = config.get("options", [])
    current_option = None
    for option in options:
        if option.get("callback_data") == "response_survey-1_0":
            current_option = option
            break
    
    if current_option:
        option_action = current_option.get("action", "goto")
        option_target = current_option.get("target", "")
        option_url = current_option.get("url", "")
        
        if option_action == "url" and option_url:
            # Открываем ссылку
            from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup
            keyboard = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="🔗 Открыть ссылку", url=option_url)]
            ])
            await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}", reply_markup=keyboard)
        elif option_action == "command" and option_target:
            # Выполняем команду
            command = option_target
            if not command.startswith("/"):
                command = "/" + command
            
            # Создаем фиктивное сообщение для выполнения команды
            import aiogram.types as aiogram_types
            fake_message = aiogram_types.SimpleNamespace(
                from_user=callback_query.from_user,
                chat=callback_query.message.chat,
                text=command,
                message_id=callback_query.message.message_id
            )
            
            if command == "/start":
                try:
                    await start_handler(fake_message)
                except Exception as e:
                    logging.error(f"Ошибка выполнения команды /start: {e}")
            elif command == "/music":
                try:
                    await _music_handler(fake_message)
                except Exception as e:
                    logging.error(f"Ошибка выполнения команды /music: {e}")
            else:
                logging.warning(f"Неизвестная команда: {command}")
        elif option_action == "goto" and option_target:
            # Переход к узлу
            target_node_id = option_target
            try:
                # Вызываем обработчик для целевого узла
                if target_node_id == "start-1":
                    await handle_callback_start_1(callback_query)
                elif target_node_id == "survey-1":
                    await handle_callback_survey_1(callback_query)
                elif target_node_id == "tech-info":
                    await handle_callback_tech_info(callback_query)
                elif target_node_id == "music-cmd":
                    await handle_callback_music_cmd(callback_query)
                else:
                    logging.warning(f"Неизвестный целевой узел: {target_node_id}")
            except Exception as e:
                logging.error(f"Ошибка при переходе к узлу {target_node_id}: {e}")
    else:
        # Fallback к старой системе next_node_id если нет настроек кнопки
        next_node_id = config.get("next_node_id")
        if next_node_id:
            try:
                # Вызываем обработчик для следующего узла
                if next_node_id == "start-1":
                    await handle_callback_start_1(callback_query)
                elif next_node_id == "survey-1":
                    await handle_callback_survey_1(callback_query)
                elif next_node_id == "tech-info":
                    await handle_callback_tech_info(callback_query)
                elif next_node_id == "music-cmd":
                    await handle_callback_music_cmd(callback_query)
                else:
                    logging.warning(f"Неизвестный следующий узел: {next_node_id}")
            except Exception as e:
                logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_survey-1_1")
async def handle_response_survey_1_1(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "music"
    selected_text = "🎵 Музыка"
    
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
                        if next_node_id == "start-1":
                            await handle_callback_start_1(callback_query)
                        elif next_node_id == "survey-1":
                            await handle_callback_survey_1(callback_query)
                        elif next_node_id == "tech-info":
                            await handle_callback_tech_info(callback_query)
                        elif next_node_id == "music-cmd":
                            await handle_callback_music_cmd(callback_query)
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
    
    # Навигация на основе индивидуальных настроек кнопки
    # Находим настройки для этого конкретного варианта ответа
    options = config.get("options", [])
    current_option = None
    for option in options:
        if option.get("callback_data") == "response_survey-1_1":
            current_option = option
            break
    
    if current_option:
        option_action = current_option.get("action", "goto")
        option_target = current_option.get("target", "")
        option_url = current_option.get("url", "")
        
        if option_action == "url" and option_url:
            # Открываем ссылку
            from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup
            keyboard = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="🔗 Открыть ссылку", url=option_url)]
            ])
            await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}", reply_markup=keyboard)
        elif option_action == "command" and option_target:
            # Выполняем команду
            command = option_target
            if not command.startswith("/"):
                command = "/" + command
            
            # Создаем фиктивное сообщение для выполнения команды
            import aiogram.types as aiogram_types
            fake_message = aiogram_types.SimpleNamespace(
                from_user=callback_query.from_user,
                chat=callback_query.message.chat,
                text=command,
                message_id=callback_query.message.message_id
            )
            
            if command == "/start":
                try:
                    await start_handler(fake_message)
                except Exception as e:
                    logging.error(f"Ошибка выполнения команды /start: {e}")
            elif command == "/music":
                try:
                    await _music_handler(fake_message)
                except Exception as e:
                    logging.error(f"Ошибка выполнения команды /music: {e}")
            else:
                logging.warning(f"Неизвестная команда: {command}")
        elif option_action == "goto" and option_target:
            # Переход к узлу
            target_node_id = option_target
            try:
                # Вызываем обработчик для целевого узла
                if target_node_id == "start-1":
                    await handle_callback_start_1(callback_query)
                elif target_node_id == "survey-1":
                    await handle_callback_survey_1(callback_query)
                elif target_node_id == "tech-info":
                    await handle_callback_tech_info(callback_query)
                elif target_node_id == "music-cmd":
                    await handle_callback_music_cmd(callback_query)
                else:
                    logging.warning(f"Неизвестный целевой узел: {target_node_id}")
            except Exception as e:
                logging.error(f"Ошибка при переходе к узлу {target_node_id}: {e}")
    else:
        # Fallback к старой системе next_node_id если нет настроек кнопки
        next_node_id = config.get("next_node_id")
        if next_node_id:
            try:
                # Вызываем обработчик для следующего узла
                if next_node_id == "start-1":
                    await handle_callback_start_1(callback_query)
                elif next_node_id == "survey-1":
                    await handle_callback_survey_1(callback_query)
                elif next_node_id == "tech-info":
                    await handle_callback_tech_info(callback_query)
                elif next_node_id == "music-cmd":
                    await handle_callback_music_cmd(callback_query)
                else:
                    logging.warning(f"Неизвестный следующий узел: {next_node_id}")
            except Exception as e:
                logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_survey-1_2")
async def handle_response_survey_1_2(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "website"
    selected_text = "🌐 Сайт"
    
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
                        if next_node_id == "start-1":
                            await handle_callback_start_1(callback_query)
                        elif next_node_id == "survey-1":
                            await handle_callback_survey_1(callback_query)
                        elif next_node_id == "tech-info":
                            await handle_callback_tech_info(callback_query)
                        elif next_node_id == "music-cmd":
                            await handle_callback_music_cmd(callback_query)
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
    
    # Навигация на основе индивидуальных настроек кнопки
    # Находим настройки для этого конкретного варианта ответа
    options = config.get("options", [])
    current_option = None
    for option in options:
        if option.get("callback_data") == "response_survey-1_2":
            current_option = option
            break
    
    if current_option:
        option_action = current_option.get("action", "goto")
        option_target = current_option.get("target", "")
        option_url = current_option.get("url", "")
        
        if option_action == "url" and option_url:
            # Открываем ссылку
            from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup
            keyboard = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="🔗 Открыть ссылку", url=option_url)]
            ])
            await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}", reply_markup=keyboard)
        elif option_action == "command" and option_target:
            # Выполняем команду
            command = option_target
            if not command.startswith("/"):
                command = "/" + command
            
            # Создаем фиктивное сообщение для выполнения команды
            import aiogram.types as aiogram_types
            fake_message = aiogram_types.SimpleNamespace(
                from_user=callback_query.from_user,
                chat=callback_query.message.chat,
                text=command,
                message_id=callback_query.message.message_id
            )
            
            if command == "/start":
                try:
                    await start_handler(fake_message)
                except Exception as e:
                    logging.error(f"Ошибка выполнения команды /start: {e}")
            elif command == "/music":
                try:
                    await _music_handler(fake_message)
                except Exception as e:
                    logging.error(f"Ошибка выполнения команды /music: {e}")
            else:
                logging.warning(f"Неизвестная команда: {command}")
        elif option_action == "goto" and option_target:
            # Переход к узлу
            target_node_id = option_target
            try:
                # Вызываем обработчик для целевого узла
                if target_node_id == "start-1":
                    await handle_callback_start_1(callback_query)
                elif target_node_id == "survey-1":
                    await handle_callback_survey_1(callback_query)
                elif target_node_id == "tech-info":
                    await handle_callback_tech_info(callback_query)
                elif target_node_id == "music-cmd":
                    await handle_callback_music_cmd(callback_query)
                else:
                    logging.warning(f"Неизвестный целевой узел: {target_node_id}")
            except Exception as e:
                logging.error(f"Ошибка при переходе к узлу {target_node_id}: {e}")
    else:
        # Fallback к старой системе next_node_id если нет настроек кнопки
        next_node_id = config.get("next_node_id")
        if next_node_id:
            try:
                # Вызываем обработчик для следующего узла
                if next_node_id == "start-1":
                    await handle_callback_start_1(callback_query)
                elif next_node_id == "survey-1":
                    await handle_callback_survey_1(callback_query)
                elif next_node_id == "tech-info":
                    await handle_callback_tech_info(callback_query)
                elif next_node_id == "music-cmd":
                    await handle_callback_music_cmd(callback_query)
                else:
                    logging.warning(f"Неизвестный следующий узел: {next_node_id}")
            except Exception as e:
                logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")

@dp.callback_query(F.data == "response_survey-1_3")
async def handle_response_survey_1_3(callback_query: types.CallbackQuery):
    user_id = callback_query.from_user.id
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    selected_value = "menu"
    selected_text = "🔄 Главное меню"
    
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
                        if next_node_id == "start-1":
                            await handle_callback_start_1(callback_query)
                        elif next_node_id == "survey-1":
                            await handle_callback_survey_1(callback_query)
                        elif next_node_id == "tech-info":
                            await handle_callback_tech_info(callback_query)
                        elif next_node_id == "music-cmd":
                            await handle_callback_music_cmd(callback_query)
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
    
    # Навигация на основе индивидуальных настроек кнопки
    # Находим настройки для этого конкретного варианта ответа
    options = config.get("options", [])
    current_option = None
    for option in options:
        if option.get("callback_data") == "response_survey-1_3":
            current_option = option
            break
    
    if current_option:
        option_action = current_option.get("action", "goto")
        option_target = current_option.get("target", "")
        option_url = current_option.get("url", "")
        
        if option_action == "url" and option_url:
            # Открываем ссылку
            from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup
            keyboard = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="🔗 Открыть ссылку", url=option_url)]
            ])
            await callback_query.message.edit_text(f"{success_message}\n\n✅ Ваш выбор: {selected_text}", reply_markup=keyboard)
        elif option_action == "command" and option_target:
            # Выполняем команду
            command = option_target
            if not command.startswith("/"):
                command = "/" + command
            
            # Создаем фиктивное сообщение для выполнения команды
            import aiogram.types as aiogram_types
            fake_message = aiogram_types.SimpleNamespace(
                from_user=callback_query.from_user,
                chat=callback_query.message.chat,
                text=command,
                message_id=callback_query.message.message_id
            )
            
            if command == "/start":
                try:
                    await start_handler(fake_message)
                except Exception as e:
                    logging.error(f"Ошибка выполнения команды /start: {e}")
            elif command == "/music":
                try:
                    await _music_handler(fake_message)
                except Exception as e:
                    logging.error(f"Ошибка выполнения команды /music: {e}")
            else:
                logging.warning(f"Неизвестная команда: {command}")
        elif option_action == "goto" and option_target:
            # Переход к узлу
            target_node_id = option_target
            try:
                # Вызываем обработчик для целевого узла
                if target_node_id == "start-1":
                    await handle_callback_start_1(callback_query)
                elif target_node_id == "survey-1":
                    await handle_callback_survey_1(callback_query)
                elif target_node_id == "tech-info":
                    await handle_callback_tech_info(callback_query)
                elif target_node_id == "music-cmd":
                    await handle_callback_music_cmd(callback_query)
                else:
                    logging.warning(f"Неизвестный целевой узел: {target_node_id}")
            except Exception as e:
                logging.error(f"Ошибка при переходе к узлу {target_node_id}: {e}")
    else:
        # Fallback к старой системе next_node_id если нет настроек кнопки
        next_node_id = config.get("next_node_id")
        if next_node_id:
            try:
                # Вызываем обработчик для следующего узла
                if next_node_id == "start-1":
                    await handle_callback_start_1(callback_query)
                elif next_node_id == "survey-1":
                    await handle_callback_survey_1(callback_query)
                elif next_node_id == "tech-info":
                    await handle_callback_tech_info(callback_query)
                elif next_node_id == "music-cmd":
                    await handle_callback_music_cmd(callback_query)
                else:
                    logging.warning(f"Неизвестный следующий узел: {next_node_id}")
            except Exception as e:
                logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")


# Универсальный обработчик пользовательского ввода
@dp.message(F.text)
async def handle_user_input(message: types.Message):
    user_id = message.from_user.id
    
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
                elif command == "/music":
                    try:
                        await _music_handler(fake_message)
                    except Exception as e:
                        logging.error(f"Ошибка выполнения команды /music: {e}")
                else:
                    logging.warning(f"Неизвестная команда: {command}")
            elif option_action == "goto" and option_target:
                # Переход к узлу
                target_node_id = option_target
                try:
                    # Вызываем обработчик для целевого узла
                    if target_node_id == "start-1":
                        await handle_callback_start_1(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "survey-1":
                        await handle_callback_survey_1(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "tech-info":
                        await handle_callback_tech_info(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
                    elif target_node_id == "music-cmd":
                        await handle_callback_music_cmd(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))
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
                        if next_node_id == "start-1":
                            await handle_callback_start_1(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "survey-1":
                            await handle_callback_survey_1(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "tech-info":
                            await handle_callback_tech_info(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
                        elif next_node_id == "music-cmd":
                            await handle_callback_music_cmd(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))
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
        waiting_node_id = user_data[user_id]["waiting_for_input"]
        input_type = user_data[user_id].get("input_type", "text")
        user_text = message.text
        
        # Находим узел для получения настроек
        
        # Если узел не найден
        logging.warning(f"Узел для сбора ввода не найден: {waiting_node_id}")
        del user_data[user_id]["waiting_for_input"]
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
            if next_node_id == "start-1":
                logging.info(f"Переход к узлу start-1 типа start")
            elif next_node_id == "survey-1":
                prompt_text = f"Что вас интересует?"
                
                # Создаем кнопки для выбора ответа
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="📱 Технологии", callback_data="response_survey-1_0"))
                builder.add(InlineKeyboardButton(text="🎵 Музыка", callback_data="response_survey-1_1"))
                builder.add(InlineKeyboardButton(text="🌐 Сайт", callback_data="response_survey-1_2"))
                builder.add(InlineKeyboardButton(text="🔄 Главное меню", callback_data="response_survey-1_3"))
                keyboard = builder.as_markup()
                await message.answer(prompt_text, reply_markup=keyboard)
                
                # Настраиваем конфигурацию кнопочного ответа
                user_data[user_id]["button_response_config"] = {
                    "variable": "user_interest",
                    "node_id": "survey-1",
                    "timeout": 60,
                    "allow_multiple": False,
                    "save_to_database": True,
                    "selected": [],
                    "success_message": "Спасибо за ваш ответ!",
                    "prompt": f"Что вас интересует?",
                    "options": [
                        {
                            "text": "📱 Технологии",
                            "value": "tech",
                            "action": "goto",
                            "target": "tech-info",
                            "url": "",
                            "callback_data": "response_survey-1_0"
                        },
                        {
                            "text": "🎵 Музыка",
                            "value": "music",
                            "action": "command",
                            "target": "/music",
                            "url": "",
                            "callback_data": "response_survey-1_1"
                        },
                        {
                            "text": "🌐 Сайт",
                            "value": "website",
                            "action": "url",
                            "target": "",
                            "url": "https://example.com",
                            "callback_data": "response_survey-1_2"
                        },
                        {
                            "text": "🔄 Главное меню",
                            "value": "menu",
                            "action": "goto",
                            "target": "start-1",
                            "url": "",
                            "callback_data": "response_survey-1_3"
                        }
                    ],
                    "next_node_id": "tech-info"
                }
            elif next_node_id == "tech-info":
                text = f"🤖 Технологии - это будущее! Вы выбрали отличную тему."
                parse_mode = None
                builder = InlineKeyboardBuilder()
                builder.add(InlineKeyboardButton(text="Назад к опросу", callback_data="survey-1"))
                keyboard = builder.as_markup()
                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)
            elif next_node_id == "music-cmd":
                logging.info(f"Переход к узлу music-cmd типа command")
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
