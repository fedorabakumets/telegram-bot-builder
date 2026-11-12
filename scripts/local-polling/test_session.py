"""@fileoverview Интеграция сна, пробуждения и конкурентных обработчиков с Redis и HTTP."""

import asyncio
import functools
import types
import unittest
from unittest.mock import patch

# Импорт вне event loop исключает время первого чтения библиотеки из таймаутов сценария.
from aiogram.types import Update

from support import FakeTelegram, cancel, create_queue, destroy_queue, until
from demand_poller import DemandPoller
from demand_session import DemandSession
from demand_settings import resolve_settings


class SessionTests(unittest.IsolatedAsyncioTestCase):
    """Проверяет реальный координатор, заменяя только Telegram и бизнес-обработчик."""

    async def asyncSetUp(self):
        """Готовит изолированный Redis и локальный сетевой транспорт."""
        self.telegram = FakeTelegram()
        await self.telegram.open()
        self.transport = patch("demand_session.DemandPoller",
                               functools.partial(DemandPoller, api_base=self.telegram.url))
        self.transport.start()
        self.resources = []
        self.sessions = []
        self.tasks = []
        self.loads = []
        self.active = set()
        self.peak = 0
        self.handled = []
        self.state_counts = []
        self.release = None
        self.fail = False

    async def asyncTearDown(self):
        """Завершает задачи до удаления точных ключей тестового пространства."""
        for session in self.sessions:
            await session.stop()
        for task in self.tasks:
            if not task.done():
                await cancel(task)
            else:
                task.exception()
        for session in self.sessions:
            await session.queue.close()
        for queue in self.resources:
            await queue.open()
            for session in self.sessions:
                if session.queue.keys == queue.keys:
                    await queue.redis.delete(session.state.key)
            await destroy_queue(queue)
        self.transport.stop()
        await self.telegram.close()

    async def create(self, semaphore=None, queue=None):
        """Запускает сеанс, сохраняя внешний номер Telegram-бота уникальным."""
        if queue is None:
            queue = await create_queue()
            self.resources.append(queue)
        identifier = int(queue.keys[0].split("{")[1].split("}")[0])
        ctx = types.SimpleNamespace(token_id=identifier, token=f"{identifier}:LOCAL_TEST_{identifier}",
                                    status="running", env={"TELEGRAM_BOT_API_URL": self.telegram.url})
        ready = asyncio.Event()
        async def on_ready():
            """Подтверждает захват приёмником lease."""
            ready.set()
        async def load(_ctx, session):
            """Имитирует дорогой модуль, сохраняя настоящую логику обработки feed."""
            self.loads.append(identifier)
            self.active.add(identifier)
            self.peak = max(self.peak, len(self.active))
            _ctx.module = types.SimpleNamespace(user_data={})
            await session.state.load_into(_ctx.module)
            owner = self
            class Dispatcher:
                """Заменяет бизнес-эффект, оставляя валидацию aiogram настоящей."""
                async def feed_update(self, bot, update):
                    """Управляет завершением, ошибкой и записью результата обработки."""
                    if owner.release is not None:
                        await owner.release.wait()
                    if owner.fail:
                        raise RuntimeError("Тестовая ошибка обработчика")
                    state = _ctx.module.user_data
                    state[123] = state.get(123, 0) + 1
                    owner.state_counts.append(state[123])
                    owner.handled.append((identifier, update.update_id))
            try:
                await session.feed(Dispatcher(), None, asyncio.Event())
            finally:
                self.active.discard(identifier)
                _ctx.module = None
        session = DemandSession(ctx, {"redis_url": queue.redis_url, "idle": 0.1},
                                semaphore or asyncio.Semaphore(4), load, on_ready, lambda line: None)
        self.sessions.append(session)
        task = asyncio.create_task(session.run())
        self.tasks.append(task)
        await asyncio.wait_for(ready.wait(), 3)
        return session, ctx.token, task

    async def test_idle_has_no_handler_then_repeated_wake_and_sleep(self):
        """В простое модуль не загружается; два сообщения создают отдельные сеансы."""
        session, token, _ = await self.create()
        await asyncio.sleep(0.15)
        self.assertEqual(self.loads, [])
        for number in (1, 2):
            self.telegram.updates[token] = [{"update_id": number}]
            async def completed():
                """Дожидается обработки и выгрузки очередного сеанса."""
                return len(self.handled) == number and not self.active
            await until(completed)
            self.assertIsNone(await session.queue.peek())
        self.assertEqual(len(self.loads), 2)
        self.assertEqual(self.state_counts, [1, 2])

    async def test_two_bots_process_concurrently(self):
        """Два независимых бота одновременно удерживают активные обработчики."""
        self.release = asyncio.Event()
        first, token1, _ = await self.create()
        second, token2, _ = await self.create()
        self.telegram.updates[token1] = [{"update_id": 1}]
        self.telegram.updates[token2] = [{"update_id": 1}]
        async def both_active():
            """Проверяет фактическое одновременное выполнение двух ботов."""
            return len(self.active) == 2
        await until(both_active)
        self.release.set()
        async def drained():
            """Ожидает завершения двух независимых обновлений."""
            return len(self.handled) == 2 and not self.active
        await until(drained)
        self.assertEqual(self.peak, 2)
        self.assertIsNone(await first.queue.peek())
        self.assertIsNone(await second.queue.peek())

    async def test_failed_handler_replays_after_session_restart(self):
        """Ошибка не подтверждает update; новый сеанс забирает сохранённый пакет."""
        self.fail = True
        session, token, task = await self.create()
        self.telegram.updates[token] = [{"update_id": 71}]
        with self.assertRaisesRegex(RuntimeError, "Тестовая ошибка"):
            await asyncio.wait_for(asyncio.shield(task), 5)
        await session.queue.open()
        self.assertEqual((await session.queue.peek())["update_id"], 71)
        self.fail = False
        await self.create(queue=session.queue)
        async def replayed():
            """Ожидает повторной обработки долговечного пакета."""
            return len(self.handled) == 1 and not self.active
        await until(replayed)
        self.assertEqual(self.handled[0][1], 71)

    async def test_active_limit_keeps_second_bot_queued_and_stop_is_bounded(self):
        """Лимит не загружает второй модуль, а остановка ожидания сохраняет update."""
        self.release = asyncio.Event()
        semaphore = asyncio.Semaphore(1)
        first, token1, _ = await self.create(semaphore)
        second, token2, second_task = await self.create(semaphore)
        self.telegram.updates[token1] = [{"update_id": 1}]
        async def first_active():
            """Дожидается захвата единственного активного места первым ботом."""
            return len(self.active) == 1
        await until(first_active)
        self.telegram.updates[token2] = [{"update_id": 1}]
        async def second_persisted():
            """Проверяет приём второго обновления при занятом обработчике."""
            return await second.queue.peek() is not None
        await until(second_persisted)
        await asyncio.sleep(0.1)
        self.assertEqual(len(self.loads), 1)
        await second.stop()
        await asyncio.wait_for(asyncio.shield(second_task), 2)
        await second.queue.open()
        self.assertEqual((await second.queue.peek())["update_id"], 1)
        self.release.set()
        async def first_drained():
            """Дожидается завершения первого обработчика без второго пробуждения."""
            return len(self.handled) == 1 and not self.active
        await until(first_drained)
        self.assertEqual(self.peak, 1)

    def test_direct_mode_is_default_and_needs_no_redis(self):
        """Обычный режим не создаёт on-demand инфраструктуру и не требует Redis."""
        self.assertIsNone(resolve_settings(1, {"BOT_POLLING_MODE": "direct", "REDIS_URL": ""}, None))


if __name__ == "__main__":
    unittest.main()
