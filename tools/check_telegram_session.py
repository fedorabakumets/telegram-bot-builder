"""
@fileoverview Проверка подключения к Telegram через локальную Telethon-сессию
@module tools/check_telegram_session
"""

import asyncio
import os

from telethon import TelegramClient


async def main() -> None:
    """
    Проверяет локальную сессию и выводит имя авторизованного аккаунта.
    """
    api_id = os.environ.get("TELEGRAM_API_ID")
    api_hash = os.environ.get("TELEGRAM_API_HASH")
    session_path = os.environ.get("TELEGRAM_SESSION_PATH")
    if not all((api_id, api_hash, session_path)):
        raise SystemExit("Задайте TELEGRAM_API_ID, TELEGRAM_API_HASH и TELEGRAM_SESSION_PATH.")
    client = TelegramClient(session_path, int(api_id), api_hash)
    await client.connect()
    try:
        if not await client.is_user_authorized():
            print("Сессия не авторизована.")
            return
        account = await client.get_me()
        print(f"Подключено: id={account.id}, username={account.username or 'нет'}")
    finally:
        await client.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
