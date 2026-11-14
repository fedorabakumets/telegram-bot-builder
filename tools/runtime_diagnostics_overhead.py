"""@fileoverview Воспроизводимый локальный замер стоимости числовой диагностики воркера."""
import gc
import hashlib
import json
from pathlib import Path
import platform
import subprocess
import sys
import time
import tracemalloc
import types
from importlib.metadata import version

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "server/python"))
import worker_namespace_counters as namespaces
import worker_runtime_counters as counters


def hashes():
    """Фиксирует исходники измеряемой реализации, не читая окружение и секреты."""
    paths = ["server/python/worker_namespace_counters.py", "server/python/worker_runtime_counters.py",
             "server/python/worker_runtime_model_counters.py", "server/python/worker.py",
             "tools/runtime_diagnostics_overhead.py"]
    return {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest() for name in paths}


def main():
    """Измеряет заполненный реестр и снимки ста ботов без сети и запуска GC вручную."""
    initial_hashes = hashes()
    modules = [types.ModuleType("benchmark") for _ in range(namespaces.LIMIT)]
    for module in modules:
        namespaces.register(module)
    initial_alive = namespaces.snapshot()["mainNamespacesTrackedAlive"]
    iterations = 150000
    started = time.perf_counter()
    cpu = time.process_time()
    for index in range(iterations):
        namespaces.register(modules[index % len(modules)])
    register_seconds = time.perf_counter() - started
    register_cpu = time.process_time() - cpu
    bots = {index: types.SimpleNamespace(module=module, task=None)
            for index, module in enumerate(modules[:100])}
    samples = 1000
    started = time.perf_counter()
    cpu = time.process_time()
    for _ in range(samples):
        snapshot = counters.snapshot(bots)
    snapshot_seconds = time.perf_counter() - started
    final_hashes = hashes()
    result = {
        "platform": platform.platform(), "python": platform.python_version(),
        "executable": sys.executable,
        "aiogramInstalled": version("aiogram"), "pydanticInstalled": version("pydantic"),
        "gcEnabled": gc.isenabled(), "gcThresholds": gc.get_threshold(),
        "tracemallocEnabled": tracemalloc.is_tracing(), "forcedGcCollections": 0,
        "gitHead": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
        "hashesBefore": initial_hashes, "hashesAfter": final_hashes,
        "sourceUnchanged": initial_hashes == final_hashes,
        "registryLimit": namespaces.LIMIT, "initialAliveProbes": initial_alive,
        "registerIterations": iterations, "registerSeconds": register_seconds,
        "registerCpuSeconds": register_cpu,
        "registerMicrosecondsAverage": register_seconds * 1000000 / iterations,
        "snapshotBots": len(bots), "snapshotIterations": samples,
        "snapshotMillisecondsAverage": snapshot_seconds * 1000 / samples,
        "snapshotCpuSeconds": time.process_time() - cpu,
        "snapshotFinal": snapshot,
        "scope": "bounded_weak_registry_and_numeric_snapshot_only_no_network_no_aiogram_import",
    }
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
