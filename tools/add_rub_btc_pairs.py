"""
@fileoverview Добавляет направления с разных рублёвых банков на BTC.
Добавляет в таблицы pairs и pair_map.
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


# Новые пары: банк → BTC
# Формат: (from_name, from_id, emoji_from)
NEW_BANKS = [
    ("СБП", "166", "📲"),
    ("ЮMoney", "48", "🟡"),
    ("Альфа-Банк", "15", "🔴"),
    ("Т-Банк", "16", "🟡"),
    ("Райффайзен", "88", "💛"),
    ("Газпромбанк", "33", "🔵"),
]

# BTC параметры
TO_NAME = "Bitcoin"
TO_ID = "5"
EMOJI_TO = "₿"
DECIMALS = "8"

# Маппинг epichange/exbitbot ID для банков → BTC
# Из анализа API epichange.online и exbitbot.net
PAIR_MAP_DATA = {
    "166": {"epi_from": "605", "epi_to": "579", "exb_from": "593", "exb_to": "578", "cb_from": "SBPRUB", "cb_to": "BTC"},
    "48":  {"epi_from": "", "epi_to": "", "exb_from": "", "exb_to": "", "cb_from": "YAMRUB", "cb_to": "BTC"},
    "15":  {"epi_from": "583", "epi_to": "579", "exb_from": "615", "exb_to": "578", "cb_from": "ACRUB", "cb_to": "BTC"},
    "16":  {"epi_from": "585", "epi_to": "579", "exb_from": "614", "exb_to": "578", "cb_from": "TBRUB", "cb_to": "BTC"},
    "88":  {"epi_from": "587", "epi_to": "579", "exb_from": "616", "exb_to": "578", "cb_from": "RFBRUB", "cb_to": "BTC"},
    "33":  {"epi_from": "586", "epi_to": "579", "exb_from": "628", "exb_to": "578", "cb_from": "GPBRUB", "cb_to": "BTC"},
}


def main():
    """
    Добавляет новые пары банк→BTC в таблицы pairs и pair_map
    """
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    project_id = 242

    # === PAIRS ===
    cur.execute("SELECT id FROM bot_tables WHERE project_id = %s AND name = 'pairs'", (project_id,))
    pairs_table_id = cur.fetchone()[0]

    cur.execute("SELECT id, name FROM bot_table_columns WHERE table_id = %s ORDER BY position", (pairs_table_id,))
    pairs_cols = cur.fetchall()
    pairs_col_map = {c[1]: str(c[0]) for c in pairs_cols}
    print(f"📊 pairs колонки: {pairs_col_map}")

    # Текущий max row_index
    cur.execute("SELECT COALESCE(MAX(row_index), -1) FROM bot_table_rows WHERE table_id = %s", (pairs_table_id,))
    max_idx = cur.fetchone()[0]

    print(f"\n  Добавляю пары в pairs (начиная с row_index={max_idx + 1}):")
    for i, (from_name, from_id, emoji_from) in enumerate(NEW_BANKS):
        row_data = {
            pairs_col_map['from_name']: from_name,
            pairs_col_map['from_id']: from_id,
            pairs_col_map['to_name']: TO_NAME,
            pairs_col_map['to_id']: TO_ID,
            pairs_col_map['emoji_from']: emoji_from,
            pairs_col_map['emoji_to']: EMOJI_TO,
            pairs_col_map['decimals']: DECIMALS,
        }
        cur.execute("""
            INSERT INTO bot_table_rows (table_id, row_index, data)
            VALUES (%s, %s, %s)
        """, (pairs_table_id, max_idx + 1 + i, json.dumps(row_data)))
        print(f"    ✅ [{max_idx + 1 + i}] {from_name} → {TO_NAME}")

    # === PAIR_MAP ===
    cur.execute("SELECT id FROM bot_tables WHERE project_id = %s AND name = 'pair_map'", (project_id,))
    pm_table_id = cur.fetchone()[0]

    cur.execute("SELECT id, name FROM bot_table_columns WHERE table_id = %s ORDER BY position", (pm_table_id,))
    pm_cols = cur.fetchall()
    pm_col_map = {c[1]: str(c[0]) for c in pm_cols}
    print(f"\n📊 pair_map колонки: {pm_col_map}")

    cur.execute("SELECT COALESCE(MAX(row_index), -1) FROM bot_table_rows WHERE table_id = %s", (pm_table_id,))
    max_idx_pm = cur.fetchone()[0]

    print(f"\n  Добавляю маппинги в pair_map (начиная с row_index={max_idx_pm + 1}):")
    for i, (from_name, from_id, _) in enumerate(NEW_BANKS):
        mapping = PAIR_MAP_DATA.get(from_id, {})
        row_data = {
            pm_col_map['our_from_id']: from_id,
            pm_col_map['our_to_id']: TO_ID,
            pm_col_map['epi_from']: mapping.get('epi_from', ''),
            pm_col_map['epi_to']: mapping.get('epi_to', ''),
            pm_col_map['exb_from']: mapping.get('exb_from', ''),
            pm_col_map['exb_to']: mapping.get('exb_to', ''),
            pm_col_map['cb_from']: mapping.get('cb_from', ''),
            pm_col_map['cb_to']: mapping.get('cb_to', ''),
        }
        cur.execute("""
            INSERT INTO bot_table_rows (table_id, row_index, data)
            VALUES (%s, %s, %s)
        """, (pm_table_id, max_idx_pm + 1 + i, json.dumps(row_data)))
        print(f"    ✅ [{max_idx_pm + 1 + i}] from={from_id} to={TO_ID} ({from_name})")

    conn.commit()
    conn.close()

    print(f"\n{'='*50}")
    print(f"  ✅ Добавлено {len(NEW_BANKS)} новых пар!")
    print(f"  Итого в боте: Сбербанк, Тинькофф + {len(NEW_BANKS)} банков → BTC")
    print(f"{'='*50}")


if __name__ == '__main__':
    main()
