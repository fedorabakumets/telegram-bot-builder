"""@fileoverview Проверка цепочки ботов в project.json"""
import json
import re
from pathlib import Path

p = Path("bots/новый_бот_1_242_163/project.json")
d = json.loads(p.read_text(encoding="utf-8"))
sheet = next(s for s in d["sheets"] if s["id"] == "sheet-bots")
nodes = {n["id"]: n for n in sheet["nodes"]}

chain = []
cur = nodes["bot-setv-init"]["data"]["autoTransitionTo"]
seen = set()
while cur and cur not in seen and cur in nodes:
    seen.add(cur)
    chain.append(cur)
    nxt = nodes[cur]["data"].get("autoTransitionTo", "")
    if not nodes[cur]["data"].get("enableAutoTransition", True):
        break
    cur = nxt

print("=== ЦЕПОЧКА от bot-setv-init ===")
print(f"Узлов: {len(chain)}")
print(f"Финиш: {chain[-1] if chain else '?'}")

parse_in_chain = [x for x in chain if x.startswith("bot-setv-parse")]
print(f"\nParse-нод в цепочке ({len(parse_in_chain)}):")
for x in parse_in_chain:
    print(f"  {x}")

calc = nodes["bot-setv-calc"]
pushes = [a for a in calc["data"]["assignments"] if a.get("mode") == "json_push"]
print(f"\njson_push в calc ({len(pushes)}):")
for a in pushes:
    m = re.search(r'"name": "([^"]+)"', a["value"])
    print(f"  {m.group(1) if m else a['id']}")

expected_parse = [
    "bot-setv-parse-scooby", "bot-setv-parse-capitalist", "bot-setv-parse-24crypto",
    "bot-setv-parse-shaxta", "bot-setv-parse-bitmixer", "bot-setv-parse-litebit",
    "bot-setv-parse-sanchez", "bot-setv-parse-imperia", "bot-setv-parse-viron",
    "bot-setv-parse-cf", "bot-setv-parse-vortex", "bot-setv-parse-crazy",
    "bot-setv-parse-inf", "bot-setv-parse-lucky", "bot-setv-parse-love",
    "bot-setv-parse-casper", "bot-setv-parse-monopoly",
]
missing_chain = [x for x in expected_parse if x not in chain]
missing_push = []
names = []
for a in pushes:
    m = re.search(r'"name": "([^"]+)"', a["value"])
    if m:
        names.append(m.group(1))
for e in ["ScoobyChange", "Capitalist", "24Crypto", "Shaxta", "BitMixer", "LiteBit",
          "Sanchez", "Империя", "VIRON", "CryptoFlow", "Vortex", "CrazyBTC",
          "INFINITY", "Lucky", "Love", "CASPER", "BTC Monopoly"]:
    if e not in names:
        missing_push.append(e)

print("\n=== ПРОБЕЛЫ ===")
print("Parse не в цепочке:", missing_chain or "нет")
print("Нет в json_push:", missing_push or "нет")
print("viron в цепочке:", any("viron" in x for x in chain))
print("calc reachable:", "bot-setv-calc" in chain or chain[-1] == "bot-setv-parse-monopoly")
