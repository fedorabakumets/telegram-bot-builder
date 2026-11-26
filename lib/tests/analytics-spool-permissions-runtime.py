"""@fileoverview Регрессии безопасной диагностики и повторов недоступной очереди аналитики."""
import asyncio
import errno
import json
import logging
import os
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace as NS
import unittest
from unittest.mock import patch

GENERATED = Path(sys.argv.pop()).read_text(encoding='utf-8')


class SpoolPermissionsTests(unittest.IsolatedAsyncioTestCase):
    """Проверяет настоящий код очереди без ожидания таймеров, PostgreSQL и Telegram."""
    async def asyncSetUp(self):
        """Создаёт независимый runtime и доступный каталог только для этого теста."""
        self.directory = tempfile.TemporaryDirectory()
        self.runtime = {'PROJECT_ID': 12, 'TOKEN_ID': 3, 'json': json, 'asyncio': asyncio,
                        'logging': logging, 'os': os, 'types': NS(Message=object, CallbackQuery=object),
                        'BaseMiddleware': object}
        exec(compile(GENERATED, '<generated>', 'exec'), self.runtime)
        self.runtime['db_pool'] = object()
        self.runtime['_analytics_spool_directory'] = lambda: Path(self.directory.name)

    async def asyncTearDown(self):
        """Удаляет только временный каталог проверки."""
        self.directory.cleanup()

    async def run_worker(self, flush, count):
        """Исполняет заданное число циклов, затем проверяемо отменяет воркер на ожидании."""
        delays = []

        async def sleep(delay):
            """Записывает задержку без настоящего ожидания и завершает последний цикл отменой."""
            delays.append(delay)
            if len(delays) >= count:
                raise asyncio.CancelledError()

        self.runtime['asyncio'] = NS(wait_for=asyncio.wait_for, sleep=sleep, TimeoutError=asyncio.TimeoutError)
        self.runtime['_analytics_spool_flush'] = flush
        with self.assertRaises(asyncio.CancelledError):
            await self.runtime['_analytics_spool_worker']()
        return delays

    async def test_permission_diagnostic_keeps_operation_and_errno_without_exception_text(self):
        """Реальный отказ mkdir показывает этап и errno, но не секретный текст исключения."""
        secret = 'SECRET_TOKEN_PAYLOAD_DO_NOT_LOG'

        async def flush(force=False):
            """Вызывает настоящий путь создания SQLite, где возникает отказ файловой системы."""
            return self.runtime['_analytics_spool_connection']()

        with patch.object(Path, 'mkdir', side_effect=PermissionError(errno.EACCES, secret)):
            with self.assertLogs(level='ERROR') as output:
                await self.run_worker(flush, 1)
        rendered = '\n'.join(output.output)
        self.assertIn('PermissionError', rendered)
        self.assertIn('mkdir', rendered)
        self.assertIn(str(Path(self.directory.name)), rendered.replace('\\\\', '\\'))
        self.assertIn(str(errno.EACCES), rendered)
        self.assertNotIn(secret, rendered)

    async def test_diagnostic_path_redacts_environment_secrets_and_escapes_newlines(self):
        """Путь не раскрывает токен окружения, Telegram-токен и не добавляет строку журнала."""
        secret = 'PRIVATE_ENV_SECRET_12345'
        telegram_token = '123456789:abcdefghijklmnopqrstuvwxyz123456'
        failure = PermissionError(errno.EACCES, 'текст не должен попасть в журнал')
        annotate = self.runtime['_analytics_spool_error']
        annotate(failure, 'mkdir', f'/queue/{secret}/{telegram_token}/line\nbreak')
        with patch.dict(os.environ, {'TEST_ANALYTICS_SECRET': secret}):
            operation, safe_path, number = self.runtime['_analytics_spool_diagnostics'](failure)
        self.assertEqual((operation, number), ('mkdir', errno.EACCES))
        self.assertNotIn(secret, safe_path)
        self.assertNotIn(telegram_token, safe_path)
        self.assertNotIn('\n', safe_path)
        self.assertIn('\\n', safe_path)

    async def test_filesystem_failures_back_off_with_cap_and_reset_after_recovery(self):
        """Продолжительный отказ ограничивает частоту; успешная доставка сбрасывает задержку."""
        outcomes = iter([PermissionError(errno.EACCES, 'закрыто')] * 11
                        + [None, PermissionError(errno.EACCES, 'снова закрыто')])

        async def flush(force=False):
            """Чередует недоступность диска, успешную доставку и новый независимый сбой."""
            outcome = next(outcomes)
            if outcome is not None:
                raise outcome
            return 0

        with self.assertLogs(level='ERROR'):
            delays = await self.run_worker(flush, 13)
        self.assertEqual(delays, [2, 4, 8, 16, 32, 64, 128, 256, 300, 300, 300, 2, 2])

    async def test_cancellation_is_not_logged_or_retried(self):
        """Остановка во время доставки немедленно выходит без ещё одного ожидания и ошибки."""
        sleeps = []

        async def flush(force=False):
            """Имитирует отмену задачи внутри доставки очереди."""
            raise asyncio.CancelledError()

        async def sleep(delay):
            """Фиксирует ошибочный дополнительный повтор после отмены."""
            sleeps.append(delay)

        self.runtime['asyncio'] = NS(wait_for=asyncio.wait_for, sleep=sleep, TimeoutError=asyncio.TimeoutError)
        self.runtime['_analytics_spool_flush'] = flush
        with patch.object(logging, 'error') as error_log:
            with self.assertRaises(asyncio.CancelledError):
                await self.runtime['_analytics_spool_worker']()
        self.assertEqual(sleeps, [])
        error_log.assert_not_called()

    async def test_unavailable_home_reports_stage_and_backs_off(self):
        """Отсутствие домашнего каталога диагностируется без утечки текста и частых повторов."""
        runtime_path = self.runtime['_analytics_spool_directory']
        # Возвращаем настоящий вычислитель пути вместо временного каталога из setUp.
        namespace = dict(self.runtime)
        exec(compile(GENERATED, '<generated>', 'exec'), namespace)
        self.runtime['_analytics_spool_directory'] = namespace['_analytics_spool_directory']

        async def flush(force=False):
            """Воспроизводит ошибку вычисления домашнего каталога до открытия SQLite."""
            return self.runtime['_analytics_spool_directory']()

        with patch.dict(os.environ):
            os.environ.pop('ANALYTICS_SPOOL_DIR', None)
            with patch.object(Path, 'home', side_effect=RuntimeError('SECRET_HOME_DETAILS')):
                with self.assertLogs(level='ERROR') as output:
                    delays = await self.run_worker(flush, 2)
        self.assertEqual(delays, [2, 4])
        self.assertIn('home', '\n'.join(output.output))
        self.assertNotIn('SECRET_HOME_DETAILS', '\n'.join(output.output))
        self.runtime['_analytics_spool_directory'] = runtime_path


if __name__ == '__main__':
    unittest.main()
