"""@fileoverview Суммарный рабочий набор родителя и зарегистрированных обработчиков."""

import os

from worker_memory import process_rss_kb

_children = set()


def register_pid(pid):
    """Добавляет PID реального интерпретатора обработчика без повторного подсчёта."""
    if isinstance(pid, int) and not isinstance(pid, bool) and pid > 0 and pid != os.getpid():
        _children.add(pid)


def unregister_pid(pid):
    """Удаляет обработчик из учёта только после подтверждённого завершения."""
    _children.discard(pid)


def pid_rss_kb(pid):
    """Читает RSS Linux или рабочий набор Windows; не возвращает private bytes."""
    if pid == os.getpid():
        return process_rss_kb()
    if os.name == "nt":
        from process_memory_windows import pid_rss_kb as windows_rss
        return windows_rss(pid)
    try:
        with open(f"/proc/{pid}/status", encoding="utf-8") as status:
            for line in status:
                if line.startswith("VmRSS:"):
                    return int(line.split()[1])
    except (OSError, ValueError, IndexError):
        return None
    return None


def total_rss_kb():
    """Складывает RSS родителя и живых детей; общие страницы могут считаться дважды.

    Это сумма рабочих наборов, а не уникальная память или Linux cgroup usage.
    Неизмеримый живой ребёнок даёт None вместо заниженного результата.
    """
    parent = process_rss_kb()
    if parent is None:
        return None
    total = parent
    for pid in tuple(_children):
        usage = pid_rss_kb(pid)
        if usage is None:
            return None
        total += usage
    return total
