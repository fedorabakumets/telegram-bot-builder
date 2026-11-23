"""@fileoverview Проверить домашний каталог и запись очереди после настоящего gosu в CI.

Работает только с отдельной временной SQLite внутри проверяемого каталога.
"""

import argparse
from contextlib import closing
import json
import os
from pathlib import Path
import sqlite3
import subprocess
from tempfile import TemporaryDirectory


def verify_runtime_home(expected_home: str, expected_spool: str | None) -> None:
    """Сверить пути Node/Python и подтвердить сохранение факта после открытия SQLite заново."""
    home = Path(expected_home).resolve()
    assert Path.home().resolve() == home, "gosu изменил домашний каталог Python"
    result = subprocess.run(
        ["node", "-e", "process.stdout.write(JSON.stringify(require('node:os').homedir()))"],
        capture_output=True, text=True, timeout=10, check=True,
    )
    assert Path(json.loads(result.stdout)).resolve() == home, "Node и Python видят разные домашние каталоги"
    root = Path(os.environ.get("ANALYTICS_SPOOL_DIR") or home / ".botcraft" / "analytics-spool").resolve()
    expected = Path(expected_spool).resolve() if expected_spool else home / ".botcraft" / "analytics-spool"
    assert root == expected, "Изменён настроенный каталог очереди"
    root.mkdir(parents=True, exist_ok=True)
    # Отдельный каталог проверки не затрагивает очереди проектов или их backlog.
    with TemporaryDirectory(prefix="runtime-home-probe-", dir=root) as temporary:
        database = Path(temporary) / "pending.sqlite3"
        with closing(sqlite3.connect(database)) as connection, connection:
            assert connection.execute("PRAGMA journal_mode=WAL").fetchone()[0] == "wal"
            connection.execute("CREATE TABLE pending (event_key TEXT PRIMARY KEY)")
            connection.execute("INSERT INTO pending VALUES (?)", ("probe",))
        with closing(sqlite3.connect(database)) as connection:
            assert connection.execute("SELECT event_key FROM pending").fetchall() == [("probe",)]
    print("runtime analytics home: OK")


def main() -> None:
    """Прочитать ожидаемые пути, заданные тестом контейнера, без вывода окружения."""
    parser = argparse.ArgumentParser()
    parser.add_argument("--home", required=True)
    parser.add_argument("--spool")
    arguments = parser.parse_args()
    verify_runtime_home(arguments.home, arguments.spool)


if __name__ == "__main__":
    main()
