"""@fileoverview Проверка настоящего HTTP-приёмника с Redis без запросов Telegram."""

import asyncio
import unittest
import uuid

from support import FakeTelegram, cancel, create_queue, destroy_queue, until
from demand_poller import DemandPoller


class TransportTests(unittest.IsolatedAsyncioTestCase):
    """Проверяет подтверждения, конкуренцию и восстановление долговечной очереди."""

    async def asyncSetUp(self):
        """Создаёт изолированный HTTP-стенд и список ресурсов для очистки."""
        self.telegram = FakeTelegram()
        await self.telegram.open()
        self.queues = []
        self.tasks = []

    async def asyncTearDown(self):
        """Останавливает приём до удаления только тестовых Redis-ключей."""
        for task in self.tasks:
            await cancel(task)
        for queue in self.queues:
            await destroy_queue(queue)
        await self.telegram.close()

    async def start(self, updates, max_pending=1000):
        """Запускает настоящий DemandPoller с уникальным искусственным токеном."""
        queue = await create_queue(max_pending)
        self.queues.append(queue)
        token = "12345:" + uuid.uuid4().hex
        self.telegram.updates[token] = updates
        wake = asyncio.Event()
        async def wake_handler():
            """Фиксирует сигнал только после долговечной записи."""
            self.assertIsNotNone(await queue.peek())
            wake.set()
        poller = DemandPoller(token, queue, wake_handler, api_base=self.telegram.url)
        task = asyncio.create_task(poller.run())
        self.tasks.append(task)
        await asyncio.wait_for(poller.ready.wait(), 3)
        return queue, token, wake, task

    async def test_two_tokens_receive_independently_and_confirm_persisted_offset(self):
        """Оба токена принимают одновременно, подтверждая сохранённые смещения."""
        first, token1, wake1, _ = await self.start([{"update_id": 41}])
        second, token2, wake2, _ = await self.start([{"update_id": 81}])
        await asyncio.wait_for(asyncio.gather(wake1.wait(), wake2.wait()), 3)
        async def confirmed():
            """Проверяет реальные HTTP-подтверждения обеих очередей."""
            return (token1, 42) in self.telegram.calls and (token2, 82) in self.telegram.calls
        await until(confirmed)
        self.assertEqual((await first.peek())["update_id"], 41)
        self.assertEqual((await second.peek())["update_id"], 81)

    async def test_full_queue_prevents_confirmation_until_capacity_returns(self):
        """При перегрузке смещение не уходит Telegram и старый пакет не теряется."""
        queue, token, wake, _ = await self.start([], max_pending=1)
        await queue.enqueue([{"update_id": 10}])
        self.telegram.updates[token] = [{"update_id": 11}]
        await asyncio.sleep(0.15)
        self.assertEqual(await queue.offset(), 11)
        self.assertNotIn((token, 12), self.telegram.calls)
        await queue.ack(10)
        await asyncio.wait_for(wake.wait(), 3)
        self.assertEqual((await queue.peek())["update_id"], 11)

    async def test_stop_restart_keeps_unhandled_update_and_offset(self):
        """Перезапуск приёмника сохраняет пакет до явного подтверждения обработчиком."""
        queue, token, wake, task = await self.start([{"update_id": 200}])
        await asyncio.wait_for(wake.wait(), 3)
        await cancel(task)
        self.tasks.remove(task)
        await queue.close()
        await queue.open()
        self.assertEqual((await queue.peek())["update_id"], 200)
        self.assertEqual(await queue.offset(), 201)
        wake.clear()
        async def unexpected_update():
            """Фиксирует ошибочную повторную доставку уже сохранённого пакета."""
            wake.set()
        restarted = DemandPoller(token, queue, unexpected_update, api_base=self.telegram.url)
        self.tasks.append(asyncio.create_task(restarted.run()))
        await asyncio.wait_for(restarted.ready.wait(), 3)
        await asyncio.sleep(0.1)
        self.assertFalse(wake.is_set())
        await queue.ack(200)
        self.assertIsNone(await queue.peek())


if __name__ == "__main__":
    unittest.main()
