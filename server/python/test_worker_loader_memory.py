"""@fileoverview Проверка освобождения временных ссылок загрузчика до работы бота."""

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from worker import BotContext, BotWorker
import worker_isolation as iso


class WorkerLoaderMemoryTest(unittest.IsolatedAsyncioTestCase):
    """Проверяет реальный воркер и сохранение окружения после очистки загрузчика."""

    async def test_loader_releases_temporary_references(self):
        """Работающий main не удерживает корневой code и карту sibling-модулей."""
        source = '''
import inspect
_WORKER_READY_PROTOCOL = True
async def main():
    frame = inspect.currentframe().f_back
    assert frame.f_code.co_name == "_run_bot"
    assert "compiled" not in frame.f_locals
    assert frame.f_locals["loaded"] == {}
    assert frame.f_locals["smod"] is None
    assert TOKEN_ID == 19
    _worker_bot_ready()
    print("loader_released")
'''
        with tempfile.TemporaryDirectory() as directory:
            bot = Path(directory) / 'bot.py'
            bot.write_text(source, encoding='utf-8')
            context = BotContext(19, 'test', str(bot))
            context.env = {}
            # Компиляция здесь подменена: тест проверяет срок жизни ссылок, а не subprocess.
            code = compile(source, str(bot), 'exec')
            with patch('worker.bot_code_cache.load_bot_code', return_value=code), \
                    patch('worker.lazy_aiogram.enable'), patch('worker.emit_log') as log, \
                    patch('worker.emit_system') as emit:
                await BotWorker()._run_bot(context)
            self.assertEqual(context.status, 'stopped')
            emit.assert_any_call('bot_started:19')
            self.assertTrue(any('loader_released' in str(call) for call in log.call_args_list))

    def test_sibling_uses_isolated_loader_and_preserves_metadata(self):
        """Sibling получает прежний namespace, но код берёт через общий загрузчик."""
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'config.py'
            path.write_text('VALUE = 42\n', encoding='utf-8')
            code = compile('VALUE = 42\n', str(path), 'exec')
            try:
                with patch('worker_isolation.bot_code_cache.load_bot_code', return_value=code) as loader:
                    module = iso.load_sibling_modules(91, path.parent, ['config'])['config']
                loader.assert_called_once_with(path, iso._ignore_loader_log)
                self.assertEqual(module.VALUE, 42)
                self.assertEqual(module.__name__, 'bot_91_config')
                self.assertEqual(module.__file__, str(path))
                self.assertEqual(module.__spec__.name, 'bot_91_config')
            finally:
                iso.cleanup_bot_modules(91)


if __name__ == '__main__':
    unittest.main()
