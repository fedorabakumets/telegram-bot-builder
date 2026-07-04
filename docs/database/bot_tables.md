# bot_tables

## bot_tables

Таблица bot_tables — пользовательские таблицы проекта

### Columns

| Name | Type | Default | Nullable | Children | Parents | Comment |
|------|------|---------|----------|----------|---------|---------|
| **id** | serial | - | NO | [bot_table_columns.table_id](./bot_table_columns.md), [bot_table_rows.table_id](./bot_table_rows.md) | - | Уникальный идентификатор таблицы |
| project_id | integer | - | NO | - | [bot_projects.id](./bot_projects.md) | Идентификатор проекта |
| name | varchar(255) | - | NO | - | - | Название таблицы |
| created_at | timestamp with time zone | `now()` | YES | - | - | Дата создания |

### Constraints

| Name | Type | Definition |
|------|------|------------|
| fk_project_id_bot_projects | FOREIGN KEY | (project_id) → bot_projects(id) |

### Relations

| Parent | Child | Type |
|--------|-------|------|
| **[bot_tables.id](./bot_tables.md)** | [bot_table_columns.table_id](./bot_table_columns.md) | Many to One |
| **[bot_tables.id](./bot_tables.md)** | [bot_table_rows.table_id](./bot_table_rows.md) | Many to One |
| [bot_projects.id](./bot_projects.md) | **[bot_tables.project_id](./bot_tables.md)** | Many to One |
