"""@fileoverview Перенос сохранённых обновлений в подготовленный direct dispatcher."""

import asyncio

from aiogram.types import Update
from redis.exceptions import RedisError

from bot_env_overlay import get_base_environ
from demand_queue import DemandQueue
from demand_state import DemandState
from demand_tasks import UpdateTasksError, update_tasks


async def drain_direct(ctx, module, dispatcher, bot, stop_event):
    """Обрабатывает FIFO под lease, сохраняя состояние до удаления обновления.

    При сбое обработчика запись остаётся в очереди; повтор ACK не вызывает
    обработчик снова. Подтверждение Telegram сохраняет новые ответы в резерве.
    """
    address = {**get_base_environ(), **(ctx.env or {})}.get("REDIS_URL")
    if not address:
        return
    queue = DemandQueue(address, int(ctx.token.split(":", 1)[0]))
    state = DemandState(queue, ctx.project_id, ctx.token_id)

    async def guard():
        """Запрещает дальнейшую работу после остановки или смены владельца."""
        owner = getattr(ctx, "_direct_lease_owner", None)
        if stop_event.is_set() or not owner:
            raise RuntimeError("Перенос очереди direct остановлен")
        if await queue.redis.get(f"bot:lock:{ctx.token[-10:]}") != owner:
            raise RuntimeError("Потеряна блокировка при переносе очереди direct")

    async def feed(parsed):
        """Отменяет выполняемый обработчик при остановке, оставляя запись в Redis."""
        handling = asyncio.create_task(dispatcher.feed_update(bot, parsed, _worker_persisted_backlog=True))
        stopping = asyncio.create_task(stop_event.wait())
        try:
            await asyncio.wait((handling, stopping), timeout=30, return_when=asyncio.FIRST_COMPLETED)
            if stop_event.is_set():
                raise RuntimeError("Перенос очереди direct остановлен во время обработки")
            if not handling.done():
                raise UpdateTasksError("Истекло время обработки сохранённого обновления direct")
            await handling
        finally:
            for task in (handling, stopping):
                if not task.done():
                    task.cancel()
            # Дерево обработчика ограниченно завершает внешний update_tasks;
            # бесконечно ждать сценарий, игнорирующий отмену, здесь нельзя.
            await asyncio.gather(stopping, return_exceptions=True)

    try:
        await queue.open()
        while True:
            await guard()
            pending = await queue.peek()
            if pending is not None:
                parsed = Update.model_validate(pending, context={"bot": bot})
                async with update_tasks():
                    await feed(parsed)
                while True:
                    await guard()
                    try:
                        await state.save_and_ack(module, pending["update_id"],
                            lease_key=f"bot:lock:{ctx.token[-10:]}",
                            lease_owner=ctx._direct_lease_owner)
                        break
                    except (RedisError, OSError, TimeoutError):
                        # При временном сбое повторяем только атомарный ACK.
                        try:
                            await asyncio.wait_for(stop_event.wait(), timeout=1)
                        except asyncio.TimeoutError:
                            continue
                        await guard()
                continue
            offset = await queue.offset()
            if offset is None:
                return
            await guard()
            updates = await bot.get_updates(offset=offset, timeout=0, limit=100)
            await guard()
            if updates:
                await queue.enqueue([item.model_dump(mode="json", exclude_none=True) for item in updates])
                continue
            # Проверяем также события, записанные ingress во время барьера.
            if await queue.peek() is None:
                return
    finally:
        await queue.close()
