"""
Минимальный тест-бот для диагностики команд
"""

import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart, Command

# ЗАМЕНИТЕ НА ВАШ ТОКЕН!
BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"

logging.basicConfig(level=logging.INFO)

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

@dp.message(CommandStart())
async def start_handler(message: types.Message):
    await message.answer("🚀 Стартовая команда работает!")

@dp.message(Command("test"))
async def test_handler(message: types.Message):
    await message.answer("✅ Тестовая команда работает!")

@dp.message(Command("help"))
async def help_handler(message: types.Message):
    await message.answer("❓ Команда помощи работает!")

async def main():
    print("🤖 Запуск минимального тест-бота...")
    print("📝 НЕ ЗАБУДЬТЕ ЗАМЕНИТЬ ТОКЕН!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
