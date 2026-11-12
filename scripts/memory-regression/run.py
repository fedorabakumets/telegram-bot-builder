"""@fileoverview Запуск изолированных регрессий памяти с машиночитаемым отчётом."""
import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

DIRECTORY = Path(__file__).resolve().parent


def child(script, *arguments):
    """Запускает свежий Python без доступа к настройкам БД, Redis и Telegram из окружения."""
    env = {key: value for key, value in os.environ.items()
           if key.upper() in {"PATH", "SYSTEMROOT", "WINDIR", "TEMP", "TMP", "HOME", "LANG"}}
    env["PYTHONUTF8"] = "1"
    result = subprocess.run([sys.executable, str(DIRECTORY / script), *arguments],
                            env=env, capture_output=True, text=True, encoding="utf-8", timeout=120)
    if result.returncode:
        raise RuntimeError(result.stderr or result.stdout)
    return json.loads(result.stdout)


def main():
    """Выводит отчёт; трассировка запускается отдельно и не смешивается с обычным RSS."""
    parser = argparse.ArgumentParser()
    parser.add_argument("--models", action="store_true")
    parser.add_argument("--traced", action="store_true")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    report = {"workloads": child("workloads.py")}
    if args.models or args.traced:
        report["models"] = child("models.py")
    if args.traced:
        report["modelsTraced"] = child("models.py", "--traced")
    encoded = json.dumps(report, ensure_ascii=False, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(encoded + "\n", encoding="utf-8")
    print(encoded)


if __name__ == "__main__":
    main()
