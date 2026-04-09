"""Удаляет узлы-сироты без родителей из __________data_split.json."""
import json

INPUT  = "__________data_split.json"
OUTPUT = "__________data_split.json"

with open(INPUT, "r", encoding="utf-8") as f:
    d = json.load(f)

all_nodes = {n["id"]: n for s in d["sheets"] for n in s["nodes"]}

# --- Строим граф входящих связей ---
incoming = {nid: set() for nid in all_nodes}

for nid, node in all_nodes.items():
    data = node["data"]

    kid = data.get("keyboardNodeId")
    if kid and kid in all_nodes:
        incoming[kid].add(nid)

    ato = data.get("autoTransitionTo")
    if ato and ato in all_nodes:
        incoming[ato].add(nid)

    for btn in data.get("buttons", []):
        t = btn.get("target")
        if t and t in all_nodes:
            incoming[t].add(nid)

# --- Определяем что удалить ---
# 1. message -bLSyxREMI9woziy1YVfT — никто не ссылается, удаляем + его keyboard
orphan_msg_id = "-bLSyxREMI9woziy1YVfT_dup_1775330630989_8zhubjyw6"
orphan_msg_kb  = all_nodes[orphan_msg_id]["data"].get("keyboardNodeId") if orphan_msg_id in all_nodes else None

# 2. copy-клавиатура start — дубликат, никто не ссылается
orphan_kb_id = next(
    (nid for nid in all_nodes if "copy_1775058076453" in nid),
    None
)

to_remove = set()
if orphan_msg_id in all_nodes:
    to_remove.add(orphan_msg_id)
    print(f"Удаляем orphan message: {orphan_msg_id}")
if orphan_msg_kb and orphan_msg_kb in all_nodes:
    to_remove.add(orphan_msg_kb)
    print(f"Удаляем keyboard orphan message: {orphan_msg_kb}")
if orphan_kb_id:
    to_remove.add(orphan_kb_id)
    print(f"Удаляем дубль-клавиатуру: {orphan_kb_id}")

# --- Применяем ---
removed = 0
for sheet in d["sheets"]:
    before = len(sheet["nodes"])
    sheet["nodes"] = [n for n in sheet["nodes"] if n["id"] not in to_remove]
    removed += before - len(sheet["nodes"])

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(d, f, ensure_ascii=False, indent=2)

print(f"\nУдалено узлов: {removed}")
print(f"Готово → {OUTPUT}")
