"""@fileoverview Проверка полного BotWorker: изоляция, выгрузка, состояние и переключение режима."""

import asyncio
import gc
import tempfile
import unittest
import weakref
from pathlib import Path
from unittest.mock import patch

from aiogram.types import Update
from support import FakeTelegram, create_queue, destroy_queue, until
import bot_env_overlay
from demand_state_codec import decode_state
from worker import BotWorker


class WorkerTests(unittest.IsolatedAsyncioTestCase):
    """Выполняет настоящие команды воркера с временной сборкой и настоящим Redis."""

    async def asyncSetUp(self):
        """Создаёт временную сборку без sibling-модулей и отдельную очередь."""
        bot_env_overlay.install()
        self.queue = await create_queue()
        self.identifier = int(self.queue.keys[0].split("{")[1].split("}")[0])
        self.token = f"{self.identifier}:LOCAL_WORKER_TEST_{self.identifier}"
        self.telegram = FakeTelegram()
        await self.telegram.open()
        self.directory = tempfile.TemporaryDirectory(prefix="tbb-demand-test-")
        self.bot_file = Path(self.directory.name) / "bot.py"
        fixture = Path(__file__).parent / "fixtures/minimal/bot.py"
        self.bot_file.write_text(fixture.read_text(encoding="utf-8"), encoding="utf-8")
        self.events, self.logs = [], []
        self.system_patch = patch("worker.emit_system", self.events.append)
        self.log_patch = patch("worker.emit_log", lambda token_id, text, *args: self.logs.append((token_id, text)))
        self.system_patch.start()
        self.log_patch.start()
        self.worker = BotWorker()
        self.state_keys = set()

    async def asyncTearDown(self):
        """Завершает весь воркер до удаления только тестовых данных и файлов."""
        await asyncio.wait_for(self.worker._shutdown(), 7)
        await self.queue.open()
        if self.state_keys:
            await self.queue.redis.delete(*self.state_keys)
        await destroy_queue(self.queue)
        await self.telegram.close()
        self.system_patch.stop()
        self.log_patch.stop()
        self.directory.cleanup()

    async def start(self, mode):
        """Отправляет штатную start_bot с переключателем в конфигурации без UI."""
        await self.worker._start_bot({"cmd": "start_bot", "token_id": self.identifier,
            "token": self.token, "bot_file": str(self.bot_file), "env": {
                "BOT_POLLING_MODE": mode, "BOT_ON_DEMAND_TOKEN_IDS": str(self.identifier),
                "BOT_ON_DEMAND_IDLE_SECONDS": "0.2", "BOT_ON_DEMAND_MAX_ACTIVE": "2",
                "TELEGRAM_BOT_API_URL": self.telegram.url, "REDIS_URL": self.queue.redis_url}})
        async def ready():
            """Ждёт подтверждения, выданного именно кодом BotWorker."""
            return f"bot_started:{self.identifier}" in self.events
        await until(ready)
        ctx = self.worker.bots[self.identifier]
        if ctx.demand:
            self.state_keys.add(ctx.demand.state.key)
        return ctx

    async def test_full_worker_wakes_unloads_and_preserves_status_and_state(self):
        """Два сеанса освобождают модуль, сохраняя состояние, статус и изоляцию env."""
        ctx = await self.start("ondemand")
        self.assertIsNone(ctx.module)
        modules = []
        for number in (1, 2):
            self.telegram.updates[self.token] = [{"update_id": number}]
            async def loaded():
                """Ловит реально загруженный модуль в активном сеансе."""
                return ctx.module is not None
            await until(loaded)
            modules.append(weakref.ref(ctx.module))
            async def sleeping():
                """Дожидается выгрузки после обработки обновления и idle-таймера."""
                return ctx.module is None and any(
                    f"processed:{number}:{number}:env={self.identifier}" in text for _, text in self.logs)
            await until(sleeping)
            gc.collect()
            self.assertIsNone(modules[-1]())
            self.assertIs(self.worker.bots[self.identifier], ctx)
            self.assertEqual(ctx.status, "running")
            self.assertFalse(any(event.startswith("bot_exited:") for event in self.events))
            self.assertIsNone(await self.queue.peek())
        snapshot = await self.queue.redis.get(ctx.demand.state.key)
        self.assertEqual(decode_state(snapshot, 2 * 1024 * 1024), {123: 2})
        self.assertEqual(self.events.count(f"bot_started:{self.identifier}"), 1)

    async def test_explicit_stop_then_direct_mode_uses_ordinary_worker_path(self):
        """После остановки on-demand обычный режим загружает и удерживает модуль."""
        ctx = await self.start("ondemand")
        await self.worker._stop_bot({"token_id": self.identifier})
        self.assertNotIn(self.identifier, self.worker.bots)
        self.events.clear()
        direct = await self.start("direct")
        self.assertIsNone(direct.demand)
        self.assertIsNotNone(direct.module)
        await asyncio.sleep(0.3)
        self.assertIsNotNone(direct.module)
        await self.worker._stop_bot({"token_id": self.identifier})
        self.assertNotIn(self.identifier, self.worker.bots)


if __name__ == "__main__":
    unittest.main()
