"""
@fileoverview Удаление bot_commissions из project.json и PostgreSQL.
"""
import json
import os
import re
from pathlib import Path

from dotenv import load_dotenv

PROJECT = Path("bots/новый_бот_1_242_163/project.json")
load_dotenv(PROJECT.parent / ".env")

PROJECT_ID = int(os.environ.get("PROJECT_ID", "242"))
DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/telegram_bot_builder"
)

RATE_CALCS = {
    "calc2": "capitalist",
    "calc3": "crypto24",
    "calc4": "shaxta",
    "calc5": "sanchez",
    "calc_imp": "imperia",
    "calc_viron": "viron",
    "calc_cf": "cf",
    "calc_vortex": "vortex",
    "calc_crazy": "crazy",
    "calc_inf": "inf",
    "calc_lucky": "lucky",
    "calc_love": "love",
    "calc_casper": "casper",
}

REMOVE_CALC_IDS = {
    "calc_bitmixer_btc",
    "calc_litebit_btc",
    "calc_monopoly_btc",
}


def rate_expr(prefix: str) -> str:
    """BTC из курса без fee."""
    return (
        f"round({{user_amount}} / float({{{prefix}_rate}}), 8) "
        f"if float({{{prefix}_rate}}) > 0 else 0"
    )


def patch_project() -> None:
    """Убирает comm-ноды и fee из calc."""
    with PROJECT.open(encoding="utf-8") as f:
        data = json.load(f)

    sheet = next(s for s in data["sheets"] if s["id"] == "sheet-bots")
    sheet["nodes"] = [
        n for n in sheet["nodes"]
        if n["id"] != "sched-init-commissions" and not n["id"].startswith("tbl-init-comm-")
    ]

    calc = next(n for n in sheet["nodes"] if n["id"] == "bot-setv-calc")
    new_assignments = []
    for a in calc["data"]["assignments"]:
        aid = a.get("id", "")
        if aid.startswith("fee_"):
            continue
        if aid in REMOVE_CALC_IDS:
            continue
        if aid in RATE_CALCS:
            a = {**a, "value": rate_expr(RATE_CALCS[aid])}
        new_assignments.append(a)

    calc["data"]["assignments"] = new_assignments

    with PROJECT.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    removed_nodes = 18
    print(f"OK project.json: удалены comm-ноды, fee lookups, формулы без fee")
    print(f"  calc assignments: {len(new_assignments)}")


def delete_db_table() -> None:
    """Удаляет bot_commissions из PostgreSQL."""
    try:
        import asyncio
        import asyncpg
    except ImportError:
        print("WARN: asyncpg не установлен, БД вручную:")
        print(f"  DELETE FROM bot_tables WHERE project_id={PROJECT_ID} AND name='bot_commissions';")
        return

    async def run() -> None:
        conn = await asyncpg.connect(DATABASE_URL)
        try:
            row = await conn.fetchrow(
                "SELECT id FROM bot_tables WHERE project_id = $1 AND name = $2",
                PROJECT_ID,
                "bot_commissions",
            )
            if not row:
                print(f"OK БД: bot_commissions для project_id={PROJECT_ID} не найдена")
                return
            table_id = row["id"]
            del_rows = await conn.execute(
                "DELETE FROM bot_table_rows WHERE table_id = $1", table_id
            )
            del_cols = await conn.execute(
                "DELETE FROM bot_table_columns WHERE table_id = $1", table_id
            )
            del_tbl = await conn.execute(
                "DELETE FROM bot_tables WHERE id = $1", table_id
            )
            print(f"OK БД: удалена bot_commissions (id={table_id})")
            print(f"  rows: {del_rows}, cols: {del_cols}, table: {del_tbl}")
        finally:
            await conn.close()

    asyncio.run(run())


def main() -> None:
    """Точка входа."""
    patch_project()
    delete_db_table()


if __name__ == "__main__":
    main()
