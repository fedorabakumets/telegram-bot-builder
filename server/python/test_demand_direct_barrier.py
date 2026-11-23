"""@fileoverview Проверка сохранения новых Telegram-пакетов при барьере direct."""

import asyncio
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parent))

from aiogram.types import Update
from demand_direct_drain import drain_direct


class DirectBarrierTest(unittest.IsolatedAsyncioTestCase):
    """Проверяет durable offset и запись полученных пакетов до обработки."""

    async def test_returned_updates_are_durable_before_dispatch(self):
        """Новые ответы getUpdates сначала сохраняются, затем исполняются и ACK."""
        events = []
        items = []
        offset = 51
        ctx = types.SimpleNamespace(token="123456:example-token", project_id=1,
            token_id=2, _direct_lease_owner="lease", env={"REDIS_URL": "redis://test"})
        module = types.SimpleNamespace(user_data={})

        async def peek():
            """Показывать только сохранённые пакеты."""
            return items[0] if items else None

        async def enqueue(updates):
            """Сохранить пакет и новое смещение до любого обработчика."""
            nonlocal offset
            events.append("enqueue")
            items.extend(updates)
            offset = updates[-1]["update_id"] + 1

        async def feed(bot, update, **kwargs):
            """Проверить наличие исполняемого пакета в надёжной очереди."""
            events.append("feed")
            self.assertEqual(items, [{"update_id": update.update_id}])

        async def ack(target, update_id, **fence):
            """Подтвердить только текущий сохранённый пакет под точным lease."""
            self.assertIs(target, module)
            self.assertEqual(fence, {"lease_key": f"bot:lock:{ctx.token[-10:]}", "lease_owner": "lease"})
            events.append("ack")
            self.assertEqual(items.pop(0), {"update_id": update_id})

        queue = types.SimpleNamespace(open=AsyncMock(), close=AsyncMock(),
            peek=AsyncMock(side_effect=peek), enqueue=AsyncMock(side_effect=enqueue),
            offset=AsyncMock(side_effect=lambda: offset),
            redis=types.SimpleNamespace(get=AsyncMock(return_value="lease")))
        state = types.SimpleNamespace(save_and_ack=AsyncMock(side_effect=ack))
        dispatcher = types.SimpleNamespace(feed_update=AsyncMock(side_effect=feed))
        bot = types.SimpleNamespace(get_updates=AsyncMock(side_effect=[[Update(update_id=51)], []]))
        with patch("demand_direct_drain.DemandQueue", return_value=queue), \
             patch("demand_direct_drain.DemandState", return_value=state), \
             patch("demand_direct_drain.get_base_environ", return_value={}):
            await drain_direct(ctx, module, dispatcher, bot, asyncio.Event())
        self.assertEqual(events, ["enqueue", "feed", "ack"])
        self.assertEqual([call.kwargs for call in bot.get_updates.await_args_list],
            [{"offset": 51, "timeout": 0, "limit": 100}, {"offset": 52, "timeout": 0, "limit": 100}])
        self.assertEqual(items, [])
        queue.close.assert_awaited_once()


if __name__ == "__main__":
    unittest.main()
