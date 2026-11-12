"""@fileoverview Проверки очистки блокировок пользователей, отмены и атомарности очереди."""
import asyncio
from pathlib import Path
import re
import unittest

SOURCE = Path(__file__).parents[1] / "templates/utils/scoped-locks.py.jinja2"
exec(re.sub(r"\{#.*?#\}", "", SOURCE.read_text(encoding="utf-8"), flags=re.S))


class ScopedLocksTests(unittest.IsolatedAsyncioTestCase):
    """Проверяет только реально выполняемый код шаблона без Telegram и воркера."""

    async def test_parallel_updates_are_atomic_and_released(self):
        """Все конкурентные обновления завершаются без потерь и остаточных ключей."""
        registry = {}
        values = {}

        async def update(user):
            """Имитирует чтение и запись с переключением задач внутри блокировки."""
            async with _scoped_user_lock(registry, user):
                previous = values.get(user, 0)
                await asyncio.sleep(0)
                values[user] = previous + 1

        await asyncio.gather(*(update(user) for user in range(100) for _ in range(10)))
        self.assertEqual(values, dict.fromkeys(range(100), 10))
        self.assertEqual(registry, {})

    async def test_cancelled_waiter_does_not_replace_live_lock(self):
        """Отмена ожидающего сохраняет общий lock владельца и остальных ожидающих."""
        registry = {}
        finished = []

        async def wait(number):
            """Ожидает общую блокировку и отмечает завершение."""
            async with _scoped_user_lock(registry, 7):
                finished.append(number)

        async with _scoped_user_lock(registry, 7):
            entry = registry[7]
            cancelled = asyncio.create_task(wait(1))
            survivor = asyncio.create_task(wait(2))
            await asyncio.sleep(0)
            cancelled.cancel()
            with self.assertRaises(asyncio.CancelledError):
                await cancelled
            self.assertIs(registry[7], entry)
            self.assertEqual(entry[1], 2)
        newcomer = asyncio.create_task(wait(3))
        await asyncio.gather(survivor, newcomer)
        self.assertEqual(finished, [2, 3])
        self.assertEqual(registry, {})

    async def test_cancelled_owner_releases_waiter(self):
        """Отмена владельца освобождает ожидающего и затем удаляет запись."""
        registry = {}
        entered = asyncio.Event()

        async def owner():
            """Удерживает блокировку до внешней отмены."""
            async with _scoped_user_lock(registry, 9):
                entered.set()
                await asyncio.Event().wait()

        task = asyncio.create_task(owner())
        await entered.wait()
        task.cancel()
        with self.assertRaises(asyncio.CancelledError):
            await task
        async with _scoped_user_lock(registry, 9):
            self.assertEqual(registry[9][1], 1)
        self.assertEqual(registry, {})

    async def test_exception_releases_registry(self):
        """Ошибка пользовательского кода не оставляет блокировку или ключ."""
        registry = {}
        with self.assertRaises(ValueError):
            async with _scoped_user_lock(registry, 1):
                raise ValueError("проверка")
        self.assertEqual(registry, {})


if __name__ == "__main__":
    unittest.main()
