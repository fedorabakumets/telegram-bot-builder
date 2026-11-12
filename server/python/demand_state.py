"""@fileoverview Снимок пользовательского состояния при засыпании и пробуждении бота."""

from demand_state_codec import StateSerializationError, decode_state, encode_state


SAVE_AND_ACK = """
redis.call('SET', KEYS[7], ARGV[2])
local payload = redis.call('HGET', KEYS[2], ARGV[1])
if not payload then return 0 end
redis.call('HDEL', KEYS[2], ARGV[1])
redis.call('ZREM', KEYS[1], ARGV[1])
redis.call('DECRBY', KEYS[4], string.len(payload))
return 1
"""


class DemandState:
    """Хранит словарь сценария отдельно для проекта и записи токена.

    Снимок не имеет срока удаления. Ошибка сериализации должна запрещать сон
    и подтверждение обновления; исключения не содержат пользовательских значений.
    """

    def __init__(self, queue, project_id, token_id, max_bytes=2 * 1024 * 1024):
        """Выбирает ключ в том же Redis-слоте, что и очередь Telegram-бота."""
        if max_bytes < 1:
            raise ValueError("Ограничение снимка должно быть положительным")
        self.queue = queue
        self.max_bytes = max_bytes
        prefix = queue.keys[0].rsplit(":", 1)[0]
        self.key = f"{prefix}:state:{int(project_id)}:{int(token_id)}"

    def _snapshot(self, module):
        """Сериализует только user_data, не захватывая клиент, модуль или секреты окружения."""
        if not hasattr(module, "user_data"):
            raise StateSerializationError("Модуль не содержит user_data")
        return encode_state(module.user_data, self.max_bytes)

    async def load_into(self, module):
        """Восстанавливает словарь до main, сохраняя существующую ссылку user_data."""
        target = getattr(module, "user_data", None)
        if type(target) is not dict:
            raise StateSerializationError("Модуль не содержит словарь user_data")
        payload = await self.queue._client().get(self.key)
        if payload is None:
            return
        restored = decode_state(payload, self.max_bytes)
        target.clear()
        target.update(restored)

    async def save(self, module):
        """Сохраняет снимок до выгрузки; неподдерживаемый тип вызывает явную ошибку."""
        payload = self._snapshot(module)
        await self.queue._client().set(self.key, payload)

    async def clear(self):
        """Удаляет устаревший снимок при явном возврате к обычному polling."""
        await self.queue._client().delete(self.key)

    async def save_and_ack(self, module, update_id):
        """Атомарно сохраняет обработанное состояние и подтверждает исходное обновление."""
        payload = self._snapshot(module)
        keys = [*self.queue.keys, self.key]
        await self.queue._client().eval(SAVE_AND_ACK, len(keys), *keys, str(update_id), payload)
