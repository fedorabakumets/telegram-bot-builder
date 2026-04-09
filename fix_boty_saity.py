import json
with open("bots/обменники_133_126/project.json", "r", encoding="utf-8") as f:
    d = json.load(f)
root = d.get("data") if "data" in d else d
for sheet in root["sheets"]:
    for node in sheet["nodes"]:
        if node["type"] != "keyboard": continue
        btns = node["data"]["buttons"]
        texts = [b["text"] for b in btns]
        if "Боты" in texts and "Сайты" in texts:
            bid = {b["text"]: b["id"] for b in btns}
            node["data"]["keyboardLayout"] = {
                "rows": [
                    {"buttonIds": [bid["Боты"], bid["Сайты"]]},
                    {"buttonIds": [bid["Назад"]]},
                ],
                "columns": 2,
                "autoLayout": False,
            }
            print("Fixed:", node["id"][:55])
with open("bots/обменники_133_126/project.json", "w", encoding="utf-8") as f:
    json.dump(d, f, ensure_ascii=False, indent=2)
