"""@fileoverview Исключительное владение активной авторизацией в процессе Telethon."""

import asyncio
from telethon_broker_events import attach_events, detach_events
from telethon.errors import AuthKeyDuplicatedError, AuthKeyUnregisteredError, FloodWaitError, SessionRevokedError

from telethon_broker_admission import BrokerError, ClientEntry, admission


class TelethonClientBroker:
    """Объединяет запросы ботов к одной авторизации и закрывает клиент один раз."""

    def __init__(self, create_client):
        """Принимает фабрику клиента, чтобы отдельно проверять жизненный цикл."""
        self.create_client = create_client
        self.by_account = {}
        self.by_fingerprint = {}
        self.closed = False

    def _entry(self, account_id, fingerprint, config_fingerprint, config):
        """Резервирует авторизацию до первого ожидания или находит её владельца."""
        if self.closed:
            raise BrokerError("BROKER_STOPPING", "Сервис аккаунтов останавливается", 503)
        owned = self.by_fingerprint.get(fingerprint)
        if owned and owned.account_id != account_id:
            raise BrokerError("SESSION_IN_USE", "Сессия уже открыта для другого аккаунта", 409)
        current = self.by_account.get(account_id)
        if current:
            if current.config_fingerprint != config_fingerprint:
                raise BrokerError("CONFIG_CHANGED", "Сначала отключите прежнюю конфигурацию аккаунта", 409)
            return current
        entry = ClientEntry(account_id, fingerprint, config_fingerprint, self.create_client(config))
        entry.idle.set()
        self.by_account[account_id] = entry
        self.by_fingerprint[fingerprint] = entry
        return entry

    def _forget(self, entry):
        """Позволяет открыть следующую сессию после подтверждённого отключения."""
        if self.by_account.get(entry.account_id) is entry:
            self.by_account.pop(entry.account_id)
            self.by_fingerprint.pop(entry.fingerprint)

    async def _disconnect(self, entry, forget=True):
        """При ошибке отключения оставляет авторизацию зарезервированной."""
        try:
            if not entry.invalid or entry.ready:
                await asyncio.wait_for(entry.client.disconnect(), timeout=10)
            detach_events(entry.client)
        except Exception:
            raise BrokerError("DISCONNECT_FAILED", "Не удалось отключить аккаунт", 503) from None
        entry.ready = False
        if forget:
            self._forget(entry)

    async def _connect(self, entry):
        """Открывает ровно одно соединение и проверяет, что ключ авторизован."""
        if entry.ready and entry.client.is_connected():
            return
        try:
            await asyncio.wait_for(entry.client.connect(), timeout=15)
            authorized = await asyncio.wait_for(entry.client.is_user_authorized(), timeout=10)
            if not authorized:
                raise BrokerError("NOT_AUTHORIZED", "Необходимо заново авторизовать аккаунт", 409)
            entry.ready = True
            attach_events(entry.client)
        except BaseException:
            entry.ready = False
            entry.closing = True
            await self._disconnect(entry)
            raise

    async def execute(self, account_id, fingerprint, config_fingerprint, config, operation):
        """Выполняет запрос на том же клиенте, удерживая его до окончания запроса."""
        entry = self._entry(account_id, fingerprint, config_fingerprint, config)
        async with admission(entry, lambda: self.closed):
            await self._connect(entry)
            entry.users += 1
            entry.idle.clear()
        try:
            return await operation(entry.client)
        except FloodWaitError as error:
            entry.cooldown_until = max(entry.cooldown_until, asyncio.get_running_loop().time() + error.seconds)
            raise
        except (AuthKeyDuplicatedError, AuthKeyUnregisteredError, SessionRevokedError):
            entry.invalid = entry.closing = True
            raise
        finally:
            entry.users -= 1
            if not entry.users:
                entry.idle.set()
                if entry.invalid:
                    async with entry.lock:
                        if entry.ready:
                            await self._disconnect(entry, forget=False)

    async def disconnect(self, account_id):
        """Дожидается запросов аккаунта и закрывает только его соединение."""
        entry = self.by_account.get(account_id)
        if not entry:
            return False
        entry.closing = True
        async with entry.lock:
            if self.by_account.get(account_id) is not entry:
                return True
            await entry.idle.wait()
            await self._disconnect(entry)
        return True

    async def close(self):
        """Запрещает новые запросы и освобождает все принадлежащие сервису клиенты."""
        self.closed = True
        results = await asyncio.gather(
            *(self.disconnect(account_id) for account_id in tuple(self.by_account)),
            return_exceptions=True,
        )
        if any(isinstance(result, BaseException) for result in results):
            raise BrokerError("SHUTDOWN_FAILED", "Не все аккаунты отключились штатно", 503)
