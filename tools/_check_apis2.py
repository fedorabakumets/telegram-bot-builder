"""
@fileoverview Проверка API обменников — ищем таблицу с URL
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

# Ищем bot_table узлы
for nid, node in nodes.items():
    if node.get('type') == 'bot_table':
        d = node['data']
        table_name = d.get('tableName', '?')
        rows = d.get('tableRows', [])
        print(f"=== Таблица: {table_name} (узел {nid}) ===")
        print(f"  Строк: {len(rows)}")
        if rows:
            # Показать первые 3 строки
            for i, row in enumerate(rows[:3]):
                print(f"  [{i}] {json.dumps(row, ensure_ascii=False)[:200]}")
            if len(rows) > 3:
                print(f"  ... и ещё {len(rows)-3}")
        print()

# Ищем переменную exchanger.url в таблицах
print("\n=== Поиск exchanger.url ===")
for nid, node in nodes.items():
    if node.get('type') == 'bot_table':
        d = node['data']
        rows = d.get('tableRows', [])
        for row in rows:
            if 'url' in row:
                name = row.get('name', '?')
                url = row.get('url', '?')
                if 'exbitbot' in url or 'cryptobar' in url:
                    print(f"  FOUND: {name} → {url}")
