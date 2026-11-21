"""@fileoverview Изолированные проверки распределённого запрета второго брокера без Telegram и Redis."""

import asyncio
import unittest
from unittest.mock import AsyncMock
from aiohttp.test_utils import TestServer

from telethon_broker_ownership import BrokerOwnership
from telethon_account_broker import build_app


class FakeRedis:
    """Имитирует атомарные переходы реестра без сети и автоматического восстановления."""

    def __init__(self, value="unowned"):
        """Создаёт заранее подготовленный или потерянный реестр."""
        self.value = value
        self.available = True

    async def eval(self, script, _count, _key, owner):
        """Меняет владельца только при совпадении прежнего значения."""
        if not self.available:
            raise OSError("Имитация недоступности Redis")
        expected = "unowned" if script == BrokerOwnership.ACQUIRE else owner
        if self.value != expected:
            return 0
        self.value = owner if script == BrokerOwnership.ACQUIRE else "unowned"
        return 1

    async def get(self, _key):
        """Не возвращает сохранённое владение при разрыве соединения."""
        if not self.available:
            raise OSError("Имитация недоступности Redis")
        return self.value

    async def aclose(self):
        """Закрывает поддельный транспорт без действий с сетью."""


class OwnershipTest(unittest.IsolatedAsyncioTestCase):
    """Проверяет отсутствие автоматической передачи даже после утраты реестра."""

    def test_real_factory_requires_ownership(self):
        """Прямой импорт HTTP-фабрики не обходит обязательного владельца настоящих сессий."""
        with self.assertRaises(ValueError):
            build_app("synthetic_broker_test_secret_32_chars")

    async def test_http_startup_rejects_owner_before_factory(self):
        """Недоступный реестр блокирует HTTP startup до создания Telethon-клиента."""
        from unittest.mock import Mock
        factory = Mock()
        owner = BrokerOwnership(FakeRedis(None))
        app = build_app("synthetic_broker_test_secret_32_chars", factory=factory, ownership=owner)
        server = TestServer(app)
        try:
            with self.assertRaises(RuntimeError):
                await server.start_server()
            factory.assert_not_called()
        finally:
            await server.close()

    async def test_second_broker_and_missing_registry_fail_before_clients(self):
        """Второй процесс, потерянный реестр и отказ Redis не допускают подключение."""
        redis = FakeRedis()
        first, second = BrokerOwnership(redis), BrokerOwnership(redis)
        await first.acquire()
        with self.assertRaises(RuntimeError):
            await second.acquire()
        redis.value = None
        with self.assertRaises(RuntimeError):
            await second.acquire()
        redis.available = False
        with self.assertRaises(OSError):
            await second.acquire()

    async def test_clean_shutdown_releases_only_after_clients_close(self):
        """Новый владелец допускается лишь после подтверждения закрытия прежних клиентов."""
        redis = FakeRedis()
        first = BrokerOwnership(redis)
        await first.acquire()

        async def close():
            """Проверяет, что во время закрытия ключ ещё занят старым владельцем."""
            self.assertEqual(redis.value, first.owner)
        await first.stop(close)
        await BrokerOwnership(redis).acquire()

    async def test_failed_shutdown_keeps_reservation(self):
        """Ошибка закрытия не разрешает новому брокеру использовать тот же ключ."""
        redis = FakeRedis()
        owner = BrokerOwnership(redis)
        await owner.acquire()
        with self.assertRaises(OSError):
            await owner.stop(AsyncMock(side_effect=OSError("Имитация отказа отключения")))
        self.assertEqual(redis.value, owner.owner)

    async def test_redis_loss_closes_clients_and_never_resumes(self):
        """Монитор закрывает даже простаивающий клиент и не снимает блокировку после сбоя."""
        redis = FakeRedis()
        owner = BrokerOwnership(redis)
        await owner.acquire()
        closed = asyncio.Event()

        async def close():
            """Подтверждает отключение имитированного Telethon-клиента."""
            closed.set()
        owner.watch(close)
        redis.available = False
        await asyncio.wait_for(closed.wait(), 2)
        redis.available = True
        with self.assertRaises(RuntimeError):
            await owner.check()
        await owner.stop(close)
        self.assertEqual(redis.value, owner.owner)
