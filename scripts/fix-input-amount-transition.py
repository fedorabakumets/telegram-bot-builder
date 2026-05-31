"""Fix: add autoTransitionTo to bot-input-amount so manual input goes to bot-cond-in-progress."""
import json

path = r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json"

with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

fixed = False
for sheet in data["sheets"]:
    for node in sheet.get("nodes", []):
        if node["id"] == "bot-input-amount":
            node["data"]["autoTransitionTo"] = "bot-cond-in-progress"
            node["data"]["enableAutoTransition"] = True
            fixed = True
            print(f"Fixed: bot-input-amount -> autoTransitionTo = 'bot-cond-in-progress'")

with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Done. Fixed: {fixed}")
