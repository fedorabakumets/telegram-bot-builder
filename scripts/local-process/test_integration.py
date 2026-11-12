"""@fileoverview Сквозные проверки настоящих процессов, Redis и локального Telegram API."""

import asyncio
import os
import sys
import unittest
import uuid
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "server/python"))
from demand_queue import DemandQueue
from demand_state import DemandState
from fake_telegram import FakeTelegram


async def eventually(predicate, timeout=30):
    """Ожидает наблюдаемое событие с ограничением времени вместо фиксированного сна."""
    async with asyncio.timeout(timeout):
        while not await predicate():
            await asyncio.sleep(0.03)


def pid_exists(pid):
    """Проверяет живой PID средствами ОС без необязательных зависимостей."""
    if sys.platform == "win32":
        import ctypes
        handle = ctypes.windll.kernel32.OpenProcess(0x1000, False, pid)
        if not handle:
            return False
        code = ctypes.c_ulong()
        ctypes.windll.kernel32.GetExitCodeProcess(handle, ctypes.byref(code))
        ctypes.windll.kernel32.CloseHandle(handle)
        return code.value == 259
    try:
        os.kill(pid, 0)
        return True
    except ProcessLookupError:
        return False


class ProcessIntegrationTest(unittest.IsolatedAsyncioTestCase):
    """Проверяет освобождение ОС-процессов, а не только выгрузку Python-модулей."""

    async def asyncSetUp(self):
        """Выделяет уникальные Redis-ключи и изолированный loopback API."""
        self.api = await FakeTelegram().start()
        self.sessions, self.tasks, self.queues, self.state_keys = [], [], [], []
        self.logs = []
        self.aiogram_initial = "aiogram" in sys.modules
        self.spawned = []
        original_spawn = asyncio.create_subprocess_exec
        async def tracked_spawn(*args, **kwargs):
            """Запоминает реальные дочерние процессы без замены их выполнения."""
            process = await original_spawn(*args, **kwargs)
            self.spawned.append(process)
            return process
        self.spawn_patch = patch("asyncio.create_subprocess_exec", tracked_spawn)
        self.spawn_patch.start()
        self.redis_url = os.environ.get("DEMAND_TEST_REDIS_URL", "redis://127.0.0.1:6379/0")

    async def asyncTearDown(self):
        """Останавливает только тестовые процессы и удаляет исключительно свои ключи."""
        for session in self.sessions:
            try:
                await session.stop()
            except Exception:
                pass
        for task in self.tasks:
            task.cancel()
        await asyncio.gather(*self.tasks, return_exceptions=True)
        self.spawn_patch.stop()
        for process in self.spawned:
            self.assertIsNotNone(process.returncode, "Дочерний процесс не собран после остановки")
        for queue, state_key in zip(self.queues, self.state_keys):
            if queue.redis is None:
                await queue.open()
            await queue.redis.delete(*queue.keys, state_key)
            await queue.close()
        await self.api.close()

    async def create_session(self, semaphore=None):
        """Создаёт получатель без импорта aiogram или сценария в текущий процесс."""
        from demand_session import DemandSession
        from process_handler import run_process_handler
        number = 100000000 + uuid.uuid4().int % 800000000
        token = f"{number}:" + uuid.uuid4().hex
        ctx = SimpleNamespace(token=token, token_id=number, project_id=999999,
            bot_file=str(Path(__file__).parent / "fixtures/bot.py"),
            env={"REDIS_URL": self.redis_url, "TELEGRAM_BOT_API_URL": self.api.base},
            webhook_url=None, webhook_port=None, status="running", module=None)
        ready = asyncio.Event()
        async def notify_ready():
            """Отмечает захват polling lease."""
            ready.set()
        settings = {"mode": "process", "redis_url": self.redis_url, "idle": 0.2, "maximum": 1}
        async def load_handler(context, demand):
            """Передаёт тяжёлую обработку настоящему временному процессу."""
            await run_process_handler(context, demand.settings, lambda *args: self.logs.append(args))
        settings["project_id"] = ctx.project_id
        session = DemandSession(ctx, settings, semaphore or asyncio.Semaphore(1),
                                load_handler, notify_ready, lambda message: None)
        queue = DemandQueue(self.redis_url, number)
        await queue.open()
        self.queues.append(queue)
        self.state_keys.append(DemandState(queue, ctx.project_id, ctx.token_id).key)
        self.sessions.append(session)
        task = asyncio.create_task(session.run())
        self.tasks.append(task)
        await asyncio.wait_for(ready.wait(), 5)
        return ctx, session, task, queue

    async def test_sleep_reap_and_state_after_new_process(self):
        """В простое нет child; два пробуждения используют разные PID и одно состояние."""
        ctx, session, task, queue = await self.create_session()
        self.assertEqual("aiogram" in sys.modules, self.aiogram_initial)
        await asyncio.sleep(0.1)
        self.assertEqual(len(self.spawned), 0)
        self.assertFalse(self.api.sent)
        self.api.push(ctx.token, 1)
        async def first_reply():
            """Проверяет наличие первого ответа."""
            return len(self.api.sent) >= 1
        try:
            await eventually(first_reply)
        except TimeoutError:
            self.fail(f"Нет ответа: {self.logs}; task={task.exception() if task.done() else 'pending'}")
        first_count, first_pid = self.api.sent[0][1]["text"].split(":")
        self.assertEqual(first_count, "1")
        async def child_gone():
            """Проверяет отсутствие PID после штатного засыпания."""
            return not pid_exists(int(first_pid))
        await eventually(child_gone)
        self.assertIsNone(await queue.peek())
        self.api.push(ctx.token, 2)
        async def second_reply():
            """Проверяет наличие ответа после повторного пробуждения."""
            return len(self.api.sent) >= 2
        await eventually(second_reply)
        count, pid = self.api.sent[1][1]["text"].split(":")
        self.assertEqual(count, "2")
        self.assertNotEqual(pid, first_pid)
        self.assertEqual(len(self.spawned), 2)
        self.assertEqual("aiogram" in sys.modules, self.aiogram_initial)

    async def test_child_crash_retains_unacknowledged_update(self):
        """Аварийный выход child не подтверждает ещё не обработанное сообщение."""
        ctx, session, task, queue = await self.create_session()
        self.api.push(ctx.token, 1, "crash")
        async def terminated():
            """Дожидается распространения ошибки дочернего процесса."""
            return task.done()
        await eventually(terminated)
        await asyncio.gather(task, return_exceptions=True)
        self.assertTrue(any("fixture_crash" in str(entry) for entry in self.logs))
        if queue.redis is None:
            await queue.open()
        self.assertEqual((await queue.peek())["update_id"], 1)
        self.assertFalse(self.api.sent)

    async def test_shared_cap_keeps_second_bot_queued_until_slot_release(self):
        """Один занятый процесс не допускает запуска обработчика второго бота."""
        semaphore = asyncio.Semaphore(1)
        first, session, task, queue = await self.create_session(semaphore)
        second, other, other_task, other_queue = await self.create_session(semaphore)
        self.api.push(first.token, 1, "hold")
        async def slot_taken():
            """Ожидает захвата общего слота первым ботом."""
            return semaphore.locked()
        await eventually(slot_taken)
        async def first_processing():
            """Проверяет, что первый процесс действительно выполняет сообщение."""
            return any("fixture_hold" in str(entry) for entry in self.logs)
        await eventually(first_processing)
        self.api.push(second.token, 1)
        async def second_queued():
            """Ожидает надёжной записи обновления второго бота."""
            return await other_queue.peek() is not None
        await eventually(second_queued)
        await asyncio.sleep(0.3)
        self.assertFalse(any(token == second.token for token, _ in self.api.sent))
        await session.stop()
        task.cancel()
        await asyncio.gather(task, return_exceptions=True)
        async def second_answered():
            """Ожидает обработку второго бота после освобождения слота."""
            return any(token == second.token for token, _ in self.api.sent)
        await eventually(second_answered)
        self.assertEqual((await queue.peek())["update_id"], 1)

    async def test_receiver_rejection_stops_child_without_ack(self):
        """Постоянный отказ Telegram отменяет обработчик и сохраняет очередь."""
        ctx, session, task, queue = await self.create_session()
        self.api.push(ctx.token, 1, "hold")
        async def handler_started():
            """Ожидает начала активации обработчика."""
            return any("fixture_hold" in str(entry) for entry in self.logs)
        await eventually(handler_started)
        self.api.rejected.add(ctx.token)
        async def stopped():
            """Ожидает завершения получателя после постоянной ошибки."""
            return task.done()
        await eventually(stopped, 20)
        await asyncio.gather(task, return_exceptions=True)
        self.assertEqual((await queue.peek())["update_id"], 1)
        self.assertFalse(self.api.sent)


if __name__ == "__main__":
    unittest.main()
