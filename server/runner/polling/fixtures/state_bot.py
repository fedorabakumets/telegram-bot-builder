"""@fileoverview Изолированный сценарий проверки очереди и состояния без Telegram API."""
import asyncio

_WORKER_EXTERNAL_UPDATES_PROTOCOL = True
_WORKER_EXTERNAL_UPDATES_SAFE = True
_WORKER_EXTERNAL_STATE_PROTOCOL = True
_WORKER_READY_PROTOCOL = True
user_data = {}


class Dispatcher:
    """Заменяет только пользовательскую обработку, сохраняя настоящий путь очереди."""

    async def feed_update(self, bot, update):
        """Увеличивает сохраняемый счётчик и моделирует асинхронную работу."""
        await asyncio.sleep(0.15)
        user_data["count"] = user_data.get("count", 0) + 1
        print("HANDLED=" + str(user_data["count"]))


async def main():
    """Передаёт обработку настоящему ProcessChildFeed и ждёт освобождения процесса."""
    _worker_bot_ready()
    await _worker_external_updates(Dispatcher(), None, asyncio.Event())
