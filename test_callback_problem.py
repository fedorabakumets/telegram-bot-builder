"""
Тестовый бот для проверки проблемы с callback обработчиками
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

@dp.message(CommandStart())
async def start_handler(message: types.Message):
    text = "Привет! Это тест callback кнопок."
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📊 Информация", callback_data="info-msg"))
    builder.add(InlineKeyboardButton(text="⚙️ Настройки", callback_data="settings-msg"))
    keyboard = builder.as_markup()
    
    await message.answer(text, reply_markup=keyboard)

# Обработчики inline кнопок
@dp.callback_query(lambda c: c.data == "info-msg")
async def handle_callback_info(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "📊 Информация о боте:\n\nЭто тестовый бот для проверки callback обработчиков."
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="start-msg"))
    keyboard = builder.as_markup()
    
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "settings-msg")
async def handle_callback_settings(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "⚙️ Настройки:\n\nЗдесь будут настройки бота."
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="🔙 Назад", callback_data="start-msg"))
    keyboard = builder.as_markup()
    
    await callback_query.message.edit_text(text, reply_markup=keyboard)

@dp.callback_query(lambda c: c.data == "start-msg")
async def handle_callback_back(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "Привет! Это тест callback кнопок."
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📊 Информация", callback_data="info-msg"))
    builder.add(InlineKeyboardButton(text="⚙️ Настройки", callback_data="settings-msg"))
    keyboard = builder.as_markup()
    
    await callback_query.message.edit_text(text, reply_markup=keyboard)

# Запуск бота
async def main():
    print("Тестовый бот запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())