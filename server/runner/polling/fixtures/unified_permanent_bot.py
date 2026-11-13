"""@fileoverview Постоянный тестовый бот с независимым состоянием без обращения к Telegram."""
import asyncio
import os

_WORKER_READY_PROTOCOL = True
_stop_event = asyncio.Event()
user_data = {}


def request_bot_stop():
    """Останавливает только данный сценарий, сохраняя соседние активации."""
    _stop_event.set()


async def main():
    """Публикует PID и счётчик фоновой работы для проверки постоянного размещения."""
    _worker_bot_ready()
    while not _stop_event.is_set():
        user_data["count"] = user_data.get("count", 0) + 1
        print(f"PERMANENT_TICK={user_data['count']} PID={os.getpid()} "
              f"LABEL={os.getenv('SHARED_TEST_LABEL', 'missing')}")
        try:
            await asyncio.wait_for(_stop_event.wait(), timeout=0.1)
        except asyncio.TimeoutError:
            pass
