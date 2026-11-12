"""@fileoverview Синтетический обработчик с 64 МиБ памяти для проверки завершения процесса."""

import asyncio
import json
import os

_WORKER_READY_PROTOCOL = True
_WORKER_EXTERNAL_UPDATES_PROTOCOL = True
_WORKER_EXTERNAL_UPDATES_SAFE = True
_WORKER_EXTERNAL_STATE_PROTOCOL = True
user_data = {}
payload = bytearray(64 * 1024 * 1024)
payload[::4096] = b"x" * len(payload[::4096])
stop_event = asyncio.Event()


class Dispatcher:
    """Подменяет прикладную обработку без обращения к настоящему Telegram."""

    async def feed_update(self, bot, update):
        """Запоминает идентификатор и сообщает PID для внешнего измерения памяти."""
        user_data["last_update"] = update.update_id
        print("MEMORY_PROBE:" + json.dumps({"pid": os.getpid(), "parent_pid": os.getppid(),
                                           "update_id": update.update_id}), flush=True)


def request_bot_stop():
    """Даёт воркеру штатно завершить синтетическую прикладную часть."""
    stop_event.set()


async def main():
    """Использует внешний источник обновлений настоящего процесса-обработчика."""
    _worker_bot_ready()
    await _worker_external_updates(Dispatcher(), None, stop_event)
