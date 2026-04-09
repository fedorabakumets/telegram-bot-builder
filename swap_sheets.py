"""Меняет местами лист 1 и лист 2 в project.json."""
import json
import sys

path = sys.argv[1] if len(sys.argv) > 1 else "bots/обменники_133_126/project.json"

with open(path, "r", encoding="utf-8") as f:
    d = json.load(f)

# Поддержка обёртки в data или напрямую
root = d.get("data") if "data" in d else d
sheets = root["sheets"]

print("До:")
for i, s in enumerate(sheets):
    print(f"  {i}: {s['name']} ({len(s['nodes'])} nodes)")

# Меняем местами индексы 0 и 1
sheets[0], sheets[1] = sheets[1], sheets[0]

# Обновляем activeSheetId на первый лист
root["activeSheetId"] = sheets[0]["id"]

print("\nПосле:")
for i, s in enumerate(sheets):
    print(f"  {i}: {s['name']} ({len(s['nodes'])} nodes)")

with open(path, "w", encoding="utf-8") as f:
    json.dump(d, f, ensure_ascii=False, indent=2)

print(f"\nГотово → {path}")
