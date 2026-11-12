"""@fileoverview Локальная характеристика жизненного цикла webhook без Telegram и БД.

Выполняется извлечённая ветка шаблона с настоящими aiohttp и aiogram.
Telegram Bot API заменён объектом-заглушкой. Это воспроизведение текущего
поведения, а не приёмочная проверка исправленного production-кода.
"""

import asyncio
import json
import logging
import socket
import textwrap
from pathlib import Path

import aiogram
import aiohttp
from aiohttp import web
from aiogram import Bot, Dispatcher
from aiogram.webhook.aiohttp_server import SimpleRequestHandler


def extract_branch():
    """Извлекает исполняемую webhook-ветку без необязательных HTTP-триггеров."""
    template = Path(__file__).resolve().parents[2] / "lib/templates/main/main.py.jinja2"
    source = template.read_text(encoding="utf-8")
    branch = source.split("        if WEBHOOK_URL:\n", 1)[1].split(
        "        else:\n            # Polling режим", 1
    )[0]
    branch = branch.replace(
        "{%- if hasApiTrigger %}\n            register_api_trigger_routes(app)\n{%- endif %}\n",
        "",
    )
    if "{%" in branch:
        raise AssertionError("Ветка шаблона изменилась: нужно пересмотреть извлечение")
    return "async def generated_webhook():\n" + textwrap.indent(
        textwrap.dedent(branch), "    "
    )


class LocalBot(Bot):
    """Заменяет только обращения Telegram API, оставляя настоящий объект Bot."""

    async def set_webhook(self, url, **kwargs):
        """Фиксирует доступность listener непосредственно при регистрации."""
        try:
            reader, writer = await asyncio.open_connection("127.0.0.1", self.local_port)
            writer.close()
            await writer.wait_closed()
            self.events.append("registration_listener_ready")
        except OSError:
            self.events.append("registration_listener_unavailable")
        return True

    async def delete_webhook(self, **kwargs):
        """Фиксирует удаление регистрации без сетевого обращения."""
        self.events.append("delete_webhook")
        return True


async def main():
    """Проверяет ранний ACK, накопление задач и остановку на loopback-сервере."""
    with socket.socket() as reservation:
        reservation.bind(("127.0.0.1", 0))
        port = reservation.getsockname()[1]
    events = []
    bot = LocalBot("123456789:" + "a" * 35)
    bot.local_port, bot.events = port, events
    dispatcher = Dispatcher()
    ready, stop, release = asyncio.Event(), asyncio.Event(), asyncio.Event()
    started = 0
    completed = 0

    async def slow_handler(message):
        """Удерживает обработку до явного разрешения, имитируя медленную БД."""
        nonlocal started, completed
        started += 1
        await release.wait()
        completed += 1

    async def notify_ready():
        """Отмечает готовность воркера без обращения к внешним сервисам."""
        ready.set()

    dispatcher.message.register(slow_handler)
    namespace = dict(
        asyncio=asyncio, logging=logging, bot=bot, dp=dispatcher,
        PROJECT_ID=1, TOKEN_ID=1, WEBHOOK_URL="https://example.invalid",
        WEBHOOK_PORT=port, _stop_event=stop, _notify_worker_ready=notify_ready,
    )
    exec(compile(extract_branch(), "<extracted-webhook-branch>", "exec"), namespace)
    task = asyncio.create_task(namespace["generated_webhook"]())
    handlers = []
    try:
        await asyncio.wait_for(ready.wait(), 5)
        async with aiohttp.ClientSession() as client:
            statuses = []
            for index in range(8):
                payload = {"update_id": index + 1, "message": {
                    "message_id": index + 1, "date": 1700000000,
                    "chat": {"id": 123, "type": "private"},
                    "from": {"id": 123, "is_bot": False, "first_name": "Тест"},
                    "text": "локальная проверка",
                }}
                async with client.post(f"http://127.0.0.1:{port}/webhook", json=payload) as response:
                    statuses.append(response.status)
            await asyncio.sleep(0.05)
            handlers = [item for item in asyncio.all_tasks()
                        if "_background_feed_update" in item.get_coro().__qualname__]
            before_shutdown = {"started": started, "completed": completed,
                               "background_tasks": len(handlers)}
            stop.set()
            await asyncio.wait_for(task, 2)
            pending_after_cleanup = sum(not item.done() for item in handlers)
            assert statuses == [200] * 8, statuses
            assert started == 8 and completed == 0, before_shutdown
            assert events[0] == "registration_listener_unavailable", events
            assert pending_after_cleanup == 8, pending_after_cleanup
            print(json.dumps({
                "kind": "known-bad-characterization", "real_loopback_http": True,
                "telegram_api": "fake", "aiogram": aiogram.__version__,
                "aiohttp": aiohttp.__version__, "responses": statuses,
                "before_shutdown": before_shutdown,
                "pending_after_runner_cleanup": pending_after_cleanup,
                "events": events,
            }, ensure_ascii=False))
    finally:
        release.set()
        await asyncio.gather(*handlers, return_exceptions=True)
        stop.set()
        if not task.done():
            await asyncio.wait_for(task, 5)
        await bot.session.close()
        await dispatcher.storage.close()


if __name__ == "__main__":
    asyncio.run(main())
