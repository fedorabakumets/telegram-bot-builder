"""@fileoverview Проверки общего FloodWait, ограниченной очереди и отзыва авторизации."""

import asyncio
import unittest
from unittest.mock import AsyncMock

from telethon.errors import FloodWaitError, SessionRevokedError

from telethon_broker_clients import BrokerError, TelethonClientBroker
from test_telethon_broker_clients import FakeClient, client_is_open


class BrokerLimitsTest(unittest.IsolatedAsyncioTestCase):
    """Проверяет ограничения двух потребителей одной сессии без сети."""

    async def test_flood_wait_blocks_other_consumer_only_for_same_account(self):
        """Следующий бот получает общий запрет, другой аккаунт продолжает работу."""
        broker = TelethonClientBroker(lambda _cfg: FakeClient())
        operation = AsyncMock(side_effect=FloodWaitError(request=None, capture=30))
        with self.assertRaises(FloodWaitError):
            await broker.execute("a", "key-a", "cfg", None, operation)
        next_operation = AsyncMock()
        with self.assertRaises(BrokerError) as blocked:
            await broker.execute("a", "key-a", "cfg", None, next_operation)
        self.assertEqual(blocked.exception.code, "FLOOD_WAIT")
        next_operation.assert_not_awaited()
        self.assertTrue(await broker.execute("b", "key-b", "cfg", None, client_is_open))
        broker.by_account["a"].cooldown_until = 0
        self.assertTrue(await broker.execute("a", "key-a", "cfg", None, client_is_open))
        await broker.close()

    async def test_pending_queue_rejects_overflow_and_cancellation_releases_slots(self):
        """Неограниченные ожидания блокировки заменены очередью из 32 запросов."""
        broker = TelethonClientBroker(lambda _cfg: FakeClient())
        await broker.execute("a", "key", "cfg", None, client_is_open)
        entry = broker.by_account["a"]
        await entry.lock.acquire()
        tasks = [asyncio.create_task(broker.execute("a", "key", "cfg", None, client_is_open))
                 for _ in range(32)]
        await asyncio.sleep(0)
        self.assertEqual(entry.pending, 32)
        with self.assertRaises(BrokerError) as overflow:
            await broker.execute("a", "key", "cfg", None, client_is_open)
        self.assertEqual(overflow.exception.code, "ACCOUNT_BUSY")
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        self.assertEqual(entry.pending, 0)
        entry.lock.release()
        await broker.close()

    async def test_revoked_session_waits_for_other_operation_before_closing(self):
        """Отозванный клиент закрывается после соседа и не открывается повторно."""
        client = FakeClient()
        broker = TelethonClientBroker(lambda _cfg: client)
        started, release = asyncio.Event(), asyncio.Event()

        async def held(active):
            """Удерживает запрос второго бота до проверки состояния соединения."""
            started.set()
            await release.wait()
            return active.connected

        task = asyncio.create_task(broker.execute("a", "key", "cfg", None, held))
        await started.wait()
        revoked = AsyncMock(side_effect=SessionRevokedError(request=None))
        with self.assertRaises(SessionRevokedError):
            await broker.execute("a", "key", "cfg", None, revoked)
        self.assertTrue(client.connected)
        with self.assertRaises(BrokerError) as blocked:
            await broker.execute("a", "key", "cfg", None, client_is_open)
        self.assertEqual(blocked.exception.code, "ACCOUNT_CLOSING")
        release.set()
        self.assertTrue(await task)
        self.assertFalse(client.connected)
        self.assertEqual(client.closes, 1)
        self.assertEqual(client.opens, 1)
        with self.assertRaises(BrokerError):
            await broker.execute("b", "key", "cfg", None, client_is_open)
        await broker.close()
        self.assertEqual(client.closes, 1)
