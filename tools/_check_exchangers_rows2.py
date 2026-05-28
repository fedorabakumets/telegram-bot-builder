"""
@fileoverview Запрос строк таблицы exchangers — полный дамп data
"""
import json
import sys
import psycopg2
sys.stdout.reconfigure(encoding='utf-8')

conn = psycopg2.connect('postgresql://postgres:postgres@localhost:5432/telegram_bot_builder')
cur = conn.cursor()

# Получаем строки с полным data
cur.execute("SELECT id, data, row_number FROM bot_table_rows WHERE table_id=14 ORDER BY row_number, id")
rows = cur.fetchall()
print(f"=== Строки таблицы exchangers ({len(rows)}) ===\n")
for row in rows:
    row_id = row[0]
    data = row[1]
    row_num = row[2]
    print(f"[{row_id}] row_num={row_num}: {json.dumps(data, ensure_ascii=False)}")

conn.close()
