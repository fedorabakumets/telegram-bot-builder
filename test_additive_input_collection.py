"""
Тестовый бот для проверки новой логики сбора ввода
Режим: Аддитивный (галочка добавляет функциональность)
"""

import os
import sys
import asyncio
import logging
from aiogram import Bot, Dispatcher, types, F
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.utils.keyboard import InlineKeyboardBuilder, ReplyKeyboardBuilder
from aiogram.types import InlineKeyboardButton, KeyboardButton, ReplyKeyboardRemove, InlineKeyboardMarkup
import asyncpg
import datetime
import json

# Настройка логирования
logging.basicConfig(level=logging.INFO)

# Инициализация бота
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
    text = """🎯 Тест аддитивного сбора ввода

Это тест новой логики, где галочка "Сбор ответа" НЕ блокирует обычные кнопки, а добавляет дополнительную функциональность."""
    
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
    text = """📋 Главное меню
    
Выберите раздел или напишите что-то своё - я сохраню ваш ответ!"""
    
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
    text = """ℹ️ Информация о боте
    
Этот бот демонстрирует новую логику:
✅ Обычные кнопки работают как раньше
✅ Галочка добавляет сбор дополнительных ответов
✅ Никакого дублирования или блокировки!"""

    await callback_query.message.edit_text(text)

# Обработчики reply кнопок
@dp.message(lambda message: message.text == "🎮 Игры")
async def handle_reply_games(message: types.Message):
    text = """🎮 Игры
    
Раздел с играми. Напишите что-нибудь - это тоже сохранится!"""
    
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🎯 Квиз"))
    builder.add(KeyboardButton(text="🎲 Кубики"))
    builder.add(KeyboardButton(text="🔙 Назад"))
    
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    await message.answer(text, reply_markup=keyboard)
    
    # Дополнительно: настраиваем сбор пользовательских ответов
    user_data[message.from_user.id] = user_data.get(message.from_user.id, {})
    user_data[message.from_user.id]["input_collection_enabled"] = True
    user_data[message.from_user.id]["input_node_id"] = "games-1"
    user_data[message.from_user.id]["input_variable"] = "games_response"

@dp.message(lambda message: message.text == "⚙️ Настройки")
async def handle_reply_settings(message: types.Message):
    text = """⚙️ Настройки
    
Здесь будут настройки. Любой ваш текст сохраняется автоматически!"""
    
    await message.answer(text, reply_markup=ReplyKeyboardRemove())

@dp.message(lambda message: message.text == "🏠 Главная")
async def handle_reply_home(message: types.Message):
    text = """🏠 Возвращение на главную
    
Перезапускаем стартовую команду..."""
    
    await message.answer(text, reply_markup=ReplyKeyboardRemove())
    await start_handler(message)

# Универсальный обработчик пользовательского ввода
@dp.message(F.text)
async def handle_user_input(message: types.Message):
    user_id = message.from_user.id
    
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
        await message.answer("✅ Дополнительный комментарий сохранен!")
        
        logging.info(f"Дополнительный текстовый ввод: {input_variable}_additional = {user_text} (пользователь {user_id})")
        return
    
    # Если нет активного ожидания ввода, игнорируем сообщение
    return

async def main():
    logging.info("Запуск тестового бота для аддитивного сбора ввода...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())