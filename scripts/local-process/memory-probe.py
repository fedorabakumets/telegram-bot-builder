"""@fileoverview Измерение памяти настоящего воркера и временных дочерних обработчиков.

Синтетические обновления проходят через локальный HTTP и настоящий локальный Redis.
Секреты и реальные Telegram-боты не используются. RSS не складывается с private bytes.
"""

import json
import os
from pathlib import Path
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
WORKER_DIR = ROOT / "server" / "python"


def memory(pid):
    """Читает RSS/working set и отдельно private bytes Windows указанного PID."""
    if os.name != "nt":
        try:
            values = Path(f"/proc/{pid}/status").read_text().splitlines()
            return {"rss_kib": next(int(row.split()[1]) for row in values if row.startswith("VmRSS:"))}
        except (OSError, StopIteration):
            return None
    import ctypes
    from ctypes import wintypes

    class Counters(ctypes.Structure):
        """Счётчики Windows PROCESS_MEMORY_COUNTERS_EX."""

        _fields_ = [("cb", wintypes.DWORD), ("faults", wintypes.DWORD)] + [
            (name, ctypes.c_size_t) for name in
            ("peak_rss", "rss", "peak_pool", "pool", "peak_nonpaged", "nonpaged",
             "pagefile", "peak_pagefile", "private")]

    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
    kernel.OpenProcess.restype = wintypes.HANDLE
    kernel.CloseHandle.argtypes = [wintypes.HANDLE]
    psapi = ctypes.WinDLL("psapi", use_last_error=True)
    psapi.GetProcessMemoryInfo.argtypes = [wintypes.HANDLE, ctypes.c_void_p, wintypes.DWORD]
    handle = kernel.OpenProcess(0x410, False, pid)
    if not handle:
        return None
    try:
        counters = Counters()
        counters.cb = ctypes.sizeof(counters)
        if not psapi.GetProcessMemoryInfo(handle, ctypes.byref(counters), counters.cb):
            return None
        return {"rss_kib": counters.rss // 1024, "private_kib": counters.private // 1024}
    finally:
        kernel.CloseHandle(handle)


def baseline():
    """Отделяет импорт воркера от явной загрузки aiogram в чистом процессе."""
    sys.path.insert(0, str(WORKER_DIR))
    snapshots = [{"stage": "python", **memory(os.getpid())}]
    import worker
    snapshots.append({"stage": "worker_import", "aiogram_loaded": "aiogram" in sys.modules,
                      **memory(os.getpid())})
    worker.lazy_aiogram.enable()
    snapshots.append({"stage": "aiogram_enabled", "aiogram_loaded": "aiogram" in sys.modules,
                      **memory(os.getpid())})
    print(json.dumps(snapshots))


def run_worker():
    """Запускает неизменённую точку входа воркера с известным PID интерпретатора."""
    import runpy
    sys.path.insert(0, str(WORKER_DIR))
    print(json.dumps({"probe_parent_pid": os.getpid()}), flush=True)
    runpy.run_path(str(WORKER_DIR / "worker.py"), run_name="__main__")


def main():
    """Выбирает независимое измерение импортов либо интеграционный процессный прогон."""
    if "--baseline" in sys.argv:
        baseline()
    elif "--worker" in sys.argv:
        run_worker()
    else:
        from memory_probe_run import exercise
        exercise(ROOT, memory)


if __name__ == "__main__":
    main()
