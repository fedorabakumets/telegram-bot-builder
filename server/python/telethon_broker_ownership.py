"""@fileoverview Запрет нескольких брокеров через постоянное владение в Redis без автопередачи."""

import asyncio
import uuid


class BrokerOwnership:
    """Удерживает единственного владельца; сбой требует контролируемого восстановления."""

    KEY = "tbb:telethon-broker:singleton:v1"
    ACQUIRE = "if redis.call('GET',KEYS[1])=='unowned' then redis.call('SET',KEYS[1],ARGV[1]); return 1 else return 0 end"
    RELEASE = "if redis.call('GET',KEYS[1])==ARGV[1] then redis.call('SET',KEYS[1],'unowned'); return 1 else return 0 end"

    def __init__(self, redis):
        """Принимает транспорт Redis, заменяемый в изолированных тестах."""
        self.redis = redis
        self.owner = uuid.uuid4().hex
        self.acquired = False
        self.failed = False
        self.task = None

    async def acquire(self):
        """До открытия клиентов захватывает постоянную блокировку без срока истечения."""
        if not await self.redis.eval(self.ACQUIRE, 1, self.KEY, self.owner):
            raise RuntimeError("Реестр занят или не инициализирован; требуется контролируемое восстановление брокера")
        self.acquired = True

    async def check(self):
        """При недоступности Redis или утрате ключа навсегда запрещает новые операции процесса."""
        if not self.acquired or self.failed:
            raise RuntimeError("Владение Telegram-сессиями не подтверждено")
        try:
            if await self.redis.get(self.KEY) != self.owner:
                raise RuntimeError("Владелец Telegram-сессий изменился")
        except Exception:
            self.failed = True
            raise

    def watch(self, close_clients, on_lost=None):
        """Проверяет владение даже без HTTP-запросов и закрывает клиентов при потере связи."""
        async def monitor():
            """Не разрешает автоматическое возобновление после неопределённого состояния."""
            while True:
                await asyncio.sleep(1)
                try:
                    await self.check()
                except Exception:
                    try:
                        await close_clients()
                    finally:
                        if on_lost:
                            on_lost()
                    return
        self.task = asyncio.create_task(monitor())

    async def stop(self, close_clients):
        """Освобождает ключ только после подтверждённого закрытия всех клиентов."""
        if self.task:
            self.task.cancel()
            await asyncio.gather(self.task, return_exceptions=True)
        try:
            await close_clients()
            if self.acquired and not self.failed:
                await self.redis.eval(self.RELEASE, 1, self.KEY, self.owner)
        finally:
            await self.redis.aclose()


def create_ownership(redis_url):
    """Создаёт обязательный Redis-транспорт с короткими сетевыми таймаутами."""
    if not redis_url:
        raise ValueError("Для единственного владельца Telegram-сессий требуется REDIS_URL")
    from redis.asyncio import Redis
    return BrokerOwnership(Redis.from_url(redis_url, decode_responses=True,
                                         socket_connect_timeout=2, socket_timeout=2))
