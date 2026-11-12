"""@fileoverview Синтетический бот для локального измерения освобождения памяти воркером."""

import asyncio
from aiogram import Dispatcher

# Состояние намеренно ограничено восемью МиБ и небольшим набором Python-объектов.
payload = bytearray(8 * 1024 * 1024)
payload[::4096] = b"x" * len(payload[::4096])
user_data = {index: {"value": "данные" * 10, "id": index} for index in range(15000)}
dispatcher = Dispatcher()
stop_event = asyncio.Event()


def request_bot_stop():
    """Запрашивает штатную остановку без Telegram и сетевых подключений."""
    stop_event.set()


async def main():
    """Удерживает локальное состояние до команды остановки настоящего воркера."""
    await stop_event.wait()
