"""
Тестовый проект опроса - Telegram Bot
Сгенерировано с помощью TelegramBot Builder

Команды для @BotFather:
start - Запустить бота"""

import asyncio
import logging
import os
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, BotCommand, ReplyKeyboardRemove, URLInputFile, FSInputFile
from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder
from aiogram.enums import ParseMode

# Токен вашего бота (получите у @BotFather)
BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"

# Настройка логирования
logging.basicConfig(level=logging.INFO)

# Создание бота и диспетчера
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# Список администраторов (добавьте свой Telegram ID)
ADMIN_IDS = [123456789]  # Замените на реальные ID администраторов

# Хранилище пользователей (в реальном боте используйте базу данных)
user_data = {}


# Утилитарные функции
async def is_admin(user_id: int) -> bool:
    return user_id in ADMIN_IDS

async def is_private_chat(message: types.Message) -> bool:
    return message.chat.type == "private"

async def check_auth(user_id: int) -> bool:
    # Здесь можно добавить логику проверки авторизации
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


# Настройка меню команд
async def set_bot_commands():
    commands = [
        BotCommand(command="start", description="Запустить бота"),
    ]
    await bot.set_my_commands(commands)


@dp.message(CommandStart())
async def start_handler(message: types.Message):

    # Регистрируем пользователя в системе
    user_data[message.from_user.id] = {
        "username": message.from_user.username,
        "first_name": message.from_user.first_name,
        "last_name": message.from_user.last_name,
        "registered_at": message.date
    }

    text = """Привет! 👋 Добро пожаловать в наш бот!

Откуда ты узнал о нашем боте?"""
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📱 Из социальных сетей", callback_data="social-networks"))
    builder.add(InlineKeyboardButton(text="👥 От друзей/знакомых", callback_data="friends-recommendation"))
    builder.add(InlineKeyboardButton(text="🔍 Через поиск", callback_data="search-engines"))
    builder.add(InlineKeyboardButton(text="📝 Другое (написать)", callback_data="other-source-input"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

# Обработчик сбора пользовательского ввода для узла other-source-input
    prompt_text = """📝 Пожалуйста, расскажите подробнее, откуда вы узнали о нашем боте:

💡 Например: из рекламы, от коллег, из статьи, с форума и т.д."""
    placeholder_text = "Например: из рекламы ВКонтакте, от коллег на работе..."
    prompt_text += f"\n\n💡 {placeholder_text}"
    await message.answer(prompt_text)
    
    # Инициализируем пользовательские данные если их нет
    if message.from_user.id not in user_data:
        user_data[message.from_user.id] = {}
    
    # Ожидаем ответ пользователя
    user_data[message.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "variable": "discovery_source",
        "validation": "",
        "min_length": 5,
        "max_length": 500,
        "timeout": 300,
        "required": True,
        "allow_skip": False,
        "save_to_db": True,
        "retry_message": "Пожалуйста, напишите хотя бы несколько слов (минимум 5 символов).",
        "success_message": "Спасибо за подробный ответ! 🙏",
        "default_value": "",
        "node_id": "other-source-input"
    }
    

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "social-networks")
async def handle_callback_social_networks(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📱 Отлично! Социальные сети - мощный инструмент для знакомства с новыми сервисами.

Спасибо за ответ! Мы учтем эту информацию для улучшения нашего присутствия в соцсетях."""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Продолжить", callback_data="thank-you"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "friends-recommendation")
async def handle_callback_friends_recommendation(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """👥 Здорово! Рекомендации от друзей - лучшая реклама для нас.

Передайте им наши благодарности! Сарафанное радио работает лучше всех маркетинговых кампаний."""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Продолжить", callback_data="thank-you"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "search-engines")
async def handle_callback_search_engines(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🔍 Прекрасно! Значит, наши усилия по SEO не прошли даром.

Мы работаем над тем, чтобы наш бот был легко найти через поисковые системы."""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Продолжить", callback_data="thank-you"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "other-source-input")
async def handle_callback_other_source_input(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Удаляем старое сообщение
    await callback_query.message.delete()
    
    text = """📝 Пожалуйста, расскажите подробнее, откуда вы узнали о нашем боте:

💡 Например: из рекламы, от коллег, из статьи, с форума и т.д."""
    placeholder_text = "Например: из рекламы ВКонтакте, от коллег на работе..."
    text += f"\n\n💡 {placeholder_text}"
    await bot.send_message(callback_query.from_user.id, text)
    
    # Инициализируем пользовательские данные если их нет
    if callback_query.from_user.id not in user_data:
        user_data[callback_query.from_user.id] = {}
    
    # Настраиваем ожидание ввода
    user_data[callback_query.from_user.id]["waiting_for_input"] = {
        "type": "text",
        "variable": "discovery_source",
        "validation": "",
        "min_length": 5,
        "max_length": 500,
        "timeout": 300,
        "required": true,
        "allow_skip": false,
        "save_to_database": true,
        "retry_message": "Пожалуйста, напишите хотя бы несколько слов (минимум 5 символов).",
        "success_message": "Спасибо за подробный ответ! 🙏",
        "node_id": "other-source-input"
    }

@dp.callback_query(lambda c: c.data == "thank-you")
async def handle_callback_thank_you(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🎉 Спасибо за участие в опросе!

Ваша обратная связь очень важна для нас. Она помогает улучшать наш сервис и понимать, где нас находят пользователи.

✨ Теперь вы можете пользоваться всеми возможностями нашего бота!"""
    builder = InlineKeyboardBuilder()
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)


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
    
    # Сохраняем ответ пользователя
    variable_name = input_config.get("variable", "user_response")
    user_data[user_id][variable_name] = user_text
    
    # Сохраняем в базу данных если включено
    if input_config.get("save_to_database"):
        logging.info(f"Сохранение в БД: {variable_name} = {user_text} (пользователь {user_id})")
        # Здесь можно добавить код для сохранения в реальную базу данных
    
    # Отправляем сообщение об успехе
    success_message = input_config.get("success_message", "Спасибо за ваш ответ!")
    await message.answer(success_message)
    
    # Очищаем состояние ожидания ввода
    del user_data[user_id]["waiting_for_input"]
    
    logging.info(f"Получен пользовательский ввод: {variable_name} = {user_text}")



# Запуск бота
async def main():
    await set_bot_commands()
    print("Бот запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
