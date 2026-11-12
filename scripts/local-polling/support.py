"""@fileoverview Изолированный стенд Redis и поддельного Telegram для интеграционных тестов."""

import asyncio
import contextlib
import os
import sys
import uuid
from pathlib import Path

from aiohttp import web

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "server/python"))
from demand_queue import DemandQueue


async def until(predicate, timeout=5):
    """Ждёт проверяемое состояние с общим ограничением времени."""
    async with asyncio.timeout(timeout):
        while not await predicate():
            await asyncio.sleep(0.01)


async def cancel(task):
    """Завершает задачу, сохраняя исключения кроме ожидаемой отмены."""
    task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await task


class FakeTelegram:
    """Отдаёт обновления по offset и фиксирует фактические HTTP-запросы."""

    def __init__(self):
        """Создаёт отдельные очереди токенов без настоящих учётных данных."""
        self.updates = {}
        self.calls = []
        self.runner = None

    async def open(self):
        """Поднимает HTTP только на случайном локальном порту."""
        app = web.Application()
        app.router.add_post("/bot{token}/getUpdates", self.receive)
        self.runner = web.AppRunner(app, shutdown_timeout=0.1)
        await self.runner.setup()
        site = web.TCPSite(self.runner, "127.0.0.1", 0)
        await site.start()
        self.url = f"http://127.0.0.1:{site._server.sockets[0].getsockname()[1]}"

    async def receive(self, request):
        """Возвращает непринятый пакет и имитирует ожидание пустой очереди."""
        body = await request.json()
        token = request.match_info["token"]
        self.calls.append((token, body.get("offset")))
        offset = body.get("offset") or 0
        result = [item for item in self.updates.get(token, [])
                  if item["update_id"] >= offset]
        if not result:
            await asyncio.sleep(0.03)
        return web.json_response({"ok": True, "result": result})

    async def close(self):
        """Закрывает только HTTP-стенд текущего теста."""
        await self.runner.cleanup()


async def create_queue(max_pending=1000):
    """Создаёт очередь с уникальным идентификатором, не трогая рабочие ключи."""
    queue = DemandQueue(os.environ.get("LOCAL_POLLING_REDIS_URL", "redis://127.0.0.1:6379/0"),
                        7_000_000_000 + uuid.uuid4().int % 1_000_000_000,
                        max_pending=max_pending)
    await queue.open()
    return queue


async def destroy_queue(queue):
    """Удаляет исключительно ключи созданной тестом очереди."""
    await queue.redis.delete(*queue.keys)
    await queue.close()
