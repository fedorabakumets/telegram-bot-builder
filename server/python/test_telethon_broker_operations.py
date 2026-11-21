"""@fileoverview Проверки ограниченных операций и последовательности запросов в чате."""

import asyncio
import base64
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock

from telethon import Button
from telethon.tl.custom.messagebutton import MessageButton

from telethon_broker_clients import BrokerError
from telethon_broker_operations import OPERATIONS
from telethon_broker_messages import encode_message


def message(value, *, buttons=None):
    """Создаёт сообщение для теста сериализации."""
    return SimpleNamespace(id=value, text="Ответ", raw_text="Ответ", sender_id=34,
                           out=False, media=None, date=None, edit_date=None, buttons=buttons)


class ScriptedClient:
    """Имитирует один Telegram-чат с управляемым моментом ответа."""

    def __init__(self):
        """Готовит сценарий синхронизации двух отправителей."""
        self.waiting = asyncio.Event()
        self.release = asyncio.Event()
        self.sent = []

    async def get_peer_id(self, _target):
        """Имитирует одинаковый чат при обращении по имени и числовому идентификатору."""
        return 7

    async def send_message(self, _target, text, **_kwargs):
        """Запоминает последовательность отправок."""
        self.sent.append(text)
        return message(len(self.sent) * 10)

    async def get_messages(self, _target, *, limit, min_id):
        """Отдаёт ответ, когда тест разрешит завершить ожидание."""
        if min_id == 10:
            self.waiting.set()
            await self.release.wait()
        return [message(min_id + 1)][:limit]


class BrokerOperationTest(unittest.IsolatedAsyncioTestCase):
    """Проверяет операции на поддельном клиенте без доступа к Telegram."""

    def test_current_telethon_buttons_serialize_callback_only(self):
        """Читает данные нового типа callback, сохраняя URL-кнопки без полезной нагрузки."""
        buttons = [MessageButton(None, original, None, None, 1) for original in (
            Button.inline("Ответ", b"value"), Button.url("Ссылка", "https://example.com"),
        )]
        result = encode_message(message(1, buttons=[buttons]))
        self.assertEqual(result["buttons"], [[
            {"text": "Ответ", "data_b64": "dmFsdWU=", "url": None},
            {"text": "Ссылка", "data_b64": None, "url": "https://example.com"},
        ]])

    async def test_response_wait_serializes_same_chat(self):
        """Второй бот ждёт завершения атомарной отправки с получением ответа."""
        client = ScriptedClient()
        send = OPERATIONS["send_message"]
        first = asyncio.create_task(send(client, {"target": "@chat", "text": "Первое", "wait_seconds": 2.5}))
        await client.waiting.wait()
        second = asyncio.create_task(send(client, {"target": 7, "text": "Второе"}))
        await asyncio.sleep(0)
        self.assertEqual(client.sent, ["Первое"])
        client.release.set()
        self.assertEqual((await first)["responses"][0]["id"], 11)
        self.assertEqual((await second)["id"], 20)
        self.assertEqual(client.sent, ["Первое", "Второе"])

    async def test_click_must_exist_on_target_message(self):
        """Брокер не отправляет произвольные callback-данные для чужой кнопки."""
        click = AsyncMock(return_value=SimpleNamespace(message="Нажато"))
        button = SimpleNamespace(data=b"value", button=Button.inline("Демо", b"value"), click=click)
        client = ScriptedClient()
        client.get_messages = AsyncMock(return_value=message(1, buttons=[[button]]))
        args = {"target": 7, "message_id": 1}
        operation = OPERATIONS["click_button"]
        with self.assertRaises(BrokerError):
            await operation(client, {**args, "data_b64": base64.b64encode(b"unknown").decode()})
        click.assert_not_awaited()
        result = await operation(client, {**args, "data_b64": base64.b64encode(b"value").decode()})
        self.assertEqual(result, {"message": "Нажато", "response": None})
        click.assert_awaited_once()

    async def test_limits_reject_improper_requests_before_network(self):
        """Отсекает слишком долгие ожидания и некорректный режим разметки."""
        client = ScriptedClient()
        for config in ({"wait_seconds": 26}, {"wait_seconds": True}, {"parse_mode": "plain"}):
            with self.assertRaises(BrokerError):
                await OPERATIONS["send_message"](client, {"target": 7, "text": "Демо", **config})
        self.assertFalse(client.sent)
