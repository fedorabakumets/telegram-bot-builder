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
    text = "Привет! Добро пожаловать!"
    
    # Создаем комбинированную клавиатуру (Reply + Inline)
    
    # Сначала создаем reply клавиатуру
    reply_builder = ReplyKeyboardBuilder()
    reply_builder.add(KeyboardButton(text="Новая кнопка"))
    reply_keyboard = reply_builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    await message.answer(text, reply_markup=reply_keyboard)
    
    # Затем создаем inline клавиатуру
    inline_builder = InlineKeyboardBuilder()
    inline_builder.add(InlineKeyboardButton(text="Новая inline кнопка", callback_data="W_-cjO_9uVsz2Cyu951_l"))
    inline_keyboard = inline_builder.as_markup()
    await message.answer("Дополнительные действия:", reply_markup=inline_keyboard)

@dp.message()
async def message_W__cjO_9uVsz2Cyu951_l_handler(message: types.Message):
    text = "Новое сообщение"
    # Удаляем предыдущие reply клавиатуры если они были
    await message.answer(text, reply_markup=ReplyKeyboardRemove())


# Обработчики синонимов команд
@dp.message(lambda message: message.text and message.text.lower() == "старт")
async def start_synonym_старт_handler(message: types.Message):
    # Синоним для команды /start
    await start_handler(message)
@dp.message(lambda message: message.text and message.text.lower() == "начать")
async def start_synonym_начать_handler(message: types.Message):
    # Синоним для команды /start
    await start_handler(message)

# Обработчики inline кнопок
@dp.callback_query(lambda c: c.data == "W_-cjO_9uVsz2Cyu951_l")
async def handle_inline_LcTYPO2_HJ0FkRRNJkpgF(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = "Новое сообщение"
    await callback_query.message.answer(text)

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
