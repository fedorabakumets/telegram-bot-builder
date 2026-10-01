"""
Тесты передачи переменных бота в команде start_bot (BOT_ENV_SOURCE=inline).

Запуск: python3 -m unittest server/python/test_worker_isolation_env.py
"""

import os
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import worker_isolation as iso  # noqa: E402


class ParseEnvPayloadTest(unittest.TestCase):
    """Проверка поля env команды start_bot."""

    def test_absent(self):
        """Нет поля — бот читает .env как раньше."""
        self.assertIsNone(iso.parse_env_payload(None))

    def test_dict_of_strings(self):
        """Словарь строк принимается как есть."""
        self.assertEqual(iso.parse_env_payload({"A": "1"}), {"A": "1"})

    def test_rejects_bad_types(self):
        """Не словарь или не строковые значения — ошибка."""
        for raw in (["A=1"], {"A": 1}, {1: "a"}):
            with self.assertRaises(ValueError):
                iso.parse_env_payload(raw)


class ApplyEnvValuesTest(unittest.TestCase):
    """Применение и откат переменных."""

    def test_returns_previous_values(self):
        """Возвращает прежние значения для отката, включая отсутствующие."""
        os.environ["TBB_TEST_OLD"] = "old"
        os.environ.pop("TBB_TEST_NEW", None)
        prev = iso.apply_env_values({"TBB_TEST_OLD": "x", "TBB_TEST_NEW": "y"})
        self.assertEqual(prev, {"TBB_TEST_OLD": "old", "TBB_TEST_NEW": None})
        self.assertEqual(os.environ["TBB_TEST_NEW"], "y")
        iso.restore_env(prev)
        self.assertEqual(os.environ["TBB_TEST_OLD"], "old")
        self.assertNotIn("TBB_TEST_NEW", os.environ)
        os.environ.pop("TBB_TEST_OLD", None)


class SuppressDotenvTest(unittest.TestCase):
    """load_dotenv бота не должен подхватить чужой .env."""

    def test_noop_and_restore(self):
        """Внутри блока load_dotenv ничего не делает, после — восстановлен."""
        import dotenv

        original = dotenv.load_dotenv
        with iso.suppress_dotenv_autoload():
            self.assertFalse(dotenv.load_dotenv())
            self.assertIsNot(dotenv.load_dotenv, original)
        self.assertIs(dotenv.load_dotenv, original)


if __name__ == "__main__":
    unittest.main()
