"""
@fileoverview Вставка текстов в таблицу texts с правильной кодировкой UTF-8.

Запуск из корня проекта:
    python scripts/fix_texts_encoding.py
"""

import asyncio
import asyncpg


async def main():
    """Вставляет тексты в таблицу texts (id=6) через asyncpg с UTF-8."""
    conn = await asyncpg.connect(
        host="localhost",
        port=5432,
        user="postgres",
        password="postgres",
        database="telegram_bot_builder",
    )

    data = {
        "65": "Привет, {user_name}! Выбери пару для обмена.",
        "66": "Ошибка загрузки курсов. Попробуйте позже.",
        "67": "Бот мониторинга обменников",
    }

    import json
    json_data = json.dumps(data, ensure_ascii=False)

    await conn.execute(
        "INSERT INTO bot_table_rows (table_id, row_index, data) VALUES ($1, $2, $3::jsonb)",
        6, 1, json_data,
    )

    # Проверка
    row = await conn.fetchrow("SELECT data FROM bot_table_rows WHERE table_id = 6")
    print(f"✅ Вставлено: {row['data']}")

    await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
