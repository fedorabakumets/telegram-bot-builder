"""
@fileoverview Скрипт для просмотра данных таблиц бота (bot_tables + bot_table_columns + bot_table_rows)
@module tools/inspect_pg_table_data
"""

import psycopg2
import json
import sys


def inspect_table_data(dsn: str, project_id: int) -> None:
    """
    Выводит все таблицы проекта с колонками и строками
    @param dsn - строка подключения
    @param project_id - ID проекта
    """
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()

    # Получаем таблицы проекта
    cur.execute('SELECT id, name, created_at FROM bot_tables WHERE project_id = %s ORDER BY id', (project_id,))
    tables = cur.fetchall()
    print(f"=== Таблицы проекта {project_id} ({len(tables)} шт.) ===\n")

    for table_id, table_name, created_at in tables:
        print(f"--- table.{table_name} (id={table_id}) ---")

        # Колонки
        cur.execute("""
            SELECT * FROM bot_table_columns 
            WHERE table_id = %s 
            ORDER BY id
        """, (table_id,))
        columns = cur.fetchall()
        col_names_meta = [desc[0] for desc in cur.description]
        print(f"  Колонки ({len(columns)}):")
        for col in columns:
            col_dict = dict(zip(col_names_meta, col))
            print(f"    {col_dict}")

        # Строки
        cur.execute("""
            SELECT * FROM bot_table_rows 
            WHERE table_id = %s 
            ORDER BY id
        """, (table_id,))
        rows = cur.fetchall()
        row_col_names = [desc[0] for desc in cur.description]
        print(f"  Строки ({len(rows)}):")
        for row in rows:
            row_dict = dict(zip(row_col_names, row))
            # Красиво выводим data если это JSON
            if 'data' in row_dict and isinstance(row_dict['data'], (dict, list)):
                data_str = json.dumps(row_dict['data'], ensure_ascii=False)
                print(f"    id={row_dict.get('id')}: {data_str}")
            else:
                print(f"    {row_dict}")
        print()

    # Также проверим bot_env_variables
    cur.execute('SELECT * FROM bot_env_variables WHERE project_id = %s', (project_id,))
    env_vars = cur.fetchall()
    if env_vars:
        env_col_names = [desc[0] for desc in cur.description]
        print(f"=== Переменные окружения проекта {project_id} ===")
        for row in env_vars:
            row_dict = dict(zip(env_col_names, row))
            print(f"  {row_dict}")

    conn.close()


if __name__ == "__main__":
    dsn = "postgresql://postgres:postgres@localhost:5432/telegram_bot_builder"
    project_id = int(sys.argv[1]) if len(sys.argv) > 1 else 240
    inspect_table_data(dsn, project_id)
