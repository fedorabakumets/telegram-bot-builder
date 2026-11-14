"""@fileoverview Проверяет остановку безопасного повтора чтения Redis без потери lease и задач."""

import asyncio
from types import SimpleNamespace
import unittest

from redis.exceptions import ConnectionError
from redis_queue_retry import peek_with_retry


class QueueRetryTest(unittest.IsolatedAsyncioTestCase):
    """Ограничивает повторы безопасным чтением и проверяет прекращение по сигналам жизненного цикла."""

    async def test_stop_interrupts_retry_delay(self):
        """Остановка немедленно прерывает длинную паузу без дочерних задач."""
        stop = asyncio.Event()
        entered = asyncio.Event()

        async def failed():
            """Имитирует отказ сети до получения обновления."""
            entered.set()
            raise ConnectionError('Недоступен локальный Redis')

        task = asyncio.create_task(peek_with_retry(SimpleNamespace(peek=failed), (stop,), retry_delay=30))
        await entered.wait()
        stop.set()
        self.assertIsNone(await asyncio.wait_for(task, .5))
        self.assertEqual(len(asyncio.all_tasks()), 1)

    async def test_receiver_failure_prevents_delivery(self):
        """Отказ приёмника или lease не позволяет продолжить чтение очереди."""
        stop = asyncio.Event()
        entered = asyncio.Event()
        fail_receiver = asyncio.Event()

        async def failed():
            """Оставляет безопасное чтение в режиме повтора."""
            entered.set()
            raise ConnectionError('Разрыв соединения')

        async def receiver():
            """Завершается отказом владения polling."""
            await fail_receiver.wait()
            raise RuntimeError('Потерян lease')

        incoming = asyncio.create_task(receiver())
        task = asyncio.create_task(peek_with_retry(SimpleNamespace(peek=failed), (stop,), incoming, 30))
        await entered.wait()
        fail_receiver.set()
        with self.assertRaisesRegex(RuntimeError, 'Потерян lease'):
            await asyncio.wait_for(task, .5)
        self.assertEqual(len(asyncio.all_tasks()), 1)

    async def test_cancel_releases_waiters(self):
        """Внешняя отмена не оставляет ожидателей stop и не поглощается повтором."""
        entered = asyncio.Event()

        async def failed():
            """Сообщает о начале отказавшей операции."""
            entered.set()
            raise ConnectionError('Разрыв соединения')

        task = asyncio.create_task(peek_with_retry(SimpleNamespace(peek=failed),
                                                  (asyncio.Event(), asyncio.Event()), retry_delay=30))
        await entered.wait()
        task.cancel()
        with self.assertRaises(asyncio.CancelledError):
            await task
        self.assertEqual(len(asyncio.all_tasks()), 1)


if __name__ == '__main__':
    unittest.main()
