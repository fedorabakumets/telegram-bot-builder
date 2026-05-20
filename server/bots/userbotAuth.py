"""
@fileoverview Скрипт авторизации Telethon userbot через stdin/stdout JSON-протокол.
Принимает команды: send_code, sign_in, sign_in_2fa, disconnect.
Возвращает JSON-ответы с результатом.
"""

import sys
import json
import asyncio
from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.errors import (
    SessionPasswordNeededError,
    PhoneCodeInvalidError,
    PhoneCodeExpiredError,
    PasswordHashInvalidError,
    FloodWaitError,
)


client = None
phone_hash = None


async def handle_send_code(data):
    """
    Отправляет код авторизации на номер телефона.
    @param data - словарь с api_id, api_hash, phone
    @returns результат с phone_code_hash
    """
    global client, phone_hash

    api_id = int(data["api_id"])
    api_hash = data["api_hash"]
    phone = data["phone"]

    client = TelegramClient(StringSession(), api_id, api_hash)
    await client.connect()

    result = await client.send_code_request(phone)
    phone_hash = result.phone_code_hash

    return {"ok": True, "phone_code_hash": phone_hash}


async def handle_sign_in(data):
    """
    Авторизуется по коду из SMS/Telegram.
    @param data - словарь с phone, code
    @returns session_string или запрос 2FA
    """
    global client, phone_hash

    phone = data["phone"]
    code = data["code"]

    try:
        await client.sign_in(phone, code, phone_code_hash=phone_hash)
        session_string = client.session.save()
        return {"ok": True, "session_string": session_string}
    except SessionPasswordNeededError:
        return {"ok": True, "needs_2fa": True}
    except PhoneCodeInvalidError:
        return {"ok": False, "error": "invalid_code", "message": "Неверный код"}
    except PhoneCodeExpiredError:
        return {"ok": False, "error": "code_expired", "message": "Код истёк, запросите новый"}


async def handle_sign_in_2fa(data):
    """
    Авторизуется по паролю двухфакторной аутентификации.
    @param data - словарь с password
    @returns session_string
    """
    global client

    password = data["password"]

    try:
        await client.sign_in(password=password)
        session_string = client.session.save()
        return {"ok": True, "session_string": session_string}
    except PasswordHashInvalidError:
        return {"ok": False, "error": "invalid_password", "message": "Неверный пароль"}


async def handle_disconnect():
    """Отключает клиент."""
    global client
    if client:
        await client.disconnect()
    return {"ok": True}


async def main():
    """Основной цикл: читает JSON-команды из stdin, выполняет, пишет ответ в stdout."""
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            print(json.dumps({"ok": False, "error": "parse_error"}), flush=True)
            continue

        action = msg.get("action")
        data = msg.get("data", {})

        try:
            if action == "send_code":
                result = await handle_send_code(data)
            elif action == "sign_in":
                result = await handle_sign_in(data)
            elif action == "sign_in_2fa":
                result = await handle_sign_in_2fa(data)
            elif action == "disconnect":
                result = await handle_disconnect()
                print(json.dumps(result), flush=True)
                break
            else:
                result = {"ok": False, "error": "unknown_action"}
        except FloodWaitError as e:
            result = {"ok": False, "error": "flood_wait", "message": f"Подождите {e.seconds} секунд"}
        except Exception as e:
            result = {"ok": False, "error": "exception", "message": str(e)}

        print(json.dumps(result, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    asyncio.run(main())
