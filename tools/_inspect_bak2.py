"""@fileoverview Inspect bak2"""
import json
import re
from pathlib import Path

for name in ["project.json.bak2", "project.json"]:
    p = Path("bots/новый_бот_1_242_163") / name
    d = json.loads(p.read_text(encoding="utf-8"))
    sheet = next(s for s in d["sheets"] if s["id"] == "sheet-bots")
    calc = next(n for n in sheet["nodes"] if n["id"] == "bot-setv-calc")
    print("===", name, "===")
    print("calc:", len(calc["data"]["assignments"]))
    print("fee_scooby:", any(a.get("id") == "fee_scooby" for a in calc["data"]["assignments"]))
    print("scooby->", next(n for n in sheet["nodes"] if n["id"] == "bot-setv-parse-scooby")["data"]["autoTransitionTo"])
    pushes = sum(1 for a in calc["data"]["assignments"] if a.get("mode") == "json_push")
    print("pushes:", pushes)
    print("scooby query:", next(n for n in sheet["nodes"] if n["id"] == "bot-ub-scooby")["data"]["query"])
