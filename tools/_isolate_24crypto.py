"""
@fileoverview Изоляция: только 24Crypto в цепочке сравнения.
"""
import json
from pathlib import Path

PROJECT = Path("bots/новый_бот_1_242_163/project.json")

CRYPTO24_CALC_IDS = {"init_arr", "fmt3", "push_crypto24"}


def main() -> None:
    """Capitalist → 24Crypto → calc."""
    with PROJECT.open(encoding="utf-8") as f:
        project = json.load(f)

    sheet = next(s for s in project["sheets"] if s["id"] == "sheet-bots")
    nodes = {n["id"]: n for n in sheet["nodes"]}

    nodes["bot-setv-init"]["data"]["autoTransitionTo"] = "bot-ub-24crypto-start"
    nodes["bot-setv-parse-24crypto"]["data"]["autoTransitionTo"] = "bot-setv-calc"
    nodes["bot-setv-parse-24crypto"]["data"]["enableAutoTransition"] = True

    calc = nodes["bot-setv-calc"]
    calc["data"]["assignments"] = [
        a for a in calc["data"]["assignments"] if a.get("id") in CRYPTO24_CALC_IDS
    ]

    with PROJECT.open("w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    kept = [a["id"] for a in calc["data"]["assignments"]]
    print(f"OK: init -> 24crypto-start, parse -> calc")
    print(f"OK: calc: {kept}")


if __name__ == "__main__":
    main()
