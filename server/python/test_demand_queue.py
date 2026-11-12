"""@fileoverview Проверки атомарности и повторной доставки очереди на настоящем Redis."""

import asyncio
import os
import sys
import unittest
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from demand_queue import DemandQueue, QueueFullError


class DemandQueueTest(unittest.IsolatedAsyncioTestCase):
    """Проверяет отдельное пространство ключей без изменения очередей настоящих ботов."""

    async def asyncSetUp(self):
        """Выделяет уникальный идентификатор и подключает локальный Redis."""
        self.token_id = uuid.uuid4().int
        self.url = os.environ.get("DEMAND_TEST_REDIS_URL", "redis://127.0.0.1:6379/0")
        self.queue = DemandQueue(self.url, self.token_id, max_pending=2, max_bytes=1000)
        await self.queue.open()

    async def asyncTearDown(self):
        """Удаляет исключительно ключи текущего теста и закрывает клиент."""
        if self.queue.redis is None:
            await self.queue.open()
        await self.queue.redis.delete(*self.queue.keys)
        await self.queue.close()

    async def test_restart_and_ack(self):
        """Неподтверждённая запись переживает переподключение, offset сохраняется."""
        self.assertIsNone(await self.queue.offset())
        await self.queue.enqueue([{"update_id": 10, "message": {"text": "Привет"}}])
        await self.queue.close()
        await self.queue.open()
        self.assertEqual((await self.queue.peek())["update_id"], 10)
        self.assertEqual(await self.queue.offset(), 11)
        await self.queue.ack(10)
        await self.queue.ack(10)
        await self.queue.enqueue([{"update_id": 10}])
        self.assertIsNone(await self.queue.peek())
        self.assertEqual(await self.queue.offset(), 11)

    async def test_atomic_backpressure_and_order(self):
        """Переполненный пакет не меняет смещение; повтор пакета не дублируется."""
        await self.queue.enqueue([{"update_id": 2}, {"update_id": 1}, {"update_id": 2}])
        self.assertEqual((await self.queue.peek())["update_id"], 1)
        with self.assertRaises(QueueFullError):
            await self.queue.enqueue([{"update_id": 3}, {"update_id": 4}])
        self.assertEqual(await self.queue.offset(), 3)
        await self.queue.ack(1)
        await self.queue.enqueue([{"update_id": 2}, {"update_id": 3}])
        self.assertEqual(await self.queue.offset(), 4)
        self.assertEqual((await self.queue.peek())["update_id"], 2)

    async def test_byte_limit_is_atomic(self):
        """Предел учитывает байты UTF-8 и освобождается после подтверждения."""
        self.queue.max_bytes = 80
        update = {"update_id": 1, "text": "я" * 20}
        await self.queue.enqueue([update])
        with self.assertRaises(QueueFullError):
            await self.queue.enqueue([{"update_id": 2, "text": "я" * 20}])
        self.assertEqual(await self.queue.offset(), 2)
        await self.queue.ack(1)
        await self.queue.enqueue([{"update_id": 2, "text": "я" * 20}])
        self.assertEqual(await self.queue.offset(), 3)

    async def test_invalid_batch_has_no_partial_write(self):
        """Неверное обновление отклоняет пакет ещё до вызова Lua."""
        with self.assertRaises(ValueError):
            await self.queue.enqueue([{"update_id": 1}, {"update_id": True}])
        self.assertIsNone(await self.queue.offset())
        self.assertIsNone(await self.queue.peek())

    async def test_weekly_random_update_id_keeps_pending_order(self):
        """После долгого простоя меньший случайный update_id не теряется."""
        await self.queue.enqueue([{"update_id": 10000}])
        await self.queue.redis.set(self.queue.keys[5], 1)
        self.assertIsNone(await self.queue.offset())
        await self.queue.enqueue([{"update_id": 20}])
        self.assertEqual(await self.queue.offset(), 21)
        self.assertEqual((await self.queue.peek())["update_id"], 10000)
        await self.queue.ack(10000)
        self.assertEqual((await self.queue.peek())["update_id"], 20)

    async def test_concurrent_duplicate_batch(self):
        """Одновременные повторы оставляют одну запись и точный счётчик байтов."""
        update = {"update_id": 70, "text": "Проверка"}
        await asyncio.gather(*(self.queue.enqueue([update]) for _ in range(4)))
        self.assertEqual(await self.queue.redis.zcard(self.queue.keys[0]), 1)
        await self.queue.ack(70)
        self.assertEqual(int(await self.queue.redis.get(self.queue.keys[3])), 0)


if __name__ == "__main__":
    unittest.main()
