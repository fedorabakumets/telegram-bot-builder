"""@fileoverview Проверки сигнала готовности на локальном синтетическом HTTP-приложении."""

import asyncio
import socket
import unittest
from unittest.mock import Mock, patch

from aiohttp import web
from aiohttp.web import _run_app

from telethon_broker_startup import listen_address, report_ready


class StartupReadyTest(unittest.IsolatedAsyncioTestCase):
    """Проверяет порядок startup и привязки сокета без клиента Telegram."""

    def test_private_network_requires_explicit_opt_in_and_uses_platform_port(self):
        """Облачная привязка явно разрешается, локальный запуск сохраняет прежние значения."""
        self.assertEqual(listen_address({}), ("127.0.0.1", 8765))
        self.assertEqual(listen_address({"PORT": "8080"}), ("127.0.0.1", 8080))
        cloud = {"TELETHON_BROKER_HOST": "::", "TELETHON_BROKER_ALLOW_PRIVATE_NETWORK": "1", "PORT": "8080"}
        self.assertEqual(listen_address(cloud), ("::", 8080))
        self.assertEqual(listen_address({**cloud, "TELETHON_BROKER_PORT": "8765"}), ("::", 8765))
        for host in ("::", "0.0.0.0", "10.0.0.1"):
            with self.assertRaises(ValueError):
                listen_address({"TELETHON_BROKER_HOST": host})
        for port in ("0", "65536", "invalid"):
            with self.assertRaises(ValueError):
                listen_address({"PORT": port})

    async def test_marker_follows_successful_startup_and_bind(self):
        """Готовность публикуется после startup, когда aiohttp уже слушает сокет."""
        app = web.Application()
        started, ready = asyncio.Event(), asyncio.Event()

        async def startup(_app):
            """Имитирует подтверждение исключительного владельца."""
            started.set()

        def report(message):
            """Проверяет завершённый startup и точный машинный маркер."""
            self.assertTrue(started.is_set())
            self.assertIn("http://127.0.0.1:", message)
            report_ready(message)
            ready.set()

        app.on_startup.append(startup)
        with patch("builtins.print") as output:
            task = asyncio.create_task(_run_app(app, host="127.0.0.1", port=0, print=report))
            try:
                await asyncio.wait_for(ready.wait(), 2)
                output.assert_called_once_with("TELETHON_BROKER_READY", flush=True)
            finally:
                task.cancel()
                await asyncio.gather(task, return_exceptions=True)

    async def test_failed_startup_and_failed_bind_never_report_ready(self):
        """Ошибка владения или занятый порт не разрешают запуск зависимых сервисов."""
        report = Mock()
        app = web.Application()

        async def fail(_app):
            """Имитирует запрет запуска из-за занятого реестра владельца."""
            raise RuntimeError("Реестр занят")

        app.on_startup.append(fail)
        with self.assertRaises(RuntimeError):
            await _run_app(app, host="127.0.0.1", port=0, print=report)
        report.assert_not_called()
        with socket.socket() as occupied:
            occupied.bind(("127.0.0.1", 0))
            occupied.listen()
            with self.assertRaises(OSError):
                await _run_app(web.Application(), host="127.0.0.1", port=occupied.getsockname()[1], print=report)
        report.assert_not_called()
