"""Убирает пробелы перед variation selector U+FE0F и skin tone модификаторами."""
import json, re

PATH = "bots/обменники_133_126/project.json"

with open(PATH, "r", encoding="utf-8") as f:
    d = json.load(f)

root = d.get("data") if "data" in d else d
fixed = 0

# Пробел перед variation selector ️ (U+FE0F)
VS16 = re.compile(r' \uFE0F')
# Пробел перед skin tone модификаторами (U+1F3FB–U+1F3FF)
SKIN = re.compile(r' ([\U0001F3FB-\U0001F3FF])')
# Пробел перед ZWJ (U+200D) — для составных эмодзи типа 🏃🏻‍♂️
ZWJ = re.compile(r' \u200D')
# Пробел после ZWJ
ZWJ2 = re.compile(r'\u200D ')

for sheet in root["sheets"]:
    for node in sheet["nodes"]:
        if node["type"] != "message": continue
        txt = node["data"].get("messageText", "")
        new = VS16.sub('\uFE0F', txt)
        new = SKIN.sub(r'\1', new)
        new = ZWJ.sub('\u200D', new)
        new = ZWJ2.sub('\u200D', new)
        if new != txt:
            node["data"]["messageText"] = new
            fixed += 1

with open(PATH, "w", encoding="utf-8") as f:
    json.dump(d, f, ensure_ascii=False, indent=2)

print(f"Исправлено сообщений: {fixed}")
print(f"Готово → {PATH}")
