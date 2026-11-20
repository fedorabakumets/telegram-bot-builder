"""@fileoverview Определяет необходимость фазовых тестов по полному списку изменений."""

import json
import os
import re
import subprocess
from pathlib import Path


# В client/ есть модули, которые импортируют фазы генератора; исключаем только области интерфейса.
UI_ONLY_PREFIXES = (
    b"client/components/editor/analytics/",
    b"client/components/editor/bot/",
    b"client/components/editor/database/",
    b"client/components/editor/files/",
    b"client/components/editor/header/",
    b"client/components/editor/tables/",
    b"client/components/editor/terminal/",
    b"client/components/editor/versions/",
    b"client/components/layout/",
    b"client/components/ui/",
)


def git(*args: str) -> bytes:
    """Возвращает бинарный вывод Git без преобразования имён файлов."""
    return subprocess.check_output(["git", *args], stderr=subprocess.DEVNULL, timeout=30)


def sha(value: str) -> str:
    """Проверяет, что значение события — полный ненулевой хеш коммита."""
    if not re.fullmatch(r"[a-f0-9]{40}", value) or set(value) == {"0"}:
        raise ValueError("Неизвестный коммит события")
    return value


def is_unrelated(path: bytes) -> bool:
    """Разрешает пропуск только для известных путей документации и интерфейса."""
    return (
        path.startswith(b"docs-site/")
        or (path.startswith(b"docs/") and path.endswith(b".md"))
        or path.startswith(UI_ONLY_PREFIXES)
        or (path.startswith(b"client/") and path.endswith(b".css"))
    )


def run_phases(event_name: str, ref: str, event: dict) -> bool:
    """Сравнивает PR от общего предка, пуш — от предыдущего коммита ветки."""
    if event_name == "pull_request":
        pull_request = event["pull_request"]
        base = sha(pull_request["base"]["sha"])
        head = sha(pull_request["head"]["sha"])
        merge_bases = git("merge-base", "--all", base, head).splitlines()
        if len(merge_bases) != 1:
            return True
        before = sha(merge_bases[0].decode("ascii"))
    elif event_name == "push" and ref.startswith("refs/heads/") and ref != "refs/heads/main":
        before = sha(event["before"])
        head = sha(event["after"])
    else:
        return True

    # Отключаем распознавание переименований: старый и новый пути учитываются отдельно.
    changes = git("diff", "--name-only", "--no-renames", "-z", before, head, "--")
    if not changes or not changes.endswith(b"\0"):
        return True
    return not all(is_unrelated(path) for path in changes[:-1].split(b"\0"))


def main() -> None:
    """Выводит true при любой неопределённости, чтобы не пропустить тесты."""
    try:
        event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text(encoding="utf-8"))
        needed = run_phases(os.environ["GITHUB_EVENT_NAME"], os.environ["GITHUB_REF"], event)
    except (OSError, KeyError, TypeError, ValueError, subprocess.SubprocessError):
        needed = True
    print("true" if needed else "false")


if __name__ == "__main__":
    main()
