"""
Два бота в одном процессе worker.py видят только свой env после загрузки.

Запуск: python3 -m unittest server/python/test_worker_overlay_process.py
"""

import json
import subprocess
import sys
import tempfile
import threading
import time
import unittest
from pathlib import Path

_BOT = "\n".join([
    "import asyncio, os",
    "async def main():",
    "    a = os.environ.get('OV_A', '-')",
    "    b = os.environ.get('OV_B', '-')",
    "    print('RUN=' + a + '/' + b)",
    "    print('IN=' + str('OV_A' in os.environ) + '/' + str('OV_B' in os.environ))",
    "    print('GE=' + str(os.getenv('OV_A')) + '/' + str(os.getenv('OV_B')))",
    "    for _ in range(40):",
    "        await asyncio.sleep(0.03)",
    "        na = os.environ.get('OV_A', '-')",
    "        nb = os.environ.get('OV_B', '-')",
    "        if na != a or nb != b:",
    "            print('LEAK=' + na + '/' + nb)",
    "            return",
    "    print('LATE=' + os.environ.get('OV_A', '-') + '/' + os.environ.get('OV_B', '-'))",
    "    print('TOK=' + os.environ.get('BOT_TOKEN', '-'))",
    "",
])

_EXPECT = {
    11: ("RUN=alpha/-", "IN=True/False", "GE=alpha/None", "LATE=alpha/-", "TOK=tok-a"),
    12: ("RUN=-/beta", "IN=False/True", "GE=None/beta", "LATE=-/beta", "TOK=tok-b"),
}


class WorkerOverlayProcessTest(unittest.TestCase):
    """Поднимает worker.py на двух минимальных bot.py без Telegram."""

    def test_two_bots_keep_own_env(self):
        """После restore_env каждый бот видит свой ключ и не видит ключ соседа."""
        worker = Path(__file__).resolve().parent / "worker.py"
        with tempfile.TemporaryDirectory() as tmp:
            bot = Path(tmp) / "bot.py"
            bot.write_text(_BOT, encoding="utf-8")
            proc = subprocess.Popen(
                [sys.executable, "-u", str(worker)],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            lines: list[str] = []
            err: list[str] = []
            threading.Thread(target=lambda: lines.extend(proc.stdout), daemon=True).start()
            threading.Thread(target=lambda: err.extend(proc.stderr), daemon=True).start()
            assert proc.stdin is not None
            for tid, token, env in (
                (11, "tok-a", {"OV_A": "alpha"}),
                (12, "tok-b", {"OV_B": "beta"}),
            ):
                cmd = {"cmd": "start_bot", "token_id": tid, "token": token, "bot_file": str(bot), "env": env}
                proc.stdin.write(json.dumps(cmd) + "\n")
            proc.stdin.flush()
            deadline = time.time() + 45
            try:
                while time.time() < deadline and not _ready(lines):
                    if proc.poll() is not None:
                        break
                    time.sleep(0.05)
                self.assertTrue(_ready(lines), _dump(lines, err))
                self.assertNotIn("LEAK=", "".join(lines))
            finally:
                _stop(proc)


def _stop(proc: subprocess.Popen) -> None:
    """
    Останавливает воркер и закрывает каналы.
    @param proc - процесс worker.py
    """
    if proc.poll() is None and proc.stdin is not None and not proc.stdin.closed:
        try:
            proc.stdin.write(json.dumps({"cmd": "shutdown"}) + "\n")
            proc.stdin.flush()
        except (BrokenPipeError, ValueError):
            pass
    try:
        proc.wait(timeout=20)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait(timeout=5)
    for stream in (proc.stdin, proc.stdout, proc.stderr):
        if stream is not None and not stream.closed:
            stream.close()


def _ready(lines: list[str]) -> bool:
    """
    Проверяет, что оба бота напечатали ожидаемые маркеры.
    @param lines - сырые строки stdout воркера
    @returns True, когда маркеры обоих token_id уже есть
    """
    grouped = _by_token(lines)
    return all(all(marker in grouped[tid] for marker in markers) for tid, markers in _EXPECT.items())


def _by_token(lines: list[str]) -> dict[int, str]:
    """
    Склеивает content по token_id.
    @param lines - строки stdout
    @returns token_id → текст
    """
    grouped = {11: "", 12: ""}
    for line in lines:
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            continue
        tid = obj.get("token_id")
        if tid in grouped:
            grouped[tid] += str(obj.get("content", "")) + "\n"
    return grouped


def _dump(lines: list[str], err: list[str]) -> str:
    """
    Текст для сообщения падения.
    @param lines - stdout
    @param err - stderr
    @returns объединённый лог
    """
    return "STDOUT:\n" + "".join(lines) + "\nSTDERR:\n" + "".join(err)


if __name__ == "__main__":
    unittest.main()
