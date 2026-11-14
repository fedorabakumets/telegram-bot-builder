"""@fileoverview Регрессия порядка ленивого импорта в межплатформенном тесте памяти."""
import json
import os
from pathlib import Path
import subprocess
import sys
import unittest


ROOT = Path(__file__).resolve().parents[1]


def probe_environment():
    """Убирает внешний выключатель, поскольку тест сам выбирает проверяемый режим."""
    environment = dict(os.environ)
    environment.pop('AIOGRAM_LAZY_MODELS', None)
    return environment


class RuntimeImportOrderTest(unittest.TestCase):
    """Проверяет режимы в свежих процессах без состояния соседних тестов."""

    def run_mode(self, mode):
        """Запускает короткий жизненный цикл и возвращает служебные кадры.

        @param mode - Режим импорта моделей aiogram.
        @returns Кадры конфигурации импорта и итогового результата.
        """
        result = subprocess.run(
            [sys.executable, str(ROOT / 'tools/runtime_memory_stress.py'),
             '--bots', '2', '--permanent', '1', '--cycles', '1',
             '--sample-every', '1', '--aiogram-mode', mode, '--timeout', '60'],
            cwd=ROOT, capture_output=True, text=True, timeout=90, env=probe_environment(),
        )
        self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
        frames = [json.loads(line) for line in result.stdout.splitlines() if line.startswith('{')]
        configuration = next(frame for frame in frames if frame['phase'] == 'import_configuration')
        summary = next(frame for frame in frames if frame['phase'] == 'summary')
        return configuration, summary

    def test_lazy_precedes_aiogram_and_worker_imports(self):
        """Исключает незаметное сравнение двух обычных импортов вместо lazy и eager."""
        configuration, summary = self.run_mode('lazy')
        self.assertFalse(configuration['aiogramPreimported'])
        self.assertTrue(configuration['lazyAiogramApplied'])
        self.assertEqual(configuration['aiogramMode'], 'lazy')
        self.assertTrue(summary['functionalOk'])
        self.assertTrue(summary['registrationsBounded'])

    def test_eager_remains_separate_control(self):
        """Проверяет отсутствие ленивого патча в контрольном свежем процессе."""
        configuration, summary = self.run_mode('eager')
        self.assertFalse(configuration['aiogramPreimported'])
        self.assertFalse(configuration['lazyAiogramApplied'])
        self.assertEqual(configuration['aiogramMode'], 'eager')
        self.assertTrue(summary['functionalOk'])
        self.assertTrue(summary['registrationsBounded'])

    def test_dispatcher_processes_first_and_repeated_updates(self):
        """Проверяет настоящий разбор апдейта и командный маршрут в обоих режимах."""
        for mode in ('lazy', 'eager'):
            with self.subTest(mode=mode):
                result = subprocess.run(
                    [sys.executable, str(ROOT / 'tools/runtime_dispatcher_probe.py'), mode],
                    cwd=ROOT, capture_output=True, text=True, timeout=90, env=probe_environment(),
                )
                self.assertEqual(result.returncode, 0, result.stderr)
                report = json.loads(result.stdout)
                self.assertFalse(report['preimported'])
                self.assertEqual(report['lazyApplied'], mode == 'lazy')
                self.assertEqual(report['responses'], 5)
                self.assertEqual(len(report['updateMilliseconds']), 5)
                self.assertTrue(report['ok'])


if __name__ == '__main__':
    unittest.main()
