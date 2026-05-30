"""Remove /compare_bots command trigger from project.json."""
import json

path = r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json"

with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

removed = 0
for sheet in data["sheets"]:
    nodes = sheet.get("nodes", [])
    to_remove = []
    for node in nodes:
        node_str = json.dumps(node.get("data", {}), ensure_ascii=False)
        if "/compare_bots" in node_str:
            print(f"Found in sheet '{sheet['id']}': node '{node['id']}' type={node.get('type')}")
            to_remove.append(node["id"])
    
    if to_remove:
        before = len(nodes)
        sheet["nodes"] = [n for n in nodes if n["id"] not in to_remove]
        removed += before - len(sheet["nodes"])
        for nid in to_remove:
            print(f"  Removed: {nid}")

with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\nDone. Removed {removed} nodes.")
