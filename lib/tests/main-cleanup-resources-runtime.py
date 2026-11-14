"""@fileoverview Исполнение настоящего finally запуска при ошибках освобождения ресурсов."""
import asyncio
import logging
from pathlib import Path
from types import SimpleNamespace as NS
import sys
import textwrap
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'server' / 'python'))
from worker import BotContext, BotWorker

GENERATED = Path(sys.argv.pop()).read_text(encoding='utf-8')
CLEANUP = GENERATED.split('    finally:\n        _bot_stop_event = None', 1)[1].split('\n\nif __name__', 1)[0]
SOURCE = 'async def cleanup():\n    _bot_stop_event = None' + textwrap.indent(textwrap.dedent(CLEANUP), '    ')


def fixture(failure=None, cancelled=False):
    """Создаёт независимые ресурсы бота и выбранный сбой закрытия."""
    calls = []

    def action(name):
        """Возвращает наблюдаемую асинхронную операцию освобождения."""
        async def invoke(*args, **kwargs):
            """Регистрирует вызов и имитирует выбранную ошибку."""
            calls.append(name)
            if name == failure:
                if cancelled:
                    raise asyncio.CancelledError()
                raise OSError('Ошибка тестового ресурса')
            return 1
        return invoke

    def terminate():
        """Регистрирует аварийное освобождение собственного пула."""
        calls.append('terminate')

    namespace = dict(asyncio=asyncio, logging=logging, _background_tasks=[],
                     _webhook_runner=NS(cleanup=action('webhook')),
                     _cancel_schedule_tasks=action('schedule'),
                     _analytics_drain_pending=action('analytics'),
                     db_pool=NS(close=action('database'), terminate=terminate),
                     WEBHOOK_URL='', _redis_connected=True, _lock_acquired=True,
                     _lock_key='lock', _lock_owner='owner', _external_mode=False,
                     PROJECT_ID=12, TOKEN_ID=99, _external_started=True,
                     _redis_client=NS(eval=action('lock'), publish=action('publish'), aclose=action('redis')),
                     dp=NS(emit_shutdown=action('shutdown'), workflow_data={}),
                     bot=NS(session=NS(close=action('http'))),
                     userbot_client=NS(is_connected=lambda: True, disconnect=action('telethon')),
                     _unwrap_message_answer=action('unwrap'),
                     _cleanup_redis_log_handler=action('logs'),
                     _cleanup_media_original=action('media'))
    exec(compile(SOURCE, '<настоящий finally main>', 'exec'), namespace)
    return namespace, calls


