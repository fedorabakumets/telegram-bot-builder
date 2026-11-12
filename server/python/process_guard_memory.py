"""@fileoverview Лёгкий RSS активного дерева и атомарный вывод кадров временного сторожа."""

import json
import os
import sys
import threading
import time
from pathlib import Path

from process_memory import pid_rss_kb


def descendants(pid):
    """Находит потомков средствами ОС без запуска PowerShell или внешних процессов."""
    if os.name == "nt":
        from process_job import _existing_children
        return _existing_children(pid)
    found = set()
    try:
        for task in Path(f"/proc/{pid}/task").iterdir():
            try:
                found.update(int(value) for value in (task / "children").read_text().split())
            except (OSError, ValueError):
                continue
    except OSError:
        pass
    return list(found)


def tree_rss_kb():
    """Суммирует RSS сторожа и потомков; общий RSS может повторно учитывать общие страницы.

    Внешний Windows-лаунчер виртуальной среды не входит в дерево сторожа.
    Это не уникальная физическая память и не Linux cgroup usage.
    """
    pending, seen, total = [os.getpid()], set(), 0
    while pending:
        pid = pending.pop()
        if pid in seen:
            continue
        seen.add(pid)
        usage = pid_rss_kb(pid)
        if usage is not None:
            total += usage
        pending.extend(descendants(pid))
    return total


class GuardOutput:
    """Сериализует stdout ребёнка и RSS-кадры через единственного владельца pipe."""

    def __init__(self, child, disconnected):
        """Привязывает ограниченное чтение stdout к жизненному циклу активного сторожа."""
        self.child = child
        self.disconnected = disconnected
        self.lock = threading.Lock()
        self.next_sample = 0
        self.thread = threading.Thread(target=self.relay, daemon=True)
        self.thread.start()

    def write(self, frame):
        """Записывает один JSON-кадр под общей блокировкой без смешивания строк."""
        with self.lock:
            sys.stdout.buffer.write(frame)
            sys.stdout.buffer.flush()

    def relay(self):
        """Ограничивает строки ребёнка тем же лимитом, который ожидает Node."""
        try:
            while True:
                line = self.child.stdout.readline(65537)
                if not line:
                    return
                if len(line) > 65536 or not line.endswith(b"\n"):
                    self.disconnected.set()
                    return
                self.write(line)
        except (OSError, ValueError):
            self.disconnected.set()

    def sample(self):
        """Публикует RSS раз в пять секунд исключительно во время активного обработчика."""
        now = time.monotonic()
        if now < self.next_sample:
            return
        self.next_sample = now + 5
        frame = {"type": "process", "event": "memory", "pid": os.getpid(),
                 "memory_kb": tree_rss_kb()}
        self.write((json.dumps(frame) + "\n").encode())

    def finish(self):
        """Дочитывает закрытый stdout после завершения дерева перед выходом сторожа."""
        self.thread.join(timeout=2)
