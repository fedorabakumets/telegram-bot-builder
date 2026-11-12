"""@fileoverview Минимальный настоящий aiogram-обработчик для локальной проверки дочернего процесса."""

import asyncio
import os
from aiogram import Bot, Dispatcher
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.client.telegram import TelegramAPIServer
from aiogram.types import Message

_WORKER_READY_PROTOCOL = True
_WORKER_EXTERNAL_UPDATES_PROTOCOL = True
_WORKER_EXTERNAL_UPDATES_SAFE = True
_WORKER_EXTERNAL_STATE_PROTOCOL = True
user_data = {}
_stop = asyncio.Event()


def request_bot_stop():
    """Сигнализирует о штатном завершении фикстуры."""
    _stop.set()


async def main():
    """Обрабатывает сообщения внешней очереди и возвращает счётчик с PID процесса."""
    session = AiohttpSession(api=TelegramAPIServer.from_base(os.environ["TELEGRAM_BOT_API_URL"]))
    bot = Bot(os.environ["BOT_TOKEN"], session=session)
    dispatcher = Dispatcher()

    @dispatcher.message()
    async def message_handler(message: Message):
        """Меняет сохраняемое состояние; отдельные команды моделируют сбой и нагрузку."""
        if message.text == "crash":
            print("fixture_crash", flush=True)
            os._exit(73)
        if message.text == "hold":
            print("fixture_hold", flush=True)
            await asyncio.sleep(60)
        user_data[1] = user_data.get(1, 0) + 1
        await message.answer(f"{user_data[1]}:{os.getpid()}")

    try:
        _worker_bot_ready()
        await _worker_external_updates(dispatcher, bot, _stop)
    finally:
        await bot.session.close()
