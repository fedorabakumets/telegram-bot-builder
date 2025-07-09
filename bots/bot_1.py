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

# Токен вашего бота (получите у @BotFather)
BOT_TOKEN = "8082906513:AAEkTEm-HYvpRkI8ZuPuWmx3f25zi5tm1OE"

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

    text = """🏛️ **ДОБРО ПОЖАЛОВАТЬ В УЛЬТРА-КОМПЛЕКСНЫЙ ПОЛИТИКО-ИСТОРИЧЕСКИЙ ОПРОС!**

📚 Этот опрос включает:
• 🗳️ **Политические взгляды** (20+ вопросов)
• 📜 **Историческое знание** (25+ вопросов)
• 🤔 **Философские воззрения** (15+ вопросов)
• 🌍 **Социологический анализ** (20+ вопросов)

⏱️ **Время прохождения:** 45-60 минут
🎯 **Результат:** Подробный анализ ваших взглядов

**Готовы начать глубокое исследование?**"""
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🚀 Начать опрос", callback_data="political-intro"))
    builder.add(InlineKeyboardButton(text="📋 Обзор разделов", callback_data="sections-overview"))
    builder.add(InlineKeyboardButton(text="📖 Инструкции", callback_data="survey-instructions"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "political-intro")
async def handle_callback_political_intro(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🗳️ **БЛОК А: ПОЛИТОЛОГИЯ**

**Исследуем ваши политические взгляды и предпочтения**

В этом блоке 20 вопросов о:
• Роли государства в экономике
• Социальной политике
• Международных отношениях
• Правах и свободах
• Политических системах

**Готовы начать политический анализ?**"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🗳️ Начать политблок", callback_data="pol-q1"))
    builder.add(InlineKeyboardButton(text="📜 Перейти к истории", callback_data="history-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "sections-overview")
async def handle_callback_sections_overview(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📋 **РАЗДЕЛЫ ОПРОСА:**

🗳️ **БЛОК А: ПОЛИТОЛОГИЯ** (20 вопросов)
• Политические предпочтения
• Отношение к власти и государству
• Экономические взгляды
• Социальная политика

📜 **БЛОК Б: ИСТОРИЯ** (25 вопросов)
• Знание исторических событий
• Оценка исторических личностей
• Понимание исторических процессов
• Альтернативная история

🤔 **БЛОК В: ФИЛОСОФИЯ** (15 вопросов)
• Этические воззрения
• Метафизические взгляды
• Политическая философия
• Смысл и ценности

🌍 **БЛОК Г: СОЦИОЛОГИЯ** (20 вопросов)
• Социальные проблемы
• Межгрупповые отношения
• Глобализация и культура
• Будущее общества"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="⬅️ Назад к началу", callback_data="start-poll"))
    builder.add(InlineKeyboardButton(text="🚀 Начать опрос", callback_data="political-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "survey-instructions")
async def handle_callback_survey_instructions(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📖 **ИНСТРУКЦИИ ПО ПРОХОЖДЕНИЮ:**

✅ **Как отвечать:**
• Выбирайте наиболее подходящий вариант
• Если сомневаетесь, выберите ближайший по духу
• Нет правильных или неправильных ответов

⏱️ **Время:**
• Можете делать перерывы между блоками
• Средний блок проходится за 10-15 минут
• Общее время: 45-60 минут

🎯 **Результаты:**
• Получите подробный анализ по каждому блоку
• Сравнение с типичными профилями
• Рекомендации по дальнейшему изучению

🔒 **Конфиденциальность:**
• Ваши ответы анонимны
• Данные используются только для анализа
• Результаты видите только вы"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="⬅️ К началу", callback_data="start-poll"))
    builder.add(InlineKeyboardButton(text="✅ Понятно, начинаем!", callback_data="political-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "start-poll")
async def handle_callback_start_poll(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🏛️ **ДОБРО ПОЖАЛОВАТЬ В УЛЬТРА-КОМПЛЕКСНЫЙ ПОЛИТИКО-ИСТОРИЧЕСКИЙ ОПРОС!**

📚 Этот опрос включает:
• 🗳️ **Политические взгляды** (20+ вопросов)
• 📜 **Историческое знание** (25+ вопросов)
• 🤔 **Философские воззрения** (15+ вопросов)
• 🌍 **Социологический анализ** (20+ вопросов)

⏱️ **Время прохождения:** 45-60 минут
🎯 **Результат:** Подробный анализ ваших взглядов

**Готовы начать глубокое исследование?**"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🚀 Начать опрос", callback_data="political-intro"))
    builder.add(InlineKeyboardButton(text="📋 Обзор разделов", callback_data="sections-overview"))
    builder.add(InlineKeyboardButton(text="📖 Инструкции", callback_data="survey-instructions"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q1")
async def handle_callback_pol_q1(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🗳️ **ВОПРОС 1/20** (Политология)

**Какую роль должно играть государство в экономике?**

Выберите наиболее близкий вам вариант:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Минимальная роль - свободный р...", callback_data="pol-q1-result"))
    builder.add(InlineKeyboardButton(text="B) Умеренное регулирование ключев...", callback_data="pol-q1-result"))
    builder.add(InlineKeyboardButton(text="C) Активное вмешательство и плани...", callback_data="pol-q1-result"))
    builder.add(InlineKeyboardButton(text="D) Полный государственный контрол...", callback_data="pol-q1-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "history-intro")
async def handle_callback_history_intro(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📜 **БЛОК Б: ИСТОРИЯ**

**Проверим ваши исторические знания и интерпретации**

В этом блоке 25 вопросов о:
• Ключевых исторических событиях
• Великих исторических личностях
• Причинах и последствиях событий
• Альтернативных сценариях развития
• Исторических параллелях

**Готовы окунуться в историю?**"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📜 Начать истблок", callback_data="hist-q1"))
    builder.add(InlineKeyboardButton(text="🤔 Перейти к философии", callback_data="philosophy-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q1-result")
async def handle_callback_pol_q1_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Ответ записан!**

**Полные варианты ответа:**

A) Минимальная роль - свободный рынок

B) Умеренное регулирование ключевых отраслей

C) Активное вмешательство и планирование

D) Полный государственный контроль

📊 **Прогресс:** 1/20 вопросов политблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="pol-q2"))
    builder.add(InlineKeyboardButton(text="📜 Перейти к истории", callback_data="history-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q2")
async def handle_callback_pol_q2(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🗳️ **ВОПРОС 2/20** (Политология)

**Как вы относитесь к прогрессивному налогообложению?**

Выберите наиболее близкий вам вариант:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Против - плоская налоговая ста...", callback_data="pol-q2-result"))
    builder.add(InlineKeyboardButton(text="B) Умеренная прогрессивность...", callback_data="pol-q2-result"))
    builder.add(InlineKeyboardButton(text="C) Сильная прогрессивность...", callback_data="pol-q2-result"))
    builder.add(InlineKeyboardButton(text="D) Максимальная прогрессивность с...", callback_data="pol-q2-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q2-result")
async def handle_callback_pol_q2_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Ответ записан!**

**Полные варианты ответа:**

A) Против - плоская налоговая ставка для всех

B) Умеренная прогрессивность

C) Сильная прогрессивность

D) Максимальная прогрессивность с перераспределением

📊 **Прогресс:** 2/20 вопросов политблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="pol-q3"))
    builder.add(InlineKeyboardButton(text="📜 Перейти к истории", callback_data="history-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q3")
async def handle_callback_pol_q3(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🗳️ **ВОПРОС 3/20** (Политология)

**Ваша позиция по социальным программам государства?**

Выберите наиболее близкий вам вариант:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Минимальные - только самое нео...", callback_data="pol-q3-result"))
    builder.add(InlineKeyboardButton(text="B) Базовые программы поддержки...", callback_data="pol-q3-result"))
    builder.add(InlineKeyboardButton(text="C) Широкие социальные гарантии...", callback_data="pol-q3-result"))
    builder.add(InlineKeyboardButton(text="D) Универсальный базовый доход...", callback_data="pol-q3-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q3-result")
async def handle_callback_pol_q3_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Ответ записан!**

**Полные варианты ответа:**

A) Минимальные - только самое необходимое

B) Базовые программы поддержки

C) Широкие социальные гарантии

D) Универсальный базовый доход

📊 **Прогресс:** 3/20 вопросов политблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="pol-q4"))
    builder.add(InlineKeyboardButton(text="📜 Перейти к истории", callback_data="history-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q4")
async def handle_callback_pol_q4(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🗳️ **ВОПРОС 4/20** (Политология)

**Как должна строиться внешняя политика?**

Выберите наиболее близкий вам вариант:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Изоляционизм и невмешательство...", callback_data="pol-q4-result"))
    builder.add(InlineKeyboardButton(text="B) Прагматичное сотрудничество...", callback_data="pol-q4-result"))
    builder.add(InlineKeyboardButton(text="C) Активная дипломатия и альянсы...", callback_data="pol-q4-result"))
    builder.add(InlineKeyboardButton(text="D) Глобальное лидерство и влияние...", callback_data="pol-q4-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q4-result")
async def handle_callback_pol_q4_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Ответ записан!**

**Полные варианты ответа:**

A) Изоляционизм и невмешательство

B) Прагматичное сотрудничество

C) Активная дипломатия и альянсы

D) Глобальное лидерство и влияние

📊 **Прогресс:** 4/20 вопросов политблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="pol-q5"))
    builder.add(InlineKeyboardButton(text="📜 Перейти к истории", callback_data="history-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q5")
async def handle_callback_pol_q5(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🗳️ **ВОПРОС 5/20** (Политология)

**Отношение к международным организациям (ООН, ВТО)?**

Выберите наиболее близкий вам вариант:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Выход и независимость...", callback_data="pol-q5-result"))
    builder.add(InlineKeyboardButton(text="B) Ограниченное участие...", callback_data="pol-q5-result"))
    builder.add(InlineKeyboardButton(text="C) Активное членство...", callback_data="pol-q5-result"))
    builder.add(InlineKeyboardButton(text="D) Расширение полномочий междунар...", callback_data="pol-q5-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q5-result")
async def handle_callback_pol_q5_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Ответ записан!**

**Полные варианты ответа:**

A) Выход и независимость

B) Ограниченное участие

C) Активное членство

D) Расширение полномочий международных структур

📊 **Прогресс:** 5/20 вопросов политблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="pol-q6"))
    builder.add(InlineKeyboardButton(text="📜 Перейти к истории", callback_data="history-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q6")
async def handle_callback_pol_q6(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🗳️ **ВОПРОС 6/20** (Политология)

**Какая избирательная система предпочтительнее?**

Выберите наиболее близкий вам вариант:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Мажоритарная (побеждает один)...", callback_data="pol-q6-result"))
    builder.add(InlineKeyboardButton(text="B) Смешанная система...", callback_data="pol-q6-result"))
    builder.add(InlineKeyboardButton(text="C) Пропорциональная (по партийным...", callback_data="pol-q6-result"))
    builder.add(InlineKeyboardButton(text="D) Прямая демократия (референдумы...", callback_data="pol-q6-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q6-result")
async def handle_callback_pol_q6_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Ответ записан!**

**Полные варианты ответа:**

A) Мажоритарная (побеждает один)

B) Смешанная система

C) Пропорциональная (по партийным спискам)

D) Прямая демократия (референдумы)

📊 **Прогресс:** 6/20 вопросов политблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="pol-q7"))
    builder.add(InlineKeyboardButton(text="📜 Перейти к истории", callback_data="history-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q7")
async def handle_callback_pol_q7(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🗳️ **ВОПРОС 7/20** (Политология)

**Отношение к свободе слова и цензуре?**

Выберите наиболее близкий вам вариант:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Абсолютная свобода слова...", callback_data="pol-q7-result"))
    builder.add(InlineKeyboardButton(text="B) Ограничения только для экстрем...", callback_data="pol-q7-result"))
    builder.add(InlineKeyboardButton(text="C) Умеренная цензура вредного кон...", callback_data="pol-q7-result"))
    builder.add(InlineKeyboardButton(text="D) Строгий контроль информации...", callback_data="pol-q7-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q7-result")
async def handle_callback_pol_q7_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Ответ записан!**

**Полные варианты ответа:**

A) Абсолютная свобода слова

B) Ограничения только для экстремизма

C) Умеренная цензура вредного контента

