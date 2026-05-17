"""
@fileoverview Создание таблиц exchangers, pairs и texts для нового бота (project 242)
@module tools/create_tables_for_bot

Копирует структуру таблиц из проекта 240 (обменники) в проект 242 (новый_бот_1)
"""

import psycopg2
import json
import sys


DSN = "postgresql://postgres:postgres@localhost:5432/telegram_bot_builder"
TARGET_PROJECT_ID = 242


def create_tables(dsn: str, project_id: int) -> None:
    """
    Создаёт таблицы texts, exchangers и pairs для проекта
    @param dsn - строка подключения
    @param project_id - ID целевого проекта
    """
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()

    # Проверяем, нет ли уже таблиц у этого проекта
    cur.execute('SELECT id, name FROM bot_tables WHERE project_id = %s', (project_id,))
    existing = cur.fetchall()
    if existing:
        print(f"⚠️ У проекта {project_id} уже есть таблицы: {[t[1] for t in existing]}")
        print("Пропускаем создание, чтобы не дублировать.")
        conn.close()
        return

    # === 1. Таблица texts ===
    cur.execute(
        'INSERT INTO bot_tables (project_id, name) VALUES (%s, %s) RETURNING id',
        (project_id, 'texts')
    )
    texts_table_id = cur.fetchone()[0]
    print(f"✅ Создана таблица texts (id={texts_table_id})")

    # Колонки для texts
    texts_columns = ['welcome_msg', 'error_msg', 'about_header']
    texts_col_ids = {}
    for i, col_name in enumerate(texts_columns):
        cur.execute(
            'INSERT INTO bot_table_columns (table_id, name, position) VALUES (%s, %s, %s) RETURNING id',
            (texts_table_id, col_name, i)
        )
        texts_col_ids[col_name] = cur.fetchone()[0]

    # Строка данных для texts
    texts_data = {
        str(texts_col_ids['welcome_msg']): "Привет, {user_name}! Здесь ты найдёшь лучшие курсы обмена.",
        str(texts_col_ids['error_msg']): "❌ Ошибка загрузки курсов. Попробуйте позже.",
        str(texts_col_ids['about_header']): "Бот сравнения курсов обменников"
    }
    cur.execute(
        'INSERT INTO bot_table_rows (table_id, row_index, data) VALUES (%s, %s, %s)',
        (texts_table_id, 0, json.dumps(texts_data, ensure_ascii=False))
    )
    print(f"  → Добавлена строка с текстами")

    # === 2. Таблица exchangers ===
    cur.execute(
        'INSERT INTO bot_tables (project_id, name) VALUES (%s, %s) RETURNING id',
        (project_id, 'exchangers')
    )
    exch_table_id = cur.fetchone()[0]
    print(f"✅ Создана таблица exchangers (id={exch_table_id})")

    # Колонки для exchangers
    exch_columns = ['name', 'url']
    exch_col_ids = {}
    for i, col_name in enumerate(exch_columns):
        cur.execute(
            'INSERT INTO bot_table_columns (table_id, name, position) VALUES (%s, %s, %s) RETURNING id',
            (exch_table_id, col_name, i)
        )
        exch_col_ids[col_name] = cur.fetchone()[0]

    # Строки данных для exchangers (те же 4 обменника)
    exchangers = [
        ("swop.is", "https://swop.is/valuta.json"),
        ("sova.is", "https://sova.is/valuta.json"),
        ("pocket-exchange.com", "https://pocket-exchange.com/valuta.json"),
        ("ferma.cc", "https://ferma.cc/valuta.json"),
    ]
    for idx, (name, url) in enumerate(exchangers):
        row_data = {
            str(exch_col_ids['name']): name,
            str(exch_col_ids['url']): url
        }
        cur.execute(
            'INSERT INTO bot_table_rows (table_id, row_index, data) VALUES (%s, %s, %s)',
            (exch_table_id, idx, json.dumps(row_data, ensure_ascii=False))
        )
    print(f"  → Добавлено {len(exchangers)} обменников")

    # === 3. Таблица pairs ===
    cur.execute(
        'INSERT INTO bot_tables (project_id, name) VALUES (%s, %s) RETURNING id',
        (project_id, 'pairs')
    )
    pairs_table_id = cur.fetchone()[0]
    print(f"✅ Создана таблица pairs (id={pairs_table_id})")

    # Колонки для pairs
    pairs_columns = ['from_name', 'from_id', 'to_name', 'to_id', 'emoji_from', 'emoji_to']
    pairs_col_ids = {}
    for i, col_name in enumerate(pairs_columns):
        cur.execute(
            'INSERT INTO bot_table_columns (table_id, name, position) VALUES (%s, %s, %s) RETURNING id',
            (pairs_table_id, col_name, i)
        )
        pairs_col_ids[col_name] = cur.fetchone()[0]

    # Строки данных для pairs (те же 8 пар)
    pairs = [
        ("Сбербанк", "2", "USDT TRC20", "55", "🏦", "₮"),
        ("Сбербанк", "2", "Bitcoin", "5", "🏦", "₿"),
        ("Сбербанк", "2", "Ethereum", "139", "🏦", "Ξ"),
        ("Сбербанк", "2", "TON", "107", "🏦", "💎"),
        ("Тинькофф", "18", "USDT TRC20", "55", "💳", "₮"),
        ("Тинькофф", "18", "Bitcoin", "5", "💳", "₿"),
        ("ЮMoney", "48", "USDT TRC20", "55", "🟡", "₮"),
        ("ЮMoney", "48", "TON", "107", "🟡", "💎"),
    ]
    for idx, (from_name, from_id, to_name, to_id, emoji_from, emoji_to) in enumerate(pairs):
        row_data = {
            str(pairs_col_ids['from_name']): from_name,
            str(pairs_col_ids['from_id']): from_id,
            str(pairs_col_ids['to_name']): to_name,
            str(pairs_col_ids['to_id']): to_id,
            str(pairs_col_ids['emoji_from']): emoji_from,
            str(pairs_col_ids['emoji_to']): emoji_to,
        }
        cur.execute(
            'INSERT INTO bot_table_rows (table_id, row_index, data) VALUES (%s, %s, %s)',
            (pairs_table_id, idx, json.dumps(row_data, ensure_ascii=False))
        )
    print(f"  → Добавлено {len(pairs)} валютных пар")

    conn.commit()
    conn.close()
    print(f"\n✅ Готово! Таблицы созданы для проекта {project_id}")


if __name__ == "__main__":
    project_id = int(sys.argv[1]) if len(sys.argv) > 1 else TARGET_PROJECT_ID
    create_tables(DSN, project_id)
