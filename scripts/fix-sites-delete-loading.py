"""Add delete node before msg-compare-result for sites mode."""
import json

path = r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json"

with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

TARGET_SHEET = "sheet-compare-rates"
fixes = 0

for sheet in data["sheets"]:
    if sheet["id"] != TARGET_SHEET:
        continue
    nodes = sheet["nodes"]
    
    # 1. Add delete node for sites
    if not any(n["id"] == "delete-loading-sites" for n in nodes):
        nodes.append({
            "id": "delete-loading-sites",
            "data": {
                "buttons": [],
                "markdown": False,
                "adminOnly": False,
                "showInMenu": False,
                "messageText": "",
                "keyboardType": "none",
                "messageIdSource": "custom",
                "messageIdManual": "{ask_amount_msg_id}",
                "chatIdSource": "current_chat",
                "chatIdManual": "",
                "ignoreErrors": True,
                "bulkDelete": False,
                "bulkMessageIdsVariable": "",
                "autoTransitionTo": "msg-compare-result",
                "enableAutoTransition": True,
                "enableStatistics": False
            },
            "type": "delete_message",
            "position": {"x": 900, "y": 450}
        })
        fixes += 1
        print("Added: delete-loading-sites node")
    
    # 2. Change cond-after-sites else branch to delete-loading-sites
    for node in nodes:
        if node["id"] == "cond-after-sites":
            for branch in node["data"].get("branches", []):
                if branch["id"] == "cas_else" and branch["target"] == "msg-compare-result":
                    branch["target"] = "delete-loading-sites"
                    fixes += 1
                    print("Fixed: cond-after-sites.cas_else -> delete-loading-sites")

with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\nDone. {fixes} fixes applied.")
