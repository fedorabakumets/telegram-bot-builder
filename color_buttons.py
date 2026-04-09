"""
Раскрашивает кнопки в project.json по логике:
- url-кнопки (переход в бот/сайт) → primary (синий)
- кнопки "Назад" → danger (красный)
- кнопки навигации по разделам (goto, не "Назад") → success (зелёный)
"""
import json

PATH = "bots/обменники_133_126/project.json"

with open(PATH, "r", encoding="utf-8") as f:
    d = json.load(f)

root = d.get("data") if "data" in d else d
colored = 0

for sheet in root["sheets"]:
    for node in sheet["nodes"]:
        for btn in node["data"].get("buttons", []):
            action = btn.get("action", "")
            text = btn.get("text", "").strip().lower()

            GREEN = ("купить", "продать")
            if text in GREEN:
                btn["style"] = "success"
                colored += 1
            elif action in ("url", "goto"):
                btn["style"] = "primary"
                colored += 1

with open(PATH, "w", encoding="utf-8") as f:
    json.dump(d, f, ensure_ascii=False, indent=2)

print(f"Раскрашено кнопок: {colored}")
print(f"Готово → {PATH}")
