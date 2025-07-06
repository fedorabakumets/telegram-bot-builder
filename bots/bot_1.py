import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart, Command
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardRemove
from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder

# Токен вашего бота (получите у @BotFather)
BOT_TOKEN = "7552080497:AAEJFmsxmY8PnDzgoUpM5NDg5E1ehNYAHYU"

# Настройка логирования
logging.basicConfig(level=logging.INFO)

# Создание бота и диспетчера
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()


@dp.message(CommandStart())
async def start_handler(message: types.Message):
    text = "🚀 Привет! Я твой первый бот!

Ты можешь написать:
• /start - чтобы запустить меня
• старт - это тоже работает!

Выбери действие:"
    
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="ℹ️ Информация"))
    builder.add(KeyboardButton(text="❓ Помощь"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    await message.answer(text, reply_markup=keyboard)

@dp.message()
async def message_info_1_handler(message: types.Message):
    text = "📋 **Информация о боте:**

Это простой бот-пример, который показывает:
• Как работают команды
• Как использовать синонимы
• Базовую навигацию

Теперь ты можешь создать своего!"
    
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="◀️ Назад"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    await message.answer(text, reply_markup=keyboard)

@dp.message()
async def message_help_1_handler(message: types.Message):
    text = "❓ **Справка:**

🔤 **Команды:**
• /start или старт - запуск бота

🎯 **Советы:**
• Используй кнопки для навигации
• Синонимы делают бота удобнее
• Экспериментируй с настройками!"
    
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="◀️ Назад"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    await message.answer(text, reply_markup=keyboard)


# Обработчики синонимов команд
@dp.message(lambda message: message.text and message.text.lower() == "старт")
async def start_synonym_старт_handler(message: types.Message):
    # Синоним для команды /start
    await start_handler(message)

# Запуск бота
async def main():
    try:
        print("Запускаем бота...")
        await dp.start_polling(bot)
    except Exception as e:
        print(f"Ошибка запуска бота: {e}")
        raise

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Бот остановлен")
    except Exception as e:
        print(f"Критическая ошибка: {e}")
        exit(1)
