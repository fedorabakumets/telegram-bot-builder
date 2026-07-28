"""
Изоляция ботов внутри worker-процесса: contextvars, уникальные модули, env-lock.

Контракт system-событий (stdout JSON type=system):
  worker_ready | bot_started:{token_id} | bot_exited:{token_id}:{status}
  bot_stopped:{token_id} | shutting_down | worker_exited | stdin_closed
"""

from __future__ import annotations

import contextvars
import importlib.util
import os
import sys
import types
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Set

# Текущий token_id для root-logger (на задачу asyncio)
current_token_id: contextvars.ContextVar[int] = contextvars.ContextVar(
    "worker_current_token_id", default=0
)

# Сериализация мутаций os.environ при загрузке бота
_env_lock = None


def get_env_lock():
    """Ленивый asyncio.Lock для подмены env при exec."""
    global _env_lock
    import asyncio

    if _env_lock is None:
        _env_lock = asyncio.Lock()
    return _env_lock


def module_prefix(token_id: int) -> str:
    """Префикс имён модулей бота в sys.modules."""
    return f"bot_{token_id}_"


def install_bot_package(token_id: int, bot_dir: Path) -> str:
    """
    Регистрирует пакет bot_{id}_pkg с уникальным __path__ = bot_dir.
    @returns имя пакета
    """
    pkg_name = f"bot_{token_id}_pkg"
    if pkg_name in sys.modules:
        return pkg_name
    pkg = types.ModuleType(pkg_name)
    pkg.__path__ = [str(bot_dir)]  # type: ignore[attr-defined]
    pkg.__package__ = pkg_name
    sys.modules[pkg_name] = pkg
    return pkg_name


def load_sibling_modules(token_id: int, bot_dir: Path, names: Iterable[str]) -> Dict[str, Any]:
    """
    Грузит локальные модули (config, utils, …) под уникальными именами
    и кладёт алиасы коротких имён только на время exec через sys.modules snapshot.
    @returns карта short_name → module
    """
    loaded: Dict[str, Any] = {}
    prefix = module_prefix(token_id)
    for name in names:
        path = bot_dir / f"{name}.py"
        if not path.is_file():
            continue
        unique = f"{prefix}{name}"
        spec = importlib.util.spec_from_file_location(unique, path)
        if spec is None or spec.loader is None:
            continue
        mod = importlib.util.module_from_spec(spec)
        sys.modules[unique] = mod
        # Короткое имя — чтобы `import config` в bot.py резолвился в наш модуль
        # Сохраняем предыдущий и восстановим после exec
        spec.loader.exec_module(mod)
        loaded[name] = mod
    return loaded


def apply_short_aliases(loaded: Dict[str, Any], previous: Dict[str, Any]) -> None:
    """Ставит короткие имена в sys.modules, previous[name]=старое или None."""
    for name, mod in loaded.items():
        previous[name] = sys.modules.get(name)
        sys.modules[name] = mod


def restore_short_aliases(previous: Dict[str, Any]) -> None:
    """Восстанавливает короткие имена sys.modules после exec."""
    for name, old in previous.items():
        if old is None:
            sys.modules.pop(name, None)
        else:
            sys.modules[name] = old


def cleanup_bot_modules(token_id: int, bot_dir: Optional[Path] = None) -> None:
    """Удаляет модули бота из sys.modules и путь пакета."""
    prefix = module_prefix(token_id)
    pkg_name = f"bot_{token_id}_pkg"
    to_del = [k for k in list(sys.modules.keys()) if k == pkg_name or k.startswith(prefix)]
    for k in to_del:
        del sys.modules[k]
    if bot_dir is not None:
        bot_dir_s = str(bot_dir)
        while bot_dir_s in sys.path:
            sys.path.remove(bot_dir_s)


def apply_bot_env(token: str, token_id: int, webhook_url: Optional[str], webhook_port: Optional[int]) -> Dict[str, Optional[str]]:
    """
    Пишет per-bot env. Возвращает снимок прежних значений для restore.
    """
    keys = ("BOT_TOKEN", "TOKEN_ID", "WEBHOOK_URL", "WEBHOOK_PORT")
    prev = {k: os.environ.get(k) for k in keys}
    os.environ["BOT_TOKEN"] = token
    os.environ["TOKEN_ID"] = str(token_id)
    if webhook_url:
        os.environ["WEBHOOK_URL"] = webhook_url
        os.environ["WEBHOOK_PORT"] = str(webhook_port or (9000 + token_id))
    else:
        os.environ.pop("WEBHOOK_URL", None)
        os.environ.pop("WEBHOOK_PORT", None)
    return prev


def restore_env(prev: Dict[str, Optional[str]]) -> None:
    """Откатывает env к снимку."""
    for k, v in prev.items():
        if v is None:
            os.environ.pop(k, None)
        else:
            os.environ[k] = v


def inject_bot_constants(
    module: types.ModuleType,
    token: str,
    token_id: int,
    webhook_url: Optional[str],
    webhook_port: Optional[int],
) -> None:
    """Принудительно проставляет BOT_TOKEN/TOKEN_ID в namespace модуля после exec."""
    module.__dict__["BOT_TOKEN"] = token
    module.__dict__["TOKEN_ID"] = token_id
    if webhook_url:
        module.__dict__["WEBHOOK_URL"] = webhook_url
        module.__dict__["WEBHOOK_PORT"] = webhook_port or (9000 + token_id)
    # Подмодуль config, если загружен
    cfg = module.__dict__.get("config")
    if cfg is not None and hasattr(cfg, "__dict__"):
        cfg.__dict__["BOT_TOKEN"] = token
        cfg.__dict__["TOKEN_ID"] = token_id


def list_local_py_stems(bot_dir: Path, exclude: Set[str]) -> List[str]:
    """Имена .py файлов в каталоге бота без исключений."""
    names: List[str] = []
    for p in bot_dir.glob("*.py"):
        if p.stem in exclude or p.name.startswith("_"):
            continue
        names.append(p.stem)
    return names
