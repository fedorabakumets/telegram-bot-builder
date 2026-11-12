"""@fileoverview Проверки чтения готового кода и восстановления дискового кэша."""

import importlib.util
import marshal
import os
import tempfile
import unittest
from pathlib import Path
from types import CodeType
from unittest.mock import patch

from bot_code_cache import _cache_file_path, load_bot_code


class BotCodeCacheTests(unittest.TestCase):
    """Проверяет кэш на настоящих временных файлах."""

    def setUp(self):
        """Создаёт изолированный исходник и включает кэш."""
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.bot = Path(self.directory.name) / "bot.py"
        self.bot.write_text("answer = 41\n", encoding="utf-8")
        self.environment = patch.dict(os.environ, {"BOT_CODE_CACHE": "true"})
        self.environment.start()
        self.addCleanup(self.environment.stop)

    def execute(self, code):
        """Выполняет загруженный код и возвращает проверяемую переменную."""
        self.assertIsInstance(code, CodeType)
        namespace = {}
        exec(code, namespace)
        return namespace["answer"]

    def test_cache_hit_does_not_read_source(self):
        """Актуальный кэш исключает чтение и компиляцию исходного текста."""
        self.assertEqual(self.execute(load_bot_code(self.bot, lambda _: None)), 41)
        with patch.object(Path, "read_text", side_effect=AssertionError("Чтение исходника")):
            with patch("builtins.compile", side_effect=AssertionError("Компиляция")):
                code = load_bot_code(self.bot, lambda _: None)
        self.assertEqual(self.execute(code), 41)

    def test_source_mtime_invalidates_same_size_cache(self):
        """Изменение времени исходника сбрасывает кэш при одинаковом размере."""
        load_bot_code(self.bot, lambda _: None)
        old_cache = _cache_file_path(self.bot)
        old_stat = self.bot.stat()
        self.bot.write_text("answer = 42\n", encoding="utf-8")
        os.utime(self.bot, ns=(old_stat.st_atime_ns, old_stat.st_mtime_ns + 1_000_000_000))
        self.assertEqual(self.execute(load_bot_code(self.bot, lambda _: None)), 42)
        self.assertFalse(old_cache.exists())

    def test_source_size_invalidates_cache(self):
        """Размер исходника участвует в ключе независимо от времени изменения."""
        load_bot_code(self.bot, lambda _: None)
        old_stat = self.bot.stat()
        self.bot.write_text("answer = 420\n", encoding="utf-8")
        os.utime(self.bot, ns=(old_stat.st_atime_ns, old_stat.st_mtime_ns))
        self.assertEqual(self.execute(load_bot_code(self.bot, lambda _: None)), 420)

    def test_corrupted_cache_is_rebuilt(self):
        """Повреждённые данные и корректный объект другого типа пересоздаются."""
        for payload in (b"broken", marshal.dumps({"answer": 99})):
            with self.subTest(payload=payload):
                cache = _cache_file_path(self.bot)
                cache.parent.mkdir(exist_ok=True)
                cache.write_bytes(payload)
                self.assertEqual(self.execute(load_bot_code(self.bot, lambda _: None)), 41)
                with cache.open("rb") as stream:
                    self.assertIsInstance(marshal.load(stream), CodeType)

    def test_python_magic_invalidates_cache(self):
        """Кэш от другой версии байткода не используется."""
        load_bot_code(self.bot, lambda _: None)
        magic = importlib.util.MAGIC_NUMBER
        with patch("bot_code_cache.importlib.util.MAGIC_NUMBER", bytes(x ^ 255 for x in magic)):
            with patch.object(Path, "read_text", autospec=True, return_value="answer = 43\n") as read:
                self.assertEqual(self.execute(load_bot_code(self.bot, lambda _: None)), 43)
                read.assert_called_once()

    def test_disabled_cache_reads_source_and_does_not_write(self):
        """Отключённый кэш не читает готовый код и не создаёт файлы."""
        with patch.dict(os.environ, {"BOT_CODE_CACHE": "false"}):
            self.assertEqual(self.execute(load_bot_code(self.bot, lambda _: None)), 41)
            self.assertFalse((self.bot.parent / ".botcode").exists())
        load_bot_code(self.bot, lambda _: None)
        self.bot.write_text("answer = 42\n", encoding="utf-8")
        with patch.dict(os.environ, {"BOT_CODE_CACHE": "false"}):
            self.assertEqual(self.execute(load_bot_code(self.bot, lambda _: None)), 42)


if __name__ == "__main__":
    unittest.main()