D) Строгий контроль информации

📊 **Прогресс:** 7/20 вопросов политблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="pol-q8"))
    builder.add(InlineKeyboardButton(text="📜 Перейти к истории", callback_data="history-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q8")
async def handle_callback_pol_q8(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🗳️ **ВОПРОС 8/20** (Политология)

**Как относитесь к приватизации государственных услуг?**

Выберите наиболее близкий вам вариант:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Полная приватизация всего возм...", callback_data="pol-q8-result"))
    builder.add(InlineKeyboardButton(text="B) Приватизация неэффективных сек...", callback_data="pol-q8-result"))
    builder.add(InlineKeyboardButton(text="C) Смешанная государственно-частн...", callback_data="pol-q8-result"))
    builder.add(InlineKeyboardButton(text="D) Государственная монополия на у...", callback_data="pol-q8-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q8-result")
async def handle_callback_pol_q8_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Ответ записан!**

**Полные варианты ответа:**

A) Полная приватизация всего возможного

B) Приватизация неэффективных секторов

C) Смешанная государственно-частная модель

D) Государственная монополия на услуги

📊 **Прогресс:** 8/20 вопросов политблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="pol-q9"))
    builder.add(InlineKeyboardButton(text="📜 Перейти к истории", callback_data="history-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q9")
async def handle_callback_pol_q9(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🗳️ **ВОПРОС 9/20** (Политология)

**Позиция по миграционной политике?**

Выберите наиболее близкий вам вариант:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Закрытые границы, минимальная ...", callback_data="pol-q9-result"))
    builder.add(InlineKeyboardButton(text="B) Селективная миграция по потреб...", callback_data="pol-q9-result"))
    builder.add(InlineKeyboardButton(text="C) Открытая миграция с интеграцие...", callback_data="pol-q9-result"))
    builder.add(InlineKeyboardButton(text="D) Полная свобода передвижения...", callback_data="pol-q9-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q9-result")
async def handle_callback_pol_q9_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Ответ записан!**

**Полные варианты ответа:**

A) Закрытые границы, минимальная миграция

B) Селективная миграция по потребностям

C) Открытая миграция с интеграцией

D) Полная свобода передвижения

📊 **Прогресс:** 9/20 вопросов политблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="pol-q10"))
    builder.add(InlineKeyboardButton(text="📜 Перейти к истории", callback_data="history-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q10")
async def handle_callback_pol_q10(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🗳️ **ВОПРОС 10/20** (Политология)

**Как должны решаться этнические и религиозные конфликты?**

Выберите наиболее близкий вам вариант:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Ассимиляция в доминирующую кул...", callback_data="pol-q10-result"))
    builder.add(InlineKeyboardButton(text="B) Умеренная интеграция с сохране...", callback_data="pol-q10-result"))
    builder.add(InlineKeyboardButton(text="C) Мультикультурализм и равенство...", callback_data="pol-q10-result"))
    builder.add(InlineKeyboardButton(text="D) Федерализм и автономии для гру...", callback_data="pol-q10-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q10-result")
async def handle_callback_pol_q10_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Ответ записан!**

**Полные варианты ответа:**

A) Ассимиляция в доминирующую культуру

B) Умеренная интеграция с сохранением различий

C) Мультикультурализм и равенство культур

D) Федерализм и автономии для групп

📊 **Прогресс:** 10/20 вопросов политблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="pol-q11"))
    builder.add(InlineKeyboardButton(text="📜 Перейти к истории", callback_data="history-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q11")
async def handle_callback_pol_q11(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🗳️ **ВОПРОС 11/20** (Политология)

**Отношение к экологической политике и регулированию?**

Выберите наиболее близкий вам вариант:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Рынок сам решит экологические ...", callback_data="pol-q11-result"))
    builder.add(InlineKeyboardButton(text="B) Минимальное регулирование крит...", callback_data="pol-q11-result"))
    builder.add(InlineKeyboardButton(text="C) Активная экологическая политик...", callback_data="pol-q11-result"))
    builder.add(InlineKeyboardButton(text="D) Радикальные меры для спасения ...", callback_data="pol-q11-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q11-result")
async def handle_callback_pol_q11_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Ответ записан!**

**Полные варианты ответа:**

A) Рынок сам решит экологические проблемы

B) Минимальное регулирование критических вопросов

C) Активная экологическая политика

D) Радикальные меры для спасения планеты

📊 **Прогресс:** 11/20 вопросов политблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="pol-q12"))
    builder.add(InlineKeyboardButton(text="📜 Перейти к истории", callback_data="history-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q12")
async def handle_callback_pol_q12(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🗳️ **ВОПРОС 12/20** (Политология)

**Как относитесь к рабочим правам и профсоюзам?**

Выберите наиболее близкий вам вариант:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Минимальные права, гибкий рыно...", callback_data="pol-q12-result"))
    builder.add(InlineKeyboardButton(text="B) Базовые трудовые права...", callback_data="pol-q12-result"))
    builder.add(InlineKeyboardButton(text="C) Сильные профсоюзы и защита раб...", callback_data="pol-q12-result"))
    builder.add(InlineKeyboardButton(text="D) Рабочий контроль над предприят...", callback_data="pol-q12-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q12-result")
async def handle_callback_pol_q12_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Ответ записан!**

**Полные варианты ответа:**

A) Минимальные права, гибкий рынок труда

B) Базовые трудовые права

C) Сильные профсоюзы и защита работников

D) Рабочий контроль над предприятиями

📊 **Прогресс:** 12/20 вопросов политблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="pol-q13"))
    builder.add(InlineKeyboardButton(text="📜 Перейти к истории", callback_data="history-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q13")
async def handle_callback_pol_q13(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🗳️ **ВОПРОС 13/20** (Политология)

**Позиция по вопросам семьи и традиционных ценностей?**

Выберите наиболее близкий вам вариант:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Строгая защита традиционных це...", callback_data="pol-q13-result"))
    builder.add(InlineKeyboardButton(text="B) Умеренный консерватизм с адапт...", callback_data="pol-q13-result"))
    builder.add(InlineKeyboardButton(text="C) Либеральный подход к разнообра...", callback_data="pol-q13-result"))
    builder.add(InlineKeyboardButton(text="D) Радикальная трансформация семе...", callback_data="pol-q13-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q13-result")
async def handle_callback_pol_q13_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Ответ записан!**

**Полные варианты ответа:**

A) Строгая защита традиционных ценностей

B) Умеренный консерватизм с адаптацией

C) Либеральный подход к разнообразию

D) Радикальная трансформация семейных структур

📊 **Прогресс:** 13/20 вопросов политблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="pol-q14"))
    builder.add(InlineKeyboardButton(text="📜 Перейти к истории", callback_data="history-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q14")
async def handle_callback_pol_q14(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🗳️ **ВОПРОС 14/20** (Политология)

**Как должна устроена система образования?**

Выберите наиболее близкий вам вариант:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Полная приватизация и выбор ро...", callback_data="pol-q14-result"))
    builder.add(InlineKeyboardButton(text="B) Смешанная система с ваучерами...", callback_data="pol-q14-result"))
    builder.add(InlineKeyboardButton(text="C) Государственное образование с ...", callback_data="pol-q14-result"))
    builder.add(InlineKeyboardButton(text="D) Централизованная государственн...", callback_data="pol-q14-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q14-result")
async def handle_callback_pol_q14_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Ответ записан!**

**Полные варианты ответа:**

A) Полная приватизация и выбор родителей

B) Смешанная система с ваучерами

C) Государственное образование с элементами выбора

D) Централизованная государственная система

📊 **Прогресс:** 14/20 вопросов политблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="pol-q15"))
    builder.add(InlineKeyboardButton(text="📜 Перейти к истории", callback_data="history-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q15")
async def handle_callback_pol_q15(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🗳️ **ВОПРОС 15/20** (Политология)

**Отношение к системе здравоохранения?**

Выберите наиболее близкий вам вариант:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Полностью частная медицина...", callback_data="pol-q15-result"))
    builder.add(InlineKeyboardButton(text="B) Частно-государственное партнер...", callback_data="pol-q15-result"))
    builder.add(InlineKeyboardButton(text="C) Государственная система с част...", callback_data="pol-q15-result"))
    builder.add(InlineKeyboardButton(text="D) Универсальная бесплатная медиц...", callback_data="pol-q15-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q15-result")
async def handle_callback_pol_q15_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Ответ записан!**

**Полные варианты ответа:**

A) Полностью частная медицина

B) Частно-государственное партнерство

C) Государственная система с частными дополнениями

D) Универсальная бесплатная медицина

📊 **Прогресс:** 15/20 вопросов политблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="pol-q16"))
    builder.add(InlineKeyboardButton(text="📜 Перейти к истории", callback_data="history-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q16")
async def handle_callback_pol_q16(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🗳️ **ВОПРОС 16/20** (Политология)

**Как относитесь к военным расходам и обороне?**

Выберите наиболее близкий вам вариант:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Минимальные расходы, миролюбив...", callback_data="pol-q16-result"))
    builder.add(InlineKeyboardButton(text="B) Умеренные расходы для самообор...", callback_data="pol-q16-result"))
    builder.add(InlineKeyboardButton(text="C) Сильная оборона для стабильнос...", callback_data="pol-q16-result"))
    builder.add(InlineKeyboardButton(text="D) Максимальные расходы для домин...", callback_data="pol-q16-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q16-result")
async def handle_callback_pol_q16_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Ответ записан!**

**Полные варианты ответа:**

A) Минимальные расходы, миролюбивая политика

B) Умеренные расходы для самообороны

C) Сильная оборона для стабильности

D) Максимальные расходы для доминирования

📊 **Прогресс:** 16/20 вопросов политблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="pol-q17"))
    builder.add(InlineKeyboardButton(text="📜 Перейти к истории", callback_data="history-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q17")
async def handle_callback_pol_q17(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🗳️ **ВОПРОС 17/20** (Политология)

**Позиция по вопросам наркополитики?**

Выберите наиболее близкий вам вариант:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Жесткая криминализация всех на...", callback_data="pol-q17-result"))
    builder.add(InlineKeyboardButton(text="B) Декриминализация с медицинским...", callback_data="pol-q17-result"))
    builder.add(InlineKeyboardButton(text="C) Легализация легких наркотиков...", callback_data="pol-q17-result"))
    builder.add(InlineKeyboardButton(text="D) Полная легализация с регулиров...", callback_data="pol-q17-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q17-result")
async def handle_callback_pol_q17_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Ответ записан!**

**Полные варианты ответа:**

A) Жесткая криминализация всех наркотиков

B) Декриминализация с медицинским подходом

C) Легализация легких наркотиков

D) Полная легализация с регулированием

📊 **Прогресс:** 17/20 вопросов политблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="pol-q18"))
    builder.add(InlineKeyboardButton(text="📜 Перейти к истории", callback_data="history-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q18")
async def handle_callback_pol_q18(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🗳️ **ВОПРОС 18/20** (Политология)

**Как должно регулироваться владение оружием?**

Выберите наиболее близкий вам вариант:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Право на ношение без ограничен...", callback_data="pol-q18-result"))
    builder.add(InlineKeyboardButton(text="B) Лицензирование с проверками...", callback_data="pol-q18-result"))
    builder.add(InlineKeyboardButton(text="C) Строгие ограничения для специа...", callback_data="pol-q18-result"))
    builder.add(InlineKeyboardButton(text="D) Полный запрет для граждан...", callback_data="pol-q18-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q18-result")
async def handle_callback_pol_q18_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Ответ записан!**

**Полные варианты ответа:**

A) Право на ношение без ограничений

B) Лицензирование с проверками

C) Строгие ограничения для специалистов

