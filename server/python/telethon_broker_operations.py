"""@fileoverview Явно разрешённые операции общего клиента Telethon."""

import base64
import binascii
import math

from telethon_broker_clients import BrokerError
from telethon_broker_events import poll_events
from telethon_broker_messages import click_callback, encode_message, lock_chats, send_and_receive, wait_messages


def _invalid():
    """Возвращает ошибку с безопасным текстом для недопустимых аргументов."""
    return BrokerError("INVALID_ARGS", "Некорректные параметры операции")


def _text(value, limit, empty=False):
    """Проверяет границы строкового аргумента."""
    if not isinstance(value, str) or len(value) > limit or (not empty and not value):
        raise _invalid()
    return value


def _integer(value, minimum, maximum):
    """Проверяет целое значение, исключая неявное преобразование флагов."""
    if type(value) is not int or not minimum <= value <= maximum:
        raise _invalid()
    return value


def _target(value):
    """Принимает короткое имя чата или числовой идентификатор Telegram."""
    return _integer(value, -(2**63), 2**63 - 1) if type(value) is int else _text(value, 256)


def _seconds(args):
    """Проверяет продолжительность ожидания ответа."""
    value = args.get("wait_seconds", 0)
    if type(value) not in (int, float) or not 0 <= value <= 25 or not math.isfinite(value):
        raise _invalid()
    return value


async def _send(client, args):
    """Выполняет отправку текста и опциональное ожидание ответа."""
    mode, preview = args.get("parse_mode"), args.get("link_preview", True)
    if mode not in (None, "html", "md", "markdown") or not isinstance(preview, bool):
        raise _invalid()
    target = _target(args.get("target"))
    return await send_and_receive(
        client, target, _text(args.get("text"), 4096), mode, preview,
        _target(args.get("response_target", target)), _seconds(args),
    )


async def _get_messages(client, args):
    """Читает заданное сообщение или ограниченную выборку."""
    target = _target(args.get("target"))
    if args.get("ids") is not None:
        return encode_message(await client.get_messages(target, ids=_integer(args["ids"], 1, 2**31 - 1)))
    return await wait_messages(
        client, target, limit=_integer(args.get("limit", 12), 1, 30),
        after_id=_integer(args.get("after_id", 0), 0, 2**31 - 1),
        wait_seconds=_seconds(args),
    )


async def _click(client, args):
    """Проверяет кодировку кнопки и вызывает её в выбранном сообщении."""
    try:
        data = base64.b64decode(_text(args.get("data_b64"), 88), validate=True)
    except (ValueError, binascii.Error):
        raise _invalid() from None
    response_mode = args.get("response_mode", "new_message")
    if not 1 <= len(data) <= 64 or response_mode not in ("new_message", "edited_message"):
        raise _invalid()
    return await click_callback(
        client, _target(args.get("target")), _integer(args.get("message_id"), 1, 2**31 - 1), data,
        response_mode, _seconds(args),
    )


async def _inline_send(client, args):
    """Отправляет один выбранный результат inline-запроса."""
    bot, query, target = _target(args.get("bot")), _text(args.get("query"), 256, empty=True), _target(args.get("target"))
    index = _integer(args.get("index", 0), 0, 1000)
    async with lock_chats(client, target):
        results = await client.inline_query(bot, query)
        if index >= len(results):
            raise BrokerError("INLINE_NOT_FOUND", "Результат inline-запроса отсутствует", 404)
        result = results[index]
        message = await result.click(entity=target)
    return {"id": message.id, "title": result.title, "description": result.description}


async def _get_me(client, _args):
    """Возвращает идентификатор активного пользователя."""
    profile = await client.get_me()
    return {"id": profile.id}


async def _inline_query(client, args):
    """Возвращает ограниченные текстовые сведения без выбора и отправки inline-результата."""
    results = await client.inline_query(_target(args.get("bot")), _text(args.get("query"), 256, empty=True))
    return [{"title": item.title or "", "description": item.description or ""} for item in results[:30]]


async def _status(client, _args):
    """Проверяет авторизацию существующего подключения."""
    return {"authorized": await client.is_user_authorized()}


OPERATIONS = {
    "events_poll": poll_events,
    "status": _status, "send_message": _send, "get_me": _get_me,
    "get_messages": _get_messages, "click_button": _click, "inline_send": _inline_send, "inline_query": _inline_query,
}
