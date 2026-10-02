"""
Обёртка os.environ в процессе воркера.

Пока current_token_id указывает на бота, чтение видит его словарь поверх базы
(ключи бота важнее). Запись из задачи бота не меняет окружение процесса.
При current_token_id == 0 словари ботов скрыты.
os.getenv в CPython делает environ.get — подмены os.environ достаточно.
"""

from __future__ import annotations

import os
from collections.abc import Iterator, MutableMapping
from typing import Dict, Optional

import worker_isolation as iso

# Настоящий os.environ до подмены. None — обёртка ещё не стоит.
_base: Optional[MutableMapping[str, str]] = None
# token_id → переменные этого бота
_bots: Dict[int, Dict[str, str]] = {}


def install() -> None:
    """Один раз подменяет os.environ обёрткой и запоминает базу процесса."""
    global _base
    if isinstance(os.environ, BotEnvironOverlay):
        return
    _base = os.environ
    os.environ = BotEnvironOverlay()


def get_base_environ() -> MutableMapping[str, str]:
    """
    Возвращает окружение процесса без словарей ботов.
    @returns базовый mapping; до install это сам os.environ
    """
    if _base is not None:
        return _base
    return os.environ


def register(token_id: int, values: Dict[str, str]) -> None:
    """
    Кладёт копию переменных бота в реестр.
    @param token_id - идентификатор токена
    @param values - имя → значение
    """
    _bots[token_id] = dict(values)


def unregister(token_id: int) -> None:
    """
    Убирает словарь бота из реестра.
    @param token_id - идентификатор токена
    """
    _bots.pop(token_id, None)


def _bot_dict() -> Optional[Dict[str, str]]:
    """
    Словарь текущего бота.
    @returns None для кода воркера и для незарегистрированного token_id
    """
    token_id = iso.current_token_id.get()
    if not token_id:
        return None
    return _bots.get(token_id)


def _view() -> Dict[str, str]:
    """
    База плюс словарь бота.
    @returns копия; ключи бота перекрывают базу
    """
    merged = dict(get_base_environ())
    bot = _bot_dict()
    if bot:
        merged.update(bot)
    return merged


class BotEnvironOverlay(MutableMapping[str, str]):
    """Чтение с оверлеем бота. Запись бота не попадает в окружение процесса."""

    def __getitem__(self, key: str) -> str:
        """Значение бота или, если ключа нет, базы."""
        bot = _bot_dict()
        if bot is not None and key in bot:
            return bot[key]
        return get_base_environ()[key]

    def __setitem__(self, key: str, value: str) -> None:
        """Пишет в словарь бота либо в базу, если текущего бота нет."""
        bot = _bot_dict()
        if bot is not None:
            bot[key] = value
            return
        get_base_environ()[key] = value

    def __delitem__(self, key: str) -> None:
        """Удаляет ключ из словаря бота либо из базы."""
        bot = _bot_dict()
        if bot is not None:
            del bot[key]
            return
        del get_base_environ()[key]

    def __iter__(self) -> Iterator[str]:
        """Ключи объединённого вида."""
        return iter(_view())

    def __len__(self) -> int:
        """Число ключей объединённого вида."""
        return len(_view())

    def copy(self) -> Dict[str, str]:
        """Копия объединённого вида."""
        return _view()

    def items(self):
        """Пары объединённого вида; ключи бота побеждают базу."""
        return _view().items()

    def keys(self):
        """Ключи объединённого вида."""
        return _view().keys()

    def values(self):
        """Значения объединённого вида."""
        return _view().values()

    def pop(self, key: str, *default: str):
        """У текущего бота удаляет ключ только из его словаря."""
        bot = _bot_dict()
        if bot is None:
            base = get_base_environ()
            if default:
                return base.pop(key, default[0])
            return base.pop(key)
        if key in bot:
            return bot.pop(key)
        if default:
            return default[0]
        raise KeyError(key)
