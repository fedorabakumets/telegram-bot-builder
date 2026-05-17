"""
@fileoverview Скрипт для инспекции SQLite базы данных
@module tools/inspect_db
"""

import sqlite3
import sys


def inspect(path: str) -> None:
    """
    Выводит структуру и содержимое БД
    @param path - путь к .db файлу
    """
    conn = sqlite3.connect(path)
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print(f"=== БД: {path} ===")
    print(f"Таблиц: {len(tables)}\n")

    for (table_name,) in tables:
        print(f"--- Таблица: {table_name} ---")
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        print("Колонки:")
        for col in columns:
            print(f"  {col[1]} ({col[2]}), nullable={not col[3]}, default={col[4]}, pk={col[5]}")

        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        print(f"Записей: {count}")

        if count > 0:
            cursor.execute(f"SELECT * FROM {table_name} LIMIT 10")
            rows = cursor.fetchall()
            print("Примеры (до 10):")
            for row in rows:
                print(f"  {row}")
        print()

    conn.close()


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "bots/ботик/users.db"
    inspect(path)
