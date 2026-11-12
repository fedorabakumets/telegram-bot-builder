"""@fileoverview Измеряет холодный импорт и повторную загрузку локального Python-бота.

Не читает .env, не запускает worker.main и запрещает сетевые соединения.
Холодный процесс использует прогретый файловый кэш ОС; задержка S3 не измеряется.
"""
from __future__ import annotations

import asyncio
import ctypes
import gc
import json
import os
from pathlib import Path
import platform
import statistics
import subprocess
import sys
import tempfile
import time

ROOT = Path(__file__).resolve().parents[2]
FIXTURE = Path(__file__).parent / "fixtures" / "minimal-bot.py"


def rss_bytes():
    """Возвращает текущий RSS через API ОС без сторонних зависимостей."""
    if os.name != "nt":
        return int(Path("/proc/self/statm").read_text().split()[1]) * os.sysconf("SC_PAGE_SIZE")

    class Counters(ctypes.Structure):
        """Описывает счётчики памяти процесса Windows для чтения рабочего набора."""
        _fields_ = [("cb", ctypes.c_ulong), ("PageFaultCount", ctypes.c_ulong)] + [
            (name, ctypes.c_size_t) for name in (
                "PeakWorkingSetSize", "WorkingSetSize", "QuotaPeakPagedPoolUsage",
                "QuotaPagedPoolUsage", "QuotaPeakNonPagedPoolUsage",
                "QuotaNonPagedPoolUsage", "PagefileUsage", "PeakPagefileUsage")]

    counters = Counters()
    counters.cb = ctypes.sizeof(counters)
    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel.GetCurrentProcess.restype = ctypes.c_void_p
    psapi = ctypes.WinDLL("psapi", use_last_error=True)
    psapi.GetProcessMemoryInfo.argtypes = [ctypes.c_void_p, ctypes.c_void_p, ctypes.c_ulong]
    if not psapi.GetProcessMemoryInfo(kernel.GetCurrentProcess(), ctypes.byref(counters), counters.cb):
        raise ctypes.WinError(ctypes.get_last_error())
    return counters.WorkingSetSize


def deny_network(event, args):
    """Прерывает любые попытки сетевого соединения или разрешения имени."""
    if event in ("socket.connect", "socket.getaddrinfo", "socket.sendto"):
        raise RuntimeError("Сеть запрещена локальным замером")


async def child():
    """Измеряет стадии запуска и десять загрузок модуля в одном процессе."""
    sys.addaudithook(deny_network)
    sys.path.insert(0, str(ROOT / "server" / "python"))
    marks = []
    start = time.perf_counter()

    def mark(stage):
        """Фиксирует накопленное время и текущую память стадии."""
        marks.append({"stage": stage, "elapsed_ms": round((time.perf_counter() - start) * 1000, 3),
                      "rss_bytes": rss_bytes()})

    mark("baseline")
    import worker
    mark("worker_import")
    applied = worker.lazy_aiogram.enable()
    mark("lazy_aiogram_import")
    from aiogram import Bot, Dispatcher
    bot, dp = Bot("123456:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi"), Dispatcher()
    mark("first_bot_dispatcher")
    await bot.session.close()
    del bot, dp
    gc.collect()
    loads = []
    with tempfile.TemporaryDirectory(prefix="local-webhook-benchmark-") as folder:
        local_fixture = Path(folder) / "bot.py"
        local_fixture.write_bytes(FIXTURE.read_bytes())
        for index in range(10):
            before = time.perf_counter()
            cache_log = []
            code = worker.bot_code_cache.load_bot_code(local_fixture, cache_log.append)
            compiled_at = time.perf_counter()
            namespace = {"__name__": f"local_benchmark_bot_{index}", "__file__": str(local_fixture)}
            exec(code, namespace)
            loads.append({"cache_expected": "miss" if index == 0 else "hit",
                          "read_compile_ms": round((compiled_at - before) * 1000, 3),
                          "load_ms": round((time.perf_counter() - before) * 1000, 3),
                          "cache_log": cache_log, "rss_loaded_bytes": rss_bytes()})
            await namespace["bot"].session.close()
            del namespace, code
            gc.collect()
            loads[-1]["rss_after_gc_bytes"] = rss_bytes()
    mark("after_repeated_loads")
    return {"lazy_applied": applied, "stages": marks, "module_loads": loads}


def main():
    """Запускает пять изолированных интерпретаторов и сохраняет сырые результаты."""
    if "--child" in sys.argv:
        print(json.dumps(asyncio.run(child())))
        return
    samples = []
    environment = {key: os.environ[key] for key in ("SYSTEMROOT", "WINDIR", "PATH", "TEMP", "TMP")
                   if key in os.environ}
    environment.update({"PROJECT_ID": "0", "PYTHONDONTWRITEBYTECODE": "1", "AIOGRAM_LAZY_MODELS": "true"})
    for _ in range(5):
        started = time.perf_counter()
        result = subprocess.run([sys.executable, str(Path(__file__).resolve()), "--child"],
                                cwd=ROOT, env=environment, capture_output=True, text=True, check=True, timeout=60)
        sample = json.loads(result.stdout)
        sample["subprocess_total_ms"] = round((time.perf_counter() - started) * 1000, 3)
        samples.append(sample)
    report = {"platform": platform.platform(), "python": platform.python_version(),
              "cold_process_iterations": 5, "warm_module_iterations_per_process": 10,
              "fixture": str(FIXTURE.relative_to(ROOT)),
              "limitations": ["Файловый кэш ОС не очищался", "S3 и Telegram не вызывались",
                              "Фикстура минимальная, не полный сгенерированный проект", "RSS Windows не равен памяти контейнера Linux"],
              "samples": samples,
              "median_subprocess_total_ms": statistics.median(s["subprocess_total_ms"] for s in samples)}
    output = Path(__file__).parent / "results" / "python-startup.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "median_subprocess_total_ms": report["median_subprocess_total_ms"]}))


if __name__ == "__main__":
    main()
