"""
@fileoverview Скрипт для просмотра таблиц exchangers и pair_map из БД.
Подключается к PostgreSQL через DATABASE_URL из .env
"""

import os
import sys

# Загружаем .env вручную
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
if os.path.exists(env_path):
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, _, val = line.partition('=')
                os.environ.setdefault(key.strip(), val.strip())

DATABASE_URL = os.environ.get('DATABASE_URL', '')
if not DATABASE_URL:
    print("❌ DATABASE_URL не найден в .env")
    sys.exit(1)

try:
    import psycopg2
except ImportError:
    print("Устанавливаю psycopg2...")
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'psycopg2-binary', '-q'])
    import psycopg2


def main():
    """
    Подключается к БД и выводит содержимое таблиц exchangers и pair_map
    """
    print(f"🔗 Подключаюсь к: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else DATABASE_URL}")
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Сначала смотрим какие таблицы есть в БД
    cur.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
    """)
    all_tables = [r[0] for r in cur.fetchall()]
    print(f"\n📋 Таблицы в БД ({len(all_tables)}):")
    for t in all_tables:
        print(f"   {t}")

    # Ищем таблицу проектов
    project_table = None
    for t in all_tables:
        if 'project' in t and 'bot_table' not in t:
            project_table = t
            break

    if not project_table:
        print("❌ Таблица проектов не найдена")
        # Попробуем напрямую bot_tables
        cur.execute("SELECT DISTINCT project_id FROM bot_tables ORDER BY project_id")
        pids = cur.fetchall()
        print(f"\n  project_id в bot_tables: {[p[0] for p in pids]}")
        project_id = pids[0][0] if pids else None
    else:
        print(f"\n🎯 Таблица проектов: {project_table}")
        cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{project_table}' ORDER BY ordinal_position")
        cols = [r[0] for r in cur.fetchall()]
        print(f"   Колонки: {cols}")

        # Ищем проект
        name_col = 'name' if 'name' in cols else 'title' if 'title' in cols else cols[1] if len(cols) > 1 else cols[0]
        id_col = 'id' if 'id' in cols else cols[0]
        cur.execute(f"SELECT {id_col}, {name_col} FROM {project_table} ORDER BY {id_col} DESC LIMIT 10")
        projects = cur.fetchall()
        print(f"\n📁 Проекты (последние 10):")
        for p in projects:
            print(f"   id={p[0]}, name={p[1]}")
        project_id = projects[0][0] if projects else None

    if not project_id:
        print("❌ Проект не найден")
        conn.close()
        return

    print(f"\n🎯 Используем project_id = {project_id}")

    # Смотрим bot_tables для этого проекта
    cur.execute("""
        SELECT bt.id, bt.name 
        FROM bot_tables bt 
        WHERE bt.project_id = %s
        ORDER BY bt.id
    """, (project_id,))
    tables = cur.fetchall()
    print(f"\n{'='*60}")
    print(f"  ТАБЛИЦЫ БОТА (bot_tables)")
    print(f"{'='*60}")
    for t in tables:
        print(f"   table_id={t[0]}, name='{t[1]}'")

    # Для каждой таблицы показываем колонки и данные
    for table_id, table_name in tables:
        print(f"\n{'─'*60}")
        print(f"  📊 Таблица: {table_name} (id={table_id})")

        # Колонки
        cur.execute("""
            SELECT id, name, position 
            FROM bot_table_columns 
            WHERE table_id = %s 
            ORDER BY position
        """, (table_id,))
        columns = cur.fetchall()
        col_names = {str(c[0]): c[1] for c in columns}
        print(f"  Колонки: {[c[1] for c in columns]}")

        # Строки
        cur.execute("""
            SELECT row_index, data 
            FROM bot_table_rows 
            WHERE table_id = %s 
            ORDER BY row_index
        """, (table_id,))
        rows = cur.fetchall()
        print(f"  Строк: {len(rows)}")

        for row_idx, raw_data in rows:
            # data хранится как JSON: {col_id: value, ...}
            import json
            if isinstance(raw_data, str):
                data = json.loads(raw_data)
            elif isinstance(raw_data, dict):
                data = raw_data
            else:
                data = {}

            # Преобразуем col_id → col_name
            row_display = {}
            for col_id_str, val in data.items():
                col_name = col_names.get(col_id_str, col_id_str)
                row_display[col_name] = val

            print(f"    [{row_idx}] {json.dumps(row_display, ensure_ascii=False)}")

    conn.close()
    print(f"\n✅ Готово")


if __name__ == '__main__':
    main()
