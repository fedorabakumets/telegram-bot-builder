"""@fileoverview Проверка изоляции, журналов и завершения настоящего подпроцесса."""

import asyncio
import os
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

from process_handler import run_process_handler


class ProcessHandlerTests(unittest.IsolatedAsyncioTestCase):
    """Проверяет контроллер на небольших процессах без Telegram и Redis."""

    async def execute(self, source, cancel=False):
        """Создаёт временного ребёнка и выполняет одну активацию."""
        with tempfile.TemporaryDirectory() as directory:
            child = Path(directory) / "child.py"
            child.write_text(source, encoding="utf-8")
            ctx = SimpleNamespace(token_id=1, token="123456:secret_token_long_enough_12345",
                                  bot_file="unused", env={})
            logs = []
            task = asyncio.create_task(run_process_handler(ctx,
                {"_child_path": str(child), "redis_url": "redis://localhost", "idle": .1,
                 "_stop_timeout": .1}, lambda *entry: logs.append(entry)))
            if cancel:
                await asyncio.sleep(.3)
                task.cancel()
            return await task, logs

    async def test_idle_logs_and_environment(self):
        """Секрет панели не наследуется, токен скрыт, системные события отфильтрованы."""
        os.environ["PANEL_SECRET_TOKEN"] = "never"
        try:
            result, logs = await self.execute('''import json,sys,os
p=json.loads(sys.stdin.readline())
assert 'PANEL_SECRET_TOKEN' not in os.environ
print(json.dumps({'type':'system','content':'bot_exited:1:stopped'}))
print(json.dumps({'type':'stdout','content':p['token']}))
print(json.dumps({'type':'process','event':'ready'}))
print(json.dumps({'type':'process','event':'idle'}))
''')
        finally:
            os.environ.pop("PANEL_SECRET_TOKEN", None)
        self.assertEqual(result, "idle")
        self.assertEqual(logs, [(1, "stdout", "[скрыто]")])

    async def test_crash_rejected(self):
        """Неожиданное завершение не считается успешным засыпанием."""
        with self.assertRaises(RuntimeError):
            await self.execute("raise SystemExit(4)")

    async def test_oversize_stops_child(self):
        """Неограниченная строка вызывает остановку вместо роста буфера."""
        with self.assertRaises(RuntimeError):
            await asyncio.wait_for(self.execute("import sys,time; print('x'*100000);sys.stdout.flush();time.sleep(60)"), 6)

    async def test_cancel_reaps_child(self):
        """Отмена завершает неслушающий процесс до возврата вызывающему коду."""
        with self.assertRaises(asyncio.CancelledError):
            await asyncio.wait_for(self.execute("import time;time.sleep(60)", cancel=True), 6)


if __name__ == "__main__":
    unittest.main()
