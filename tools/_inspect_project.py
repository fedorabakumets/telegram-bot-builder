import json

with open("bots/сценарий/бот/project.json", "r", encoding="utf-8") as f:
    d = json.load(f)

print(f"Версия: {d.get('version')}")
print(f"Листов: {len(d['sheets'])}\n")

for s in d["sheets"]:
    types = {}
    for n in s["nodes"]:
        t = n["type"]
        types[t] = types.get(t, 0) + 1
    types_str = ", ".join(f"{k}:{v}" for k, v in sorted(types.items()))
    print(f"  {s['name']} ({len(s['nodes'])} узлов)")
    print(f"    {types_str}\n")
