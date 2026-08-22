"""
Кэш разобранного кода бота рядом с файлом (.botcode/*.bin).
Ускоряет повторный запуск, когда исходный .py не менялся.
"""

from __future__ import annotations

import importlib.util
import marshal
import os
import time
from pathlib import Path
from typing import Any, Callable

LogFn = Callable[[str], None]


def _cache_enabled() -> bool:
    return os.environ.get("BOT_CODE_CACHE", "true").lower() != "false"


def _cache_file_path(bot_path: Path) -> Path:
    stat = bot_path.stat()
    magic = importlib.util.MAGIC_NUMBER.hex()
    return (
        bot_path.parent
        / ".botcode"
        / f"{bot_path.stem}.{magic}.{stat.st_size}.{int(stat.st_mtime_ns)}.bin"
    )


def _purge_stale_cache(cache_dir: Path, stem: str, keep: Path) -> None:
    prefix = f"{stem}."
    for old in cache_dir.glob(f"{prefix}*"):
        if old != keep:
            try:
                old.unlink()
            except OSError:
                pass


def load_bot_code(bot_path: Path, log: LogFn) -> Any:
    """
    Возвращает объект code (результат compile) для exec().
    При наличии актуального .bin читает его через marshal.
    """
    t0 = time.perf_counter()
    source_code = bot_path.read_text(encoding="utf-8")
    read_ms = (time.perf_counter() - t0) * 1000
    log(f"Код прочитан: {len(source_code)} символов за {read_ms:.0f} мс")

    if not _cache_enabled():
        t1 = time.perf_counter()
        compiled = compile(source_code, str(bot_path), "exec")
        compile_ms = (time.perf_counter() - t1) * 1000
        log(f"Разбор кода: {compile_ms:.0f} мс (заново)")
        return compiled

    cache_file = _cache_file_path(bot_path)
    if cache_file.is_file():
        try:
            t1 = time.perf_counter()
            with open(cache_file, "rb") as fh:
                compiled = marshal.load(fh)
            compile_ms = (time.perf_counter() - t1) * 1000
            log(f"Разбор кода: {compile_ms:.0f} мс (из готового)")
            return compiled
        except Exception:
            try:
                cache_file.unlink(missing_ok=True)
            except OSError:
                pass

    t1 = time.perf_counter()
    compiled = compile(source_code, str(bot_path), "exec")
    compile_ms = (time.perf_counter() - t1) * 1000
    log(f"Разбор кода: {compile_ms:.0f} мс (заново)")

    try:
        cache_file.parent.mkdir(parents=True, exist_ok=True)
        tmp = cache_file.with_suffix(".tmp")
        with open(tmp, "wb") as fh:
            marshal.dump(compiled, fh)
        os.replace(tmp, cache_file)
        _purge_stale_cache(cache_file.parent, bot_path.stem, cache_file)
    except Exception:
        pass

    return compiled
