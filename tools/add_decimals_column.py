"""
@fileoverview Добавляет колонку 'decimals' в таблицу pairs.
Устанавливает значения: BTC=8, ETH=6, USDT=2, TON=4
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


# Маппинг валюты → количество знаков после запятой
DECIMALS_MAP = {
    "Bitcoin": 8,
    "Ethereum": 6,
    "USDT TRC20": 2,
    "TON": 4,
}


def main():
    """
    Добавляет колонку decimals в таблицу pairs и заполняет значения
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
    row = cur.fetchone()
    if not row:
        print(f"❌ Таблица '{table_name}' не найдена для project_id={project_id}")
        conn.close()
        return

    table_id = row[0]
    print(f"📊 Таблица '{table_name}' id={table_id}")

    # Проверяем, нет ли уже колонки decimals
    cur.execute("""
        SELECT id, name, position FROM bot_table_columns 
        WHERE table_id = %s ORDER BY position
    """, (table_id,))
    columns = cur.fetchall()
    col_names = [c[1] for c in columns]
    print(f"   Текущие колонки: {col_names}")

    if 'decimals' in col_names:
        print("   ⚠️ Колонка 'decimals' уже существует")
        decimals_col_id = str([c[0] for c in columns if c[1] == 'decimals'][0])
    else:
        # Добавляем колонку
        max_pos = max(c[2] for c in columns)
        cur.execute("""
            INSERT INTO bot_table_columns (table_id, name, position)
            VALUES (%s, 'decimals', %s)
            RETURNING id
        """, (table_id, max_pos + 1))
        decimals_col_id = str(cur.fetchone()[0])
        print(f"   ✅ Добавлена колонка 'decimals' (id={decimals_col_id}, position={max_pos + 1})")

    # Получаем колонку to_name для определения валюты
    to_name_col_id = str([c[0] for c in columns if c[1] == 'to_name'][0])

    # Обновляем строки — добавляем decimals
    cur.execute("""
        SELECT id, row_index, data FROM bot_table_rows 
        WHERE table_id = %s ORDER BY row_index
    """, (table_id,))
    rows = cur.fetchall()

    for row_id, row_idx, raw_data in rows:
        if isinstance(raw_data, str):
            data = json.loads(raw_data)
        elif isinstance(raw_data, dict):
            data = raw_data
        else:
            data = {}

        # Определяем валюту по to_name
        to_name_val = data.get(to_name_col_id, "")
        decimals = DECIMALS_MAP.get(to_name_val, 2)

        # Добавляем decimals в data
        data[decimals_col_id] = str(decimals)

        cur.execute("""
            UPDATE bot_table_rows SET data = %s WHERE id = %s
        """, (json.dumps(data), row_id))
        print(f"   [{row_idx}] {to_name_val} → decimals={decimals}")

    conn.commit()
    conn.close()
    print(f"\n✅ Готово! Колонка 'decimals' добавлена и заполнена.")


if __name__ == '__main__':
    main()
