"""@fileoverview Проверки восстановления форм и атомарного подтверждения состояния бота."""

import os
import sys
import types
import unittest
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from demand_queue import DemandQueue
from demand_state import DemandState, StateSerializationError
from demand_state_codec import decode_state, encode_state


class DemandStateCodecTest(unittest.TestCase):
    """Проверяет типы ключей и явный отказ для непереносимых значений."""

    def test_integer_keys_and_form_restore(self):
        """Сохраняет идентификаторы пользователей, ожидание ввода и незавершённую форму."""
        data = {123: {"waiting_for_input": "node_1", "form_session": {
            "step": 2, "answers": ["Имя", 42, None, True], "fields": {1: "Телефон"}}},
                "123": {"counter": 1.5}, -99: {}}
        self.assertEqual(decode_state(encode_state(data, 4096), 4096), data)

    def test_unsupported_and_overflow(self):
        """Не скрывает объекты, циклы, NaN и превышение размера снимка."""
        cyclic = {}
        cyclic[1] = cyclic
        for data in ({1: object()}, {1: b"secret"}, {1: float("nan")}, cyclic,
                     {1: "Я" * 1000}):
            with self.subTest(kind=type(data[1]).__name__):
                with self.assertRaises(StateSerializationError):
                    encode_state(data, 100)

    def test_corruption_is_explicit(self):
        """Повреждённый снимок не превращается молча в пустое состояние."""
        for payload in ('{}', '["d",[[1,2],[1,3]]]', 'not json', '["l",[]]'):
            with self.assertRaises(StateSerializationError):
                decode_state(payload, 1000)


class DemandStateRedisTest(unittest.IsolatedAsyncioTestCase):
    """Использует изолированный набор ключей настоящего локального Redis."""

    async def asyncSetUp(self):
        """Создаёт очередь и две отдельные записи состояния одного Telegram-бота."""
        self.queue = DemandQueue(os.environ.get("DEMAND_TEST_REDIS_URL",
                                               "redis://127.0.0.1:6379/0"), uuid.uuid4().int)
        await self.queue.open()
        self.state = DemandState(self.queue, 10, 20)
        self.other = DemandState(self.queue, 11, 20)

    async def asyncTearDown(self):
        """Удаляет только созданные текущим тестом ключи."""
        await self.queue.redis.delete(*self.queue.keys, self.state.key, self.other.key)
        await self.queue.close()

    async def test_save_restore_isolated_and_clear(self):
        """Состояние переживает новый модуль и не смешивается между проектами."""
        source = types.SimpleNamespace(user_data={123: {"waiting_for_input": "phone"}})
        await self.state.save(source)
        target = types.SimpleNamespace(user_data={})
        reference = target.user_data
        await self.state.load_into(target)
        self.assertIs(reference, target.user_data)
        self.assertEqual(target.user_data, source.user_data)
        other = types.SimpleNamespace(user_data={})
        await self.other.load_into(other)
        self.assertEqual(other.user_data, {})
        await self.state.clear()
        self.assertIsNone(await self.queue.redis.get(self.state.key))

    async def test_atomic_state_and_ack(self):
        """Подтверждённое обновление всегда сопровождается сохранённым состоянием."""
        await self.queue.enqueue([{"update_id": 1}])
        source = types.SimpleNamespace(user_data={123: {"form_session": {"step": 2}}})
        await self.state.save_and_ack(source, 1)
        self.assertIsNone(await self.queue.peek())
        target = types.SimpleNamespace(user_data={})
        await self.state.load_into(target)
        self.assertEqual(target.user_data, source.user_data)

    async def test_invalid_state_does_not_ack_or_replace_snapshot(self):
        """При ошибке исходная очередь и предыдущий снимок остаются нетронутыми."""
        good = types.SimpleNamespace(user_data={123: "original"})
        await self.state.save(good)
        await self.queue.enqueue([{"update_id": 1}])
        with self.assertRaises(StateSerializationError):
            await self.state.save_and_ack(types.SimpleNamespace(user_data={123: object()}), 1)
        self.assertEqual((await self.queue.peek())["update_id"], 1)
        target = types.SimpleNamespace(user_data={})
        await self.state.load_into(target)
        self.assertEqual(target.user_data, good.user_data)


if __name__ == "__main__":
    unittest.main()
