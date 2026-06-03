"""@fileoverview BFS проверка цепочки"""
import json
from collections import deque
from pathlib import Path

d = json.loads(Path("bots/новый_бот_1_242_163/project.json").read_text(encoding="utf-8"))
sheet = next(s for s in d["sheets"] if s["id"] == "sheet-bots")
nodes = {n["id"]: n for n in sheet["nodes"]}


def next_ids(nid):
    n = nodes.get(nid)
    if not n:
        return []
    data = n["data"]
    if n["type"] == "condition":
        return [b["target"] for b in data.get("branches", []) if b.get("target")]
    if data.get("enableAutoTransition", True) and data.get("autoTransitionTo"):
        return [data["autoTransitionTo"]]
    return []


seen = set()
q = deque(["bot-setv-init"])
while q:
    cur = q.popleft()
    if cur in seen:
        continue
    seen.add(cur)
    for nxt in next_ids(cur):
        q.append(nxt)

parse = sorted(x for x in seen if x.startswith("bot-setv-parse"))
print("parse reachable:", len(parse))
print("calc:", "bot-setv-calc" in seen)
print("format:", "bot-setv-format" in seen)
print("viron parse:", "bot-setv-parse-viron" in seen)
print("scooby query:", nodes["bot-ub-scooby"]["data"]["query"])
print("scooby->", nodes["bot-setv-parse-scooby"]["data"]["autoTransitionTo"])
