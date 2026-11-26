"""@fileoverview Долговременная блокировка аккаунтов, возвращённых в прежний режим."""

import json
import os
import tempfile
from pathlib import Path


class BlockedAccounts:
    """Запоминает заблокированные идентификаторы при перезапуске брокера."""

    def __init__(self, path=None):
        """Открывает журнал блокировок рядом с блокировкой процесса."""
        self.path = Path(path) if path is not None else None
        self.ids = set()
        if self.path:
            try:
                values = json.loads(self.path.read_text(encoding="utf-8"))
            except FileNotFoundError:
                values = []
            if not isinstance(values, list) or any(not isinstance(value, str) for value in values):
                raise ValueError("Повреждён журнал заблокированных аккаунтов")
            self.ids.update(values)

    def __contains__(self, account_id):
        """Проверяет блокировку перед допуском операции."""
        return account_id in self.ids

    def add(self, account_id):
        """Записывает блокировку до отключения, чтобы поздние запросы не открыли сессию."""
        if account_id in self.ids:
            return
        values = self.ids | {account_id}
        if self.path:
            temp = None
            try:
                with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=self.path.parent, delete=False) as handle:
                    temp = Path(handle.name)
                    json.dump(sorted(values), handle)
                    handle.flush()
                    os.fsync(handle.fileno())
                os.replace(temp, self.path)
                self.ids = values
                if os.name != "nt":
                    directory = os.open(self.path.parent, os.O_RDONLY | os.O_DIRECTORY)
                    try:
                        os.fsync(directory)
                    finally:
                        os.close(directory)
            finally:
                if temp is not None:
                    temp.unlink(missing_ok=True)
        self.ids = values
