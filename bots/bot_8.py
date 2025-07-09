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
    # Кнопка пока никуда не ведет
    await callback_query.answer("⚠️ Эта кнопка пока не настроена", show_alert=True)

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
    builder.add(InlineKeyboardButton(text="A) Минимальная роль - свободный...", callback_data="pol-q1-result"))
    builder.add(InlineKeyboardButton(text="B) Умеренное регулирование...", callback_data="pol-q1-result"))
    builder.add(InlineKeyboardButton(text="C) Активное вмешательство...", callback_data="pol-q1-result"))
    builder.add(InlineKeyboardButton(text="D) Полный государственный...", callback_data="pol-q1-result"))
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
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="history-intro"))
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
    builder.add(InlineKeyboardButton(text="A) Убийство эрцгерцога...", callback_data="hist-q1-result"))
    builder.add(InlineKeyboardButton(text="B) Империалистические противоречия...", callback_data="hist-q1-result"))
    builder.add(InlineKeyboardButton(text="C) Национальные движения...", callback_data="hist-q1-result"))
    builder.add(InlineKeyboardButton(text="D) Гонка вооружений...", callback_data="hist-q1-result"))
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
    builder.add(InlineKeyboardButton(text="A) Врожденные моральные...", callback_data="phil-q1-result"))
    builder.add(InlineKeyboardButton(text="B) Последствия действий...", callback_data="phil-q1-result"))
    builder.add(InlineKeyboardButton(text="C) Долг и универсальные...", callback_data="phil-q1-result"))
    builder.add(InlineKeyboardButton(text="D) Социальные соглашения...", callback_data="phil-q1-result"))
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
    builder.add(InlineKeyboardButton(text="A) Различия в способностях...", callback_data="soc-q1-result"))
    builder.add(InlineKeyboardButton(text="B) Структурные особенности...", callback_data="soc-q1-result"))
    builder.add(InlineKeyboardButton(text="C) Культурные и образовательные...", callback_data="soc-q1-result"))
    builder.add(InlineKeyboardButton(text="D) Исторические факторы...", callback_data="soc-q1-result"))
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
