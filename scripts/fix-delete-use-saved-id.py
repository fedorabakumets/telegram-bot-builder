"""Fix: bot-delete-loading and delete-loading-sites use {ask_amount_msg_id} for deletion."""
import json

path = r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json"

with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

count = 0
for sheet in data["sheets"]:
    for node in sheet.get("nodes", []):
        if node["id"] in ("bot-delete-loading", "delete-loading-sites"):
            node["data"]["messageIdSource"] = "custom"
            node["data"]["messageIdManual"] = "{ask_amount_msg_id}"
            count += 1
            print(f"Fixed: {node['id']} -> custom '{'{ask_amount_msg_id'}'")

with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Done. Fixed {count}.")
