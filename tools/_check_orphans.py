import psycopg2

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/telegram_bot_builder")
cur = conn.cursor()

# Токены которые существуют
cur.execute("SELECT id, project_id, name, bot_username FROM bot_tokens ORDER BY id")
tokens = cur.fetchall()
print("=== Существующие токены ===")
for t in tokens:
    print(f"  id={t[0]}, project_id={t[1]}, name={t[2]}, @{t[3]}")

token_ids = [t[0] for t in tokens]

# Данные с token_id которых нет в bot_tokens
print("\n=== Осиротевшие данные (token_id не существует) ===")

tables = [
    ("bot_users", "token_id"),
    ("bot_messages", "token_id"),
    ("bot_logs", "token_id"),
    ("bot_launch_history", "token_id"),
]

for table, col in tables:
    cur.execute(f"""
        SELECT {col}, COUNT(*) 
        FROM {table} 
        WHERE {col} NOT IN (SELECT id FROM bot_tokens) AND {col} != 0
        GROUP BY {col}
    """)
    rows = cur.fetchall()
    if rows:
        for r in rows:
            print(f"  {table}: token_id={r[0]} → {r[1]} строк (ОСИРОТЕЛИ)")
    else:
        # Проверим token_id=0
        cur.execute(f"SELECT COUNT(*) FROM {table} WHERE {col} = 0")
        zero_count = cur.fetchone()[0]
        if zero_count > 0:
            print(f"  {table}: token_id=0 → {zero_count} строк (без привязки к токену)")

# Уникальные token_id в данных
print("\n=== Уникальные token_id в данных ===")
for table, col in tables:
    cur.execute(f"SELECT DISTINCT {col} FROM {table} ORDER BY {col}")
    ids = [r[0] for r in cur.fetchall()]
    print(f"  {table}: {ids}")

conn.close()
