"""
Тест кнопки к компоненту - Telegram Bot
Сгенерировано с помощью TelegramBot Builder
"""

import asyncio
import logging
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, BotCommand, ReplyKeyboardRemove
from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder
from aiogram.enums import ParseMode

# Токен вашего бота (получите у @BotFather)
BOT_TOKEN = "8082906513:AAEkTEm-HYvpRkI8ZuPuWmx3f25zi5tm1OE"

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


@dp.message(CommandStart())
async def start_handler(message: types.Message):

    # Регистрируем пользователя в системе
    user_data[message.from_user.id] = {
        "username": message.from_user.username,
        "first_name": message.from_user.first_name,
        "last_name": message.from_user.last_name,
        "registered_at": message.date
    }

    text = """🛍️ Добро пожаловать в наш интернет-магазин!

Что вас интересует?"""
    
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📦 Каталог товаров"))
    builder.add(KeyboardButton(text="🛒 Корзина"))
    builder.add(KeyboardButton(text="ℹ️ О доставке"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    await message.answer(text, reply_markup=keyboard)

# Обработчики inline кнопок

@dp.callback_query(lambda c: c.data == "start-1")
async def handle_callback_start_1(callback_query: types.CallbackQuery):
    await callback_query.answer()
    text = """🛍️ Добро пожаловать в наш интернет-магазин!

Что вас интересует?"""
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📦 Каталог товаров"))
    builder.add(KeyboardButton(text="🛒 Корзина"))
    builder.add(KeyboardButton(text="ℹ️ О доставке"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    # Для reply клавиатуры отправляем новое сообщение и удаляем старое
    try:
        await callback_query.message.delete()
    except:
        pass  # Игнорируем ошибки удаления
    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)

# Обработчики reply кнопок

@dp.message(lambda message: message.text == "📦 Каталог товаров")
async def handle_reply_btn_catalog(message: types.Message):
    text = "📦 **Каталог товаров:**\n\n🏷️ Категории:"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📱 Электроника", callback_data="electronics-1"))
    builder.add(InlineKeyboardButton(text="👕 Одежда", callback_data="clothes-1"))
    builder.add(InlineKeyboardButton(text="🏠 Для дома", callback_data="home-1"))
    builder.add(InlineKeyboardButton(text="◀️ Главное меню", callback_data="start-1"))
    keyboard = builder.as_markup()
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "🛒 Корзина")
async def handle_reply_btn_cart(message: types.Message):
    text = "🛒 **Ваша корзина пуста**\n\nДобавьте товары из каталога!"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📦 Перейти к каталогу"))
    builder.add(KeyboardButton(text="◀️ Главное меню"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "ℹ️ О доставке")
async def handle_reply_btn_info(message: types.Message):
    text = "🚚 **Информация о доставке:**\n\n📦 Бесплатная доставка от 2000₽\n⏱️ Доставка 1-3 дня\n📍 Доставляем по всей России\n\n💳 Оплата при получении или картой"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="◀️ Главное меню"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "📦 Перейти к каталогу")
async def handle_reply_btn_to_catalog(message: types.Message):
    text = "📦 **Каталог товаров:**\n\n🏷️ Категории:"
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📱 Электроника", callback_data="electronics-1"))
    builder.add(InlineKeyboardButton(text="👕 Одежда", callback_data="clothes-1"))
    builder.add(InlineKeyboardButton(text="🏠 Для дома", callback_data="home-1"))
    builder.add(InlineKeyboardButton(text="◀️ Главное меню", callback_data="start-1"))
    keyboard = builder.as_markup()
    await message.answer(text, reply_markup=keyboard)

@dp.message(lambda message: message.text == "◀️ Главное меню")
async def handle_reply_btn_back_cart(message: types.Message):
    text = "🛍️ Добро пожаловать в наш интернет-магазин!\n\nЧто вас интересует?"
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📦 Каталог товаров"))
    builder.add(KeyboardButton(text="🛒 Корзина"))
    builder.add(KeyboardButton(text="ℹ️ О доставке"))
    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)
    await message.answer(text, reply_markup=keyboard)


# Запуск бота
async def main():
    print("Бот запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
