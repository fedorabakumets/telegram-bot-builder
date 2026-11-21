"""@fileoverview Состояние клиента и ограниченный допуск операций общего аккаунта."""

import asyncio
from collections import deque
from contextlib import asynccontextmanager
from dataclasses import dataclass, field


class BrokerError(RuntimeError):
    """Контролируемая ошибка без данных сессии и ответов Telegram."""

    def __init__(self, code, message, status=400):
        """Устанавливает публичные код, текст и статус ошибки."""
        super().__init__(message)
        self.code = code
        self.status = status


@dataclass(repr=False)
class ClientEntry:
    """Хранит соединение и общие ограничения всех потребителей аккаунта."""

    account_id: str  # Идентификатор владельца аккаунта.
    fingerprint: str  # Отпечаток ключа авторизации.
    config_fingerprint: str  # Отпечаток настроек подключения.
    client: object  # Единственное соединение данной авторизации.
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)  # Защита допуска и подключения.
    idle: asyncio.Event = field(default_factory=asyncio.Event)  # Завершение активных операций.
    users: int = 0  # Число активных операций всех ботов.
    pending: int = 0  # Число запросов, ожидающих допуска.
    ready: bool = False  # Подключение успешно авторизовано.
    closing: bool = False  # Новые операции запрещены.
    invalid: bool = False  # Telegram отозвал авторизацию.
    cooldown_until: float = 0  # Конец общей паузы по монотонным часам.
    recent: deque = field(default_factory=deque)  # Начала операций последней секунды.


@asynccontextmanager
async def admission(entry, stopping):
    """Ограничивает очередь до ожидания блокировки и учитывает общий FloodWait."""
    if entry.pending >= 32:
        raise BrokerError("ACCOUNT_BUSY", "Очередь операций аккаунта заполнена", 429)
    entry.pending += 1
    try:
        async with entry.lock:
            if stopping() or entry.closing:
                raise BrokerError("ACCOUNT_CLOSING", "Аккаунт отключается", 409)
            now = asyncio.get_running_loop().time()
            if entry.cooldown_until > now:
                raise BrokerError("FLOOD_WAIT", "Telegram ограничил частоту запросов аккаунта", 429)
            if entry.users >= 8:
                raise BrokerError("ACCOUNT_BUSY", "Достигнут общий лимит операций аккаунта", 429)
            while entry.recent and entry.recent[0] <= now - 1:
                entry.recent.popleft()
            if len(entry.recent) >= 12:
                await asyncio.sleep(max(0, entry.recent[0] + 1 - now))
                entry.recent.popleft()
                if stopping() or entry.closing:
                    raise BrokerError("ACCOUNT_CLOSING", "Аккаунт отключается", 409)
                if entry.cooldown_until > asyncio.get_running_loop().time():
                    raise BrokerError("FLOOD_WAIT", "Telegram ограничил частоту запросов аккаунта", 429)
            entry.recent.append(asyncio.get_running_loop().time())
            yield
    finally:
        entry.pending -= 1