class CleanupResources(unittest.IsolatedAsyncioTestCase):
    """Проверяет независимое закрытие ресурсов и сохранение отмены."""
    async def test_failures_do_not_skip_other_resources(self):
        """Ошибка одного этапа не пропускает последующие и не задевает соседнего бота."""
        expected = {'unwrap', 'logs', 'media', 'webhook', 'schedule', 'analytics',
                    'database', 'lock', 'publish', 'shutdown', 'redis', 'http', 'telethon'}
        for failed in ('analytics', 'database', 'redis', 'http', 'shutdown', 'webhook'):
            with self.subTest(failed=failed):
                owner, calls = fixture(failed)
                neighbor, other_calls = fixture()
                await owner['cleanup']()
                self.assertTrue(expected.issubset(calls), (failed, calls))
                self.assertEqual(other_calls, [])
                if failed == 'database':
                    self.assertIn('terminate', calls)
                await neighbor['cleanup']()
                self.assertTrue(expected.issubset(other_calls))

    async def test_cancellation_runs_remaining_cleanup_and_propagates(self):
        """Отмена любого ресурса сохраняется после очистки остальных ресурсов."""
        for failed in ('analytics', 'database', 'redis', 'http'):
            with self.subTest(failed=failed):
                namespace, calls = fixture(failed, cancelled=True)
                with self.assertRaises(asyncio.CancelledError):
                    await namespace['cleanup']()
                for stage in ('redis', 'http', 'telethon'):
                    self.assertIn(stage, calls)

    async def test_non_external_redis_is_closed(self):
        """Redis закрывается и при запуске без внешнего диспетчера."""
        namespace, calls = fixture()
        namespace['_external_started'] = False
        await namespace['cleanup']()
        self.assertIn('redis', calls)
        self.assertIn('http', calls)
        self.assertNotIn('shutdown', calls)

    async def test_pool_timeout_terminates_and_continues(self):
        """Настоящий пятисекундный таймаут отменяет зависшее закрытие пула."""
        namespace, calls = fixture()

        async def stuck():
            """Ожидает отмены и отмечает освобождение корутины."""
            try:
                await asyncio.Event().wait()
            finally:
                calls.append('database_cancelled')

        namespace['db_pool'].close = stuck
        await asyncio.wait_for(namespace['cleanup'](), timeout=8)
        for stage in ('database_cancelled', 'terminate', 'redis', 'http', 'telethon'):
            self.assertIn(stage, calls)

    async def test_external_task_cancel_does_not_interrupt_cleanup(self):
        """Внешняя отмена владельца закрывает остальные ресурсы перед пробросом."""
        namespace, calls = fixture()
        entered = asyncio.Event()

        async def stuck():
            """Сообщает о начале операции и ожидает внешней отмены."""
            entered.set()
            await asyncio.Event().wait()

        namespace['_analytics_drain_pending'] = stuck
        owner = asyncio.create_task(namespace['cleanup']())
        await entered.wait()
        owner.cancel()
        with self.assertRaises(asyncio.CancelledError):
            await owner
        for stage in ('database', 'redis', 'http', 'telethon'):
            self.assertIn(stage, calls)

    async def test_broken_terminate_does_not_skip_other_resources(self):
        """Неисправный аварийный метод пула не блокирует остальные ресурсы."""
        namespace, calls = fixture('database')

        def broken():
            """Имитирует исключение резервного освобождения."""
            raise OSError('Ошибка terminate')

        namespace['db_pool'].terminate = broken
        await namespace['cleanup']()
        for stage in ('redis', 'http', 'telethon'):
            self.assertIn(stage, calls)

    async def test_tail_owner_cancel_still_closes_transports(self):
        """Отмена владельца внутри хвостового gather не отменяет закрытие транспортов."""
        namespace, calls = fixture()
        entered = asyncio.Event()
        closed = set()

        def close(name):
            """Создаёт многотактовое закрытие с наблюдаемым конечным эффектом."""
            async def invoke():
                """Сигнализирует о начале закрытия и завершает ресурс позже."""
                entered.set()
                await asyncio.sleep(0)
                await asyncio.sleep(0)
                closed.add(name)
            return invoke

        namespace['_redis_client'].aclose = close('redis')
        namespace['bot'].session.close = close('http')
        namespace['userbot_client'].disconnect = close('telethon')
        owner = asyncio.create_task(namespace['cleanup']())
        await entered.wait()
        owner.cancel()
        with self.assertRaises(asyncio.CancelledError):
            await owner
        self.assertEqual(closed, {'redis', 'http', 'telethon'})

    async def test_worker_graceful_stop_with_multiple_hangs(self):
        """Настоящий stop воркера укладывается в 15с при нескольких зависших ресурсах."""
        namespace, calls = fixture()
        stopped = asyncio.Event()

        def hanging(name):
            """Создаёт зависшую операцию с наблюдаемой отменой."""
            async def invoke():
                """Ждёт отмены, освобождая корутину в finally."""
                calls.append(name)
                try:
                    await asyncio.Event().wait()
                finally:
                    calls.append(name + '_cancelled')
            return invoke

        namespace['_analytics_drain_pending'] = hanging('analytics')
        namespace['db_pool'].close = hanging('database')
        closed = {'redis': False, 'http': False}

        def real_close(name):
            """Моделирует закрытие транспорта, требующее нескольких шагов цикла событий."""
            async def invoke():
                """Закрывает ресурс только после завершения асинхронных операций."""
                calls.append(name)
                await asyncio.sleep(0)
                await asyncio.sleep(0)
                closed[name] = True
            return invoke

        namespace['_redis_client'].aclose = real_close('redis')
        namespace['bot'].session.close = real_close('http')

        async def lifecycle():
            """Связывает запрос остановки реального воркера с generated finally."""
            await stopped.wait()
            await namespace['cleanup']()

        worker = BotWorker()
        context = BotContext(99, 'cleanup-test', 'unused.py')
        context.module = NS(request_bot_stop=stopped.set)
        context.task = asyncio.create_task(lifecycle())
        worker.bots[99] = context
        neighbor = BotContext(100, 'neighbor', 'unused.py')
        worker.bots[100] = neighbor
        before = asyncio.get_running_loop().time()
        with patch('worker.emit_log') as logs, patch('worker.emit_system') as events:
            await asyncio.wait_for(worker._stop_bot({'token_id': 99}), timeout=14)
        self.assertLess(asyncio.get_running_loop().time() - before, 14)
        self.assertTrue(context.task.done())
        self.assertEqual(context.status, 'stopped')
        self.assertIs(worker.bots[100], neighbor)
        self.assertNotIn(99, worker.bots)
        self.assertFalse(any('orphan' in str(item) or 'timeout 15' in str(item) for item in logs.call_args_list))
        events.assert_any_call('bot_stopped:99')
        await asyncio.sleep(0)
        for stage in ('analytics_cancelled', 'database_cancelled', 'terminate', 'redis', 'http', 'telethon'):
            self.assertIn(stage, calls)
        self.assertEqual(closed, {'redis': True, 'http': True})
        live = [task for task in asyncio.all_tasks() if task is not asyncio.current_task() and not task.done()]
        self.assertEqual(live, [])


unittest.main()
