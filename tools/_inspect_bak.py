"""@fileoverview Inspect bak"""
import json
import re
from pathlib import Path

bak = json.loads(Path("bots/новый_бот_1_242_163/project.json.bak").read_text(encoding="utf-8"))
sheet = next(s for s in bak["sheets"] if s["id"] == "sheet-bots")
calc = next(n for n in sheet["nodes"] if n["id"] == "bot-setv-calc")
print("calc assignments:", len(calc["data"]["assignments"]))
for a in calc["data"]["assignments"]:
    if a.get("mode") == "json_push":
        m = re.search(r'"name": "([^"]+)"', a["value"])
        print(" push:", m.group(1) if m else a["id"])
print("scooby->", next(n for n in sheet["nodes"] if n["id"] == "bot-setv-parse-scooby")["data"]["autoTransitionTo"])
print("imperia->", next(n for n in sheet["nodes"] if n["id"] == "bot-setv-parse-imperia")["data"]["autoTransitionTo"])
print("has fee_scooby:", any(a.get("id") == "fee_scooby" for a in calc["data"]["assignments"]))
print("has viron push:", any("VIRON" in a.get("value", "") for a in calc["data"]["assignments"]))
