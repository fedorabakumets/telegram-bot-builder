"""@fileoverview Проверка уничтожения дерева при EOF Node и раннем выходе лидера на обеих ОС."""

import asyncio
import ctypes
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "server/python"))
from process_handler_io import child_environment


def alive(pid):
    """Проверяет уникальный тестовый PID без усечения 64-разрядного дескриптора."""
    if os.name != "nt":
        try:
            status = Path(f"/proc/{pid}/stat").read_text()
            return status.rsplit(")", 1)[1].split()[0] != "Z"
        except FileNotFoundError:
            return False
    from process_job import _kernel
    api = _kernel()
    handle = api.OpenProcess(0x1000, False, pid)
    if not handle:
        return False
    try:
        api.GetExitCodeProcess.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_ulong)]
        code = ctypes.c_ulong()
        return bool(api.GetExitCodeProcess(handle, ctypes.byref(code))) and code.value == 259
    finally:
        api.CloseHandle(handle)


class WindowsGuardTests(unittest.IsolatedAsyncioTestCase):
    """Запускает настоящее дерево, не обращаясь к Redis, сети или рабочим ботам."""

    async def execute(self, leader_exit):
        """Порождает потомка и проверяет его исчезновение после разрушения владельца."""
        with tempfile.TemporaryDirectory() as directory:
            fixture = Path(directory) / "child.py"
            fixture.write_text('"""@fileoverview Изолированная тестовая фикстура дерева."""\n'
                'import json, os, subprocess, sys, time\n'
                'sys.stdin.readline()\n'
                'child = subprocess.Popen([sys.executable, "-c", "import time;time.sleep(60)"])\n'
                'for index in range(32):\n'
                '    print(json.dumps({"payload": "x" * 8192, "index": index}), flush=True)\n'
                'print(json.dumps({"descendant": child.pid}), flush=True)\n'
                + ('os._exit(0)\n' if leader_exit else 'time.sleep(60)\n'), encoding="utf-8")
            guard = await asyncio.create_subprocess_exec(sys.executable, "-u",
                str(ROOT / "server/python/process_child_guard.py"), str(fixture),
                stdin=asyncio.subprocess.PIPE, stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE, env=child_environment())
            try:
                guard.stdin.write(b"{}\n")
                await guard.stdin.drain()
                pid, memory = None, None
                async with asyncio.timeout(10):
                    while pid is None or (not leader_exit and memory is None):
                        line = await guard.stdout.readline()
                        self.assertTrue(line, "Сторож завершился до ожидаемого кадра")
                        frame = json.loads(line)
                        if frame.get("event") == "memory":
                            memory = frame["memory_kb"]
                            self.assertGreater(memory, 0)
                            self.assertGreater(frame["pid"], 0)
                        elif "descendant" in frame:
                            pid = frame["descendant"]
                        else:
                            self.assertEqual(len(frame["payload"]), 8192)
                if not leader_exit:
                    self.assertTrue(alive(pid))
                    guard.stdin.close()
                await asyncio.wait_for(guard.wait(), 10)
                async with asyncio.timeout(5):
                    while alive(pid):
                        await asyncio.sleep(0.01)
                self.assertFalse(alive(pid), "Потомок пережил сторожа дерева")
                self.assertEqual(guard.returncode, 0 if leader_exit else 70)
            finally:
                if guard.returncode is None:
                    guard.kill()
                await guard.wait()

    async def test_parent_eof_kills_blocked_tree(self):
        """Закрытие IPC Node уничтожает синхронно заблокированный child вместе с потомком."""
        await self.execute(False)

    async def test_leader_exit_kills_remaining_descendant(self):
        """Ранний выход лидера не оставляет его потомка вне контроля родителя."""
        await self.execute(True)


if __name__ == "__main__":
    unittest.main()
