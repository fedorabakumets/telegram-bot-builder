"""
Тест Inline Кнопок - Telegram Bot
Сгенерировано с помощью TelegramBot Builder

Команды для @BotFather:
start - Запустить бота"""

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

    text = """🎉 Добро пожаловать в тестовый бот!

Этот бот демонстрирует работу inline кнопок."""
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📊 Информация", callback_data="info-node"))
    builder.add(InlineKeyboardButton(text="❓ Помощь", callback_data="help-node"))
    builder.add(InlineKeyboardButton(text="🌐 Сайт", url="https://telegram.org"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "info-node")
async def handle_callback_info_node(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """📊 Информация о боте:

• Создан для тестирования inline кнопок
• Все callback_data корректны
• Кнопки работают без ошибок"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="start-1"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "help-node")
async def handle_callback_help_node(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """❓ Справка:

/start - Запуск бота

Все inline кнопки должны работать корректно!"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 На главную", callback_data="start-1"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "start-1")
async def handle_callback_start_1(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🎉 Добро пожаловать в тестовый бот!

Этот бот демонстрирует работу inline кнопок."""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📊 Информация", callback_data="info-node"))
    builder.add(InlineKeyboardButton(text="❓ Помощь", callback_data="help-node"))
    builder.add(InlineKeyboardButton(text="🌐 Сайт", url="https://telegram.org"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)


# Запуск бота
async def main():
    await set_bot_commands()
    print("Бот запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
