"""@fileoverview Проверки готовности приватного HTTP-брокера без Telegram и Redis."""

import unittest
from unittest.mock import Mock

from aiohttp.test_utils import TestClient, TestServer

from telethon_account_broker import build_app
from telethon_broker_ownership import BrokerOwnership
from test_telethon_broker_ownership import FakeRedis


class BrokerHealthTest(unittest.IsolatedAsyncioTestCase):
    """Проверяет независимость readiness от авторизации конкретного аккаунта."""

    async def test_health_never_creates_clients_and_other_routes_stay_authenticated(self):
        """Платформа видит готовность без секрета, но не получает доступ к операциям."""
        factory, redis = Mock(), FakeRedis()
        owner = BrokerOwnership(redis)
        app = build_app("synthetic_broker_test_secret_32_chars", factory=factory, ownership=owner)
        async with TestClient(TestServer(app)) as http:
            response = await http.get("/healthz")
            self.assertEqual(response.status, 200)
            self.assertEqual(await response.json(), {"status": "ready"})
            self.assertEqual((await http.head("/healthz")).status, 200)
            for path in ("/v1/verify", "/v1/execute", "/v1/disconnect", "/healthz"):
                self.assertEqual((await http.post(path, json={})).status, 401)
            factory.assert_not_called()
            redis.available = False
            response = await http.get("/healthz")
            self.assertEqual(response.status, 503)
            self.assertEqual(await response.json(), {"status": "unavailable"})
            redis.available = True
            self.assertEqual((await http.get("/healthz")).status, 503)
            factory.assert_not_called()

