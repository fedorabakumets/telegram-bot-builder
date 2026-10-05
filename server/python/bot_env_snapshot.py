"""
@fileoverview Словарь переменных одного бота для обёртки os.environ.

worker.py передаёт этот словарь в register и не пишет его в базу процесса:
копия ctx.env или .env плюс BOT_TOKEN, TOKEN_ID, WEBHOOK_URL, WEBHOOK_PORT.
Секреты сервера сюда не добавляются. DATABASE_URL и REDIS_URL приходят уже
внутри ctx.env или .env конкретного бота.
"""

from __future__ import annotations

from pathlib import Path
from typing import Dict, Optional


def bot_env_values(
    token: str,
    token_id: int,
    webhook_url: Optional[str],
    webhook_port: Optional[int],
    inline: Optional[Dict[str, str]],
    bot_dir: Path,
) -> Dict[str, str]:
    """
    Собирает переменные бота для register.
    @param token - токен Telegram
    @param token_id - идентификатор токена
    @param webhook_url - URL вебхука или пусто
    @param webhook_port - порт или None (тогда 9000 + token_id)
    @param inline - переменные команды start_bot; None — читать .env бота
    @param bot_dir - каталог бота
    @returns словарь имени к значению
    """
    values = dict(inline) if inline is not None else _read_dotenv(bot_dir)
    values["BOT_TOKEN"] = token
    values["TOKEN_ID"] = str(token_id)
    values["WEBHOOK_PORT"] = str(webhook_port or (9000 + token_id))
    if webhook_url:
        values["WEBHOOK_URL"] = webhook_url
    else:
        values.pop("WEBHOOK_URL", None)
    return values


def _read_dotenv(bot_dir: Path) -> Dict[str, str]:
    """
    Читает .env бота.
    @param bot_dir - каталог бота
    @returns пары с непустыми значениями; нет файла — пустой словарь
    """
    env_file = bot_dir / ".env"
    if not env_file.is_file():
        return {}
    from dotenv import dotenv_values

    loaded = dotenv_values(env_file)
    return {k: v for k, v in loaded.items() if k is not None and v is not None}
