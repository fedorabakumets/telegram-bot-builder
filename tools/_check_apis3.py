"""
@fileoverview Ищем URL обменников в fetch-compare-rate и loop
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

# Полный дамп fetch-compare-rate
node = nodes['fetch-compare-rate']
d = node['data']
print("=== fetch-compare-rate FULL DATA ===")
for key, val in d.items():
    if key.startswith('http'):
        val_str = json.dumps(val, ensure_ascii=False) if not isinstance(val, str) else val
        if len(val_str) > 300:
            val_str = val_str[:300] + '...'
        print(f"  {key}: {val_str}")

# Ищем exchangers в setv-compare-init
print("\n=== setv-compare-init assignments (ищем URL) ===")
node = nodes.get('setv-compare-init')
if node:
    for a in node['data'].get('assignments', []):
        if 'url' in a.get('variable', '').lower() or 'exb' in a.get('variable', '').lower():
            print(f"  {a['variable']} = {a.get('value', '?')[:200]}")

# Ищем loop-compare-exchangers
print("\n=== loop-compare-exchangers ===")
node = nodes.get('loop-compare-exchangers')
if node:
    print(json.dumps(node['data'], ensure_ascii=False, indent=2)[:1000])
