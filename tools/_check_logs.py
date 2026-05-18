import psycopg2

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/telegram_bot_builder")
cur = conn.cursor()

cur.execute("SELECT COUNT(*) FROM bot_logs WHERE project_id = 245")
print(f"Логов для project_id=245: {cur.fetchone()[0]}")

cur.execute("SELECT type, SUBSTRING(content, 1, 100) as msg, timestamp FROM bot_logs WHERE project_id = 245 ORDER BY timestamp DESC LIMIT 5")
rows = cur.fetchall()
print(f"\nПоследние 5 логов:")
for r in rows:
    print(f"  [{r[0]}] {r[1]}  ({r[2]})")

conn.close()