D) Полный запрет для граждан

📊 **Прогресс:** 18/20 вопросов политблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="pol-q19"))
    builder.add(InlineKeyboardButton(text="📜 Перейти к истории", callback_data="history-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q19")
async def handle_callback_pol_q19(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🗳️ **ВОПРОС 19/20** (Политология)

**Отношение к смертной казни?**

Выберите наиболее близкий вам вариант:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) За расширение применения...", callback_data="pol-q19-result"))
    builder.add(InlineKeyboardButton(text="B) За сохранение для особо тяжких...", callback_data="pol-q19-result"))
    builder.add(InlineKeyboardButton(text="C) За отмену с заменой на пожизне...", callback_data="pol-q19-result"))
    builder.add(InlineKeyboardButton(text="D) Категорически против в любых с...", callback_data="pol-q19-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q19-result")
async def handle_callback_pol_q19_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Ответ записан!**

**Полные варианты ответа:**

A) За расширение применения

B) За сохранение для особо тяжких преступлений

C) За отмену с заменой на пожизненное

D) Категорически против в любых случаях

📊 **Прогресс:** 19/20 вопросов политблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="pol-q20"))
    builder.add(InlineKeyboardButton(text="📜 Перейти к истории", callback_data="history-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q20")
async def handle_callback_pol_q20(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🗳️ **ВОПРОС 20/20** (Политология)

**Какая политическая система наиболее эффективна?**

Выберите наиболее близкий вам вариант:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Авторитарная эффективность...", callback_data="pol-q20-result"))
    builder.add(InlineKeyboardButton(text="B) Ограниченная демократия с техн...", callback_data="pol-q20-result"))
    builder.add(InlineKeyboardButton(text="C) Либеральная представительная д...", callback_data="pol-q20-result"))
    builder.add(InlineKeyboardButton(text="D) Прямая демократия с максимальн...", callback_data="pol-q20-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "pol-q20-result")
async def handle_callback_pol_q20_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Ответ записан!**

**Полные варианты ответа:**

A) Авторитарная эффективность

B) Ограниченная демократия с техническими элитами

C) Либеральная представительная демократия

D) Прямая демократия с максимальным участием

📊 **Прогресс:** 20/20 вопросов политблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📜 К блоку История", callback_data="history-intro"))
    builder.add(InlineKeyboardButton(text="📜 Перейти к истории", callback_data="history-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q1")
async def handle_callback_hist_q1(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📜 **ВОПРОС 1/25** (История)

**Что стало главной причиной Первой мировой войны?**

Выберите наиболее правильный ответ:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Убийство эрцгерцога Франца Фердинан...", callback_data="hist-q1-result"))
    builder.add(InlineKeyboardButton(text="B) Империалистические противоречия вел...", callback_data="hist-q1-result"))
    builder.add(InlineKeyboardButton(text="C) Национальные движения на Балканах...", callback_data="hist-q1-result"))
    builder.add(InlineKeyboardButton(text="D) Гонка вооружений и милитаризм...", callback_data="hist-q1-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "philosophy-intro")
async def handle_callback_philosophy_intro(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🤔 **БЛОК В: ФИЛОСОФИЯ**

**Исследуем ваши мировоззренческие установки**

В этом блоке 15 вопросов о:
• Этических принципах и морали
• Метафизических взглядах на реальность
• Смысле жизни и ценностях
• Политической философии
• Эпистемологии и познании

**Готовы к философскому анализу?**"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🤔 Начать филблок", callback_data="phil-q1"))
    builder.add(InlineKeyboardButton(text="🌍 Перейти к социологии", callback_data="sociology-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q1-result")
async def handle_callback_hist_q1_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Исторический факт зафиксирован!**

**Полные варианты:**

A) Убийство эрцгерцога Франца Фердинанда

B) Империалистические противоречия великих держав

C) Национальные движения на Балканах

D) Гонка вооружений и милитаризм

📊 **Прогресс:** 1/25 вопросов историблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="hist-q2"))
    builder.add(InlineKeyboardButton(text="🤔 Перейти к философии", callback_data="philosophy-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q2")
async def handle_callback_hist_q2(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📜 **ВОПРОС 2/25** (История)

**Какое событие можно считать началом конца Римской империи?**

Выберите наиболее правильный ответ:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Разделение на Западную и Восточную ...", callback_data="hist-q2-result"))
    builder.add(InlineKeyboardButton(text="B) Нашествие готов и вандалов...", callback_data="hist-q2-result"))
    builder.add(InlineKeyboardButton(text="C) Принятие христианства как государст...", callback_data="hist-q2-result"))
    builder.add(InlineKeyboardButton(text="D) Кризис III века и анархия...", callback_data="hist-q2-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q2-result")
async def handle_callback_hist_q2_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Исторический факт зафиксирован!**

**Полные варианты:**

A) Разделение на Западную и Восточную империи

B) Нашествие готов и вандалов

C) Принятие христианства как государственной религии

D) Кризис III века и анархия

📊 **Прогресс:** 2/25 вопросов историблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="hist-q3"))
    builder.add(InlineKeyboardButton(text="🤔 Перейти к философии", callback_data="philosophy-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q3")
async def handle_callback_hist_q3(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📜 **ВОПРОС 3/25** (История)

**Главное достижение эпохи Просвещения:**

Выберите наиболее правильный ответ:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Научная революция и рационализм...", callback_data="hist-q3-result"))
    builder.add(InlineKeyboardButton(text="B) Идеи прав человека и демократии...", callback_data="hist-q3-result"))
    builder.add(InlineKeyboardButton(text="C) Секуляризация общества...", callback_data="hist-q3-result"))
    builder.add(InlineKeyboardButton(text="D) Критическое мышление и энциклопедиз...", callback_data="hist-q3-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q3-result")
async def handle_callback_hist_q3_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Исторический факт зафиксирован!**

**Полные варианты:**

A) Научная революция и рационализм

B) Идеи прав человека и демократии

C) Секуляризация общества

D) Критическое мышление и энциклопедизм

📊 **Прогресс:** 3/25 вопросов историблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="hist-q4"))
    builder.add(InlineKeyboardButton(text="🤔 Перейти к философии", callback_data="philosophy-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q4")
async def handle_callback_hist_q4(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📜 **ВОПРОС 4/25** (История)

**Что предопределило исход Второй мировой войны?**

Выберите наиболее правильный ответ:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Промышленный потенциал союзников...", callback_data="hist-q4-result"))
    builder.add(InlineKeyboardButton(text="B) Вступление США в войну...", callback_data="hist-q4-result"))
    builder.add(InlineKeyboardButton(text="C) Открытие второго фронта...", callback_data="hist-q4-result"))
    builder.add(InlineKeyboardButton(text="D) Стойкость СССР на Восточном фронте...", callback_data="hist-q4-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q4-result")
async def handle_callback_hist_q4_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Исторический факт зафиксирован!**

**Полные варианты:**

A) Промышленный потенциал союзников

B) Вступление США в войну

C) Открытие второго фронта

D) Стойкость СССР на Восточном фронте

📊 **Прогресс:** 4/25 вопросов историблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="hist-q5"))
    builder.add(InlineKeyboardButton(text="🤔 Перейти к философии", callback_data="philosophy-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q5")
async def handle_callback_hist_q5(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📜 **ВОПРОС 5/25** (История)

**Главная причина краха колониальной системы:**

Выберите наиболее правильный ответ:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Национально-освободительные движени...", callback_data="hist-q5-result"))
    builder.add(InlineKeyboardButton(text="B) Экономическая нецелесообразность ко...", callback_data="hist-q5-result"))
    builder.add(InlineKeyboardButton(text="C) Ослабление метрополий после войн...", callback_data="hist-q5-result"))
    builder.add(InlineKeyboardButton(text="D) Давление международного сообщества...", callback_data="hist-q5-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q5-result")
async def handle_callback_hist_q5_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Исторический факт зафиксирован!**

**Полные варианты:**

A) Национально-освободительные движения

B) Экономическая нецелесообразность колоний

C) Ослабление метрополий после войн

D) Давление международного сообщества

📊 **Прогресс:** 5/25 вопросов историблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="hist-q6"))
    builder.add(InlineKeyboardButton(text="🤔 Перейти к философии", callback_data="philosophy-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q6")
async def handle_callback_hist_q6(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📜 **ВОПРОС 6/25** (История)

**Что характеризует феодализм как систему?**

Выберите наиболее правильный ответ:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Личные отношения вассалитета...", callback_data="hist-q6-result"))
    builder.add(InlineKeyboardButton(text="B) Натуральное хозяйство и замкнутость...", callback_data="hist-q6-result"))
    builder.add(InlineKeyboardButton(text="C) Сословная иерархия общества...", callback_data="hist-q6-result"))
    builder.add(InlineKeyboardButton(text="D) Земля как основа власти и богатства...", callback_data="hist-q6-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q6-result")
async def handle_callback_hist_q6_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Исторический факт зафиксирован!**

**Полные варианты:**

A) Личные отношения вассалитета

B) Натуральное хозяйство и замкнутость

C) Сословная иерархия общества

D) Земля как основа власти и богатства

📊 **Прогресс:** 6/25 вопросов историблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="hist-q7"))
    builder.add(InlineKeyboardButton(text="🤔 Перейти к философии", callback_data="philosophy-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q7")
async def handle_callback_hist_q7(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📜 **ВОПРОС 7/25** (История)

**Главное наследие Византийской империи:**

Выберите наиболее правильный ответ:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Сохранение античного наследия...", callback_data="hist-q7-result"))
    builder.add(InlineKeyboardButton(text="B) Православное христианство...", callback_data="hist-q7-result"))
    builder.add(InlineKeyboardButton(text="C) Дипломатические традиции...", callback_data="hist-q7-result"))
    builder.add(InlineKeyboardButton(text="D) Административная система...", callback_data="hist-q7-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q7-result")
async def handle_callback_hist_q7_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Исторический факт зафиксирован!**

**Полные варианты:**

A) Сохранение античного наследия

B) Православное христианство

C) Дипломатические традиции

D) Административная система

📊 **Прогресс:** 7/25 вопросов историблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="hist-q8"))
    builder.add(InlineKeyboardButton(text="🤔 Перейти к философии", callback_data="philosophy-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q8")
async def handle_callback_hist_q8(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📜 **ВОПРОС 8/25** (История)

**Что привело к Великой французской революции?**

Выберите наиболее правильный ответ:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Финансовый кризис государства...", callback_data="hist-q8-result"))
    builder.add(InlineKeyboardButton(text="B) Идеи Просвещения и либерализм...", callback_data="hist-q8-result"))
    builder.add(InlineKeyboardButton(text="C) Социальное неравенство и привилегии...", callback_data="hist-q8-result"))
    builder.add(InlineKeyboardButton(text="D) Слабость королевской власти...", callback_data="hist-q8-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q8-result")
async def handle_callback_hist_q8_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Исторический факт зафиксирован!**

**Полные варианты:**

A) Финансовый кризис государства

B) Идеи Просвещения и либерализм

C) Социальное неравенство и привилегии

D) Слабость королевской власти

