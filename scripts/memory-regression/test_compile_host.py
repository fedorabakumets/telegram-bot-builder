"""@fileoverview Проверки воспроизводимости сравнения холодной и готовой компиляции."""

import unittest

from compile_host import run, synthetic_source


class CompileHostBenchTests(unittest.TestCase):
    """Проверяет функциональность всех путей без нестабильных порогов RSS."""

    def test_synthetic_code_preserves_function_results(self):
        """Синтетический код проверяется по результату, а не только успешному compile."""
        namespace = {}
        exec(compile(synthetic_source(100), "synthetic.py", "exec"), namespace)
        self.assertEqual(namespace["step_99"](7), 106)

    def test_fresh_process_comparison_has_independent_stages(self):
        """Холодный и готовый пути используют реальный загрузчик и отдельные процессы."""
        report = run(100)
        self.assertEqual([item["mode"] for item in report["samples"]], ["parent", "cold", "warm"])
        self.assertEqual(report["scope"], "synthetic_compile_not_production")
        for sample in report["samples"]:
            self.assertTrue(sample["functionalResult"])
            self.assertGreater(sample["elapsedLoadMs"], 0)
            self.assertEqual(sample["stages"][0]["stage"], "baseline")
            self.assertEqual(sample["stages"][-1]["stage"], "afterGC")
        self.assertIn("afterRead", [item["stage"] for item in report["samples"][0]["stages"]])


if __name__ == "__main__":
    unittest.main()
