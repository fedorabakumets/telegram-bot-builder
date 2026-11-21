"""@fileoverview Производственный запуск брокера с синтетическим Telethon и постоянной имитацией Redis."""
import asyncio
import json
import os
import runpy
from pathlib import Path

from aiohttp import web

fixture = runpy.run_path(str(Path(__file__).with_name("telegram-chain-broker.py")), run_name="fixture_library")
import telethon_account_broker
import telethon_broker_startup
from telethon_broker_ownership import BrokerOwnership


class PersistentFakeRedis:
    """Сохраняет только синтетический marker между тестовыми перезапусками процесса."""
    def __init__(self):
        """Получает путь из изолированного временного каталога теста."""
        self.path = Path(os.environ["TELETHON_BROKER_TEST_REGISTRY_FILE"])

    async def eval(self, script, _count, _key, owner):
        """Сравнивает владельца при последовательных захватах и освобождении."""
        expected = "unowned" if script == BrokerOwnership.ACQUIRE else owner
        if self.path.read_text() != expected:
            return 0
        self.path.write_text(owner if script == BrokerOwnership.ACQUIRE else "unowned")
        return 1

    async def get(self, _key):
        """Читает marker, сохранившийся после аварийного выхода."""
        return self.path.read_text()

    async def aclose(self):
        """Закрывает имитацию без сетевых операций."""


class ObservedFakeTelegram(fixture["FakeTelegram"]):
    """Сохраняет число открытий и закрытий для проверки штатной остановки."""
    def save(self):
        """Пишет только синтетические счётчики, без session string."""
        Path(os.environ["TELETHON_BROKER_TEST_STATS_FILE"]).write_text(json.dumps({
            key: getattr(self, key) for key in ("opens", "closes", "sent", "clicked")
        }))

    async def connect(self):
        """Открывает имитацию и сохраняет результат."""
        await super().connect()
        self.save()

    async def disconnect(self):
        """Закрывает имитацию и сохраняет результат."""
        await super().disconnect()
        self.save()


original_build = telethon_account_broker.build_app


def fake_build(secret, **kwargs):
    """Оставляет настоящий HTTP-брокер, подменяя только Telegram и Redis транспорт."""
    client = ObservedFakeTelegram()
    app = original_build(secret, lambda _config: client, fixture["fake_config"], **kwargs)
    fixture["register_event_routes"](app, client)

    async def stats(_request):
        """Возвращает наблюдаемые счётчики одного тестового клиента."""
        return web.json_response({key: getattr(client, key) for key in ("opens", "closes", "sent", "clicked")})

    async def crash(_request):
        """Аварийно завершает только собственный тестовый процесс после HTTP-ответа."""
        asyncio.get_running_loop().call_later(0.05, os._exit, 23)
        return web.json_response({"ok": True})

    async def wake_shutdown(_app):
        """Пробуждает оставшиеся тестовые long-poll перед закрытием HTTP-сервера."""
        await client.emit("new", 7, "Завершение изолированного стенда")

    app.router.add_get("/test/stats", stats)
    app.router.add_post("/test/crash", crash)
    app.on_shutdown.append(wake_shutdown)
    return app


telethon_account_broker.build_app = fake_build
telethon_broker_startup.create_ownership = lambda _url: BrokerOwnership(PersistentFakeRedis())
telethon_broker_startup.main()
