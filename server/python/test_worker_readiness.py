"""@fileoverview Проверка подтверждения запуска нового и старого кода бота."""

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


class WorkerReadinessTest(unittest.TestCase):
    """Проверяет события настоящего процесса воркера без обращения к Telegram."""

    def run_bot(self, source):
        """Запускает тестовый bot.py и возвращает сообщения до завершения бота."""
        worker = Path(__file__).resolve().parent / 'worker.py'
        with tempfile.TemporaryDirectory() as directory:
            bot = Path(directory) / 'bot.py'
            bot.write_text(source, encoding='utf-8')
            process = subprocess.Popen([sys.executable, '-u', str(worker)], stdin=subprocess.PIPE,
                                       stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
                                       encoding='utf-8', env={**os.environ, 'PYTHONIOENCODING': 'utf-8'})
            command = {'cmd': 'start_bot', 'token_id': 19, 'token': 'test', 'bot_file': str(bot), 'env': {}}
            process.stdin.write(json.dumps(command) + '\n')
            process.stdin.flush()
            events = []
            try:
                while True:
                    line = process.stdout.readline()
                    if not line:
                        break
                    message = json.loads(line)
                    events.append(str(message.get('content', '')))
                    if message.get('content', '').startswith('bot_exited:19:'):
                        break
            finally:
                process.stdin.write('{"cmd":"shutdown"}\n')
                process.stdin.flush()
                process.communicate(timeout=15)
            return events

    def test_ready_after_initialization(self):
        """Новый бот подтверждает запуск только после вызова callback."""
        events = self.run_bot('_WORKER_READY_PROTOCOL = True\nasync def main():\n print("initializing")\n _worker_bot_ready()\n')
        initial = next(i for i, event in enumerate(events) if 'initializing' in event)
        self.assertLess(initial, events.index('bot_started:19'))

    def test_failure_before_ready(self):
        """Ошибка до готовности не выдаёт ложное подтверждение."""
        events = self.run_bot('_WORKER_READY_PROTOCOL = True\nasync def main():\n raise RuntimeError("lock failed")\n')
        self.assertNotIn('bot_started:19', events)
        self.assertIn('bot_exited:19:error', events)

    def test_legacy_bot(self):
        """Старый бот сохраняет прежнее подтверждение с предупреждением."""
        events = self.run_bot('async def main():\n print("legacy")\n')
        self.assertIn('bot_started:19', events)
        self.assertTrue(any('Старый код бота' in event for event in events))


if __name__ == '__main__':
    unittest.main()
