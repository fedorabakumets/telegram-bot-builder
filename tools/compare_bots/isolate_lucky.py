"""
@fileoverview Изоляция: только Lucky Exchange в цепочке сравнения.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from project_path import PROJECT

import json

LUCKY_CALC_IDS = {"init_arr", "fmt_lucky", "push_lucky"}


def main() -> None:
    """init → Lucky → calc."""
    with PROJECT.open(encoding="utf-8") as f:
        project = json.load(f)

    sheet = next(s for s in project["sheets"] if s["id"] == "sheet-bots")
    nodes = {n["id"]: n for n in sheet["nodes"]}

    nodes["bot-setv-init"]["data"]["autoTransitionTo"] = "bot-ub-lucky-start"
    nodes["bot-setv-parse-lucky"]["data"]["autoTransitionTo"] = "bot-setv-calc"
    nodes["bot-setv-parse-lucky"]["data"]["enableAutoTransition"] = True

    calc = nodes["bot-setv-calc"]
    calc["data"]["assignments"] = [
        a for a in calc["data"]["assignments"] if a.get("id") in LUCKY_CALC_IDS
    ]

    with PROJECT.open("w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    kept = [a["id"] for a in calc["data"]["assignments"]]
    print("OK: init -> lucky-start, parse-lucky -> calc")
    print(f"OK: calc assignments: {kept}")


if __name__ == "__main__":
    main()
