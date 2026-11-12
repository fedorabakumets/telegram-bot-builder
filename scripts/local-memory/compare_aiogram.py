"""@fileoverview Изолированное сравнение памяти aiogram до и после правки без Telegram и работающих ботов."""
import gc
import json
import subprocess
import sys
import tracemalloc
import types
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "server" / "python"))


def probe():
    """Импортирует модели в свежем процессе с одинаковыми настройками трассировки."""
    source = sys.stdin.buffer.read().decode("utf-8")
    tracemalloc.start(1)
    module = types.ModuleType("lazy_memory_probe")
    exec(compile(source, "lazy_aiogram.py", "exec"), module.__dict__)
    if not module.enable():
        raise RuntimeError("Ленивая загрузка не включилась")
    import aiogram.types
    import aiogram.methods
    import pydantic
    from worker_memory import process_rss_kb
    namespaces = {}
    for package in (aiogram.types, aiogram.methods):
        for name in package.__all__:
            cls = getattr(package, name, None)
            if isinstance(cls, type) and issubclass(cls, pydantic.BaseModel):
                namespace = cls.__pydantic_parent_namespace__
                if namespace is not None:
                    namespaces[id(namespace)] = namespace
    gc.collect()
    current, peak = tracemalloc.get_traced_memory()
    print(json.dumps({"namespaceCount": len(namespaces),
                      "namespaceBytes": sum(sys.getsizeof(value) for value in namespaces.values()),
                      "tracedBytes": current, "peakTracedBytes": peak,
                      "tracerOverheadBytes": tracemalloc.get_tracemalloc_memory(), "rssKiB": process_rss_kb()}))


def compare():
    """Сравнивает HEAD и рабочую версию без записи исходников и вмешательства в runtime."""
    before = subprocess.check_output(["git", "show", "HEAD:server/python/lazy_aiogram.py"], cwd=ROOT).decode("utf-8")
    after = (ROOT / "server" / "python" / "lazy_aiogram.py").read_text(encoding="utf-8")
    result = {}
    for label, source in (("before", before), ("after", after)):
        child = subprocess.run([sys.executable, str(Path(__file__).resolve()), "--probe"],
                               input=source, text=True, encoding="utf-8", capture_output=True,
                               timeout=60, cwd=ROOT)
        if child.returncode:
            raise RuntimeError(child.stderr)
        result[label] = json.loads(child.stdout)
    result["savedTracedBytes"] = result["before"]["tracedBytes"] - result["after"]["tracedBytes"]
    destination = ROOT / "output" / "local-runtime" / "aiogram-comparison.json"
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    if "--probe" in sys.argv:
        probe()
    else:
        compare()
