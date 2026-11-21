"""@fileoverview Проверки повторного использования и исключительности сессии Telethon."""

import asyncio
import unittest

from telethon_broker_clients import BrokerError, TelethonClientBroker


class FakeClient:
    """Клиент без сетевых соединений для проверки жизненного цикла."""

    def __init__(self, authorized=True):
        """Устанавливает ответ проверки авторизации и исходное состояние."""
        self.connected = False
        self.authorized = authorized
        self.opens = 0
        self.closes = 0
        self.disconnect_error = False

    async def connect(self):
        """Отмечает передачу управления и открытие клиента."""
        await asyncio.sleep(0)
        self.opens += 1
        self.connected = True

    async def is_user_authorized(self):
        """Возвращает заранее заданное состояние авторизации."""
        return self.authorized

    def is_connected(self):
        """Показывает состояние тестового соединения."""
        return self.connected

    async def disconnect(self):
        """Имитирует подтверждённое отключение или его отказ."""
        if self.disconnect_error:
            raise RuntimeError()
        self.closes += 1
        self.connected = False


async def client_is_open(client):
    """Проверяет, что операция получила подключённый клиент."""
    return client.connected


class TelethonClientBrokerTest(unittest.IsolatedAsyncioTestCase):
    """Проверяет работу брокера при конкурирующих операциях."""

    async def test_parallel_consumers_reuse_single_connection(self):
        """Два запроса к одному аккаунту обновляют ресурс только один раз."""
        client = FakeClient()
        broker = TelethonClientBroker(lambda _cfg: client)
        calls = [broker.execute("a", "session", "cfg", None, client_is_open) for _ in range(2)]
        self.assertEqual(await asyncio.gather(*calls), [True, True])
        self.assertEqual(client.opens, 1)
        await broker.close()
        self.assertEqual(client.closes, 1)

    async def test_rejects_duplicate_key_and_config_changes(self):
        """Другая карточка с тем же ключом и изменение прокси требуют отключения."""
        broker = TelethonClientBroker(lambda _cfg: FakeClient())
        await broker.execute("a", "session", "cfg", None, client_is_open)
        for account, code in (("b", "SESSION_IN_USE"), ("a", "CONFIG_CHANGED")):
            with self.assertRaises(BrokerError) as raised:
                await broker.execute(account, "session", "other-config", None, client_is_open)
            self.assertEqual(raised.exception.code, code)
        self.assertTrue(await broker.disconnect("a"))
        self.assertTrue(await broker.execute("b", "session", "other-config", None, client_is_open))
        await broker.close()

    async def test_disconnect_waits_for_inflight_request(self):
        """Отключение сохраняет клиент открытым до окончания активной операции."""
        client = FakeClient()
        broker = TelethonClientBroker(lambda _cfg: client)
        started, finish = asyncio.Event(), asyncio.Event()

        async def operation(active):
            """Блокирует тестовый запрос до явного завершения."""
            started.set()
            await finish.wait()
            return active.connected

        task = asyncio.create_task(broker.execute("a", "session", "cfg", None, operation))
        await started.wait()
        closing = asyncio.create_task(broker.disconnect("a"))
        await asyncio.sleep(0)
        self.assertFalse(closing.done())
        self.assertTrue(client.connected)
        finish.set()
        self.assertTrue(await task)
        self.assertTrue(await closing)
        self.assertFalse(client.connected)

    async def test_failed_disconnect_reserves_key(self):
        """Не создаёт дубликат при неподтверждённой очистке сессии."""
        client = FakeClient()
        broker = TelethonClientBroker(lambda _cfg: client)
        await broker.execute("a", "session", "cfg", None, client_is_open)
        client.disconnect_error = True
        with self.assertRaises(BrokerError) as failed:
            await broker.disconnect("a")
        self.assertEqual(failed.exception.code, "DISCONNECT_FAILED")
        with self.assertRaises(BrokerError) as duplicate:
            await broker.execute("b", "session", "other-config", None, client_is_open)
        self.assertEqual(duplicate.exception.code, "SESSION_IN_USE")
        client.disconnect_error = False
        await broker.close()

    async def test_unauthorized_client_is_disconnected(self):
        """Сессия без авторизации не доступна для выполнения операций."""
        client = FakeClient(authorized=False)
        broker = TelethonClientBroker(lambda _cfg: client)
        with self.assertRaises(BrokerError) as raised:
            await broker.execute("a", "session", "cfg", None, client_is_open)
        self.assertEqual(raised.exception.code, "NOT_AUTHORIZED")
        self.assertEqual(client.closes, 1)
        self.assertFalse(await broker.disconnect("a"))
