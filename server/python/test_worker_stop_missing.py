"""@fileoverview Проверка подтверждения остановки отсутствующего бота в общем воркере."""

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


class WorkerStopMissingTest(unittest.TestCase):
    """Проверяет ответ настоящего воркера без Telegram."""

    def test_missing_bot_does_not_stop_neighbor(self):
        """Отсутствующий бот подтверждается, сосед остаётся зарегистрированным."""
        worker = Path(__file__).resolve().parent / 'worker.py'
        with tempfile.TemporaryDirectory() as directory:
            bot = Path(directory) / 'bot.py'
            bot.write_text('import asyncio\nasync def main():\n await asyncio.sleep(0.2)\n', encoding='utf-8')
            commands = [
                {'cmd': 'start_bot', 'token_id': 11, 'token': 'test', 'bot_file': str(bot), 'env': {}},
                {'cmd': 'stop_bot', 'token_id': 12},
                {'cmd': 'status'},
                {'cmd': 'shutdown'},
            ]
            result = subprocess.run(
                [sys.executable, '-u', str(worker)],
                input=''.join(json.dumps(command) + '\n' for command in commands),
                capture_output=True, text=True, encoding='utf-8', timeout=30,
                env={**os.environ, 'PYTHONIOENCODING': 'utf-8'},
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            messages = [json.loads(line) for line in result.stdout.splitlines()]
            contents = [str(message.get('content', '')) for message in messages]
            self.assertIn('bot_stopped:12', contents)
            self.assertTrue(any(message.get('type') == 'stdout' and message.get('token_id') == 12
                                and 'уже остановлен' in message.get('content', '') for message in messages))
            status = next(message['data'] for message in messages if message.get('type') == 'status')
            self.assertEqual([bot['token_id'] for bot in status['bots']], [11])


if __name__ == '__main__':
    unittest.main()
