"""@fileoverview Дисковый кэш байткода с холодной компиляцией в отдельном Python."""

from __future__ import annotations

import importlib.util
import marshal
import os
import tempfile
import time
from pathlib import Path
from types import CodeType
from typing import Callable

from bot_code_compile import SourceChangedError, compile_isolated, source_identity

LogFn = Callable[[str], None]


def _cache_enabled() -> bool:
    """Возвращает признак разрешённого дискового кэша."""
    return os.environ.get("BOT_CODE_CACHE", "true").lower() != "false"


def _cache_file_path(bot_path: Path) -> Path:
    """Определяет ключ по версии Python и признакам изменения исходника."""
    identity = ".".join(str(value) for value in source_identity(bot_path))
    magic = importlib.util.MAGIC_NUMBER.hex()
    return bot_path.parent / ".botcode" / f"{bot_path.stem}.{magic}.{identity}.bin"


def _purge_stale_cache(cache_dir: Path, stem: str, keep: Path) -> None:
    """Удаляет устаревшие версии кэша указанного исходника."""
    for old in cache_dir.glob(f"{stem}.*.bin"):
        if old != keep:
            try:
                old.unlink()
            except OSError:
                pass


def _read_cache(path: Path) -> CodeType:
    """Проверяет тип готового байткода перед его использованием."""
    with path.open("rb") as stream:
        code = marshal.load(stream)
    if not isinstance(code, CodeType):
        raise ValueError("Кэш не содержит объект кода")
    return code


def _publish_cache(path: Path, bot_path: Path, code: CodeType) -> None:
    """Атомарно публикует уникальный временный файл без конфликтов писателей."""
    temporary = None
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(dir=path.parent, prefix="compile-", suffix=".tmp", delete=False) as stream:
            temporary = Path(stream.name)
            marshal.dump(code, stream)
        os.replace(temporary, path)
        _purge_stale_cache(path.parent, bot_path.stem, path)
    except OSError:
        pass
    finally:
        if temporary is not None:
            try:
                temporary.unlink(missing_ok=True)
            except OSError:
                pass


def load_bot_code(bot_path: Path, log: LogFn) -> CodeType:
    """Загружает байткод, не оставляя временную память компилятора в рабочем процессе."""
    bot_path = Path(bot_path).resolve()
    for attempt in range(2):
        identity = source_identity(bot_path)
        cache_file = _cache_file_path(bot_path) if _cache_enabled() else None
        if cache_file is not None and cache_file.is_file():
            try:
                started = time.perf_counter()
                code = _read_cache(cache_file)
                if source_identity(bot_path) != identity:
                    continue
                log(f"Разбор кода: {(time.perf_counter() - started) * 1000:.0f} мс (из готового)")
                return code
            except (OSError, ValueError, EOFError, TypeError):
                try:
                    cache_file.unlink(missing_ok=True)
                except OSError:
                    pass
        started = time.perf_counter()
        try:
            code = compile_isolated(bot_path)
        except SourceChangedError:
            continue
        if source_identity(bot_path) != identity:
            continue
        log(f"Разбор кода: {(time.perf_counter() - started) * 1000:.0f} мс (изолированно)")
        if cache_file is not None:
            _publish_cache(cache_file, bot_path, code)
        return code
    raise RuntimeError("Исходник многократно изменён во время загрузки")
