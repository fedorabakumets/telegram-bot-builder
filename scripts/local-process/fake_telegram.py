"""@fileoverview Локальный Telegram API для проверки временных процессов без настоящих ботов."""

import asyncio
from aiohttp import web


class FakeTelegram:
    """Принимает отдельные long poll и хранит историю ответов тестового бота."""

    def __init__(self):
        """Готовит независимые очереди токенов и журнал отправок."""
        self.updates = {}
        self.sent = []
        self.calls = []
        self.rejected = set()
        self.runner = None

    async def start(self):
        """Поднимает HTTP только на loopback со свободным портом."""
        app = web.Application()
        app.router.add_route("*", "/bot{token}/{method}", self.handle)
        self.runner = web.AppRunner(app)
        await self.runner.setup()
        site = web.TCPSite(self.runner, "127.0.0.1", 0)
        await site.start()
        port = site._server.sockets[0].getsockname()[1]
        self.base = f"http://127.0.0.1:{port}"
        return self

    async def close(self):
        """Закрывает все ожидающие HTTP-запросы и сервер."""
        await self.runner.cleanup()

    def push(self, token, update_id, text="Привет"):
        """Добавляет обновление, которое Telegram повторяет до продвижения offset."""
        self.updates.setdefault(token, []).append({"update_id": update_id, "message": {
            "message_id": update_id, "date": 1,
            "chat": {"id": 1, "type": "private"},
            "from": {"id": 1, "is_bot": False, "first_name": "Тест"},
            "text": text,
        }})

    async def handle(self, request):
        """Имитирует используемые методы Bot API, не обращаясь во внешнюю сеть."""
        token, method = request.match_info["token"], request.match_info["method"]
        body = await request.json() if request.content_type == "application/json" else dict(await request.post())
        self.calls.append((token, method))
        if method == "getUpdates":
            if token in self.rejected:
                return web.json_response({"ok": False, "error_code": 401}, status=401)
            offset = int(body.get("offset") or 0)
            result = [item for item in self.updates.get(token, []) if item["update_id"] >= offset]
            if not result:
                await asyncio.sleep(0.03)
        elif method == "getMe":
            result = {"id": int(token.split(":")[0]), "is_bot": True, "first_name": "Тест", "username": "local_test_bot"}
        elif method == "sendMessage":
            self.sent.append((token, body))
            result = {"message_id": len(self.sent), "date": 1, "chat": {"id": 1, "type": "private"}, "text": str(body.get("text", ""))}
        else:
            result = True
        return web.json_response({"ok": True, "result": result})
