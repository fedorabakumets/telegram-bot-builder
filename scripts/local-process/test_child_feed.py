"""@fileoverview Адресная проверка простоя и атомарного подтверждения дочернего обработчика."""

import asyncio
from pathlib import Path
import sys
from types import SimpleNamespace
import unittest
from unittest.mock import AsyncMock

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "server" / "python"))
from process_child_feed import ProcessChildFeed


class ChildFeedTests(unittest.IsolatedAsyncioTestCase):
    """Проверяет, что спящий обработчик не удерживается вечным ожиданием очереди."""

    def make_feed(self):
        """Создаёт адаптер с изолированными заменами Redis и снимка."""
        ctx = SimpleNamespace(token="123456:unused", project_id=1, token_id=2,
                              module=SimpleNamespace(user_data={}))
        feed = ProcessChildFeed(ctx, "redis://127.0.0.1:6379", 0.1)
        feed.queue = SimpleNamespace(peek=AsyncMock(return_value=None))
        feed.state = SimpleNamespace(save_and_ack=AsyncMock())
        return feed

    async def test_empty_queue_exits_after_idle(self):
        """Пустая очередь завершает feed без изменения снимка или ACK."""
        feed = self.make_feed()
        await asyncio.wait_for(feed.feed(AsyncMock(), object(), asyncio.Event()), 20)
        self.assertTrue(feed.idled)
        feed.state.save_and_ack.assert_not_awaited()

    async def test_update_ack_follows_successful_handler(self):
        """Снимок и ACK вызываются только после успешной обработки обновления."""
        feed = self.make_feed()
        feed.queue.peek.side_effect = [{"update_id": 7}, None, None]
        dispatcher = SimpleNamespace(feed_update=AsyncMock())
        await asyncio.wait_for(feed.feed(dispatcher, None, asyncio.Event()), 20)
        dispatcher.feed_update.assert_awaited_once()
        feed.state.save_and_ack.assert_awaited_once_with(feed.ctx.module, 7)

    async def test_failed_handler_does_not_ack(self):
        """Сбой оставляет обновление для повторной доставки следующему процессу."""
        feed = self.make_feed()
        feed.queue.peek.return_value = {"update_id": 8}
        dispatcher = SimpleNamespace(feed_update=AsyncMock(side_effect=RuntimeError("сбой")))
        with self.assertRaises(RuntimeError):
            await feed.feed(dispatcher, None, asyncio.Event())
        feed.state.save_and_ack.assert_not_awaited()


if __name__ == "__main__":
    unittest.main()
