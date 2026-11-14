"""@fileoverview Изолированная проверка настоящего Redis Pub/Sub для локальной нагрузки воркера."""
import asyncio
import json
import uuid


class RedisProbe:
    """Проверяет доставку журналов через уникальные каналы, не меняя чужие данные Redis."""
    def __init__(self, url, token_ids):
        """Создаёт ограниченные счётчики по ботам и отдельный клиент наблюдения."""
        from redis.asyncio import Redis
        self.url, self.factory = url, Redis
        self.prefix = 'tbb:stress:' + uuid.uuid4().hex + ':'
        self.observer = Redis.from_url(url, decode_responses=True)
        self.pubsub = self.observer.pubsub()
        self.received = dict.fromkeys(token_ids, 0)
        self.published = dict.fromkeys(token_ids, 0)
        self.events = {token_id: asyncio.Event() for token_id in token_ids}
        self.locks = {token_id: asyncio.Lock() for token_id in token_ids}
        self.errors, self.opened, self.closed = [], 0, 0
        self.task = None

    async def start(self):
        """Подписывается до первой отправки и сохраняет исходные показатели сервера."""
        await self.observer.ping()
        self.before = await self.snapshot()
        await self.pubsub.psubscribe(self.prefix + '*')
        while True:
            message = await self.pubsub.get_message(ignore_subscribe_messages=False, timeout=5)
            if message and message['type'] == 'psubscribe':
                break
        self.task = asyncio.create_task(self.receive())

    async def snapshot(self):
        """Возвращает только безопасные числовые показатели локального Redis."""
        info = await self.observer.info()
        return {key: info.get(key) for key in ('used_memory', 'used_memory_rss', 'connected_clients')}

    async def receive(self):
        """Проверяет владельца канала и непрерывный номер доставки без хранения всех сообщений."""
        async for message in self.pubsub.listen():
            if message['type'] != 'pmessage':
                continue
            try:
                payload = json.loads(message['data'])
                token_id = payload['tokenId']
                if message['channel'] != self.prefix + str(token_id) or token_id not in self.received:
                    raise ValueError('Чужой канал или бот')
                if payload['_stressSequence'] != self.received[token_id] + 1:
                    raise ValueError('Пропуск или повтор сообщения')
                self.received[token_id] += 1
                self.events[token_id].set()
            except Exception as error:
                if len(self.errors) < 20:
                    self.errors.append(type(error).__name__)

    def client(self, token_id):
        """Создаёт настоящее подключение, принадлежащее ровно одной активации."""
        probe = self
        client = self.factory.from_url(self.url, decode_responses=True)
        self.opened += 1

        class ActivationRedis:
            """Направляет настоящий publish в изолированный канал теста."""
            async def publish(self, channel, body):
                """Проверяет исходный канал и ждёт подтверждённой доставки подписчику."""
                async with probe.locks[token_id]:
                    try:
                        return await self.deliver(channel, body)
                    except BaseException as error:
                        if len(probe.errors) < 20:
                            probe.errors.append(type(error).__name__)
                        raise

            async def deliver(self, channel, body):
                """Выполняет одну последовательную отправку для конкретного бота."""
                payload = json.loads(body)
                if channel != f'bot:logs:1:{token_id}' or payload['tokenId'] != token_id:
                    raise ValueError('Неверный владелец публикации')
                sequence = probe.published[token_id] + 1
                payload['_stressSequence'] = sequence
                probe.events[token_id].clear()
                subscribers = await client.publish(probe.prefix + str(token_id), json.dumps(payload))
                if subscribers != 1:
                    raise ValueError('Подписчик отсутствует или продублирован')
                await asyncio.wait_for(probe.events[token_id].wait(), 10)
                probe.published[token_id] = sequence

            async def aclose(self):
                """Освобождает подключение и пул после завершения задач публикации."""
                await client.aclose()
                probe.closed += 1
        return ActivationRedis()

    async def finish(self):
        """Закрывает подписку и возвращает проверяемую сводку без адреса подключения."""
        if self.task:
            self.task.cancel()
            await asyncio.gather(self.task, return_exceptions=True)
        await self.pubsub.aclose()
        after = await self.snapshot()
        await self.observer.aclose()
        return {'before': self.before, 'after': after, 'receivedPerBot': self.received,
                'publishedPerBot': self.published, 'deliveryErrors': self.errors,
                'clientsOpened': self.opened, 'clientsClosed': self.closed,
                'ok': not self.errors and self.received == self.published and self.opened == self.closed}
