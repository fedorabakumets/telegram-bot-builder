"""@fileoverview Обработка очереди внутри временного процесса без Telegram polling."""

import asyncio
import time

from demand_queue import DemandQueue
from demand_state import DemandState
from demand_state_codec import StateSerializationError
from demand_tasks import update_tasks
from redis.exceptions import RedisError
from redis_queue_retry import peek_with_retry


class ProcessChildFeed:
    """Восстанавливает состояние и подтверждает обновления только вместе со снимком."""

    def __init__(self, ctx, redis_url, idle):
        """Привязывает очередь к Telegram ID, а снимок к проекту и записи токена."""
        self.ctx, self.idle = ctx, idle
        self.queue = DemandQueue(redis_url, int(ctx.token.split(":", 1)[0]))
        self.state = DemandState(self.queue, ctx.project_id, ctx.token_id)
        self.stopping = asyncio.Event()
        self.idled = False

    async def feed(self, dispatcher, bot, stop_event):
        """Последовательно выполняет обновления; пустая очередь закрывает процесс по таймеру."""
        from aiogram.types import Update

        deadline = time.monotonic() + self.idle
        while not self.stopping.is_set() and not stop_event.is_set():
            # Временная потеря Redis не подтверждает событие и не завершает регистрацию.
            update = await peek_with_retry(self.queue, (self.stopping, stop_event))
            if self.stopping.is_set() or stop_event.is_set():
                return
            if update is None:
                if time.monotonic() >= deadline:
                    self.idled = True
                    return
                try:
                    await asyncio.wait_for(self.stopping.wait(), min(0.1, self.idle))
                except asyncio.TimeoutError:
                    pass
                continue
            parsed = Update.model_validate(update, context={"bot": bot})
            async with update_tasks():
                await dispatcher.feed_update(bot, parsed)
            while not self.stopping.is_set():
                try:
                    await self.state.save_and_ack(self.ctx.module, update["update_id"])
                    break
                except StateSerializationError:
                    raise
                except (RedisError, OSError, TimeoutError):
                    try:
                        await asyncio.wait_for(self.stopping.wait(), 1)
                    except asyncio.TimeoutError:
                        pass
            deadline = time.monotonic() + self.idle
