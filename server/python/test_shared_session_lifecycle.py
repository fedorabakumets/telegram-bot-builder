"""@fileoverview Проверки завершения общей сессии до разрешения выгрузить Python."""

import asyncio
from types import SimpleNamespace
import unittest
from unittest.mock import patch

from shared_session import SharedSession


class SharedSessionLifecycleTest(unittest.IsolatedAsyncioTestCase):
    """Проверяет порядок сохранения, очистки и подтверждения остановки сессии."""

    async def test_exit_waits_for_worker_cleanup_and_queue_close(self):
        """Не разрешает завершить общий процесс до полной очистки сценария."""
        events = []

        async def open_queue():
            """Фиксирует открытие соединения очереди."""
            events.append("open")

        async def close_queue():
            """Имитирует асинхронное закрытие соединения после очистки."""
            await asyncio.sleep(0)
            events.append("close")

        async def run_bot(ctx, adapter):
            """Имитирует штатное сохранение и очистку BotWorker перед возвратом."""
            events.append("save")
            await asyncio.sleep(0)
            events.append("cleanup")

        session = SharedSession.__new__(SharedSession)
        session.ctx = SimpleNamespace(token_id=1, status="running")
        session.adapter = SimpleNamespace(
            queue=SimpleNamespace(open=open_queue, close=close_queue), idled=True)
        session.protocol = SimpleNamespace(
            event=lambda *args, **kwargs: events.append((args, kwargs)))
        session.task = None
        with patch("shared_session.BotWorker", return_value=SimpleNamespace(_run_bot=run_bot)):
            await session.run()
        self.assertEqual(events[:4], ["open", "save", "cleanup", "close"])
        self.assertEqual(events[4], (("exited", 1), {"code": 0, "reason": "idle"}))

    async def test_stop_waits_for_graceful_handler_completion(self):
        """Остановка ждёт завершения обработчика вместо немедленного подтверждения."""
        events = []
        stopping = asyncio.Event()

        async def handler():
            """Сохраняет состояние после получения сигнала остановки."""
            await stopping.wait()
            await asyncio.sleep(0)
            events.append("saved")

        session = SharedSession.__new__(SharedSession)
        session.ctx = SimpleNamespace(module=SimpleNamespace(
            request_bot_stop=lambda: events.append("requested")))
        session.adapter = SimpleNamespace(stopping=stopping)
        session.task = asyncio.create_task(handler())
        await session.stop()
        self.assertTrue(session.task.done())
        self.assertEqual(events, ["requested", "saved"])


if __name__ == "__main__":
    unittest.main()
