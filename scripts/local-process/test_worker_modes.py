"""@fileoverview Проверка выбора режима и отсутствия тяжёлых импортов приёмника."""

import asyncio
import subprocess
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "server/python"))

from demand_settings import resolve_settings
from worker import BotWorker


class ModeTests(unittest.TestCase):
    """Проверяет переключение без изменения прежнего режима по умолчанию."""

    def test_supported_modes(self):
        """Сохраняет direct и ondemand, добавляя отдельный process."""
        with patch("demand_settings.get_base_environ", return_value={}):
            self.assertIsNone(resolve_settings(1, {}, None))
            for mode in ("ondemand", "process"):
                settings = resolve_settings(1, {"BOT_POLLING_MODE": mode,
                    "REDIS_URL": "redis://127.0.0.1:6379"}, None)
                self.assertEqual(settings["mode"], mode)

    def test_selected_tokens_and_guards(self):
        """Не переключает посторонний токен и запрещает несовместимые настройки."""
        with patch("demand_settings.get_base_environ", return_value={}):
            env = {"BOT_POLLING_MODE": "process", "BOT_ON_DEMAND_TOKEN_IDS": "2"}
            self.assertIsNone(resolve_settings(1, env, None))
            with self.assertRaises(ValueError):
                resolve_settings(2, env, None)
            with self.assertRaises(ValueError):
                resolve_settings(2, {**env, "REDIS_URL": "redis://localhost"}, "https://example.com")

    def test_receiver_import_is_lightweight(self):
        """Проверяет отдельный свежий интерпретатор без aiogram и pydantic."""
        code = ("import sys; sys.path.insert(0, sys.argv[1]); "
                "import worker, demand_session; "
                "assert 'aiogram' not in sys.modules; "
                "assert 'pydantic' not in sys.modules")
        subprocess.run([sys.executable, "-c", code, str(ROOT / "server/python")], check=True)


class WorkerProcessTests(unittest.IsolatedAsyncioTestCase):
    """Проверяет передачу настроек и ошибок дочернего процесса координатору."""

    async def test_process_error_propagates(self):
        """Ошибка не становится успешным сном и не подтверждает очередь."""
        callback = AsyncMock(side_effect=RuntimeError("сбой процесса"))
        module = types.SimpleNamespace(run_process_handler=callback)
        ctx = types.SimpleNamespace(token_id=7)
        session = types.SimpleNamespace(settings={"mode": "process"}, stopping=asyncio.Event())
        with patch.dict(sys.modules, {"process_handler": module}):
            with self.assertRaisesRegex(RuntimeError, "сбой процесса"):
                await BotWorker()._run_process(ctx, session)
        self.assertIs(callback.call_args.args[0], ctx)
        self.assertIs(callback.call_args.args[1], session.settings)

    async def test_stop_cancels_child_without_waiting_for_idle(self):
        """Явная остановка немедленно передаётся контроллеру дочернего процесса."""
        entered, cleaned = asyncio.Event(), asyncio.Event()
        async def child(*args):
            """Имитирует длительный сеанс с подтверждением очистки после отмены."""
            entered.set()
            try:
                await asyncio.Event().wait()
            finally:
                cleaned.set()
        session = types.SimpleNamespace(settings={}, stopping=asyncio.Event())
        with patch.dict(sys.modules, {"process_handler": types.SimpleNamespace(run_process_handler=child)}):
            task = asyncio.create_task(BotWorker()._run_process(types.SimpleNamespace(token_id=7), session))
            await entered.wait()
            session.stopping.set()
            await asyncio.wait_for(task, 1)
        self.assertTrue(cleaned.is_set())


if __name__ == "__main__":
    unittest.main()
