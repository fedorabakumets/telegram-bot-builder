"""
Проверяет все клавиатуры:
1. Есть ли кнопка Назад
2. Стоит ли она последней в rows
"""
import json

PATH = "bots/обменники_133_126/project.json"

with open(PATH, "r", encoding="utf-8") as f:
    d = json.load(f)

root = d.get("data") if "data" in d else d
issues = []
ok = 0

for sheet in root["sheets"]:
    for node in sheet["nodes"]:
        if node["type"] != "keyboard":
            continue

        data = node["data"]
        buttons = data.get("buttons", [])
        layout = data.get("keyboardLayout", {})
        rows = layout.get("rows", [])

        if not buttons:
            continue

        # Пропускаем большие навигационные клавиатуры
        goto_count = sum(1 for b in buttons if b.get("action") == "goto"
                         and b.get("text","").strip().lower() not in ("назад","back"))
        if goto_count > 3:
            continue

        back_btns = [b for b in buttons if b.get("text","").strip().lower() in ("назад","back")]
        back_ids = {b["id"] for b in back_btns}

        # 1. Нет кнопки Назад
        if not back_btns:
            issues.append(f"❌ НЕТ НАЗАД | {sheet['name']} | {node['id'][:50]}")
            continue

        # 2. Назад не последняя в rows
        if rows:
            last_row_ids = set(rows[-1].get("buttonIds", []))
            if not last_row_ids & back_ids:
                # Найдём где она стоит
                pos = next((i for i, r in enumerate(rows) if set(r.get("buttonIds",[])) & back_ids), -1)
                issues.append(f"⚠️  НАЗАД НЕ ПОСЛЕДНЯЯ (строка {pos}/{len(rows)-1}) | {sheet['name']} | {node['id'][:50]}")
                issues.append(f"   кнопки: {[b.get('text') for b in buttons]}")
                continue

        ok += 1

print(f"✅ Корректных клавиатур: {ok}")
print(f"⚠️  Проблем: {len(issues)}")
for issue in issues:
    print(f"  {issue}")
