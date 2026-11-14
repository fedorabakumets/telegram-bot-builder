"""@fileoverview Числовое состояние уже загруженных моделей и кеша событий aiogram."""
import functools
import sys
import types
from itertools import islice

LIMIT = 2048


def snapshot():
    """Читает готовые классы без импорта aiogram, сборки схем и изменения кешей."""
    result = {"aiogramVersion": None, "updateEventTypePatchActive": None,
              "updateEventTypeLruPresent": None, "updateEventTypeLru": None}
    package = sys.modules.get("aiogram")
    if isinstance(package, types.ModuleType):
        version = vars(package).get("__version__")
        result["aiogramVersion"] = version if isinstance(version, str) else None
    for suffix, module_name in (("Types", "aiogram.types"), ("Methods", "aiogram.methods")):
        module = sys.modules.get(module_name)
        values = vars(module) if isinstance(module, types.ModuleType) else {}
        classes = {id(value): value for value in islice(values.values(), LIMIT)
                   if isinstance(value, type) and value.__module__.startswith("aiogram.")}
        result["exportedAiogram" + suffix] = len(classes)
        result["builtExportedAiogram" + suffix] = sum(
            vars(value).get("__pydantic_complete__") is True for value in classes.values())
        result["aiogram" + suffix + "Truncated"] = len(values) > LIMIT
    module = sys.modules.get("aiogram.types.update")
    update = vars(module).get("Update") if isinstance(module, types.ModuleType) else None
    descriptor = vars(update).get("event_type") if isinstance(update, type) else None
    if isinstance(descriptor, property):
        getter = descriptor.fget
        result["updateEventTypePatchActive"] = (
            vars(getter).get("_tbb_uncached_update_event_type") is True
            if hasattr(getter, "__dict__") else False)
        cached = isinstance(getter, functools._lru_cache_wrapper)
        result["updateEventTypeLruPresent"] = cached
        if cached:
            info = getter.cache_info()
            result["updateEventTypeLru"] = {"size": info.currsize, "maxsize": info.maxsize,
                                          "hits": info.hits, "misses": info.misses}
    return result
