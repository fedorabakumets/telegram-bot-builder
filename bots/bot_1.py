import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart, Command
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardRemove
from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder

# Токен вашего бота (получите у @BotFather)
BOT_TOKEN = "8082906513:AAEkTEm-HYvpRkI8ZuPuWmx3f25zi5tm1OE"

# Настройка логирования
logging.basicConfig(level=logging.INFO)

# Создание бота и диспетчера
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()


@dp.message()
async def message_VROEcUC_6_zYjorz2ObFZ_handler(message: types.Message):
    text = "Новое сообщение"
    
    # Создаем комбинированную клавиатуру (Reply + Inline)
    
    # Сначала создаем reply клавиатуру
    reply_builder = ReplyKeyboardBuilder()
    reply_builder.add(KeyboardButton(text="Новая кнопка"))
    reply_keyboard = reply_builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    # Отправляем основное сообщение с reply клавиатурой
    await message.answer(text, reply_markup=reply_keyboard)
    
    # Затем создаем inline клавиатуру
    inline_builder = InlineKeyboardBuilder()
    inline_builder.add(InlineKeyboardButton(text="Новая inline кнопка", callback_data="Новая inline кнопка"))
    inline_keyboard = inline_builder.as_markup()
    # Отправляем inline кнопки минимальным сообщением для прикрепления к основному тексту
    # Прикрепляем inline кнопки к сообщению с минимальным индикатором
    await message.answer("⚡", reply_markup=inline_keyboard)


# Обработчики inline кнопок
@dp.callback_query(lambda c: c.data == "Новая inline кнопка")
async def handle_inline_nCZQA9bmJ_4mFLVsaQ8as(callback_query: types.CallbackQuery):
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
