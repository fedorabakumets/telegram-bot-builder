"""@fileoverview Регрессии изолированной компиляции без исполнения сценария бота."""

import marshal
import os
import subprocess
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from types import CodeType
from unittest.mock import patch

from bot_code_cache import _cache_file_path, load_bot_code
from bot_code_compile import SourceChangedError, compile_isolated


class BotCodeCompileIsolationTests(unittest.TestCase):
    """Проверяет холодную компиляцию и безопасное восстановление файлов кэша."""

    def setUp(self):
        """Создаёт независимый сценарий с вложенной функцией."""
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.bot = Path(self.directory.name) / "scenario.py"
        self.bot.write_text("def answer():\n    return 42\n", encoding="utf-8")
        self.environment = patch.dict(os.environ, {"BOT_CODE_CACHE": "true"})
        self.environment.start()
        self.addCleanup(self.environment.stop)

    def assert_answer(self, code):
        """Проверяет поведение и исходное имя файла во вложенном коде."""
        self.assertIsInstance(code, CodeType)
        self.assertEqual(code.co_filename, str(self.bot))
        namespace = {}
        exec(code, namespace)
        self.assertEqual(namespace["answer"](), 42)
        self.assertEqual(namespace["answer"].__code__.co_filename, str(self.bot))

    def test_cold_compilation_neither_reads_nor_compiles_in_parent(self):
        """Рабочий процесс не выделяет память под исходник и дерево компилятора."""
        with patch.object(Path, "read_text", side_effect=AssertionError("Исходник в родителе")):
            with patch("builtins.compile", side_effect=AssertionError("Компиляция в родителе")):
                code = load_bot_code(self.bot, lambda _: None)
        self.assert_answer(code)

    def test_disabled_cache_still_isolates_compilation(self):
        """Отключение постоянного кэша не возвращает компиляцию в основной процесс."""
        with patch.dict(os.environ, {"BOT_CODE_CACHE": "false"}):
            with patch("builtins.compile", side_effect=AssertionError("Компиляция в родителе")):
                self.assert_answer(load_bot_code(self.bot, lambda _: None))
        self.assertFalse((self.bot.parent / ".botcode").exists())

    def test_cache_directory_replaced_by_file_does_not_break_launch(self):
        """Недоступное место постоянного кэша допускает временный результат компиляции."""
        (self.bot.parent / ".botcode").write_bytes(b"occupied")
        with patch("builtins.compile", side_effect=AssertionError("Компиляция в родителе")):
            self.assert_answer(load_bot_code(self.bot, lambda _: None))

    def test_parallel_cold_loads_publish_complete_cache(self):
        """Одновременные холодные загрузки не подменяют результат частичным файлом."""
        with ThreadPoolExecutor(max_workers=6) as executor:
            codes = list(executor.map(lambda _: load_bot_code(self.bot, lambda _: None), range(12)))
        for code in codes:
            self.assert_answer(code)
        with _cache_file_path(self.bot).open("rb") as stream:
            self.assert_answer(marshal.load(stream))
        self.assertEqual(list((self.bot.parent / ".botcode").glob("*.tmp")), [])

    def test_syntax_error_preserves_filename_and_line(self):
        """Ошибка сценария сохраняет тип и положение для диагностики запуска."""
        self.bot.write_text("answer = 42\nif True\n    pass\n", encoding="utf-8")
        with self.assertRaises(SyntaxError) as raised:
            load_bot_code(self.bot, lambda _: None)
        self.assertEqual(raised.exception.filename, str(self.bot))
        self.assertEqual(raised.exception.lineno, 2)
        self.assertFalse(_cache_file_path(self.bot).exists())

    def test_compile_does_not_execute_scenario(self):
        """Компилятор не выполняет пользовательский код и его побочные действия."""
        marker = Path(self.directory.name) / "executed"
        self.bot.write_text(f"open({str(marker)!r}, 'w').write('unsafe')\n", encoding="utf-8")
        self.assertIsInstance(load_bot_code(self.bot, lambda _: None), CodeType)
        self.assertFalse(marker.exists())

    def test_timeout_never_falls_back_to_parent_compilation(self):
        """Превышение времени завершает загрузку без тяжёлой резервной компиляции."""
        with patch("bot_code_compile.subprocess.run", side_effect=subprocess.TimeoutExpired("python", 1)):
            with patch("builtins.compile", side_effect=AssertionError("Компиляция в родителе")):
                with self.assertRaises((subprocess.TimeoutExpired, RuntimeError, TimeoutError)):
                    load_bot_code(self.bot, lambda _: None)
        self.assertFalse(_cache_file_path(self.bot).exists())

    def test_child_environment_excludes_runtime_secrets(self):
        """Компилятор не получает окружение с токенами, базой и Redis."""
        real_run = subprocess.run
        observed = []

        def record_environment(*args, **kwargs):
            """Фиксирует только названия переданных переменных дочернего процесса."""
            observed.append(set(kwargs["env"]))
            return real_run(*args, **kwargs)

        secrets = {"BOT_TOKEN": "synthetic", "DATABASE_URL": "synthetic", "REDIS_URL": "synthetic"}
        with patch.dict(os.environ, secrets):
            with patch("bot_code_compile.subprocess.run", side_effect=record_environment):
                self.assert_answer(compile_isolated(self.bot))
        self.assertEqual(len(observed), 1)
        self.assertFalse(set(secrets) & observed[0])

    def test_source_replaced_after_compile_is_retried_before_publication(self):
        """Устаревший результат не публикуется под ключом нового исходника."""
        calls = []

        def replace_once(path):
            """Меняет файл после первой компиляции, имитируя обновление сборки."""
            code = compile_isolated(path)
            calls.append(code)
            if len(calls) == 1:
                path.write_text("def answer():\n    return 42\n# новая версия\n", encoding="utf-8")
            return code

        with patch("bot_code_cache.compile_isolated", side_effect=replace_once):
            self.assert_answer(load_bot_code(self.bot, lambda _: None))
        self.assertEqual(len(calls), 2)
        self.assertEqual(len(list((self.bot.parent / ".botcode").glob("*.bin"))), 1)

    def test_repeated_source_changes_fail_without_publishing_stale_cache(self):
        """Непрерывно меняющийся сценарий не запускается с несогласованным кэшем."""
        def replace_always(path):
            """Меняет размер исходника после каждого результата компиляции."""
            code = compile_isolated(path)
            with path.open("a", encoding="utf-8") as stream:
                stream.write("# изменение\n")
            return code

        with patch("bot_code_cache.compile_isolated", side_effect=replace_always):
            with self.assertRaisesRegex(RuntimeError, "Исходник"):
                load_bot_code(self.bot, lambda _: None)
        self.assertFalse((self.bot.parent / ".botcode").exists())

    def test_child_detected_source_change_retries(self):
        """Изменение исходника внутри дочернего компилятора допускает повторную попытку."""
        code = compile_isolated(self.bot)
        with patch("bot_code_cache.compile_isolated", side_effect=[SourceChangedError(), code]) as run:
            self.assert_answer(load_bot_code(self.bot, lambda _: None))
        self.assertEqual(run.call_count, 2)

    def test_invalid_timeout_is_finite_and_bounded(self):
        """Невалидные значения настройки не снимают ограничение времени компиляции."""
        cases = {"nan": 60, "inf": 60, "invalid": 60, "0": 1, "999": 300}
        for value, expected in cases.items():
            with self.subTest(value=value), patch.dict(os.environ, {"BOT_CODE_COMPILE_TIMEOUT_SECONDS": value}):
                with patch("bot_code_compile.subprocess.run", side_effect=subprocess.TimeoutExpired("python", 1)) as run:
                    with self.assertRaises(subprocess.TimeoutExpired):
                        compile_isolated(self.bot)
                self.assertEqual(run.call_args.kwargs["timeout"], expected)


if __name__ == "__main__":
    unittest.main()
