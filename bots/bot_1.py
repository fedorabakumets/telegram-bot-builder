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
    text = "Добро пожаловать! 👋

Я информационный бот. Выберите, что вас интересует:"
    
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📋 Информация"))
    builder.add(KeyboardButton(text="📞 Контакты"))
    builder.add(KeyboardButton(text="❓ Помощь"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    await message.answer(text, reply_markup=keyboard)

@dp.message()
async def message_info_1_handler(message: types.Message):
    text = "ℹ️ **Информация о нас**

Мы предоставляем качественные услуги и всегда готовы помочь нашим клиентам."
    
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="◀️ Назад"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    await message.answer(text, reply_markup=keyboard)

@dp.message()
async def message_contacts_1_handler(message: types.Message):
    text = "📞 **Наши контакты:**

📧 Email: info@example.com
📱 Телефон: +7 (999) 123-45-67
🌐 Сайт: example.com"
    
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="◀️ Назад"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    await message.answer(text, reply_markup=keyboard)

@dp.message(Command("help"))
async def help_handler(message: types.Message):
    text = "❓ **Справка**

Используйте кнопки меню для навигации по боту.

Доступные команды:
/start - Главное меню
/help - Эта справка"
    
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📋 Главное меню"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    await message.answer(text, reply_markup=keyboard)


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
