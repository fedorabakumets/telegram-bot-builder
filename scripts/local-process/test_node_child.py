"""@fileoverview Прямой запуск временного Python из родителя без worker.py и polling."""

import asyncio
import json
import os
import sys
import unittest
import uuid
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "server/python"))
from demand_queue import DemandQueue
from demand_state import DemandState
from fake_telegram import FakeTelegram
from process_handler_io import child_environment


class NodeChildTests(unittest.IsolatedAsyncioTestCase):
    """Проверяет IPC, сохранение снимка и отсутствие собственного Telegram polling."""

    async def asyncSetUp(self):
        """Создаёт уникальную очередь, не затрагивая локальные рабочие боты."""
        address = os.environ.get("DEMAND_TEST_REDIS_URL", "redis://127.0.0.1:6379/0")
        if urlparse(address).hostname not in ("localhost", "127.0.0.1", "::1"):
            raise RuntimeError("Тест разрешён только с локальным Redis")
        self.number = 100000000 + uuid.uuid4().int % 800000000
        self.token = f"{self.number}:" + uuid.uuid4().hex
        self.queue = DemandQueue(address, self.number)
        await self.queue.open()
        self.state = DemandState(self.queue, 987654, self.number)
        self.api = await FakeTelegram().start()
        self.children = []

    async def asyncTearDown(self):
        """Собирает дочерние процессы и удаляет только уникальные тестовые ключи."""
        for child in self.children:
            if child.returncode is None:
                child.kill()
            await child.wait()
        await self.queue.redis.delete(*self.queue.keys, self.state.key)
        await self.queue.close()
        await self.api.close()

    async def execute(self, update_id, text="Привет"):
        """Имитирует родителя Node: сохраняет обновление и передаёт один init в stdin."""
        self.api.push(self.token, update_id, text)
        await self.queue.enqueue([self.api.updates[self.token][-1]])
        launcher = "process_child_guard.py"
        child = await asyncio.create_subprocess_exec(sys.executable, "-u",
            str(ROOT / "server/python" / launcher),
            stdin=asyncio.subprocess.PIPE, stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE, env=child_environment())
        self.children.append(child)
        payload = {"token_id": self.number, "token": self.token,
            "project_id": 987654, "idle": 0.1,
            "bot_file": str(Path(__file__).parent / "fixtures/bot.py"),
            "env": {"REDIS_URL": self.queue.redis_url,
                    "TELEGRAM_BOT_API_URL": self.api.base}}
        child.stdin.write((json.dumps(payload) + "\n").encode())
        await child.stdin.drain()
        # stdin остаётся открытым: communicate() послал бы EOF и запрос остановки.
        stdout = asyncio.create_task(child.stdout.read())
        stderr = asyncio.create_task(child.stderr.read())
        await asyncio.wait_for(child.wait(), 30)
        frames = [json.loads(line) for line in (await stdout).splitlines()]
        return child.returncode, frames, await stderr

    async def test_direct_child_restarts_with_state_without_polling(self):
        """Два отдельных child восстанавливают состояние; ready/idle содержат реальный PID."""
        pids = []
        for update_id in (1, 2):
            code, frames, errors = await self.execute(update_id)
            self.assertEqual(code, 0, errors.decode(errors="replace"))
            lifecycle = [frame for frame in frames if frame.get("type") == "process"
                         and frame.get("event") != "memory"]
            self.assertEqual([frame["event"] for frame in lifecycle], ["ready", "idle"])
            self.assertEqual(lifecycle[0]["pid"], lifecycle[1]["pid"])
            pids.append(lifecycle[0]["pid"])
            self.assertIsNone(await self.queue.peek())
            self.assertIsNotNone(await self.queue.redis.get(self.state.key))
            count, pid = self.api.sent[-1][1]["text"].split(":")
            self.assertEqual(int(count), update_id)
            self.assertEqual(int(pid), pids[-1])
        self.assertNotEqual(*pids)
        self.assertNotIn("getUpdates", [method for _, method in self.api.calls])

    async def test_crash_does_not_ack_pending_update(self):
        """Авария изолированного обработчика оставляет обновление доступным для повторения."""
        code, _, _ = await self.execute(1, "crash")
        self.assertEqual(code, 73)
        self.assertEqual((await self.queue.peek())["update_id"], 1)
        self.assertIsNone(await self.queue.redis.get(self.state.key))
        self.assertNotIn("getUpdates", [method for _, method in self.api.calls])


if __name__ == "__main__":
    unittest.main()
