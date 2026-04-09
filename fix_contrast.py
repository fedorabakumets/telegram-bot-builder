"""
1. В клавиатурах где есть url-кнопка — делает "Назад" danger (красный) для контраста
2. Проверяет все клавиатуры на наличие кнопки "Назад"
   Если нет — добавляет, target = start_dup_1775330630988_2w4z6c8t9
"""
import json

PATH = "bots/обменники_133_126/project.json"
DEFAULT_BACK_TARGET = "start_dup_1775330630988_2w4z6c8t9"

with open(PATH, "r", encoding="utf-8") as f:
    d = json.load(f)

root = d.get("data") if "data" in d else d

contrast_fixed = 0
back_added = 0
no_back = []

for sheet in root["sheets"]:
    for node in sheet["nodes"]:
        if node["type"] != "keyboard":
            continue

        data = node["data"]
        buttons = data.get("buttons", [])
        if not buttons:
            continue

        has_url = any(b.get("action") == "url" for b in buttons)
        back_btns = [b for b in buttons if b.get("text", "").strip().lower() in ("назад", "back")]
        has_back = len(back_btns) > 0

        # 1. Контраст: если есть url-кнопка — "Назад" делаем danger
        if has_url and has_back:
            for btn in back_btns:
                if btn.get("style") != "danger":
                    btn["style"] = "danger"
                    contrast_fixed += 1

        # 2. Добавляем "Назад" если нет
        if not has_back:
            # Пропускаем главное меню (много goto без назад — это норма)
            goto_count = sum(1 for b in buttons if b.get("action") == "goto"
                             and b.get("text","").strip().lower() not in ("назад","back"))
            if goto_count > 3:
                no_back.append(f"[ПРОПУЩЕНО — навигация] {node['id'][:50]}")
                continue

            new_back = {
                "id": f"back_btn_{node['id'][:12]}",
                "text": "Назад",
                "action": "goto",
                "target": DEFAULT_BACK_TARGET,
                "style": "danger" if has_url else "primary",
                "hideAfterClick": False,
                "skipDataCollection": False,
            }
            buttons.append(new_back)

            # Добавляем в layout
            layout = data.get("keyboardLayout", {})
            rows = layout.get("rows", [])
            rows.append({"buttonIds": [new_back["id"]]})
            layout["rows"] = rows
            layout["columns"] = 1
            layout["autoLayout"] = False
            data["keyboardLayout"] = layout

            back_added += 1
            no_back.append(f"[ДОБАВЛЕН] {node['id'][:50]} | sheet: {sheet['name']}")

with open(PATH, "w", encoding="utf-8") as f:
    json.dump(d, f, ensure_ascii=False, indent=2)

print(f"Контраст исправлен (danger): {contrast_fixed} кнопок")
print(f"Кнопка Назад добавлена: {back_added}")
if no_back:
    print("\nДетали:")
    for item in no_back:
        print(f"  {item}")
print(f"\nГотово → {PATH}")
