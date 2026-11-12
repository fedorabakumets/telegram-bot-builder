"""@fileoverview Исключительное владение Telegram polling с продлением Redis lease."""

import asyncio
import uuid


class PollingLease:
    """Разделяет ключ блокировки с обычным сгенерированным polling."""

    def __init__(self, redis, token):
        """Запоминает клиент Redis и непрозрачного владельца блокировки."""
        self.redis = redis
        self.key = f"bot:lock:{token[-10:]}"
        self.owner = uuid.uuid4().hex

    async def acquire(self):
        """Захватывает lease до любого обращения к getUpdates."""
        acquired = await asyncio.wait_for(
            self.redis.set(self.key, self.owner, nx=True, ex=60), 5)
        if not acquired:
            raise RuntimeError("Polling уже принадлежит другому обработчику")

    async def maintain(self):
        """При потере подтверждения завершает приём раньше истечения lease."""
        script = "if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('EXPIRE',KEYS[1],60) else return 0 end"
        while True:
            await asyncio.sleep(15)
            renewed = await asyncio.wait_for(
                self.redis.eval(script, 1, self.key, self.owner), 5)
            if not renewed:
                raise RuntimeError("Потеряна блокировка polling")

    async def release(self):
        """Освобождает только собственную блокировку, сохраняя чужую."""
        script = "if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end"
        await asyncio.wait_for(self.redis.eval(script, 1, self.key, self.owner), 5)
