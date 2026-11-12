"""@fileoverview Регрессии завершения фоновых операций обновления перед подтверждением."""

import asyncio
import contextvars
import unittest

import support
from demand_tasks import FatalTaskCleanupError, UpdateTasksError, update_tasks


class UpdateTaskTests(unittest.IsolatedAsyncioTestCase):
    """Проверяет дерево операций, изоляцию контекста, ошибки и отмену."""

    async def test_waits_children_and_grandchildren(self):
        """Внучатая операция заканчивается до выхода из области обновления."""
        finished = []

        async def child():
            """Создаёт продолжение после переключения цикла."""
            await asyncio.sleep(0)
            asyncio.create_task(grandchild())

        async def grandchild():
            """Имитирует запись состояния с сетевым ожиданием."""
            await asyncio.sleep(0.01)
            finished.append(True)

        async with update_tasks():
            asyncio.create_task(child())
        self.assertEqual(finished, [True])

    async def test_failure_prevents_success(self):
        """Ошибка дочерней операции запрещает успешное завершение области."""
        async def fail():
            """Имитирует ошибку хранилища без вывода содержимого исключения."""
            raise ValueError("секрет не должен попадать в итоговую ошибку")

        with self.assertRaises(UpdateTasksError) as error:
            async with update_tasks():
                asyncio.create_task(fail())
        self.assertNotIn("секрет", str(error.exception))

    async def test_existing_other_bot_context_is_isolated(self):
        """Задача другого бота не становится дочерней операцией текущего обновления."""
        trigger, started = asyncio.Event(), asyncio.Event()
        foreign = []

        async def other_bot():
            """Создаёт длительную операцию из ранее существовавшего контекста."""
            await trigger.wait()
            foreign.append(asyncio.create_task(asyncio.sleep(10)))
            started.set()

        other = asyncio.create_task(other_bot())
        try:
            async with update_tasks(timeout=0.05):
                trigger.set()
                await started.wait()
            self.assertFalse(foreign[0].done())
        finally:
            for task in foreign:
                task.cancel()
            await asyncio.gather(other, *foreign, return_exceptions=True)

    async def test_explicit_context_and_previous_factory(self):
        """Чужой контекст не учитывается; предыдущая фабрика получает параметры."""
        loop = asyncio.get_running_loop()
        calls = []

        def previous(event_loop, coro, **kwargs):
            """Записывает факт делегирования и создаёт обычную задачу."""
            calls.append(kwargs)
            return asyncio.Task(coro, loop=event_loop, **kwargs)

        loop.set_task_factory(previous)
        foreign = None
        try:
            async with update_tasks(timeout=0.05):
                foreign = asyncio.create_task(asyncio.sleep(10), context=contextvars.Context())
                asyncio.create_task(asyncio.sleep(0), name="проверка")
            self.assertFalse(foreign.done())
            self.assertGreaterEqual(len(calls), 2)
        finally:
            if foreign:
                foreign.cancel()
                await asyncio.gather(foreign, return_exceptions=True)
            loop.set_task_factory(None)

    async def test_timeout_cancels_and_waits_cleanup(self):
        """Таймаут не оставляет выполняющуюся фоновую операцию."""
        cleaned = asyncio.Event()

        async def slow():
            """Подтверждает асинхронную очистку после отмены."""
            try:
                await asyncio.sleep(10)
            finally:
                await asyncio.sleep(0)
                cleaned.set()

        with self.assertRaises(UpdateTasksError):
            async with update_tasks(timeout=0.01):
                task = asyncio.create_task(slow())
        self.assertTrue(task.done())
        self.assertTrue(cleaned.is_set())

    async def test_parent_cancellation_waits_cleanup(self):
        """Отмена обработчика дожидается завершения его дочерней операции."""
        started, cleaned = asyncio.Event(), asyncio.Event()

        async def child():
            """Оставляет признак завершения очистки."""
            try:
                started.set()
                await asyncio.sleep(10)
            finally:
                await asyncio.sleep(0)
                cleaned.set()

        async def parent():
            """Держит область обновления до внешней отмены."""
            async with update_tasks():
                asyncio.create_task(child())
                await asyncio.sleep(10)

        task = asyncio.create_task(parent())
        await started.wait()
        task.cancel()
        with self.assertRaises(asyncio.CancelledError):
            await task
        self.assertTrue(cleaned.is_set())

    async def test_ignored_cancellation_is_fatal(self):
        """Живая операция после таймаута отмены требует остановки всего процесса."""
        release = asyncio.Event()

        async def stubborn():
            """Имитирует стороннюю операцию, которая один раз подавляет отмену."""
            try:
                await asyncio.sleep(10)
            except asyncio.CancelledError:
                await release.wait()

        task = None
        try:
            with self.assertRaises(FatalTaskCleanupError):
                async with update_tasks(timeout=0.01, cleanup_timeout=0.01):
                    task = asyncio.create_task(stubborn())
            self.assertFalse(task.done())
        finally:
            release.set()
            if task:
                await asyncio.gather(task, return_exceptions=True)

    async def test_repeated_parent_cancellation_is_fatal(self):
        """Повторная отмена очистки не разрешает отпустить lease с живой задачей."""
        started, cleaning, release = asyncio.Event(), asyncio.Event(), asyncio.Event()
        children = []

        async def child():
            """Задерживает очистку до явного разрешения теста."""
            try:
                started.set()
                await asyncio.sleep(10)
            finally:
                cleaning.set()
                await release.wait()

        async def parent():
            """Ожидает внешнюю отмену, сохраняя дочернюю задачу."""
            async with update_tasks():
                children.append(asyncio.create_task(child()))
                await asyncio.sleep(10)

        task = asyncio.create_task(parent())
        try:
            await started.wait()
            task.cancel()
            await cleaning.wait()
            task.cancel()
            with self.assertRaises(FatalTaskCleanupError):
                await task
        finally:
            release.set()
            await asyncio.gather(task, *children, return_exceptions=True)
