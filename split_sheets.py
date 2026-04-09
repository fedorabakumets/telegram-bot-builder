"""
Скрипт для разбивки одного листа с узлами на несколько листов по N узлов.
Читает __________data.json, сортирует узлы по Y, делит на листы по CHUNK_SIZE.
"""

import json
import uuid

INPUT_FILE = "__________data.json"
OUTPUT_FILE = "__________data_split.json"
CHUNK_SIZE = 8

with open(INPUT_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

original_sheet = data["sheets"][0]
nodes = original_sheet["nodes"]

# Сортируем по Y позиции
nodes_sorted = sorted(nodes, key=lambda n: n["position"]["y"])

print(f"Всего узлов: {len(nodes_sorted)}")

# Разбиваем на чанки по CHUNK_SIZE
chunks = [nodes_sorted[i:i + CHUNK_SIZE] for i in range(0, len(nodes_sorted), CHUNK_SIZE)]

new_sheets = []
first_sheet_id = None
for idx, chunk in enumerate(chunks, start=1):
    sheet_id = str(uuid.uuid4())
    if first_sheet_id is None:
        first_sheet_id = sheet_id

    # Копируем все поля оригинального листа, заменяем id/name/nodes
    # Очищаем attachedMedia у каждого узла
    for node in chunk:
        if "data" in node and "attachedMedia" in node["data"]:
            node["data"]["attachedMedia"] = []

    sheet = {
        **{k: v for k, v in original_sheet.items() if k not in ("id", "name", "nodes")},
        "id": sheet_id,
        "name": f"Обменники — часть {idx}",
        "nodes": chunk,
    }
    new_sheets.append(sheet)
    print(f"  Лист {idx}: {len(chunk)} узлов (y {chunk[0]['position']['y']} — {chunk[-1]['position']['y']})")

# Сохраняем все поля верхнего уровня оригинала
result = {
    **{k: v for k, v in data.items() if k not in ("sheets", "activeSheetId")},
    "sheets": new_sheets,
    "activeSheetId": first_sheet_id,
}

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"\nГотово → {OUTPUT_FILE} ({len(new_sheets)} листов)")

