"""@fileoverview Проверка наблюдения за задачей polling в шаблоне бота."""

import asyncio
import textwrap
import unittest
from pathlib import Path


def polling_block():
    """Возвращает исполняемый фрагмент шаблона наблюдения за polling."""
    template = Path(__file__).resolve().parents[2] / 'lib/templates/main/main.py.jinja2'
    source = template.read_text(encoding='utf-8')
    start = source.index('                    _polling_task = asyncio.create_task(dp.start_polling')
    end = source.index('                    try:\n                        await _polling_task', start)
    body = textwrap.dedent(source[start:end])
    namespace = {'asyncio': asyncio}
    exec('async def observe(dp, bot, _stop_event, _background_tasks):\n' +
         textwrap.indent(body, '    '), namespace)
    return namespace['observe']


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

        template = Path(__file__).resolve().parents[2] / 'lib/templates/main/main.py.jinja2'
        source = template.read_text(encoding='utf-8')
        start = source.index('        async def _notify_worker_ready')
        end = source.index('        # Выбор режима запуска:', start)
        namespace = {'_stop_event': stop_event, '_worker_bot_ready': lambda: ready.append(True)}
        exec(textwrap.dedent(source[start:end]), namespace)
        on_startup = namespace['_notify_worker_ready']

        dispatcher.startup.register(on_startup)
        bot = Bot('123456:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi', session=Session())
        await dispatcher.emit_startup(bot=bot)
        self.assertEqual(ready, [True])
        stop_event.set()
        with self.assertRaisesRegex(RuntimeError, 'Запуск прерван'):
            await dispatcher.emit_startup(bot=bot)
        self.assertEqual(ready, [True])


if __name__ == '__main__':
    unittest.main()
