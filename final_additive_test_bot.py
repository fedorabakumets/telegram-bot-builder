"""
🎯 Финальный тест аддитивной логики сбора ввода
Демонстрирует: обычные кнопки + дополнительный сбор ответов
"""

import os
import sys
import asyncio
import logging
from aiogram import Bot, Dispatcher, types, F
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.utils.keyboard import InlineKeyboardBuilder, ReplyKeyboardBuilder
from aiogram.types import InlineKeyboardButton, KeyboardButton, ReplyKeyboardRemove
import asyncpg
import datetime
import json

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Инициализация бота (заглушка токена)
bot = Bot(token="YOUR_BOT_TOKEN", default=DefaultBotProperties(parse_mode=ParseMode.HTML))
dp = Dispatcher()

# Локальное хранилище пользовательских данных
user_data = {}

# База данных (заглушка)
async def init_database():
    pass

async def update_user_data_in_db(user_id: int, variable: str, data):
    return True

# Основные обработчики
@dp.message(lambda message: message.text and message.text.lower() == "/start")
async def start_handler(message: types.Message):
    text = """🎯 <b>Финальный тест аддитивной логики</b>

Привет! Это демонстрация новой системы:

🔹 <b>Кнопки работают как обычно</b> - навигация не нарушена
🔹 <b>Дополнительно сохраняются ваши ответы</b> - включен сбор данных
🔹 <b>Никакого дублирования</b> - одна клавиатура, две функции

Попробуйте нажать кнопки или написать что-то своё!"""
    
    # Создаем inline клавиатуру (+ дополнительный сбор ответов включен)
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📊 Меню", callback_data="menu"))
    builder.add(InlineKeyboardButton(text="ℹ️ Информация", callback_data="info"))
    
    keyboard = builder.as_markup()
    await message.answer(text, reply_markup=keyboard)
    
    # Дополнительно: настраиваем сбор пользовательских ответов
    user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
    user_data[message.from_user.id]["input_collection_enabled"] = True
    user_data[message.from_user.id]["input_node_id"] = "start-1"
    user_data[message.from_user.id]["input_variable"] = "start_response"

@dp.callback_query(F.data == "menu")
async def handle_callback_menu(callback_query: types.CallbackQuery):
    text = """📋 <b>Главное меню</b>
    
Выберите раздел или напишите комментарий - всё сохранится!

<i>Это reply клавиатура с дополнительным сбором ответов</i>"""
    
    # Создаем reply клавиатуру (+ дополнительный сбор ответов включен)
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🎮 Игры"))
    builder.add(KeyboardButton(text="⚙️ Настройки"))
    builder.add(KeyboardButton(text="🏠 Главная"))
    
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    
    # Удаляем предыдущее сообщение и отправляем новое
    try:
        await callback_query.message.delete()
    except:
        pass
        
    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)
    
    # Дополнительно: настраиваем сбор пользовательских ответов
    user_data[callback_query.from_user.id] = user_data.get(callback_query.from_user.id, {})
    user_data[callback_query.from_user.id]["input_collection_enabled"] = True
    user_data[callback_query.from_user.id]["input_node_id"] = "menu-1"
    user_data[callback_query.from_user.id]["input_variable"] = "menu_response"

@dp.callback_query(F.data == "info")
async def handle_callback_info(callback_query: types.CallbackQuery):
    text = """ℹ️ <b>Информация о новой логике</b>
    
<b>Что изменилось:</b>
✅ Кнопки продолжают работать для навигации
✅ Дополнительно включен автоматический сбор ответов
✅ Любой текст пользователя сохраняется в базу данных
✅ Никакого дублирования клавиатур

<b>Как это работает:</b>
• Нажимаете кнопку → переходите к следующему экрану + ответ сохраняется
• Пишете текст → сообщение сохраняется как дополнительный комментарий
• Всё работает одновременно без конфликтов

<i>Это и есть аддитивная логика!</i>"""

    await callback_query.message.edit_text(text)

# Обработчики reply кнопок с дополнительным сбором ответов
@dp.message(lambda message: message.text == "🎮 Игры")
async def handle_reply_games(message: types.Message):
    text = """🎮 <b>Раздел игр</b>
    
Здесь будут игры. Попробуйте написать своё мнение об играх!

<i>Ваше сообщение будет сохранено + навигация работает</i>"""
    
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🎯 Квиз"))
    builder.add(KeyboardButton(text="🎲 Кубики"))
    builder.add(KeyboardButton(text="🔙 Назад"))
    
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    await message.answer(text, reply_markup=keyboard)
    
    # Сохраняем нажатие reply кнопки если включен сбор ответов
    user_id = message.from_user.id
    if user_id in user_data and user_data[user_id].get("input_collection_enabled"):
        timestamp = datetime.datetime.now().isoformat()
        input_node_id = user_data[user_id].get("input_node_id")
        input_variable = user_data[user_id].get("input_variable", "button_response")
        
        response_data = {
            "value": "🎮 Игры",
            "type": "reply_button",
            "timestamp": timestamp,
            "nodeId": input_node_id,
            "variable": input_variable,
            "source": "reply_button_click"
        }
        
        user_data[user_id][f"{input_variable}_button"] = response_data
        logging.info(f"Reply кнопка сохранена: {input_variable}_button = 🎮 Игры (пользователь {user_id})")
    
    # Дополнительно: настраиваем сбор пользовательских ответов для нового экрана
    user_data[message.from_user.id]["input_collection_enabled"] = True
    user_data[message.from_user.id]["input_node_id"] = "games-1"
    user_data[message.from_user.id]["input_variable"] = "games_response"

