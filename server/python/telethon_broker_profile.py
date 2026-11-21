"""@fileoverview Ограниченная выдача профиля Telegram без передачи авторизационных данных."""

import base64

from telethon_broker_clients import BrokerError


async def read_profile(client, document):
    """Добавляет номер и небольшой JPEG только по явному запросу профиля."""
    user = await client.get_me()
    if not user:
        raise BrokerError("NOT_AUTHORIZED", "Необходимо заново авторизовать аккаунт", 409)
    phone = user.phone
    result = {
        "authorized": True, "id": str(user.id), "firstName": user.first_name, "lastName": user.last_name,
        "username": user.username, "maskedPhone": f"+••• •• {phone[-2:]}" if phone else None,
    }
    if document.get("includeProfile") is True:
        result["phone"] = f"+{phone}" if phone else None
        avatar = await client.download_profile_photo(user, file=bytes, download_big=False)
        result["avatar"] = (base64.b64encode(avatar).decode("ascii")
                            if avatar and len(avatar) <= 256 * 1024 and avatar.startswith(b"\xff\xd8\xff") else None)
    return result
