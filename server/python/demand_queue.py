"""@fileoverview Надёжная ограниченная Redis-очередь обновлений одного бота."""

import json
import time

from redis.asyncio import Redis

from demand_queue_scripts import ACK, ENQUEUE, OFFSET, PEEK


class QueueFullError(RuntimeError):
    """Получатель должен повторить пакет, не подтверждая его Telegram."""


class DemandQueue:
    """Сохраняет обновления и смещение атомарно до подтверждения Telegram.

    Доставка повторная при сбое между обработкой и ack; обработчик должен
    учитывать такую возможность. Очередь не удаляется при остановке бота.
    """

    def __init__(self, redis_url, token_id, max_pending=1000,
                 max_bytes=8 * 1024 * 1024):
        """Настраивает адрес Redis, идентификатор бота и пределы очереди."""
        if max_pending < 1 or max_bytes < 1:
            raise ValueError("Ограничения очереди должны быть положительными")
        self.redis_url = redis_url
        self.max_pending = max_pending
        self.max_bytes = max_bytes
        prefix = f"tbb:demand:{{{int(token_id)}}}"
        self.keys = [f"{prefix}:{part}" for part in
                     ("pending", "payloads", "offset", "bytes", "sequence", "received")]
        self.redis = None

    async def open(self):
        """Открывает ограниченное по времени соединение и проверяет Redis."""
        if self.redis is not None:
            return
        client = Redis.from_url(self.redis_url, decode_responses=True,
                                socket_timeout=5, socket_connect_timeout=5,
                                max_connections=4)
        try:
            await client.ping()
        except BaseException:
            await client.aclose()
            raise
        self.redis = client

    async def close(self):
        """Закрывает соединения, сохраняя необработанные данные в Redis."""
        if self.redis is not None:
            await self.redis.aclose()
            self.redis = None

    def _client(self):
        """Возвращает открытый клиент либо понятную ошибку жизненного цикла."""
        if self.redis is None:
            raise RuntimeError("Очередь Redis ещё не открыта")
        return self.redis

    async def enqueue(self, updates):
        """Атомарно записывает пакет и смещение; при переполнении ничего не меняет."""
        args = [self.max_pending, self.max_bytes, int(time.time())]
        for update in updates:
            update_id = update.get("update_id")
            if isinstance(update_id, bool) or not isinstance(update_id, int) or update_id < 0:
                raise ValueError("Обновление должно содержать целочисленный update_id")
            args.extend((str(update_id), json.dumps(update, ensure_ascii=False,
                                                  separators=(",", ":"))))
        if len(args) == 3:
            return
        accepted = await self._client().eval(ENQUEUE, len(self.keys), *self.keys, *args)
        if not accepted:
            raise QueueFullError("Очередь обновлений заполнена")

    async def offset(self):
        """Возвращает смещение только уже сохранённых пакетов или None."""
        value = await self._client().eval(OFFSET, len(self.keys), *self.keys, int(time.time()))
        return int(value) if value is not None else None

    async def peek(self):
        """Возвращает самое раннее обновление, не удаляя его до успешного ack."""
        payload = await self._client().eval(PEEK, len(self.keys), *self.keys)
        return json.loads(payload) if payload else None

    async def ack(self, update_id):
        """Удаляет успешно обработанное обновление; повторное подтверждение безопасно."""
        await self._client().eval(ACK, len(self.keys), *self.keys, str(update_id))