📊 **Прогресс:** 8/25 вопросов историблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="hist-q9"))
    builder.add(InlineKeyboardButton(text="🤔 Перейти к философии", callback_data="philosophy-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q9")
async def handle_callback_hist_q9(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📜 **ВОПРОС 9/25** (История)

**Главный итог Великих географических открытий:**

Выберите наиболее правильный ответ:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Создание первых колониальных импери...", callback_data="hist-q9-result"))
    builder.add(InlineKeyboardButton(text="B) Революция в мировой торговле...", callback_data="hist-q9-result"))
    builder.add(InlineKeyboardButton(text="C) Расширение географических знаний...", callback_data="hist-q9-result"))
    builder.add(InlineKeyboardButton(text="D) Начало глобализации мира...", callback_data="hist-q9-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q9-result")
async def handle_callback_hist_q9_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Исторический факт зафиксирован!**

**Полные варианты:**

A) Создание первых колониальных империй

B) Революция в мировой торговле

C) Расширение географических знаний

D) Начало глобализации мира

📊 **Прогресс:** 9/25 вопросов историблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="hist-q10"))
    builder.add(InlineKeyboardButton(text="🤔 Перейти к философии", callback_data="philosophy-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q10")
async def handle_callback_hist_q10(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📜 **ВОПРОС 10/25** (История)

**Что определило победу большевиков в Гражданской войне?**

Выберите наиболее правильный ответ:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Контроль над промышленными центрами...", callback_data="hist-q10-result"))
    builder.add(InlineKeyboardButton(text="B) Поддержка крестьянства...", callback_data="hist-q10-result"))
    builder.add(InlineKeyboardButton(text="C) Организованность и единое командова...", callback_data="hist-q10-result"))
    builder.add(InlineKeyboardButton(text="D) Слабость и разобщенность белых...", callback_data="hist-q10-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q10-result")
async def handle_callback_hist_q10_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Исторический факт зафиксирован!**

**Полные варианты:**

A) Контроль над промышленными центрами

B) Поддержка крестьянства

C) Организованность и единое командование

D) Слабость и разобщенность белых

📊 **Прогресс:** 10/25 вопросов историблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="hist-q11"))
    builder.add(InlineKeyboardButton(text="🤔 Перейти к философии", callback_data="philosophy-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q11")
async def handle_callback_hist_q11(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📜 **ВОПРОС 11/25** (История)

**Главная причина распада СССР:**

Выберите наиболее правильный ответ:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Экономический кризис системы...", callback_data="hist-q11-result"))
    builder.add(InlineKeyboardButton(text="B) Национальные противоречия...", callback_data="hist-q11-result"))
    builder.add(InlineKeyboardButton(text="C) Неэффективность политической систем...", callback_data="hist-q11-result"))
    builder.add(InlineKeyboardButton(text="D) Давление Запада в холодной войне...", callback_data="hist-q11-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q11-result")
async def handle_callback_hist_q11_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Исторический факт зафиксирован!**

**Полные варианты:**

A) Экономический кризис системы

B) Национальные противоречия

C) Неэффективность политической системы

D) Давление Запада в холодной войне

📊 **Прогресс:** 11/25 вопросов историблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="hist-q12"))
    builder.add(InlineKeyboardButton(text="🤔 Перейти к философии", callback_data="philosophy-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q12")
async def handle_callback_hist_q12(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📜 **ВОПРОС 12/25** (История)

**Что привело к началу Ренессанса в Италии?**

Выберите наиболее правильный ответ:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Экономический подъем городов-госуда...", callback_data="hist-q12-result"))
    builder.add(InlineKeyboardButton(text="B) Падение Константинополя и приток уч...", callback_data="hist-q12-result"))
    builder.add(InlineKeyboardButton(text="C) Покровительство церкви искусствам...", callback_data="hist-q12-result"))
    builder.add(InlineKeyboardButton(text="D) Открытие античных текстов...", callback_data="hist-q12-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q12-result")
async def handle_callback_hist_q12_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Исторический факт зафиксирован!**

**Полные варианты:**

A) Экономический подъем городов-государств

B) Падение Константинополя и приток ученых

C) Покровительство церкви искусствам

D) Открытие античных текстов

📊 **Прогресс:** 12/25 вопросов историблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="hist-q13"))
    builder.add(InlineKeyboardButton(text="🤔 Перейти к философии", callback_data="philosophy-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q13")
async def handle_callback_hist_q13(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📜 **ВОПРОС 13/25** (История)

**Главное значение Реформации:**

Выберите наиболее правильный ответ:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Религиозное обновление христианства...", callback_data="hist-q13-result"))
    builder.add(InlineKeyboardButton(text="B) Подрыв власти католической церкви...", callback_data="hist-q13-result"))
    builder.add(InlineKeyboardButton(text="C) Развитие национальных культур...", callback_data="hist-q13-result"))
    builder.add(InlineKeyboardButton(text="D) Стимул к развитию капитализма...", callback_data="hist-q13-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q13-result")
async def handle_callback_hist_q13_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Исторический факт зафиксирован!**

**Полные варианты:**

A) Религиозное обновление христианства

B) Подрыв власти католической церкви

C) Развитие национальных культур

D) Стимул к развитию капитализма

📊 **Прогресс:** 13/25 вопросов историблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="hist-q14"))
    builder.add(InlineKeyboardButton(text="🤔 Перейти к философии", callback_data="philosophy-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q14")
async def handle_callback_hist_q14(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📜 **ВОПРОС 14/25** (История)

**Что определило исход Столетней войны?**

Выберите наиболее правильный ответ:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Военные инновации (артиллерия, такт...", callback_data="hist-q14-result"))
    builder.add(InlineKeyboardButton(text="B) Национальный подъем Франции...", callback_data="hist-q14-result"))
    builder.add(InlineKeyboardButton(text="C) Внутренние проблемы Англии...", callback_data="hist-q14-result"))
    builder.add(InlineKeyboardButton(text="D) Роль Жанны д'Арк в мобилизации фран...", callback_data="hist-q14-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q14-result")
async def handle_callback_hist_q14_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Исторический факт зафиксирован!**

**Полные варианты:**

A) Военные инновации (артиллерия, тактика)

B) Национальный подъем Франции

C) Внутренние проблемы Англии

D) Роль Жанны д'Арк в мобилизации французов

📊 **Прогресс:** 14/25 вопросов историблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="hist-q15"))
    builder.add(InlineKeyboardButton(text="🤔 Перейти к философии", callback_data="philosophy-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q15")
async def handle_callback_hist_q15(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📜 **ВОПРОС 15/25** (История)

**Главная причина крестовых походов:**

Выберите наиболее правильный ответ:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Религиозный фанатизм и желание осво...", callback_data="hist-q15-result"))
    builder.add(InlineKeyboardButton(text="B) Экономические интересы итальянских ...", callback_data="hist-q15-result"))
    builder.add(InlineKeyboardButton(text="C) Стремление рыцарства к наживе и зем...", callback_data="hist-q15-result"))
    builder.add(InlineKeyboardButton(text="D) Попытка церкви объединить христианс...", callback_data="hist-q15-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q15-result")
async def handle_callback_hist_q15_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Исторический факт зафиксирован!**

**Полные варианты:**

A) Религиозный фанатизм и желание освободить Святую землю

B) Экономические интересы итальянских городов

C) Стремление рыцарства к наживе и землям

D) Попытка церкви объединить христианский мир

📊 **Прогресс:** 15/25 вопросов историблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="hist-q16"))
    builder.add(InlineKeyboardButton(text="🤔 Перейти к философии", callback_data="philosophy-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q16")
async def handle_callback_hist_q16(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📜 **ВОПРОС 16/25** (История)

**Что характеризует эпоху абсолютизма?**

Выберите наиболее правильный ответ:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Концентрация власти в руках монарха...", callback_data="hist-q16-result"))
    builder.add(InlineKeyboardButton(text="B) Создание централизованной бюрократи...", callback_data="hist-q16-result"))
    builder.add(InlineKeyboardButton(text="C) Подчинение церкви государству...", callback_data="hist-q16-result"))
    builder.add(InlineKeyboardButton(text="D) Контроль над экономикой (меркантили...", callback_data="hist-q16-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q16-result")
async def handle_callback_hist_q16_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Исторический факт зафиксирован!**

**Полные варианты:**

A) Концентрация власти в руках монарха

B) Создание централизованной бюрократии

C) Подчинение церкви государству

D) Контроль над экономикой (меркантилизм)

📊 **Прогресс:** 16/25 вопросов историблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="hist-q17"))
    builder.add(InlineKeyboardButton(text="🤔 Перейти к философии", callback_data="philosophy-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q17")
async def handle_callback_hist_q17(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📜 **ВОПРОС 17/25** (История)

**Главное последствие промышленной революции:**

Выберите наиболее правильный ответ:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Формирование рабочего класса...", callback_data="hist-q17-result"))
    builder.add(InlineKeyboardButton(text="B) Урбанизация и рост городов...", callback_data="hist-q17-result"))
    builder.add(InlineKeyboardButton(text="C) Революция в транспорте и связи...", callback_data="hist-q17-result"))
    builder.add(InlineKeyboardButton(text="D) Изменение всей социальной структуры...", callback_data="hist-q17-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q17-result")
async def handle_callback_hist_q17_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Исторический факт зафиксирован!**

**Полные варианты:**

A) Формирование рабочего класса

B) Урбанизация и рост городов

C) Революция в транспорте и связи

D) Изменение всей социальной структуры

📊 **Прогресс:** 17/25 вопросов историблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="hist-q18"))
    builder.add(InlineKeyboardButton(text="🤔 Перейти к философии", callback_data="philosophy-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q18")
async def handle_callback_hist_q18(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📜 **ВОПРОС 18/25** (История)

**Что привело к началу холодной войны?**

Выберите наиболее правильный ответ:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Идеологические противоречия СССР и ...", callback_data="hist-q18-result"))
    builder.add(InlineKeyboardButton(text="B) Раздел сфер влияния в Европе...", callback_data="hist-q18-result"))
    builder.add(InlineKeyboardButton(text="C) Ядерное оружие и баланс страха...", callback_data="hist-q18-result"))
    builder.add(InlineKeyboardButton(text="D) Борьба за влияние в третьем мире...", callback_data="hist-q18-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q18-result")
async def handle_callback_hist_q18_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Исторический факт зафиксирован!**

**Полные варианты:**

A) Идеологические противоречия СССР и США

B) Раздел сфер влияния в Европе

C) Ядерное оружие и баланс страха

D) Борьба за влияние в третьем мире

📊 **Прогресс:** 18/25 вопросов историблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="hist-q19"))
    builder.add(InlineKeyboardButton(text="🤔 Перейти к философии", callback_data="philosophy-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q19")
async def handle_callback_hist_q19(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📜 **ВОПРОС 19/25** (История)

**Главная особенность тоталитарных режимов XX века:**

Выберите наиболее правильный ответ:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Тотальный контроль над обществом...", callback_data="hist-q19-result"))
    builder.add(InlineKeyboardButton(text="B) Массовые репрессии и террор...", callback_data="hist-q19-result"))
    builder.add(InlineKeyboardButton(text="C) Идеологическая индоктринация...", callback_data="hist-q19-result"))
    builder.add(InlineKeyboardButton(text="D) Культ личности лидера...", callback_data="hist-q19-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q19-result")
async def handle_callback_hist_q19_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Исторический факт зафиксирован!**

**Полные варианты:**

A) Тотальный контроль над обществом

B) Массовые репрессии и террор

C) Идеологическая индоктринация

D) Культ личности лидера

📊 **Прогресс:** 19/25 вопросов историблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="hist-q20"))
    builder.add(InlineKeyboardButton(text="🤔 Перейти к философии", callback_data="philosophy-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q20")
async def handle_callback_hist_q20(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📜 **ВОПРОС 20/25** (История)

**Что определило быстрое развитие США в XIX веке?**

Выберите наиболее правильный ответ:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Территориальная экспансия на запад...", callback_data="hist-q20-result"))
    builder.add(InlineKeyboardButton(text="B) Массовая иммиграция из Европы...", callback_data="hist-q20-result"))
    builder.add(InlineKeyboardButton(text="C) Природные ресурсы и география...", callback_data="hist-q20-result"))
    builder.add(InlineKeyboardButton(text="D) Политическая стабильность и федерал...", callback_data="hist-q20-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q20-result")
async def handle_callback_hist_q20_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Исторический факт зафиксирован!**

**Полные варианты:**

A) Территориальная экспансия на запад

B) Массовая иммиграция из Европы

C) Природные ресурсы и география

