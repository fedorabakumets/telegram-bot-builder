"""
Fix: Remove bot-msg-loading from chain, use ask_amount_msg_id for deletion.
1. bot-setv-init: autoTransitionTo from "bot-msg-loading" to "bot-ub-scooby"
2. bot-delete-loading: use {ask_amount_msg_id} instead of {loading_msg_id}
"""
import json

path = r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json"

with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

fixes = 0
for sheet in data["sheets"]:
    for node in sheet.get("nodes", []):
        # 1. bot-setv-init: skip bot-msg-loading, go directly to bot-ub-scooby
        if node["id"] == "bot-setv-init":
            old = node["data"].get("autoTransitionTo")
            if old == "bot-msg-loading":
                node["data"]["autoTransitionTo"] = "bot-ub-scooby"
                fixes += 1
                print(f"Fixed: bot-setv-init -> autoTransitionTo = 'bot-ub-scooby' (was: 'bot-msg-loading')")

        # 2. bot-delete-loading: use ask_amount_msg_id
        if node["id"] == "bot-delete-loading":
            node["data"]["messageIdSource"] = "custom"
            node["data"]["messageIdManual"] = "{ask_amount_msg_id}"
            fixes += 1
            print(f"Fixed: bot-delete-loading -> messageIdManual = '{{ask_amount_msg_id}}'")

with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\nDone. {fixes} fixes applied.")
