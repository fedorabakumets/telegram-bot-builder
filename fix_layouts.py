"""
Приводит keyboardLayout к единому виду:
- Карточки обменников (1 url-кнопка + Назад): cols=1, каждая кнопка в отдельной строке
- Карточки с несколькими url-кнопками (P2P боты и т.п.): каждая кнопка в строке, Назад отдельно
- Убирает cols=3 где кнопок 2
"""
import json

PATH = "bots/обменники_133_126/project.json"

with open(PATH, "r", encoding="utf-8") as f:
    d = json.load(f)

root = d.get("data") if "data" in d else d
fixes = 0

for sheet in root["sheets"]:
    for node in sheet["nodes"]:
        if node["type"] != "keyboard":
            continue

        data = node["data"]
        buttons = data.get("buttons", [])
        layout = data.get("keyboardLayout", {})

        if not buttons:
            continue

        # Разделяем кнопки на основные и "Назад"
        back_btns = [b for b in buttons if b.get("text", "").strip().lower() in ("назад", "back")]
        main_btns = [b for b in buttons if b not in back_btns]

        # Пропускаем навигационные клавиатуры главного меню (много goto-кнопок)
        goto_count = sum(1 for b in buttons if b.get("action") == "goto" and b.get("text","").strip().lower() not in ("назад","back"))
        if goto_count > 3:
            continue

        # Строим новый layout: каждая кнопка в отдельной строке
        new_rows = []
        for btn in main_btns:
            new_rows.append({"buttonIds": [btn["id"]]})
        for btn in back_btns:
            new_rows.append({"buttonIds": [btn["id"]]})

        old_rows = layout.get("rows", [])
        old_cols = layout.get("columns", 2)
        old_auto = layout.get("autoLayout", True)

        new_layout = {
            "rows": new_rows,
            "columns": 1,
            "autoLayout": False,
        }

        if new_layout["rows"] != old_rows or old_cols != 1 or old_auto:
            data["keyboardLayout"] = new_layout
            fixes += 1

with open(PATH, "w", encoding="utf-8") as f:
    json.dump(d, f, ensure_ascii=False, indent=2)

print(f"Исправлено клавиатур: {fixes}")
print(f"Готово → {PATH}")
