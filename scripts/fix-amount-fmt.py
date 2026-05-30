"""Fix: replace {user_amount_fmt} with {user_amount} in edit-ask-amount-loading nodes."""
import json

path = r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json"

with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

count = 0
for sheet in data["sheets"]:
    for node in sheet.get("nodes", []):
        if node["id"].startswith("edit-ask-amount"):
            old = node["data"].get("editMessageText", "")
            if "{user_amount_fmt}" in old:
                node["data"]["editMessageText"] = old.replace("{user_amount_fmt}", "{user_amount}")
                count += 1
                print(f"Fixed: {node['id']}")

with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Done. Fixed {count} nodes.")
