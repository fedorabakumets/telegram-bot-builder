"""@fileoverview Сериализация сообщений и безопасное ожидание ответа Telegram."""

import asyncio
import base64
import weakref
from contextlib import AsyncExitStack, asynccontextmanager

from telethon.tl.types import InlineButtonTypeCallback

from telethon_broker_admission import BrokerError


_chat_locks = weakref.WeakKeyDictionary()


@asynccontextmanager
async def lock_chats(client, *targets):
    """Последовательно выполняет операции в одних чатах, сохраняя параллельность разных чатов."""
    keys = sorted({await client.get_peer_id(target) for target in targets})
    locks = _chat_locks.setdefault(client, weakref.WeakValueDictionary())
    async with AsyncExitStack() as stack:
        for key in keys:
            lock = locks.get(key)
            if lock is None:
                locks[key] = lock = asyncio.Lock()
            await stack.enter_async_context(lock)
        yield


def encode_message(message):
    """Возвращает только поля сообщения, необходимые узлам конструктора."""
    if message is None:
        return None
    buttons = []
    for row in message.buttons or []:
        buttons.append([{
            "text": button.text,
            "data_b64": base64.b64encode(button.data).decode("ascii")
            if isinstance(button.button.type, InlineButtonTypeCallback) else None,
            "url": button.url,
        } for button in row])
    return {
        "id": message.id, "text": message.text or "", "raw_text": message.raw_text or "",
        "sender_id": message.sender_id, "out": bool(message.out), "media": bool(message.media),
        "date": message.date.isoformat() if message.date else None,
        "edit_date": message.edit_date.isoformat() if message.edit_date else None,
        "buttons": buttons,
    }


async def wait_messages(client, target, *, limit, after_id=0, wait_seconds=0):
    """Читает ограниченный список сообщений, при необходимости ожидая новый ответ."""
    deadline = asyncio.get_running_loop().time() + wait_seconds
    while True:
        messages = await client.get_messages(target, limit=limit, min_id=after_id)
        if wait_seconds:
            messages = [message for message in messages if not message.out]
        remaining = deadline - asyncio.get_running_loop().time()
        if messages or remaining <= 0:
            return [encode_message(message) for message in messages]
        await asyncio.sleep(min(1, remaining))


async def send_and_receive(client, target, text, parse_mode, link_preview, response_target, seconds):
    """Отправляет сообщение и ждёт свежий ответ, удерживая чат за одной операцией."""
    async with lock_chats(client, target, response_target):
        same_chat = await client.get_peer_id(target) == await client.get_peer_id(response_target)
        last_id = 0
        if not same_chat and seconds > 0:
            last = await client.get_messages(response_target, limit=1)
            last_id = last[0].id if last else 0
        sent = await client.send_message(target, text, parse_mode=parse_mode, link_preview=link_preview)
        responses = await wait_messages(client, response_target, limit=12,
                                        after_id=sent.id if same_chat else last_id, wait_seconds=seconds) if seconds else []
        return {"id": sent.id, "responses": responses}


async def _wait_edited(client, target, message_id, previous_edit, seconds):
    """Ожидает обновлённую версию того же сообщения."""
    deadline = asyncio.get_running_loop().time() + seconds
    while True:
        message = await client.get_messages(target, ids=message_id)
        if message and message.edit_date != previous_edit:
            return encode_message(message)
        remaining = deadline - asyncio.get_running_loop().time()
        if remaining <= 0:
            return None
        await asyncio.sleep(min(1, remaining))


async def click_callback(client, target, message_id, data, response_mode, seconds):
    """Разрешает нажать только существующую callback-кнопку указанного сообщения."""
    async with lock_chats(client, target):
        message = await client.get_messages(target, ids=message_id)
        for row in (message.buttons or []) if message else []:
            for button in row:
                if isinstance(button.button.type, InlineButtonTypeCallback) and button.data == data:
                    last_id = message_id
                    if seconds and response_mode == "new_message":
                        latest = await client.get_messages(target, limit=1)
                        last_id = latest[0].id if latest else message_id
                    answer = await button.click()
                    response = None
                    if seconds and response_mode == "new_message":
                        responses = await wait_messages(client, target, limit=12, after_id=last_id, wait_seconds=seconds)
                        response = responses[-1] if responses else None
                    if seconds and response_mode == "edited_message":
                        response = await _wait_edited(client, target, message_id, message.edit_date, seconds)
                    return {"message": getattr(answer, "message", None), "response": response}
        raise BrokerError("BUTTON_NOT_FOUND", "Кнопка отсутствует в сообщении", 404)
