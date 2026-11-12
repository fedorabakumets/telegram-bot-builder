"""@fileoverview Изолированный минимальный модуль бота для локального замера загрузки.

Фикстура повторяет регистрацию обработчика; не запускает polling, вебхук или сеть.
Это не полный результат генератора и не модель памяти настоящего проекта.
"""
from aiogram import Bot, Dispatcher
from aiogram.filters import Command

bot = Bot("123456:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi")
dp = Dispatcher()


@dp.message(Command("start"))
async def start(message):
    """Обрабатывает тестовую команду без отправки запросов Telegram."""
    return None
