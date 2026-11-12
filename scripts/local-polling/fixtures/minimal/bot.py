"""@fileoverview Минимальный совместимый бот для проверки полного жизненного цикла воркера."""

import asyncio
import os

_WORKER_READY_PROTOCOL = True
_WORKER_EXTERNAL_UPDATES_PROTOCOL = True
_WORKER_EXTERNAL_STATE_PROTOCOL = 1
_WORKER_EXTERNAL_UPDATES_SAFE = True
user_data = {}
_stop_event = None


class Dispatcher:
    """Имитирует эффект сценария без настоящих сообщений Telegram."""

    async def feed_update(self, bot, update):
        """Проверяет окружение и увеличивает сохраняемое состояние с целочисленным ключом."""
        user_data[123] = user_data.get(123, 0) + 1
        print(f"processed:{update.update_id}:{user_data[123]}:env={os.environ.get('TOKEN_ID')}")


async def main():
    """Использует внешний приёмник или остаётся в обычном активном режиме."""
    global _stop_event
    _stop_event = asyncio.Event()
    _worker_bot_ready()
    external = globals().get("_worker_external_updates")
    if external:
        await external(Dispatcher(), None, _stop_event)
    else:
        await _stop_event.wait()


def request_bot_stop():
    """Просит main завершиться штатно без принудительной отмены задачи."""
    if _stop_event is not None:
        _stop_event.set()