@dp.message(lambda message: message.text == "⚙️ Настройки")
async def handle_reply_settings(message: types.Message):
    text = """⚙️ <b>Настройки</b>
    
Здесь настройки бота. Напишите, что хотели бы изменить!

<i>Ваши предложения сохраняются автоматически</i>"""
    
    await message.answer(text, reply_markup=ReplyKeyboardRemove())
    
    # Сохраняем нажатие reply кнопки если включен сбор ответов
    user_id = message.from_user.id
    if user_id in user_data and user_data[user_id].get("input_collection_enabled"):
        timestamp = datetime.datetime.now().isoformat()
        input_node_id = user_data[user_id].get("input_node_id")
        input_variable = user_data[user_id].get("input_variable", "button_response")
        
        response_data = {
            "value": "⚙️ Настройки",
            "type": "reply_button",
            "timestamp": timestamp,
            "nodeId": input_node_id,
            "variable": input_variable,
            "source": "reply_button_click"
        }
        
        user_data[user_id][f"{input_variable}_button"] = response_data
        logging.info(f"Reply кнопка сохранена: {input_variable}_button = ⚙️ Настройки (пользователь {user_id})")

@dp.message(lambda message: message.text == "🏠 Главная")
async def handle_reply_home(message: types.Message):
    text = """🏠 <b>Возвращение на главную</b>
    
Перезапускаем стартовую команду..."""
    
    await message.answer(text, reply_markup=ReplyKeyboardRemove())
    
    # Сохраняем нажатие reply кнопки если включен сбор ответов
    user_id = message.from_user.id
    if user_id in user_data and user_data[user_id].get("input_collection_enabled"):
        timestamp = datetime.datetime.now().isoformat()
        input_node_id = user_data[user_id].get("input_node_id")
        input_variable = user_data[user_id].get("input_variable", "button_response")
        
        response_data = {
            "value": "🏠 Главная",
            "type": "reply_button",
            "timestamp": timestamp,
            "nodeId": input_node_id,
            "variable": input_variable,
            "source": "reply_button_click"
        }
        
        user_data[user_id][f"{input_variable}_button"] = response_data
        logging.info(f"Reply кнопка сохранена: {input_variable}_button = 🏠 Главная (пользователь {user_id})")
    
    # Возвращаемся к началу
    await start_handler(message)

# Обработчик для команды статистики (демонстрация сохраненных данных)
@dp.message(lambda message: message.text and message.text.lower() == "/stats")
async def stats_handler(message: types.Message):
    user_id = message.from_user.id
    
    if user_id not in user_data:
        await message.answer("📊 Пока нет сохраненных данных. Попробуйте поначать кнопки или написать сообщения!")
        return
    
    stats_text = "📊 <b>Ваша статистика:</b>\n\n"
    
    # Показываем все сохраненные данные
    for key, value in user_data[user_id].items():
        if key not in ["input_collection_enabled", "input_node_id", "input_variable"]:
            if isinstance(value, dict):
                stats_text += f"🔹 <b>{key}:</b> {value.get('value', 'N/A')} ({value.get('type', 'unknown')})\n"
            else:
                stats_text += f"🔹 <b>{key}:</b> {value}\n"
    
    if len(stats_text) <= 50:  # Если данных мало
        stats_text += "\n<i>Попробуйте нажать кнопки или написать сообщения для сбора данных!</i>"
    
    await message.answer(stats_text)

# Универсальный обработчик пользовательского ввода с новой аддитивной логикой
@dp.message(F.text)
async def handle_user_input(message: types.Message):
    user_id = message.from_user.id
    
    # Игнорируем команды
    if message.text.startswith('/'):
        return
    
    # НОВАЯ ЛОГИКА: Проверяем, включен ли дополнительный сбор ответов для обычных кнопок
    if user_id in user_data and user_data[user_id].get("input_collection_enabled"):
        input_node_id = user_data[user_id].get("input_node_id")
        input_variable = user_data[user_id].get("input_variable", "button_response")
        user_text = message.text
        
        # Сохраняем любой текст как дополнительный ответ
        timestamp = datetime.datetime.now().isoformat()
        
        response_data = {
            "value": user_text,
            "type": "text_addition", 
            "timestamp": timestamp,
            "nodeId": input_node_id,
            "variable": input_variable,
            "source": "additional_text_input"
        }
        
        # Сохраняем в пользовательские данные
        user_data[user_id][f"{input_variable}_additional"] = response_data
        
        # Уведомляем пользователя
        await message.answer("✅ <b>Дополнительный комментарий сохранен!</b>\n\n<i>Продолжайте использовать кнопки для навигации или пишите ещё комментарии.</i>")
        
        logging.info(f"Дополнительный текстовый ввод: {input_variable}_additional = {user_text} (пользователь {user_id})")
        return
    
    # Если нет активного ожидания ввода, игнорируем сообщение
    await message.answer("🤔 Я пока не жду ваших сообщений. Нажмите /start для начала!")
    return

async def main():
    logging.info("🚀 Запуск финального теста аддитивной логики сбора ввода...")
    logging.info("📋 Доступные команды:")
    logging.info("   /start - начать тест")
    logging.info("   /stats - показать сохраненные данные")
    logging.info("✨ Особенности: кнопки работают + ответы сохраняются")
    
    # В реальном боте тут был бы dp.start_polling(bot)
    print("🔧 Для запуска нужен реальный токен бота!")
    print("💡 Замените YOUR_BOT_TOKEN на настоящий токен")

if __name__ == "__main__":
    asyncio.run(main())