"""@fileoverview Проверки слабой диагностики без прогрева моделей и удержания сценариев."""
import functools
import gc
import json
import sys
import time
import types
import unittest
import weakref
from unittest.mock import patch

import worker_namespace_counters as namespaces
import worker_runtime_model_counters as models
import worker_runtime_counters as counters


class ObservabilityTests(unittest.TestCase):
    """Проверяет семантику счётчиков и отсутствие сильных ссылок диагностики."""
    def setUp(self):
        """Изолирует слабый реестр между проверками."""
        namespaces._references.clear()
        namespaces._dropped = 0

    def test_globals_survive_dead_module(self):
        """Ссылка на функцию сохраняет globals после смерти модуля и видна маяку."""
        module = types.ModuleType("private")
        namespaces.register(module)
        exec("def retained(): return 1", vars(module))
        function = module.retained
        reference = weakref.ref(module)
        namespaces.unloaded(module)
        del module
        gc.collect()
        self.assertIsNone(reference())
        self.assertEqual(namespaces.snapshot()["mainNamespacesUnloadedAlive"], 1)
        del function
        gc.collect()
        self.assertEqual(namespaces.snapshot()["mainNamespacesTrackedAlive"], 0)

    def test_registry_bounded(self):
        """Превышение лимита явно помечает неполноту и не удерживает модули."""
        modules = [types.ModuleType("private") for _ in range(5)]
        with patch.object(namespaces, "LIMIT", 2):
            for module in modules:
                namespaces.register(module)
            row = namespaces.snapshot()
        self.assertEqual(row["mainNamespacesTrackedAlive"], 2)
        self.assertEqual(row["namespaceTrackingDropped"], 3)
        self.assertTrue(row["namespaceTrackingTruncated"])

    def test_models_and_active_getter(self):
        """Различает действующий кеш и marker, не вызывает модели или getter."""
        package = types.ModuleType("aiogram")
        package.__version__ = "3.31.0"
        update_module = types.ModuleType("aiogram.types.update")
        types_module = types.ModuleType("aiogram.types")
        methods_module = types.ModuleType("aiogram.methods")
        def event_type(self):
            """Изображает getter без чтения секретного содержимого."""
            return "message"
        getter = functools.lru_cache()(event_type)
        update = type("Update", (), {"event_type": property(getter),
                      "__module__": "aiogram.types.update", "__pydantic_complete__": True})
        method = type("Method", (), {"__module__": "aiogram.methods.fake",
                                    "__pydantic_complete__": False})
        update_module.Update = update
        types_module.Update = types_module.Alias = update
        methods_module.Method = method
        instance = update()
        getter(instance)
        with patch.dict(sys.modules, {"aiogram": package, "aiogram.types": types_module,
                "aiogram.methods": methods_module, "aiogram.types.update": update_module}):
            before = getter.cache_info()
            row = models.snapshot()
            self.assertEqual(getter.cache_info(), before)
            self.assertEqual(row["builtExportedAiogramTypes"], 1)
            self.assertEqual(row["builtExportedAiogramMethods"], 0)
            self.assertEqual(row["updateEventTypeLru"]["size"], 1)
            self.assertFalse(row["updateEventTypePatchActive"])
            event_type._tbb_uncached_update_event_type = True
            update.event_type = property(event_type)
            self.assertTrue(models.snapshot()["updateEventTypePatchActive"])
            self.assertFalse(models.snapshot()["updateEventTypeLruPresent"])

    def test_no_aiogram_import_and_100_bot_overhead(self):
        """Снимки не импортируют aiogram и не сохраняют данные сотни ботов."""
        hidden = {key: None for key in sys.modules if key == "aiogram" or key.startswith("aiogram.")}
        bots = {}
        for index in range(100):
            module = types.ModuleType("private")
            module.user_data = {"SECRET_USER": "SECRET_TEXT"}
            namespaces.register(module)
            bots[index] = types.SimpleNamespace(module=module, task=None)
        with patch.dict(sys.modules, hidden):
            started = time.perf_counter()
            for _ in range(100):
                row = counters.snapshot(bots)
            elapsed = (time.perf_counter() - started) * 1000 / 100
            self.assertIsNone(row["aiogramVersion"])
        self.assertNotIn("SECRET", json.dumps(row))
        self.assertEqual(row["mainNamespacesTrackedAlive"], 100)
        print(json.dumps({"snapshot100BotsAverageMs": round(elapsed, 3)}))
        del module
        bots.clear()
        gc.collect()
        self.assertEqual(namespaces.snapshot()["mainNamespacesTrackedAlive"], 0)


if __name__ == "__main__":
    unittest.main()
