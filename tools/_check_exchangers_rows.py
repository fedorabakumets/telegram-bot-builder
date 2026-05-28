"""
@fileoverview Запрос строк таблицы exchangers
"""
import json
import sys
import psycopg2
sys.stdout.reconfigure(encoding='utf-8')

conn = psycopg2.connect('postgresql://postgres:postgres@localhost:5432/telegram_bot_builder')
cur = conn.cursor()

# Получаем колонки
cur.execute("SELECT id, name FROM bot_table_columns WHERE table_id=14 ORDER BY id")
columns = cur.fetchall()
print("=== Колонки таблицы exchangers (id=14) ===")
for col in columns:
    print(f"  {col[0]}: {col[1]}")

# Получаем строки
cur.execute("SELECT id, data FROM bot_table_rows WHERE table_id=14 ORDER BY id")
rows = cur.fetchall()
print(f"\n=== Строки ({len(rows)}) ===")
for row in rows:
    row_data = row[1] if isinstance(row[1], dict) else json.loads(row[1]) if row[1] else {}
    name = row_data.get('name', '?')
    url = row_data.get('url', '?')
    print(f"  [{row[0]}] {name}: {url[:100]}")

conn.close()
