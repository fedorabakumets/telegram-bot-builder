"""@fileoverview Проверяет доставку новых и изменённых событий двум общим раннерам."""
import asyncio
import os

from telethon import events


async def verify_events(first, second, http, headers):
    """Проверяет доставку, фильтры, снятие подписки и отключение одного потребителя."""
    received = {key: [] for key in ("first-new", "first-edited", "second-new", "second-edited")}
    changed = asyncio.Event()

    def handler(key):
        """Создаёт асинхронную подписку с наблюдаемым результатом."""
        async def capture(event):
            """Сохраняет событие после прохождения фильтров bridge."""
            received[key].append((event.chat_id, event.message.text))
            changed.set()
        return capture

    first_new, first_edited = handler("first-new"), handler("first-edited")
    second_new, second_edited = handler("second-new"), handler("second-edited")
    first.add_event_handler(first_new, events.NewMessage(chats=[7]))
    first.add_event_handler(first_edited, events.MessageEdited(chats=[7]))
    second.add_event_handler(second_new, events.NewMessage(chats=[7]))
    second.add_event_handler(second_edited, events.MessageEdited(chats=[7]))
    await second.ensure_event_subscription()

    async def wait_counts(expected):
        """Ожидает конкретную доставку без фиксированных задержек."""
        async def ready():
            """Просыпается после изменения наблюдаемого набора событий."""
            while [len(received[key]) for key in received] != expected:
                changed.clear()
                await changed.wait()
        await asyncio.wait_for(ready(), timeout=5)

    async def emit(kind, chat_id, text):
        """Вводит событие исключительно через тестовую имитацию Telegram."""
        async with http.post(os.environ["CHAIN_BROKER"] + "/test/emit", headers=headers,
                             json={"kind": kind, "chat_id": chat_id, "text": text}) as response:
            assert response.status == 200, await response.text()

    # Первый bridge обязан установить исходный курсор до отправки сообщения.
    await first.send_message(7, "Событие при отправке")
    await wait_counts([1, 0, 1, 0])
    await emit("new", 8, "Чужой чат")
    await emit("edited", 7, "Исправлено")
    await wait_counts([1, 1, 1, 1])
    first.remove_event_handler(first_new)
    await emit("new", 7, "После снятия подписки")
    await wait_counts([1, 1, 2, 1])
    await first.disconnect()
    await emit("edited", 7, "После остановки первого")
    await wait_counts([1, 1, 2, 2])
    assert all(chat_id == 7 for values in received.values() for chat_id, _text in values)
    second.remove_event_handler(second_new)
    second.remove_event_handler(second_edited)
