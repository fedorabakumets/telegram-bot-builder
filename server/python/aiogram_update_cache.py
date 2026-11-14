"""@fileoverview Устраняет удержание Update и контекстов ботов глобальным LRU aiogram."""

import functools
import inspect


def apply() -> bool:
    """Заменяет только известный кеширующий getter aiogram 3.31.0 чистой функцией.

    Проверка типа события дешева; глобальный кеш по self удерживает сам Update,
    привязанный Bot и замыкания сценария после его выгрузки. Модели не очищаются.
    Неизвестная версия или сторонняя замена свойства остаются без изменений.
    @returns True при установленной или уже применённой совместимой замене.
    """
    import aiogram
    from aiogram.types import Update

    descriptor = vars(Update).get("event_type")
    if not isinstance(descriptor, property):
        return False
    getter = descriptor.fget
    if getattr(getter, "_tbb_uncached_update_event_type", False):
        return True
    if aiogram.__version__ != "3.31.0":
        return False
    if not isinstance(getter, functools._lru_cache_wrapper):
        return False
    original = getattr(getter, "__wrapped__", None)
    if not inspect.isfunction(original):
        return False
    if (original.__module__ != "aiogram.types.update"
            or original.__qualname__ != "Update.event_type"
            or tuple(inspect.signature(original).parameters) != ("self",)
            or getter.cache_parameters() != {"maxsize": 128, "typed": False}):
        return False
    # Очистка выполняется только при установке, а не при сне каждого бота.
    getter.cache_clear()
    original._tbb_uncached_update_event_type = True
    Update.event_type = property(original, descriptor.fset, descriptor.fdel, descriptor.__doc__)
    return True
