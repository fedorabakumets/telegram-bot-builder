import psycopg2

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/telegram_bot_builder")
cur = conn.cursor()

cur.execute("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")
print("=== Все таблицы в БД ===")
for r in cur.fetchall():
    cur.execute(f"SELECT COUNT(*) FROM \"{r[0]}\"")
    count = cur.fetchone()[0]
    print(f"  {r[0]:40s} ({count} строк)")

conn.close()
