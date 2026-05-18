import psycopg2
import json

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/telegram_bot_builder")
cur = conn.cursor()

# Переменные пользователей для project_id=245 (Новый бот 2)
cur.execute("""
    SELECT user_id, username, first_name, user_data
    FROM bot_users 
    WHERE project_id = 245
      AND user_data IS NOT NULL 
      AND user_data != '{}'
    ORDER BY last_interaction DESC
    LIMIT 50
""")

rows = cur.fetchall()
print(f"=== Переменные пользователей (project_id=245) ===")
print(f"Найдено записей с user_data: {len(rows)}\n")

# Собираем все ключи
all_keys = set()
for r in rows:
    if r[3] and isinstance(r[3], dict):
        for k in r[3].keys():
            if not k.startswith('_') and not k.startswith('waiting_') and not k.startswith('input_'):
                all_keys.add(k)

print(f"Колонки переменных: {sorted(all_keys)}\n")

for r in rows:
    ud = r[3] if r[3] else {}
    print(f"user_id={r[0]}, username={r[1]}, first_name={r[2]}")
    print(f"  user_data: {json.dumps(ud, ensure_ascii=False, indent=4)[:500]}")
    print()

# Также покажем общее кол-во пользователей
cur.execute("SELECT COUNT(*) FROM bot_users WHERE project_id=245")
total = cur.fetchone()[0]
print(f"\nВсего пользователей в проекте 245: {total}")

conn.close()
