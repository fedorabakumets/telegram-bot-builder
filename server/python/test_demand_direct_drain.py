"""@fileoverview Регрессии безопасного переноса backlog перед обычным polling."""

import asyncio
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parent))


class DirectDrainTests(unittest.IsolatedAsyncioTestCase):
    """Проверяет обработку и подтверждение без внешних соединений."""

    def setUp(self):
        """Создать изменяемую очередь с атомарным тестовым подтверждением."""
        from demand_direct_drain import drain_direct
        self.drain = drain_direct
        self.items = [{"update_id": 101}, {"update_id": 102}]
        self.events = []
        self.ctx = types.SimpleNamespace(env={"REDIS_URL": "redis://test"},
            token="123456:example-token", project_id=12, token_id=8,
            _direct_lease_owner="lease")
        self.module = types.SimpleNamespace(user_data={})
        self.queue = types.SimpleNamespace(open=AsyncMock(), close=AsyncMock(),
            peek=AsyncMock(side_effect=self.peek), offset=AsyncMock(return_value=None),
            enqueue=AsyncMock(), redis=types.SimpleNamespace(get=AsyncMock(return_value="lease")))
        self.state = types.SimpleNamespace(save_and_ack=AsyncMock(side_effect=self.ack))
        self.dispatcher = types.SimpleNamespace(feed_update=AsyncMock(side_effect=self.feed))
        self.bot = types.SimpleNamespace(get_updates=AsyncMock(return_value=[]))
        self.stop = asyncio.Event()
        for mocked in (patch("demand_direct_drain.DemandQueue", return_value=self.queue),
                       patch("demand_direct_drain.DemandState", return_value=self.state),
                       patch("demand_direct_drain.get_base_environ", return_value={})):
            mocked.start()
            self.addCleanup(mocked.stop)

    async def peek(self):
        """Отдавать только первый ещё не подтверждённый пакет."""
        return self.items[0] if self.items else None

    async def feed(self, bot, update, **kwargs):
        """Фиксировать реальный порядок передачи в диспетчер."""
        self.events.append(("feed", update.update_id, kwargs))

    async def ack(self, module, update_id, **fence):
        """Имитировать успешную атомарную запись снимка и удаление пакета."""
        self.events.append(("ack", update_id))
        self.assertEqual(fence, {"lease_key": f"bot:lock:{self.ctx.token[-10:]}", "lease_owner": "lease"})
        self.assertEqual(self.items[0]["update_id"], update_id)
        self.items.pop(0)

    async def run_drain(self):
        """Запустить настоящий алгоритм с тестовыми зависимостями."""
        await self.drain(self.ctx, self.module, self.dispatcher, self.bot, self.stop)

    async def test_fifo_and_persisted_flag(self):
        """Каждый пакет исполняется по FIFO перед своим подтверждением."""
        await self.run_drain()
        self.assertEqual([(e[0], e[1]) for e in self.events],
                         [("feed", 101), ("ack", 101), ("feed", 102), ("ack", 102)])
        self.assertTrue(all(e[2]["_worker_persisted_backlog"] for e in self.events if e[0] == "feed"))
        self.queue.close.assert_awaited_once()

    async def test_handler_failure_preserves_queue(self):
        """Ошибка обработчика сохраняет текущий и последующие пакеты."""
        self.dispatcher.feed_update.side_effect = RuntimeError("ошибка обработчика")
        with self.assertRaises(RuntimeError):
            await self.run_drain()
        self.state.save_and_ack.assert_not_awaited()
        self.assertEqual(len(self.items), 2)
        self.queue.close.assert_awaited_once()

    async def test_cancellation_preserves_queue(self):
        """Отмена исполнения не превращается в подтверждение обновления."""
        self.dispatcher.feed_update.side_effect = asyncio.CancelledError()
        with self.assertRaises(asyncio.CancelledError):
            await self.run_drain()
        self.state.save_and_ack.assert_not_awaited()
        self.assertEqual(len(self.items), 2)

    async def test_ack_retry_does_not_redispatch(self):
        """Временная ошибка сохранения повторяет ACK, а не обработчик."""
        original_ack = self.ack
        failed = False

        async def retry_ack(module, update_id, **fence):
            """Первый вызов имитирует краткий разрыв Redis."""
            nonlocal failed
            if not failed:
                failed = True
                raise OSError("временный сбой Redis")
            await original_ack(module, update_id, **fence)

        self.state.save_and_ack.side_effect = retry_ack
        await self.run_drain()
        self.assertEqual(self.dispatcher.feed_update.await_count, 2)
        self.assertEqual(self.state.save_and_ack.await_count, 3)

    async def test_lost_lease_does_not_dispatch(self):
        """Чужой владелец блокировки запрещает начало обработки."""
        self.queue.redis.get.return_value = "new-owner"
        with self.assertRaises(RuntimeError):
            await self.run_drain()
        self.dispatcher.feed_update.assert_not_awaited()
        self.state.save_and_ack.assert_not_awaited()

    async def test_stop_during_handler_preserves_queue(self):
        """Остановка отменяет зависший обработчик, сохраняя очередь без ACK."""
        entered = asyncio.Event()
        cancelled = asyncio.Event()

        async def waiting_handler(*args, **kwargs):
            """Ждать отмены, чтобы проверить завершение задачи обработчика."""
            entered.set()
            try:
                await asyncio.Event().wait()
            finally:
                cancelled.set()

        self.dispatcher.feed_update.side_effect = waiting_handler
        task = asyncio.create_task(self.run_drain())
        try:
            await asyncio.wait_for(entered.wait(), timeout=2)
            self.stop.set()
            with self.assertRaises((RuntimeError, asyncio.CancelledError)):
                await asyncio.wait_for(task, timeout=2)
            self.assertTrue(cancelled.is_set())
            self.state.save_and_ack.assert_not_awaited()
            self.assertEqual(len(self.items), 2)
        finally:
            if not task.done():
                task.cancel()
                await asyncio.gather(task, return_exceptions=True)


if __name__ == "__main__":
    unittest.main()

