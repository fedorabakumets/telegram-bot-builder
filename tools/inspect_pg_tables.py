"""
@fileoverview Скрипт для просмотра таблиц данных проекта (tables)
@module tools/inspect_pg_tables
"""

import psycopg2
import json
import sys


def inspect_project_tables(dsn: str, project_id: int) -> None:
    """
    Ищет и выводит данные таблиц (table.*) проекта
    @param dsn - строка подключения
    @param project_id - ID проекта
    """
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()

    # Ищем таблицу с данными проекта
    cur.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%table%' OR table_name LIKE '%data%' OR table_name LIKE '%variable%'
        ORDER BY table_name
    """)
    matching = cur.fetchall()
    print(f"Таблицы с 'table/data/variable' в имени: {[t[0] for t in matching]}\n")

    # Смотрим bot_projects — там может быть JSON с tables
    cur.execute('SELECT * FROM bot_projects WHERE id = %s', (project_id,))
    row = cur.fetchone()
    if row:
        col_names = [desc[0] for desc in cur.description]
        print(f"=== bot_projects (id={project_id}) ===")
        for i, col in enumerate(col_names):
            val = row[i]
            if isinstance(val, (dict, list)):
                print(f"  {col}: {json.dumps(val, ensure_ascii=False, indent=2)[:2000]}")
            elif isinstance(val, str) and len(val) > 200:
                print(f"  {col}: [{len(val)} chars] {val[:200]}...")
            else:
                print(f"  {col}: {val}")
    else:
        print(f"Проект с id={project_id} не найден")

    # Ищем таблицы данных в отдельной таблице
    cur.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
    """)
    all_tables = [t[0] for t in cur.fetchall()]
    
    # Проверяем наличие таблиц project_tables, bot_tables, tables и т.д.
    for candidate in ['project_tables', 'bot_tables', 'tables', 'project_data', 'bot_data', 'bot_variables']:
        if candidate in all_tables:
            print(f"\n=== {candidate} (project_id={project_id}) ===")
            cur.execute(f'SELECT * FROM "{candidate}" WHERE project_id = %s LIMIT 20', (project_id,))
            rows = cur.fetchall()
            col_names = [desc[0] for desc in cur.description]
            print(f"  Колонки: {col_names}")
            print(f"  Записей: {len(rows)}")
            for row in rows:
                print(f"    {row}")

    conn.close()


if __name__ == "__main__":
    dsn = "postgresql://postgres:postgres@localhost:5432/telegram_bot_builder"
    project_id = int(sys.argv[1]) if len(sys.argv) > 1 else 240
    inspect_project_tables(dsn, project_id)
