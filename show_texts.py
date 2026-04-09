import json
with open("bots/обменники_133_126/project.json", "r", encoding="utf-8") as f:
    d = json.load(f)
root = d.get("data") if "data" in d else d
for sheet in root["sheets"]:
    for node in sheet["nodes"]:
        if node["type"] != "message": continue
        txt = node["data"].get("messageText", "").strip()
        fm = node["data"].get("formatMode", "none")
        if not txt: continue
        print(f"[{fm}] {txt[:200]}")
        print("---")
