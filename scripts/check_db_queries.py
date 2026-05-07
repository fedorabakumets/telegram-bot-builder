"""
@fileoverview Проверка SQL-запросов из реферальной воронки через прямое подключение к БД
@module scripts/check_db_queries
"""

import os
import sys
import asyncio
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL не найден в .env")
    sys.exit(1)

print(f"🔌 Подключение к: {DATABASE_URL[:40]}...")


async def run_checks():
    """
    Выполняет все проверочные SQL-запросы из реферальной воронки.
    @returns None
    """
    try:
        import asyncpg
    except ImportError:
        print("❌ asyncpg не установлен. Попробуем через psycopg2...")
        run_sync_checks()
        return

    try:
        conn = await asyncpg.connect(DATABASE_URL)
        print("✅ Подключение успешно\n")
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")
        print("\nПробуем синхронный вариант...")
        run_sync_checks()
        return

    queries = [
        (
            "1. Таблицы в БД",
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
            """,
            None
        ),
        (
            "2. Структура bot_users",
            """
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'bot_users'
            ORDER BY ordinal_position
            """,
            None
        ),
        (
            "3. Количество пользователей (sql-total из воронки)",
            "SELECT COUNT(*) as total FROM bot_users WHERE project_id = 0",
            None
        ),
        (
            "4. Статистика по рефералам (sql-stats из воронки)",
            """
            SELECT COALESCE(referrer_id, '(прямой вход)') as src, COUNT(*) as cnt
            FROM bot_users
            WHERE project_id = 0
            GROUP BY referrer_id ORDER BY cnt DESC LIMIT 20
            """,
            None
        ),
        (
            "5. Последние 5 пользователей",
            """
            SELECT user_id, username, first_name, referrer_id, registered_at
            FROM bot_users
            ORDER BY registered_at DESC
            LIMIT 5
            """,
            None
        ),
        (
            "6. Проверка таблицы referral_stats (из sql-increment-subscribed)",
            """
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'referral_stats'
            ) as exists
            """,
            None
        ),
    ]

    for title, query, _ in queries:
        print(f"{'─' * 55}")
        print(f"📋 {title}")
        try:
            rows = await conn.fetch(query.strip())
            if not rows:
                print("  (нет данных)")
            else:
                # Заголовки колонок
                if rows:
                    cols = list(rows[0].keys())
                    print("  " + " | ".join(f"{c:<20}" for c in cols))
                    print("  " + "-" * (23 * len(cols)))
                for row in rows:
                    vals = [str(row[k])[:20] for k in row.keys()]
                    print("  " + " | ".join(f"{v:<20}" for v in vals))
        except Exception as e:
            print(f"  ❌ Ошибка: {e}")
        print()

    await conn.close()
    print("✅ Все запросы выполнены")


def run_sync_checks():
    """
    Синхронный вариант через psycopg2.
    @returns None
    """
    try:
        import psycopg2
        import psycopg2.extras
    except ImportError:
        print("❌ Ни asyncpg, ни psycopg2 не установлены")
        print("Установите: pip install asyncpg  или  pip install psycopg2-binary")
        return

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        print("✅ Подключение через psycopg2 успешно\n")
    except Exception as e:
        print(f"❌ Ошибка подключения psycopg2: {e}")
        return

    queries = [
        ("1. Таблицы в БД",
         "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"),
        ("2. Количество пользователей",
         "SELECT COUNT(*) as total FROM bot_users WHERE project_id = 0"),
        ("3. Статистика по рефералам",
         "SELECT COALESCE(referrer_id, '(прямой вход)') as src, COUNT(*) as cnt FROM bot_users WHERE project_id = 0 GROUP BY referrer_id ORDER BY cnt DESC LIMIT 20"),
        ("4. Последние 5 пользователей",
         "SELECT user_id, username, first_name, referrer_id, registered_at FROM bot_users ORDER BY registered_at DESC LIMIT 5"),
        ("5. Таблица referral_stats существует?",
         "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'referral_stats') as exists"),
    ]

    for title, query in queries:
        print(f"{'─' * 55}")
        print(f"📋 {title}")
        try:
            cur.execute(query)
            rows = cur.fetchall()
            if not rows:
                print("  (нет данных)")
            else:
                cols = list(rows[0].keys())
                print("  " + " | ".join(f"{c:<20}" for c in cols))
                print("  " + "-" * (23 * len(cols)))
                for row in rows:
                    vals = [str(row[k])[:20] for k in row.keys()]
                    print("  " + " | ".join(f"{v:<20}" for v in vals))
        except Exception as e:
            print(f"  ❌ Ошибка: {e}")
        print()

    cur.close()
    conn.close()
    print("✅ Все запросы выполнены")


if __name__ == "__main__":
    asyncio.run(run_checks())
