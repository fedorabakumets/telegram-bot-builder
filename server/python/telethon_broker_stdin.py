"""@fileoverview Штатная остановка локального брокера через закрытый канал запускающего процесса."""

import asyncio
import sys
import threading

from aiohttp.web_runner import GracefulExit


async def enable_stdin_shutdown(_app):
    """Завершает aiohttp с cleanup только по явной команде родителя через stdin."""
    loop = asyncio.get_running_loop()

    def stop():
        """Повторяет штатный обработчик сигнала aiohttp, включая закрытие клиентов."""
        raise GracefulExit()

    def read():
        """Читает единственную команду, не удерживая процесс после закрытия event loop."""
        if sys.stdin.readline().strip() == "shutdown" and not loop.is_closed():
            loop.call_soon_threadsafe(stop)

    threading.Thread(target=read, daemon=True).start()
