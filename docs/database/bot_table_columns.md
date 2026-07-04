# bot_table_columns

## bot_table_columns

Таблица bot_table_columns — колонки пользовательской таблицы

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | - | - | Уникальный идентификатор колонки |
| table_id | integer | - | NO | - | [bot_tables.id](./bot_tables.md) | Идентификатор таблицы |
| name | varchar(255) | - | NO | - | - | Название колонки |
| position | integer | `0` | NO | - | - | Позиция колонки (для сортировки) |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| fk_table_id_bot_tables | FOREIGN KEY | (table_id) → bot_tables(id) |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| [bot_tables.id](./bot_tables.md) | **[bot_table_columns.table_id](./bot_table_columns.md)** | Many to One |
