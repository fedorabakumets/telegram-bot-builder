"""
Тесты обёртки os.environ: боты воркера не видят переменные друг друга.

Запуск: python3 -m unittest server/python/test_bot_env_overlay.py
"""

import asyncio
import os
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import bot_env_overlay as ov  # noqa: E402
import worker_isolation as iso  # noqa: E402

_BASE_KEYS = (
    "SECRET", "TBB_OV_BASE", "TBB_OV_NEW", "TBB_OV_UPD", "TBB_OV_DEF",
    "TBB_OV_GONE", "TBB_OV_KEEP",
)


class BotEnvOverlayTest(unittest.TestCase):
    """Изоляция словарей ботов поверх базового окружения."""

    @classmethod
    def setUpClass(cls):
        """Подменяет os.environ один раз на класс."""
        ov.install()

    @classmethod
    def tearDownClass(cls):
        """Возвращает настоящий environ, чтобы другие тесты процесса не видели обёртку."""
        if isinstance(os.environ, ov.BotEnvironOverlay):
            os.environ = ov.get_base_environ()

    def tearDown(self):
        """Сбрасывает token_id, реестр и тестовые ключи базы."""
        iso.current_token_id.set(0)
        for tid in (1, 2, 3):
            ov.unregister(tid)
        base = ov.get_base_environ()
        for key in _BASE_KEYS:
            base.pop(key, None)

    def test_getenv_reads_environ_get(self):
        """На установленном Python os.getenv читает os.environ.get."""
        self.assertEqual(os.getenv.__code__.co_names, ("environ", "get"))

    def test_two_tasks_isolated(self):
        """Две asyncio-задачи видят только свой секрет: get, getenv и in."""
        ov.register(1, {"SECRET": "alpha", "ONLY_A": "a"})
        ov.register(2, {"SECRET": "beta", "ONLY_B": "b"})

        async def look(tid, secret, own, foreign):
            token = iso.current_token_id.set(tid)
            try:
                await asyncio.sleep(0)
                self.assertEqual(os.environ.get("SECRET"), secret)
                self.assertEqual(os.getenv("SECRET"), secret)
                self.assertIn("SECRET", os.environ)
                self.assertIn(own, os.environ)
                self.assertNotIn(foreign, os.environ)
                self.assertIsNone(os.getenv(foreign))
            finally:
                iso.current_token_id.reset(token)

        async def main():
            await asyncio.gather(
                look(1, "alpha", "ONLY_A", "ONLY_B"),
                look(2, "beta", "ONLY_B", "ONLY_A"),
            )

        asyncio.run(main())

    def test_items_copy_override_and_hide_neighbor(self):
        """items и copy содержат свой ключ, без ключа соседа; свой перекрывает базу."""
        base = ov.get_base_environ()
        base["SECRET"] = "from-base"
        base["TBB_OV_BASE"] = "base"
        ov.register(1, {"SECRET": "alpha", "ONLY_A": "a"})
        ov.register(2, {"ONLY_B": "b"})
        token = iso.current_token_id.set(1)
        try:
            for view in (dict(os.environ.items()), os.environ.copy()):
                self.assertEqual(view["SECRET"], "alpha")
                self.assertEqual(view["TBB_OV_BASE"], "base")
                self.assertIn("ONLY_A", view)
                self.assertNotIn("ONLY_B", view)
        finally:
            iso.current_token_id.reset(token)

    def test_token_zero_hides_bots(self):
        """При current_token_id == 0 секретов ботов нет."""
        ov.register(1, {"ONLY_A": "a"})
        self.assertNotIn("ONLY_A", os.environ)
        self.assertIsNone(os.environ.get("ONLY_A"))
        self.assertNotIn("ONLY_A", os.environ.copy())

    def test_write_stays_in_bot(self):
        """Запись из задачи бота видна только ему и не попадает в базу."""
        base = ov.get_base_environ()
        base["TBB_OV_BASE"] = "base"
        ov.register(1, {})
        ov.register(2, {})
        token = iso.current_token_id.set(1)
        try:
            os.environ["TBB_OV_NEW"] = "v"
            os.environ.update({"TBB_OV_UPD": "u"})
            self.assertEqual(os.environ.setdefault("TBB_OV_DEF", "d"), "d")
            self.assertEqual(os.environ.setdefault("TBB_OV_BASE", "nope"), "base")
            self.assertEqual(os.environ["TBB_OV_NEW"], "v")
            for key in ("TBB_OV_NEW", "TBB_OV_UPD", "TBB_OV_DEF"):
                self.assertNotIn(key, base)
            self.assertEqual(base["TBB_OV_BASE"], "base")
        finally:
            iso.current_token_id.reset(token)
        token = iso.current_token_id.set(2)
        try:
            self.assertNotIn("TBB_OV_NEW", os.environ)
            self.assertIsNone(os.getenv("TBB_OV_NEW"))
        finally:
            iso.current_token_id.reset(token)
        token = iso.current_token_id.set(1)
        try:
            self.assertEqual(os.environ.pop("TBB_OV_NEW"), "v")
            self.assertNotIn("TBB_OV_NEW", os.environ)
        finally:
            iso.current_token_id.reset(token)

    def test_restore_keeps_overlay_unregister_drops(self):
        """restore_env не стирает словарь бота, unregister убирает его."""
        ov.register(3, {"TBB_OV_KEEP": "yes"})
        token = iso.current_token_id.set(3)
        try:
            prev = iso.apply_env_values({"TBB_OV_KEEP": "temp", "TBB_OV_GONE": "x"})
            self.assertEqual(ov.get_base_environ().get("TBB_OV_KEEP"), "temp")
            self.assertEqual(os.environ["TBB_OV_KEEP"], "yes")
            iso.restore_env(prev)
            self.assertIsNone(os.environ.get("TBB_OV_GONE"))
            self.assertEqual(os.environ["TBB_OV_KEEP"], "yes")
            ov.unregister(3)
            self.assertNotIn("TBB_OV_KEEP", os.environ)
        finally:
            iso.current_token_id.reset(token)


if __name__ == "__main__":
    unittest.main()
