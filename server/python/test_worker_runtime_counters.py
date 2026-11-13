"""@fileoverview Проверки числовой диагностики без раскрытия данных и прогрева моделей."""

import json
import sys
import tracemalloc
import types
import unittest
from unittest.mock import patch

import worker_runtime_counters as counters


class RuntimeCountersTests(unittest.TestCase):
    """Проверяет приватность, дедупликацию и ограниченную стоимость снимков."""

    def test_counts_without_contents_or_tracing(self):
        """Общие ссылки учитываются один раз; секреты и глубокие размеры не читаются."""
        module = types.ModuleType("bot_42_utils")
        module._user_var_locks = {"PRIVATE_USER_123": "SECRET_MESSAGE"}
        module.all_user_vars = module._user_var_locks
        module._rate_counter_deques = {"PRIVATE_RATE_KEY": [1, 2, 3]}
        ctx = types.SimpleNamespace(module=module, task=None, token="SECRET_TOKEN")
        before = tracemalloc.is_tracing()
        with patch.dict(sys.modules, {"bot_42_utils": module}):
            report = counters.snapshot({42: ctx})
        row = report["bots"][0]
        self.assertEqual(row["moduleCount"], 1)
        self.assertEqual(row["containers"]["_user_var_locks"]["count"], 1)
        self.assertNotIn("all_user_vars", row["containers"])
        self.assertEqual(row["containers"]["_user_var_locks"]["shallowBytes"],
                         sys.getsizeof(module._user_var_locks))
        for secret in ("PRIVATE_USER", "SECRET_MESSAGE", "PRIVATE_RATE", "SECRET_TOKEN"):
            self.assertNotIn(secret, json.dumps(report))
        self.assertEqual(tracemalloc.is_tracing(), before)

    def test_model_inspection_does_not_build_models(self):
        """Читает уже экспортированные классы без вызова ленивого импорта или rebuild."""
        package = types.ModuleType("aiogram.types")
        package.Built = type("Built", (), {"__module__": "aiogram.types.fake",
                                          "__pydantic_complete__": True})
        package.Deferred = type("Deferred", (), {"__module__": "aiogram.types.fake",
                                                "__pydantic_complete__": False})
        package.Alias = package.Built
        def fail(name):
            """Запрещает неявную материализацию модели во время сбора метрик."""
            raise AssertionError("Диагностика вызвала ленивую загрузку")
        package.__getattr__ = fail
        with patch.dict(sys.modules, {"aiogram.types": package}):
            report = counters.snapshot({})
        self.assertEqual(report["exportedAiogramModels"], 2)
        self.assertEqual(report["builtExportedAiogramModels"], 1)

    def test_bot_limit_and_pool_counts(self):
        """Ограничивает строки и читает только числовое состояние уже открытого пула."""
        pool_type = type("Pool", (), {"__module__": "asyncpg.pool",
                                      "get_size": lambda self: 3,
                                      "get_idle_size": lambda self: 2})
        module = types.ModuleType("fake_bot")
        module.db_pool = pool_type()
        ctx = types.SimpleNamespace(module=module, task=None)
        with patch.object(counters, "MAX_BOTS", 2):
            report = counters.snapshot({1: ctx, 2: ctx, 3: ctx})
        self.assertEqual(len(report["bots"]), 2)
        self.assertTrue(report["botsTruncated"])
        self.assertEqual(report["bots"][0]["pools"], {"count": 1, "size": 3, "idle": 2})


if __name__ == "__main__":
    unittest.main()
