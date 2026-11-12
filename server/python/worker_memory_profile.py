"""@fileoverview Необязательная диагностика живых выделений Python без содержимого объектов."""

import os
import time

_enabled = False
_next_sample = 0.0
_interval = 60.0
_previous = None


def start():
    """Включает трассировку до загрузки модулей ботов только по явной настройке процесса."""
    global _enabled, _interval
    if os.environ.get("WORKER_MEMORY_PROFILE", "").lower() != "true":
        return False
    import tracemalloc
    try:
        _interval = max(30.0, min(3600.0, float(os.environ.get("WORKER_MEMORY_PROFILE_SECONDS", "60"))))
    except ValueError:
        _interval = 60.0
    tracemalloc.start(1)
    _enabled = True
    return True


def enabled():
    """Сообщает, была ли трассировка включена администратором до загрузки ботов."""
    return _enabled


def snapshot():
    """Возвращает крупнейшие живые выделения по строкам и изменения без исходников и объектов.

    Это память, видимая tracemalloc, а не полный RSS и не принадлежность общих объектов боту.
    Единственный предыдущий снимок удерживается для сравнения; его стоимость измеряется отдельно.
    """
    global _previous
    import tracemalloc
    current, peak = tracemalloc.get_traced_memory()
    captured = tracemalloc.take_snapshot()
    stats = captured.statistics("lineno")
    diff = captured.compare_to(_previous, "lineno") if _previous is not None else []

    def row(stat):
        """Возвращает только место выделения, объём и количество блоков."""
        frame = stat.traceback[0]
        result = {"file": frame.filename, "line": frame.lineno, "bytes": stat.size, "blocks": stat.count}
        if hasattr(stat, "size_diff"):
            result.update(deltaBytes=stat.size_diff, deltaBlocks=stat.count_diff)
        return result

    _previous = captured
    return {"type": "worker_memory_profile", "schemaVersion": 1, "pid": os.getpid(),
            "timestamp": time.time(), "tracedCurrentBytes": current, "tracedPeakBytes": peak,
            "tracerOverheadBytes": tracemalloc.get_tracemalloc_memory(),
            "topAllocations": [row(stat) for stat in stats[:15]],
            "topChanges": [row(stat) for stat in diff[:15]]}


def report_if_due():
    """Публикует ограниченный снимок в служебный stdout; ошибки диагностики не останавливают ботов."""
    global _next_sample
    if not _enabled or time.monotonic() < _next_sample:
        return
    _next_sample = time.monotonic() + _interval
    import json
    import sys
    try:
        started = time.monotonic()
        report = snapshot()
        report["durationMs"] = (time.monotonic() - started) * 1000
        sys.__stdout__.write(json.dumps(report) + "\n")
        sys.__stdout__.flush()
    except Exception:
        sys.__stderr__.write("[worker-memory-profile] Не удалось собрать снимок\n")
