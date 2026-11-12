"""@fileoverview Проверяет изоляцию задач двух ботов и совместимость с ACK-областью."""

import asyncio
import contextvars
import unittest

from bot_task_scope import BotTaskScope
from demand_tasks import FatalTaskCleanupError, update_tasks


class BotTaskScopeTest(unittest.IsolatedAsyncioTestCase):
    """Проверяет очистку по владельцу без сканирования всех задач цикла."""

    async def test_two_bots_and_descendants(self):
        """Остановка одного бота отменяет его потомков, сохраняя задачи второго."""
        scopes, children, markers = {}, {}, []
        ready = [asyncio.Event(), asyncio.Event()]
        finish = [asyncio.Event(), asyncio.Event()]

        async def child(owner):
            """Создаёт продолжение во время отмены, которое также нужно завершить."""
            try:
                await asyncio.Event().wait()
            finally:
                async def descendant():
                    """Фиксирует отмену дочерней операции с тем же владельцем."""
                    try:
                        await asyncio.sleep(60)
                    finally:
                        markers.append(owner)
                task = asyncio.create_task(descendant())
                # Потомок успевает начать работу до следующего прохода очистки.
                await asyncio.sleep(0)

        async def bot(owner):
            """Открывает отдельный жизненный цикл и ждёт адресной остановки."""
            scope = scopes[owner] = BotTaskScope()
            scope.enter()
            children[owner] = asyncio.create_task(child(owner))
            ready[owner].set()
            await finish[owner].wait()
            await scope.close()

        bots = [asyncio.create_task(bot(owner)) for owner in range(2)]
        await asyncio.gather(*(event.wait() for event in ready))
        finish[0].set()
        await bots[0]
        self.assertTrue(children[0].cancelled())
        self.assertFalse(children[1].done())
        self.assertEqual(markers, [0])
        finish[1].set()
        await bots[1]
        self.assertEqual(markers, [0, 1])

    async def test_update_scope_and_explicit_context(self):
        """Область обновления сохраняет ACK-ожидание внутри жизненного цикла."""
        scope = BotTaskScope()
        scope.enter()
        values = []

        async def work():
            """Завершает фоновое действие до выхода из области обновления."""
            await asyncio.sleep(0)
            values.append(1)

        async with update_tasks():
            asyncio.create_task(work(), context=contextvars.copy_context())
        self.assertEqual(values, [1])
        await scope.close()
        self.assertEqual(len(scope.tasks), 0)

    async def test_uncooperative_task_is_fatal(self):
        """Непослушная задача запрещает безопасно выгрузить окружение бота."""
        scope = BotTaskScope(cleanup_timeout=0.02)
        scope.enter()
        release = asyncio.Event()
        ready = asyncio.Event()

        async def stubborn():
            """Игнорирует первую отмену, имитируя небезопасную библиотеку."""
            ready.set()
            try:
                await release.wait()
            except asyncio.CancelledError:
                await release.wait()

        task = asyncio.create_task(stubborn())
        await ready.wait()
        with self.assertRaises(FatalTaskCleanupError):
            await scope.close()
        release.set()
        await task

    async def test_stale_context_cannot_restart_tasks(self):
        """Отложенный callback со старым контекстом не запускает выгруженный сценарий."""
        scope = BotTaskScope()
        scope.enter()
        stale_context = contextvars.copy_context()
        await scope.close()
        values = []

        async def late():
            """Имитирует попытку позднего запуска после очистки окружения."""
            values.append(1)

        task = asyncio.create_task(late(), context=stale_context)
        await asyncio.gather(task, return_exceptions=True)
        self.assertTrue(task.cancelled())
        self.assertEqual(values, [])


if __name__ == "__main__":
    unittest.main()
