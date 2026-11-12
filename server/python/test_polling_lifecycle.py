"""@fileoverview Проверка наблюдения за задачей polling в шаблоне бота."""

import asyncio
import unittest
from polling_test_helpers import polling_block, startup_callback


class PollingLifecycleTest(unittest.IsolatedAsyncioTestCase):
    """Проверяет настоящий фрагмент шаблона с тестовым диспетчером."""

    async def test_immediate_failure_is_not_ready(self):
        """Немедленная ошибка polling не подтверждает запуск."""
        class Dispatcher:
            def resolve_used_update_types(self):
                return []

            async def start_polling(self, *args, **kwargs):
                raise RuntimeError('ошибка запуска polling')

        ready = []
        observe = polling_block()
        observe.__globals__['_worker_bot_ready'] = lambda: ready.append(True)
        with self.assertRaisesRegex(RuntimeError, 'ошибка запуска polling'):
            await observe(Dispatcher(), None, asyncio.Event(), [])
        self.assertEqual(ready, [])

    async def test_later_failure_is_reported(self):
        """Ошибка работающей задачи выходит наружу без ожидания остановки."""
        class Dispatcher:
            def resolve_used_update_types(self):
                return []

            async def start_polling(self, *args, **kwargs):
                await asyncio.sleep(0.01)
                raise RuntimeError('ошибка работающего polling')

        ready = []
        observe = polling_block()
        observe.__globals__['_worker_bot_ready'] = lambda: ready.append(True)
        with self.assertRaisesRegex(RuntimeError, 'ошибка работающего polling'):
            await asyncio.wait_for(observe(Dispatcher(), None, asyncio.Event(), []), 1)
        self.assertEqual(ready, [])

    async def test_aiogram_startup_and_stop_guard(self):
        """Реальный диспетчер подтверждает startup и учитывает отмену запуска."""
        from aiogram import Dispatcher
        from aiogram.client.session.base import BaseSession
        from aiogram import Bot

        class Session(BaseSession):
            async def close(self):
                pass

            async def make_request(self, bot, method, timeout=None):
                raise RuntimeError('сеть не используется')

            async def stream_content(self, *args, **kwargs):
                yield b''

        dispatcher = Dispatcher()
        stop_event = asyncio.Event()
        ready = []

        async def commit():
            """Фиксирует порядок передачи состояния перед готовностью."""
            ready.append('commit')

        on_startup = startup_callback(stop_event, lambda: ready.append('ready'), commit)

        dispatcher.startup.register(on_startup)
        bot = Bot('123456:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi', session=Session())
        await dispatcher.emit_startup(bot=bot)
        self.assertEqual(ready, ['commit', 'ready'])
        await dispatcher.emit_startup(bot=bot)
        self.assertEqual(ready, ['commit', 'ready', 'ready'])
        stop_event.set()
        with self.assertRaisesRegex(RuntimeError, 'Запуск прерван'):
            await dispatcher.emit_startup(bot=bot)
        self.assertEqual(ready, ['commit', 'ready', 'ready'])

    async def test_commit_failure_does_not_publish_ready_and_can_retry(self):
        """Не подтверждает готовность при сбое состояния и разрешает повтор запуска."""
        calls = []

        async def commit():
            """Имитирует временную недоступность сохранённого состояния."""
            calls.append('commit')
            if len(calls) == 1:
                raise ConnectionError('Redis недоступен')

        callback = startup_callback(asyncio.Event(), lambda: calls.append('ready'), commit)
        with self.assertRaisesRegex(ConnectionError, 'Redis недоступен'):
            await callback()
        self.assertEqual(calls, ['commit'])
        await callback()
        self.assertEqual(calls, ['commit', 'commit', 'ready'])

    async def test_other_transports_do_not_commit_direct_state(self):
        """Webhook и внешний приёмник не подтверждают состояние прямого polling."""
        for options in ({'external': True}, {'webhook': 'https://example.test'}):
            with self.subTest(options=options):
                calls = []

                async def commit():
                    """Отмечает ошибочную передачу состояния другого транспорта."""
                    calls.append('commit')

                callback = startup_callback(asyncio.Event(), lambda: calls.append('ready'),
                                            commit, **options)
                await callback()
                self.assertEqual(calls, ['ready'])

    async def test_requested_stop_cancels_polling_waiter(self):
        """Остановка завершает polling без оставшихся фоновых ожиданий."""
        started = asyncio.Event()
        stopped = asyncio.Event()

        class Dispatcher:
            """Минимальный диспетчер с управляемым завершением polling."""

            def resolve_used_update_types(self):
                """Возвращает пустой набор обновлений для теста без сети."""
                return []

            async def start_polling(self, *args, **kwargs):
                """Ожидает остановки после подтверждения запуска задачи."""
                started.set()
                await stopped.wait()

            async def stop_polling(self):
                """Разблокирует задачу получения обновлений."""
                stopped.set()

        stop_event, tasks = asyncio.Event(), []
        task = asyncio.create_task(polling_block()(Dispatcher(), None, stop_event, tasks))
        await asyncio.wait_for(started.wait(), 1)
        stop_event.set()
        await asyncio.wait_for(task, 1)
        self.assertTrue(stopped.is_set())
        self.assertTrue(all(item.done() for item in tasks))


if __name__ == '__main__':
    unittest.main()
