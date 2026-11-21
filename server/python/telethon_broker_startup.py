"""@fileoverview Проверка окружения и запуск единственного брокера Telegram-аккаунтов."""

import ipaddress
import os

from aiohttp import web

from telethon_broker_blocks import BlockedAccounts
from telethon_broker_ownership import create_ownership
from telethon_broker_process_lock import broker_process_lock
from telethon_broker_stdin import enable_stdin_shutdown


def report_ready(_message):
    """Сообщает родителю о готовности после startup и привязки сокета самим aiohttp."""
    print("TELETHON_BROKER_READY", flush=True)


def listen_address(env):
    """Разрешает сетевой адрес только при явном выборе доверенной приватной сети."""
    host = env.get("TELETHON_BROKER_HOST", "127.0.0.1")
    if not ipaddress.ip_address(host).is_loopback and env.get("TELETHON_BROKER_ALLOW_PRIVATE_NETWORK") != "1":
        raise ValueError("Сетевой брокер требует TELETHON_BROKER_ALLOW_PRIVATE_NETWORK=1 и приватную сеть")
    port = int(env.get("TELETHON_BROKER_PORT") or env.get("PORT") or "8765")
    if not 1 <= port <= 65535:
        raise ValueError("Недопустимый порт брокера")
    return host, port


def listen_hosts(host):
    """Открывает IPv4 для healthcheck и IPv6 для приватной сети без изменения loopback-режима."""
    return ["0.0.0.0", "::"] if host == "::" else host


def main():
    """Запускает брокер только после локальной и распределённой проверки владения."""
    from telethon_account_broker import build_app
    host, port = listen_address(os.environ)
    lock_file = os.environ["TELETHON_BROKER_LOCK_FILE"]
    with broker_process_lock(lock_file):
        app = build_app(os.environ["TELETHON_BROKER_SECRET"],
                        blocked_accounts=BlockedAccounts(f"{lock_file}.blocked"),
                        ownership=create_ownership(os.environ.get("REDIS_URL")))
        if os.environ.get("TELETHON_BROKER_STDIN_CONTROL") == "1":
            app.on_startup.append(enable_stdin_shutdown)
        web.run_app(app, host=listen_hosts(host), port=port, access_log=None, print=report_ready)
