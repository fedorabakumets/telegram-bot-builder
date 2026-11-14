"""@fileoverview Регрессии очистки регистраций при сне, ошибке и выгрузке сценария."""

import asyncio
import tempfile
import types
import unittest
from pathlib import Path
from unittest.mock import patch

from worker import BotContext, BotWorker
from worker_unload_hooks import cleanup_module_hooks


class WorkerUnloadHooksTest(unittest.IsolatedAsyncioTestCase):
    """Проверяет независимость очисток и реальный аварийный путь загрузчика."""

    async def test_hooks_continue_after_failure_and_do_not_touch_neighbor(self):
        """Ошибка одной очистки не оставляет другие регистрации соседнего сценария."""
        calls, errors = [], []
        neighbor = types.SimpleNamespace(registered=True)

        def broken():
            """Моделирует неисправную регистрацию одного бота."""
            calls.append('message')
            raise RuntimeError('failure')

        async def redis():
            """Моделирует асинхронную очистку публикаций."""
            calls.append('redis')

        module = types.SimpleNamespace(_unwrap_message_answer=broken,
            _cleanup_redis_log_handler=redis,
            _cleanup_media_original=lambda: calls.append('media'))
        await cleanup_module_hooks(module, errors.append)
        self.assertEqual(calls, ['message', 'redis', 'media'])
        self.assertEqual(len(errors), 1)
        self.assertTrue(neighbor.registered)

    async def test_worker_cleans_failed_exec_and_finished_main(self):
        """Воркер снимает регистрации даже до присвоения ctx.module при сбое exec."""
        for failure in ('raise RuntimeError("startup")', 'async def main():\n    return'):
            with self.subTest(failure=failure), tempfile.TemporaryDirectory() as directory:
                path = Path(directory) / 'bot.py'
                source = ('import builtins\n'
                    'def _unwrap_message_answer():\n    builtins._unload_probe.append("cleaned")\n'
                    + failure + '\n')
                path.write_text(source, encoding='utf-8')
                context = BotContext(391, 'test', str(path))
                context.env = {}
                calls = []
                with patch('builtins._unload_probe', calls, create=True), \
                        patch('worker.bot_code_cache.load_bot_code', return_value=compile(source, str(path), 'exec')), \
                        patch('worker.lazy_aiogram.enable'), patch('worker.emit_log'), patch('worker.emit_system'):
                    await BotWorker()._run_bot(context)
                self.assertEqual(calls, ['cleaned'])
                self.assertIsNone(context.module)

    async def test_cancelled_worker_cleans_hooks(self):
        """Отмена активного обработчика завершает его регистрацию до выгрузки."""
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'bot.py'
            source = ('import asyncio, builtins\n'
                'def _unwrap_message_answer():\n    builtins._unload_probe.append("cleaned")\n'
                'async def main():\n    builtins._unload_ready.set()\n    await asyncio.Event().wait()\n')
            path.write_text(source, encoding='utf-8')
            context = BotContext(392, 'test', str(path))
            context.env = {}
            calls, ready = [], asyncio.Event()
            with patch('builtins._unload_probe', calls, create=True), \
                    patch('builtins._unload_ready', ready, create=True), \
                    patch('worker.bot_code_cache.load_bot_code', return_value=compile(source, str(path), 'exec')), \
                    patch('worker.lazy_aiogram.enable'), patch('worker.emit_log'), patch('worker.emit_system'):
                task = asyncio.create_task(BotWorker()._run_bot(context))
                await asyncio.wait_for(ready.wait(), 2)
                task.cancel()
                await asyncio.wait_for(task, 2)
            self.assertEqual(calls, ['cleaned'])
            self.assertEqual(context.status, 'stopped')
            self.assertIsNone(context.module)


if __name__ == '__main__':
    unittest.main()
