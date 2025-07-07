"""
🔄 Простой смешанный бот - Telegram Bot
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


@dp.message(CommandStart())
async def start_handler(message: types.Message):

    # Регистрируем пользователя в системе
    user_data[message.from_user.id] = {
        "username": message.from_user.username,
        "first_name": message.from_user.first_name,
        "last_name": message.from_user.last_name,
        "registered_at": message.date
    }

    text = "Добро пожаловать! Выберите раздел:"
    
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📋 Меню"))
    builder.add(KeyboardButton(text="⚙️ Настройки"))
    builder.add(KeyboardButton(text="📞 Контакт", request_contact=True))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    await message.answer(text, reply_markup=keyboard)

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "services-4")
async def handle_callback_btn_4(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """Наши услуги:
• Консультации
• Разработка"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="💬 Консультации"))
    builder.add(KeyboardButton(text="💻 Разработка"))
    builder.add(KeyboardButton(text="📍 Геолокация"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    await callback_query.message.answer(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "start-1")
async def handle_callback_btn_6(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "Добро пожаловать! Выберите раздел:"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📋 Меню"))
    builder.add(KeyboardButton(text="⚙️ Настройки"))
    builder.add(KeyboardButton(text="📞 Контакт"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    await callback_query.message.answer(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "settings-3")
async def handle_callback_btn_13(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "Настройки бота:"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🌐 Язык"))
    builder.add(KeyboardButton(text="🔔 Уведомления"))
    builder.add(KeyboardButton(text="🔙 Главная"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=True)
    await callback_query.message.answer(text, reply_markup=keyboard)

# Обработчики reply кнопок

@dp.message(lambda message: message.text == "📋 Меню")
async def handle_reply_btn_1(message: types.Message):
    text = """**Главное меню**

Выберите действие:"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🛠️ Услуги", callback_data="services-4"))
    builder.add(InlineKeyboardButton(text="🌐 Сайт", url="https://example.com"))
    builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="start-1"))
    keyboard = builder.as_markup()
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "⚙️ Настройки")
async def handle_reply_btn_2(message: types.Message):
    text = "Настройки бота:"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="🌐 Язык"))
    builder.add(KeyboardButton(text="🔔 Уведомления"))
    builder.add(KeyboardButton(text="🔙 Главная"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=True)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🌐 Язык")
async def handle_reply_btn_7(message: types.Message):
    text = "**Выбор языка:**"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🇷🇺 Русский", callback_data="settings-3"))
    builder.add(InlineKeyboardButton(text="🇺🇸 English", callback_data="settings-3"))
    keyboard = builder.as_markup()
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🔔 Уведомления")
async def handle_reply_btn_8(message: types.Message):
    text = "Уведомления настроены!"
    # Удаляем предыдущие reply клавиатуры если они были
    await message.answer(text, reply_markup=ReplyKeyboardRemove())

@dp.message(lambda message: message.text == "🔙 Главная")
async def handle_reply_btn_9(message: types.Message):
    text = "Добро пожаловать! Выберите раздел:"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📋 Меню"))
    builder.add(KeyboardButton(text="⚙️ Настройки"))
    builder.add(KeyboardButton(text="📞 Контакт"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "💬 Консультации")
async def handle_reply_btn_10(message: types.Message):
    text = """**Главное меню**

Выберите действие:"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🛠️ Услуги", callback_data="services-4"))
    builder.add(InlineKeyboardButton(text="🌐 Сайт", url="https://example.com"))
    builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="start-1"))
    keyboard = builder.as_markup()
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "💻 Разработка")
async def handle_reply_btn_11(message: types.Message):
    text = """**Главное меню**

Выберите действие:"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🛠️ Услуги", callback_data="services-4"))
    builder.add(InlineKeyboardButton(text="🌐 Сайт", url="https://example.com"))
    builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="start-1"))
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
