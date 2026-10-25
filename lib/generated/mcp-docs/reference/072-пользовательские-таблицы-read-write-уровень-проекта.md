# Пользовательские таблицы (read-write, уровень проекта)

Таблицы создаваемые пользователем в конструкторе. Используются нодами `bot_table`.

Хранение: `bot_tables` → `bot_table_columns` → `bot_table_rows` (data: JSONB).

GIN-индекс на `bot_table_rows.data` для быстрого поиска по ключам.
