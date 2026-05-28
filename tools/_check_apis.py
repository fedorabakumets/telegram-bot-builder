"""
@fileoverview Проверка API обменников exbitbot и cryptobar
"""
import json
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_PATH = os.path.join(
    os.path.dirname(__file__), "..",
    "bots", "новый_бот_1_242_163", "project.json"
)

with open(PROJECT_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

nodes = {n['id']: n for s in data['sheets'] for n in s['nodes']}
node = nodes['fetch-compare-rate']
d = node['data']

print("=== fetch-compare-rate ===")
print(f"URL шаблон: {d.get('httpRequestUrl', '?')}")
print(f"Метод: {d.get('httpRequestMethod', '?')}")
print(f"Batch mode: {d.get('httpRequestBatchMode', '?')}")
print()

# Показать batch exchangers
batch_items = d.get('httpRequestBatchItems', [])
print(f"Batch items ({len(batch_items)}):")
for item in batch_items:
    print(f"  - {item.get('name', '?')}: {item.get('url', '?')}")
