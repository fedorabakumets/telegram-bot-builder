"""@fileoverview Dump calc assignment ids"""
import json
from pathlib import Path

d = json.loads(Path("bots/новый_бот_1_242_163/project.json").read_text(encoding="utf-8"))
calc = next(n for n in next(s for s in d["sheets"] if s["id"] == "sheet-bots")["nodes"] if n["id"] == "bot-setv-calc")
for a in calc["data"]["assignments"]:
    print(a["id"], a.get("variable"), (a.get("value") or "")[:70])
