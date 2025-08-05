"""
🤖 Комплексный тест-бот - Telegram Bot
Сгенерировано с помощью TelegramBot Builder
"""

import asyncio
import logging
from aiogram import Bot, Dispatcher, types
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


@dp.message(CommandStart())
async def start_handler(message: types.Message):

    # Регистрируем пользователя в системе
    user_data[message.from_user.id] = {
        "username": message.from_user.username,
        "first_name": message.from_user.first_name,
        "last_name": message.from_user.last_name,
        "registered_at": message.date
    }

    text = "🎉 Добро пожаловать в комплексный тест-бот!

Этот бот демонстрирует все возможности генератора:
• Команды с inline и reply кнопками
• Обработка пользовательского ввода
• Условная логика
• Отправка медиа
• Административные функции"
    
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📋 Меню"))
    builder.add(KeyboardButton(text="🎮 Игры"))
    builder.add(KeyboardButton(text="⚙️ Настройки"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await message.answer(text, reply_markup=keyboard)

@dp.message(Command("menu"))
async def menu_handler(message: types.Message):

    text = "🎯 Главное меню:

Выберите раздел для изучения функциональности:"
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📊 Информация", callback_data="info-msg"))
    builder.add(InlineKeyboardButton(text="🖼️ Медиа", callback_data="media-msg"))
    builder.add(InlineKeyboardButton(text="✍️ Ввод данных", callback_data="input-msg"))
    builder.add(InlineKeyboardButton(text="🌐 Сайт", url="https://telegram.org"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

@dp.message(Command("games"))
async def games_handler(message: types.Message):

    text = "🎮 Игровая зона:

Выберите игру:"
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🧠 Викторина", callback_data="quiz-msg"))
    builder.add(InlineKeyboardButton(text="🎲 Кости", callback_data="dice-msg"))
    builder.add(InlineKeyboardButton(text="🔙 На главную", callback_data="start-node"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

@dp.message(Command("settings"))
async def settings_handler(message: types.Message):
    if not await is_private_chat(message):
        await message.answer("❌ Эта команда доступна только в приватных чатах")
        return
    if not await is_admin(message.from_user.id):
        await message.answer("❌ У вас нет прав для выполнения этой команды")
        return

    text = "⚙️ Настройки:

Персонализируйте работу бота:"
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔔 Уведомления", callback_data="notifications-msg"))
    builder.add(InlineKeyboardButton(text="👑 Админ-панель", callback_data="admin-msg"))
    builder.add(InlineKeyboardButton(text="🔙 На главную", callback_data="start-node"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

@dp.message(Command("help"))
async def help_handler(message: types.Message):

    text = "❓ Справка по командам:

/start - Запуск бота
/menu - Главное меню
/games - Игровая зона
/settings - Настройки (только админы)
/help - Эта справка
/about - О боте"
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📋 Все команды", callback_data="commands-msg"))
    builder.add(InlineKeyboardButton(text="🆘 Поддержка", callback_data="support-msg"))
    builder.add(InlineKeyboardButton(text="🔙 На главную", callback_data="start-node"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

@dp.message(Command("about"))
async def about_handler(message: types.Message):

    text = "ℹ️ О боте:

🤖 Комплексный тест-бот
📅 Версия: 2.0.0
👨‍💻 Создан с помощью Telegram Bot Builder
🚀 Поддерживает все типы взаимодействий

📊 Статистика:
• Узлов в схеме: 27
• Команд: 6
• Типов взаимодействий: 8"
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📝 История изменений", callback_data="changelog-msg"))
    builder.add(InlineKeyboardButton(text="💻 GitHub", url="https://github.com/telegram-bot-builder"))
    builder.add(InlineKeyboardButton(text="🔙 На главную", callback_data="start-node"))
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

@dp.callback_query(lambda c: c.data == "info-msg")
async def handle_callback_btn_info(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "📊 Информация о боте:

• Создан с помощью визуального конструктора
• Поддерживает все типы кнопок
• Включает условную логику
• Работает с медиафайлами
• Имеет административные функции"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Назад к меню", callback_data="menu-cmd"))
    builder.add(InlineKeyboardButton(text="📈 Статистика", callback_data="stats-msg"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "media-msg")
async def handle_callback_btn_media(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "🖼️ Медиа контент:

Это демонстрация отправки изображений с inline кнопками."
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🎥 Видео", callback_data="video-msg"))
    builder.add(InlineKeyboardButton(text="🎵 Аудио", callback_data="audio-msg"))
    builder.add(InlineKeyboardButton(text="🔙 Главное меню", callback_data="menu-cmd"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "input-msg")
async def handle_callback_btn_input(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "✍️ Введите ваше имя:

Мы сохраним его для персонализации."
    await callback_query.message.edit_text(text)

@dp.callback_query(lambda c: c.data == "menu-cmd")
async def handle_callback_btn_back_menu(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "🎯 Главное меню:

Выберите раздел для изучения функциональности:"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📊 Информация", callback_data="info-msg"))
    builder.add(InlineKeyboardButton(text="🖼️ Медиа", callback_data="media-msg"))
    builder.add(InlineKeyboardButton(text="✍️ Ввод данных", callback_data="input-msg"))
    builder.add(InlineKeyboardButton(text="🌐 Сайт", url="https://telegram.org"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "stats-msg")
async def handle_callback_btn_stats(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "📈 Статистика бота:

• Активных пользователей: 1,337
• Сообщений обработано: 42,000+
• Команд выполнено: 15,678
• Время работы: 99.9%"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 К информации", callback_data="info-msg"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "video-msg")
async def handle_callback_btn_video(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "🎥 Видео контент:

Демонстрация видео с кнопками."
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 К медиа", callback_data="media-msg"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "audio-msg")
async def handle_callback_btn_audio(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "🎵 Аудио контент:

Пример аудиофайла с кнопками."
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 К медиа", callback_data="media-msg"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "profile-msg")
async def handle_callback_btn_profile(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "👤 Ваш профиль:

• Имя: {имя}
• Статус: Активный пользователь
• Дата регистрации: {дата}
• Сообщений отправлено: {счетчик}"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="✏️ Редактировать", callback_data="input-msg"))
    builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="greeting-msg"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "greeting-msg")
async def handle_callback_btn_back_greeting(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "🤝 Привет, {имя}!

Теперь вы можете пользоваться персонализированными функциями."
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="👤 Мой профиль", callback_data="profile-msg"))
    builder.add(InlineKeyboardButton(text="🔙 Главное меню", callback_data="menu-cmd"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "quiz-msg")
async def handle_callback_btn_quiz(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "🧠 Викторина:

Вопрос: Какой протокол использует Telegram Bot API?

Выберите правильный ответ:"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="HTTP/HTTPS", callback_data="correct-msg"))
    builder.add(InlineKeyboardButton(text="WebSocket", callback_data="wrong-msg"))
    builder.add(InlineKeyboardButton(text="TCP", callback_data="wrong-msg"))
    builder.add(InlineKeyboardButton(text="🔙 К играм", callback_data="games-cmd"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "dice-msg")
async def handle_callback_btn_dice(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "🎲 Игра в кости:

🎯 Ваш результат: {случайное число 1-6}

Удача сегодня на вашей стороне!"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🎲 Бросить снова", callback_data="dice-msg"))
    builder.add(InlineKeyboardButton(text="🔙 К играм", callback_data="games-cmd"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "start-node")
async def handle_callback_btn_back_start(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "🎉 Добро пожаловать в комплексный тест-бот!

Этот бот демонстрирует все возможности генератора:
• Команды с inline и reply кнопками
• Обработка пользовательского ввода
• Условная логика
• Отправка медиа
• Административные функции"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📋 Меню"))
    builder.add(KeyboardButton(text="🎮 Игры"))
    builder.add(KeyboardButton(text="⚙️ Настройки"))
    keyboard = builder.as_markup(resize_keyboard=true, one_time_keyboard=false)
    await callback_query.message.answer(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "correct-msg")
async def handle_callback_btn_http(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "✅ Правильно!

Telegram Bot API действительно использует HTTP/HTTPS протокол для обмена данными."
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="➡️ Следующий вопрос", callback_data="quiz-msg"))
    builder.add(InlineKeyboardButton(text="🔙 К играм", callback_data="games-cmd"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "wrong-msg")
async def handle_callback_btn_websocket(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "❌ Неправильно!

Попробуйте ещё раз. Подсказка: это самый распространённый протокол в веб-разработке."
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔄 Попробовать снова", callback_data="quiz-msg"))
    builder.add(InlineKeyboardButton(text="🔙 К играм", callback_data="games-cmd"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "games-cmd")
async def handle_callback_btn_back_games(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "🎮 Игровая зона:

Выберите игру:"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🧠 Викторина", callback_data="quiz-msg"))
    builder.add(InlineKeyboardButton(text="🎲 Кости", callback_data="dice-msg"))
    builder.add(InlineKeyboardButton(text="🔙 На главную", callback_data="start-node"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "notifications-msg")
async def handle_callback_btn_notifications(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "🔔 Настройки уведомлений:

• Новые сообщения: ✅
• Системные уведомления: ✅
• Рекламные рассылки: ❌
• Ночной режим: ✅"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔄 Изменить настройки", callback_data="notifications-msg"))
    builder.add(InlineKeyboardButton(text="🔙 К настройкам", callback_data="settings-cmd"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "admin-msg")
async def handle_callback_btn_admin(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "👑 Административная панель:

• Пользователей: 1,337
• Активных сессий: 89
• Загрузка сервера: 12%
• Свободное место: 85%"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📢 Рассылка", callback_data="broadcast-msg"))
    builder.add(InlineKeyboardButton(text="📋 Логи", callback_data="logs-msg"))
    builder.add(InlineKeyboardButton(text="🔙 К настройкам", callback_data="settings-cmd"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "settings-cmd")
async def handle_callback_btn_back_settings(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "⚙️ Настройки:

Персонализируйте работу бота:"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔔 Уведомления", callback_data="notifications-msg"))
    builder.add(InlineKeyboardButton(text="👑 Админ-панель", callback_data="admin-msg"))
    builder.add(InlineKeyboardButton(text="🔙 На главную", callback_data="start-node"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "broadcast-msg")
async def handle_callback_btn_broadcast(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "📢 Создание рассылки:

Введите текст сообщения для отправки всем пользователям:"
    await callback_query.message.edit_text(text)

@dp.callback_query(lambda c: c.data == "logs-msg")
async def handle_callback_btn_logs(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "📋 Системные логи:

[2025-01-06 22:47] Пользователь 12345 запустил /start
[2025-01-06 22:46] Отправлена рассылка (1,337 получателей)
[2025-01-06 22:45] Обновлена конфигурация бота
[2025-01-06 22:44] Пользователь 67890 выполнил /menu"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🗑️ Очистить логи", callback_data="logs-cleared-msg"))
    builder.add(InlineKeyboardButton(text="🔙 К админ-панели", callback_data="admin-msg"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "broadcast-sent-msg")
async def handle_callback_btn_send_broadcast(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "🎉 Рассылка отправлена!

• Получателей: 1,337
• Доставлено: 1,335
• Ошибок: 2
• Время отправки: 3.2 сек"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 К админ-панели", callback_data="admin-msg"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "logs-cleared-msg")
async def handle_callback_btn_clear_logs(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "🗑️ Логи очищены!

Все системные логи были успешно удалены. Новые события будут записываться с этого момента."
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 К логам", callback_data="logs-msg"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "commands-msg")
async def handle_callback_btn_commands(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "📋 Полный список команд:

🔹 Основные:
/start, /menu, /help, /about

🔹 Развлечения:
/games, викторина, кости

🔹 Настройки:
/settings, уведомления

🔹 Админские:
/admin, рассылка, логи"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 К справке", callback_data="help-cmd"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "support-msg")
async def handle_callback_btn_support(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "🆘 Техническая поддержка:

• Email: support@example.com
• Telegram: @support_bot
• Часы работы: 24/7
• Среднее время ответа: 15 мин"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📞 Связаться", url="https://t.me/support_bot"))
    builder.add(InlineKeyboardButton(text="🔙 К справке", callback_data="help-cmd"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "help-cmd")
async def handle_callback_btn_back_help(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "❓ Справка по командам:

/start - Запуск бота
/menu - Главное меню
/games - Игровая зона
/settings - Настройки (только админы)
/help - Эта справка
/about - О боте"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📋 Все команды", callback_data="commands-msg"))
    builder.add(InlineKeyboardButton(text="🆘 Поддержка", callback_data="support-msg"))
    builder.add(InlineKeyboardButton(text="🔙 На главную", callback_data="start-node"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "changelog-msg")
async def handle_callback_btn_changelog(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "📝 История изменений:

🔹 v2.0.0 (06.01.2025)
• Добавлены игры и викторины
• Улучшена админ-панель
• Исправлены inline кнопки

🔹 v1.5.0 (05.01.2025)
• Добавлена медиа поддержка
• Система пользовательского ввода

🔹 v1.0.0 (04.01.2025)
• Первая стабильная версия"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 О боте", callback_data="about-cmd"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "about-cmd")
async def handle_callback_btn_back_about(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "ℹ️ О боте:

🤖 Комплексный тест-бот
📅 Версия: 2.0.0
👨‍💻 Создан с помощью Telegram Bot Builder
🚀 Поддерживает все типы взаимодействий

📊 Статистика:
• Узлов в схеме: 27
• Команд: 6
• Типов взаимодействий: 8"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📝 История изменений", callback_data="changelog-msg"))
    builder.add(InlineKeyboardButton(text="💻 GitHub", url="https://github.com/telegram-bot-builder"))
    builder.add(InlineKeyboardButton(text="🔙 На главную", callback_data="start-node"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

# Обработчики reply кнопок

@dp.message(lambda message: message.text == "📋 Меню")
async def handle_reply_btn_1(message: types.Message):
    text = "🎯 Главное меню:

Выберите раздел для изучения функциональности:"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📊 Информация", callback_data="info-msg"))
    builder.add(InlineKeyboardButton(text="🖼️ Медиа", callback_data="media-msg"))
    builder.add(InlineKeyboardButton(text="✍️ Ввод данных", callback_data="input-msg"))
    builder.add(InlineKeyboardButton(text="🌐 Сайт", url="https://telegram.org"))
    keyboard = builder.as_markup()
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🎮 Игры")
async def handle_reply_btn_2(message: types.Message):
    text = "🎮 Игровая зона:

Выберите игру:"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🧠 Викторина", callback_data="quiz-msg"))
    builder.add(InlineKeyboardButton(text="🎲 Кости", callback_data="dice-msg"))
    builder.add(InlineKeyboardButton(text="🔙 На главную", callback_data="start-node"))
    keyboard = builder.as_markup()
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "⚙️ Настройки")
async def handle_reply_btn_3(message: types.Message):
    text = "⚙️ Настройки:

Персонализируйте работу бота:"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔔 Уведомления", callback_data="notifications-msg"))
    builder.add(InlineKeyboardButton(text="👑 Админ-панель", callback_data="admin-msg"))
    builder.add(InlineKeyboardButton(text="🔙 На главную", callback_data="start-node"))
    keyboard = builder.as_markup()
    await message.answer(text, reply_markup=keyboard)


# Запуск бота
async def main():
    print("Бот запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