D) Политическая стабильность и федерализм

📊 **Прогресс:** 20/25 вопросов историблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="hist-q21"))
    builder.add(InlineKeyboardButton(text="🤔 Перейти к философии", callback_data="philosophy-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q21")
async def handle_callback_hist_q21(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📜 **ВОПРОС 21/25** (История)

**Главная причина деколонизации Африки:**

Выберите наиболее правильный ответ:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Рост национального самосознания...", callback_data="hist-q21-result"))
    builder.add(InlineKeyboardButton(text="B) Ослабление европейских метрополий...", callback_data="hist-q21-result"))
    builder.add(InlineKeyboardButton(text="C) Поддержка сверхдержав в холодной во...", callback_data="hist-q21-result"))
    builder.add(InlineKeyboardButton(text="D) Экономическая нерентабельность коло...", callback_data="hist-q21-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q21-result")
async def handle_callback_hist_q21_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Исторический факт зафиксирован!**

**Полные варианты:**

A) Рост национального самосознания

B) Ослабление европейских метрополий

C) Поддержка сверхдержав в холодной войне

D) Экономическая нерентабельность колоний

📊 **Прогресс:** 21/25 вопросов историблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="hist-q22"))
    builder.add(InlineKeyboardButton(text="🤔 Перейти к философии", callback_data="philosophy-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q22")
async def handle_callback_hist_q22(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📜 **ВОПРОС 22/25** (История)

**Что характеризует эпоху Великого переселения народов?**

Выберите наиболее правильный ответ:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Миграции племен под давлением гунно...", callback_data="hist-q22-result"))
    builder.add(InlineKeyboardButton(text="B) Климатические изменения и голод...", callback_data="hist-q22-result"))
    builder.add(InlineKeyboardButton(text="C) Поиск новых плодородных земель...", callback_data="hist-q22-result"))
    builder.add(InlineKeyboardButton(text="D) Ослабление Римской империи...", callback_data="hist-q22-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q22-result")
async def handle_callback_hist_q22_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Исторический факт зафиксирован!**

**Полные варианты:**

A) Миграции племен под давлением гуннов

B) Климатические изменения и голод

C) Поиск новых плодородных земель

D) Ослабление Римской империи

📊 **Прогресс:** 22/25 вопросов историблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="hist-q23"))
    builder.add(InlineKeyboardButton(text="🤔 Перейти к философии", callback_data="philosophy-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q23")
async def handle_callback_hist_q23(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📜 **ВОПРОС 23/25** (История)

**Главное значение изобретения книгопечатания:**

Выберите наиболее правильный ответ:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Демократизация знаний...", callback_data="hist-q23-result"))
    builder.add(InlineKeyboardButton(text="B) Стандартизация языков...", callback_data="hist-q23-result"))
    builder.add(InlineKeyboardButton(text="C) Ускорение распространения идей...", callback_data="hist-q23-result"))
    builder.add(InlineKeyboardButton(text="D) Революция в образовании...", callback_data="hist-q23-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q23-result")
async def handle_callback_hist_q23_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Исторический факт зафиксирован!**

**Полные варианты:**

A) Демократизация знаний

B) Стандартизация языков

C) Ускорение распространения идей

D) Революция в образовании

📊 **Прогресс:** 23/25 вопросов историблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="hist-q24"))
    builder.add(InlineKeyboardButton(text="🤔 Перейти к философии", callback_data="philosophy-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q24")
async def handle_callback_hist_q24(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📜 **ВОПРОС 24/25** (История)

**Что привело к кризису средневекового общества?**

Выберите наиболее правильный ответ:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Демографический кризис (чума, голод...", callback_data="hist-q24-result"))
    builder.add(InlineKeyboardButton(text="B) Рост городов и торговли...", callback_data="hist-q24-result"))
    builder.add(InlineKeyboardButton(text="C) Ослабление феодальной системы...", callback_data="hist-q24-result"))
    builder.add(InlineKeyboardButton(text="D) Климатические изменения (малый ледн...", callback_data="hist-q24-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q24-result")
async def handle_callback_hist_q24_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Исторический факт зафиксирован!**

**Полные варианты:**

A) Демографический кризис (чума, голод)

B) Рост городов и торговли

C) Ослабление феодальной системы

D) Климатические изменения (малый ледниковый период)

📊 **Прогресс:** 24/25 вопросов историблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="hist-q25"))
    builder.add(InlineKeyboardButton(text="🤔 Перейти к философии", callback_data="philosophy-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q25")
async def handle_callback_hist_q25(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📜 **ВОПРОС 25/25** (История)

**Главный урок истории XX века:**

Выберите наиболее правильный ответ:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Опасность тоталитаризма и диктатур...", callback_data="hist-q25-result"))
    builder.add(InlineKeyboardButton(text="B) Необходимость международного сотруд...", callback_data="hist-q25-result"))
    builder.add(InlineKeyboardButton(text="C) Важность защиты прав человека...", callback_data="hist-q25-result"))
    builder.add(InlineKeyboardButton(text="D) Взаимозависимость современного мира...", callback_data="hist-q25-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "hist-q25-result")
async def handle_callback_hist_q25_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Исторический факт зафиксирован!**

**Полные варианты:**

A) Опасность тоталитаризма и диктатур

B) Необходимость международного сотрудничества

C) Важность защиты прав человека

D) Взаимозависимость современного мира

📊 **Прогресс:** 25/25 вопросов историблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🤔 К блоку Философия", callback_data="philosophy-intro"))
    builder.add(InlineKeyboardButton(text="🤔 Перейти к философии", callback_data="philosophy-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q1")
async def handle_callback_phil_q1(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🤔 **ВОПРОС 1/15** (Философия)

**Что является основой моральных суждений?**

Выберите ваш философский взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Врожденные моральные интуиции...", callback_data="phil-q1-result"))
    builder.add(InlineKeyboardButton(text="B) Последствия действий (утилитар...", callback_data="phil-q1-result"))
    builder.add(InlineKeyboardButton(text="C) Долг и универсальные принципы...", callback_data="phil-q1-result"))
    builder.add(InlineKeyboardButton(text="D) Социальные соглашения и культу...", callback_data="phil-q1-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "sociology-intro")
async def handle_callback_sociology_intro(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🌍 **БЛОК Г: СОЦИОЛОГИЯ**

**Изучаем ваши взгляды на общество и социальные процессы**

В этом блоке 20 вопросов о:
• Социальном неравенстве и стратификации
• Глобализации и культурных изменениях
• Межгрупповых отношениях
• Технологиях и будущем общества
• Социальных проблемах современности

**Готовы к социологическому анализу?**"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🌍 Начать социоблок", callback_data="soc-q1"))
    builder.add(InlineKeyboardButton(text="📊 Перейти к результатам", callback_data="final-results"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q1-result")
async def handle_callback_phil_q1_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Философская позиция учтена!**

**Варианты размышления:**

A) Врожденные моральные интуиции

B) Последствия действий (утилитаризм)

C) Долг и универсальные принципы

D) Социальные соглашения и культура

📊 **Прогресс:** 1/15 вопросов филблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="phil-q2"))
    builder.add(InlineKeyboardButton(text="🌍 Перейти к социологии", callback_data="sociology-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q2")
async def handle_callback_phil_q2(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🤔 **ВОПРОС 2/15** (Философия)

**Что такое реальность в конечном счете?**

Выберите ваш философский взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Материя и физические процессы...", callback_data="phil-q2-result"))
    builder.add(InlineKeyboardButton(text="B) Идеи и ментальные конструкты...", callback_data="phil-q2-result"))
    builder.add(InlineKeyboardButton(text="C) Энергия и информация...", callback_data="phil-q2-result"))
    builder.add(InlineKeyboardButton(text="D) Непознаваемая вещь-в-себе...", callback_data="phil-q2-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q2-result")
async def handle_callback_phil_q2_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Философская позиция учтена!**

**Варианты размышления:**

A) Материя и физические процессы

B) Идеи и ментальные конструкты

C) Энергия и информация

D) Непознаваемая вещь-в-себе

📊 **Прогресс:** 2/15 вопросов филблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="phil-q3"))
    builder.add(InlineKeyboardButton(text="🌍 Перейти к социологии", callback_data="sociology-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q3")
async def handle_callback_phil_q3(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🤔 **ВОПРОС 3/15** (Философия)

**Есть ли у человека свобода воли?**

Выберите ваш философский взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Да, человек полностью свободен...", callback_data="phil-q3-result"))
    builder.add(InlineKeyboardButton(text="B) Ограниченная свобода в рамках ...", callback_data="phil-q3-result"))
    builder.add(InlineKeyboardButton(text="C) Иллюзия свободы, все предопред...", callback_data="phil-q3-result"))
    builder.add(InlineKeyboardButton(text="D) Свобода существует на разных у...", callback_data="phil-q3-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q3-result")
async def handle_callback_phil_q3_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Философская позиция учтена!**

**Варианты размышления:**

A) Да, человек полностью свободен в выборе

B) Ограниченная свобода в рамках причинности

C) Иллюзия свободы, все предопределено

D) Свобода существует на разных уровнях реальности

📊 **Прогресс:** 3/15 вопросов филблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="phil-q4"))
    builder.add(InlineKeyboardButton(text="🌍 Перейти к социологии", callback_data="sociology-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q4")
async def handle_callback_phil_q4(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🤔 **ВОПРОС 4/15** (Философия)

**В чем смысл человеческого существования?**

Выберите ваш философский взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) В достижении счастья и удоволь...", callback_data="phil-q4-result"))
    builder.add(InlineKeyboardButton(text="B) В реализации потенциала и само...", callback_data="phil-q4-result"))
    builder.add(InlineKeyboardButton(text="C) В служении высшим идеалам...", callback_data="phil-q4-result"))
    builder.add(InlineKeyboardButton(text="D) Смысл создается самим человеко...", callback_data="phil-q4-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q4-result")
async def handle_callback_phil_q4_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Философская позиция учтена!**

**Варианты размышления:**

A) В достижении счастья и удовольствия

B) В реализации потенциала и самоактуализации

C) В служении высшим идеалам

D) Смысл создается самим человеком

📊 **Прогресс:** 4/15 вопросов филблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="phil-q5"))
    builder.add(InlineKeyboardButton(text="🌍 Перейти к социологии", callback_data="sociology-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q5")
async def handle_callback_phil_q5(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🤔 **ВОПРОС 5/15** (Философия)

**Как мы можем познать истину?**

Выберите ваш философский взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Через чувственный опыт и наблю...", callback_data="phil-q5-result"))
    builder.add(InlineKeyboardButton(text="B) Через разум и логическое мышле...", callback_data="phil-q5-result"))
    builder.add(InlineKeyboardButton(text="C) Через интуицию и откровение...", callback_data="phil-q5-result"))
    builder.add(InlineKeyboardButton(text="D) Истина относительна и зависит ...", callback_data="phil-q5-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q5-result")
async def handle_callback_phil_q5_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Философская позиция учтена!**

**Варианты размышления:**

A) Через чувственный опыт и наблюдение

B) Через разум и логическое мышление

C) Через интуицию и откровение

D) Истина относительна и зависит от контекста

