"""@fileoverview Изолированный HTTP-брокер с имитацией Telegram для сквозной проверки."""
import asyncio
import json
import socket
import sys
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "server/python"))
from aiohttp import web
from telethon import Button, TelegramClient
from telethon.tl.custom.messagebutton import MessageButton
from telethon_account_broker import build_app
from telethon_broker_ownership import BrokerOwnership
from telethon_broker_clients import BrokerError
from telegram_chain_events import FakeEventEmitter, register_event_routes

SECRET = "synthetic_broker_secret_for_chain_test_only"
original_connect = socket.socket.connect


def local_connect(sock, address):
    """Запрещает внешнюю сеть даже при ошибочном изменении тестового клиента."""
    if isinstance(address, tuple) and address[0] not in ("127.0.0.1", "::1"):
        raise AssertionError("Внешняя сеть запрещена в имитации Telegram")
    return original_connect(sock, address)


def forbid_real_client(*_args, **_kwargs):
    """Превращает случайное создание настоящего клиента в явную ошибку теста."""
    raise AssertionError("Настоящий TelegramClient запрещён")


socket.socket.connect = local_connect
TelegramClient.__init__ = forbid_real_client


class FakeTelegram(FakeEventEmitter):
    """Хранит счётчики одного синтетического подключения без Telegram-сокетов."""
    def __init__(self):
        """Создаёт отключённый клиент с пустыми счётчиками."""
        super().__init__()
        self.opens = self.closes = self.sent = self.clicked = 0
        self.connected = False

    async def connect(self):
        """Имитирует асинхронное открытие авторизации."""
        await asyncio.sleep(0)
        self.opens += 1
        self.connected = True

    async def disconnect(self):
        """Отмечает закрытие общей авторизации."""
        self.closes += 1
        self.connected = False

    def is_connected(self):
        """Возвращает состояние имитации."""
        return self.connected

    async def is_user_authorized(self):
        """Разрешает только подключённую имитацию."""
        return self.connected

    async def get_me(self):
        """Возвращает вымышленные данные профиля."""
        return SimpleNamespace(id=42, first_name="Тест", last_name=None, username="synthetic", phone="15551234567")

    async def inline_query(self, _bot, _query):
        """Возвращает предложение цены без отправки inline-сообщения."""
        return [SimpleNamespace(title="К оплате 1000 RUB", description="Только имитация")]

    async def download_profile_photo(self, *_args, **_kwargs):
        """Возвращает синтетический JPEG-маркер для проверки транспорта профиля."""
        return b"\xff\xd8\xffsynthetic-avatar"

    async def get_peer_id(self, target):
        """Использует числовую цель как ключ блокировки чата."""
        return target

    async def send_message(self, _target, _text, **_kwargs):
        """Имитирует отправку без внешних побочных эффектов."""
        self.sent += 1
        if _text == "Событие при отправке":
            await self.emit("new", _target, _text)
        return SimpleNamespace(id=self.sent)

    async def click(self):
        """Имитирует callback существующей кнопки."""
        self.clicked += 1
        return SimpleNamespace(message="Нажато")

    async def get_messages(self, _target, **kwargs):
        """Создаёт реальные обёртки кнопок установленной версии Telethon."""
        if _target == -429:
            raise BrokerError("ACCOUNT_BUSY", "Только имитация перегрузки", 429)
        callback = MessageButton(None, Button.inline("Ответ", b"value"), None, None, 1)
        callback.click = self.click
        url = MessageButton(None, Button.url("Ссылка", "https://example.com"), None, None, 1)
        message = SimpleNamespace(id=1, text="Ответ", raw_text="Ответ", sender_id=42,
                                  out=False, media=None, date=None, edit_date=None, buttons=[[callback, url]])
        return message if "ids" in kwargs else [message]


async def fake_config(document):
    """Проверяет синтетический вход, подменяя только разбор реальной сессии."""
    assert document["sessionString"] == "synthetic-session-no-telegram-key"
    return "synthetic-auth-fingerprint", "synthetic-config", None


class FakeRedis:
    """Имитирует атомарное владение Redis без внешнего сервера."""
    def __init__(self):
        """Разрешает захват только начального незанятого реестра."""
        self.value = "unowned"

    async def eval(self, script, _count, _key, owner):
        """Воспроизводит сравнение владельца при захвате и освобождении."""
        expected = "unowned" if script == BrokerOwnership.ACQUIRE else owner
        if self.value != expected:
            return 0
        self.value = owner if script == BrokerOwnership.ACQUIRE else "unowned"
        return 1

    async def get(self, _key):
        """Возвращает текущего владельца."""
        return self.value

    async def aclose(self):
        """Завершает тестовый транспорт без сетевых действий."""


async def main():
    """Поднимает настоящий брокер только на случайном loopback-порту."""
    client = FakeTelegram()
    registry = FakeRedis()
    app = build_app(SECRET, lambda _config: client, fake_config, ownership=BrokerOwnership(registry))
    register_event_routes(app, client)
    stopped = asyncio.Event()

    async def stats(_request):
        """Предоставляет счётчики исключительно изолированному тесту."""
        return web.json_response({key: getattr(client, key) for key in ("opens", "closes", "sent", "clicked")})

    app.router.add_get("/test/stats", stats)

    async def shutdown(_request):
        """Штатно завершает только собственный тестовый брокер."""
        # Пробуждаем оставшиеся длинные HTTP-чтения перед штатным закрытием стенда.
        await client.emit("new", 7, "Завершение изолированного стенда")
        stopped.set()
        return web.json_response({"ok": True})

    app.router.add_post("/test/shutdown", shutdown)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "127.0.0.1", 0)
    await site.start()
    print(json.dumps({"port": site._server.sockets[0].getsockname()[1]}), flush=True)
    try:
        await stopped.wait()
    finally:
        await runner.cleanup()
        assert client.closes == 1 and registry.value == "unowned"


asyncio.run(main())
