"""@fileoverview Проверки совместного размещения и независимой остановки сценариев."""

import asyncio
import sys
import unittest
from unittest.mock import AsyncMock, Mock, patch

from unified_sessions import UnifiedProtocol, UnifiedSessions


class UnifiedSessionsTests(unittest.IsolatedAsyncioTestCase):
    """Проверяет границы реестра без Telegram, Redis и пользовательских секретов."""

    def setUp(self):
        """Создаёт независимый постоянный воркер и протокол на каждый тест."""
        self.worker = Mock(bots={1: Mock()})
        self.worker.handle_command = AsyncMock()
        self.worker._shutdown = AsyncMock()
        self.protocol = Mock(active={}, timing={})
        self.registry = UnifiedSessions(self.worker, self.protocol)

    async def test_permanent_commands_remain_native(self):
        """Постоянный бот сохраняет штатные поля запуска и независимую остановку."""
        command = {"cmd": "start_bot", "token_id": 2, "env": {}}
        await self.registry.command(command)
        self.worker.handle_command.assert_awaited_once_with(command)

    async def test_external_cannot_duplicate_permanent(self):
        """Один токен нельзя одновременно зарегистрировать в обоих режимах."""
        with patch("unified_sessions.SharedSession") as session:
            await self.registry.command({"cmd": "start", "token_id": 1})
        session.assert_not_called()
        self.protocol.event.assert_called_once_with("error", 1, reason="already_active")

    async def test_stale_stop_does_not_stop_current_activation(self):
        """Запоздалая остановка не затрагивает новое пробуждение сценария."""
        session = Mock(stop=AsyncMock())
        self.registry.sessions[2] = session
        self.protocol.active[2] = "current"
        await self.registry.command({"cmd": "stop", "token_id": 2, "activation_id": "old"})
        session.stop.assert_not_awaited()

    async def test_external_exit_releases_only_own_references(self):
        """После завершения временного бота постоянные контексты остаются доступны."""
        session = Mock(run=AsyncMock())
        self.registry.sessions[2] = session
        self.protocol.active[2] = "activation"
        self.protocol.timing[2] = (1, 2)
        await self.registry.execute(2, session)
        self.assertEqual(set(self.registry.contexts()), {1})
        self.assertEqual(self.protocol.active, {})
        self.assertEqual(self.protocol.timing, {})

    async def test_stop_waits_for_own_task(self):
        """Остановка ожидает освобождения временной задачи и не останавливает постоянный бот."""
        session = Mock(stop=AsyncMock())
        self.registry.sessions[2] = session
        self.registry.tasks[2] = asyncio.create_task(asyncio.sleep(0))
        self.protocol.active[2] = "current"
        await self.registry.command({"cmd": "stop", "token_id": 2, "activation_id": "current"})
        session.stop.assert_awaited_once()
        self.worker.handle_command.assert_not_awaited()

    async def test_protocol_preserves_permanent_lifecycle(self):
        """Глобальная маршрутизация не теряет запуск, ошибку и остановку постоянного бота."""
        import worker
        import process_startup_timing
        protocol = UnifiedProtocol()
        protocol.active[2] = "external"
        with patch.object(worker, "emit_system") as system, \
                patch.object(worker, "emit_log"), \
                patch.object(process_startup_timing, "mark"), \
                patch.object(sys, "stderr"), patch.object(protocol, "event") as event:
            protocol.install()
            worker.emit_system("bot_started:1")
            worker.emit_system("bot_exited:1:error")
            worker.emit_system("bot_stopped:1")
            worker.emit_system("bot_started:2")
            self.assertEqual([call.args[0] for call in system.call_args_list],
                             ["bot_started:1", "bot_exited:1:error", "bot_stopped:1"])
            event.assert_called_once_with("ready", 2)


if __name__ == "__main__":
    unittest.main()
