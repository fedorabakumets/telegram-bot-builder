"""@fileoverview Проверки повторного использования aiogram общими обработчиками."""
from __future__ import annotations

import asyncio
import json
from pathlib import Path
import subprocess
import sys
import time
import unittest
from unittest.mock import patch


async def concurrent_activations():
    """Проверяет независимые диспетчеры двух ботов и повторную активацию без сети."""
    from aiogram import Bot, Dispatcher
    from aiogram.types import Update

    async def activation(bot_id, marker):
        """Создаёт отдельный сценарий с общими классами библиотек и своим состоянием."""
        bot = Bot(token=f"{bot_id}:" + "a" * 35)
        dispatcher = Dispatcher()
        values = []

        async def handle(message):
            """Сохраняет данные только текущей активации после переключения задачи."""
            await asyncio.sleep(0)
            values.append((bot.id, message.text))
            return tuple(values)

        dispatcher.message.register(handle)
        update = Update.model_validate({
            "update_id": 1,
            "message": {
                "message_id": 1, "date": 0, "text": marker,
                "chat": {"id": 99, "type": "private"},
                "from": {"id": 99, "is_bot": False, "first_name": "Тест"},
            },
        })
        try:
            return await dispatcher.feed_update(bot, update)
        finally:
            await dispatcher.storage.close()
            await bot.session.close()

    first = await asyncio.gather(activation(100001, "первый"), activation(100002, "второй"))
    second = await asyncio.gather(activation(100001, "снова первый"), activation(100002, "снова второй"))
    assert first == [((100001, "первый"),), ((100002, "второй"),)]
    assert second == [((100001, "снова первый"),), ((100002, "снова второй"),)]


def probe():
    """Замеряет холодную загрузку и доказывает отсутствие повторной загрузки aiogram."""
    import lazy_aiogram

    started = time.perf_counter()
    assert lazy_aiogram.enable()
    cold_ms = (time.perf_counter() - started) * 1000
    from aiogram import Bot, Dispatcher
    from aiogram.types import Update
    from pydantic import BaseModel
    from pydantic._internal import _config

    original_rebuild = BaseModel.model_rebuild.__func__
    original_defer = _config.config_defaults["defer_build"]
    module = sys.modules["aiogram"]
    started = time.perf_counter()
    with patch("builtins.__import__", side_effect=AssertionError("Повторный импорт")):
        for _ in range(1000):
            assert not lazy_aiogram.enable()
    warm_us = (time.perf_counter() - started) * 1000
    assert sys.modules["aiogram"] is module
    assert module.Bot is Bot and module.Dispatcher is Dispatcher
    assert sys.modules["aiogram.types"].Update is Update
    assert BaseModel.model_rebuild.__func__ is original_rebuild
    assert _config.config_defaults["defer_build"] == original_defer
    asyncio.run(concurrent_activations())
    print(json.dumps({"cold_ms": cold_ms, "warm_average_us": warm_us, "parallel_bots": 2}))


class SharedAiogramReuseTest(unittest.TestCase):
    """Запускает проверку в чистом процессе без влияния других импортов тестового набора."""

    def test_shared_import_and_parallel_activations(self):
        """Проверяет общий импорт, быстрый повторный вход и независимость состояний."""
        result = subprocess.run(
            [sys.executable, str(Path(__file__).resolve()), "--probe"],
            capture_output=True, text=True, encoding="utf-8", timeout=60,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        summary = json.loads(result.stdout)
        self.assertEqual(summary["parallel_bots"], 2)
        print(json.dumps(summary))


if __name__ == "__main__":
    if "--probe" in sys.argv:
        probe()
    else:
        unittest.main()
