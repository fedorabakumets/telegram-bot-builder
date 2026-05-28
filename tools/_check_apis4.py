"""
@fileoverview Ищем таблицу exchangers
"""
import json
import sys
import os
import re

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_PATH = os.path.join(
    os.path.dirname(__file__), "..",
    "bots", "новый_бот_1_242_163", "project.json"
)

with open(PROJECT_PATH, "r", encoding="utf-8") as f:
    raw = f.read()

# Ищем "exchangers" в тексте
matches = [(m.start(), raw[max(0,m.start()-50):m.start()+200]) for m in re.finditer(r'"exchangers"', raw)]
print(f"Найдено {len(matches)} вхождений 'exchangers':")
for i, (pos, ctx) in enumerate(matches[:5]):
    print(f"\n  [{i}] pos={pos}:")
    print(f"    {ctx[:200]}")

# Ищем таблицу exchangers в data проекта
data = json.loads(raw)

# Проверяем tables на верхнем уровне
if 'tables' in data:
    print(f"\n=== tables (top-level) ===")
    for tname, tdata in data['tables'].items():
        if 'exchang' in tname.lower():
            print(f"  Таблица: {tname}, строк: {len(tdata) if isinstance(tdata, list) else '?'}")
            if isinstance(tdata, list):
                for row in tdata[:3]:
                    print(f"    {json.dumps(row, ensure_ascii=False)[:200]}")

# Проверяем variables
if 'variables' in data:
    print(f"\n=== variables (top-level) ===")
    for v in data.get('variables', []):
        if 'exchang' in v.get('name', '').lower():
            print(f"  {v['name']}: {json.dumps(v.get('defaultValue', ''), ensure_ascii=False)[:200]}")
