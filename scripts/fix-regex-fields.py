"""Fix: swap value/regexSource to value/pattern for regex_extract in setv-parse-refresh."""
import json

path = r"c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_163\project.json"

with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

count = 0
for sheet in data["sheets"]:
    for node in sheet.get("nodes", []):
        if node["id"] == "setv-parse-refresh":
            for a in node["data"]["assignments"]:
                if a["mode"] == "regex_extract" and "regexSource" in a:
                    # Swap: value had the pattern, regexSource had the source
                    old_value = a["value"]  # was pattern like "^([^:]+)"
                    old_source = a["regexSource"]  # was source like "{refresh_payload}"
                    a["value"] = old_source  # source goes to value
                    a["pattern"] = old_value  # pattern goes to pattern field
                    del a["regexSource"]  # remove wrong field
                    count += 1
                    print(f"Fixed: {a['variable']} -> value='{a['value']}', pattern='{a['pattern']}'")

with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\nDone. Fixed {count} assignments.")
