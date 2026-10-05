"""
@fileoverview Состав словаря бота и место register/unregister в _run_bot.

Запуск: python3 -m unittest server/python/test_bot_env_snapshot.py
"""

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import bot_env_snapshot as snap  # noqa: E402


class BotEnvSnapshotTest(unittest.TestCase):
    """inline/.env плюс BOT_TOKEN и webhook для словаря бота, не для базы процесса."""

    def test_inline_and_dotenv(self):
        """Пустой webhook не оставляет URL из inline или .env."""
        inline = snap.bot_env_values("tok", 5, None, None, {"A": "1", "WEBHOOK_URL": "old"}, Path("."))
        self.assertEqual(inline["A"], "1")
        self.assertEqual(inline["BOT_TOKEN"], "tok")
        self.assertEqual(inline["TOKEN_ID"], "5")
        self.assertEqual(inline["WEBHOOK_PORT"], "9005")
        self.assertNotIn("WEBHOOK_URL", inline)
        hooked = snap.bot_env_values("tok", 5, "https://hook", 7, {}, Path("."))
        self.assertEqual(hooked["WEBHOOK_URL"], "https://hook")
        self.assertEqual(hooked["WEBHOOK_PORT"], "7")
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp)
            (path / ".env").write_text("FROM_FILE=zz\nWEBHOOK_URL=http://file\n", encoding="utf-8")
            loaded = snap.bot_env_values("tok", 5, None, None, None, path)
        self.assertEqual(loaded["FROM_FILE"], "zz")
        self.assertEqual(loaded["BOT_TOKEN"], "tok")
        self.assertNotIn("WEBHOOK_URL", loaded)

    def test_register_before_exec_unregister_in_finally(self):
        """_run_bot регистрирует словарь до модулей и не пишет секреты в базу."""
        src = (Path(__file__).resolve().parent / "worker.py").read_text(encoding="utf-8")
        body = src.split("async def _run_bot", 1)[1].split("async def _stop_bot", 1)[0]
        self.assertLess(body.index("suppress_dotenv_autoload"), body.index("bot_env_overlay.register"))
        self.assertLess(body.index("bot_env_overlay.register"), body.index("load_sibling_modules"))
        self.assertLess(body.index("bot_env_overlay.register"), body.index("exec(compiled"))
        self.assertIn("bot_env_overlay.unregister", body.split("finally:", 1)[1])
        for name in ("apply_env_values", "apply_bot_dotenv", "apply_bot_env", "restore_env"):
            self.assertNotIn(name, body, name)


if __name__ == "__main__":
    unittest.main()
