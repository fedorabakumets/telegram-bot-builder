"""
@fileoverview Ленивая сборка моделей pydantic для aiogram внутри воркера.

aiogram при импорте вызывает model_rebuild() у всех ~590 моделей (типы и методы Bot API),
что сразу строит валидаторы pydantic-core и стоит ~100 МБ RSS. Бот реально использует
несколько десятков моделей, поэтому сборку откладываем до первого использования.
Экспортируемый код ботов не меняется — патч применяется только в процессе воркера.
Опирается на внутренности pydantic 2.x; отключается через AIOGRAM_LAZY_MODELS=false.
"""
from __future__ import annotations

import os
import sys
from typing import Any, Dict


def is_enabled() -> bool:
    """
    Проверяет, включена ли ленивая сборка
    @returns False, если AIOGRAM_LAZY_MODELS=false/0/no
    """
    return os.environ.get("AIOGRAM_LAZY_MODELS", "true").lower() not in ("false", "0", "no")


def enable() -> bool:
    """
    Импортирует aiogram с отложенной сборкой моделей pydantic
    @returns True, если патч применён; False при ошибке или если aiogram уже импортирован
    """
    if not is_enabled() or "aiogram" in sys.modules:
        return False
    try:
        import pydantic
        from pydantic._internal import _config
    except ImportError:
        return False

    orig = pydantic.BaseModel.model_rebuild.__func__
    captured: Dict[str, Any] = {}

    @classmethod
    def _lazy(cls, *args, _types_namespace=None, **kwargs):
        """Запоминает namespace forward-ссылок вместо построения схемы"""
        if _types_namespace is not None:
            captured.update(_types_namespace)
            cls.__pydantic_parent_namespace__ = {**(cls.__pydantic_parent_namespace__ or {}), **_types_namespace}
        return None

    prev_defer = _config.config_defaults.get("defer_build", False)
    _config.config_defaults["defer_build"] = True
    pydantic.BaseModel.model_rebuild = _lazy
    try:
        import aiogram.methods
        import aiogram.types  # noqa: F401
        from aiogram import Bot, Dispatcher  # noqa: F401
    except Exception:
        return False
    finally:
        pydantic.BaseModel.model_rebuild = classmethod(orig)
        _config.config_defaults["defer_build"] = prev_defer

    # Методы ссылаются на типы из TYPE_CHECKING-импортов — даём им тот же namespace
    for name in aiogram.methods.__all__:
        cls = getattr(aiogram.methods, name, None)
        if isinstance(cls, type) and issubclass(cls, pydantic.BaseModel):
            cls.__pydantic_parent_namespace__ = {**captured, **(cls.__pydantic_parent_namespace__ or {})}
    return True
