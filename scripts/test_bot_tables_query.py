"""Тест: проверяем как asyncpg возвращает JSONB из bot_table_rows."""
import asyncio
import asyncpg


async def main():
    conn = await asyncpg.connect(
        "postgresql://postgres:postgres@localhost:5432/telegram_bot_builder"
    )
    rows = await conn.fetch("""
        SELECT bt.name AS table_name, btc.name AS col_name, btc.id AS col_id, btr.data
        FROM bot_tables bt
        JOIN bot_table_columns btc ON btc.table_id = bt.id
        JOIN bot_table_rows btr ON btr.table_id = bt.id
        WHERE bt.project_id = $1 AND btr.row_index = (
            SELECT MIN(row_index) FROM bot_table_rows WHERE table_id = bt.id
        )
        ORDER BY bt.id, btc.position
    """, 240)

    print(f"Rows count: {len(rows)}")
    for r in rows[:4]:
        tname = r["table_name"]
        cname = r["col_name"]
        cid = str(r["col_id"])
        data = r["data"]
        print(f"  type(data): {type(data)}")
        print(f"  data: {data}")
        if isinstance(data, dict):
            val = data.get(cid, "")
            print(f"  table.{tname}.{cname} = {repr(val)}")
        elif isinstance(data, str):
            import json
            parsed = json.loads(data)
            val = parsed.get(cid, "")
            print(f"  table.{tname}.{cname} = {repr(val)} (parsed from str)")
        print()

    await conn.close()


asyncio.run(main())
