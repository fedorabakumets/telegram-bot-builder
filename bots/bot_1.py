import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart, Command
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardRemove
from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder

# Токен вашего бота (получите у @BotFather)
BOT_TOKEN = "6389600794:AAE6C0h7ykvO3rYBd7rG7Qz5r12wRSyD-Ls"

# Настройка логирования
logging.basicConfig(level=logging.INFO)

# Создание бота и диспетчера
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()


@dp.message()
async def message_VROEcUC_6_zYjorz2ObFZ_handler(message: types.Message):
    text = "Новое сообщение"
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
