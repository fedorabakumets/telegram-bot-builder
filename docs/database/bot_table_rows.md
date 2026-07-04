# bot_table_rows

## bot_table_rows

Таблица bot_table_rows — строки пользовательской таблицы (данные в JSONB)

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | - | - | Уникальный идентификатор строки |
| table_id | integer | - | NO | - | [bot_tables.id](./bot_tables.md) | Идентификатор таблицы |
| row_index | integer | - | NO | - | - | Индекс строки (для сортировки) |
| data | jsonb | `{}` | NO | - | - | Данные строки в формате JSONB: { columnId: value } |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| fk_table_id_bot_tables | FOREIGN KEY | (table_id) → bot_tables(id) |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| [bot_tables.id](./bot_tables.md) | **[bot_table_rows.table_id](./bot_table_rows.md)** | Many to One |
