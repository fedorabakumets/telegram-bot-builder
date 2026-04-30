"""
@fileoverview Временный скрипт — убирает callback из modes узла send-message-input
"""
import json

path = "bots/импортированный_проект_2316_157_131/project.json"
with open(path, encoding="utf-8") as f:
    p = json.load(f)

for s in p["sheets"]:
    if s["id"] == "sheet-send-message":
        for n in s["nodes"]:
            if n["id"] == "send-message-input":
                # Убираем callback из enableTextInput — оставляем только text
                # Также убираем все медиа-типы кроме text
                n["data"]["enablePhotoInput"] = False
                n["data"]["enableVideoInput"] = False
                n["data"]["enableAudioInput"] = False
                n["data"]["enableDocumentInput"] = False
                n["data"]["enableTextInput"] = True
                print(f"Обновлён узел {n['id']}: только текстовый ввод")

with open(path, "w", encoding="utf-8") as f:
    json.dump(p, f, ensure_ascii=False, indent=2)

print("Готово")
