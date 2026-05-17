"""
@fileoverview Скрипт для инспекции PostgreSQL базы данных
@module tools/inspect_pg
"""

import psycopg2
import sys


def inspect(dsn: str) -> None:
    """
    Выводит структуру и содержимое PostgreSQL БД
    @param dsn - строка подключения
    """
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()

    # Список таблиц
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
    """)
    tables = cur.fetchall()
    print(f"=== PostgreSQL: {dsn.split('@')[1] if '@' in dsn else dsn} ===")
    print(f"Таблиц: {len(tables)}\n")

    for (table_name,) in tables:
        print(f"--- {table_name} ---")

        # Колонки
        cur.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = %s AND table_schema = 'public'
            ORDER BY ordinal_position
        """, (table_name,))
        columns = cur.fetchall()
        for col in columns:
            print(f"  {col[0]} ({col[1]}), null={col[2]}, default={col[3]}")

        # Количество записей
        cur.execute(f'SELECT COUNT(*) FROM "{table_name}"')
        count = cur.fetchone()[0]
        print(f"  Записей: {count}")

        # Примеры
        if count > 0:
            cur.execute(f'SELECT * FROM "{table_name}" LIMIT 5')
            rows = cur.fetchall()
            col_names = [desc[0] for desc in cur.description]
            print(f"  Колонки: {col_names}")
            for row in rows:
                print(f"    {row}")
        print()

    conn.close()


if __name__ == "__main__":
    dsn = sys.argv[1] if len(sys.argv) > 1 else "postgresql://postgres:postgres@localhost:5432/telegram_bot_builder"
    inspect(dsn)
