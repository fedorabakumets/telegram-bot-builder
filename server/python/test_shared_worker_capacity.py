"""@fileoverview Проверка ста одновременных сессий общего Python без ограничения четырьмя ботами."""

import asyncio
import io
import json
import os
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import bot_env_overlay
import shared_worker
import worker_isolation


class SharedWorkerCapacityTest(unittest.IsolatedAsyncioTestCase):
    """Проверяет приём команд сверх буфера stdin и изоляцию окружения ста ботов."""

    async def test_hundred_sessions_run_before_any_session_is_stopped(self):
        """Все сто сценариев запускаются до остановки, сохраняя независимые переменные."""
        count = 100
        started = set()
        observed = {}
        simultaneous = []
        commands = [{"cmd": "start", "token_id": index, "activation_id": str(index)}
                    for index in range(1, count + 1)]
        source = io.StringIO("".join(json.dumps(command) + "\n" for command in commands))
        protocol = SimpleNamespace(active={}, timing={}, install=lambda: None,
                                   event=lambda *args, **kwargs: None)

        class Session:
            """Подменяет сценарий без Telegram и Redis, сохраняя реальную изоляцию окружения."""

            def __init__(self, command, unused_protocol):
                """Создаёт отдельные сигналы и переменные тестового бота."""
                self.token_id = command["token_id"]
                self.stopped = asyncio.Event()
                bot_env_overlay.register(self.token_id, {"TEST_MARKER": str(self.token_id)})

            async def run(self):
                """Читает окружение после переключения задач и остаётся активным до остановки."""
                marker = worker_isolation.current_token_id.set(self.token_id)
                try:
                    started.add(self.token_id)
                    await asyncio.sleep(0)
                    observed[self.token_id] = os.environ["TEST_MARKER"]
                    await self.stopped.wait()
                finally:
                    bot_env_overlay.unregister(self.token_id)
                    worker_isolation.current_token_id.reset(marker)

            async def stop(self):
                """Фиксирует число активированных сессий до освобождения любого места."""
                await asyncio.sleep(0)
                simultaneous.append(len(started))
                self.stopped.set()

        with patch("shared_worker.sys.stdin", source), \
                patch("shared_worker.SharedProtocol", return_value=protocol), \
                patch("shared_session.SharedSession", Session), \
                patch("lazy_aiogram.enable"), \
                patch("bot_env_overlay.install"), \
                patch("bot_env_overlay._base", {}), \
                patch("bot_env_overlay._bots", {}), \
                patch("os.environ", bot_env_overlay.BotEnvironOverlay()):
            await asyncio.wait_for(shared_worker.run(), timeout=10)
            self.assertEqual(bot_env_overlay._bots, {})
        self.assertEqual(started, set(range(1, count + 1)))
        self.assertEqual(observed, {index: str(index) for index in started})
        self.assertEqual(simultaneous, [count] * count)
        self.assertEqual(protocol.active, {})


if __name__ == "__main__":
    unittest.main()
