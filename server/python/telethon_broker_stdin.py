"""@fileoverview Штатная остановка локального брокера через закрытый канал запускающего процесса."""

import asyncio
import sys
import threading

from aiohttp.web_runner import GracefulExit


def raise_graceful_exit():
    """Передаёт управление штатному cleanup aiohttp без обхода закрытия клиентов."""
    raise GracefulExit()


def request_broker_shutdown():
    """Планирует выход вне фоновой задачи, чтобы run_app завершил сервер и cleanup."""
    asyncio.get_running_loop().call_soon(raise_graceful_exit)


async def enable_stdin_shutdown(_app):
    """Завершает aiohttp с cleanup только по явной команде родителя через stdin."""
    loop = asyncio.get_running_loop()

    def read():
        """Читает единственную команду, не удерживая процесс после закрытия event loop."""
        line = sys.stdin.readline()
        # EOF закрытого управляющего канала также означает утрату родителя.
        if (line == "" or line.strip() == "shutdown") and not loop.is_closed():
            loop.call_soon_threadsafe(raise_graceful_exit)

    threading.Thread(target=read, daemon=True).start()
