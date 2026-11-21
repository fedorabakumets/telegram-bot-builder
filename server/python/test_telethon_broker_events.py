"""@fileoverview Проверяет доставку реальных видов событий через журнал без сети Telegram."""
import asyncio
import unittest
from types import SimpleNamespace

from telethon_broker_admission import BrokerError
from telethon_broker_events import attach_events, detach_events, poll_events


class EventClient:
    """Имитирует только регистрацию подписок и разрешение идентификатора чата."""

    def __init__(self):
        """Хранит пары подписки для ручного испускания событий."""
        self.handlers = []

    def add_event_handler(self, callback, builder):
        """Запоминает реальный builder, не создавая Telethon-сессию."""
        self.handlers.append((callback, builder))

    def remove_event_handler(self, callback, builder):
        """Удаляет ровно заданную пару обработчика и фильтра."""
        self.handlers.remove((callback, builder))

    async def get_peer_id(self, target):
        """Разрешает единственное вымышленное имя, остальные ID не меняет."""
        return 7 if target == '@synthetic' else target

    async def emit(self, edited=False, chat=7):
        """Испускает новое сообщение или редактирование, как callback библиотеки."""
        message = SimpleNamespace(id=1, text='Ответ', raw_text='Ответ', sender_id=42,
                                  out=False, media=None, date=None, edit_date=None, buttons=[])
        await self.handlers[1 if edited else 0][0](SimpleNamespace(chat_id=chat, message=message))


class BrokerEventsTest(unittest.IsolatedAsyncioTestCase):
    """Проверяет порядок подписки, фильтрацию и явное переполнение bounded-журнала."""

    async def test_new_and_edited_wake_two_consumers(self):
        """Два читателя получают один и тот же новый ответ без второго подключения."""
        client = EventClient()
        attach_events(client)
        baseline = await poll_events(client, {'targets': ['@synthetic'], 'after': 0})
        args = {'targets': ['@synthetic'], 'after': baseline['cursor'], 'wait_seconds': 1}
        first, second = asyncio.create_task(poll_events(client, args)), asyncio.create_task(poll_events(client, args))
        await client.emit()
        one, two = await asyncio.gather(first, second)
        self.assertEqual(one, two)
        self.assertEqual(one['events'][0]['kind'], 'new')
        await client.emit(edited=True)
        edit = await poll_events(client, {**args, 'after': one['cursor']})
        self.assertEqual(edit['events'][0]['kind'], 'edited')
        filtered = await poll_events(client, {**args, 'targets': [8], 'wait_seconds': 0})
        self.assertEqual(filtered['events'], [])
        detach_events(client)
        self.assertEqual(client.handlers, [])

    async def test_overflow_is_explicit(self):
        """Не подменяет потерянные события молчаливым обновлением курсора."""
        client = EventClient()
        attach_events(client)
        for _ in range(257):
            await client.emit()
        with self.assertRaises(BrokerError) as caught:
            await poll_events(client, {'targets': [7], 'after': 1, 'wait_seconds': 0})
        self.assertEqual(caught.exception.code, 'EVENT_CURSOR_EXPIRED')
        detach_events(client)
