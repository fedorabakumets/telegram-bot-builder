"""@fileoverview Доставляет настоящие события единственного Telethon-клиента через ограниченный журнал."""

import asyncio
import weakref
from collections import deque

from telethon import events
from telethon_broker_admission import BrokerError
from telethon_broker_messages import encode_message

_journals = weakref.WeakKeyDictionary()


class EventJournal:
    """Хранит ограниченный хвост событий и сигнал пробуждения читателей."""

    def __init__(self):
        """Начинает курсор с единицы, оставляя ноль для начального снимка."""
        self.cursor = 1
        self.items = deque(maxlen=256)
        self.condition = asyncio.Condition()
        self.handlers = []


def attach_events(client):
    """Подписывается один раз до первой операции, не создавая новую сессию."""
    if client in _journals:
        return
    journal = _journals[client] = EventJournal()
    if not hasattr(client, "add_event_handler"):
        return

    async def append(event, kind):
        """Сохраняет только DTO сообщения, вид события и идентификатор чата."""
        async with journal.condition:
            journal.cursor += 1
            journal.items.append({"sequence": journal.cursor, "kind": kind,
                                  "chat_id": event.chat_id, "message": encode_message(event.message),
                                  "is_private": bool(getattr(event, "is_private", event.chat_id > 0)),
                                  "is_group": bool(getattr(event, "is_group", False)),
                                  "is_channel": bool(getattr(event, "is_channel", False))})
            journal.condition.notify_all()

    async def incoming(event):
        """Принимает новое сообщение от общего клиента."""
        await append(event, "new")

    async def edited(event):
        """Принимает редактирование сообщения независимо от периодического чтения истории."""
        await append(event, "edited")

    for handler, builder in ((incoming, events.NewMessage()), (edited, events.MessageEdited())):
        client.add_event_handler(handler, builder)
        journal.handlers.append((handler, builder))


def detach_events(client):
    """Снимает подписки только при закрытии владельцем всего общего клиента."""
    journal = _journals.pop(client, None)
    if journal and hasattr(client, "remove_event_handler"):
        for handler, builder in journal.handlers:
            client.remove_event_handler(handler, builder)


async def poll_events(client, args):
    """Ждёт поступления событий в журнале, не опрашивая историю Telegram."""
    targets = args.get("targets", [])
    resolve_targets = args.get("resolve_targets", [])
    after, seconds = args.get("after", 0), args.get("wait_seconds", 20)
    if (not isinstance(targets, list) or not isinstance(resolve_targets, list)
            or len(targets) > 30 or len(resolve_targets) > 30 or type(after) is not int or after < 0
            or type(seconds) not in (int, float) or not 0 <= seconds <= 20):
        raise BrokerError("INVALID_ARGS", "Некорректные параметры подписки")
    if any(not (type(target) is int and target != 0
                or isinstance(target, str) and 0 < len(target) <= 256) for target in targets + resolve_targets):
        raise BrokerError("INVALID_ARGS", "Некорректный чат подписки")
    attach_events(client)
    journal = _journals[client]
    resolved = {str(target): await client.get_peer_id(target) for target in dict.fromkeys(targets + resolve_targets)}
    wanted = {resolved[str(target)] for target in targets}
    deadline = asyncio.get_running_loop().time() + seconds
    async with journal.condition:
        while True:
            if after == 0:
                return {"cursor": journal.cursor, "events": [], "resolved_targets": resolved}
            if after > journal.cursor or journal.items and after < journal.items[0]["sequence"] - 1:
                raise BrokerError("EVENT_CURSOR_EXPIRED", "Журнал событий изменился; требуется новая подписка", 409)
            selected = [item for item in journal.items if item["sequence"] > after
                        and (not wanted or item["chat_id"] in wanted)]
            remaining = deadline - asyncio.get_running_loop().time()
            if selected or journal.cursor > after or remaining <= 0:
                return {"cursor": journal.cursor, "events": selected, "resolved_targets": resolved}
            try:
                await asyncio.wait_for(journal.condition.wait(), remaining)
            except TimeoutError:
                return {"cursor": journal.cursor, "events": [], "resolved_targets": resolved}
