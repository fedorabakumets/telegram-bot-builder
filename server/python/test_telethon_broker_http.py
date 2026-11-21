"""@fileoverview Контракт сервиса аккаунтов и блокировка в тестах без Telegram."""

import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

from aiohttp.test_utils import TestClient, TestServer
from telethon.crypto import AuthKey
from telethon.sessions import StringSession

from telethon_account_broker import build_app
from telethon_broker_blocks import BlockedAccounts
from telethon_broker_clients import BrokerError
from telethon_broker_config import parse_config
from telethon_broker_process_lock import broker_process_lock
from test_telethon_broker_clients import FakeClient


SECRET = "synthetic_test_secret_for_broker_1"


class ProfileClient(FakeClient):
    """Поддельный профиль для проверки маскирования."""

    async def get_me(self):
        """Возвращает демонстрационные данные, которые не покидают тест."""
        return SimpleNamespace(id=42, first_name="Demo", last_name=None, username="demo", phone="15551234567")


async def fake_config(document):
    """Подменяет разбор сессии тем же ключом для разных карточек."""
    return "fake_session_identity", document.get("configuration", "cfg"), None


class BrokerHttpTest(unittest.IsolatedAsyncioTestCase):
    """Проверяет HTTP без подключения к Telegram."""

    async def test_guard_verify_reuse_and_durable_rollback(self):
        """Секрет открывает интерфейс, где две карточки не могут открыть одну сессию."""
        client = ProfileClient()
        with tempfile.TemporaryDirectory() as directory:
            journal = Path(directory) / "broker.blocked"
            app = build_app(SECRET, lambda _cfg: client, fake_config, BlockedAccounts(journal))
            async with TestClient(TestServer(app)) as http:
                verify = {"accountId": 1}
                unauthorized = await http.post("/v1/verify", json=verify)
                self.assertEqual(unauthorized.status, 401)
                headers = {"Authorization": f"Bearer {SECRET}"}
                response = await http.post("/v1/verify", headers=headers, json=verify)
                result = (await response.json())["result"]
                self.assertEqual(result["id"], "42")
                self.assertTrue(result["maskedPhone"].endswith("67"))
                self.assertNotIn("15551234567", str(result))
                for _ in range(2):
                    response = await http.post("/v1/execute", headers=headers,
                                               json={**verify, "operation": "get_me", "args": {}})
                    self.assertEqual((await response.json())["result"], {"id": 42})
                self.assertEqual(client.opens, 1)
                duplicate = await http.post("/v1/verify", headers=headers, json={"accountId": 2})
                self.assertEqual(duplicate.status, 409)
                self.assertEqual((await duplicate.json())["code"], "SESSION_IN_USE")
                blocked = await http.post("/v1/disconnect", headers=headers, json={**verify, "block": True})
                self.assertEqual((await blocked.json())["result"], {"disconnected": True})
                self.assertEqual(client.closes, 1)
                self.assertIn("1", BlockedAccounts(journal))
                retry = await http.post("/v1/verify", headers=headers, json=verify)
                self.assertEqual((await retry.json())["code"], "ACCOUNT_BLOCKED")
            restarted = build_app(SECRET, lambda _cfg: client, fake_config, BlockedAccounts(journal))
            async with TestClient(TestServer(restarted)) as http:
                retry = await http.post("/v1/execute", headers=headers,
                                        json={**verify, "operation": "get_me", "args": {}})
                self.assertEqual((await retry.json())["code"], "ACCOUNT_BLOCKED")
                self.assertEqual(client.opens, 1)
                blocked_absent = await http.post("/v1/disconnect", headers=headers, json={"accountId": 3, "block": True})
                self.assertEqual((await blocked_absent.json())["result"], {"disconnected": True})

    async def test_refuses_arbitrary_operations(self):
        """Имя метода пользователя не передаётся непосредственно клиенту Telethon."""
        app = build_app(SECRET, lambda _cfg: self.fail("Фабрика не должна вызываться"), fake_config)
        async with TestClient(TestServer(app)) as http:
            response = await http.post("/v1/execute", headers={"Authorization": f"Bearer {SECRET}"},
                                       json={"accountId": 1, "operation": "log_out", "args": {}})
            self.assertEqual(response.status, 400)
            self.assertEqual((await response.json())["code"], "UNSUPPORTED_OPERATION")

    async def test_session_fingerprint_ignores_representation(self):
        """Один ключ при разных адресах центра данных даёт один отпечаток."""
        fingerprints = []
        for address in ("149.154.167.50", "149.154.167.51"):
            session = StringSession()
            session.set_dc(2, address, 443)
            session.auth_key = AuthKey(bytes(range(256)))
            fingerprint, _, _ = await parse_config({
                "sessionString": session.save(), "apiId": 17, "apiHash": "1" * 32,
            })
            fingerprints.append(fingerprint)
        self.assertEqual(fingerprints[0], fingerprints[1])
        session.set_dc(2, "127.0.0.1", 443)
        with self.assertRaises(BrokerError):
            await parse_config({"sessionString": session.save(), "apiId": 17, "apiHash": "1" * 32})

    def test_broker_process_lock_is_exclusive(self):
        """Второй процесс не может захватить тот же путь блокировки."""
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "broker.lock"
            with broker_process_lock(path):
                with self.assertRaises(RuntimeError):
                    with broker_process_lock(path):
                        self.fail("Открыта вторая блокировка")
            with broker_process_lock(path):
                self.assertTrue(path.exists())
