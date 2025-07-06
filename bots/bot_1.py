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


@dp.message()
async def message___HwJQRzWZX0MA6A3pkJN_handler(message: types.Message):
    text = "Новое сообщение"
    
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="Новая кнопка", callback_data="oIfC5qbiBxJhFu0mNd3Kq"))
    keyboard = builder.as_markup()
    # Удаляем предыдущие reply клавиатуры перед показом inline кнопок
    await message.answer(text, reply_markup=ReplyKeyboardRemove())
    await message.answer("Выберите действие:", reply_markup=keyboard)


# Обработчики inline кнопок
@dp.callback_query(lambda c: c.data == "oIfC5qbiBxJhFu0mNd3Kq")
async def handle_inline_krIgtlMpkWNeC884P640z(callback_query: types.CallbackQuery):
    await callback_query.answer()
    await callback_query.message.answer("Переход к: Новая inline кнопка")

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
