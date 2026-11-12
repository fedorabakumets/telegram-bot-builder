"""@fileoverview Проверки одинакового применения файловых и встроенных настроек режима."""

import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "server/python"))

from demand_settings import resolve_settings
from worker import BotWorker


class ModeEnvironmentTests(unittest.IsolatedAsyncioTestCase):
    """Проверяет передачу настроек самому координатору, включая файловый режим."""

    async def test_file_settings_reach_coordinator(self):
        """Настройка из файла перекрывает глобальный режим и его адресный список."""
        with tempfile.TemporaryDirectory() as directory:
            bot_file = Path(directory) / "bot.py"
            bot_file.write_text("", encoding="utf-8")
            (Path(directory) / ".env").write_text(
                "BOT_POLLING_MODE=process\nBOT_ON_DEMAND_TOKEN_IDS=\n"
                "REDIS_URL=redis://localhost:6379\n", encoding="utf-8")
            worker = BotWorker()
            with patch("demand_settings.resolve_settings", return_value=None) as resolve, \
                    patch("demand_handoff.prepare_direct", new_callable=AsyncMock), \
                    patch.object(worker, "_run_bot", new_callable=AsyncMock):
                await worker._start_bot({"token_id": 35, "token": "123:test", "bot_file": str(bot_file)})
                ctx = worker.bots[35]
                await ctx.task
            values = resolve.call_args.args[1]
            self.assertEqual(values["BOT_POLLING_MODE"], "process")
            self.assertEqual(values["BOT_ON_DEMAND_TOKEN_IDS"], "")
            with patch("demand_settings.get_base_environ", return_value={
                    "BOT_POLLING_MODE": "ondemand", "BOT_ON_DEMAND_TOKEN_IDS": "31"}):
                self.assertEqual(resolve_settings(35, values, None)["mode"], "process")

    async def test_inline_settings_do_not_read_legacy_file(self):
        """Явный словарь команды сохраняет приоритет над устаревшим файлом."""
        with tempfile.TemporaryDirectory() as directory:
            (Path(directory) / ".env").write_text("BOT_POLLING_MODE=process\n", encoding="utf-8")
            worker = BotWorker()
            with patch("demand_settings.resolve_settings", return_value=None) as resolve, \
                    patch("demand_handoff.prepare_direct", new_callable=AsyncMock), \
                    patch.object(worker, "_run_bot", new_callable=AsyncMock):
                await worker._start_bot({"token_id": 35, "token": "123:test",
                    "bot_file": str(Path(directory) / "bot.py"), "env": {"BOT_POLLING_MODE": "direct"}})
                await worker.bots[35].task
            self.assertEqual(resolve.call_args.args[1], {"BOT_POLLING_MODE": "direct"})


if __name__ == "__main__":
    unittest.main()
