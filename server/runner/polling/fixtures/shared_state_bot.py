"""@fileoverview Тест общего интерпретатора, изоляции состояния и повторного пробуждения."""
import asyncio
import os
import sys
import types
import uuid

# Повторяем настройку потока из настоящего сгенерированного сценария.
sys.stderr.reconfigure(encoding="utf-8")

_WORKER_EXTERNAL_UPDATES_PROTOCOL = True
_WORKER_EXTERNAL_UPDATES_SAFE = True
_WORKER_EXTERNAL_STATE_PROTOCOL = True
_WORKER_READY_PROTOCOL = True
user_data = {}
_local_updates = 0
_probe_name = "_tbb_shared_integration_library_probe"
if _probe_name not in sys.modules:
    _probe = types.ModuleType(_probe_name)
    _probe.marker = uuid.uuid4().hex
    sys.modules[_probe_name] = _probe


class Dispatcher:
    """Моделирует параллельную работу без отправки сообщений в Telegram."""

    async def feed_update(self, bot, update):
        """Проверяет восстановление счётчика и контекст окружения после ожидания."""
        global _local_updates
        label = os.getenv("SHARED_TEST_LABEL", "missing")
        await asyncio.sleep(0.15)
        if label != os.getenv("SHARED_TEST_LABEL", "missing"):
            raise RuntimeError("Окружение смешалось между ботами")
        user_data["count"] = user_data.get("count", 0) + 1
        _local_updates += 1
        print(f"SHARED_HANDLED={user_data['count']} LABEL={label} PID={os.getpid()} "
              f"LIBRARY={sys.modules[_probe_name].marker} LOCAL={_local_updates}")


async def main():
    """Передаёт события настоящему адаптеру очереди и ожидает выгрузки сценария."""
    _worker_bot_ready()
    await _worker_external_updates(Dispatcher(), None, asyncio.Event())
