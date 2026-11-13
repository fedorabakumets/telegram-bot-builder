"""@fileoverview Сравнение повторного прогрева библиотек в одном и двух свежих Python."""

import argparse
import concurrent.futures
import json
import os
import subprocess
import sys
from pathlib import Path

DIRECTORY = Path(__file__).resolve().parent


def sample():
    """Измеряет одинаковый синтетический прогрев без ботов и сетевых подключений."""
    environment = {key: value for key, value in os.environ.items()
                   if key.upper() in {"PATH", "SYSTEMROOT", "WINDIR", "TEMP", "TMP", "HOME", "LANG"}}
    environment["PYTHONUTF8"] = "1"
    result = subprocess.run([sys.executable, str(DIRECTORY / "models.py")],
                            env=environment, capture_output=True, text=True,
                            encoding="utf-8", timeout=120, check=True)
    return json.loads(result.stdout)


def aggregate(samples, stage):
    """Суммирует RSS отдельных процессов, сохраняя неизвестные измерения как null."""
    values = [next(item for item in sample["stages"] if item["stage"] == stage)
              for sample in samples]
    measured = all(item["rssKiB"] is not None for item in values)
    return {"processCount": len(samples),
            "rssKiB": sum(item["rssKiB"] for item in values) if measured else None,
            "builtModelCopies": sum(item["built"] for item in values)}


def run():
    """Сравнивает стоимость дублирования импортов, не выдавая её за замер продакшена."""
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        split = list(executor.map(lambda _: sample(), range(2)))
    unified = [sample()]
    stages = {}
    for stage in ("lazyImport", "common14", "allModels"):
        separate, common = aggregate(split, stage), aggregate(unified, stage)
        assert separate["builtModelCopies"] == 2 * common["builtModelCopies"]
        stages[stage] = {"split": separate, "unified": common,
                         "rssDifferenceKiB": separate["rssKiB"] - common["rssKiB"]
                         if separate["rssKiB"] is not None and common["rssKiB"] is not None else None}
    return {"scope": "synthetic_import_duplication_not_runtime_or_container",
            "platform": sys.platform, "python": sys.version.split()[0],
            "stages": stages, "raw": {"split": split, "unified": unified}}


def main():
    """Печатает воспроизводимый отчёт и при необходимости сохраняет его в файл."""
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    encoded = json.dumps(run(), ensure_ascii=False, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(encoded + "\n", encoding="utf-8")
    print(encoded)


if __name__ == "__main__":
    main()
