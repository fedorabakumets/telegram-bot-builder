"""@fileoverview Проверки атомарных ограждений перехода direct на локальном Redis."""

import os
import sys
import types
import unittest
import uuid
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))

from demand_handoff import commit_direct, transfer_direct
from demand_queue import DemandQueue
from demand_state import DemandState


class HandoffFencesTest(unittest.IsolatedAsyncioTestCase):
    """Использует отдельные случайные ключи без обращения к рабочим ботам."""

    async def asyncSetUp(self):
        """Создать снимок и блокировку в собственном пространстве Redis."""
        identifier = uuid.uuid4().int
        self.ctx = types.SimpleNamespace(token=f"{identifier}:{uuid.uuid4().hex}",
            project_id=10, token_id=20, _direct_lease_owner="old-owner",
            env={"REDIS_URL": os.environ.get("DEMAND_TEST_REDIS_URL", "redis://127.0.0.1:6379/0")})
        self.queue = DemandQueue(self.ctx.env["REDIS_URL"], identifier)
        await self.queue.open()
        self.lock = f"bot:lock:{self.ctx.token[-10:]}"
        self.state = DemandState(self.queue, 10, 20)
        self.original = types.SimpleNamespace(user_data={1: "сохранённое"})
        await self.state.save(self.original)
        await self.queue.redis.set(self.lock, "new-owner")
        mocked = patch("demand_handoff.get_base_environ", return_value={})
        mocked.start()
        self.addCleanup(mocked.stop)

    async def asyncTearDown(self):
        """Удалить исключительно случайные ключи текущего теста."""
        await self.queue.redis.delete(*self.queue.keys, self.lock, self.state.key)
        await self.queue.close()

    async def assert_original_snapshot(self):
        """Проверить, что отклонённая операция сохранила прежнее состояние."""
        target = types.SimpleNamespace(user_data={})
        await self.state.load_into(target)
        self.assertEqual(target.user_data, self.original.user_data)

    async def test_stale_transfer_does_not_restore(self):
        """Старый владелец не восстанавливает данные в свой модуль."""
        target = types.SimpleNamespace(user_data={})
        with self.assertRaises(RuntimeError):
            await transfer_direct(self.ctx, target, "old-owner")
        self.assertEqual(target.user_data, {})
        await self.assert_original_snapshot()

    async def test_current_transfer_restores_snapshot(self):
        """Актуальный владелец получает сохранённое состояние без его удаления."""
        target = types.SimpleNamespace(user_data={})
        await transfer_direct(self.ctx, target, "new-owner")
        self.assertEqual(target.user_data, self.original.user_data)
        await self.assert_original_snapshot()

    async def test_commit_rejects_stale_owner_and_pending_queue(self):
        """Lua не удаляет снимок при сменившемся владельце или новой очереди."""
        with self.assertRaises(RuntimeError):
            await commit_direct(self.ctx)
        await self.assert_original_snapshot()
        self.ctx._direct_lease_owner = "new-owner"
        await self.queue.enqueue([{"update_id": 50}])
        with self.assertRaises(RuntimeError):
            await commit_direct(self.ctx)
        await self.assert_original_snapshot()
        self.assertEqual(await self.queue.peek(), {"update_id": 50})

    async def test_commit_clears_only_empty_owned_snapshot(self):
        """Пустая очередь и актуальный владелец разрешают удалить снимок."""
        self.ctx._direct_lease_owner = "new-owner"
        await commit_direct(self.ctx)
        self.assertIsNone(await self.queue.redis.get(self.state.key))
        self.assertEqual(await self.queue.redis.get(self.lock), "new-owner")

    async def test_stale_ack_keeps_pending_and_snapshot(self):
        """Проверка владельца и запись состояния с ACK выполняются неделимо."""
        await self.queue.enqueue([{"update_id": 50}])
        with self.assertRaises(RuntimeError):
            await self.state.save_and_ack(types.SimpleNamespace(user_data={1: "новое"}),
                50, lease_key=self.lock, lease_owner="old-owner")
        self.assertEqual(await self.queue.peek(), {"update_id": 50})
        await self.assert_original_snapshot()


if __name__ == "__main__":
    unittest.main()
