"""@fileoverview Проверки приёмника polling через локальный HTTP без Telegram."""

import asyncio
import sys
import unittest
from pathlib import Path
from aiohttp import web

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "server/python"))
from demand_poller import DemandPoller, PollingRejected
from demand_queue import QueueFullError


class FakeRedis:
    """Моделирует единственного владельца lease без внешнего сервера."""

    def __init__(self):
        """Создаёт свободную блокировку."""
        self.owner = None

    async def set(self, key, owner, **kwargs):
        """Атомарно назначает владельца только свободной блокировке."""
        if self.owner:
            return False
        self.owner = owner
        return True

    async def eval(self, script, count, key, owner):
        """Снимает только принадлежащую вызывающему блокировку."""
        if self.owner != owner:
            return 0
        if "DEL" in script:
            self.owner = None
        return 1


class FakeQueue:
    """Проверяет порядок записи и позволяет воспроизвести перегрузку."""

    def __init__(self):
        """Задаёт пустую очередь и начальное смещение."""
        self.redis = FakeRedis()
        self.saved = []
        self.full_once = False

    async def offset(self):
        """Возвращает следующее смещение только сохранённых данных."""
        return self.saved[-1]["update_id"] + 1 if self.saved else None

    async def enqueue(self, updates):
        """Записывает пакет целиком либо сообщает перегрузку."""
        if self.full_once:
            self.full_once = False
            raise QueueFullError()
        self.saved.extend(updates)


class ReceiverTests(unittest.IsolatedAsyncioTestCase):
    """Проверяет сохранение, конфликты и завершение на реальном HTTP."""

    async def asyncSetUp(self):
        """Запускает безопасный локальный заменитель Telegram API."""
        self.queue = FakeQueue()
        self.requests = []
        self.status = 200
        app = web.Application()
        app.router.add_post("/botfake/getUpdates", self.handle)
        self.runner = web.AppRunner(app)
        await self.runner.setup()
        site = web.TCPSite(self.runner, "127.0.0.1", 0)
        await site.start()
        self.base = f"http://127.0.0.1:{site._server.sockets[0].getsockname()[1]}"

    async def asyncTearDown(self):
        """Освобождает локальный сервер после каждого теста."""
        await self.runner.cleanup()

    async def handle(self, request):
        """Возвращает обновление один раз, затем удерживает long poll."""
        self.requests.append(await request.json())
        if self.status != 200:
            return web.json_response({"ok": False, "error_code": self.status})
        if len(self.requests) == 1:
            return web.json_response({"ok": True, "result": [{"update_id": 7}]})
        await asyncio.sleep(0.1)
        return web.json_response({"ok": True, "result": []})

    async def test_persist_before_offset_and_cancel(self):
        """Следующий HTTP подтверждает только записанный пакет; отмена снимает lease."""
        wake = asyncio.Event()

        async def notify():
            """Сигнализирует о сохранённом пакете."""
            wake.set()

        self.queue.full_once = True
        poller = DemandPoller("fake", self.queue, notify, api_base=self.base)
        task = asyncio.create_task(poller.run())
        await asyncio.wait_for(wake.wait(), 3)
        while len(self.requests) < 2:
            await asyncio.sleep(0.01)
        task.cancel()
        await asyncio.gather(task, return_exceptions=True)
        self.assertEqual(self.requests[1]["offset"], 8)
        self.assertIn("chat_member", self.requests[0]["allowed_updates"])
        self.assertIn("message_reaction", self.requests[0]["allowed_updates"])
        self.assertIn("purchased_paid_media", self.requests[0]["allowed_updates"])
        self.assertEqual(len(self.queue.saved), 1)
        self.assertIsNone(self.queue.redis.owner)

    async def test_rejected_token_is_sanitized(self):
        """Постоянный отказ прекращает цикл и не раскрывает токен."""
        self.status = 401
        cleanup_called = []

        async def cleanup():
            """Доказывает удержание владельца до завершения обработки."""
            self.assertIsNotNone(self.queue.redis.owner)
            cleanup_called.append(True)

        poller = DemandPoller("fake", self.queue, None, api_base=self.base,
                              on_stopping=cleanup)
        with self.assertRaisesRegex(PollingRejected, "код 401") as raised:
            await poller.run()
        self.assertNotIn("fake", str(raised.exception))
        self.assertEqual(cleanup_called, [True])
        self.assertIsNone(self.queue.redis.owner)

    async def test_conflicting_owner_prevents_http(self):
        """Занятая lease исключает параллельный getUpdates."""
        self.queue.redis.owner = "other"
        with self.assertRaisesRegex(RuntimeError, "другому"):
            await DemandPoller("fake", self.queue, None, api_base=self.base).run()
        self.assertFalse(self.requests)
        self.assertEqual(self.queue.redis.owner, "other")

    async def test_pause_retains_lease_until_handler_cleanup(self):
        """Пауза прекращает HTTP, сохраняя владельца на время завершения обработчика."""
        wake = asyncio.Event()

        async def notify():
            """Пробуждает тест после сохранения первого обновления."""
            wake.set()

        poller = DemandPoller("fake", self.queue, notify, api_base=self.base)
        task = asyncio.create_task(poller.run())
        await asyncio.wait_for(wake.wait(), 3)
        await poller.pause()
        count = len(self.requests)
        await asyncio.sleep(0.15)
        self.assertEqual(count, len(self.requests))
        self.assertIsNotNone(self.queue.redis.owner)
        self.assertFalse(task.done())
        task.cancel()
        await asyncio.gather(task, return_exceptions=True)
        self.assertIsNone(self.queue.redis.owner)


if __name__ == "__main__":
    unittest.main()
