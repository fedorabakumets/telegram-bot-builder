"""@fileoverview Локальный HTTP-сервис одного Telethon-клиента на авторизацию."""

import asyncio
import hmac

from aiohttp import web
from telethon.errors import AuthKeyDuplicatedError, AuthKeyUnregisteredError, FloodWaitError, RPCError, SessionRevokedError

from telethon_broker_blocks import BlockedAccounts
from telethon_broker_clients import BrokerError, TelethonClientBroker
from telethon_broker_config import account_id, create_client, parse_config
from telethon_broker_operations import OPERATIONS
from telethon_broker_profile import read_profile
from telethon_broker_stdin import request_broker_shutdown
from telethon_broker_health import readiness_handler


def build_app(secret, factory=create_client, config_parser=parse_config, blocked_accounts=None, ownership=None):
    """Создаёт локальный сервис; фабрика и разбор конфигурации заменяемы в тестах."""
    if len(secret.encode()) < 32:
        raise ValueError("Для брокера нужен внутренний секрет длиной не менее 32 байт")
    if factory is create_client and ownership is None:
        raise ValueError("Настоящий клиент Telegram требует распределённого владельца")
    expected = f"Bearer {secret}".encode()
    broker = TelethonClientBroker(factory)
    blocked = blocked_accounts if blocked_accounts is not None else BlockedAccounts()

    @web.middleware
    async def guard(request, handler):
        """Сверяет секрет и преобразует ошибки в ответы без приватных данных."""
        if request.path == "/healthz" and request.method in ("GET", "HEAD"):
            return await handler(request)
        actual = request.headers.get("Authorization", "").encode()
        if not hmac.compare_digest(actual, expected):
            return web.json_response({"code": "UNAUTHORIZED", "message": "Нет доступа"}, status=401)
        try:
            if ownership:
                try:
                    await ownership.check()
                except Exception:
                    await broker.close()
                    raise BrokerError("BROKER_UNAVAILABLE", "Владение Telegram-сессиями не подтверждено", 503)
            async with asyncio.timeout(55):
                return await handler(request)
        except BrokerError as error:
            return web.json_response({"code": error.code, "message": str(error)}, status=error.status)
        except AuthKeyDuplicatedError:
            return web.json_response(
                {"code": "AUTH_KEY_DUPLICATED", "message": "Telegram аннулировал одновременно открытые сессии"},
                status=409,
            )
        except (AuthKeyUnregisteredError, SessionRevokedError):
            return web.json_response(
                {"code": "SESSION_REVOKED", "message": "Telegram завершил авторизацию аккаунта"}, status=409,
            )
        except FloodWaitError:
            return web.json_response(
                {"code": "FLOOD_WAIT", "message": "Telegram ограничил частоту запросов"}, status=429,
            )
        except TimeoutError:
            return web.json_response(
                {"code": "BROKER_TIMEOUT", "message": "Операция аккаунта не завершилась вовремя"}, status=504,
            )
        except web.HTTPException:
            raise
        except (OSError, RPCError):
            return web.json_response(
                {"code": "TELEGRAM_FAILED", "message": "Запрос к Telegram завершился ошибкой"}, status=502,
            )
        except Exception:
            return web.json_response(
                {"code": "BROKER_FAILED", "message": "Операция аккаунта не выполнена"}, status=500,
            )

    async def body(request):
        """Принимает только объект JSON ограниченного размера."""
        try:
            value = await request.json()
        except (ValueError, UnicodeError):
            raise BrokerError("INVALID_BODY", "Некорректный JSON") from None
        if not isinstance(value, dict):
            raise BrokerError("INVALID_BODY", "Ожидался объект JSON")
        return value

    async def use_client(document, operation):
        """Находит владельца авторизации и выполняет типизированное действие."""
        session_account_id = account_id(document)
        if session_account_id in blocked:
            raise BrokerError("ACCOUNT_BLOCKED", "Подключение аккаунта заблокировано", 409)
        fingerprint, config_fingerprint, config = await config_parser(document)
        if session_account_id in blocked:
            raise BrokerError("ACCOUNT_BLOCKED", "Подключение аккаунта заблокировано", 409)
        return await broker.execute(session_account_id, fingerprint, config_fingerprint, config, operation)

    async def execute(request):
        """Выполняет только разрешённые операции Telethon с проверенными аргументами."""
        document = await body(request)
        name, args = document.get("operation"), document.get("args", {})
        if not isinstance(name, str) or name not in OPERATIONS:
            raise BrokerError("UNSUPPORTED_OPERATION", "Операция аккаунта не поддерживается")
        if not isinstance(args, dict):
            raise BrokerError("INVALID_ARGS", "Ожидался объект аргументов")
        result = await use_client(document, lambda client: OPERATIONS[name](client, args))
        return web.json_response({"result": result})

    async def verify(request):
        """Проверяет сессию и возвращает только данные для карточки аккаунта."""
        document = await body(request)
        return web.json_response({"result": await use_client(document, lambda client: read_profile(client, document))})

    async def disconnect(request):
        """Освобождает соединение при изменении конфигурации или отключении аккаунта."""
        document = await body(request)
        target = account_id(document)
        block = document.get("block") is True
        if block:
            blocked.add(target)
        result = await broker.disconnect(target)
        return web.json_response({"result": {"disconnected": result or block}})

    async def close(_app):
        """Закрывает активные соединения при завершении HTTP-сервиса."""
        if ownership:
            await ownership.stop(broker.close)
        else:
            await broker.close()

    async def start(_app):
        """Запрещает приём запросов до подтверждения единственного владельца."""
        if ownership:
            await ownership.acquire()
            ownership.watch(broker.close, request_broker_shutdown)

    app = web.Application(middlewares=[guard], client_max_size=64 * 1024)
    app.add_routes([web.get("/healthz", readiness_handler(broker, ownership)),
                    web.post("/v1/execute", execute), web.post("/v1/verify", verify),
                    web.post("/v1/disconnect", disconnect)])
    app.on_cleanup.append(close)
    app.on_startup.append(start)
    return app


if __name__ == "__main__":
    from telethon_broker_startup import main
    main()
