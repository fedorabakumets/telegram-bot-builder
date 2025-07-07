"""
Тест исправленного генератора - Telegram Bot
Сгенерировано для проверки исправлений
"""

import asyncio
import logging
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, BotCommand, ReplyKeyboardRemove
from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder
from aiogram.enums import ParseMode

BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
ADMIN_IDS = [123456789]
user_data = {}

async def is_admin(user_id: int) -> bool:
    return user_id in ADMIN_IDS

async def is_private_chat(message: types.Message) -> bool:
    return message.chat.type == "private"

async def check_auth(user_id: int) -> bool:
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

    text = """🎉 Добро пожаловать!

Это тест команды с инлайн кнопками."""
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📋 Помощь", callback_data="help-cmd"))
    builder.add(InlineKeyboardButton(text="📱 Меню", callback_data="menu-msg"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

@dp.message(Command(")help"))
async def help_handler(message: types.Message):

    text = """❓ Справка:

/start - Запуск
/help - Справка"""
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="start-node"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)

# Обработчики синонимов команд

@dp.message(lambda message: message.text and message.text.lower() == "старт")
async def start_synonym_старт_handler(message: types.Message):
    # Синоним для команды /start
    await start_handler(message)

@dp.message(lambda message: message.text and message.text.lower() == "привет")
async def start_synonym_привет_handler(message: types.Message):
    # Синоним для команды /start
    await start_handler(message)

@dp.message(lambda message: message.text and message.text.lower() == "помощь")
async def help_synonym_помощь_handler(message: types.Message):
    # Синоним для команды /help
    await help_handler(message)

@dp.message(lambda message: message.text and message.text.lower() == "справка")
async def help_synonym_справка_handler(message: types.Message):
    # Синоним для команды /help
    await help_handler(message)

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "help-cmd")
async def handle_callback_help_cmd(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """❓ Справка:

/start - Запуск
/help - Справка"""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="start-node"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "menu-msg")
async def handle_callback_menu_msg(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "📱 Меню бота"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="ℹ️ Информация", callback_data="start-node"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "start-node")
async def handle_callback_start_node(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🎉 Добро пожаловать!

Это тест команды с инлайн кнопками."""
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📋 Помощь", callback_data="help-cmd"))
    builder.add(InlineKeyboardButton(text="📱 Меню", callback_data="menu-msg"))
    keyboard = builder.as_markup()
    await callback_query.message.edit_text(text, reply_markup=keyboard)

# Запуск бота
async def main():
    print("🤖 Тест исправленного генератора запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
