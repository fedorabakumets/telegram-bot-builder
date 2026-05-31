"""Fix: save message ID in bot-msg-ask-amount and use it in edit-ask-amount-loading."""
import json

path = r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json"

with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

fixes = 0
for sheet in data["sheets"]:
    for node in sheet.get("nodes", []):
        # 1. bot-msg-ask-amount — save message ID
        if node["id"] == "bot-msg-ask-amount":
            node["data"]["saveMessageIdTo"] = "ask_amount_msg_id"
            fixes += 1
            print(f"Fixed: bot-msg-ask-amount -> saveMessageIdTo = 'ask_amount_msg_id'")
        
        # 2. msg-compare-ask-amount (sites) — save message ID too
        if node["id"] == "msg-compare-ask-amount":
            node["data"]["saveMessageIdTo"] = "ask_amount_msg_id"
            fixes += 1
            print(f"Fixed: msg-compare-ask-amount -> saveMessageIdTo = 'ask_amount_msg_id'")
        
        # 3. edit-ask-amount-loading — use saved ID
        if node["id"] == "edit-ask-amount-loading":
            node["data"]["editMessageIdSource"] = "custom"
            node["data"]["editMessageIdManual"] = "{ask_amount_msg_id}"
            fixes += 1
            print(f"Fixed: edit-ask-amount-loading -> custom ID '{{ask_amount_msg_id}}'")
        
        # 4. edit-ask-amount-loading-sites — use saved ID
        if node["id"] == "edit-ask-amount-loading-sites":
            node["data"]["editMessageIdSource"] = "custom"
            node["data"]["editMessageIdManual"] = "{ask_amount_msg_id}"
            fixes += 1
            print(f"Fixed: edit-ask-amount-loading-sites -> custom ID '{{ask_amount_msg_id}}'")

with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\nDone. {fixes} fixes applied.")
