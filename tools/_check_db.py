import psycopg2

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/telegram_bot_builder")
cur = conn.cursor()

# Все таблицы
cur.execute("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")
print("=== Таблицы в БД ===")
for r in cur.fetchall():
    print(f"  {r[0]}")

# Количество строк в ключевых таблицах
tables = ['bot_users', 'bot_messages', 'bot_groups', 'bot_tables', 'bot_table_rows', 'bot_table_columns', 'media_files', 'bot_tokens', 'bot_projects']
print("\n=== Количество строк ===")
for t in tables:
    try:
        cur.execute(f"SELECT COUNT(*) FROM {t}")
        count = cur.fetchone()[0]
        print(f"  {t}: {count}")
    except:
        conn.rollback()
        print(f"  {t}: не существует")

# user_data пример
cur.execute("SELECT user_id, user_data FROM bot_users WHERE user_data IS NOT NULL AND user_data != '{}' LIMIT 3")
print("\n=== Примеры user_data ===")
for r in cur.fetchall():
    print(f"  user_id={r[0]}: {str(r[1])[:200]}")

conn.close()
