"""@fileoverview Проверки завершения отклонённого запуска без раскрытия секретов."""

import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from worker_start_rejection import reject_start


class WorkerStartRejectionTest(unittest.TestCase):
    """Проверяет протокол раннего отказа и сохранение работающего соседа."""

    def test_invalid_ids_never_emit_terminal_event(self):
        """Посторонние типы не создают ложных идентификаторов в протоколе."""
        for token_id in (None, False, True, 0, -1, "12", [], {}):
            with self.subTest(token_id=token_id):
                events, logs = [], []
                reject_start(token_id, {}, "Ошибка", lambda *args: logs.append(args), events.append)
                self.assertEqual(events, [])
                self.assertEqual(logs, [(0, "Ошибка", "stderr")])

    def test_registered_bot_never_emits_terminal_event(self):
        """Ошибочная повторная команда не освобождает резерв работающего бота."""
        events = []
        reject_start(12, {12: object()}, "Ошибка", lambda *args: None, events.append)
        self.assertEqual(events, [])

    def test_worker_reports_both_early_failures_without_secrets(self):
        """Настоящий воркер подтверждает отказы и сохраняет действующий запуск."""
        worker = Path(__file__).resolve().parent / "worker.py"
        with tempfile.TemporaryDirectory() as directory:
            bot = Path(directory) / "bot.py"
            bot.write_text("import asyncio\nasync def main():\n await asyncio.sleep(60)\n", encoding="utf-8")
            commands = [
                {"cmd": "start_bot", "token_id": 11, "token": "test", "bot_file": str(bot), "env": {}},
                {"cmd": "start_bot", "token_id": 12, "token": "secret-token"},
                {"cmd": "start_bot", "token_id": 13, "token": "secret-token", "bot_file": str(bot),
                 "env": "secret-env"},
                {"cmd": "start_bot", "token_id": 11, "token": "test", "bot_file": str(bot),
                 "env": "secret-env"},
                {"cmd": "status"},
                {"cmd": "shutdown"},
            ]
            result = subprocess.run(
                [sys.executable, "-u", str(worker)],
                input="".join(json.dumps(command) + "\n" for command in commands),
                capture_output=True, text=True, encoding="utf-8", timeout=30,
                env={**os.environ, "PYTHONIOENCODING": "utf-8"},
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertNotIn("secret-token", result.stdout + result.stderr)
            self.assertNotIn("secret-env", result.stdout + result.stderr)
            messages = [json.loads(line) for line in result.stdout.splitlines()]
            contents = [message.get("content") for message in messages]
            self.assertEqual(contents.count("bot_exited:12:error"), 1)
            self.assertEqual(contents.count("bot_exited:13:error"), 1)
            self.assertNotIn("bot_exited:11:error", contents)
            status = next(message["data"] for message in messages if message.get("type") == "status")
            self.assertEqual([item["token_id"] for item in status["bots"]], [11])


if __name__ == "__main__":
    unittest.main()
