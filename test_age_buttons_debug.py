#!/usr/bin/env python3
"""
Debug test для проверки работы age-buttons в комплексном шаблоне
"""
import asyncio
import logging
from aiogram import Bot, Dispatcher
from aiogram.types import Message, CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.enums import ParseMode
from aiogram.filters import Command
from aiogram import F

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Замените YOUR_BOT_TOKEN на токен вашего бота
BOT_TOKEN = "YOUR_BOT_TOKEN"

# Создаем бота и диспетчер
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# Хранение данных пользователей
user_data = {}

@dp.message(Command("start"))
async def start_handler(message: Message):
    """Начальный обработчик"""
    user_id = message.from_user.id
    print(f"[DEBUG] Пользователь {user_id} запустил бота")
    
    # Инициализируем данные пользователя
    if user_id not in user_data:
        user_data[user_id] = {}
    
    # Создаем кнопку для перехода к сбору имени
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📝 Начать сбор информации", callback_data="name-input"))
    keyboard = builder.as_markup()
    
    text = "🎯 **Комплексный сбор данных**\n\n<b>Добро пожаловать!</b>\n\nЭтот бот поможет собрать информацию о вас в несколько шагов.\n\nНачнем?"
    await message.answer(text, reply_markup=keyboard, parse_mode=ParseMode.HTML)

@dp.callback_query(F.data == "name-input")
async def handle_name_input(callback_query: CallbackQuery):
    """Обработчик для сбора имени"""
    user_id = callback_query.from_user.id
    print(f"[DEBUG] Пользователь {user_id} начал ввод имени")
    
    await callback_query.answer()
    await callback_query.message.delete()
    
    text = "👤 **Шаг 1: Ваше имя**\n\n<b>Как вас зовут?</b>\n\nВведите ваше имя:"
    await bot.send_message(user_id, text, parse_mode=ParseMode.HTML)
    
    # Настраиваем ожидание ввода
    user_data[user_id]["waiting_for_input"] = {
        "type": "text",
        "variable": "user_name",
        "next_node_id": "age-buttons"
    }

@dp.callback_query(F.data == "age-buttons")
async def handle_age_buttons(callback_query: CallbackQuery):
    """Обработчик для выбора возраста"""
    user_id = callback_query.from_user.id
    print(f"[DEBUG] Пользователь {user_id} перешел к выбору возраста")
    
    await callback_query.answer()
    await callback_query.message.delete()
    
    text = "🎂 **Шаг 2: Возрастная группа**\n\n<b>Выберите вашу возрастную группу:</b>\n\nИспользуйте кнопки для выбора:"
    
    # Создаем кнопки для выбора ответа
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="18-25 лет", callback_data="response_age-buttons_0"))
    builder.add(InlineKeyboardButton(text="26-35 лет", callback_data="response_age-buttons_1"))
    builder.add(InlineKeyboardButton(text="36-45 лет", callback_data="response_age-buttons_2"))
    builder.add(InlineKeyboardButton(text="46-55 лет", callback_data="response_age-buttons_3"))
    builder.add(InlineKeyboardButton(text="55+ лет", callback_data="response_age-buttons_4"))
    keyboard = builder.as_markup()
    
    await bot.send_message(user_id, text, reply_markup=keyboard, parse_mode=ParseMode.HTML)
    
    # Инициализируем пользовательские данные если их нет
    if user_id not in user_data:
        user_data[user_id] = {}
    
    # Сохраняем настройки для обработки ответа
    user_data[user_id]["button_response_config"] = {
        "node_id": "age-buttons",
        "variable": "user_age_group",
        "save_to_database": True,
        "success_message": "Спасибо за выбор!",
        "allow_multiple": False,
        "next_node_id": "interests-multiple",
        "options": [
            {"index": 0, "text": "18-25 лет", "value": "18-25"},
            {"index": 1, "text": "26-35 лет", "value": "26-35"},
            {"index": 2, "text": "36-45 лет", "value": "36-45"},
            {"index": 3, "text": "46-55 лет", "value": "46-55"},
            {"index": 4, "text": "55+ лет", "value": "55+"},
        ],
        "selected": []
    }
    
    print(f"[DEBUG] Настройки button_response_config установлены для пользователя {user_id}")

