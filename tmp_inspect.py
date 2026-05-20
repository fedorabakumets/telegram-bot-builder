import json

with open(r'c:\Users\1\Desktop\telegram-bot-builder\bots\новый_бот_1_242_157\project.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

print('Top keys:', list(d.keys()))

# Check inside sheets
for sheet in d.get('sheets', []):
    sheet_keys = list(sheet.keys())
    print(f'\nSheet: {sheet.get("name")} keys={sheet_keys}')
    tables = sheet.get('dataTables', sheet.get('tables', []))
    if tables:
        print(f'  Tables count: {len(tables)}')
        for tb in tables:
            name = tb.get('name', '?')
            tid = tb.get('id', '?')
            cols = tb.get('columns', [])
            rows = tb.get('rows', [])
            print(f'    - {name} (id={tid}, cols={len(cols)}, rows={len(rows)})')
            for col in cols:
                print(f'        col: {col.get("name","?")} (type={col.get("type","?")})')
            if rows:
                for i, row in enumerate(rows[:5]):
                    print(f'        row[{i}]: {row}')
                if len(rows) > 5:
                    print(f'        ... ({len(rows)} rows total)')
