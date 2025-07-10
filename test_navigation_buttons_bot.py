"""
ТЕСТ НАВИГАЦИИ В КНОПОЧНЫХ ОТВЕТАХ - Telegram Bot
Сгенерировано с помощью TelegramBot Builder

Этот бот тестирует новую функциональность навигации в кнопочных ответах:
- Inline кнопки с действиями goto, command, url
- Reply кнопки с теми же навигационными возможностями
- Множественный выбор с навигацией после завершения

Демонстрирует полную реализацию navigation actions для user-input узлов.
"""

import asyncio
import logging
import os
import sys
import datetime
import json
from typing import Dict, Any, Optional

from aiogram import Bot, Dispatcher, types, F
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import Command
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, KeyboardButton, ReplyKeyboardMarkup, ReplyKeyboardRemove
from aiogram.utils.keyboard import InlineKeyboardBuilder, ReplyKeyboardBuilder
from aiogram.fsm.storage.memory import MemoryStorage

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('bot.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

# Хранилище пользовательских данных
user_data: Dict[int, Dict[str, Any]] = {}

# Хранилище базы данных (заглушка для локального тестирования)
database_available = False

async def init_database():
    """Инициализация подключения к базе данных"""
    global database_available
    try:
        # Попытка подключения к базе данных
        import asyncpg
        database_url = os.getenv('DATABASE_URL')
        if database_url:
            conn = await asyncpg.connect(database_url)
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS bot_users (
                    user_id BIGINT PRIMARY KEY,
                    username TEXT,
                    first_name TEXT,
                    last_name TEXT,
                    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    user_data JSONB DEFAULT '{}'::jsonb
                )
            ''')
            await conn.close()
            database_available = True
            logging.info("✅ База данных инициализирована")
    except Exception as e:
        logging.warning(f"⚠️ База данных недоступна, используем локальное хранение: {e}")
        database_available = False

async def save_user_to_db(user_id: int, username: str = None, first_name: str = None, last_name: str = None):
    """Сохраняет пользователя в базу данных"""
    if not database_available:
        return False
    
    try:
        import asyncpg
        database_url = os.getenv('DATABASE_URL')
        conn = await asyncpg.connect(database_url)
        
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
        return True
    except Exception as e:
        logging.error(f"Ошибка сохранения пользователя в БД: {e}")
        return False

async def update_user_data_in_db(user_id: int, data_key: str, data_value):
    """Обновляет пользовательские данные в базе данных"""
    if not database_available:
        return False
    
    try:
        import asyncpg
        database_url = os.getenv('DATABASE_URL')
        conn = await asyncpg.connect(database_url)
        
        # Получаем текущие данные
        current_data = await conn.fetchval(
            'SELECT user_data FROM bot_users WHERE user_id = $1',
            user_id
        )
        
        if current_data is None:
            current_data = {}
        
        # Обновляем данные
        current_data[data_key] = data_value
        
        # Сохраняем обратно
        await conn.execute(
            'UPDATE bot_users SET user_data = $1, last_activity = CURRENT_TIMESTAMP WHERE user_id = $2',
            json.dumps(current_data), user_id
        )
        
        await conn.close()
        return True
    except Exception as e:
        logging.error(f"Ошибка обновления данных в БД: {e}")
        return False

async def is_admin(user_id: int) -> bool:
    """Проверяет, является ли пользователь администратором"""
    admin_ids = [123456789]  # Замените на реальные ID админов
    return user_id in admin_ids

async def is_private_chat(message: types.Message) -> bool:
    """Проверяет, является ли чат приватным"""
    return message.chat.type == 'private'

async def check_auth(user_id: int) -> bool:
    """Проверяет авторизацию пользователя"""
    return True  # Заглушка - всегда авторизован

# Инициализация бота
BOT_TOKEN = os.getenv('BOT_TOKEN')
if not BOT_TOKEN:
    logging.error("❌ BOT_TOKEN не найден в переменных окружения")
    sys.exit(1)

bot = Bot(
    token=BOT_TOKEN,
    default=DefaultBotProperties(parse_mode=ParseMode.HTML)
)

dp = Dispatcher(storage=MemoryStorage())

# Обработчики команд
@dp.message(Command("start"))
async def start_handler(message: types.Message):
    """Обработчик команды /start"""
    user_id = message.from_user.id
    
    # Сохраняем пользователя
    await save_user_to_db(user_id, message.from_user.username, message.from_user.first_name, message.from_user.last_name)
    
    if user_id not in user_data:
        user_data[user_id] = {}
    
    text = """🎯 <b>ТЕСТ НАВИГАЦИИ В КНОПОЧНЫХ ОТВЕТАХ</b>

Добро пожаловать в демонстрацию новой функциональности!

Этот бот тестирует:
✅ Inline кнопки с навигацией (goto, command, url)
✅ Reply кнопки с навигацией  
✅ Множественный выбор с финальной навигацией

Выберите тип тестирования:"""
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📱 Inline кнопки", callback_data="test_inline"))
    builder.add(InlineKeyboardButton(text="⌨️ Reply кнопки", callback_data="test_reply"))
    builder.add(InlineKeyboardButton(text="🔢 Множественный выбор", callback_data="test_multiple"))
    keyboard = builder.as_markup()
    
    await message.answer(text, reply_markup=keyboard)
    logging.info(f"Пользователь {user_id} запустил бота")

@dp.message(Command("help"))
async def help_handler(message: types.Message):
    """Обработчик команды /help"""
    text = """❓ <b>СПРАВКА ПО БОТУ</b>

<b>Доступные команды:</b>
• /start - Главное меню
• /help - Эта справка
• /menu - Быстрое меню

<b>Типы тестирования:</b>
• <i>Inline кнопки</i> - Кнопки под сообщением с навигацией
• <i>Reply кнопки</i> - Клавиатура с теми же возможностями
• <i>Множественный выбор</i> - Выбор нескольких вариантов

<b>Действия навигации:</b>
• goto - Переход к другому экрану
• command - Выполнение команды
• url - Открытие ссылки"""
    
    await message.answer(text)

@dp.message(Command("menu"))
async def menu_handler(message: types.Message):
    """Обработчик команды /menu"""
    text = "🏠 <b>ГЛАВНОЕ МЕНЮ</b>\n\nВыберите действие:"
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🎯 Начать тестирование", callback_data="start_testing"))
    builder.add(InlineKeyboardButton(text="❓ Справка", callback_data="show_help"))
    keyboard = builder.as_markup()
    
    await message.answer(text, reply_markup=keyboard)

# Callback обработчики для основной навигации
@dp.callback_query(F.data == "test_inline")
async def handle_test_inline(callback_query: types.CallbackQuery):
    """Тест inline кнопок с навигацией"""
    await callback_query.message.edit_text(
        """📱 <b>ТЕСТ INLINE КНОПОК</b>

Каждая кнопка демонстрирует разный тип навигации:
• Первая кнопка → переход к экрану
• Вторая кнопка → выполнение команды  
• Третья кнопка → открытие ссылки

Выберите действие:""",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="🎯 Перейти к помощи", callback_data="goto_help")],
            [InlineKeyboardButton(text="🏠 Выполнить /menu", callback_data="cmd_menu")],
            [InlineKeyboardButton(text="🔗 Открыть GitHub", callback_data="url_github")],
            [InlineKeyboardButton(text="⬅️ Назад", callback_data="back_to_start")]
        ])
    )

@dp.callback_query(F.data == "test_reply")
async def handle_test_reply(callback_query: types.CallbackQuery):
    """Тест reply кнопок с навигацией"""
    # Удаляем старое сообщение
    await callback_query.message.delete()
    
    text = """⌨️ <b>ТЕСТ REPLY КНОПОК</b>

Теперь выберите действие с помощью клавиатуры.
Каждая кнопка выполняет свой тип навигации:"""
    
    # Создаем reply клавиатуру
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🎯 Goto: Помощь"))
    builder.add(KeyboardButton(text="🏠 Command: Menu"))
    builder.add(KeyboardButton(text="🔗 URL: GitHub"))
    builder.add(KeyboardButton(text="⬅️ Назад в меню"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=True)
    
    await callback_query.message.answer(text, reply_markup=keyboard)
    
    # Инициализируем пользовательские данные если их нет
    if callback_query.from_user.id not in user_data:
        user_data[callback_query.from_user.id] = {}
    
    # Сохраняем настройки для обработки ответа
    user_data[callback_query.from_user.id]["button_response_config"] = {
        "node_id": "test_reply_node",
        "variable": "reply_choice",
        "save_to_database": True,
        "success_message": "Выбор обработан!",
        "allow_multiple": False,
        "next_node_id": "",
        "options": [
            {"index": 0, "text": "🎯 Goto: Помощь", "value": "goto_help", "action": "goto", "target": "help_screen", "url": ""},
            {"index": 1, "text": "🏠 Command: Menu", "value": "cmd_menu", "action": "command", "target": "/menu", "url": ""},
            {"index": 2, "text": "🔗 URL: GitHub", "value": "url_github", "action": "url", "target": "", "url": "https://github.com/"},
            {"index": 3, "text": "⬅️ Назад в меню", "value": "back_start", "action": "command", "target": "/start", "url": ""},
        ],
        "selected": []
    }

@dp.callback_query(F.data == "test_multiple")
async def handle_test_multiple(callback_query: types.CallbackQuery):
    """Тест множественного выбора"""
    await callback_query.message.edit_text(
        """🔢 <b>ТЕСТ МНОЖЕСТВЕННОГО ВЫБОРА</b>

Выберите несколько технологий (можно выбрать несколько):""",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="🐍 Python", callback_data="response_multiple_0")],
            [InlineKeyboardButton(text="⚛️ React", callback_data="response_multiple_1")],  
            [InlineKeyboardButton(text="🟢 Node.js", callback_data="response_multiple_2")],
            [InlineKeyboardButton(text="🗄️ PostgreSQL", callback_data="response_multiple_3")],
            [InlineKeyboardButton(text="✅ Готово", callback_data="response_multiple_done")]
        ])
    )
    
    # Инициализируем пользовательские данные если их нет
    if callback_query.from_user.id not in user_data:
        user_data[callback_query.from_user.id] = {}
    
    # Сохраняем настройки для обработки ответа
    user_data[callback_query.from_user.id]["button_response_config"] = {
        "node_id": "multiple_choice_node",
        "variable": "selected_technologies",
        "save_to_database": True,
        "success_message": "Спасибо за выбор технологий!",
        "allow_multiple": True,
        "next_node_id": "",
        "options": [
            {"index": 0, "text": "🐍 Python", "value": "python", "action": "goto", "target": "", "url": ""},
            {"index": 1, "text": "⚛️ React", "value": "react", "action": "goto", "target": "", "url": ""},
            {"index": 2, "text": "🟢 Node.js", "value": "nodejs", "action": "goto", "target": "", "url": ""},
            {"index": 3, "text": "🗄️ PostgreSQL", "value": "postgresql", "action": "goto", "target": "", "url": ""},
        ],
        "selected": []
    }

# Обработчики навигационных действий
@dp.callback_query(F.data == "goto_help")
async def handle_goto_help(callback_query: types.CallbackQuery):
    """Демонстрация goto навигации"""
    await callback_query.message.edit_text(
        """❓ <b>ЭКРАН ПОМОЩИ</b>

Вы успешно перешли на экран помощи через <b>goto</b> навигацию!

Это демонстрирует, как кнопки могут переводить пользователя на другие экраны бота.""",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="⬅️ Назад к тестам", callback_data="back_to_start")]
        ])
    )

@dp.callback_query(F.data == "cmd_menu")
async def handle_cmd_menu(callback_query: types.CallbackQuery):
    """Демонстрация command навигации"""
    # Создаем фиктивное сообщение для выполнения команды
    import types as aiogram_types
    fake_message = aiogram_types.SimpleNamespace(
        from_user=callback_query.from_user,
        chat=callback_query.message.chat,
        text="/menu",
        message_id=callback_query.message.message_id,
        answer=callback_query.message.answer
    )
    
    await menu_handler(fake_message)
    await callback_query.answer("✅ Команда /menu выполнена!")

@dp.callback_query(F.data == "url_github") 
async def handle_url_github(callback_query: types.CallbackQuery):
    """Демонстрация URL навигации"""
    url = "https://github.com/"
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔗 Открыть GitHub", url=url)],
        [InlineKeyboardButton(text="⬅️ Назад к тестам", callback_data="back_to_start")]
    ])
    await callback_query.message.edit_text(
        "🔗 <b>ОТКРЫТИЕ ССЫЛКИ</b>\n\nНажмите кнопку ниже, чтобы открыть ссылку:",
        reply_markup=keyboard
    )

@dp.callback_query(F.data == "back_to_start")
async def handle_back_to_start(callback_query: types.CallbackQuery):
    """Возврат к начальному экрану"""
    fake_message = types.Message(
        message_id=callback_query.message.message_id,
        from_user=callback_query.from_user,
        date=callback_query.message.date,
        chat=callback_query.message.chat,
        content_type="text",
        options={}
    )
    fake_message.answer = callback_query.message.edit_text
    await start_handler(fake_message)

# Обработчики кнопочных ответов для множественного выбора
@dp.callback_query(F.data == "response_multiple_0")
async def handle_response_multiple_0(callback_query: types.CallbackQuery):
    """Выбор Python"""
    await handle_multiple_choice_response(callback_query, 0, "python", "🐍 Python")

@dp.callback_query(F.data == "response_multiple_1")
async def handle_response_multiple_1(callback_query: types.CallbackQuery):
    """Выбор React"""
    await handle_multiple_choice_response(callback_query, 1, "react", "⚛️ React")

@dp.callback_query(F.data == "response_multiple_2") 
async def handle_response_multiple_2(callback_query: types.CallbackQuery):
    """Выбор Node.js"""
    await handle_multiple_choice_response(callback_query, 2, "nodejs", "🟢 Node.js")

@dp.callback_query(F.data == "response_multiple_3")
async def handle_response_multiple_3(callback_query: types.CallbackQuery):
    """Выбор PostgreSQL"""
    await handle_multiple_choice_response(callback_query, 3, "postgresql", "🗄️ PostgreSQL")

@dp.callback_query(F.data == "response_multiple_done")
async def handle_response_multiple_done(callback_query: types.CallbackQuery):
    """Завершение множественного выбора"""
    user_id = callback_query.from_user.id
    
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    
    if len(config["selected"]) > 0:
        # Сохраняем все выбранные элементы
        variable_name = config.get("variable", "user_response")
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
        
        # Показываем финальное меню после успешного выбора
        await asyncio.sleep(2)
        fake_message = types.Message(
            message_id=callback_query.message.message_id,
            from_user=callback_query.from_user,
            date=callback_query.message.date,
            chat=callback_query.message.chat,
            content_type="text",
            options={}
        )
        fake_message.answer = callback_query.message.edit_text
        await start_handler(fake_message)
        
    else:
        # Если ничего не выбрано, показываем предупреждение
        await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)

async def handle_multiple_choice_response(callback_query: types.CallbackQuery, index: int, value: str, text: str):
    """Обработка выбора в множественном выборе"""
    user_id = callback_query.from_user.id
    
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        await callback_query.answer("⚠️ Сессия истекла", show_alert=True)
        return
    
    config = user_data[user_id]["button_response_config"]
    
    # Проверяем, выбран ли уже этот элемент
    already_selected = any(item["value"] == value for item in config["selected"])
    
    if already_selected:
        # Убираем из выбранных
        config["selected"] = [item for item in config["selected"] if item["value"] != value]
        await callback_query.answer(f"❌ Убрано: {text}")
    else:
        # Добавляем к выбранным
        config["selected"].append({"text": text, "value": value})
        await callback_query.answer(f"✅ Выбрано: {text}")

# Универсальный обработчик пользовательского ввода для reply кнопок
@dp.message(F.text)
async def handle_user_input(message: types.Message):
    """Универсальный обработчик пользовательского ввода"""
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
                    message_id=message.message_id,
                    answer=message.answer
                )
                
                if command == "/start":
                    try:
                        await start_handler(fake_message)
                    except Exception as e:
                        logging.error(f"Ошибка выполнения команды /start: {e}")
                elif command == "/menu":
                    try:
                        await menu_handler(fake_message)
                    except Exception as e:
                        logging.error(f"Ошибка выполнения команды /menu: {e}")
                elif command == "/help":
                    try:
                        await help_handler(fake_message)
                    except Exception as e:
                        logging.error(f"Ошибка выполнения команды /help: {e}")
                else:
                    logging.warning(f"Неизвестная команда: {command}")
            elif option_action == "goto" and option_target:
                # Переход к узлу
                target_node_id = option_target
                if target_node_id == "help_screen":
                    # Показываем экран помощи
                    await message.answer(
                        """❓ <b>ЭКРАН ПОМОЩИ</b>

Вы успешно перешли на экран помощи через <b>goto</b> навигацию из reply кнопки!

Это демонстрирует, как reply кнопки могут переводить пользователя на другие экраны бота."""
                    )
                else:
                    logging.warning(f"Неизвестный целевой узел: {target_node_id}")
            
            return
        else:
            # Неверный выбор - показываем доступные варианты
            available_options = [option["text"] for option in config.get("options", [])]
            options_text = "\n".join([f"• {opt}" for opt in available_options])
            await message.answer(f"❌ Неверный выбор. Пожалуйста, выберите один из предложенных вариантов:\n\n{options_text}")
            return
    
    # Если это не кнопочный ответ, игнорируем
    return

async def main():
    """Главная функция запуска бота"""
    try:
        logging.info("🚀 Запускаем тестовый бот навигации в кнопочных ответах...")
        
        # Инициализируем базу данных
        await init_database()
        
        # Запускаем бота
        await dp.start_polling(bot)
        
    except KeyboardInterrupt:
        logging.info("👋 Бот остановлен пользователем")
    except Exception as e:
        logging.error(f"❌ Критическая ошибка: {e}")
    finally:
        await bot.session.close()

if __name__ == "__main__":
    asyncio.run(main())