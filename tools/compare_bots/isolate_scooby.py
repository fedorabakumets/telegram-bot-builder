"""
@fileoverview Изоляция сценария: только Scooby в цепочке сравнения.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from project_path import PROJECT

import json

# assignment id для calc — только Scooby
SCOOBY_CALC_IDS = {
    "init_arr",
    "fee_scooby",
    "calc1",
    "fmt1",
    "push_scooby",
}


def main() -> None:
    """Оставляет в цепочке только Scooby → calc → format."""
    with PROJECT.open(encoding="utf-8") as f:
        project = json.load(f)

    sheet = next(s for s in project["sheets"] if s["id"] == "sheet-bots")
    nodes = {n["id"]: n for n in sheet["nodes"]}

    nodes["bot-setv-parse-scooby"]["data"]["autoTransitionTo"] = "bot-setv-calc"
    nodes["bot-setv-parse-scooby"]["data"]["enableAutoTransition"] = True

    calc = nodes["bot-setv-calc"]
    all_assignments = calc["data"]["assignments"]
    calc["data"]["assignments"] = [a for a in all_assignments if a.get("id") in SCOOBY_CALC_IDS]

    with PROJECT.open("w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    kept = [a["id"] for a in calc["data"]["assignments"]]
    print(f"OK: parse-scooby -> bot-setv-calc")
    print(f"OK: calc assignments: {kept}")


if __name__ == "__main__":
    main()
