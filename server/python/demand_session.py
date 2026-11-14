"""@fileoverview Приём обновлений и временное пробуждение обработчика бота."""

import asyncio
import contextlib
import os

from demand_queue import DemandQueue
from demand_poller import DemandPoller
from demand_slot import active_slot
from demand_state import DemandState
from demand_tasks import update_tasks, FatalTaskCleanupError
from demand_state_codec import StateSerializationError
from redis.exceptions import RedisError
from redis_queue_retry import peek_with_retry


class DemandSession:
    """Хранит лёгкий приёмник; тяжёлый модуль существует только при обработке."""

    def __init__(self, ctx, settings, semaphore, load, ready, log):
        """Связывает очередь, загрузчик и общий лимит активных обработчиков."""
        self.ctx, self.settings = ctx, settings
        self.semaphore, self.load, self.ready, self.log = semaphore, load, ready, log
        self.queue = DemandQueue(settings["redis_url"], int(ctx.token.split(":", 1)[0]))
        self.state = DemandState(self.queue, getattr(ctx, "project_id", 0), ctx.token_id)
        self.wakeup, self.stopping = asyncio.Event(), asyncio.Event()
        self.receiver = None
        self.poller = None
        self.handler = None

    async def notify(self):
        """Будит обработчик после надёжной записи нового пакета."""
        self.wakeup.set()

    async def run(self):
        """Держит приёмник до остановки, запуская ограниченные сеансы обработки."""
        await self.queue.open()
        try:
            poller = DemandPoller(self.ctx.token, self.queue, self.notify,
                                  on_ready=self.ready,
                                  on_stopping=self.cancel_handler,
                                  api_base=(self.ctx.env or {}).get("TELEGRAM_BOT_API_URL")
                                      or "https://api.telegram.org")
            self.poller = poller
            self.receiver = asyncio.create_task(poller.run())
            self.wakeup.set()
            while not self.stopping.is_set():
                waiter = asyncio.create_task(self.wakeup.wait())
                done, _ = await asyncio.wait((waiter, self.receiver),
                                             return_when=asyncio.FIRST_COMPLETED)
                if self.stopping.is_set():
                    waiter.cancel()
                    with contextlib.suppress(asyncio.CancelledError):
                        await waiter
                    break
                if self.receiver in done:
                    waiter.cancel()
                    with contextlib.suppress(asyncio.CancelledError):
                        await waiter
                    await self.receiver
                    raise RuntimeError("Приёмник обновлений неожиданно завершился")
                self.wakeup.clear()
                if self.stopping.is_set():
                    break
                if await peek_with_retry(self.queue, (self.stopping,), self.receiver) is None:
                    continue
                async with active_slot(self.semaphore, self.receiver, self.stopping) as acquired:
                    if not acquired:
                        break
                    self.log("Пробуждение обработчика")
                    handler = asyncio.create_task(self.load(self.ctx, self))
                    self.handler = handler
                    try:
                        done, _ = await asyncio.wait((handler, self.receiver),
                            return_when=asyncio.FIRST_COMPLETED)
                        if self.receiver in done and not self.stopping.is_set():
                            await self.receiver
                            raise RuntimeError("Приёмник обновлений остановился")
                        await handler
                    finally:
                        if not handler.done():
                            handler.cancel()
                            with contextlib.suppress(asyncio.CancelledError):
                                await handler
                        self.handler = None
                    if self.ctx.status == "error":
                        raise RuntimeError("Обработчик не запустился")
                    self.log("Обработчик выгружен; приёмник ожидает обновления")
        finally:
            if self.receiver:
                self.receiver.cancel()
                try:
                    with contextlib.suppress(asyncio.CancelledError):
                        await self.receiver
                finally:
                    await self.queue.close()
            else:
                await self.queue.close()

    async def feed(self, dispatcher, bot, stop_event):
        """Последовательно обрабатывает очередь; подтверждает только успешные update."""
        from aiogram.types import Update

        while not self.stopping.is_set() and not stop_event.is_set():
            self.wakeup.clear()
            # Ошибка чтения не выгружает обработчик и не подтверждает исходное событие.
            update = await peek_with_retry(self.queue, (self.stopping, stop_event), self.receiver)
            if self.stopping.is_set() or stop_event.is_set():
                return
            if update is not None:
                parsed = Update.model_validate(update, context={"bot": bot})
                try:
                    async with update_tasks():
                        await dispatcher.feed_update(bot, parsed)
                except FatalTaskCleanupError:
                    self.log("Дочерняя задача не остановилась: аварийный перезапуск воркера")
                    os._exit(70)
                    raise
                while not self.stopping.is_set():
                    try:
                        await self.state.save_and_ack(self.ctx.module, update["update_id"])
                        break
                    except StateSerializationError:
                        self.log("Состояние не сохраняется: обработчик закреплён в памяти, ACK запрещён")
                        await self.stopping.wait()
                    except (RedisError, OSError, TimeoutError):
                        await asyncio.sleep(1)
                continue
            try:
                await asyncio.wait_for(self.wakeup.wait(), self.settings["idle"])
            except asyncio.TimeoutError:
                return

    async def stop(self):
        """Прекращает получение, сохраняя неподтверждённые записи в Redis."""
        self.stopping.set()
        self.wakeup.set()
        if self.poller:
            await asyncio.wait_for(self.poller.pause(), 5)

    async def cancel_handler(self):
        """Завершает обработчик до освобождения lease при отказе приёмника."""
        if self.handler and not self.handler.done():
            self.handler.cancel()
            await asyncio.gather(self.handler, return_exceptions=True)
