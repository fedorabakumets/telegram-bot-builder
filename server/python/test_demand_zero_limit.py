"""@fileoverview Проверка нулевого лимита без взаимной блокировки спящих ботов."""
import asyncio
import unittest
from demand_settings import resolve_settings
from demand_slot import active_slot


class ZeroLimitTests(unittest.IsolatedAsyncioTestCase):
    """Проверяет числовую настройку и вход в неограниченные сеансы."""

    async def test_zero_slots_are_unlimited(self):
        """Сто задач получают места без семафора и освобождения соседей."""
        receiver = asyncio.create_task(asyncio.sleep(60))
        stopping = asyncio.Event()
        async def enter():
            """Входит в сеанс при отсутствии ограничивающего семафора."""
            async with active_slot(None, receiver, stopping) as acquired:
                return acquired
        try:
            self.assertTrue(all(await asyncio.wait_for(asyncio.gather(*(enter() for _ in range(100))), 1)))
        finally:
            receiver.cancel()
            await asyncio.gather(receiver, return_exceptions=True)

    async def test_settings_accept_zero(self):
        """Ноль принимается явно, отрицательное значение отклоняется."""
        env = {"BOT_POLLING_MODE": "ondemand", "BOT_ON_DEMAND_MAX_ACTIVE": "0", "REDIS_URL": "redis://localhost"}
        self.assertEqual(resolve_settings(1, env, None)["maximum"], 0)
        with self.assertRaises(ValueError):
            resolve_settings(1, {**env, "BOT_ON_DEMAND_MAX_ACTIVE": "-1"}, None)
