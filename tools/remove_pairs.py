"""
@fileoverview Удаляет пары TON, USDT, Ethereum из таблицы pairs.
Оставляет только пары с Bitcoin.
"""

import os
import sys
import json

# Загружаем .env
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
if os.path.exists(env_path):
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, _, val = line.partition('=')
                os.environ.setdefault(key.strip(), val.strip())

DATABASE_URL = os.environ.get('DATABASE_URL', '')

try:
    import psycopg2
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'psycopg2-binary', '-q'])
    import psycopg2


def main():
    """
    Удаляет из таблицы pairs все строки кроме Bitcoin
    """
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    project_id = 242
    table_name = "pairs"

    # Находим table_id
    cur.execute("""
        SELECT id FROM bot_tables 
        WHERE project_id = %s AND name = %s
    """, (project_id, table_name))
    table_id = cur.fetchone()[0]

    # Получаем колонку to_name
    cur.execute("""
        SELECT id, name FROM bot_table_columns 
        WHERE table_id = %s ORDER BY position
    """, (table_id,))
    columns = cur.fetchall()
    to_name_col_id = str([c[0] for c in columns if c[1] == 'to_name'][0])

    # Получаем все строки
    cur.execute("""
        SELECT id, row_index, data FROM bot_table_rows 
        WHERE table_id = %s ORDER BY row_index
    """, (table_id,))
    rows = cur.fetchall()

    print(f"📊 Таблица pairs (id={table_id}), строк: {len(rows)}")
    print(f"\nТекущие пары:")

    to_delete = []
    to_keep = []
    for row_id, row_idx, raw_data in rows:
        data = json.loads(raw_data) if isinstance(raw_data, str) else raw_data
        to_name = data.get(to_name_col_id, "???")
        # Определяем from_name
        from_name_col_id = str([c[0] for c in columns if c[1] == 'from_name'][0])
        from_name = data.get(from_name_col_id, "???")

        if to_name != "Bitcoin":
            to_delete.append((row_id, row_idx, from_name, to_name))
            print(f"  ❌ [{row_idx}] {from_name} → {to_name} (удаляем)")
        else:
            to_keep.append((row_id, row_idx, from_name, to_name))
            print(f"  ✅ [{row_idx}] {from_name} → {to_name} (оставляем)")

    if not to_delete:
        print("\n⚠️ Нечего удалять")
        conn.close()
        return

    # Удаляем строки
    delete_ids = [r[0] for r in to_delete]
    cur.execute("""
        DELETE FROM bot_table_rows WHERE id = ANY(%s)
    """, (delete_ids,))
    print(f"\n🗑️ Удалено {len(delete_ids)} строк")

    # Перенумеровываем оставшиеся row_index
    cur.execute("""
        SELECT id, row_index FROM bot_table_rows 
        WHERE table_id = %s ORDER BY row_index
    """, (table_id,))
    remaining = cur.fetchall()
    for new_idx, (row_id, _) in enumerate(remaining):
        cur.execute("""
            UPDATE bot_table_rows SET row_index = %s WHERE id = %s
        """, (new_idx, row_id))

    print(f"✅ Осталось {len(remaining)} строк, индексы обновлены")

    conn.commit()
    conn.close()

    # Также удалим соответствующие строки из pair_map
    print(f"\n{'─'*40}")
    print(f"Теперь чистим pair_map...")
    remove_pair_map_entries()


def remove_pair_map_entries():
    """
    Удаляет из pair_map строки для пар, которых больше нет в pairs
    (оставляем только our_to_id = 5, т.е. Bitcoin)
    """
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    project_id = 242

    cur.execute("""
        SELECT id FROM bot_tables 
        WHERE project_id = %s AND name = 'pair_map'
    """, (project_id,))
    table_id = cur.fetchone()[0]

    cur.execute("""
        SELECT id, name FROM bot_table_columns 
        WHERE table_id = %s ORDER BY position
    """, (table_id,))
    columns = cur.fetchall()
    to_id_col = str([c[0] for c in columns if c[1] == 'our_to_id'][0])
    from_id_col = str([c[0] for c in columns if c[1] == 'our_from_id'][0])

    cur.execute("""
        SELECT id, row_index, data FROM bot_table_rows 
        WHERE table_id = %s ORDER BY row_index
    """, (table_id,))
    rows = cur.fetchall()

    to_delete = []
    for row_id, row_idx, raw_data in rows:
        data = json.loads(raw_data) if isinstance(raw_data, str) else raw_data
        our_to_id = data.get(to_id_col, "")
        our_from_id = data.get(from_id_col, "")
        if our_to_id != "5":  # 5 = Bitcoin
            to_delete.append(row_id)
            print(f"  ❌ pair_map [{row_idx}] from={our_from_id} to={our_to_id} (удаляем)")
        else:
            print(f"  ✅ pair_map [{row_idx}] from={our_from_id} to={our_to_id} (оставляем)")

    if to_delete:
        cur.execute("DELETE FROM bot_table_rows WHERE id = ANY(%s)", (to_delete,))
        # Перенумеровываем
        cur.execute("""
            SELECT id FROM bot_table_rows 
            WHERE table_id = %s ORDER BY row_index
        """, (table_id,))
        remaining = cur.fetchall()
        for new_idx, (row_id,) in enumerate(remaining):
            cur.execute("UPDATE bot_table_rows SET row_index = %s WHERE id = %s", (new_idx, row_id))
        print(f"\n🗑️ Удалено {len(to_delete)} строк из pair_map")
        print(f"✅ Осталось {len(remaining)} строк")

    conn.commit()
    conn.close()
    print(f"\n✅ Всё готово!")


if __name__ == '__main__':
    main()
