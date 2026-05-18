import psycopg2

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/telegram_bot_builder")
cur = conn.cursor()

cur.execute("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")
tables = [r[0] for r in cur.fetchall()]

for t in tables:
    cur.execute(f"SELECT COUNT(*) FROM \"{t}\"")
    count = cur.fetchone()[0]
    print(f"\n{'='*60}")
    print(f"  {t} ({count} строк)")
    print(f"{'='*60}")
    cur.execute("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = %s AND table_schema = 'public'
        ORDER BY ordinal_position
    """, (t,))
    for col in cur.fetchall():
        nullable = "" if col[2] == "YES" else " NOT NULL"
        default = f" DEFAULT {col[3]}" if col[3] else ""
        print(f"    {col[0]:30s} {col[1]}{nullable}{default}")
    
    # FK
    cur.execute("""
        SELECT kcu.column_name, ccu.table_name, ccu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = %s
    """, (t,))
    fks = cur.fetchall()
    if fks:
        print(f"    --- FK ---")
        for fk in fks:
            print(f"    {fk[0]} -> {fk[1]}.{fk[2]}")

conn.close()