📊 **Прогресс:** 5/15 вопросов филблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="phil-q6"))
    builder.add(InlineKeyboardButton(text="🌍 Перейти к социологии", callback_data="sociology-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q6")
async def handle_callback_phil_q6(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🤔 **ВОПРОС 6/15** (Философия)

**Что оправдывает политическую власть?**

Выберите ваш философский взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Общественный договор и согласи...", callback_data="phil-q6-result"))
    builder.add(InlineKeyboardButton(text="B) Естественное право и справедли...", callback_data="phil-q6-result"))
    builder.add(InlineKeyboardButton(text="C) Эффективность в обеспечении по...", callback_data="phil-q6-result"))
    builder.add(InlineKeyboardButton(text="D) Традиция и историческая легити...", callback_data="phil-q6-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q6-result")
async def handle_callback_phil_q6_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Философская позиция учтена!**

**Варианты размышления:**

A) Общественный договор и согласие граждан

B) Естественное право и справедливость

C) Эффективность в обеспечении порядка

D) Традиция и историческая легитимность

📊 **Прогресс:** 6/15 вопросов филблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="phil-q7"))
    builder.add(InlineKeyboardButton(text="🌍 Перейти к социологии", callback_data="sociology-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q7")
async def handle_callback_phil_q7(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🤔 **ВОПРОС 7/15** (Философия)

**Существует ли объективная мораль?**

Выберите ваш философский взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Да, есть универсальные моральн...", callback_data="phil-q7-result"))
    builder.add(InlineKeyboardButton(text="B) Мораль относительна для разных...", callback_data="phil-q7-result"))
    builder.add(InlineKeyboardButton(text="C) Мораль - это эволюционная адап...", callback_data="phil-q7-result"))
    builder.add(InlineKeyboardButton(text="D) Мораль - социальная конструкци...", callback_data="phil-q7-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q7-result")
async def handle_callback_phil_q7_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Философская позиция учтена!**

**Варианты размышления:**

A) Да, есть универсальные моральные истины

B) Мораль относительна для разных культур

C) Мораль - это эволюционная адаптация

D) Мораль - социальная конструкция

📊 **Прогресс:** 7/15 вопросов филблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="phil-q8"))
    builder.add(InlineKeyboardButton(text="🌍 Перейти к социологии", callback_data="sociology-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q8")
async def handle_callback_phil_q8(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🤔 **ВОПРОС 8/15** (Философия)

**Что такое справедливость?**

Выберите ваш философский взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Равенство возможностей...", callback_data="phil-q8-result"))
    builder.add(InlineKeyboardButton(text="B) Справедливое распределение рес...", callback_data="phil-q8-result"))
    builder.add(InlineKeyboardButton(text="C) Воздаяние по заслугам...", callback_data="phil-q8-result"))
    builder.add(InlineKeyboardButton(text="D) Максимизация общего блага...", callback_data="phil-q8-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q8-result")
async def handle_callback_phil_q8_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Философская позиция учтена!**

**Варианты размышления:**

A) Равенство возможностей

B) Справедливое распределение ресурсов

C) Воздаяние по заслугам

D) Максимизация общего блага

📊 **Прогресс:** 8/15 вопросов филблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="phil-q9"))
    builder.add(InlineKeyboardButton(text="🌍 Перейти к социологии", callback_data="sociology-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q9")
async def handle_callback_phil_q9(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🤔 **ВОПРОС 9/15** (Философия)

**Как относиться к смерти?**

Выберите ваш философский взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Принимать как естественный про...", callback_data="phil-q9-result"))
    builder.add(InlineKeyboardButton(text="B) Бороться против неизбежности...", callback_data="phil-q9-result"))
    builder.add(InlineKeyboardButton(text="C) Видеть в ней переход к иному б...", callback_data="phil-q9-result"))
    builder.add(InlineKeyboardButton(text="D) Использовать как мотивацию для...", callback_data="phil-q9-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q9-result")
async def handle_callback_phil_q9_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Философская позиция учтена!**

**Варианты размышления:**

A) Принимать как естественный процесс

B) Бороться против неизбежности

C) Видеть в ней переход к иному бытию

D) Использовать как мотивацию для жизни

📊 **Прогресс:** 9/15 вопросов филблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="phil-q10"))
    builder.add(InlineKeyboardButton(text="🌍 Перейти к социологии", callback_data="sociology-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q10")
async def handle_callback_phil_q10(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🤔 **ВОПРОС 10/15** (Философия)

**Что важнее: индивидуальность или общество?**

Выберите ваш философский взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Права и свободы индивида приор...", callback_data="phil-q10-result"))
    builder.add(InlineKeyboardButton(text="B) Баланс между личным и обществе...", callback_data="phil-q10-result"))
    builder.add(InlineKeyboardButton(text="C) Общественное благо важнее личн...", callback_data="phil-q10-result"))
    builder.add(InlineKeyboardButton(text="D) Индивид и общество взаимно опр...", callback_data="phil-q10-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q10-result")
async def handle_callback_phil_q10_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Философская позиция учтена!**

**Варианты размышления:**

A) Права и свободы индивида приоритетны

B) Баланс между личным и общественным

C) Общественное благо важнее личного

D) Индивид и общество взаимно определяют друг друга

📊 **Прогресс:** 10/15 вопросов филблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="phil-q11"))
    builder.add(InlineKeyboardButton(text="🌍 Перейти к социологии", callback_data="sociology-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q11")
async def handle_callback_phil_q11(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🤔 **ВОПРОС 11/15** (Философия)

**Существует ли прогресс в истории?**

Выберите ваш философский взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Да, человечество движется к лу...", callback_data="phil-q11-result"))
    builder.add(InlineKeyboardButton(text="B) Прогресс есть, но не линейный...", callback_data="phil-q11-result"))
    builder.add(InlineKeyboardButton(text="C) Циклическое развитие без прогр...", callback_data="phil-q11-result"))
    builder.add(InlineKeyboardButton(text="D) История случайна и бессмысленн...", callback_data="phil-q11-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q11-result")
async def handle_callback_phil_q11_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Философская позиция учтена!**

**Варианты размышления:**

A) Да, человечество движется к лучшему

B) Прогресс есть, но не линейный

C) Циклическое развитие без прогресса

D) История случайна и бессмысленна

📊 **Прогресс:** 11/15 вопросов филблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="phil-q12"))
    builder.add(InlineKeyboardButton(text="🌍 Перейти к социологии", callback_data="sociology-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q12")
async def handle_callback_phil_q12(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🤔 **ВОПРОС 12/15** (Философия)

**Что делает жизнь стоящей?**

Выберите ваш философский взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Удовольствие и наслаждение...", callback_data="phil-q12-result"))
    builder.add(InlineKeyboardButton(text="B) Достижения и признание...", callback_data="phil-q12-result"))
    builder.add(InlineKeyboardButton(text="C) Любовь и отношения...", callback_data="phil-q12-result"))
    builder.add(InlineKeyboardButton(text="D) Познание и понимание...", callback_data="phil-q12-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q12-result")
async def handle_callback_phil_q12_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Философская позиция учтена!**

**Варианты размышления:**

A) Удовольствие и наслаждение

B) Достижения и признание

C) Любовь и отношения

D) Познание и понимание

📊 **Прогресс:** 12/15 вопросов филблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="phil-q13"))
    builder.add(InlineKeyboardButton(text="🌍 Перейти к социологии", callback_data="sociology-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q13")
async def handle_callback_phil_q13(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🤔 **ВОПРОС 13/15** (Философия)

**Как решать этические дилеммы?**

Выберите ваш философский взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Руководствоваться четкими прин...", callback_data="phil-q13-result"))
    builder.add(InlineKeyboardButton(text="B) Анализировать последствия...", callback_data="phil-q13-result"))
    builder.add(InlineKeyboardButton(text="C) Доверять моральной интуиции...", callback_data="phil-q13-result"))
    builder.add(InlineKeyboardButton(text="D) Искать компромисс и баланс...", callback_data="phil-q13-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q13-result")
async def handle_callback_phil_q13_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Философская позиция учтена!**

**Варианты размышления:**

A) Руководствоваться четкими принципами

B) Анализировать последствия

C) Доверять моральной интуиции

D) Искать компромисс и баланс

📊 **Прогресс:** 13/15 вопросов филблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="phil-q14"))
    builder.add(InlineKeyboardButton(text="🌍 Перейти к социологии", callback_data="sociology-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q14")
async def handle_callback_phil_q14(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🤔 **ВОПРОС 14/15** (Философия)

**Что такое красота?**

Выберите ваш философский взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Объективное свойство предметов...", callback_data="phil-q14-result"))
    builder.add(InlineKeyboardButton(text="B) Субъективное восприятие...", callback_data="phil-q14-result"))
    builder.add(InlineKeyboardButton(text="C) Культурно обусловленный констр...", callback_data="phil-q14-result"))
    builder.add(InlineKeyboardButton(text="D) Гармония и совершенство формы...", callback_data="phil-q14-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q14-result")
async def handle_callback_phil_q14_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Философская позиция учтена!**

**Варианты размышления:**

A) Объективное свойство предметов

B) Субъективное восприятие

C) Культурно обусловленный конструкт

D) Гармония и совершенство формы

📊 **Прогресс:** 14/15 вопросов филблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="phil-q15"))
    builder.add(InlineKeyboardButton(text="🌍 Перейти к социологии", callback_data="sociology-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q15")
async def handle_callback_phil_q15(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🤔 **ВОПРОС 15/15** (Философия)

**Каково будущее человечества?**

Выберите ваш философский взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Технологическое совершенствова...", callback_data="phil-q15-result"))
    builder.add(InlineKeyboardButton(text="B) Духовное развитие и просветлен...", callback_data="phil-q15-result"))
    builder.add(InlineKeyboardButton(text="C) Слияние с искусственным интелл...", callback_data="phil-q15-result"))
    builder.add(InlineKeyboardButton(text="D) Циклы подъема и упадка цивилиз...", callback_data="phil-q15-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "phil-q15-result")
async def handle_callback_phil_q15_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Философская позиция учтена!**

**Варианты размышления:**

A) Технологическое совершенствование

B) Духовное развитие и просветление

C) Слияние с искусственным интеллектом

D) Циклы подъема и упадка цивилизаций

📊 **Прогресс:** 15/15 вопросов филблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🌍 К блоку Социология", callback_data="sociology-intro"))
    builder.add(InlineKeyboardButton(text="🌍 Перейти к социологии", callback_data="sociology-intro"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q1")
async def handle_callback_soc_q1(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🌍 **ВОПРОС 1/20** (Социология)

**Главная причина социального неравенства:**

Выберите ваш социологический взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Различия в способностях и тала...", callback_data="soc-q1-result"))
    builder.add(InlineKeyboardButton(text="B) Структурные особенности эконом...", callback_data="soc-q1-result"))
    builder.add(InlineKeyboardButton(text="C) Культурные и образовательные р...", callback_data="soc-q1-result"))
    builder.add(InlineKeyboardButton(text="D) Исторические факторы и наследи...", callback_data="soc-q1-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "final-results")
async def handle_callback_final_results(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🎉 **ПОЗДРАВЛЯЕМ С ЗАВЕРШЕНИЕМ УЛЬТРА-КОМПЛЕКСНОГО ОПРОСА!**

📊 **ВАШИ РЕЗУЛЬТАТЫ:**

🗳️ **Политический профиль:** Анализируется...
📜 **Историческая компетентность:** Оценивается...
🤔 **Философские взгляды:** Обрабатываются...
🌍 **Социологические позиции:** Систематизируются...

⏱️ **Время прохождения:** Впечатляющая стойкость!
🎯 **Полнота ответов:** 80+ вопросов пройдено

**Подробный анализ готовится...**"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📊 Детальный анализ", callback_data="detailed-analysis"))
    builder.add(InlineKeyboardButton(text="📚 Рекомендации", callback_data="recommendations"))
    builder.add(InlineKeyboardButton(text="🔄 Пройти снова", callback_data="start-poll"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q1-result")
async def handle_callback_soc_q1_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Социологическая позиция зафиксирована!**

**Варианты анализа:**

A) Различия в способностях и таланте

B) Структурные особенности экономической системы

C) Культурные и образовательные различия

D) Исторические факторы и наследие прошлого

📊 **Прогресс:** 1/20 вопросов социоблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="soc-q2"))
    builder.add(InlineKeyboardButton(text="📊 К результатам", callback_data="final-results"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q2")
async def handle_callback_soc_q2(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🌍 **ВОПРОС 2/20** (Социология)

**Как глобализация влияет на местные культуры?**

Выберите ваш социологический взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Ведет к культурной гомогенизац...", callback_data="soc-q2-result"))
    builder.add(InlineKeyboardButton(text="B) Создает новые формы культурног...", callback_data="soc-q2-result"))
    builder.add(InlineKeyboardButton(text="C) Усиливает культурные различия ...", callback_data="soc-q2-result"))
    builder.add(InlineKeyboardButton(text="D) Дает возможность культурам раз...", callback_data="soc-q2-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q2-result")
async def handle_callback_soc_q2_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Социологическая позиция зафиксирована!**

**Варианты анализа:**

A) Ведет к культурной гомогенизации

B) Создает новые формы культурного синтеза

C) Усиливает культурные различия и сопротивление

D) Дает возможность культурам развиваться

