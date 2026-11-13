"""@fileoverview Проверки суммирования RSS без превращения неизвестных значений в нули."""

import unittest

from hybrid_imports import aggregate


class HybridImportReportTests(unittest.TestCase):
    """Проверяет смысл отчёта независимо от версии Aiogram и платформы."""

    def test_separate_processes_sum_memory_and_model_copies(self):
        """Две копии модели учитываются дважды только в разных процессах."""
        samples = [{"stages": [{"stage": "common14", "rssKiB": 100, "built": 14}]},
                   {"stages": [{"stage": "common14", "rssKiB": 120, "built": 14}]}]
        self.assertEqual(aggregate(samples, "common14"),
                         {"processCount": 2, "rssKiB": 220, "builtModelCopies": 28})

    def test_unknown_memory_remains_unknown(self):
        """Отсутствующий RSS одного процесса делает неизвестной всю сумму."""
        samples = [{"stages": [{"stage": "common14", "rssKiB": 100, "built": 14}]},
                   {"stages": [{"stage": "common14", "rssKiB": None, "built": 14}]}]
        self.assertIsNone(aggregate(samples, "common14")["rssKiB"])


if __name__ == "__main__":
    unittest.main()
