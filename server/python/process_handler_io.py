"""@fileoverview Ограниченный и безопасный обмен с временным обработчиком."""

import asyncio
import json
import os
import re

FRAME_LIMIT = 65536


def child_environment():
    """Передаёт только системные настройки запуска, исключая секреты панели."""
    allowed = ("PATH", "SYSTEMROOT", "WINDIR", "TEMP", "TMP", "HOME",
               "USERPROFILE", "HOMEDRIVE", "HOMEPATH", "APPDATA", "LOCALAPPDATA",
               "LANG", "LC_ALL", "SSL_CERT_FILE", "SSL_CERT_DIR")
    return {**{key: os.environ[key] for key in allowed if key in os.environ},
            "PYTHONIOENCODING": "utf-8", "PYTHONUNBUFFERED": "1"}


def redact(content, secrets):
    """Убирает секреты и ограничивает размер строки перед журналированием."""
    text = str(content)
    for secret in sorted(secrets, key=len, reverse=True):
        if secret:
            text = text.replace(secret, "[скрыто]")
    text = re.sub(r"\d{5,}:[A-Za-z0-9_-]{20,}", "[скрыто]", text)
    return text[:4096]


async def drain(stream, token_id, log, secrets, events, stdout=False, on_ready=None):
    """Читает ограниченные строки; переполнение протокола прерывает обработчик."""
    while True:
        try:
            line = await stream.readline()
        except (ValueError, asyncio.LimitOverrunError) as error:
            raise RuntimeError("Обработчик превысил размер строки протокола") from error
        if not line:
            return
        content = line.decode("utf-8", errors="replace").rstrip()
        if stdout:
            try:
                frame = json.loads(content)
            except (ValueError, TypeError):
                frame = None
            if isinstance(frame, dict):
                if frame.get("type") == "process":
                    event = frame.get("event")
                    if event in ("ready", "idle", "error"):
                        events.add(event)
                    if event in ("boot", "ready") and on_ready and isinstance(frame.get("pid"), int):
                        on_ready(frame["pid"])
                    continue
                if frame.get("type") == "system":
                    continue
                if frame.get("type") in ("stdout", "stderr"):
                    log(token_id, frame["type"], redact(frame.get("content", ""), secrets))
                    continue
        log(token_id, "stdout" if stdout else "stderr", redact(content, secrets))
