"""@fileoverview Ожидание свободного обработчика с контролем приёмника и остановки."""

import asyncio
import contextlib
from contextlib import asynccontextmanager


@asynccontextmanager
async def active_slot(semaphore, receiver, stopping):
    """Не оставляет ожидающего бота без реакции на потерю lease или остановку."""
    if semaphore is None:
        if receiver.done() and not stopping.is_set():
            await receiver
            raise RuntimeError("Приёмник остановился до пробуждения")
        yield not stopping.is_set()
        return
    acquire = asyncio.create_task(semaphore.acquire())
    stopped = asyncio.create_task(stopping.wait())
    acquired = False
    try:
        done, _ = await asyncio.wait((acquire, receiver, stopped),
                                     return_when=asyncio.FIRST_COMPLETED)
        acquired = acquire.done() and not acquire.cancelled() and acquire.result()
        if receiver in done and not stopping.is_set():
            await receiver
            raise RuntimeError("Приёмник остановился до пробуждения")
        yield bool(acquired and not stopping.is_set())
    finally:
        for task in (acquire, stopped):
            if not task.done():
                task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await task
        if acquire.done() and not acquire.cancelled() and acquire.result():
            semaphore.release()
