"""@fileoverview Изолированная компиляция сценария без передачи секретов процессу компилятора."""

from __future__ import annotations

import json
import marshal
import math
import os
from pathlib import Path
import subprocess
import sys
import tempfile
from types import CodeType


class SourceChangedError(RuntimeError):
    """Обозначает необходимость повторного чтения изменившегося исходника."""


def source_identity(path: Path) -> tuple:
    """Возвращает признаки изменения исходника без загрузки его текста в память."""
    stat = path.stat()
    return (stat.st_size, stat.st_mtime_ns, stat.st_ctime_ns, stat.st_ino)


def compile_isolated(path: Path) -> CodeType:
    """Компилирует исходник в дочернем Python и загружает только готовый байткод."""
    try:
        timeout = float(os.environ.get("BOT_CODE_COMPILE_TIMEOUT_SECONDS", "60"))
        timeout = min(300.0, max(1.0, timeout)) if math.isfinite(timeout) else 60.0
    except ValueError:
        timeout = 60.0
    environment = {key: os.environ[key] for key in ("SYSTEMROOT", "WINDIR", "TMP", "TEMP", "TMPDIR") if key in os.environ}
    helper = str(Path(__file__).resolve())
    with tempfile.TemporaryDirectory(prefix="bot-compile-") as directory:
        output = Path(directory) / "code.bin"
        result = subprocess.run(
            [sys.executable, "-I", *(["-O"] if sys.flags.optimize == 1 else ["-OO"] if sys.flags.optimize == 2 else []), helper, str(path), str(output)],
            env=environment, stdin=subprocess.DEVNULL, capture_output=True, timeout=timeout, check=False,
        )
        if result.returncode:
            try:
                error = json.loads(result.stdout[:4096])
                if not isinstance(error, dict):
                    error = {}
            except (ValueError, UnicodeError):
                error = {}
            if error.get("kind") == "SyntaxError":
                raise SyntaxError(error.get("message", "Ошибка синтаксиса"),
                                  (str(path), error.get("line", 1), error.get("offset", 1), None))
            if error.get("kind") == "SourceChanged":
                raise SourceChangedError("Исходник изменён во время компиляции")
            raise RuntimeError("Не удалось изолированно скомпилировать сценарий")
        with output.open("rb") as stream:
            code = marshal.load(stream)
        if not isinstance(code, CodeType):
            raise ValueError("Компилятор не вернул объект кода")
        return code


def _main() -> int:
    """Записывает результат компиляции, не выполняя сценарий и не печатая исходник."""
    path, output = Path(sys.argv[1]), Path(sys.argv[2])
    try:
        before = source_identity(path)
        source = path.read_text(encoding="utf-8")
        code = compile(source, str(path), "exec", dont_inherit=True)
        if source_identity(path) != before:
            print(json.dumps({"kind": "SourceChanged"}))
            return 2
        with output.open("wb") as stream:
            marshal.dump(code, stream)
        return 0
    except SyntaxError as error:
        print(json.dumps({"kind": "SyntaxError", "message": "Ошибка синтаксиса сценария",
                          "line": error.lineno, "offset": error.offset}))
        return 1
    except Exception:
        print(json.dumps({"kind": "CompileError"}))
        return 1


if __name__ == "__main__":
    sys.exit(_main())
