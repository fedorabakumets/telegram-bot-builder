"""@fileoverview Адресные проверки выбора режима и ограничения активных ботов."""
import asyncio
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'server/python'))
from demand_settings import resolve_settings, validate_build
from demand_slot import active_slot


class SettingsTests(unittest.TestCase):
    """Проверяет конфигурацию без подключения внешних сервисов."""

    def test_explicit_selection(self):
        """Не выбранный токен остаётся в обычном режиме."""
        with patch.dict(os.environ, {}, clear=True):
            self.assertIsNone(resolve_settings(3, {}, None))
            env = {'BOT_POLLING_MODE':'ondemand', 'BOT_ON_DEMAND_TOKEN_IDS':'1,2', 'REDIS_URL':'redis://localhost'}
            self.assertIsNone(resolve_settings(3, env, None))
            self.assertEqual(resolve_settings(2, env, None)['maximum'], 4)
            with self.assertRaises(ValueError):
                resolve_settings(2, env, 'https://example.test')

    def test_preflight(self):
        """Не импортирует произвольный код при проверке совместимости."""
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / 'bot.py'
            target.write_text('_WORKER_EXTERNAL_UPDATES_PROTOCOL=1\n_WORKER_EXTERNAL_UPDATES_SAFE=True\n_WORKER_EXTERNAL_STATE_PROTOCOL=1\nraise Exception("must not execute")')
            validate_build(target)
            target.write_text('_WORKER_EXTERNAL_UPDATES_PROTOCOL=1\n_WORKER_EXTERNAL_UPDATES_SAFE=False')
            with self.assertRaises(ValueError):
                validate_build(target)


class SlotTests(unittest.IsolatedAsyncioTestCase):
    """Проверяет отмену ожидания без потери слота."""

    async def test_stop_waiting(self):
        """Остановка прерывает ожидание занятого обработчика."""
        semaphore = asyncio.Semaphore(0)
        receiver = asyncio.create_task(asyncio.Event().wait())
        stopping = asyncio.Event()
        stopping.set()
        try:
            async with active_slot(semaphore, receiver, stopping) as acquired:
                self.assertFalse(acquired)
            self.assertEqual(semaphore._value, 0)
        finally:
            receiver.cancel()
            await asyncio.gather(receiver, return_exceptions=True)

    async def test_release(self):
        """Занятый слот возвращается после сеанса."""
        semaphore = asyncio.Semaphore(1)
        receiver = asyncio.create_task(asyncio.Event().wait())
        try:
            async with active_slot(semaphore, receiver, asyncio.Event()) as acquired:
                self.assertTrue(acquired)
                self.assertEqual(semaphore._value, 0)
            self.assertEqual(semaphore._value, 1)
        finally:
            receiver.cancel()
            await asyncio.gather(receiver, return_exceptions=True)


if __name__ == '__main__':
    unittest.main()
