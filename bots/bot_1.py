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
    text = "Главное меню с inline кнопками"
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📊 Статистика", callback_data="stats"))
    builder.add(InlineKeyboardButton(text="⚙️ Настройки", callback_data="settings"))
    builder.add(InlineKeyboardButton(text="🌐 Сайт", url="https://example.com"))
    keyboard = builder.as_markup()
    # Удаляем предыдущие reply клавиатуры перед показом inline кнопок
    await message.answer(text, reply_markup=ReplyKeyboardRemove())
    await message.answer("Выберите действие:", reply_markup=keyboard)

@dp.message(Command("menu"))
async def menu_handler(message: types.Message):
    text = "Дополнительное меню"
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📈 Графики", callback_data="charts"))
    builder.add(InlineKeyboardButton(text="📝 Отчеты", callback_data="reports"))
    keyboard = builder.as_markup()
    # Удаляем предыдущие reply клавиатуры перед показом inline кнопок
    await message.answer(text, reply_markup=ReplyKeyboardRemove())
    await message.answer("Выберите действие:", reply_markup=keyboard)

@dp.message()
async def message_msg_1_handler(message: types.Message):
    text = "Простое сообщение без кнопок"
    # Удаляем предыдущие reply клавиатуры если они были
    await message.answer(text, reply_markup=ReplyKeyboardRemove())


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
