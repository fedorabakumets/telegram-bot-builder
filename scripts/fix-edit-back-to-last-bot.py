"""Fix: revert edit-ask-amount-loading to use last_bot_message instead of custom.
last_bot_message works for both cases:
- Button press: last bot msg = ask-amount message (with sum buttons)
- Refresh: last bot msg = results message (with Обновить button)
"""
import json

path = r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json"

with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

count = 0
for sheet in data["sheets"]:
    for node in sheet.get("nodes", []):
        if node["id"] in ("edit-ask-amount-loading", "edit-ask-amount-loading-sites"):
            node["data"]["editMessageIdSource"] = "last_bot_message"
            node["data"]["editMessageIdManual"] = ""
            count += 1
            print(f"Fixed: {node['id']} -> editMessageIdSource = 'last_bot_message'")

with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\nDone. Fixed {count} nodes.")