📊 **Прогресс:** 2/20 вопросов социоблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="soc-q3"))
    builder.add(InlineKeyboardButton(text="📊 К результатам", callback_data="final-results"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q3")
async def handle_callback_soc_q3(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🌍 **ВОПРОС 3/20** (Социология)

**Что определяет социальную мобильность?**

Выберите ваш социологический взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Личные усилия и способности...", callback_data="soc-q3-result"))
    builder.add(InlineKeyboardButton(text="B) Образование и человеческий кап...", callback_data="soc-q3-result"))
    builder.add(InlineKeyboardButton(text="C) Социальный капитал и связи...", callback_data="soc-q3-result"))
    builder.add(InlineKeyboardButton(text="D) Структурные возможности общест...", callback_data="soc-q3-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q3-result")
async def handle_callback_soc_q3_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Социологическая позиция зафиксирована!**

**Варианты анализа:**

A) Личные усилия и способности

B) Образование и человеческий капитал

C) Социальный капитал и связи

D) Структурные возможности общества

📊 **Прогресс:** 3/20 вопросов социоблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="soc-q4"))
    builder.add(InlineKeyboardButton(text="📊 К результатам", callback_data="final-results"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q4")
async def handle_callback_soc_q4(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🌍 **ВОПРОС 4/20** (Социология)

**Главная функция семьи в современном обществе:**

Выберите ваш социологический взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Экономическая поддержка и безо...", callback_data="soc-q4-result"))
    builder.add(InlineKeyboardButton(text="B) Социализация детей...", callback_data="soc-q4-result"))
    builder.add(InlineKeyboardButton(text="C) Эмоциональная поддержка и близ...", callback_data="soc-q4-result"))
    builder.add(InlineKeyboardButton(text="D) Воспроизводство культурных цен...", callback_data="soc-q4-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q4-result")
async def handle_callback_soc_q4_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Социологическая позиция зафиксирована!**

**Варианты анализа:**

A) Экономическая поддержка и безопасность

B) Социализация детей

C) Эмоциональная поддержка и близость

D) Воспроизводство культурных ценностей

📊 **Прогресс:** 4/20 вопросов социоблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="soc-q5"))
    builder.add(InlineKeyboardButton(text="📊 К результатам", callback_data="final-results"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q5")
async def handle_callback_soc_q5(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🌍 **ВОПРОС 5/20** (Социология)

**Как технологии меняют социальные отношения?**

Выберите ваш социологический взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Ослабляют реальные человечески...", callback_data="soc-q5-result"))
    builder.add(InlineKeyboardButton(text="B) Создают новые формы коммуникац...", callback_data="soc-q5-result"))
    builder.add(InlineKeyboardButton(text="C) Углубляют цифровое неравенство...", callback_data="soc-q5-result"))
    builder.add(InlineKeyboardButton(text="D) Трансформируют природу работы ...", callback_data="soc-q5-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q5-result")
async def handle_callback_soc_q5_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Социологическая позиция зафиксирована!**

**Варианты анализа:**

A) Ослабляют реальные человеческие связи

B) Создают новые формы коммуникации

C) Углубляют цифровое неравенство

D) Трансформируют природу работы и досуга

📊 **Прогресс:** 5/20 вопросов социоблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="soc-q6"))
    builder.add(InlineKeyboardButton(text="📊 К результатам", callback_data="final-results"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q6")
async def handle_callback_soc_q6(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🌍 **ВОПРОС 6/20** (Социология)

**Что характеризует современную урбанизацию?**

Выберите ваш социологический взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Рост мегаполисов и агломераций...", callback_data="soc-q6-result"))
    builder.add(InlineKeyboardButton(text="B) Социальная сегрегация в города...", callback_data="soc-q6-result"))
    builder.add(InlineKeyboardButton(text="C) Изменение образа жизни и ценно...", callback_data="soc-q6-result"))
    builder.add(InlineKeyboardButton(text="D) Экологические и инфраструктурн...", callback_data="soc-q6-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q6-result")
async def handle_callback_soc_q6_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Социологическая позиция зафиксирована!**

**Варианты анализа:**

A) Рост мегаполисов и агломераций

B) Социальная сегрегация в городах

C) Изменение образа жизни и ценностей

D) Экологические и инфраструктурные проблемы

📊 **Прогресс:** 6/20 вопросов социоблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="soc-q7"))
    builder.add(InlineKeyboardButton(text="📊 К результатам", callback_data="final-results"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q7")
async def handle_callback_soc_q7(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🌍 **ВОПРОС 7/20** (Социология)

**Главная причина этнических конфликтов:**

Выберите ваш социологический взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Культурные и религиозные разли...", callback_data="soc-q7-result"))
    builder.add(InlineKeyboardButton(text="B) Экономическая конкуренция за р...", callback_data="soc-q7-result"))
    builder.add(InlineKeyboardButton(text="C) Политические манипуляции элит...", callback_data="soc-q7-result"))
    builder.add(InlineKeyboardButton(text="D) Исторические травмы и память...", callback_data="soc-q7-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q7-result")
async def handle_callback_soc_q7_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Социологическая позиция зафиксирована!**

**Варианты анализа:**

A) Культурные и религиозные различия

B) Экономическая конкуренция за ресурсы

C) Политические манипуляции элит

D) Исторические травмы и память

📊 **Прогресс:** 7/20 вопросов социоблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="soc-q8"))
    builder.add(InlineKeyboardButton(text="📊 К результатам", callback_data="final-results"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q8")
async def handle_callback_soc_q8(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🌍 **ВОПРОС 8/20** (Социология)

**Как меняется роль религии в обществе?**

Выберите ваш социологический взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Снижается под влиянием секуляр...", callback_data="soc-q8-result"))
    builder.add(InlineKeyboardButton(text="B) Трансформируется, но остается ...", callback_data="soc-q8-result"))
    builder.add(InlineKeyboardButton(text="C) Возрождается в новых формах...", callback_data="soc-q8-result"))
    builder.add(InlineKeyboardButton(text="D) Становится источником конфликт...", callback_data="soc-q8-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q8-result")
async def handle_callback_soc_q8_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Социологическая позиция зафиксирована!**

**Варианты анализа:**

A) Снижается под влиянием секуляризации

B) Трансформируется, но остается важной

C) Возрождается в новых формах

D) Становится источником конфликтов

📊 **Прогресс:** 8/20 вопросов социоблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="soc-q9"))
    builder.add(InlineKeyboardButton(text="📊 К результатам", callback_data="final-results"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q9")
async def handle_callback_soc_q9(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🌍 **ВОПРОС 9/20** (Социология)

**Что характеризует постиндустриальное общество?**

Выберите ваш социологический взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Доминирование сферы услуг...", callback_data="soc-q9-result"))
    builder.add(InlineKeyboardButton(text="B) Знания как основной ресурс...", callback_data="soc-q9-result"))
    builder.add(InlineKeyboardButton(text="C) Изменение классовой структуры...", callback_data="soc-q9-result"))
    builder.add(InlineKeyboardButton(text="D) Новые формы социальной организ...", callback_data="soc-q9-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q9-result")
async def handle_callback_soc_q9_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Социологическая позиция зафиксирована!**

**Варианты анализа:**

A) Доминирование сферы услуг

B) Знания как основной ресурс

C) Изменение классовой структуры

D) Новые формы социальной организации

📊 **Прогресс:** 9/20 вопросов социоблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="soc-q10"))
    builder.add(InlineKeyboardButton(text="📊 К результатам", callback_data="final-results"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q10")
async def handle_callback_soc_q10(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🌍 **ВОПРОС 10/20** (Социология)

**Главная проблема старения населения:**

Выберите ваш социологический взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Нагрузка на пенсионную систему...", callback_data="soc-q10-result"))
    builder.add(InlineKeyboardButton(text="B) Снижение экономической активно...", callback_data="soc-q10-result"))
    builder.add(InlineKeyboardButton(text="C) Изменение структуры потреблени...", callback_data="soc-q10-result"))
    builder.add(InlineKeyboardButton(text="D) Межпоколенческие конфликты...", callback_data="soc-q10-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q10-result")
async def handle_callback_soc_q10_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Социологическая позиция зафиксирована!**

**Варианты анализа:**

A) Нагрузка на пенсионную систему

B) Снижение экономической активности

C) Изменение структуры потребления

D) Межпоколенческие конфликты

📊 **Прогресс:** 10/20 вопросов социоблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="soc-q11"))
    builder.add(InlineKeyboardButton(text="📊 К результатам", callback_data="final-results"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q11")
async def handle_callback_soc_q11(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🌍 **ВОПРОС 11/20** (Социология)

**Как социальные сети влияют на общественное мнение?**

Выберите ваш социологический взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Создают информационные пузыри...", callback_data="soc-q11-result"))
    builder.add(InlineKeyboardButton(text="B) Демократизируют доступ к инфор...", callback_data="soc-q11-result"))
    builder.add(InlineKeyboardButton(text="C) Способствуют поляризации взгля...", callback_data="soc-q11-result"))
    builder.add(InlineKeyboardButton(text="D) Ускоряют распространение идей...", callback_data="soc-q11-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q11-result")
async def handle_callback_soc_q11_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Социологическая позиция зафиксирована!**

**Варианты анализа:**

A) Создают информационные пузыри

B) Демократизируют доступ к информации

C) Способствуют поляризации взглядов

D) Ускоряют распространение идей

📊 **Прогресс:** 11/20 вопросов социоблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="soc-q12"))
    builder.add(InlineKeyboardButton(text="📊 К результатам", callback_data="final-results"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q12")
async def handle_callback_soc_q12(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🌍 **ВОПРОС 12/20** (Социология)

**Что определяет гендерное неравенство?**

Выберите ваш социологический взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Биологические различия...", callback_data="soc-q12-result"))
    builder.add(InlineKeyboardButton(text="B) Культурные стереотипы и традиц...", callback_data="soc-q12-result"))
    builder.add(InlineKeyboardButton(text="C) Структурные барьеры в обществе...", callback_data="soc-q12-result"))
    builder.add(InlineKeyboardButton(text="D) Различия в человеческом капита...", callback_data="soc-q12-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q12-result")
async def handle_callback_soc_q12_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Социологическая позиция зафиксирована!**

**Варианты анализа:**

A) Биологические различия

B) Культурные стереотипы и традиции

C) Структурные барьеры в обществе

D) Различия в человеческом капитале

