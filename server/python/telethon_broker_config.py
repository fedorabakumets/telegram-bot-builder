"""@fileoverview Проверка адресов и учётных данных подключения Telethon."""

import asyncio
import hashlib
import ipaddress
import json
import re
import socket

from telethon import TelegramClient
from telethon.sessions import StringSession

from telethon_broker_clients import BrokerError


# Диапазоны центров данных опубликованы в https://core.telegram.org/resources/cidr.txt.
_TELEGRAM_NETWORKS = tuple(ipaddress.ip_network(value) for value in (
    "91.108.56.0/22", "91.108.4.0/22", "91.108.8.0/22", "91.108.16.0/22",
    "91.108.12.0/22", "149.154.160.0/20", "91.105.192.0/23", "91.108.20.0/22", "185.76.151.0/24",
    "2001:b28:f23d::/48", "2001:b28:f23f::/48", "2001:67c:4e8::/48", "2001:b28:f23c::/48", "2a0a:f280::/32",
))


def account_id(document):
    """Читает идентификатор аккаунта без преобразования произвольных объектов."""
    value = document.get("accountId")
    if type(value) is int and value > 0:
        return str(value)
    if isinstance(value, str) and re.fullmatch(r"[A-Za-z0-9_-]{1,80}", value):
        return value
    raise BrokerError("INVALID_ACCOUNT_ID", "Некорректный идентификатор аккаунта")


def _public_address(value):
    """Проверяет публичность адреса, включая IPv4, вложенный в IPv6."""
    address = ipaddress.ip_address(value)
    if isinstance(address, ipaddress.IPv6Address) and address.ipv4_mapped:
        address = address.ipv4_mapped
    if not address.is_global or address.is_multicast or address.is_reserved:
        raise ValueError("Ожидался публичный адрес")
    return str(address)


async def _proxy(value):
    """Нормализует параметры прокси и привязывает DNS к проверенному адресу."""
    if value is None or value is False:
        return None
    if not isinstance(value, dict):
        raise BrokerError("INVALID_PROXY", "Некорректное описание прокси")
    if value.get("enabled", True) is False:
        return None
    protocol, host, port = value.get("type"), value.get("host"), value.get("port")
    if protocol not in ("socks5", "http") or not isinstance(host, str) or not 1 <= len(host) <= 253:
        raise BrokerError("INVALID_PROXY", "Укажите поддерживаемый тип и адрес прокси")
    try:
        if type(port) not in (int, str):
            raise ValueError()
        port = int(port)
        if not 1 <= port <= 65535:
            raise ValueError()
        records = await asyncio.wait_for(
            asyncio.get_running_loop().getaddrinfo(host, port, type=socket.SOCK_STREAM), timeout=3,
        )
        addresses = sorted({_public_address(record[4][0]) for record in records})
        if not addresses:
            raise ValueError()
    except (OSError, ValueError, TimeoutError):
        raise BrokerError("INVALID_PROXY", "Прокси должен иметь доступный публичный адрес и допустимый порт") from None
    options = {"proxy_type": protocol, "addr": addresses[0], "port": port}
    for field in ("username", "password"):
        credential = value.get(field)
        if credential is not None:
            if not isinstance(credential, str) or len(credential) > 255:
                raise BrokerError("INVALID_PROXY", "Некорректные данные для доступа к прокси")
            options[field] = credential
    return options


async def parse_config(document):
    """Разбирает сессию и получает устойчивый отпечаток самого ключа авторизации."""
    api_id, api_hash = document.get("apiId"), document.get("apiHash")
    value = document.get("sessionString")
    if not isinstance(value, str) or not 1 <= len(value) <= 1024:
        raise BrokerError("INVALID_SESSION", "Передайте сессию Telethon")
    try:
        if type(api_id) not in (int, str):
            raise ValueError()
        api_id = int(api_id)
        if not 0 < api_id < 2**31 or not isinstance(api_hash, str) or not re.fullmatch(r"[0-9a-fA-F]{32}", api_hash):
            raise ValueError()
    except (TypeError, ValueError):
        raise BrokerError("INVALID_API", "Некорректные API ID или API Hash") from None
    try:
        session = StringSession(value)
        key = session.auth_key.key
        address = ipaddress.ip_address(session.server_address)
        if not key or not 1 <= session.dc_id <= 5 or session.port != 443:
            raise ValueError()
        if not any(address in network for network in _TELEGRAM_NETWORKS):
            raise ValueError()
    except Exception:
        raise BrokerError("INVALID_SESSION", "Сессия Telethon недействительна") from None
    proxy = await _proxy(document.get("proxy"))
    fingerprint = hashlib.sha256(key).hexdigest()
    config_values = [value, api_id, api_hash, document.get("proxy")]
    config_fingerprint = hashlib.sha256(json.dumps(config_values, sort_keys=True).encode()).hexdigest()
    return fingerprint, config_fingerprint, (session, api_id, api_hash, proxy)


def create_client(config):
    """Создаёт клиента из проверенных входных параметров."""
    session, api_id, api_hash, proxy = config
    return TelegramClient(
        session, api_id, api_hash, proxy=proxy, timeout=10,
        request_retries=0, connection_retries=1, flood_sleep_threshold=0,
    )
