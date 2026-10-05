"""
@fileoverview Вид os.environ для HTTP-подстановки: словарь бота, не база процесса.

Запуск: python3 -m unittest server/python/test_bot_env_http_view.py
"""

import os
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import bot_env_overlay as ov  # noqa: E402
import worker_isolation as iso  # noqa: E402


class BotEnvHttpViewTest(unittest.TestCase):
    """API_TOKEN и BOT_TOKEN видны задаче бота и скрыты от базы и token_id 0."""

    @classmethod
    def setUpClass(cls):
        """Подменяет os.environ один раз на класс."""
        ov.install()

    @classmethod
    def tearDownClass(cls):
        """Возвращает настоящий environ, чтобы другие тесты не видели обёртку."""
        if isinstance(os.environ, ov.BotEnvironOverlay):
            os.environ = ov.get_base_environ()

    def tearDown(self):
        """Сбрасывает token_id, реестр и тестовые ключи базы."""
        iso.current_token_id.set(0)
        ov.unregister(1)
        base = ov.get_base_environ()
        for key in ("API_TOKEN", "BOT_TOKEN"):
            base.pop(key, None)

    def test_items_keep_bot_tokens_out_of_base(self):
        """dict и items содержат токены бота, get_base_environ — нет."""
        base = ov.get_base_environ()
        for key in ("API_TOKEN", "BOT_TOKEN"):
            base.pop(key, None)
        ov.register(1, {"API_TOKEN": "api-1", "BOT_TOKEN": "tg-1"})
        token = iso.current_token_id.set(1)
        try:
            as_dict = dict(os.environ)
            as_items = dict(os.environ.items())
            self.assertEqual(as_dict["API_TOKEN"], "api-1")
            self.assertEqual(as_items["API_TOKEN"], "api-1")
            self.assertEqual(as_dict["BOT_TOKEN"], "tg-1")
            self.assertEqual(as_items["BOT_TOKEN"], "tg-1")
            self.assertNotIn("API_TOKEN", base)
            self.assertNotIn("BOT_TOKEN", base)
        finally:
            iso.current_token_id.reset(token)
        self.assertNotIn("BOT_TOKEN", os.environ)
        self.assertNotIn("API_TOKEN", dict(os.environ))
        self.assertIsNone(os.environ.get("BOT_TOKEN"))


if __name__ == "__main__":
    unittest.main()
