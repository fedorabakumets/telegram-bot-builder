"""Fix: add regexGroup: '1' to regex_extract assignments in setv-parse-refresh."""
import json

path = r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json"

with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

count = 0
for sheet in data["sheets"]:
    for node in sheet.get("nodes", []):
        if node["id"] == "setv-parse-refresh":
            for a in node["data"]["assignments"]:
                if a["mode"] == "regex_extract" and "regexGroup" not in a:
                    a["regexGroup"] = "1"
                    count += 1
                    print(f"Fixed: {a['variable']} -> added regexGroup='1'")

with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\nDone. Fixed {count} assignments.")