@dp.callback_query(F.data == "response_age-buttons_0")
async def handle_response_age_buttons_0(callback_query: CallbackQuery):
    """Обработчик ответа: 18-25 лет"""
    user_id = callback_query.from_user.id
    print(f"[DEBUG] Пользователь {user_id} выбрал возраст 18-25 лет")
    
    await callback_query.answer()
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        print(f"[ERROR] Нет настроек button_response_config для пользователя {user_id}")
        await callback_query.message.edit_text("❌ Ошибка: настройки ответа не найдены")
        return
    
    config = user_data[user_id]["button_response_config"]
    option = config["options"][0]  # Первая опция
    
    # Сохраняем выбор
    user_data[user_id][config["variable"]] = option["value"]
    
    # Показываем успешное сообщение
    success_text = f"✅ {config['success_message']}\n\nВы выбрали: {option['text']}"
    await callback_query.message.edit_text(success_text, parse_mode=ParseMode.HTML)
    
    # Переходим к следующему шагу
    await asyncio.sleep(1)
    
    # Переходим к следующему узлу
    next_text = "🎯 **Шаг 3: Интересы**\n\n<b>Выберите ваши интересы:</b>\n\nВыберите все подходящие варианты:"
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🎮 Игры", callback_data="interest_games"))
    builder.add(InlineKeyboardButton(text="🎵 Музыка", callback_data="interest_music"))
    builder.add(InlineKeyboardButton(text="📚 Чтение", callback_data="interest_reading"))
    builder.add(InlineKeyboardButton(text="✅ Готово", callback_data="finish_survey"))
    keyboard = builder.as_markup()
    
    await bot.send_message(user_id, next_text, reply_markup=keyboard, parse_mode=ParseMode.HTML)
    
    print(f"[DEBUG] Пользователь {user_id} перешел к следующему шагу")

@dp.callback_query(F.data == "response_age-buttons_1")
async def handle_response_age_buttons_1(callback_query: CallbackQuery):
    """Обработчик ответа: 26-35 лет"""
    user_id = callback_query.from_user.id
    print(f"[DEBUG] Пользователь {user_id} выбрал возраст 26-35 лет")
    
    await callback_query.answer()
    
    # Проверяем настройки кнопочного ответа
    if user_id not in user_data or "button_response_config" not in user_data[user_id]:
        print(f"[ERROR] Нет настроек button_response_config для пользователя {user_id}")
        await callback_query.message.edit_text("❌ Ошибка: настройки ответа не найдены")
        return
    
    config = user_data[user_id]["button_response_config"]
    option = config["options"][1]  # Вторая опция
    
    # Сохраняем выбор
    user_data[user_id][config["variable"]] = option["value"]
    
    # Показываем успешное сообщение
    success_text = f"✅ {config['success_message']}\n\nВы выбрали: {option['text']}"
    await callback_query.message.edit_text(success_text, parse_mode=ParseMode.HTML)
    
    print(f"[DEBUG] Пользователь {user_id} успешно выбрал возраст")

@dp.callback_query(F.data == "finish_survey")
async def handle_finish_survey(callback_query: CallbackQuery):
    """Завершение опроса"""
    user_id = callback_query.from_user.id
    print(f"[DEBUG] Пользователь {user_id} завершил опрос")
    
    await callback_query.answer()
    
    # Показываем результаты
    name = user_data[user_id].get("user_name", "Неизвестно")
    age = user_data[user_id].get("user_age_group", "Неизвестно")
    
    result_text = f"📊 **Результаты опроса**\n\n<b>Имя:</b> {name}\n<b>Возраст:</b> {age}\n\nСпасибо за участие!"
    await callback_query.message.edit_text(result_text, parse_mode=ParseMode.HTML)
    
    print(f"[DEBUG] Результаты для пользователя {user_id}: имя={name}, возраст={age}")

@dp.message()
async def handle_user_input(message: Message):
    """Обработчик пользовательского ввода"""
    user_id = message.from_user.id
    
    # Проверяем, ожидаем ли мы ввод от пользователя
    if user_id not in user_data or "waiting_for_input" not in user_data[user_id]:
        await message.answer("❓ Я не понимаю. Используйте команду /start для начала.")
        return
    
    input_config = user_data[user_id]["waiting_for_input"]
    user_text = message.text
    
    print(f"[DEBUG] Пользователь {user_id} ввел: {user_text}")
    
    # Сохраняем ответ
    user_data[user_id][input_config["variable"]] = user_text
    
    # Удаляем настройки ожидания
    del user_data[user_id]["waiting_for_input"]
    
    # Переходим к следующему шагу
    if input_config["next_node_id"] == "age-buttons":
        # Эмулируем callback для перехода к age-buttons
        callback_query = type('CallbackQuery', (), {
            'from_user': message.from_user,
            'message': message,
            'answer': lambda: None,
            'data': 'age-buttons'
        })()
        
        await handle_age_buttons(callback_query)

async def main():
    """Главная функция"""
    print("🚀 Запуск тестового бота для age-buttons...")
    print("Для тестирования замените YOUR_BOT_TOKEN на реальный токен и запустите:")
    print("python test_age_buttons_debug.py")
    print("\nЛоги покажут каждый шаг процесса:")
    print("1. Пользователь запускает /start")
    print("2. Вводит имя")
    print("3. Система переходит к age-buttons")
    print("4. Пользователь выбирает возрастную группу")
    print("5. Система переходит к следующему шагу")
    
    # Если токен не настроен, завершаем
    if BOT_TOKEN == "YOUR_BOT_TOKEN":
        print("\n❌ Для реального тестирования замените YOUR_BOT_TOKEN на токен вашего бота")
        return
    
    try:
        await dp.start_polling(bot)
    except Exception as e:
        print(f"❌ Ошибка: {e}")
    finally:
        await bot.session.close()

if __name__ == "__main__":
    asyncio.run(main())