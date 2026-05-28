"""
@fileoverview Запрос таблицы exchangers из PostgreSQL
"""
import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

try:
    import psycopg2
except ImportError:
    print("psycopg2 не установлен, пробуем через API...")
    import urllib.request
    url = "http://localhost:5000/api/tables/242/163/exchangers"
    try:
        resp = urllib.request.urlopen(url, timeout=5)
        data = json.loads(resp.read())
        print(f"=== Таблица exchangers (через API) ===")
        print(json.dumps(data, ensure_ascii=False, indent=2)[:3000])
    except Exception as e:
        print(f"API ошибка: {e}")
        # Попробуем напрямую через psycopg2
    sys.exit(0)

conn = psycopg2.connect('postgresql://postgres:postgres@localhost:5432/telegram_bot_builder')
cur = conn.cursor()

# Ищем таблицу exchangers
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '%table%'")
print("=== Таблицы в БД ===")
for row in cur.fetchall():
    print(f"  {row[0]}")

# Пробуем разные варианты
for query in [
    "SELECT * FROM bot_tables WHERE project_id=242 AND name='exchangers'",
    "SELECT * FROM bot_tables WHERE project_id=242",
    "SELECT * FROM tables WHERE project_id=242 AND name='exchangers'",
]:
    try:
        cur.execute(query)
        rows = cur.fetchall()
        if rows:
            print(f"\n=== {query} → {len(rows)} rows ===")
            for row in rows[:3]:
                print(f"  {str(row)[:300]}")
            break
    except Exception as e:
        conn.rollback()
        continue

conn.close()
