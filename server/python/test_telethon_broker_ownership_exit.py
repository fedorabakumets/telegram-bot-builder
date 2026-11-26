"""@fileoverview Проверки завершения брокера при потере владельца без настоящего Telegram или Redis."""

import asyncio
import json
import subprocess
import sys
import unittest
from pathlib import Path

from telethon_broker_ownership import BrokerOwnership
from test_telethon_broker_ownership import FakeRedis


class OwnershipExitTest(unittest.IsolatedAsyncioTestCase):
    """Проверяет, что ошибка владения доходит до супервизора завершением процесса."""

    async def test_parent_pipe_eof_runs_graceful_cleanup(self):
        """Потеря родительского stdin не оставляет встроенный брокер отдельным владельцем."""
        script = '''
from aiohttp import web
from telethon_broker_stdin import enable_stdin_shutdown
async def cleanup(app):
    print("SYNTHETIC_CLEANUP_FINISHED", flush=True)
app = web.Application()
app.on_startup.append(enable_stdin_shutdown)
app.on_cleanup.append(cleanup)
web.run_app(app, host="127.0.0.1", port=0, print=None)
'''
        result = await asyncio.to_thread(subprocess.run, [sys.executable, "-c", script],
                                         cwd=Path(__file__).parent, input="", capture_output=True, text=True, timeout=4)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("SYNTHETIC_CLEANUP_FINISHED", result.stdout)

    async def test_exit_callback_runs_even_when_disconnect_fails(self):
        """Неудача закрытия не оставляет процесс бесконечно готовым и не снимает реестр."""
        redis = FakeRedis()
        owner = BrokerOwnership(redis)
        await owner.acquire()
        stopped = asyncio.Event()

        async def fail_close():
            """Имитирует зависимость, не подтвердившую отключение Telegram."""
            raise OSError("Имитация отказа отключения")

        owner.watch(fail_close, stopped.set)
        redis.available = False
        await asyncio.wait_for(stopped.wait(), 2)
        self.assertTrue(owner.failed)
        self.assertEqual(redis.value, owner.owner)
        await asyncio.gather(owner.task, return_exceptions=True)

    async def test_actual_aiohttp_exit_executes_cleanup_without_unlock(self):
        """Реальный синтетический aiohttp-процесс закрывается после потери имитации Redis."""
        script = '''
import asyncio, json
from aiohttp import web
from telethon_broker_ownership import BrokerOwnership
from telethon_broker_stdin import request_broker_shutdown
from test_telethon_broker_ownership import FakeRedis
redis = FakeRedis()
owner = BrokerOwnership(redis)
events = []
async def close():
    events.append("clients_closed")
async def start(app):
    await owner.acquire()
    owner.watch(close, request_broker_shutdown)
    asyncio.get_running_loop().call_later(0.05, lambda: setattr(redis, "available", False))
async def cleanup(app):
    events.append("cleanup")
    redis.available = True
    await owner.stop(close)
app = web.Application()
app.on_startup.append(start)
app.on_cleanup.append(cleanup)
web.run_app(app, host="127.0.0.1", port=0, print=None)
print(json.dumps({"events": events, "reserved": redis.value == owner.owner}))
'''
        result = await asyncio.to_thread(subprocess.run, [sys.executable, "-c", script],
                                         cwd=Path(__file__).parent, capture_output=True, text=True, timeout=6)
        self.assertEqual(result.returncode, 0, result.stderr)
        state = json.loads(result.stdout)
        self.assertEqual(state["events"], ["clients_closed", "cleanup", "clients_closed"])
        self.assertTrue(state["reserved"])