📊 **Прогресс:** 12/20 вопросов социоблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="soc-q13"))
    builder.add(InlineKeyboardButton(text="📊 К результатам", callback_data="final-results"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q13")
async def handle_callback_soc_q13(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🌍 **ВОПРОС 13/20** (Социология)

**Главный вызов миграции для принимающих обществ:**

Выберите ваш социологический взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Экономическая конкуренция с ме...", callback_data="soc-q13-result"))
    builder.add(InlineKeyboardButton(text="B) Культурная интеграция мигранто...", callback_data="soc-q13-result"))
    builder.add(InlineKeyboardButton(text="C) Нагрузка на социальные системы...", callback_data="soc-q13-result"))
    builder.add(InlineKeyboardButton(text="D) Изменение демографического сос...", callback_data="soc-q13-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q13-result")
async def handle_callback_soc_q13_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Социологическая позиция зафиксирована!**

**Варианты анализа:**

A) Экономическая конкуренция с местными

B) Культурная интеграция мигрантов

C) Нагрузка на социальные системы

D) Изменение демографического состава

📊 **Прогресс:** 13/20 вопросов социоблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="soc-q14"))
    builder.add(InlineKeyboardButton(text="📊 К результатам", callback_data="final-results"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q14")
async def handle_callback_soc_q14(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🌍 **ВОПРОС 14/20** (Социология)

**Как образование влияет на социальную структуру?**

Выберите ваш социологический взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Способствует социальной мобиль...", callback_data="soc-q14-result"))
    builder.add(InlineKeyboardButton(text="B) Воспроизводит существующее нер...", callback_data="soc-q14-result"))
    builder.add(InlineKeyboardButton(text="C) Создает новые формы стратифика...", callback_data="soc-q14-result"))
    builder.add(InlineKeyboardButton(text="D) Формирует культурный капитал э...", callback_data="soc-q14-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q14-result")
async def handle_callback_soc_q14_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Социологическая позиция зафиксирована!**

**Варианты анализа:**

A) Способствует социальной мобильности

B) Воспроизводит существующее неравенство

C) Создает новые формы стратификации

D) Формирует культурный капитал элит

📊 **Прогресс:** 14/20 вопросов социоблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="soc-q15"))
    builder.add(InlineKeyboardButton(text="📊 К результатам", callback_data="final-results"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q15")
async def handle_callback_soc_q15(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🌍 **ВОПРОС 15/20** (Социология)

**Что характеризует современный рынок труда?**

Выберите ваш социологический взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Рост прекариата и нестабильной...", callback_data="soc-q15-result"))
    builder.add(InlineKeyboardButton(text="B) Автоматизация и исчезновение п...", callback_data="soc-q15-result"))
    builder.add(InlineKeyboardButton(text="C) Новые формы трудовых отношений...", callback_data="soc-q15-result"))
    builder.add(InlineKeyboardButton(text="D) Растущее значение креативности...", callback_data="soc-q15-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q15-result")
async def handle_callback_soc_q15_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Социологическая позиция зафиксирована!**

**Варианты анализа:**

A) Рост прекариата и нестабильной занятости

B) Автоматизация и исчезновение профессий

C) Новые формы трудовых отношений

D) Растущее значение креативности и инноваций

📊 **Прогресс:** 15/20 вопросов социоблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="soc-q16"))
    builder.add(InlineKeyboardButton(text="📊 К результатам", callback_data="final-results"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q16")
async def handle_callback_soc_q16(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🌍 **ВОПРОС 16/20** (Социология)

**Главная особенность потребительского общества:**

Выберите ваш социологический взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Культ материального потреблени...", callback_data="soc-q16-result"))
    builder.add(InlineKeyboardButton(text="B) Формирование идентичности чере...", callback_data="soc-q16-result"))
    builder.add(InlineKeyboardButton(text="C) Экологические последствия потр...", callback_data="soc-q16-result"))
    builder.add(InlineKeyboardButton(text="D) Маркетинг и манипулирование же...", callback_data="soc-q16-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q16-result")
async def handle_callback_soc_q16_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Социологическая позиция зафиксирована!**

**Варианты анализа:**

A) Культ материального потребления

B) Формирование идентичности через потребление

C) Экологические последствия потребления

D) Маркетинг и манипулирование желаниями

📊 **Прогресс:** 16/20 вопросов социоблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="soc-q17"))
    builder.add(InlineKeyboardButton(text="📊 К результатам", callback_data="final-results"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q17")
async def handle_callback_soc_q17(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🌍 **ВОПРОС 17/20** (Социология)

**Как меняется природа социальных движений?**

Выберите ваш социологический взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) От классовых к постматериалист...", callback_data="soc-q17-result"))
    builder.add(InlineKeyboardButton(text="B) Использование новых технологий...", callback_data="soc-q17-result"))
    builder.add(InlineKeyboardButton(text="C) Глобализация и транснациональн...", callback_data="soc-q17-result"))
    builder.add(InlineKeyboardButton(text="D) Фрагментация и разнообразие це...", callback_data="soc-q17-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q17-result")
async def handle_callback_soc_q17_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Социологическая позиция зафиксирована!**

**Варианты анализа:**

A) От классовых к постматериалистическим

B) Использование новых технологий организации

C) Глобализация и транснациональный характер

D) Фрагментация и разнообразие целей

📊 **Прогресс:** 17/20 вопросов социоблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="soc-q18"))
    builder.add(InlineKeyboardButton(text="📊 К результатам", callback_data="final-results"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q18")
async def handle_callback_soc_q18(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🌍 **ВОПРОС 18/20** (Социология)

**Что угрожает социальной сплоченности?**

Выберите ваш социологический взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Растущее неравенство...", callback_data="soc-q18-result"))
    builder.add(InlineKeyboardButton(text="B) Культурное разнообразие...", callback_data="soc-q18-result"))
    builder.add(InlineKeyboardButton(text="C) Ослабление традиционных инстит...", callback_data="soc-q18-result"))
    builder.add(InlineKeyboardButton(text="D) Индивидуализация и атомизация...", callback_data="soc-q18-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q18-result")
async def handle_callback_soc_q18_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Социологическая позиция зафиксирована!**

**Варианты анализа:**

A) Растущее неравенство

B) Культурное разнообразие

C) Ослабление традиционных институтов

D) Индивидуализация и атомизация

📊 **Прогресс:** 18/20 вопросов социоблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="soc-q19"))
    builder.add(InlineKeyboardButton(text="📊 К результатам", callback_data="final-results"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q19")
async def handle_callback_soc_q19(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🌍 **ВОПРОС 19/20** (Социология)

**Главная черта информационного общества:**

Выберите ваш социологический взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Скорость изменений и инноваций...", callback_data="soc-q19-result"))
    builder.add(InlineKeyboardButton(text="B) Важность информации и знаний...", callback_data="soc-q19-result"))
    builder.add(InlineKeyboardButton(text="C) Виртуализация социальных отнош...", callback_data="soc-q19-result"))
    builder.add(InlineKeyboardButton(text="D) Новые формы власти и контроля...", callback_data="soc-q19-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q19-result")
async def handle_callback_soc_q19_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Социологическая позиция зафиксирована!**

**Варианты анализа:**

A) Скорость изменений и инноваций

B) Важность информации и знаний

C) Виртуализация социальных отношений

D) Новые формы власти и контроля

📊 **Прогресс:** 19/20 вопросов социоблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="soc-q20"))
    builder.add(InlineKeyboardButton(text="📊 К результатам", callback_data="final-results"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q20")
async def handle_callback_soc_q20(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🌍 **ВОПРОС 20/20** (Социология)

**Каким будет общество будущего?**

Выберите ваш социологический взгляд:"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) Технократическое и высокоэффек...", callback_data="soc-q20-result"))
    builder.add(InlineKeyboardButton(text="B) Экологически устойчивое и спра...", callback_data="soc-q20-result"))
    builder.add(InlineKeyboardButton(text="C) Глобализированное и связанное...", callback_data="soc-q20-result"))
    builder.add(InlineKeyboardButton(text="D) Фрагментированное и конфликтно...", callback_data="soc-q20-result"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "soc-q20-result")
async def handle_callback_soc_q20_result(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """✅ **Социологическая позиция зафиксирована!**

**Варианты анализа:**

A) Технократическое и высокоэффективное

B) Экологически устойчивое и справедливое

C) Глобализированное и связанное

D) Фрагментированное и конфликтное

📊 **Прогресс:** 20/20 вопросов социоблока"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🎉 К результатам!", callback_data="final-results"))
    builder.add(InlineKeyboardButton(text="📊 К результатам", callback_data="final-results"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "detailed-analysis")
async def handle_callback_detailed_analysis(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📊 **ДЕТАЛЬНЫЙ АНАЛИЗ РЕЗУЛЬТАТОВ**

🗳️ **ПОЛИТИЧЕСКИЙ БЛОК:**
• Экономические взгляды: Смешанная экономика
• Социальная политика: Умеренно-прогрессивная
• Внешняя политика: Многосторонность
• Авторитаризм vs Либерализм: Либерально-демократический

📜 **ИСТОРИЧЕСКИЙ БЛОК:**
• Знание фактов: Высокий уровень
• Понимание процессов: Системное мышление
• Интерпретация событий: Многофакторный анализ
• Исторические параллели: Развитое понимание

🤔 **ФИЛОСОФСКИЙ БЛОК:**
• Этика: Деонтологическо-утилитарный синтез
• Метафизика: Материалистический реализм
• Эпистемология: Критический рационализм
• Смысл жизни: Самоактуализация и служение

🌍 **СОЦИОЛОГИЧЕСКИЙ БЛОК:**
• Социальное неравенство: Структурно обусловлено
• Глобализация: Сложный процесс с плюсами и минусами
• Технологии: Трансформируют общество
• Будущее: Осторожный оптимизм"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="⬅️ К результатам", callback_data="final-results"))
    builder.add(InlineKeyboardButton(text="👥 Сравнение с профилями", callback_data="profile-comparison"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "recommendations")
async def handle_callback_recommendations(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📚 **ПЕРСОНАЛЬНЫЕ РЕКОМЕНДАЦИИ ДЛЯ РАЗВИТИЯ**

📖 **Книги для углубления знаний:**
• "Политическая философия" - Роберт Пол Вольф
• "Столкновение цивилизаций" - Сэмюэл Хантингтон
• "Справедливость" - Майкл Сэндел
• "Постиндустриальное общество" - Дэниел Белл

🎓 **Области для изучения:**
• Сравнительная политология
• Философия истории
• Социальная психология
• Глобальная политическая экономия

💭 **Темы для размышления:**
• Как совместить индивидуальные права и общественное благо?
• Какие уроки истории актуальны для современности?
• Как технологии изменят природу демократии?
• Возможно ли справедливое глобальное управление?

🌟 **Практические рекомендации:**
• Участвуйте в общественных дискуссиях
• Изучайте разные точки зрения
• Применяйте исторический анализ к современным событиям
• Развивайте критическое мышление"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="⬅️ К результатам", callback_data="final-results"))
    builder.add(InlineKeyboardButton(text="🆕 Новый опрос", callback_data="start-poll"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)

@dp.callback_query(lambda c: c.data == "profile-comparison")
async def handle_callback_profile_comparison(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """👥 **СРАВНЕНИЕ С ТИПИЧНЫМИ ПРОФИЛЯМИ**

🎯 **Ваш профиль наиболее близок к:**

**"Просвещенный Центрист"** - 87% совпадение
• Рациональный подход к политике
• Глубокое понимание истории
• Философская рефлексивность
• Системное мышление о обществе

📊 **Другие близкие профили:**
• Либеральный Интеллектуал - 78%
• Прогрессивный Прагматик - 74%
• Социал-демократ - 71%

🔍 **Уникальные черты вашего профиля:**
• Балансирование противоположных взглядов
• Критическое мышление с открытостью
• Исторический контекст в политических суждениях
• Философская глубина в социальном анализе

**Вы демонстрируете редкое сочетание аналитического мышления и человечности!**"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="⬅️ К анализу", callback_data="detailed-analysis"))
    builder.add(InlineKeyboardButton(text="📚 Рекомендации", callback_data="recommendations"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode=ParseMode.MARKDOWN)


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
