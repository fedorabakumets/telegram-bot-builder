"""@fileoverview Проверки допуска перехода в direct без потери сохранённой очереди."""

import sys
import types
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parent))

from demand_handoff import prepare_direct


class DirectPreflightTests(unittest.IsolatedAsyncioTestCase):
    """Проверяет ранний допуск без Redis, Telegram и исполнения сценария."""

    def setUp(self):
        """Создать очередь и настройки только для текущего теста."""
        self.owner = False
        self.has_state = False
        self.ctx = types.SimpleNamespace(env={"REDIS_URL": "redis://test"},
            token="123456:example-token", project_id=12, token_id=8, bot_file="unused.py")
        self.queue = types.SimpleNamespace(open=AsyncMock(), close=AsyncMock(),
            peek=AsyncMock(return_value=None), keys=["tbb:demand:{123456}:pending"],
            redis=types.SimpleNamespace(exists=AsyncMock(side_effect=self.exists)))
        self.markers = {"_WORKER_DIRECT_STATE_PROTOCOL": True,
            "_WORKER_DIRECT_DRAIN_PROTOCOL": True,
            "_WORKER_EXTERNAL_UPDATES_PROTOCOL": True,
            "_WORKER_EXTERNAL_UPDATES_SAFE": True,
            "_WORKER_EXTERNAL_STATE_PROTOCOL": True}
        for mocked in (patch("demand_handoff.get_base_environ", return_value={}),
                       patch("demand_queue.DemandQueue", return_value=self.queue),
                       patch("demand_settings.build_markers", return_value=self.markers)):
            mocked.start()
            self.addCleanup(mocked.stop)

    async def exists(self, key):
        """Разделить чужую блокировку polling и сохранённое состояние."""
        return self.owner if key.startswith("bot:lock:") else self.has_state

    async def test_backlog_allowed_for_compatible_direct_build(self):
        """Непустая очередь не блокирует сборку с безопасным переносом обновлений."""
        self.queue.peek.return_value = {"update_id": 101}
        await prepare_direct(self.ctx)
        self.queue.close.assert_awaited_once()

    async def test_active_polling_owner_rejected(self):
        """Чужой владелец запрещает перенос даже при совместимой сборке."""
        self.owner = True
        with self.assertRaises(ValueError):
            await prepare_direct(self.ctx)
        self.queue.close.assert_awaited_once()

    async def test_backlog_requires_drain_protocol(self):
        """Старая сборка не допускается к очереди без отдельного протокола переноса."""
        self.queue.peek.return_value = {"update_id": 101}
        self.markers["_WORKER_DIRECT_DRAIN_PROTOCOL"] = False
        with self.assertRaises(ValueError):
            await prepare_direct(self.ctx)

    async def test_webhook_backlog_is_rejected(self):
        """Перенос не разрешается параллельно с доставкой через webhook."""
        self.queue.peek.return_value = {"update_id": 101}
        self.ctx.webhook_url = "https://example.test/hook"
        with self.assertRaises(ValueError):
            await prepare_direct(self.ctx)

    async def test_state_requires_restore_protocol(self):
        """Старый bot.py не может молча потерять сохранённое состояние."""
        self.has_state = True
        self.markers["_WORKER_DIRECT_STATE_PROTOCOL"] = False
        with self.assertRaises(ValueError):
            await prepare_direct(self.ctx)
        self.queue.close.assert_awaited_once()

    async def test_queue_unavailable_fails_closed(self):
        """Ошибка Redis запрещает запуск и закрывает соединение."""
        self.queue.open.side_effect = OSError("Redis недоступен")
        with self.assertRaisesRegex(ValueError, "Невозможно проверить"):
            await prepare_direct(self.ctx)
        self.queue.close.assert_awaited_once()

    async def test_no_redis_does_not_open_queue(self):
        """Обычный запуск без настроенного Redis не создаёт фиктивную очередь."""
        self.ctx.env = {}
        await prepare_direct(self.ctx)
        self.queue.open.assert_not_awaited()


if __name__ == "__main__":
    unittest.main()
