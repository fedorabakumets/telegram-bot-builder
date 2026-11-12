"""@fileoverview Независимые проверки протокола готовности и гибели родителя."""

import asyncio
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "server/python"))
from process_handler import run_process_handler


class ProcessReviewTest(unittest.IsolatedAsyncioTestCase):
    """Проверяет отказ при неполном запуске и остановку зависшего обработчика."""

    @unittest.skipUnless(os.name == "nt", "Проверка Windows Job Object")
    async def test_completed_leader_does_not_hang_on_inherited_stdout(self):
        """Завершение лидера не оставляет родителя ждать унаследованный pipe потомка."""
        with tempfile.TemporaryDirectory() as directory:
            child = Path(directory) / "child.py"
            child.write_text('"""@fileoverview Фикстура унаследованного канала."""\n'
                             'import json, subprocess, sys\n'
                             'sys.stdin.readline()\n'
                             'subprocess.Popen([sys.executable,"-c","import time; time.sleep(60)"])\n'
                             'for event in ("ready","idle"):\n'
                             '    print(json.dumps({"type":"process","event":event}),flush=True)\n',
                             encoding="utf-8")
            ctx = SimpleNamespace(token="12345:" + "a" * 32, token_id=1,
                                  bot_file="unused.py", env={})
            settings = {"redis_url": "redis://127.0.0.1:6379/0", "idle": 0.1,
                        "_child_path": str(child), "_stop_timeout": 0.1}
            result = await asyncio.wait_for(
                run_process_handler(ctx, settings, lambda *_args: None), 8)
            self.assertEqual(result, "idle")

    @unittest.skipUnless(os.name == "nt", "Проверка Windows Job Object")
    async def test_job_closes_existing_launcher_and_grandchild(self):
        """Закрытие задания уничтожает лаунчер, интерпретатор и его потомка."""
        import ctypes
        from ctypes import wintypes
        from process_job import attach_job, close_job
        child = await asyncio.create_subprocess_exec(
            sys.executable, "-u", "-c",
            'import sys, subprocess, time; '
            'print("waiting", flush=True); sys.stdin.readline(); '
            'p=subprocess.Popen([sys.executable,"-c","import time; time.sleep(60)"]); '
            'print(p.pid, flush=True); time.sleep(60)',
            stdin=asyncio.subprocess.PIPE, stdout=asyncio.subprocess.PIPE)
        job = None
        try:
            self.assertEqual((await child.stdout.readline()).strip(), b"waiting")
            job = attach_job(child.pid)
            child.stdin.write(b"start\n")
            await child.stdin.drain()
            grandchild = int(await child.stdout.readline())
            kernel = ctypes.WinDLL("kernel32", use_last_error=True)
            kernel.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
            kernel.OpenProcess.restype = wintypes.HANDLE
            kernel.WaitForSingleObject.argtypes = [wintypes.HANDLE, wintypes.DWORD]
            kernel.CloseHandle.argtypes = [wintypes.HANDLE]
            grandchild_handle = kernel.OpenProcess(0x100000, False, grandchild)
            self.assertTrue(grandchild_handle)
            close_job(job)
            job = None
            await asyncio.wait_for(child.wait(), 5)
            try:
                self.assertEqual(kernel.WaitForSingleObject(grandchild_handle, 1000), 0)
            finally:
                kernel.CloseHandle(grandchild_handle)
        finally:
            if job is not None:
                close_job(job)
            if child.returncode is None:
                child.kill()
            await child.wait()

    async def test_idle_without_ready_is_not_success(self):
        """Поддельное завершение без готовности не подтверждает успешную активацию."""
        with tempfile.TemporaryDirectory() as directory:
            child = Path(directory) / "child.py"
            child.write_text('"""@fileoverview Неполный тестовый протокол."""\n'
                             'import json, sys\n'
                             'sys.stdin.readline()\n'
                             'print(json.dumps({"type":"process","event":"idle"}), flush=True)\n',
                             encoding="utf-8")
            ctx = SimpleNamespace(token="12345:" + "a" * 32, token_id=1,
                                  bot_file="unused.py", env={})
            settings = {"redis_url": "redis://127.0.0.1:6379/0", "idle": 0.1,
                        "_child_path": str(child), "_stop_timeout": 0.1}
            with self.assertRaises(RuntimeError):
                await run_process_handler(ctx, settings, lambda *_args: None)

    async def test_eof_reaps_child_with_blocked_event_loop(self):
        """Закрытие родительского канала завершает даже синхронно зависший main."""
        from process_handler_io import child_environment
        with tempfile.TemporaryDirectory() as directory:
            bot = Path(directory) / "blocked.py"
            bot.write_text('"""@fileoverview Блокирующая тестовая фикстура."""\n'
                           'import time\n'
                           'user_data = {}\n'
                           '_WORKER_READY_PROTOCOL = True\n'
                           '_WORKER_EXTERNAL_UPDATES_PROTOCOL = True\n'
                           '_WORKER_EXTERNAL_UPDATES_SAFE = True\n'
                           'async def main():\n'
                           '    """Блокирует цикл для проверки независимого сторожа."""\n'
                           '    print("review_blocked", flush=True)\n'
                           '    time.sleep(60)\n', encoding="utf-8")
            child = await asyncio.create_subprocess_exec(
                sys.executable, "-u", str(ROOT / "server/python/process_child.py"),
                stdin=asyncio.subprocess.PIPE, stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.DEVNULL, env=child_environment())
            try:
                payload = {"token_id": 999991, "token": "999991:" + "a" * 32,
                           "bot_file": str(bot), "project_id": 999991, "idle": 0.1,
                           "env": {"REDIS_URL": os.environ.get("DEMAND_TEST_REDIS_URL",
                                                               "redis://127.0.0.1:6379/0")}}
                child.stdin.write((json.dumps(payload) + "\n").encode())
                await child.stdin.drain()
                async with asyncio.timeout(30):
                    while True:
                        line = await child.stdout.readline()
                        self.assertTrue(line, "Обработчик не дошёл до блокирующей фикстуры")
                        if b"review_blocked" in line:
                            break
                child.stdin.close()
                await asyncio.wait_for(child.wait(), 12)
            finally:
                if child.returncode is None:
                    child.kill()
                await child.wait()


if __name__ == "__main__":
    unittest.main()
