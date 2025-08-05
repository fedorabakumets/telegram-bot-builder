"""
🚀 Продвинутый Комплексный Тест-бот - Telegram Bot
Сгенерировано с помощью TelegramBot Builder
"""

import asyncio
import logging
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, BotCommand, ReplyKeyboardRemove
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


@dp.message(Command("start"))
async def start_handler(message: types.Message):

    text = "🚀 Добро пожаловать в Продвинутый Telegram Бот!\n\nЭтот бот демонстрирует все возможности конструктора:\n• Множественные команды и обработчики\n• Inline и Reply клавиатуры\n• Медиаконтент и специальные кнопки\n• Сложные переходы между узлами\n• Обработка пользовательского ввода\n\nВыберите раздел для изучения:"
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📚 Основные команды", callback_data="commands-menu"))
    builder.add(InlineKeyboardButton(text="⌨️ Клавиатуры", callback_data="keyboards-menu"))
    builder.add(InlineKeyboardButton(text="🎮 Игры и развлечения", callback_data="games-menu"))
    builder.add(InlineKeyboardButton(text="🛠️ Настройки", callback_data="settings-menu"))
    builder.add(InlineKeyboardButton(text="🌐 Внешние ссылки", url="https://t.me/BotFather"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

@dp.message(Command("info"))
async def info_handler(message: types.Message):

    text = "ℹ️ Информация о боте:\n\n🤖 Название: Продвинутый Тестовый Бот\n📅 Создан: 2025\n🛠️ Конструктор: Telegram Bot Builder\n⚡ Статус: Активен\n🔧 Функции: Полный набор\n\nЭтот бот создан для демонстрации всех возможностей конструктора ботов."
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📈 Детальная статистика", callback_data="detailed-stats"))
    builder.add(InlineKeyboardButton(text="🔧 Технические характеристики", callback_data="tech-specs"))
    builder.add(InlineKeyboardButton(text="🔙 К командам", callback_data="commands-menu"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

@dp.message(Command("contacts"))
async def contacts_handler(message: types.Message):

    text = "📞 Контактная информация:\n\nЕсли у вас есть вопросы или предложения, вы можете связаться с нами:\n\n📧 Email: support@example.com\n💬 Telegram: @support_bot\n🌐 Сайт: https://example.com\n📱 Телефон: +7 (900) 123-45-67\n\nМы всегда рады помочь!"
    
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📧 Написать email"))
    builder.add(KeyboardButton(text="📱 Поделиться контактом"))
    builder.add(KeyboardButton(text="📍 Отправить геолокацию"))
    builder.add(KeyboardButton(text="🏠 Главное меню"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(Command("help"))
async def help_handler(message: types.Message):

    text = "❓ Справка по боту:\n\nДоступные команды:\n• /start - Главное меню\n• /info - Информация о боте\n• /contacts - Контактные данные\n• /help - Эта справка\n• /games - Игры и развлечения\n• /settings - Настройки\n• /quiz - Начать викторину\n• /weather - Узнать погоду\n\nТакже можете использовать синонимы команд!"
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📖 Подробная справка", callback_data="detailed-help"))
    builder.add(InlineKeyboardButton(text="🎯 Быстрые команды", callback_data="quick-commands"))
    builder.add(InlineKeyboardButton(text="🔙 К командам", callback_data="commands-menu"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

@dp.message(Command("stats"))
async def stats_handler(message: types.Message):

    text = "📊 Статистика бота:\n\n👥 Всего пользователей: 1,234\n📈 Активных сегодня: 89\n💬 Сообщений обработано: 15,678\n🎮 Игр сыграно: 456\n⏱️ Время работы: 24/7\n🔄 Последнее обновление: сегодня\n\nБот работает стабильно и обрабатывает все запросы!"
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📈 Детальная аналитика", callback_data="analytics"))
    builder.add(InlineKeyboardButton(text="📋 Отчет по периодам", callback_data="reports"))
    builder.add(InlineKeyboardButton(text="🔙 К командам", callback_data="commands-menu"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

@dp.message(Command("games"))
async def games_handler(message: types.Message):

    text = "🎮 Игры и развлечения:\n\nПопробуйте наши мини-игры и развлекательные функции!"
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🎲 Бросить кубик", callback_data="dice-game"))
    builder.add(InlineKeyboardButton(text="❓ Викторина", callback_data="quiz-start"))
    builder.add(InlineKeyboardButton(text="🎯 Угадай число", callback_data="guess-number"))
    builder.add(InlineKeyboardButton(text="🃏 Карточная игра", callback_data="card-game"))
    builder.add(InlineKeyboardButton(text="🏠 Главное меню", callback_data="start-node"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

@dp.message(Command("quiz"))
async def quiz_handler(message: types.Message):

    text = "❓ Викторина: Telegram боты\n\nВопрос 1 из 3:\nКакой API используется для создания Telegram ботов?"
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) REST API", callback_data="quiz-q2"))
    builder.add(InlineKeyboardButton(text="B) Bot API", callback_data="quiz-correct"))
    builder.add(InlineKeyboardButton(text="C) GraphQL", callback_data="quiz-wrong"))
    builder.add(InlineKeyboardButton(text="❌ Выйти из викторины", callback_data="games-menu"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

@dp.message(Command("settings"))
async def settings_handler(message: types.Message):

    text = "🛠️ Настройки бота:\n\nЗдесь вы можете настроить различные параметры работы бота:"
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔔 Уведомления", callback_data="notifications"))
    builder.add(InlineKeyboardButton(text="🌍 Язык интерфейса", callback_data="language"))
    builder.add(InlineKeyboardButton(text="🎨 Тема оформления", callback_data="theme"))
    builder.add(InlineKeyboardButton(text="🔐 Приватность", callback_data="privacy"))
    builder.add(InlineKeyboardButton(text="🏠 Главное меню", callback_data="start-node"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

@dp.message(Command("weather"))
async def weather_handler(message: types.Message):

    text = "🌤️ Прогноз погоды:\n\n📍 Москва\n🌡️ Температура: +15°C\n☁️ Облачно с прояснениями\n💨 Ветер: 5 м/с\n💧 Влажность: 65%\n🌅 Восход: 06:30\n🌇 Закат: 20:15\n\nХорошего дня!"
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🌍 Другой город", callback_data="weather-input"))
    builder.add(InlineKeyboardButton(text="📅 Прогноз на неделю", callback_data="weather-week"))
    builder.add(InlineKeyboardButton(text="🏠 Главное меню", callback_data="start-node"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

# Обработчики синонимов команд

@dp.message(lambda message: message.text and message.text.lower() == "помощь")
async def help_synonym_помощь_handler(message: types.Message):
    # Синоним для команды /help
    await help_handler(message)

@dp.message(lambda message: message.text and message.text.lower() == "справка")
async def help_synonym_справка_handler(message: types.Message):
    # Синоним для команды /help
    await help_handler(message)

@dp.message(lambda message: message.text and message.text.lower() == "команды")
async def help_synonym_команды_handler(message: types.Message):
    # Синоним для команды /help
    await help_handler(message)

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "commands-menu")
async def handle_callback_btnNSBI4DXH(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "📚 Основные команды бота:\n\nЗдесь собраны все доступные команды и их описания. Вы можете протестировать любую из них прямо сейчас!"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="ℹ️ Информация", callback_data="info-cmd"))
    builder.add(InlineKeyboardButton(text="📞 Контакты", callback_data="contacts-cmd"))
    builder.add(InlineKeyboardButton(text="❓ Помощь", callback_data="help-cmd"))
    builder.add(InlineKeyboardButton(text="📊 Статистика", callback_data="stats-cmd"))
    builder.add(InlineKeyboardButton(text="🔙 Назад в главное меню", callback_data="start-node"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "keyboards-menu")
async def handle_callback_btn3T798TWP(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "⌨️ Демонстрация клавиатур:\n\nЗдесь вы можете протестировать различные типы клавиатур и их возможности. Выберите тип для демонстрации:"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔘 Inline кнопки", callback_data="inline-demo"))
    builder.add(InlineKeyboardButton(text="⌨️ Reply клавиатура", callback_data="reply-demo"))
    builder.add(InlineKeyboardButton(text="🔄 Смешанный режим", callback_data="mixed-demo"))
    builder.add(InlineKeyboardButton(text="🎛️ Специальные кнопки", callback_data="special-buttons"))
    builder.add(InlineKeyboardButton(text="🏠 Главное меню", callback_data="start-node"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "games-menu")
async def handle_callback_btnNloo1UCB(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "🎮 Игры и развлечения:\n\nПопробуйте наши мини-игры и развлекательные функции!"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🎲 Бросить кубик", callback_data="dice-game"))
    builder.add(InlineKeyboardButton(text="❓ Викторина", callback_data="quiz-start"))
    builder.add(InlineKeyboardButton(text="🎯 Угадай число", callback_data="guess-number"))
    builder.add(InlineKeyboardButton(text="🃏 Карточная игра", callback_data="card-game"))
    builder.add(InlineKeyboardButton(text="🏠 Главное меню", callback_data="start-node"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "settings-menu")
async def handle_callback_btnORgeQ3C3(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "🛠️ Настройки бота:\n\nЗдесь вы можете настроить различные параметры работы бота:"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔔 Уведомления", callback_data="notifications"))
    builder.add(InlineKeyboardButton(text="🌍 Язык интерфейса", callback_data="language"))
    builder.add(InlineKeyboardButton(text="🎨 Тема оформления", callback_data="theme"))
    builder.add(InlineKeyboardButton(text="🔐 Приватность", callback_data="privacy"))
    builder.add(InlineKeyboardButton(text="🏠 Главное меню", callback_data="start-node"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "info-cmd")
async def handle_callback_btnPQWANeA9(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "ℹ️ Информация о боте:\n\n🤖 Название: Продвинутый Тестовый Бот\n📅 Создан: 2025\n🛠️ Конструктор: Telegram Bot Builder\n⚡ Статус: Активен\n🔧 Функции: Полный набор\n\nЭтот бот создан для демонстрации всех возможностей конструктора ботов."
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📈 Детальная статистика", callback_data="detailed-stats"))
    builder.add(InlineKeyboardButton(text="🔧 Технические характеристики", callback_data="tech-specs"))
    builder.add(InlineKeyboardButton(text="🔙 К командам", callback_data="commands-menu"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "contacts-cmd")
async def handle_callback_btnOHTt1ViA(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "📞 Контактная информация:\n\nЕсли у вас есть вопросы или предложения, вы можете связаться с нами:\n\n📧 Email: support@example.com\n💬 Telegram: @support_bot\n🌐 Сайт: https://example.com\n📱 Телефон: +7 (900) 123-45-67\n\nМы всегда рады помочь!"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📧 Написать email"))
    builder.add(KeyboardButton(text="📱 Поделиться контактом"))
    builder.add(KeyboardButton(text="📍 Отправить геолокацию"))
    builder.add(KeyboardButton(text="🏠 Главное меню"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await callback_query.message.answer(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "help-cmd")
async def handle_callback_btnm7V9Lpyg(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "❓ Справка по боту:\n\nДоступные команды:\n• /start - Главное меню\n• /info - Информация о боте\n• /contacts - Контактные данные\n• /help - Эта справка\n• /games - Игры и развлечения\n• /settings - Настройки\n• /quiz - Начать викторину\n• /weather - Узнать погоду\n\nТакже можете использовать синонимы команд!"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📖 Подробная справка", callback_data="detailed-help"))
    builder.add(InlineKeyboardButton(text="🎯 Быстрые команды", callback_data="quick-commands"))
    builder.add(InlineKeyboardButton(text="🔙 К командам", callback_data="commands-menu"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "stats-cmd")
async def handle_callback_btnbJaegeqL(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "📊 Статистика бота:\n\n👥 Всего пользователей: 1,234\n📈 Активных сегодня: 89\n💬 Сообщений обработано: 15,678\n🎮 Игр сыграно: 456\n⏱️ Время работы: 24/7\n🔄 Последнее обновление: сегодня\n\nБот работает стабильно и обрабатывает все запросы!"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📈 Детальная аналитика", callback_data="analytics"))
    builder.add(InlineKeyboardButton(text="📋 Отчет по периодам", callback_data="reports"))
    builder.add(InlineKeyboardButton(text="🔙 К командам", callback_data="commands-menu"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "start-node")
async def handle_callback_btnytiSVbmR(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "🚀 Добро пожаловать в Продвинутый Telegram Бот!\n\nЭтот бот демонстрирует все возможности конструктора:\n• Множественные команды и обработчики\n• Inline и Reply клавиатуры\n• Медиаконтент и специальные кнопки\n• Сложные переходы между узлами\n• Обработка пользовательского ввода\n\nВыберите раздел для изучения:"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📚 Основные команды", callback_data="commands-menu"))
    builder.add(InlineKeyboardButton(text="⌨️ Клавиатуры", callback_data="keyboards-menu"))
    builder.add(InlineKeyboardButton(text="🎮 Игры и развлечения", callback_data="games-menu"))
    builder.add(InlineKeyboardButton(text="🛠️ Настройки", callback_data="settings-menu"))
    builder.add(InlineKeyboardButton(text="🌐 Внешние ссылки", url="https://t.me/BotFather"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "detailed-stats")
async def handle_callback_btnWXY4LCOj(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "📈 Детальная статистика:\n\n📊 Ежедневная активность:\n• Понедельник: 145 пользователей\n• Вторник: 189 пользователей\n• Среда: 201 пользователь\n• Четверг: 167 пользователей\n• Пятница: 234 пользователя\n• Суббота: 298 пользователей\n• Воскресенье: 267 пользователей\n\n🔥 Пиковое время: 18:00-21:00"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Назад к статистике", callback_data="stats-cmd"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "inline-demo")
async def handle_callback_btnujiPVOOw(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "🔘 Демонстрация Inline кнопок:\n\nInline кнопки прикрепляются к сообщению и не исчезают. Они идеально подходят для навигации и быстрых действий."
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="1️⃣ Действие 1", callback_data="action-1"))
    builder.add(InlineKeyboardButton(text="2️⃣ Действие 2", callback_data="action-2"))
    builder.add(InlineKeyboardButton(text="3️⃣ Действие 3", callback_data="action-3"))
    builder.add(InlineKeyboardButton(text="🌐 Внешняя ссылка", url="https://telegram.org"))
    builder.add(InlineKeyboardButton(text="🔙 К клавиатурам", callback_data="keyboards-menu"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "reply-demo")
async def handle_callback_btnEw4j7c6a(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "⌨️ Демонстрация Reply клавиатуры:\n\nReply клавиатура заменяет стандартную клавиатуру пользователя. Удобна для часто используемых команд и быстрого ввода."
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🎯 Быстрое действие"))
    builder.add(KeyboardButton(text="📋 Меню функций"))
    builder.add(KeyboardButton(text="🔧 Настройки"))
    builder.add(KeyboardButton(text="❌ Скрыть клавиатуру"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await callback_query.message.answer(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "dice-game")
async def handle_callback_btnK7emosHw(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "🎲 Игра в кубики!\n\nНажмите кнопку, чтобы бросить кубик. Посмотрим, какое число вам выпадет!"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🎲 Бросить кубик", callback_data="dice-result"))
    builder.add(InlineKeyboardButton(text="🔙 К играм", callback_data="games-menu"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "quiz-start")
async def handle_callback_btncokaN9oc(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "❓ Викторина: Telegram боты\n\nВопрос 1 из 3:\nКакой API используется для создания Telegram ботов?"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="A) REST API", callback_data="quiz-q2"))
    builder.add(InlineKeyboardButton(text="B) Bot API", callback_data="quiz-correct"))
    builder.add(InlineKeyboardButton(text="C) GraphQL", callback_data="quiz-wrong"))
    builder.add(InlineKeyboardButton(text="❌ Выйти из викторины", callback_data="games-menu"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "dice-result")
async def handle_callback_btntz3bvjVL(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "🎲 Результат броска: 4!\n\n🎉 Отличный результат! Хотите попробовать еще раз?"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🎲 Бросить еще раз", callback_data="dice-game"))
    builder.add(InlineKeyboardButton(text="🔙 К играм", callback_data="games-menu"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

# Обработчики reply кнопок

@dp.message(lambda message: message.text == "🏠 Главное меню")
async def handle_reply_btnUgexZ2R9(message: types.Message):
    text = "🚀 Добро пожаловать в Продвинутый Telegram Бот!\n\nЭтот бот демонстрирует все возможности конструктора:\n• Множественные команды и обработчики\n• Inline и Reply клавиатуры\n• Медиаконтент и специальные кнопки\n• Сложные переходы между узлами\n• Обработка пользовательского ввода\n\nВыберите раздел для изучения:"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📚 Основные команды", callback_data="commands-menu"))
    builder.add(InlineKeyboardButton(text="⌨️ Клавиатуры", callback_data="keyboards-menu"))
    builder.add(InlineKeyboardButton(text="🎮 Игры и развлечения", callback_data="games-menu"))
    builder.add(InlineKeyboardButton(text="🛠️ Настройки", callback_data="settings-menu"))
    builder.add(InlineKeyboardButton(text="🌐 Внешние ссылки", url="https://t.me/BotFather"))
    keyboard = builder.as_markup()
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🔧 Настройки")
async def handle_reply_btnIxUyLuAD(message: types.Message):
    text = "🛠️ Настройки бота:\n\nЗдесь вы можете настроить различные параметры работы бота:"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔔 Уведомления", callback_data="notifications"))
    builder.add(InlineKeyboardButton(text="🌍 Язык интерфейса", callback_data="language"))
    builder.add(InlineKeyboardButton(text="🎨 Тема оформления", callback_data="theme"))
    builder.add(InlineKeyboardButton(text="🔐 Приватность", callback_data="privacy"))
    builder.add(InlineKeyboardButton(text="🏠 Главное меню", callback_data="start-node"))
    keyboard = builder.as_markup()
    await message.answer(text, reply_markup=keyboard)

# Обработчики специальных кнопок

@dp.message(F.contact)
async def handle_contact(message: types.Message):
    contact = message.contact
    text = f"Спасибо за контакт!\n"
    text += f"Имя: {contact.first_name}\n"
    text += f"Телефон: {contact.phone_number}"
    await message.answer(text)

@dp.message(F.location)
async def handle_location(message: types.Message):
    location = message.location
    text = f"Спасибо за геолокацию!\n"
    text += f"Широта: {location.latitude}\n"
    text += f"Долгота: {location.longitude}"
    await message.answer(text)


# Запуск бота
async def main():
    print("Бот запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
