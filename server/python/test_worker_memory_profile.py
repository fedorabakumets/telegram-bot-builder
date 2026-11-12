"""@fileoverview Проверки отключения профиля, живых выделений и отсутствия содержимого объектов в отчёте."""
import json
import os
import subprocess
import sys
import unittest
from pathlib import Path


class MemoryProfileTests(unittest.TestCase):
    """Изолирует tracemalloc отдельными процессами, не загрязняя тестирующий интерпретатор."""

    def run_probe(self, code, enabled):
        """Запускает короткий сценарий с явной настройкой профилирования."""
        env = dict(os.environ, WORKER_MEMORY_PROFILE=enabled, WORKER_MEMORY_PROFILE_SECONDS="30")
        result = subprocess.run([sys.executable, "-c", code], cwd=Path(__file__).parent,
                                env=env, text=True, capture_output=True, check=True, timeout=30)
        return json.loads(result.stdout)

    def test_disabled(self):
        """Выключенная настройка не включает tracemalloc и не создаёт снимков."""
        result = self.run_probe("import worker_memory_profile as p, tracemalloc, json; "
                                "p.start(); p.report_if_due(); "
                                "print(json.dumps([p.enabled(), tracemalloc.is_tracing()]))", "false")
        self.assertEqual(result, [False, False])

    def test_live_allocations_and_deltas(self):
        """Выделение заметно в снимке и разнице, но секретное содержимое в отчёт не попадает."""
        result = self.run_probe(
            "import worker_memory_profile as p, json; p.start(); p.snapshot(); "
            "payload = bytearray(b'SECRET_PAYLOAD_DO_NOT_LOG' * 100000); "
            "print(json.dumps(p.snapshot()))", "true")
        self.assertGreater(result["tracedCurrentBytes"], 2000000)
        self.assertTrue(any(row["deltaBytes"] > 2000000 for row in result["topChanges"]))
        self.assertTrue(any(row["file"] == "<string>" for row in result["topAllocations"]))
        self.assertNotIn("SECRET_PAYLOAD_DO_NOT_LOG", json.dumps(result))
        self.assertGreater(result["tracerOverheadBytes"], 0)


if __name__ == "__main__":
    unittest.main()
