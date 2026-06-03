"""
@fileoverview Изоляция сценария: только Capitalist в цепочке сравнения.
"""
import json
from pathlib import Path

PROJECT = Path("bots/новый_бот_1_242_163/project.json")

CAPITALIST_CALC_IDS = {
    "init_arr",
    "fmt2",
    "push_capitalist",
}


def main() -> None:
    """Оставляет в цепочке только Capitalist → calc → format."""
    with PROJECT.open(encoding="utf-8") as f:
        project = json.load(f)

    sheet = next(s for s in project["sheets"] if s["id"] == "sheet-bots")
    nodes = {n["id"]: n for n in sheet["nodes"]}

    nodes["bot-setv-init"]["data"]["autoTransitionTo"] = "bot-ub-capitalist-start"
    nodes["bot-setv-parse-capitalist"]["data"]["autoTransitionTo"] = "bot-setv-calc"
    nodes["bot-setv-parse-capitalist"]["data"]["enableAutoTransition"] = True

    calc = nodes["bot-setv-calc"]
    calc["data"]["assignments"] = [
        a for a in calc["data"]["assignments"] if a.get("id") in CAPITALIST_CALC_IDS
    ]

    with PROJECT.open("w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    kept = [a["id"] for a in calc["data"]["assignments"]]
    print("OK: init -> capitalist-start, parse-capitalist -> calc")
    print(f"OK: calc assignments: {kept}")


if __name__ == "__main__":
    main()
