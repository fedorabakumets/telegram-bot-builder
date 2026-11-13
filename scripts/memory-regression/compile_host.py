"""@fileoverview Сравнение удержания памяти при компиляции сценария в хосте и дочернем Python."""

import argparse
import gc
import json
import os
import subprocess
import sys
import tempfile
import threading
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "server" / "python"))
from worker_memory import process_rss_kb
from peak_memory import process_peak_kib


def synthetic_source(functions):
    """Создаёт крупный сценарий без библиотек, секретов, сети и фоновых задач."""
    return "\n".join(f"def step_{i}(value):\n    return value + {i}\n" for i in range(functions))


def child_peak_kib():
    """Возвращает пик завершённых дочерних процессов на Linux; иначе неизвестно."""
    if not sys.platform.startswith("linux"):
        return None
    import resource
    return resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss


def probe(mode, path):
    """Запускает ровно одну загрузку и проверяет результат сгенерированного кода."""
    from bot_code_cache import load_bot_code
    stages = []
    samples = []
    stop = threading.Event()

    def record(stage):
        """Сохраняет RSS стадии без принудительного изменения аллокатора."""
        stages.append({"stage": stage, "rssKiB": process_rss_kb()})

    def monitor():
        """Сэмплирует RSS родителя; краткие пики между сэмплами могут быть пропущены."""
        while not stop.wait(0.002):
            value = process_rss_kb()
            if value is not None:
                samples.append(value)

    record("baseline")
    thread = threading.Thread(target=monitor, daemon=True)
    thread.start()
    started = time.perf_counter()
    try:
        if mode == "parent":
            source = path.read_text(encoding="utf-8")
            record("afterRead")
            code = compile(source, str(path), "exec")
            del source
        else:
            os.environ["BOT_CODE_CACHE"] = "true"
            code = load_bot_code(path, lambda _: None)
        elapsed = (time.perf_counter() - started) * 1000
        record("afterLoad")
        namespace = {}
        exec(code, namespace)
        assert namespace["step_0"](7) == 7
        assert namespace["step_99"](7) == 106
        record("afterExecution")
        del code, namespace
        gc.collect()
        record("afterGC")
    finally:
        stop.set()
        thread.join()
    known = samples + [item["rssKiB"] for item in stages if item["rssKiB"] is not None]
    return {"mode": mode, "elapsedLoadMs": elapsed, "stages": stages,
            "parentSampledPeakKiB": max(known) if known else None,
            "parentOsPeakKiB": process_peak_kib(),
            "completedChildrenPeakKiB": child_peak_kib(), "functionalResult": True}


def run(functions=40000):
    """Сравнивает свежие процессы и прогретый диск без подмены результата продакшена."""
    with tempfile.TemporaryDirectory(prefix="botcraft-compile-bench-") as directory:
        path = Path(directory) / "scenario.py"
        path.write_text(synthetic_source(functions), encoding="utf-8")
        environment = {key: value for key, value in os.environ.items()
                       if key.upper() in {"PATH", "SYSTEMROOT", "WINDIR", "TEMP", "TMP", "HOME", "LANG"}}
        environment["PYTHONUTF8"] = "1"
        samples = []
        for mode in ("parent", "cold", "warm"):
            result = subprocess.run([sys.executable, __file__, "--probe", mode, "--source", str(path)],
                                    env=environment, capture_output=True, text=True,
                                    encoding="utf-8", timeout=180, check=True)
            samples.append(json.loads(result.stdout))
        return {"scope": "synthetic_compile_not_production", "python": sys.version.split()[0],
                "platform": sys.platform, "sourceBytes": path.stat().st_size,
                "functions": functions, "samplingIntervalMs": 2,
                "childrenPeakScope": "Linux RUSAGE_CHILDREN maximum, not concurrent container total",
                "samples": samples}


def main():
    """Печатает JSON-отчёт; внутренний режим отделяет измеряемый хост от координатора."""
    parser = argparse.ArgumentParser()
    parser.add_argument("--functions", type=int, default=40000)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--probe", choices=("parent", "cold", "warm"))
    parser.add_argument("--source", type=Path)
    args = parser.parse_args()
    if args.functions < 100:
        parser.error("Нужно не менее 100 функций")
    result = probe(args.probe, args.source) if args.probe else run(args.functions)
    encoded = json.dumps(result, ensure_ascii=False, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(encoded + "\n", encoding="utf-8")
    print(encoded)


if __name__ == "__main__":
    main()
