"""Проверяет поведение продления блокировки из шаблона при сбоях Redis."""

import asyncio
import logging
from pathlib import Path
import textwrap
import unittest


class Clock:
    """Управляемые часы для проверки срока владения блокировкой."""

    def __init__(self):
        """Создаёт часы с нулевым временем."""
        self.now = 0

    def monotonic(self):
        """Возвращает текущее значение управляемых часов."""
        return self.now


class RedisLockTest(unittest.IsolatedAsyncioTestCase):
    """Проверяет остановку при потере или неподтверждении блокировки."""

    async def run_refresh(self, responses):
        """Выполняет функцию шаблона с управляемыми ответами Redis."""
        source = Path('lib/templates/main/main.py.jinja2').read_text(encoding='utf-8')
        source = source.split('            async def _refresh_lock():', 1)[1]
        source = 'async def refresh():\n' + textwrap.dedent(source.split('            _background_tasks.append', 1)[0]).replace('\n', '\n    ')
        clock = Clock()
        stopped = asyncio.Event()
        calls = []

        class FakeAsyncio:
            """Заменяет ожидания управляемым продвижением времени."""

            @staticmethod
            async def sleep(delay):
                """Продвигает часы на время ожидания."""
                clock.now += delay

            wait_for = staticmethod(asyncio.wait_for)

        class Redis:
            """Возвращает заданные результаты продления."""

            async def eval(self, *_args):
                """Записывает время запроса и возвращает очередной результат."""
                calls.append(clock.now)
                response = responses.pop(0) if responses else ConnectionError()
                if isinstance(response, Exception):
                    raise response
                return response

        scope = {'asyncio': FakeAsyncio, '_lock_time': clock, '_lock_deadline': 50,
                 '_stop_event': stopped, '_redis_client': Redis(), '_lock_key': 'key',
                 '_lock_owner': 'owner', 'logging': logging}
        exec(source, scope)
        await scope['refresh']()
        return clock.now, stopped.is_set(), calls

    async def test_connection_loss_stops_before_expiry(self):
        """Длительный сбой Redis останавливает бот до истечения TTL."""
        now, stopped, calls = await self.run_refresh([])
        self.assertTrue(stopped)
        self.assertEqual(now, 50)
        self.assertEqual(calls, [30, 35, 40, 45])

    async def test_renewed_deadline_and_lost_owner(self):
        """Успешное продление обновляет срок, а чужой владелец останавливает бот."""
        now, stopped, calls = await self.run_refresh([1, 0])
        self.assertTrue(stopped)
        self.assertEqual(now, 60)
        self.assertEqual(calls, [30, 60])


if __name__ == '__main__':
    unittest.main()
