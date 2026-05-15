"""
@fileoverview Убирает ferma.cc из пар ЮMoney (yam-usdt, yam-ton).
ferma.cc не поддерживает ЮMoney (ID 48) — нет данных в API.

Удаляет ноды fetch-ferma-yam-* и убирает ferma из текстов show-yam-*.
"""
import json

path = "bots/обменники_240_153/project.json"

with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

removed_nodes = 0
fixed_texts = 0
fixed_assignments = 0

for sheet in data.get("sheets", []):
    nodes = sheet.get("nodes", [])

    # Убираем ноды fetch-ferma-yam-*
    before = len(nodes)
    nodes[:] = [n for n in nodes if not n["id"].startswith("fetch-ferma-yam-")]
    removed_nodes += before - len(nodes)

    # Исправляем autoTransitionTo: fetch-pocket-yam-* → setv-yam-* (вместо fetch-ferma-yam-*)
    for node in nodes:
        if node["id"].startswith("fetch-pocket-yam-"):
            # pocket был предпоследним, теперь он последний перед setv
            pair = node["id"].replace("fetch-pocket-yam-", "")  # usdt или ton
            node["data"]["autoTransitionTo"] = f"setv-yam-{pair}"

    # Убираем ferma из set_variable assignments (yam пары)
    for node in nodes:
        if node["id"].startswith("setv-yam-"):
            assignments = node["data"].get("assignments", [])
            before_a = len(assignments)
            assignments[:] = [a for a in assignments if "ferma" not in a.get("variable", "")]
            fixed_assignments += before_a - len(assignments)

    # Убираем строку ferma из текстов show-yam-*
    for node in nodes:
        if node["id"].startswith("show-yam-"):
            msg = node["data"].get("messageText", "")
            # Убираем строку с ferma
            lines = msg.split("\\n")
            lines = [l for l in lines if "ferma" not in l.lower()]
            node["data"]["messageText"] = "\\n".join(lines)
            fixed_texts += 1

    sheet["nodes"] = nodes

with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"🗑️  Удалено нод: {removed_nodes}")
print(f"📝 Исправлено assignments: {fixed_assignments}")
print(f"📝 Исправлено текстов: {fixed_texts}")
print("✅ Готово")
