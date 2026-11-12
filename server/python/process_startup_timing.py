"""@fileoverview Числовые этапы запуска временного обработчика без секретов и профилировщика."""

import json
import time

_previous = None
_started = None


def enable():
    """Включает измерения только в отдельном временном процессе."""
    global _previous, _started
    _previous = _started = time.perf_counter()
    mark("python_entered")


def mark(stage):
    """Публикует длительность от предыдущей отметки и от входа в обработчик."""
    global _previous
    if _previous is None:
        return
    now = time.perf_counter()
    print(json.dumps({"type": "process", "event": "startup_timing", "stage": stage,
                      "stage_ms": round((now - _previous) * 1000, 3),
                      "elapsed_ms": round((now - _started) * 1000, 3)}), flush=True)
    _previous = now
