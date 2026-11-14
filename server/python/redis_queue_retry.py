"""@fileoverview Повторяет только безопасное чтение очереди Redis с учётом остановки и lease."""

import asyncio

from redis.exceptions import RedisError


async def peek_with_retry(queue, stop_events, receiver=None, retry_delay=1.0):
    """Повторяет чтение без ACK и redispatch; прекращает ожидание при остановке или отказе lease.

    Соединение DemandQueue ограничивает сетевую операцию пятью секундами.
    Повторяется только неизменяющий очередь peek, а не обработчик с побочными эффектами.
    """
    while not any(event.is_set() for event in stop_events):
        if receiver is not None and receiver.done():
            await receiver
            raise RuntimeError("Приёмник обновлений завершился во время чтения очереди")
        try:
            update = await queue.peek()
            if receiver is not None and receiver.done():
                await receiver
                raise RuntimeError("Приёмник обновлений завершился во время чтения очереди")
            return None if any(event.is_set() for event in stop_events) else update
        except (RedisError, OSError, TimeoutError):
            waiters = [asyncio.create_task(event.wait()) for event in stop_events]
            try:
                watched = [*waiters, *([receiver] if receiver is not None else [])]
                await asyncio.wait(watched, timeout=retry_delay, return_when=asyncio.FIRST_COMPLETED)
            finally:
                for waiter in waiters:
                    waiter.cancel()
                await asyncio.gather(*waiters, return_exceptions=True)
    return None
