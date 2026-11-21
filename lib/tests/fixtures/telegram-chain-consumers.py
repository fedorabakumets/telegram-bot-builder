"""@fileoverview Два актуальных клиента шаблона проверяют полную изолированную цепочку."""
import asyncio
import json
import logging
import os
import re
import socket
from pathlib import Path
from types import SimpleNamespace

import aiohttp
from telegram_chain_event_consumers import verify_events

original_connect = socket.socket.connect


def local_connect(sock, address):
    """Не допускает обращений тестового раннера за пределы loopback."""
    assert not isinstance(address, tuple) or address[0] in ("127.0.0.1", "::1"), "Внешняя сеть запрещена"
    return original_connect(sock, address)


socket.socket.connect = local_connect
template = Path(__file__).resolve().parents[2] / "templates/config/project-telegram-runtime.py.jinja2"


def template_source(path):
    """Раскрывает реальные включения шаблона без подмены проверяемого кода раннера."""
    source = re.sub(r"\{#.*?#\}", "", path.read_text(encoding="utf-8"), flags=re.S)
    return re.sub(r'\{%\s*include\s+"([^"]+)"\s*%\}',
                  lambda match: template_source(template.parents[1] / match[1]), source)


source = template_source(template)
namespace = dict(os=os, asyncio=asyncio, SimpleNamespace=SimpleNamespace, logging=logging, re=re, TOKEN_ID=5)
exec(compile(source, str(template), "exec"), namespace)


async def main():
    """Проверяет двух потребителей, профиль, кнопки и остановку одного клиента."""
    bridge = namespace["_ProjectTelegramBridge"]
    clients = []
    for token, key in json.loads(os.environ["CHAIN_KEYS"]):
        os.environ["BOT_TOKEN_ID"] = str(token)
        os.environ["PROJECT_TELEGRAM_RUNNER_KEY"] = key
        clients.append(bridge())
    first, second = clients
    async with aiohttp.ClientSession() as http:
        headers = {"Authorization": "Bearer synthetic_broker_secret_for_chain_test_only"}
        async def fetch_profile():
            """Запрашивает профиль одновременно с подключением обоих раннеров."""
            async with http.post(os.environ["PROJECT_TELEGRAM_API_BASE"] + "/api/projects/9/telegram-accounts/81/profile", json={}) as response:
                assert response.status == 200, await response.text()
                profile = await response.json()
                assert profile["phone"] == "+15551234567" and profile["avatar"]

        await asyncio.gather(first.connect(), second.connect(), fetch_profile())
        assert (await first.get_me()).id == (await second.get_me()).id == 42
        messages = await first.get_messages(7, ids=1)
        buttons = messages.reply_markup.rows[0].buttons
        assert buttons[0].data == b"value" and buttons[1].url == "https://example.com"
        assert messages.buttons[0][0].text == "Ответ"
        assert (await messages.buttons[0][0].click()).message == "Нажато"
        # Ошибка отсутствующей кнопки проходит до обоих настоящих bridge с HTTP 404.
        for consumer in clients:
            try:
                await consumer._execute("click_button", target=7, message_id=1, data_b64="bWlzc2luZw==")
                raise AssertionError("Отсутствующая кнопка должна дать ошибку операции")
            except namespace["_ProjectTelegramRequestError"] as error:
                assert error.code == "BUTTON_NOT_FOUND" and "404" in str(error) and "503" not in str(error)
        inline = await first.inline_query("@synthetic", "buy_btc 0.001")
        assert inline[0].title == "К оплате 1000 RUB"
        try:
            await first.get_messages(-429, limit=1)
            raise AssertionError("Перегрузка должна быть видна потребителю")
        except namespace["_ProjectTelegramRequestError"] as error:
            assert error.code == "ACCOUNT_BUSY" and "429" in str(error)
        await verify_events(first, second, http, headers)
        await first.disconnect()
        assert not first.is_connected() and second.is_connected()
        assert (await second.send_message(7, "Только имитация")).id == 2
        await first.connect()
        assert (await first.get_me()).id == 42
        async with http.get(os.environ["CHAIN_BROKER"] + "/test/stats", headers=headers) as response:
            stats = await response.json()
        assert stats == {"opens": 1, "closes": 0, "sent": 2, "clicked": 1}, stats
        await asyncio.gather(first.disconnect(), second.disconnect())
        print(json.dumps({"profile": True, "stats": stats}), flush=True)


asyncio.run(main())
