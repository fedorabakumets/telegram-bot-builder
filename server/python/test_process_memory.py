"""@fileoverview Адресные проверки суммарной памяти родителя и обработчиков."""

import os
import unittest
from unittest.mock import patch

import process_memory as memory


class ProcessMemoryTests(unittest.TestCase):
    """Проверяет отсутствие двойного учёта и скрытого занижения общей памяти."""

    def tearDown(self):
        """Сбрасывает только тестовый реестр после каждой проверки."""
        memory._children.clear()

    def test_parent_only(self):
        """Спящий режим учитывает общую базовую память вместо обещания нуля."""
        with patch.object(memory, "process_rss_kb", return_value=123):
            self.assertEqual(memory.total_rss_kb(), 123)

    def test_registered_children_are_summed_once(self):
        """Повторная регистрация не удваивает ребёнка и не включает родителя."""
        memory.register_pid(987654)
        memory.register_pid(987654)
        memory.register_pid(os.getpid())
        with patch.object(memory, "process_rss_kb", return_value=123), \
                patch.object(memory, "pid_rss_kb", return_value=456):
            self.assertEqual(memory.total_rss_kb(), 579)

    def test_unknown_child_prevents_misleading_parent_only_value(self):
        """Неизмеримый ребёнок делает общий результат неизвестным, а не заниженным."""
        memory.register_pid(987654)
        with patch.object(memory, "process_rss_kb", return_value=123), \
                patch.object(memory, "pid_rss_kb", return_value=None):
            self.assertIsNone(memory.total_rss_kb())

    def test_unregistration(self):
        """После подтверждённого завершения память ребёнка исчезает из суммы."""
        memory.register_pid(987654)
        memory.unregister_pid(987654)
        with patch.object(memory, "process_rss_kb", return_value=123):
            self.assertEqual(memory.total_rss_kb(), 123)

    def test_invalid_pid_is_ignored(self):
        """Некорректные значения нельзя превратить в произвольные системные запросы."""
        for value in (True, None, "123", 0, -1):
            memory.register_pid(value)
        self.assertFalse(memory._children)

    def test_current_process_is_measurable(self):
        """Настоящий процесс отдаёт положительную память поддерживаемой платформы."""
        self.assertGreater(memory.pid_rss_kb(os.getpid()), 0)

    def test_missing_process_is_unmeasurable(self):
        """Заведомо отсутствующий PID не интерпретируется как нулевой расход."""
        self.assertIsNone(memory.pid_rss_kb(2147483647))


if __name__ == "__main__":
    unittest.main()
