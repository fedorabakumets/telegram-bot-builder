"""
Комплексный тест форматирования - Telegram Bot
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


@dp.message(CommandStart())
async def start_handler(message: types.Message):

    # Регистрируем пользователя в системе
    user_data[message.from_user.id] = {
        "username": message.from_user.username,
        "first_name": message.from_user.first_name,
        "last_name": message.from_user.last_name,
        "registered_at": message.date
    }

    text = """🤖 **Комплексный тест форматирования**

Этот бот тестирует:
• **Markdown** форматирование
• *HTML* форматирование  
• `Обычный` текст

Выберите тест:"""
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📝 Markdown тест", callback_data="markdown-node"))
    builder.add(InlineKeyboardButton(text="🌐 HTML тест", callback_data="html-node"))
    builder.add(InlineKeyboardButton(text="📄 Обычный текст", callback_data="plain-node"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.message(Command("help"))
async def help_handler(message: types.Message):
    logging.info(f"Команда /help вызвана пользователем {message.from_user.id}")
    # Сохраняем статистику использования команд
    if message.from_user.id not in user_data:
        user_data[message.from_user.id] = {}
    if "commands_used" not in user_data[message.from_user.id]:
        user_data[message.from_user.id]["commands_used"] = {}
    user_data[message.from_user.id]["commands_used"]["/help"] = user_data[message.from_user.id]["commands_used"].get("/help", 0) + 1

    text = """<b>🆘 Справка по боту</b>

<i>HTML форматирование работает!</i>

<code>Доступные команды:</code>
• <b>/start</b> - запуск бота
• <b>/help</b> - эта справка

<u>Поддерживаемые форматы:</u>
• <s>Зачеркнутый</s> текст
• <pre>Блок кода</pre>

<a href="https://telegram.org">Ссылка на Telegram</a>"""
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Назад к началу", callback_data="start-1"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard, parse_mode=ParseMode.HTML)

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "markdown-node")
async def handle_callback_markdown_node(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📝 **Тест Markdown форматирования**

**Жирный текст** работает
*Курсивный текст* тоже работает
`Встроенный код` отображается правильно
__Подчеркнутый текст__ виден
~~Зачеркнутый текст~~ тоже

```python
# Блок кода
def hello():
    print("Hello World!")
```

> Цитата выглядит красиво

# Заголовок
## Подзаголовок

[Ссылка на сайт](https://example.com)"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🌐 Переключить на HTML", callback_data="html-node"))
    builder.add(InlineKeyboardButton(text="🏠 Главное меню", callback_data="start-1"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "html-node")
async def handle_callback_html_node(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🌐 <b>Тест HTML форматирования</b>

<b>Жирный текст</b> в HTML
<i>Курсивный текст</i> в HTML
<code>Встроенный код</code> в HTML
<u>Подчеркнутый текст</u> в HTML
<s>Зачеркнутый текст</s> в HTML

<pre>Блок кода в HTML
с несколькими строками</pre>

<a href="https://telegram.org">Ссылка в HTML формате</a>

Все работает отлично!"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📝 Переключить на Markdown", callback_data="markdown-node"))
    builder.add(InlineKeyboardButton(text="📄 Обычный текст", callback_data="plain-node"))
    builder.add(InlineKeyboardButton(text="🏠 Главное меню", callback_data="start-1"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.HTML)

@dp.callback_query(lambda c: c.data == "plain-node")
async def handle_callback_plain_node(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📄 Обычный текст без форматирования

**Это НЕ будет жирным**
*Это НЕ будет курсивом*
<b>Это НЕ будет жирным в HTML</b>
<i>Это НЕ будет курсивом в HTML</i>

Весь текст отображается как есть, без обработки markdown или HTML тегов.

Используется когда нужен чистый текст без форматирования."""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📝 Markdown", callback_data="markdown-node"))
    builder.add(InlineKeyboardButton(text="🌐 HTML", callback_data="html-node"))
    builder.add(InlineKeyboardButton(text="🏠 Главное меню", callback_data="start-1"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "start-1")
async def handle_callback_start_1(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🤖 **Комплексный тест форматирования**

Этот бот тестирует:
• **Markdown** форматирование
• *HTML* форматирование  
• `Обычный` текст

Выберите тест:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📝 Markdown тест", callback_data="markdown-node"))
    builder.add(InlineKeyboardButton(text="🌐 HTML тест", callback_data="html-node"))
    builder.add(InlineKeyboardButton(text="📄 Обычный текст", callback_data="plain-node"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

# Обработчики reply кнопок

@dp.message(lambda message: message.text == "📝 Тест Markdown")
async def handle_reply_btn13(message: types.Message):
    text = """📝 **Тест Markdown форматирования**

**Жирный текст** работает
*Курсивный текст* тоже работает
`Встроенный код` отображается правильно
__Подчеркнутый текст__ виден
~~Зачеркнутый текст~~ тоже

```python
# Блок кода
def hello():
    print("Hello World!")
```

> Цитата выглядит красиво

# Заголовок
## Подзаголовок

[Ссылка на сайт](https://example.com)"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🌐 Переключить на HTML", callback_data="html-node"))
    builder.add(InlineKeyboardButton(text="🏠 Главное меню", callback_data="start-1"))
    keyboard = builder.as_markup()
    await message.answer(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.message(lambda message: message.text == "🌐 Тест HTML")
async def handle_reply_btn14(message: types.Message):
    text = """🌐 <b>Тест HTML форматирования</b>

<b>Жирный текст</b> в HTML
<i>Курсивный текст</i> в HTML
<code>Встроенный код</code> в HTML
<u>Подчеркнутый текст</u> в HTML
<s>Зачеркнутый текст</s> в HTML

<pre>Блок кода в HTML
с несколькими строками</pre>

<a href="https://telegram.org">Ссылка в HTML формате</a>

Все работает отлично!"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📝 Переключить на Markdown", callback_data="markdown-node"))
    builder.add(InlineKeyboardButton(text="📄 Обычный текст", callback_data="plain-node"))
    builder.add(InlineKeyboardButton(text="🏠 Главное меню", callback_data="start-1"))
    keyboard = builder.as_markup()
    await message.answer(text, reply_markup=keyboard, parse_mode=ParseMode.HTML)

@dp.message(lambda message: message.text == "🏠 Главное меню")
async def handle_reply_btn15(message: types.Message):
    text = """🤖 **Комплексный тест форматирования**

Этот бот тестирует:
• **Markdown** форматирование
• *HTML* форматирование  
• `Обычный` текст

Выберите тест:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📝 Markdown тест", callback_data="markdown-node"))
    builder.add(InlineKeyboardButton(text="🌐 HTML тест", callback_data="html-node"))
    builder.add(InlineKeyboardButton(text="📄 Обычный текст", callback_data="plain-node"))
    keyboard = builder.as_markup()
    await message.answer(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)


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
    print("Бот запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
