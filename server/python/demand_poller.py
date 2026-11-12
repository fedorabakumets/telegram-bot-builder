"""@fileoverview Лёгкий приём обновлений Telegram с сохранением перед подтверждением."""

import asyncio
import contextlib
import aiohttp
from redis.exceptions import RedisError
from demand_queue import QueueFullError
from demand_poller_lease import PollingLease

# Поля Update закреплённой версии aiogram; явный список сбрасывает старый фильтр Telegram.
ALLOWED_UPDATES = (
    "message", "edited_message", "channel_post", "edited_channel_post",
    "business_connection", "business_message", "edited_business_message",
    "deleted_business_messages", "guest_message", "message_reaction",
    "message_reaction_count", "inline_query", "chosen_inline_result",
    "callback_query", "shipping_query", "pre_checkout_query", "purchased_paid_media",
    "poll", "poll_answer", "my_chat_member", "chat_member", "chat_join_request",
    "chat_boost", "removed_chat_boost", "managed_bot", "subscription",
    "stopped_message_generation",
)


class PollingRejected(RuntimeError):
    """Обозначает постоянный отказ Telegram без раскрытия токена в исключении."""


class DemandPoller:
    """Принимает обновления одного токена без создания aiogram Bot/Dispatcher."""

    def __init__(self, token, queue, on_updates, *, on_ready=None, on_stopping=None,
                 api_base="https://api.telegram.org", session_factory=None):
        """Настраивает очередь, сигналы пробуждения и заменяемый тестовый транспорт."""
        self._url = f"{api_base.rstrip('/')}/bot{token}/getUpdates"
        self.queue = queue
        self.on_updates = on_updates
        self.on_ready = on_ready
        self.on_stopping = on_stopping
        self.ready = asyncio.Event()
        self._token = token
        self._session_factory = session_factory or aiohttp.ClientSession
        self._paused = False
        self._receive_task = None

    async def run(self):
        """Удерживает lease; отмена останавливает HTTP до освобождения блокировки."""
        lease = PollingLease(self.queue.redis, self._token)
        await lease.acquire()
        tasks = []
        try:
            tasks = [asyncio.create_task(lease.maintain()),
                     asyncio.create_task(self._hold_receiver())]
            self.ready.set()
            if self.on_ready:
                await self.on_ready()
            done, _ = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
            for task in done:
                await task
        finally:
            if tasks:
                tasks[1].cancel()
                await asyncio.gather(tasks[1], return_exceptions=True)
            try:
                if self.on_stopping:
                    await self.on_stopping()
            finally:
                if tasks:
                    tasks[0].cancel()
                    await asyncio.gather(tasks[0], return_exceptions=True)
            with contextlib.suppress(Exception):
                await lease.release()

    async def pause(self):
        """Останавливает HTTP, продолжая держать lease до отмены run после drain."""
        self._paused = True
        if self._receive_task is not None:
            self._receive_task.cancel()
            await asyncio.gather(self._receive_task, return_exceptions=True)

    async def _hold_receiver(self):
        """Сохраняет продление lease при явной паузе приёмника."""
        if not self._paused:
            self._receive_task = asyncio.create_task(self._receive())
            try:
                await self._receive_task
            except asyncio.CancelledError:
                if not self._paused or asyncio.current_task().cancelling():
                    raise
        if self._paused:
            await asyncio.Event().wait()

    async def _receive(self):
        """Повторяет временные сбои, не подтверждая несохранённые обновления."""
        delay = 1
        async with self._session_factory(timeout=aiohttp.ClientTimeout(total=35)) as session:
            while True:
                try:
                    offset = await self.queue.offset()
                    async with session.post(self._url, json={
                        "offset": offset, "timeout": 25, "limit": 100,
                        "allowed_updates": list(ALLOWED_UPDATES),
                    }) as response:
                        body = await response.json()
                        if not body.get("ok"):
                            code = body.get("error_code", response.status)
                            if code in (400, 401, 403, 404, 409):
                                raise PollingRejected(f"Telegram отклонил polling: код {code}")
                            retry = body.get("parameters", {}).get("retry_after", delay)
                            await asyncio.sleep(min(max(float(retry), 1), 60))
                            continue
                        updates = body.get("result", [])
                    if updates:
                        await self._persist(updates)
                    delay = 1
                except PollingRejected:
                    raise
                except (aiohttp.ClientError, TimeoutError, OSError, ValueError, RedisError):
                    await asyncio.sleep(delay)
                    delay = min(delay * 2, 30)

    async def _persist(self, updates):
        """Удерживает полученный пакет при перегрузке вместо следующего long poll."""
        while True:
            try:
                await self.queue.enqueue(updates)
                await self.on_updates()
                return
            except (QueueFullError, RedisError, TimeoutError, OSError):
                await asyncio.sleep(1)
